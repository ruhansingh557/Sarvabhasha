# Sarvabhasha — Development Plan

> **Read this first if you're picking up work on Sarvabhasha after a context reset.** This is the roadmap: what's built, what's in flight, what's next, and why. `specs/` describes what the *product* does; this describes the *build sequence* — the order we're building it in and the state of each phase.

## How to use this

- Each phase has its own file: `phase-N-slug.md`.
- Status is one of: ✅ done · 🚧 in progress · ◻ not started.
- When you finish work in a phase, update its file (what shipped, what's left, any decisions made) and update the status here. Don't wait for the phase to fully close — a stale "in progress" with no detail is worse than an honest partial update.
- When a phase is fully done, leave it marked ✅ with a short summary — don't delete it. It's the record of *why* things are the way they are, which `git log` alone doesn't give you.
- Cross-reference `specs/_index.md` for product intent/behavior of anything already built. This file is sequencing and status, not a re-explanation of what a feature does.

## Phases

| # | Phase | Status | Summary |
|---|-------|:------:|---------|
| 1 | [Foundation](phase-1-foundation.md) | ✅ | Monorepo scaffold, Convex + Better Auth, Expo app shell, theming, i18n bootstrap, Bhashini TTS action |
| 2 | [Navigation shell](phase-2-navigation-shell.md) | ✅ | Bottom tabs (Home/Learn/Tutor/Profile) gated on auth session, tab bar icons |
| 3 | [Home/Learn/Profile MVP](phase-3-home-learn-profile-mvp.md) | ✅ | Full backend + screens for the three tabs; `greetings` category live in Hindi (5 phrases, text+audio, human-reviewed) |
| 4 | [Expand pilot content](phase-4-expand-pilot-content.md) | ✅ | All 6 live languages (hi/bn/ta/te/kn/mr) done for the 5 greetings phrases; mr closed via a new Google Cloud TTS fallback after a sustained Bhashini outage for that language |
| 5 | [Content pipeline & animation](phase-5-content-pipeline-animation.md) | ✅ | **All 9 categories fully live end to end** — 45 phrases, real approved fal.ai clips re-encoded to under 1MB, verified in the Simulator. A mid-session fal.ai balance exhaustion was resolved with a top-up; no other blockers |
| 6 | [AI Tutor](phase-6-ai-tutor.md) | ◻ | Gemini conversation, personas, Bhashini ASR voice loop, rate limiting |
| 7 | [Monetization](phase-7-monetization.md) | ◻ | ₹50 Tutor Pack IAP, server-side receipt verification, paywall UI |
| 8 | [Onboarding & age-gating](phase-8-onboarding-age-gating.md) | ◻ | Birth year / age band, DPDP parental consent (currently the tutor is fully blocked pending this) |
| 9 | [i18n expansion](phase-9-i18n-expansion.md) | ◻ | Translate UI chrome into the other 21 locales (only English exists today) |
| 10 | [Admin console](phase-10-admin-console.md) | ◻ | `apps/admin` — approval queue, phrase curation, spend dashboard (replaces manual `convex run` + dashboard flips) |
| 11 | [Production readiness](phase-11-production-readiness.md) | ◻ | EAS build/submit, real app icon/splash, offline downloads, deferred social features |

## Current state, in one paragraph

Auth, navigation, and a real Home/Learn/Profile experience are live and verified in the iOS Simulator. **All 9 lesson categories are fully live end to end** across all 6 launch languages — `greetings`, `numbers-money`, `food-market`, `travel-directions`, `family`, `daily-routine`, `health-body`, `emergency`, `school-work` — 45 phrases total, each with reviewed native-script text, transliteration, audio (Bhashini primary, Google Cloud TTS a proven fallback for Marathi — now confirmed failing 100% of the time for `mr` across every category, not worth re-testing), and a real approved fal.ai animation clip re-encoded to under 1MB. All four cast members (Dadi, Neighbour, Parent, Kid) are in heavy production use across varied pairings. The animation pipeline (`fal/animations.ts`) is now genuinely multi-character and battle-tested — every category surfaced and fixed at least one real bug (trait bleed-over, mute-test failures where a clip didn't actually convey its phrase's meaning, a literal-text-in-frame rule violation, and — new this round — a physically-contradictory pose description causing a phantom third character to appear), each documented in `plans/phase-5` with its fix.

A mid-session fal.ai account balance exhaustion (`403 User is locked — Exhausted balance`) briefly blocked the last two categories; the project owner topped up the account and generation resumed normally with no code changes needed.

Everything downstream of content — the tutor, money, an admin UI — is unstarted but scoped. Adding a category is now a well-worn, repeatable path (seed → translate → audio → beats → animate → re-encode → flip live), not a first-time build. The 7 non-pilot categories built this session were done with full agent autonomy per explicit project-owner sign-off, without a real-time human listen-through of every clip — worth a look-over when there's time, though every animation clip was personally frame-inspected before approval throughout.

## Cross-references

- `specs/_index.md` — what the app does and why, per feature.
- `specs/_findings.md` — bug/cleanup backlog (separate from this file's phase sequencing).
- Root `CLAUDE.md` — hard rules, tech stack, cost guardrails.
