# Phase 4 — Expand pilot content

**Status:** 🚧 in progress — direction chosen: more languages for the existing 5 greetings phrases, not more phrases or a second category (yet)

## Goal

Grow content breadth within the existing (no-animation) content model before or in parallel with phase 5's video work. Scoped down (deliberately, by the project owner) to: translate the 5 existing `greetings` phrases into the remaining 5 live languages first, before adding phrase count or a second category.

## Progress as of this session

Translations drafted (by Claude, native-script + transliteration, respecting Dadi-as-elder/familiar vs. Neighbour-as-respectful-to-elder register where the target language marks that distinction) and reviewed by the project owner one language at a time:

| Language | Translations seeded | Audio generated | Status |
|---|:--:|:--:|---|
| Hindi (hi) | ✅ | ✅ | ✅ **live** (phase 3) |
| Bengali (bn) | ✅ | ✅ | ✅ **live** — reviewed and approved this session |
| Tamil (ta) | ✅ | ✅ | 🚧 `draft` — audio generated, **awaiting the project owner's listen-through** |
| Telugu (te) | ✅ | ✅ | 🚧 `draft` — same, awaiting review |
| Kannada (kn) | ✅ | ✅ | 🚧 `draft` — same, awaiting review |
| Marathi (mr) | ✅ (text seeded) | ❌ **blocked** | Bhashini's TTS endpoint returned a sustained `504 Gateway Time-out` for `mr` specifically during this session — confirmed NOT gender-specific (both the female/Dadi and male/Neighbour voice pipelines failed identically), confirmed NOT a general Bhashini outage (hi/bn/ta/te/kn all succeeded in the same session). A background retry loop (`/tmp/mr_retry.sh`, 5 phrases × 5 attempts × 15s spacing) was left running — check its result before re-attempting manually. If still failing, this is worth a fresh look another day rather than more immediate retries; Bhashini is documented as "free, but slow and flaky" and per-language outages aren't unprecedented. |

**Verified structurally correct** (not just "seeded without error"): confirmed via `review:getPhraseAcrossLanguages` that live-status gating works correctly per language (hi/bn show `live`, ta/te/kn correctly still `draft`, mr correctly has no audio row at all). **Verified end-to-end in the running app**: switched the test account's target language to Bengali via the Profile UI and confirmed all 5 phrases render with correct Bengali text/transliteration in the Learn tab phrase list — proves the multi-language path works generically, not just for Hindi.

## What's actually needed to finish this pass

1. **Project owner reviews ta/te/kn audio** — same process as hi/bn: listen to each clip via its signed storage URL, confirm pronunciation/naturalness, then run `seed:approveTranslationAndAudio` per (phraseKey, languageCode) to flip live. Do NOT flip these live without that review — this is the one deliberate human gate in the whole pipeline.
2. **Resolve Marathi** — check `/tmp/mr_retry.sh`'s outcome (the log lives at `/tmp/mr_retry.log`), and if still failing, retry `bhashini/tts:generateAudioForPhrase` for `mr` again later rather than assuming it's permanently broken.

## Deferred within this phase (not done, not currently planned this pass)

- More phrases in `greetings` beyond the original 5 (target is eventually `PHRASES_PER_CATEGORY = 20` per `packages/shared`).
- A second category (`numbers-money`/`food-market` candidates) — explicitly deferred in favor of language breadth first, per the project owner's direction this session.

## Open questions (unchanged from before this session)

- Who reviews translations in languages the project owner doesn't personally speak, going forward? Bengali/Tamil/Telugu/Kannada were drafted by Claude and are pending the owner's own review — same pattern as Hindi. Whether that's sufficient for languages the owner is less fluent in, or whether a native-speaker reviewer is needed, isn't settled.
- Does category #2 (whenever it happens) reuse the same 4-character cast, or does it need a 5th character? Still unresolved, still check `specs/branding-and-voice.md`'s cast table before assuming reuse.
