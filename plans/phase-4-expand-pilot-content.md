# Phase 4 — Expand pilot content

**Status:** 🚧 in progress — 5 of 6 live languages done for the existing 5 greetings phrases; Marathi blocked

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
| Marathi (mr) | ✅ (text seeded) | ❌ **blocked** | Bhashini's TTS endpoint returned a sustained `504 Gateway Time-out` for `mr` specifically — confirmed NOT gender-specific (both female/Dadi and male/Neighbour voice pipelines failed identically), confirmed NOT a general Bhashini outage (the other 5 languages all succeeded in the same session). A 25-attempt background retry (5 phrases × 5 attempts × 15s spacing) ran to completion with **zero** successes. This needs a fresh attempt on a later day, not more immediate retries — Bhashini is documented as "free, but slow and flaky," but this was an unusually sustained, language-specific failure, worth a quick recheck of Bhashini's status before assuming it's just flakiness again. |

**Review process used**: for each language, Claude drafted translations, the project owner said "looks right" (or, for Bengali, corrected one detail before approving), Claude generated Bhashini audio, the project owner listened to signed storage URLs and confirmed quality, then Claude ran `seed:approveTranslationAndAudio` per (phraseKey, languageCode) to flip both translation and audio live together. For Tamil/Telugu/Kannada specifically, the project owner approved based on audio clarity without personally verifying the translations' semantic correctness (doesn't speak those languages) — flagging this so it's an explicit, known tradeoff rather than an invisible one. See "Open questions" below.

**Verified end-to-end in the running app** (not just via the review query): switched the test account's target language to Bengali, then separately to Kannada, via the Profile UI, and confirmed in both cases that the Learn tab's Greetings category renders all 5 phrases with correct native-script text and transliteration, and that progress resets to a fresh `0/5` per language (confirms `progress` is correctly scoped per (user, phrase, language), not global). Test account's target language was reset to Hindi afterward.

## What's left in this phase

1. **Resolve Marathi** — retry `bhashini/tts:generateAudioForPhrase` for `mr` again later. If it keeps failing across multiple days, that's worth flagging as a genuine gap rather than assumed-transient flakiness (Bhashini has no alternative TTS provider in this codebase to fall back to).
2. Everything else (more phrases, a second category) is explicitly deferred — see below.

## Deferred within this phase (not done, not currently planned this pass)

- More phrases in `greetings` beyond the original 5 (target is eventually `PHRASES_PER_CATEGORY = 20` per `packages/shared`).
- A second category (`numbers-money`/`food-market` candidates) — explicitly deferred in favor of language breadth first, per the project owner's direction this session.

## Open questions

- **Review rigor for languages the project owner doesn't speak.** Tamil/Telugu/Kannada were approved on audio-clarity grounds, not semantic verification by a speaker of those languages. This may be an acceptable risk for simple, common greeting phrases (low ambiguity, easy to get right even via careful drafting) — but it's a real gap that would matter more for phase 4's next round (more phrases, more nuance) or phase 6 (tutor conversation, higher stakes). Worth deciding explicitly whether to bring in native-speaker review before scaling this pattern further, rather than let it become the default by inertia.
- Does category #2 (whenever it happens) reuse the same 4-character cast, or does it need a 5th character? Still unresolved, still check `specs/branding-and-voice.md`'s cast table before assuming reuse.
