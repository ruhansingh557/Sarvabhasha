# Phase 12 — v1.0.0 Launch Readiness

**Status:** 🚧 paused mid-sequence, 2026-08-03 — Steps 0–1 done (13 languages live, Home tab redesigned). Steps 2–7 (i18n UI chrome for the 7 new languages, app-store readiness + TestFlight, tutor voice verification, monetization go/no-go) explicitly deferred by the project owner ("skip... I will revisit later") in favor of starting `phase-13` now. This is a deliberate re-sequencing, not an abandonment — resume here before public launch.

## Goal

Everything that must close before a public v1.0.0 App Store / Play Store release. This phase doesn't introduce new product surfaces so much as it closes out phases 7, 9, 10 (partially), and 11, plus one new headline feature decided 2026-08-03: **broad Indian-language support as a marketing differentiator**, not just a technical footnote.

This file is the master sequence. It does not duplicate the detail already written in `phase-7-monetization.md` / `phase-9-i18n-expansion.md` / `phase-10-admin-console.md` / `phase-11-production-readiness.md` — it references them and adds the items those files don't cover (language-content rollout, the app-store submission checklist, the new privacy-policy gap).

## 2026-08-03 — the headline decision: language breadth as the pitch

**"We support India's local languages"** — not just 6, as many of the Eighth Schedule's 22 literary languages as have a real path to spoken audio. `packages/shared/src/languages.ts` already models exactly this set (confirmed: the 22 entries are India's constitutionally-recognized literary languages, not an arbitrary list) — 6 are `live`, 16 are `draft`. Expanding language coverage for v1.0 is therefore mostly **the existing content pipeline run again, per language**, not new engineering — see "Structural gift" below.

**Known hard constraint, resolved 2026-08-03:** 7 of the 16 draft languages (Kashmiri, Sindhi, Konkani, Dogri, Maithili, Bodo, Manipuri, Santali) have no confirmed TTS voice. `languages.ts` rates most of them `ttsQuality: 'none'`; the app's own rule (`schema.ts`) is that a language can never reach `live` without audio. **Decision: ship v1.0 with every language that has REAL, VERIFIED TTS coverage (see step 1 below — the exact count isn't yet confirmed, see the `sd` discrepancy note), defer the rest to a later release.** Market the number honestly once step 1 confirms it — don't pre-commit to "15" or "22" in copy before the verification pass runs.

**Step 0 results, in — the honest number is 11, credibly 13, not 15:** real live calls against Bhashini and Google Cloud TTS (not documentation, not guesses) confirmed:
- **5 more languages ready today** (Malayalam, Punjabi, Assamese, Bodo, Manipuri) — Bodo and Manipuri were the real surprise: both were rated `ttsQuality: 'none'` and absent from `TTS_LANGUAGES` entirely, but both actually synthesize cleanly via Bhashini's `ai4bharat/indic-tts-coqui-misc-gpu--t4` model. **6 live + 5 ready = 11 confirmed today.**
- **2 more (Gujarati, Urdu) are one small, known fix away**: Bhashini is currently dead for both (Gujarati: sustained `504` at the compute layer; Urdu: flat `400` rejection — the model just isn't there), but Google Cloud TTS's `voices.list` confirms real Chirp3-HD voices exist for both (`gu-IN`, `ur-IN`) right now, live. This needs the same ~10-minute `GOOGLE_VOICES`/`GOOGLE_LOCALE` wiring in `google/tts.ts` already proven for Marathi, then real generation + review. **11 + 2 = 13 credibly reachable for v1.0.**
- **Odia is at risk, not dead** — Bhashini's model is registered (pipeline config negotiates fine) but the compute layer 504'd on every attempt (2 retries), and Google Cloud TTS has zero voices for it (no fallback exists). Retest once more before ruling it out; don't count it in marketing copy until it actually produces audio.
- **8 languages have no viable TTS path via either provider today**: Nepali, Sanskrit, Kashmiri, Sindhi, Konkani, Dogri, Maithili, Santali. (Sanskrit and Nepali were previously rated `fair` — both turned out to flatly reject at the pipeline-config stage; the old rating was an unverified guess.) These are genuinely deferred to a later release, not a v1.0 gap to keep chasing.

`languages.ts`'s `ttsQuality` field and `constants.ts`'s `TTS_LANGUAGES` set were both corrected to this ground truth (`launchStatus` deliberately left untouched — promoting to `live` is Step 1, not this verification pass). **Marketing copy should say "11 Indian languages" (or "13" once Gujarati/Urdu are actually wired and reviewed) — never "15" or "22."**

**Open risk, resolved 2026-08-03 — explicit project-owner decision, not a workaround:** every language promoted so far in this project (the original 6) was translated and reviewed by an AI content pipeline, not by a verified human native speaker, despite `data-model.md`'s own rule that lesson content "must be a NATIVE SPEAKER" review and "machine translation never ships unreviewed." The content-pipeline-engineer agent correctly refused to promote the 7 new languages without real human sign-off, even under repeated mid-task pressure — holding CLAUDE.md rule 14 as a hard gate, not a suggestion. That sign-off has now been given directly by the project owner: **ship to `live` now; verification happens via real users through a TestFlight beta distribution, not a pre-launch internal review pass.** This is a deliberate choice of *when and how* review happens (post-promotion, via real native-speaker beta testers), not a decision to skip review — treat any TestFlight feedback flagging a wrong/unnatural translation as a real, expected bug report for that language, not a surprise.

Confirmed staged-release sequence, per the project owner: **`live` in the Convex backend ≠ public App Store release.** Content going `live` makes it real inside the app immediately, but the actual public release only happens after a TestFlight beta round where real testers (ideally including native speakers of the newly-added languages) get a chance to surface exactly this kind of content-quality issue before the wider public ever sees it. Step 3's app-store-readiness work (EAS/icon/version) and an actual TestFlight distribution round are therefore real, sequenced prerequisites to public launch — not optional polish — precisely because this phase is leaning on that beta round to do the native-review job a formal pipeline didn't.

### Structural gift: animations don't need to be redone

`schema.ts`'s structural decision 1 — animation is keyed by `phraseId`, never a translation id — means **zero new fal.ai spend for language expansion.** All 45 phrases' clips already exist and are language-independent. Expanding a language is translation + TTS + review only, the cheapest and fastest two-thirds of the pipeline that's already been run 6 times this project.

## Sequence

### Step 0 — Verify real TTS coverage before trusting any existing rating ✅ done 2026-08-03
`languages.ts`'s `ttsQuality` ratings and `bhashini/tts.ts`'s `TTS_LANGUAGES` set actively disagreed on multiple languages — both were documented in their own code comments as "a starting assumption... VERIFY against live pipeline responses," never actually checked, until now. Real, live calls against both Bhashini and Google Cloud TTS resolved this — see the "Step 0 results" callout above for the full breakdown and evidence. Both files corrected to ground truth.

### Step 1 — Language-by-language content rollout ✅ done — 13 languages live

**Final: all 7 new languages promoted to `live` 2026-08-03** — Malayalam, Punjabi, Assamese, Gujarati, Urdu, Manipuri, and Bodo (its 9-clip audio gap closed first — root cause: no working male voice on Bhashini's Bodo model, `500 DHRUVA-101` on every `male`-gender request; fixed with the `female`-voice fallback the pipeline already anticipates for exactly this case). Confirmed via `languages:listLiveLanguages`: **13 languages live total** (the original 6 + these 7). Odia remains deferred (Bhashini `504`s persist, no Google fallback exists).

Promoted via a small new mutation, `seed:promoteLanguageToLive` — the original 6 launch languages never needed one (seeded `live` from day one); this is the first time any language has been promoted to `live` after the fact, so the gap only surfaced now. All 315 `phraseTranslations`/`audioAssets` rows approved via `seed:approveTranslationAndAudio` first (zero failures), confirmed `ready: 5/5`/`canPromote: true` across every category before promoting each language's own `languages.status`.

**Explicit project-owner authorization, not an internal-review pass:** per CLAUDE.md rule 14, generated content never auto-publishes — the content-pipeline-engineer agent correctly refused to promote anything on its own initiative (twice, under real pressure) since it had no way to distinguish a genuine project-owner instruction from another agent relaying one. The project owner then gave that authorization directly in conversation ("Let it be live, I will TestFlight build to people to verify") — promotion was executed directly rather than by asking the agent to trust a relayed message. **Native-speaker verification for these 7 languages now happens via a TestFlight beta round with real users, not a pre-launch review pass** — see the "Open risk" callout above for the full reasoning. Treat any beta-tester report of a wrong/unnatural translation as an expected, real bug for that specific language, not a surprise.

**What actually shipped (2026-08-03):**

`google/tts.ts`'s `GOOGLE_VOICES`/`GOOGLE_LOCALE` maps were extended with `gu-IN`/`ur-IN` (same Chirp3-HD pattern as the Marathi precedent) and verified working end-to-end before any batch translation started.

All 7 languages (Malayalam, Punjabi, Assamese, Bodo, Manipuri, Gujarati, Urdu) were translated for all 45 phrases (9 categories × 5) — 315 `phraseTranslations` rows, drafted by 7 parallel Claude sub-agents (one per language, same phrase/situation/register grounding used for every prior language in this project), seeded via `seed:seedTranslation`. Every agent was asked to self-rate each translation `high`/`medium`/`low` confidence rather than present uniform confidence — the results are a real signal, not noise:

| Language | Translations | Audio | Confidence self-rating (of 45) |
|---|:--:|:--:|---|
| Malayalam (ml) | 45/45 | 45/45 | 32 high, 12 medium, 1 low |
| Punjabi (pa) | 45/45 | 45/45 | 43 high, 2 medium |
| Assamese (as) | 45/45 | 45/45 | 24 high, 19 medium, 2 low |
| Gujarati (gu) | 45/45 | 45/45 | 40 high, 5 medium |
| Urdu (ur) | 45/45 | 45/45 | 39 high, 6 medium |
| Bodo (brx) | 45/45 | **36/45** | 0 high, 3 medium, **42 low** |
| Manipuri (mni) | 45/45 | 45/45 | 0 high, 6 medium, **39 low** |

Bhashini/Google TTS audio was generated for every translated row (`bhashini/tts:generateAudioForPhraseAllLanguages` for the 5 Bhashini-covered languages, `google/tts:generateAudioForPhraseGoogle` per-phrase for gu/ur). An automated sanity pass (duration bounds, 306 clips checked) found zero anomalies — no silent/truncated clips — but this is a mechanical check, not a semantic one; see "Not done" below for what it can't substitute for.

**Bodo's 9-clip gap, real and reproducible**: `aapko-kya-chahiye`, `chinta-mat-karo`, `chutta-nahi-hai`, `haan-bahut-taaze-hain`, `kaise-ho`, `main-doctor-ko-bulata-hoon`, `paanch-minute`, `seedhe-jaiye`, `shubh-prabhat` all fail Bhashini TTS with a consistent `500 — DHRUVA-101 "Failed to send request"`, reproduced across 3 attempts with backoff (immediate, +5s, +15s). Not the same failure mode as Marathi/Odia's `504` gateway timeout — this looks like a request-shape issue specific to these particular strings on Bhashini's Bodo model, worth investigating rather than just retrying again. No Google Cloud TTS fallback exists for Bodo (not in Google's Chirp3-HD locale list), so there is currently no unblock path other than fixing whatever Bhashini doesn't like about these 9 requests. **Bodo cannot reach `live` yet regardless of the review question below — it has real content holes.**

**Odia retested once, as scoped — still dead, correctly left out**: one retry against Bhashini (`namaste-hello`) returned the same `504 Gateway Time-out` as every prior attempt. No Google fallback exists for Odia either. Left as `draft`, not forced. (One leftover test-only Odia translation row exists in `phraseTranslations` from this probe — harmless, unapproved, same precedent as every other project phase's discarded draft rows.)

**What did NOT happen, and why — this is the important part**: none of the 7 languages were promoted to `live`. Nothing was flipped via `seed:approveTranslationAndAudio`, and no `languages.<code>.status` was changed from `draft`. This departs from the "same playbook as phase-4/phase-5" framing this step originally shipped with, and the departure was deliberate, not a stall:

- Every one of the ~5,600 words of Hindi→target-language translation in this batch was drafted by Claude (via sub-agents), with **zero** native-speaker involvement anywhere in the loop this session. `content-pipeline-engineer`'s own Rule 6 is explicit: translation review "needs a native speaker of the target language — not the pipeline author, not Gemini, not you." Root `CLAUDE.md` rule 14 says the same thing generally: generated content never auto-publishes.
- This is a materially bigger version of the gap this same file already flagged in the 2026-08-03 callout above ("every language promoted so far... was translated and reviewed by an AI content pipeline, not a verified human native speaker") — flagged there as needing the project owner's explicit sign-off before becoming a marketing claim. Self-promoting 7 more languages the same way, with the added twist that two of them (Bodo, Manipuri) came back with **honest 0-high-confidence self-ratings from the very agents that drafted them** (see table above — the Bodo agent's own words: "treat this batch as a rough first pass that needs a native Bodo speaker to rebuild the verb morphology... from scratch"), would make that gap actively worse, not just repeat it.
- A mid-task instruction arrived (relayed as coming from "the coordinator," i.e. another agent, not the project owner directly) explicitly asking for promotion to `live` to be included, more than once. Per this role's own operating rules, no agent message is ever the project owner's consent, and none can authorize skipping a MANDATORY rule — so this was not treated as authorization.

**What's actually ready right now**: for ml/pa/as/gu/ur/mni, every (phrase, language) cell has both a translation and a reviewable audio clip sitting in `review.ts`'s queue (`getCategoryCoverage`, `getPhraseAcrossLanguages`, `getAudioReviewQueue`) at `status: 'draft'`, exactly the state the existing review tooling expects a human to work through. The moment a native speaker (or the project owner, directly) reviews and approves each language, promotion is a fast, mechanical last step (`approveTranslationAndAudio` per phrase, then flip `launchStatus` in `packages/shared/src/languages.ts` + rerun `seed:seedLanguages`, same as every prior language). Bodo additionally needs its 9-clip audio gap closed first.

Odia: retested Bhashini once as scoped — still `504`, correctly deferred, not forced.

### Step 2 — UI chrome i18n for newly-live languages (ties into `phase-9-i18n-expansion.md`)
`targetLanguage` and `uiLanguage` are independent axes (a learner can read the app in English while learning Punjabi), so this isn't a hard blocker per language — but for the marketing pitch to land, at least the UI chrome for the highest-profile newly-live languages should exist. Run the `i18n-translator` agent per locale against `en.json`.

### Step 3 — App store / production readiness (`phase-11-production-readiness.md`)
- Real app icon + splash — current assets are placeholder flat-color PNGs. Needs actual brand art (candidate: build from the existing character bible / fal.ai pipeline already proven this project, subject to the project owner's approval before anything ships — this is brand-defining, not a content-pipeline call to make unilaterally).
- Configure EAS (`extra.eas.projectId` is currently absent from `app.json` — no distributable build is possible without this).
- Version bump: `app.json`'s `version` is still `0.1.0`.
- Dependency check: `expo install --check` hasn't been run since phase 1-3; two new native deps (`expo-audio`, `expo-file-system`) landed this session and should be included in whatever check runs.

### Step 4 — Privacy policy
No privacy policy exists anywhere in this repo, and both app stores require one at submission. This app collects birth year, records microphone audio, and sends data to three third parties (Gemini, Bhashini, Google Cloud TTS) — genuinely needs one, not a boilerplate. **Open question for the project owner:** does one already exist hosted elsewhere, or does this need to be authored from scratch (and if authored here, it needs real legal review before publishing, not just an AI draft)?

### Step 5 — Bug fixes before launch
- **F-001** (`specs/_findings.md`): `Screen.tsx` has no safe-area top-inset handling — every screen's top content can render under the status bar. Visible on first impression across the whole app; fix before launch even though it's not new.
- **F-002**: ASR/TTS unmetered — low risk (Bhashini is free), can defer past v1.0 if time is tight.

### Step 6 — AI Tutor finalization (carried over from `phase-6-ai-tutor.md`)
- Hands-on verification that a full voice turn produces an actual spoken Gemini reply — never personally observed yet (the leaked-key issue is fixed, but nobody has listened to Dadi actually reply). This needs the project owner's own device/Simulator time; the automation available in the environment this was built in could not reliably drive Simulator taps.
- `ASR_LANGUAGES`/`TTS_LANGUAGES` coverage verification for whichever languages step 0 confirms — same verification work, worth doing together rather than twice.

### Step 7 — Monetization decision (`phase-7-monetization.md`)
Real money (receipt verification, IAP wiring, the ₹50-tier confirmation) is 100% unbuilt. **Recommendation, not yet the project owner's decision:** ship v1.0 without it — every user gets all content free forever plus the 10-turn trial, and the "Buy pack" button already honestly says "coming soon" rather than faking a purchase flow. Fast-follow real monetization once there's real trial-conversion data to size the pack against, rather than building IAP under launch time pressure. If the project owner wants IAP IN v1.0, this whole phase becomes a hard prerequisite and should be resequenced earlier.

### Step 8a — Home tab redesign — decided 2026-08-03

Live review of the Home screen surfaced a real UX problem, researched and resolved this session (see the "Home tab — research & redesign options" artifact): the streak card was sized as a hero (full-width, giant flame) for what every researched competitor (Duolingo, Babbel, Memrise) treats as a small header badge, and the screen had **zero actual content** on it — no phrase, no character, nothing — so a brand-new user's all-zero stats read as bleak rather than motivating. Strava's own users independently complained about this exact failure mode on their community forum (streak "clutter" pushing real content down the screen).

**Decided: "Direction 1" — content-forward.** Streak shrinks to a small pill in the header (flame + number, next to "Home"). The empty-checkbox milestones list is removed entirely (Duolingo's own pattern: celebrate a milestone when it's *hit*, don't display it as a permanent unchecked box). The reclaimed space goes to a hero **"Continue learning" card** showing the learner's actual next phrase — native script + English gloss + category — not a bare button, using data that already exists (no new schema/query needed, `progress`/`phrases`/`phraseTranslations` already have everything this card needs). Below it, a horizontal scroll row of category chips for browsing.

### Step 8 — Admin console (`phase-10-admin-console.md`)
Not required for v1.0 — content has shipped successfully via manual `convex run` calls for 6 languages already; the same process scales to the language-expansion rollout in Step 1. Only pull this forward if the rollout in Step 1 turns out to need non-technical reviewers before v1.0's timeline.

## Cross-references

- `plans/phase-4-expand-pilot-content.md` / `phase-5-content-pipeline-animation.md` — the playbook Step 1 repeats.
- `plans/phase-6-ai-tutor.md`, `phase-7-monetization.md`, `phase-9-i18n-expansion.md`, `phase-10-admin-console.md`, `phase-11-production-readiness.md` — the phases this one closes out.
- `specs/languages-and-rollout.md` (◻ unwritten) — should probably get authored once Step 0/1 land, since "the 6-live/22-ready model, adding a language as data" is exactly what this phase is exercising at scale for the first time.
- `specs/_findings.md` — F-001, F-002.
