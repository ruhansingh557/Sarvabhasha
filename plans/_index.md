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
| 4 | [Expand pilot content](phase-4-expand-pilot-content.md) | 🚧 | 5 of 6 live languages done for the greetings phrases (hi/bn/ta/te/kn); mr blocked on a sustained Bhashini outage for that language |
| 5 | [Content pipeline & animation](phase-5-content-pipeline-animation.md) | ◻ | Character reference images, fal.ai image-to-video, replace the "coming soon" placeholder |
| 6 | [AI Tutor](phase-6-ai-tutor.md) | ◻ | Gemini conversation, personas, Bhashini ASR voice loop, rate limiting |
| 7 | [Monetization](phase-7-monetization.md) | ◻ | ₹50 Tutor Pack IAP, server-side receipt verification, paywall UI |
| 8 | [Onboarding & age-gating](phase-8-onboarding-age-gating.md) | ◻ | Birth year / age band, DPDP parental consent (currently the tutor is fully blocked pending this) |
| 9 | [i18n expansion](phase-9-i18n-expansion.md) | ◻ | Translate UI chrome into the other 21 locales (only English exists today) |
| 10 | [Admin console](phase-10-admin-console.md) | ◻ | `apps/admin` — approval queue, phrase curation, spend dashboard (replaces manual `convex run` + dashboard flips) |
| 11 | [Production readiness](phase-11-production-readiness.md) | ◻ | EAS build/submit, real app icon/splash, offline downloads, deferred social features |

## Current state, in one paragraph

Auth, navigation, and a real (if narrow) Home/Learn/Profile experience are live and verified in the iOS Simulator. Exactly one category (`greetings`) has real content, in exactly one language (Hindi), with no animation yet (a placeholder covers that slot). Everything downstream of that — more content, video, the tutor, money, other languages, an admin UI — is unstarted but scoped. The immediate real bottleneck for *content* breadth is human review capacity (translations and audio both need a listen-through before going live); the immediate bottleneck for *video* is that fal.ai character references don't exist yet, which is its own first task, not a quick add.

## Cross-references

- `specs/_index.md` — what the app does and why, per feature.
- `specs/_findings.md` — bug/cleanup backlog (separate from this file's phase sequencing).
- Root `CLAUDE.md` — hard rules, tech stack, cost guardrails.
