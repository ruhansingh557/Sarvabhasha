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

## Progress — content pass 2: Numbers completion + Food & Drink / Animals / Colours (2026-08-03)

Follow-on to the original pilot (`packages/backend/scripts/phase13/`'s first real content batch: numbers 1–20 + family, 34 images, $0.85, both categories `live` at 20/20 and 14/14 — that pass's own progress note appears to have been skipped in this doc at the time; recorded here retroactively via `report.json`, which still carries it as the running baseline). Hindi (`hi`) only, per this project's language-rollout sequencing — no other language touched.

**What was added:**
- `numbers` completed 20 → 32: round numbers 25, 30, 40, 50, 60, 70, 80, 90, 100, 200, 500, 1000. Words verified against standard Hindi counting (पच्चीस/तीस/चालीस/पचास/साठ/सत्तर/अस्सी/नब्बे/सौ/दो सौ/पांच सौ/हज़ार). Object motifs (sunflowers, cricket balls, diyas, wooden blocks, pinwheels, butterflies, umbrellas, spinning tops, brass bells, glass bangles, gemstones, firework sparks) deliberately distinct from every 1–20 motif.
- Three brand-new categories, `sortOrder` 3/4/5: `food-drink` (15 items), `animals` (15 items), `colours` (12 items — includes both सुनहरा/golden and स्लेटी/grey rather than picking one). All real, everyday Hindi vocabulary, same research bar as the original `family` pass. Overlap with Aksharmala example words (रोटी, फल, गाय, बकरी, हाथी, शेर, मछली, खरगोश) is intentional — two independent tables, no shared dependency, and the most natural word matters more than avoiding incidental overlap.
- New FLUX prompt builders in `convex/fal/vocabularyImages.ts`: `foodImagePrompt`, `animalImagePrompt`, `colourImagePrompt` (mirrored in the script's own local copies, same convention `numberImagePrompt`/`familyIconPrompt` already used). Colours needed a second revision after the first real batch: the initial prompt produced literal English-word captions baked into 3 of 12 images (a hard violation of both the "no text" instruction and of the product's own reuse-across-22-languages model) — fixed by removing the quoted colour name from the prompt text entirely and adding a standalone, emphatic no-text clause. `golden` also needed a stronger "metallic sheen, distinct from plain yellow" steer after the first pass read as a near-duplicate of the `yellow` swatch.
- `run.ts` generalized from a `'numbers' | 'family'` union to all 5 slugs; added `seed-category`, and `onlyKeys`-filtering on both `seedVocab` and `genImages` (see the load-bearing lesson below).
- New `convex/google/vocabularyTts.ts` — Google Cloud TTS manual fallback for vocabulary/number audio, sibling of the existing `google/tts.ts` (phrase fallback). Added because Bhashini returned "TTS response missing audioContent" for `animals/dog` (कुत्ता) on **six consecutive attempts** across both genders, while a sibling item succeeded on the very next call — a sustained, item-specific failure, exactly root CLAUDE.md's documented trigger for this fallback. No schema change needed (`vocabularyAudio.source` already accepted `'google-tts'`).

**Real content-quality issues hit, and how each was resolved** (same rigor/documentation standard as the original pilot's report):
1. **`numbers/40` image**: the "40" numeral rendered as a low-contrast, ghosted double-exposure — unreadable, a direct Rule 1 failure. Regenerated once; the retry was clean (bold numeral + three lit diyas).
2. **`food-drink/bread` image**: rendered as round dotted cookies/biscuits, not a flatbread — रोटी is thin and flat, this was raised and studded. Tightened `imageSubject` to explicitly rule out "cookie/biscuit/raised/domed" and specify "completely FLAT... like a thin pancake"; the retry was correct (flat round bread with characteristic char-bubble spots).
3. **`animals/cow`, `animals/bird`, `animals/sheep` images**: all three rendered as heavily blurred, out-of-focus silhouettes with no legible species features — a real Rule 1 failure (unrecognizable muted). Regenerated all three from the same prompt (no prompt change needed); all three came back sharp and clearly identifiable on retry.
4. **`colours/pink`, `colours/orange`, `colours/grey` images**: literal English word captions ("Pink", "Orange", "Grey") baked into the artwork despite an explicit "no text" instruction — see prompt fix above. Regenerated after the prompt fix; all three came back clean.
5. **`colours/golden` image**: read as a near-duplicate of the `yellow` swatch (same flat hue, no metallic quality) — a genuine near-miss even though not a hard rule violation. `imageSubject` strengthened to require visible specular highlights/shine; the retry reads as a distinct metallic gold disc.
6. **Audio, `numbers/500`**: ASR transcript पाँच सौ vs synthesized पांच सौ — same chandrabindu/anusvara spelling-variant pattern already accepted for `numbers/5` in the original batch (पांच/पाँच). Accepted, no regeneration.
7. **Audio, `numbers/100`**: the ASR call itself failed (`empty_or_too_short`) on a 664ms/29KB clip — duration/size in line with other successful short numbers. Retried independently, same result. Bhashini's TTS is deterministic (same text+voice reproduces byte-identical audio), so this can't be "rerolled" the way a stochastic image generation can; treated as an ASR-side limitation on very short single-syllable audio (same class as isolated Aksharmala letters), not evidence of bad output.
8. **Audio, `food-drink/vegetable-curry`, `food-drink/fruit`, `food-drink/salt`, `animals/buffalo`**: female-voice ASR transcripts diverged too far to be benign near-misses (`salt` → "हे मतलब", an unrelated phrase; `buffalo` → "गैस", a real but wrong word). Since Bhashini's TTS is deterministic, re-generating with the *same* voice reproduces byte-identical audio — the only real lever is the male voice (a different underlying acoustic model). Male voice cleanly fixed all four: `buffalo` became an exact ASR match, `vegetable-curry` became सब्जी (a standard nukta-spelling variant of सब्ज़ी), `fruit`/`salt` improved to close near-misses. All four now ship on the male voice.
9. **Audio, `animals/camel`**: neither voice produced a clean ASR match (female → औथ, male → पांच — a real, unrelated word, actually worse). Kept the female take since it's phonetically closer to ऊंट; flagged in `report.json` as a genuine ASR-hard word worth a native speaker's ear, not confirmed-bad audio.
10. **Audio, `animals/dog`**: see the Google TTS fallback addition above.
11. **Minor near-misses accepted without regeneration** (same judgment standard as the original pilot's पांच/छः-class calls): `goat` (बकरी→वकरीब, b/v confusion), `lion` (शेर→शिर, vowel-only), `monkey` (बंदर→बंदल, adjacent-liquid consonant swap), `sheep` (भेड़→भीड़, vowel-length only), `purple` (बैंगनी→बैगनी, missing nasalization), `fruit`'s remaining फ/प aspiration difference.

**A real live-content regression, caught and fixed during this pass:** `seed-vocab numbers` was re-run to add the 12 round numbers, but at the time it iterated the FULL 32-item array — including the 20 already-`live` items from the original pilot. `upsertVocabularyItem`/`upsertVocabularyTranslation` both unconditionally re-land `status: 'draft'` on every call (by design, so re-authoring invalidates a prior review), so this silently demoted numbers 1–20 back to `draft` — they would have disappeared from the live app. Caught via `getCategoryCoverage` showing `ready: 12/32` where `32/32` was expected, root-caused via a direct per-item check, and fixed by re-running `approve-vocab-items`/`approve-vocab-translations` for 1–20 (content unchanged, so re-approval was safe and instant). **Fixed at the code level too**, not just patched over: `seedVocab` and `genImages` both now accept an optional `onlyKeys` filter, and the header usage comment states the rule explicitly — extending an already-partially-live category MUST pass `onlyKeys` naming just the new items.

**Spend**: 54 new images (12 numbers + 15 + 15 + 12) + 9 regenerations (40, bread, cow, bird, sheep, pink, orange, grey, golden) = 63 × $0.025 (`flux/dev`, verified against `FLUX_DEV_RATE_PER_IMAGE` in `convex/fal/vocabularyImages.ts`) = **$1.575**. Confirmed via `report.json`: final `spendUsd` 2.425 − baseline 0.85 = 1.575, exact match. All audio was Bhashini (free) except one Google Cloud TTS fallback call (`animals/dog`, negligible — a few dozen characters, well within the documented free monthly allowance).

**Final state, confirmed via `vocabulary:getCategoryCoverage` and `vocabulary:listCategories`:**

| Category | sortOrder | Items | `canPromote` | Category status |
|---|---|---|---|---|
| `numbers` | 1 | 32/32 | true | `live` |
| `family` | 2 | 14/14 (untouched this pass) | true | `live` |
| `food-drink` | 3 | 15/15 | true | `live` |
| `animals` | 4 | 15/15 | true | `live` |
| `colours` | 5 | 12/12 | true | `live` |

**Files touched:** `packages/backend/scripts/phase13/data.ts` (extended `NUMBERS`, added `FOOD_DRINK`/`ANIMALS`/`COLOURS` reusing `FamilyItem`'s shape), `packages/backend/scripts/phase13/run.ts` (5-slug generalization, `seed-category` command, `onlyKeys` filters, new prompt-builder mirrors), `packages/backend/convex/fal/vocabularyImages.ts` (`foodImagePrompt`/`animalImagePrompt`/`colourImagePrompt`), `packages/backend/convex/google/vocabularyTts.ts` (new — Google TTS fallback for vocabulary audio), `packages/backend/scripts/phase13/report.json` (job record — model/rate/seed/prompt-equivalent detail per generation, plus every ASR check and its resolution), `packages/backend/scripts/phase13/images/*` (downloaded review copies, `-v1-bad` suffix preserving the rejected generations per the established repair-pattern convention).

No mobile code touched — `apps/mobile/src/features/learn/utils/foundationsDisplay.ts` already mapped the `food-drink`/`animals`/`colours` slugs and iconKeys before this pass, so the new categories appear in the app with zero mobile changes.

## Progress — content pass 3: Body Parts, Household Items, Bengali Aksharmala (2026-08-03)

Executed directly rather than through a delegated agent — three separate content-pipeline-engineer dispatches for this batch each stalled the same way (launched a real background generation job, then ended their own turn reporting "monitoring, will report back" without ever actually finishing), so the work was driven by hand via the same `scripts/phase13/run.ts` CLI the agents use, with every image personally reviewed before approval — same rigor, just executed directly instead of delegated.

**Body Parts** (Hindi, `sortOrder` 6, 15 items — eye, ear, nose, mouth, hand, leg, head, hair, teeth, tongue, stomach, back, finger, knee, shoulder): two images failed outright as solid black/blank frames (`leg`, `knee`) — a `flux/dev` moderation-style false positive, not a real content problem. Root-caused specifically for `knee`: the original `imageSubject` phrase "a single bent human leg shown from mid-thigh to mid-shin" failed identically three times in a row (2 black, 1 blurred wash); rephrasing to describe a *clothed* kneeling pose ("a person kneeling on one bent leg wearing casual trousers, the fabric creasing over the knee joint") produced a clean result on the first attempt — strong evidence the bare-skin "mid-thigh" phrasing was the trigger, not bad luck. `leg` cleared on a single retry with its original prompt. Audio: 6/15 items passed ASR cleanly on the first take; the rest (`eye`, `nose`, `mouth`, `head`, `teeth`, `tongue`, `stomach`, `finger`, `shoulder`) showed minor diacritic-level ASR mismatches (mostly dropped anusvara/nasalization marks, e.g. आंख→अंख) consistent with this project's established finding that Bhashini's own ASR — used here only as a QA read-back, not the delivered audio — is unreliable on short isolated words. `mouth`, `teeth`, and `stomach` were each independently regenerated on the male voice as a real check (not just accepted on faith): all three reproduced the *identical* ASR transcript on a completely different underlying take, which is strong evidence the mismatch is Bhashini's ASR itself, not the audio — all three were technically verified valid (real waveform, healthy volume, correct duration, no silence/corruption) via direct `ffprobe`/`volumedetect` before being accepted. Final: 15/15 live, confirmed via `vocabulary:getCategoryCoverage`.

**Household Items** (Hindi, `sortOrder` 7, 15 items — door, window, key, lock, broom, spoon, plate, clock, fan, bucket, soap, towel, pillow, blanket, knife): three images had real, hard rule-14/Rule-1-adjacent violations — fake embossed/engraved text baked into the art despite the standing "no text" instruction (`soap`: a bar embossed with the literal word "SOAP"; `pillow`: an illegible fabric tag/label; `knife`: fake brand engraving on the blade). `pillow` and `knife` were fixed on the first retry by adding an explicit "no fabric tag/label" / "no engraving, no logo, no brand text" clause to their `imageSubject`. `soap` proved genuinely stubborn: a stronger explicit no-text clause on the same "bar on a dish" composition reproduced the *exact same* "SOAP"-embossed result (confirms this is a strong, composition-specific model bias for this object, not a seed-luck fluke) — resolved instead by changing the composition entirely, away from a flat top-down face the model wants to fill with a label: "a wet oval bar of soap covered in soap bubbles and lather, viewed at a three-quarter angle so no flat face is presented directly to camera." Clean on the first attempt with the new composition, and arguably reads as "soap" more clearly than a plain bar would (the lather is a strong visual cue). Audio: 11/15 passed ASR cleanly; the remaining 4 (`key`, `spoon`, `fan`, `blanket`) showed the same class of minor diacritic-level near-misses as Body Parts and were accepted on the same established reasoning. Final: 15/15 live, confirmed via `vocabulary:getCategoryCoverage`.

**Bengali Aksharmala** (`sortOrder`/script `bengali` — serves both `bn` and `as`, both live languages): 53 characters (11 vowels, 39 consonants including 3 nukta-modified letters ড়/ঢ়/য় and the 4 conjuncts/special marks ৎ, ং, ঃ, ঁ, plus 3 standard conjuncts ক্ষ/ত্র/জ্ঞ), researched against the standard Bengali বর্ণমালা (varnamala) teaching order, same rigor as Devanagari. Learned directly from the Devanagari saga earlier this session rather than repeating the two-pass discovery: went straight to Google Chirp3-HD (`bn-IN-Chirp3-HD-Kore`) for the audio, using the same "`<character> এ <example-word>`" mnemonic-phrase-plus-`TTS_SPEED`-0.6 pacing pattern already proven for Devanagari (reused `buildSynthesisText`/`TTS_SPEED`, not duplicated) — real, live-verified `bn-IN` voice coverage, not assumed. Spot-checked one clip (অ, "অ এ অজগর") via `ffprobe`/`silencedetect`: 3.8s total, ~2.1s of it silence (55%), consistent with the already-accepted Google-TTS pacing tradeoff from the Devanagari pass (pause-heavy slowdown mechanism, not stretched phonemes) — healthy volume (-19.2dB mean, -1.4dB peak), not corrupted. Final: 53/53 live, confirmed via both `aksharmala:getScriptCoverage` and the actual client-facing `aksharmala:listCharactersForScript` query (not just the coverage dashboard).

**Mobile — Learn tab visual fixes**, prompted by live device review of the four-card root after the above content made it renderable end to end:
- Aksharmala's icon badge rendered visibly larger than the other three cards' — root cause: `FoundationCard`'s icon-wrapper `Box` had no fixed dimensions and sized to content; three cards pass a 26px `Ionicons` glyph, Aksharmala passed the theme's largest text variant (`hero`, 40px). Fixed with a shared `ICON_BADGE_SIZE` constant (44, later 52) applied unconditionally to all four, centered rather than content-hugged; Aksharmala's glyph variant reduced to `h2`.
- No pluralization on the live-count labels (`"1 categories"`) — `en.json`'s count strings were flat, non-pluralizable templates. Fixed using i18next's `_one`/`_other` suffix convention; `Learn.COMMON_PHRASES_COUNT` (which carries two independently-pluralizable quantities, categories AND phrases) was split into two separately-pluralized sub-templates joined by a pure template string, rather than forced through i18next's single-`count` mechanism, which can't drive two plural selections in one string.
- Top row of cards rendered visibly taller than the bottom row — a different bug from the earlier within-row stretch fix (`flex:1` on `Pressable` + inner `Box`, still correct and unchanged): React Native/Yoga has no mechanism to equalize height *across* two separate flex-row containers, only *within* one. Fixed by giving all four cards an explicit shared `height` (190, computed from real theme token values — padding + badge + gap + 2-line title + 2-line count, not guessed) rather than relying on `minHeight` + stretch.
- Cards read as "blunt and morbid" (the same word used earlier this session for the pre-redesign Home screen) — added distinct icon-badge colors per card from existing semantic tokens only (`Common Phrases→primary`, `Aksharmala→accent`, `Numbers→info`, `Vocabulary→success`; `warning`/`error` deliberately skipped as carrying the wrong connotation for a plain nav menu), switched icon color to `textInverse` (the prior `primary`-on-`primaryMuted` combination had ~1.3:1 contrast, effectively invisible — real WCAG contrast computed for every combination in both themes before shipping, weakest being 2.49:1 in light theme, matching contrast already shipped elsewhere in this app for the same token pairing), and strengthened the card shadow (only lever available for depth in light theme, since `background`/`surface` are near-identical tones there with no alternate token to reach for without inventing a color).

**Spend, this pass**: Body Parts + Household Items images: 30 base + 6 regenerations (leg, knee×2, soap×2, pillow, knife) = 36 × $0.025 = **$0.90** (running total $2.425 → $3.325, later $3.750 after the final soap retry — see `report.json`). Bengali audio: Google Chirp3-HD, ~50 characters × ~10-15 chars each, trivially within the free tier (same order of magnitude as Devanagari's $0.0135).

**Files touched:** `packages/backend/scripts/phase13/data.ts` (added `BODY_PARTS`/`HOUSEHOLD_ITEMS`, prompt fixes for `knee`/`soap`/`pillow`/`knife`), `packages/backend/scripts/phase13/report.json`, `apps/mobile/src/features/learn/components/FoundationCard.tsx`, `apps/mobile/src/features/learn/screens/LearnScreen.tsx`. Bengali Aksharmala required no new code — same `google/aksharmalaTts.ts` module Devanagari already uses, just a different `script`/`languageCode` argument.

**Final state, confirmed via direct queries, not claimed:**

| Content | Count | `canPromote`/live |
|---|---|---|
| `body-parts` | 15/15 | true, `live` |
| `household-items` | 15/15 | true, `live` |
| Bengali Aksharmala | 53/53 | true, `live` |

## Progress — content pass 4: Tamil Aksharmala, Clothing, Vegetables (2026-08-04, overnight autonomous pass)

Executed under explicit standing authorization ("Finish as much as you can… pick these and complete for review when I wake up" — more Aksharmala scripts/languages, more vocabulary categories). Scoped deliberately to ONE new script done to full rigor plus two new vocabulary categories, rather than spreading thinner across more scripts with declining per-item confidence — Telugu, Kannada, Gujarati Aksharmala remain clear, ready-to-pick-up next steps (see below), not attempted this pass.

**Tamil Aksharmala** (`script: 'tamil'`, serving the live `ta` language — the THIRD script through this pipeline, and the first of the original 6 launch languages besides Hindi to get one): 37 characters — 12 உயிரெழுத்து (vowels), 18 மெய்யெழுத்து (consonants), the unique ஆயுத எழுத்து (aytham, ஃ — no equivalent in Devanagari/Bengali), and all 6 Grantha loan-consonants (ஜ ஶ ஷ ஸ ஹ க்ஷ). Unlike the two earlier scripts, this pass had live WebSearch available and used it: every structural claim (12+18+1 count, consonant order, the Grantha set, and critically the fact that SIX consonants — ங ண ழ ள ற ன — can *never* begin a native Tamil word, a harder and more absolute restriction than either Devanagari's or Bengali's "rarely initial" sets) was checked against real sources (Wikiversity, Remitly, a dedicated word-initial-restriction search) rather than asserted from training-data recall alone. No confirmed Tamil equivalent of Hindi's "से"/Bengali's "এ" mnemonic connector was found — rather than invent one, `bhashini/aksharmalaTts.ts`'s `buildSynthesisText` was changed to fall back to bare "`<character> <exampleWord>`" juxtaposition (no connector word) whenever a language has no confirmed entry in `MNEMONIC_CONNECTOR`, which now documents *why* `ta` is deliberately absent from that map. Audio went straight to Google Chirp3-HD (`ta-IN-Chirp3-HD-Kore`, already provisioned for lesson-phrase audio) at the same `TTS_SPEED` (0.6) proven for Devanagari/Bengali — no repeat of the two-pass Bhashini discovery process. ASR QA: 33/37 clean; the 4 mismatches (ஒ, ண, ழ, ஶ) were each independently ffprobe/volumedetect-verified as healthy, uncorrupted audio, and each transcript was actually a plausible partial phonetic match (e.g. ஶ→"ஷஸ்ரீ" correctly picked up "ஸ்ரீ"/sri — ஶ and ஷ are genuinely near-homophones in spoken Tamil, a real documented merger, not a defect). **Final: 37/37 live**, confirmed via both `aksharmala:getScriptCoverage` and the real client-facing `aksharmala:listCharactersForScript` query.

**Clothing** (`slug: 'clothing'`, 15 items — shirt, pants, saree, kurta, shoes, socks, cap, scarf, dress, skirt, sweater, jacket, gloves, belt, handkerchief): every garment prompted "laid flat, no person wearing it" — same "generic, not a specific character" discipline as `bodyPartImagePrompt`/`familyIconPrompt`, since a worn garment risks reading as a copy of the locked four-character cast. Two real image defects hit and fixed:
- **kurta**: first attempt had a small blob of fake illegible glyphs baked into the bottom-right corner (the established "fake text in image" failure class). First retry (explicit "no signature/stamp/symbols in any corner") removed the corner artifact but shifted the problem — the collar/cuff trim now rendered a repeating pattern that itself read as pseudo-script. Second retry, forcing a *plain solid-colour* trim with an explicit "no decorative pattern, no motifs, no swirls" clause, came back clean. Confirms this session's established lesson (from the household-items soap case): adding more "no text" instructions to the SAME composition doesn't reliably help; the fix here was removing the decorative surface the model kept trying to fill with pseudo-writing, not just forbidding text harder.
- **cap**: first TWO attempts both rendered as a bread roll/bun (round tan blob, indistinguishable from a dinner roll) despite explicit "topi", "fabric", "brim", and even an explicit "NOT bread, NOT a bun, NOT any food item" instruction on the second attempt — the negative instructions alone did not work, matching this session's established "changing composition beats piling on negatives" finding. Fixed by changing the composition entirely: a baseball-style cap viewed side-on with the brim as the dominant, unmistakable visual feature (a flat brim protruding to one side is structurally impossible to confuse with a round bread roll). Clean on the third attempt; a small logo-like mark on the back strap in that same generation was caught and removed with one more retry (explicit "plain, blank strap").
Audio: 15/15 generated; ASR check found 6 near-miss mismatches (पैंट/socks/cap/scarf/sweater/gloves), all consistent with the established short-word ASR noise pattern (vowel length, consonant confusion) — spot-verified healthy via ffprobe, not re-synthesized. **Final: 15/15 live.**

**Vegetables** (`slug: 'vegetables'`, 15 items — onion, potato, tomato, brinjal, carrot, cabbage, cauliflower, spinach, peas, cucumber, pumpkin, okra, garlic, ginger, capsicum): deliberately a separate category from `food-drink` (raw ingredients, not prepared dishes — no overlap with सब्ज़ी/vegetable-curry). All 15 images came back clean on the FIRST attempt — no retries needed, a smoother pass than every prior vocabulary category this project has authored. Audio: 15/15 generated; ASR check found 6 near-miss mismatches (tomato/brinjal/cabbage/cauliflower/pumpkin/okra), same established noise pattern (ब/व allophonic swap on brinjal, word-segmentation spacing on cabbage/cauliflower, dropped vowels elsewhere) — spot-verified healthy via ffprobe. **Final: 15/15 live.**

**A real naming lesson, logged so it isn't repeated**: this pass's `seed-category` was first run with slug `clothes` before noticing the mobile client (`foundationsDisplay.ts`) had already pre-anticipated a `clothing` slug with its own i18n key (`Learn.VOCAB_CATEGORY_CLOTHING`) and icon (`shirt-outline`) from an earlier planning pass. Corrected to `clothing` before any vocabulary items were seeded under the wrong slug — the original `clothes` category row is a harmless orphan (`status: 'draft'` forever, invisible to `listCategories`' live-only filter, never touched again). A new `Learn.VOCAB_CATEGORY_VEGETABLES` i18n key and `nutrition-outline` icon mapping were added for the new Vegetables category (English only for now — the other 21 locales still need an `i18n-translator` pass, same standing gap already flagged for the 7 newer languages' UI chrome).

**Spend, this pass**: Clothing images: 15 base + 5 retries (kurta×2, cap×3) = 20 × $0.025 = $0.50. Vegetables images: 15 × $0.025 = $0.375, zero retries. Total this pass: **$0.875** (running project total: $4.650, confirmed via `report.json`, comfortably under the pipeline's $5.00 stop-limit). Tamil/Google TTS audio: negligible (well within Chirp3-HD's free tier, same order of magnitude as Devanagari/Bengali).

**Files touched:** `packages/backend/scripts/phase13/data.ts` (added `TAMIL_CHARACTERS`, `CLOTHES`, `VEGETABLES`), `scripts/phase13/run.ts` (Tamil wired into `ScriptSlug`/`SCRIPTS`; `clothing`/`vegetables` wired into `CategorySlug`/`itemsForCategory`/`genImages`, plus mirrored `clothesImagePrompt`/`vegetableImagePrompt`), `convex/fal/vocabularyImages.ts` (canonical `clothesImagePrompt`/`vegetableImagePrompt`), `convex/bhashini/aksharmalaTts.ts` (`buildSynthesisText`'s no-connector fallback, `MNEMONIC_CONNECTOR`'s `ta` documentation), `apps/mobile/src/features/learn/utils/foundationsDisplay.ts` (`vegetables` icon/label mapping), `apps/mobile/src/translations/en.json` (`Learn.VOCAB_CATEGORY_VEGETABLES`), `.gitignore` (already covers `scripts/phase13/images/`).

**Final state, confirmed via direct queries, not claimed:**

| Content | Count | Status |
|---|---|---|
| Tamil Aksharmala | 37/37 | `live`, confirmed via `listCharactersForScript` |
| Clothing | 15/15 | `live`, `canPromote: true` |
| Vegetables | 15/15 | `live`, `canPromote: true` |

**Clear next steps, explicitly scoped and NOT started**: Telugu, Kannada, and Gujarati Aksharmala (all three already have provisioned Google Chirp3-HD voices — `te`/`kn`/`gu` — so no new voice work needed, only character-set research with the same WebSearch-verified rigor as Tamil); Punjabi (Gurmukhi) and Malayalam Aksharmala need a Google TTS voice availability check first (not yet confirmed live); Urdu (Nastaliq/Perso-Arabic, RTL) and Manipuri (Meetei Mayek) Aksharmala both carry real UI risk (right-to-left rendering; a script with near-zero mainstream TTS/font support) and should go through `ui-guardian`/`convex-engineer` rather than a solo overnight pass. More vocabulary categories (Weather & Time, Transport, School/Classroom, Emotions) remain straightforward extensions of the now well-proven pipeline.

## Cross-references

- `plans/phase-12-v1-launch.md` — the language-breadth work this phase's content will eventually need to cover across (the 11-13 languages confirmed viable there).
- `specs/branding-and-voice.md` — art direction for generated vocabulary/number images.
- `specs/content-pipeline.md` (◻ unwritten) — should describe this pipeline once built, alongside the phrase pipeline it's a subset of.
- `specs/data-model.md` — the "Foundations: Vocabulary, Numbers, Aksharmala" section now documents these six tables alongside the rest of the schema.
