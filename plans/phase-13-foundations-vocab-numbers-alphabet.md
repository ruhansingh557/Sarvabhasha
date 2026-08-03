# Phase 13 — Foundations: Vocabulary, Numbers, Aksharmala

**Status:** 🚧 in progress — started 2026-08-03. The project owner explicitly re-sequenced ahead of `phase-12`'s remaining steps (i18n/app-store/tutor-verification/monetization), pausing those rather than finishing them first.

## Goal

Three new beginner-level learning modes, distinct from the situational-scene phrase categories: **Vocabulary** (single words — image, native text, transliteration, audio), **Numbers** (1–20 plus round numbers, same treatment), and **Aksharmala** (a script's full character set, glyph + pronunciation). Requested 2026-08-03, explicitly modeled on `learn-bharat`'s "Fundamentals" section but built to avoid its specific, documented failure modes (see below).

## Why these are a different content type, not three more categories

The existing `phrases`/`animations` model is built around a **situational scene**: a `speakerCharacter`, a `situation`, a 3-beat animated clip. Vocabulary/Numbers/Aksharmala have none of that — each item is a single standalone concept (a word, a number, a letter). Forcing them into the phrase/animation schema would mean fake `situation`/`speakerCharacter` values with no real content behind them. New tables, described below.

## Grounded in real precedent: what to copy from `learn-bharat`, what to avoid

Researched via a read-only pass over `/Users/rakeshsingh/work/wadhwani/learn-bharat` before writing this plan (per this project's "read reference repos for patterns, do not depend on them").

**What to copy:**
- Vocabulary as **category tabs + a responsive card grid** (image, word, transliteration, a "Listen" button) — a solid, provenly-legible pattern.
- Aksharmala as a **sequential flashcard** (one letter at a time, Prev/Next, a progress bar, a "jump to any letter" grid at the bottom) with an optional example word per letter.

**What to explicitly avoid — these are the real, documented failure modes found in the reference code:**
1. **Live TTS at tap time, not pre-generated audio.** `learn-bharat`'s `dictionary` table has an `audioUrl` field clearly designed for pre-generated audio — but the actual UI code (`visual-dictionary.tsx`, `aksharmala.tsx`) never reads it. It calls Bhashini live on every single tap, with a browser-only Web Speech API fallback. This is the exact anti-pattern root `CLAUDE.md` Rule 10 exists to forbid. **Sarvabhasha's version generates and stores every audio clip once, at authoring time — same as phrase audio, no exceptions.**
2. **Dead/fragile images.** Their seeded `imageUrl` values are broken `placeholder.com` links; their alphabet example-word images are hotlinked Unsplash URLs matched by crude keyword substring search. **Sarvabhasha generates real, brand-consistent images via the already-approved fal.ai pipeline** (see Content pipeline below) — no hotlinking, no placeholders.
3. **Permanently incomplete content with a "TODO: finish later" comment that was never followed up.** Hindi's alphabet has 15 of ~46 real Devanagari characters; most other languages get 3, with the code literally saying *"additional languages would follow the same pattern"* and never doing so. **Each script's Aksharmala content must be complete (the full, correct character set) before it ships for that script — not shipped partial with a plan to fill it in.** This is also a trust issue specific to this content type: unlike a phrase's phrasing, which has real stylistic latitude, "the alphabet" is maximally checkable — any literate speaker of that script knows immediately if a letter is missing or wrong, wrong order, etc. Treat Aksharmala accuracy with MORE rigor than phrase content, not less; verify against an authoritative source (standard textbook ordering, not an improvised list) for every script before it ships.
4. **A UI button that visually "plays" but produces no actual sound.** The unused, dead `alphabet-learning.tsx` component's `playAudio()` is a bare `setTimeout` with a comment `// In real app, would use Bhasini TTS` — this file is thankfully dead code, but it's the clearest artifact of what NOT to ship: a control that lies about what it does.
5. **No Numbers learning mode exists at all** in `learn-bharat` — "numbers" is just one thin category inside their dictionary (5 of 20 numbers filled in, no round numbers at all) plus a completely unrelated *assessment* tool (records the student's own speech, doesn't teach pronunciation). There's nothing to reuse here; build it the same way as Vocabulary, from scratch.

## The structural reuse win (same trick this project already uses twice)

`schema.ts`'s structural decision 1 — animation is keyed by `phraseId`, never a translation id, so 22 languages cost the same as 1 for video — has a direct analogue here, twice over:

- **Vocabulary images are language-independent.** A picture of an apple doesn't change per language. One `imageStorageId` per vocabulary item, shared across every language's translation — same win, same reasoning.
- **Aksharmala content is SCRIPT-independent across languages, not per-language.** `languages.ts`'s `script` field already models this: `devanagari` alone covers hi, mr, ne, sa, kok, doi, mai, and brx — 8 of the 22 languages share one script. Keying Aksharmala content by **script**, not by language, means building each script's character set ONCE serves every language using it, instead of duplicating the same ~46-character Devanagari set 8 times. 12 distinct scripts across the 22 languages (devanagari, bengali, tamil, telugu, kannada, gujarati, malayalam, gurmukhi, odia, arabic, meetei, ol-chiki) means 12 real content builds, not 22.

## Data model (new tables, additive to `schema.ts`)

```
vocabularyCategories        slug, iconKey, sortOrder, status
  by_slug, by_status_order

vocabularyItems             categoryId, itemKey, englishWord,
                             imageStorageId, sortOrder, status
  by_category_order, by_status
  (NO speakerCharacter, NO situation — not a scene)

vocabularyTranslations       vocabularyItemId, languageCode, text,
                              transliteration, status, reviewedBy, reviewedAt
  by_item_language, by_language_status

vocabularyAudio               vocabularyItemId, languageCode, storageId,
                               voiceGender, durationMs, source, status
  by_item_language

scriptCharacters              script, character, characterType (vowel|consonant|conjunct),
                               romanization, exampleWord, exampleTransliteration,
                               sortOrder, status
  by_script_order, by_status
  (keyed by SCRIPT, not languageCode — see reuse win above)

scriptCharacterAudio          scriptCharacterId, storageId, durationMs, source, status
  by_character
  (ONE audio per character per SCRIPT — not per language)
```

**Numbers is not a new table.** Treat it as `vocabularyCategories` row `slug: "numbers"`, reusing `vocabularyItems`/`vocabularyTranslations`/`vocabularyAudio` exactly. No structural reason to special-case it — a number is just a word with a numeral for an image.

Voice: vocabulary/numbers items aren't tied to a scene character, so pick a single consistent narrator voice per language (reuse the existing `CHARACTER_VOICES` gender convention, default female, per `packages/shared/src/categories.ts`'s own note that female voices are generally better-trained on Bhashini) rather than inventing a new voice-selection axis.

## Content scope (a concrete starting proposal, not a hard spec)

- **Numbers**: 1–20 individually, then round numbers 25, 30, 40, 50, 60, 70, 80, 90, 100, 200, 500, 1000 — 32 items total. Matches what the project owner asked for (1–20, 50, 100, 1000) plus the decades a learner would expect in between, same as comparable apps.
- **Vocabulary categories** (initial set, expandable): Family, Food & Drink, Animals, Colours, Body Parts, Household Items, Clothing, Nature, Time & Days, Transport, Common Objects — roughly 15–25 words per category, ~150–250 words total for v1. This needs real research the same way phrase content did ("well-researched, grounded in real sources," per this project's established standard for the phrase catalogue) — not invented word lists.
- **Aksharmala**: full, correct character set per script, sourced from an authoritative reference (standard textbook ordering — vowels then consonants, in the traditional pedagogical sequence) for each of the 12 scripts, starting with the scripts serving the 11 languages already confirmed live/ready in `phase-12`.

## Content pipeline (reuses existing infrastructure, cheaper than phrase content)

No animation, no keyframes, no video — this pipeline is a strict subset of the existing phrase pipeline, and meaningfully cheaper/faster per item:
1. Word/number/character list research (once, language-independent for vocabulary/numbers; once per script for Aksharmala).
2. Image generation: one static image per vocabulary/number item via fal.ai `flux/dev` (text-to-image only, no `kontext`/video step) — brand-consistent simple illustration style, matching `branding-and-voice.md`'s existing art direction, NOT a photo. Aksharmala needs no generated image at all — the character's own glyph, rendered in the appropriate script font at a large size, is the visual.
3. Translation per language (reuse the same translate step as phrase content).
4. Audio generation via `bhashini/tts.ts`'s existing `synthesize` pattern, one clip per (item, language) for vocabulary/numbers, one clip per (character, script) for Aksharmala — pre-generated and stored, per Rule 10, never live at runtime.
5. Human review gate before anything goes `live` — same discipline as phrase content, with Aksharmala held to a stricter bar (see "what to avoid," item 3 above).

## Mobile UI

New screens under `apps/mobile/src/features/learn/` (or a new `features/foundations/` — worth deciding at implementation time; leaning `learn/` since it's the same tab and shares the review/audio-player conventions already built there):
- **`AksharmalaScreen`** — sequential flashcard driven by the learner's target language → its script (via `languages.ts`'s `script` field): giant glyph, romanization, audio button, optional example word, Prev/Next, progress bar, a "jump to letter" grid.
- **`NumbersScreen`** — grid or list of number cards (image + numeral + native word + transliteration + audio button).
- **`VocabularyScreen`** — category tabs → card grid per category (image + word + transliteration + audio button), optionally a search box across the fetched word list.

Reuse whatever audio-playback hook/component `PhraseDetailScreen` already uses for phrase audio (Rule 3 — reuse before building) rather than inventing a second audio player. No `expo-video`/`PhraseAnimationPlayer` needed anywhere in this phase — everything here is static image + audio, simpler than the phrase player, not a variant of it.

## Where this lives in the Learn tab — decided 2026-08-03

Explored two layouts (mockup: "Learn tab — Foundations IA" artifact from this session) — a flat 2×2 grid treating all four modes as equal peers, versus Common Phrases kept as a full-width featured row with Vocabulary/Aksharmala/Numbers grouped below as a labeled "Foundations" row. The featured layout's first draft had a real bug worth recording: it showed a "Common Phrases" summary card AND, separately, an inline preview of actual category cards on the same root screen — the same information shown twice, at two different levels of commitment, for no reason. Caught during review. **Decided: Option A, the flat 2×2 grid of four equal peers** — simpler to scan, no implied hierarchy, and it sidesteps that redundancy entirely by never previewing anything inline.

Concretely, the Learn tab root shows exactly four cards, nothing else:
- **Common Phrases** — icon, "9 categories · 45 phrases." Tapping leads to today's existing category-grid screen, unchanged.
- **Aksharmala** — icon is the actual target-language glyph (e.g. अ for Hindi), doubling as a one-glance confirmation of which script, no translation needed.
- **Numbers**
- **Vocabulary**

Each card carries a live count (phrases/letters/numbers/words) rather than just an icon+label, so browsing answers "how much is in here?" before tapping in — and nothing is previewed inline beyond that count. Every category, character set, and word list lives exactly one tap deeper, reached via its own screen (`AksharmalaScreen`, `NumbersScreen`, `VocabularyScreen`, or the existing category grid for Common Phrases).

## Scheduling — resolved 2026-08-03

**Runs after `phase-12` completes**, not in parallel and not folded into v1.0 itself. Decided explicitly by the project owner to keep v1.0's scope from continuing to grow while it's already in flight — Phase 12 (language rollout, app-store checklist, tutor verification, monetization go/no-go) finishes and ships first; this phase starts once that's done.

## Progress — schema + Convex backend built 2026-08-03

Built by `convex-engineer`, per this doc's "Data model" section, verbatim except where noted below. No mobile code, no fal.ai/Bhashini calls, no actual vocabulary words/numbers/characters authored yet — that's `content-pipeline-engineer`'s job next, unblocked by this landing.

**Schema** (`packages/backend/convex/schema.ts`): the six tables exactly as sketched above, plus an exported `scriptCharacterType` union (mirrors `tutorExpression`'s export pattern). One real deviation from the sketch: `vocabularyItems.imageStorageId` is `v.optional`, not required — unlike a phrase's hand-typed `situation`/`sourceText`, a vocabulary item's image is itself a fal.ai generation (CLAUDE.md rule 14: generated content never auto-publishes), so an item can exist mid-authoring with no image yet. A missing or unapproved image simply keeps the item's own `status` at `draft`.

**Backend** (`packages/backend/convex/vocabulary.ts`, `.../aksharmala.ts`, plus new helpers in `.../lib/liveContent.ts`):
- `vocabulary.listCategories` / `listItemsByCategory` — client-facing, mirror `phrases.listByCategory`'s exact shape (`needsTargetLanguage` discriminated union) and auth pattern (`getCurrentUserDoc`, never a client-supplied `userId`).
- `aksharmala.listCharactersForScript` — client-facing, no auth needed (public reference content, no per-user data); `audioUrl`/`durationMs` are `null` when a character has no `live` audio yet, same "real absent state, not an error" pattern as `phrases.getDetail`'s `animationUrl`.
- Internal (`npx convex run`-only) authoring mutations mirroring `seed.ts`'s idempotent-upsert-by-human-key pattern: `upsertVocabularyCategory`/`Item`/`Translation`/`Audio`, `approveVocabularyItem` (the item's own English word + image — separate from the per-language gate), `approveVocabularyTranslationAndAudio`, `promoteCategoryToLive`. Aksharmala equivalents: `upsertScriptCharacter`/`ScriptCharacterAudio`, `approveScriptCharacterAndAudio` (combined, since both must exist together for a character to be usable at all). No per-script "promote" mutation exists — a script isn't its own table row, so there's nothing to flip; a script's readiness is just the union of its characters' own `live` status.
- Coverage-dashboard queries (`vocabulary.getCategoryCoverage`, `aksharmala.getScriptCoverage`) mirror `review.ts`'s `getCategoryCoverage` shape, for checking translation+audio completeness before promoting. `getScriptCoverage`'s doc comment flags its one real limitation: it can only report on rows that have been seeded, not whether the FULL correct character set (per an authoritative source) has been entered — that check stays a human judgment call, which is the whole point of this phase's item 3 lesson from `learn-bharat`.

**Deliberate, justified additions beyond the plan doc's literal index list:** none — every index matches the doc's list exactly (`by_slug`/`by_status_order` on categories, `by_category_order`/`by_status` on items, `by_item_language`/`by_language_status` on translations, `by_item_language` on audio, `by_script_order`/`by_status` on characters, `by_character` on character audio). Authoring mutations that need to resolve a row by its human-readable key (`itemKey` within a category, `character` within a script) do so by narrowing through the existing category/script index first and filtering in memory over that bounded range (~15–50 rows), rather than adding a dedicated key index — the Convex guidelines call this shape out as fine, and it kept the index set exactly as specified rather than growing it for CLI convenience alone.

`bun run typecheck` (from `packages/backend/`) passes clean.

## Cross-references

- `plans/phase-12-v1-launch.md` — the language-breadth work this phase's content will eventually need to cover across (the 11-13 languages confirmed viable there).
- `specs/branding-and-voice.md` — art direction for generated vocabulary/number images.
- `specs/content-pipeline.md` (◻ unwritten) — should describe this pipeline once built, alongside the phrase pipeline it's a subset of.
- `specs/data-model.md` — the "Foundations: Vocabulary, Numbers, Aksharmala" section now documents these six tables alongside the rest of the schema.
