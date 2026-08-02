# Phase 4 — Expand pilot content

**Status:** ✅ done — all 6 live languages complete for the existing 5 greetings phrases (Marathi closed via the new Google Cloud TTS fallback, see below)

## Goal

Grow content breadth within the existing (no-animation) content model before or in parallel with phase 5's video work. Scoped down (deliberately, by the project owner) to: translate the 5 existing `greetings` phrases into the remaining 5 live languages first, before adding phrase count or a second category.

## Progress

Translations drafted (by Claude, native-script + transliteration, respecting Dadi-as-elder/familiar vs. Neighbour-as-respectful-to-elder register where the target language marks that distinction), reviewed by the project owner, and approved live:

| Language | Translations seeded | Audio generated | Status |
|---|:--:|:--:|---|
| Hindi (hi) | ✅ | ✅ | ✅ **live** (phase 3) |
| Bengali (bn) | ✅ | ✅ | ✅ **live** |
| Tamil (ta) | ✅ | ✅ | ✅ **live** |
| Telugu (te) | ✅ | ✅ | ✅ **live** |
| Kannada (kn) | ✅ | ✅ | ✅ **live** |
| Marathi (mr) | ✅ | ✅ | ✅ **live** — via Google Cloud TTS |

**Marathi's path to live, in full**: Bhashini's TTS endpoint returned a sustained `504 Gateway Time-out` for `mr` specifically across two separate days — confirmed not gender-specific, not a general Bhashini outage (the other 5 languages succeeded fine). Rather than keep waiting on Bhashini, `convex/google/tts.ts`'s `generateAudioForPhraseGoogle` was built as a manually-invoked fallback (same `{phraseId, languageCode, genderOverride?, force?}` shape as Bhashini's action, Chirp 3: HD voices — see root `CLAUDE.md`'s cost-discipline table for pricing). Once the project owner provisioned `GOOGLE_CLOUD_TTS_API_KEY` (two real-world snags along the way, both expected for a freshly-scoped key: the Cloud Text-to-Speech API wasn't enabled on the project yet, then the key itself had API restrictions that didn't include it — Google's `403` error bodies named each problem precisely, no guessing required) and enabled the API, all 5 phrases generated successfully on the first real attempt with correct per-speaker gender (Dadi's lines female, Neighbour's lines male, derived automatically from `speakerCharacter` same as Bhashini). The project owner listened to all 5 signed URLs and approved; all 5 flipped live via the same `seed:approveTranslationAndAudio` flow used for the other languages. Confirmed live in the `phraseTranslations`/`audioAssets` tables (5/5 `status: "live"`, `source: "google-tts"`) — not separately re-verified in the running Simulator UI the way Bengali/Kannada were, since the picker's off-screen rows didn't respond to scripted taps during this session and the DB-level check already confirms the same live-only query path the app uses.

**Review process used**: for each language, Claude drafted translations, the project owner said "looks right" (or, for Bengali, corrected one detail before approving), Claude generated Bhashini audio, the project owner listened to signed storage URLs and confirmed quality, then Claude ran `seed:approveTranslationAndAudio` per (phraseKey, languageCode) to flip both translation and audio live together. For Tamil/Telugu/Kannada specifically, the project owner approved based on audio clarity without personally verifying the translations' semantic correctness (doesn't speak those languages) — flagging this so it's an explicit, known tradeoff rather than an invisible one. See "Open questions" below.

**Verified end-to-end in the running app** (not just via the review query): switched the test account's target language to Bengali, then separately to Kannada, via the Profile UI, and confirmed in both cases that the Learn tab's Greetings category renders all 5 phrases with correct native-script text and transliteration, and that progress resets to a fresh `0/5` per language (confirms `progress` is correctly scoped per (user, phrase, language), not global). Test account's target language was reset to Hindi afterward.

## What's left in this phase

1. All 6 live languages are done for the 5 existing `greetings` phrases — nothing left here. Optional follow-up, not blocking: re-verify Marathi in the running Simulator UI (switch target language via Profile → confirm native-script text/transliteration render and progress resets to `0/5`, same check already done for Bengali/Kannada) — skipped this round only because the language picker's off-screen rows didn't respond to scripted taps, not because of any doubt about the data itself.
2. Everything else (more phrases, a second category) is explicitly deferred — see below.

## Deferred within this phase (not done, not currently planned this pass)

- More phrases in `greetings` beyond the original 5 (target is eventually `PHRASES_PER_CATEGORY = 20` per `packages/shared`).
- A second category (`numbers-money`/`food-market` candidates) — explicitly deferred in favor of language breadth first, per the project owner's direction this session.

## Open questions

- **Review rigor for languages the project owner doesn't speak.** Tamil/Telugu/Kannada/Marathi were all approved on audio-clarity grounds, not semantic verification by a speaker of those languages. This may be an acceptable risk for simple, common greeting phrases (low ambiguity, easy to get right even via careful drafting) — but it's a real gap that would matter more for phase 4's next round (more phrases, more nuance) or phase 6 (tutor conversation, higher stakes). Worth deciding explicitly whether to bring in native-speaker review before scaling this pattern further, rather than let it become the default by inertia.
- **Google Cloud TTS voice quality vs. Bhashini, unverified at scale.** Marathi is the only language using Chirp 3: HD voices instead of Bhashini's — approved on a 5-phrase sample. If Marathi content grows significantly, worth a deliberate quality check against Bhashini's other languages rather than assuming parity from 5 short greetings.
- Does category #2 (whenever it happens) reuse the same 4-character cast, or does it need a 5th character? Still unresolved, still check `specs/branding-and-voice.md`'s cast table before assuming reuse.
