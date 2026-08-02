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
| 5 | [Content pipeline & animation](phase-5-content-pipeline-animation.md) | ✅ | Two categories fully live end to end — `greetings` (Dadi/Neighbour) and `numbers-money` (Parent/Neighbour/Kid), 10 phrases total, each with real approved fal.ai clips re-encoded to under 1MB. All four cast members in production use. 7 categories not started |
| 6 | [AI Tutor](phase-6-ai-tutor.md) | ◻ | Gemini conversation, personas, Bhashini ASR voice loop, rate limiting |
| 7 | [Monetization](phase-7-monetization.md) | ◻ | ₹50 Tutor Pack IAP, server-side receipt verification, paywall UI |
| 8 | [Onboarding & age-gating](phase-8-onboarding-age-gating.md) | ◻ | Birth year / age band, DPDP parental consent (currently the tutor is fully blocked pending this) |
| 9 | [i18n expansion](phase-9-i18n-expansion.md) | ◻ | Translate UI chrome into the other 21 locales (only English exists today) |
| 10 | [Admin console](phase-10-admin-console.md) | ◻ | `apps/admin` — approval queue, phrase curation, spend dashboard (replaces manual `convex run` + dashboard flips) |
| 11 | [Production readiness](phase-11-production-readiness.md) | ◻ | EAS build/submit, real app icon/splash, offline downloads, deferred social features |

## Current state, in one paragraph

Auth, navigation, and a real Home/Learn/Profile experience are live and verified in the iOS Simulator. Two categories are fully live end to end across all 6 launch languages: `greetings` (Dadi/Neighbour, 5 phrases) and `numbers-money` (Parent/Neighbour/Kid, 5 phrases) — 10 phrases total, each with reviewed native-script text, transliteration, audio (Bhashini primary, Google Cloud TTS a proven fallback for Marathi), and a real approved fal.ai animation clip re-encoded to under 1MB. All four cast members (Dadi, Neighbour, Parent, Kid) are in production use, not just generated-and-idle. The animation pipeline (`fal/animations.ts`) is now genuinely multi-character — the `numbers-money` build surfaced and fixed real hardcoded-to-two-characters assumptions (trait anchors, scene settings) left over from the pilot. Everything downstream — a third category, the tutor, money, an admin UI — is unstarted but scoped. The immediate bottleneck for *content* breadth is human review capacity (translations and audio both need a listen-through before going live); adding a category is now a well-worn, repeatable path rather than a first-time build.

## Cross-references

- `specs/_index.md` — what the app does and why, per feature.
- `specs/_findings.md` — bug/cleanup backlog (separate from this file's phase sequencing).
- Root `CLAUDE.md` — hard rules, tech stack, cost guardrails.
