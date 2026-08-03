# Phase 8 — Onboarding & age-gating

**Status:** ◻ not started

## Goal

Collect birth year (→ `ageBand`) and, for minors, verifiable parental consent — required before the AI Tutor (phase 6) can be legally reachable in India under the DPDP Act 2023, per `specs/monetization-and-limits.md`.

## Why this can't just be skipped

`users.ageBand` defaults to `'unknown'`, which **blocks the tutor entirely** by design (`monetization-and-limits.md`) — not a bug, a deliberate legal safety default. Content stays free and ungated regardless of age. The spec explicitly designed the app for the *stricter* under-18 case from day one specifically so it doesn't need re-consenting a live user base later — don't defer this "until there are real users," that's the scenario it was built to avoid.

## What's genuinely undecided (not just unbuilt)

- **The parental consent verification mechanism itself.** `parentalConsentAt` has a schema slot but DPDP's practical requirements for what counts as "verifiable" aren't settled in the spec. Build whatever ships first to be swappable — the spec says so explicitly.
- Where in the flow birth year gets asked — phase 3 deliberately chose no pre-tab onboarding (Home-tab CTA pattern instead) for target-language selection. Age/consent may or may not follow the same pattern; a legal gate arguably warrants a dedicated flow even though language selection didn't. Decide this explicitly, don't default to copying phase 3's pattern just because it's already there.

## Scope note

Minors also need a stricter tutor system prompt (language-learning topics only, no open-ended conversation) once phase 6 exists — that's phase 6's concern once this phase's `ageBand` is actually populated, not this phase's.

## 2026-08-03 — ordering decision, minimal age-gate pulled into phase 6

Resolved the "decide the ordering before starting" flag phase 6 raised: rather than blocking the whole tutor build on a full phase 8, phase 6 ships a **minimal** birth-year gate as part of its own work, following phase 3's precedent (Home-tab CTA, not pre-app onboarding) — the gate appears the first time a user opens the Tutor tab, not before.

Scope split:
- **In phase 6 (built now):** the birth-year prompt itself, `ageBand` computation (`adult` / `minor` / `unknown`), and full tutor access for `adult`. This is enough to make the tutor legally reachable for the self-declared-adult path, which is the realistic majority case pre-launch.
- **Still deferred to a real phase 8:** the actual verifiable-parental-consent mechanism for `minor`. Until that exists, a user who declares `<18` sees the tutor gated with a "needs a parent's permission — coming soon" message rather than a working consent flow. This is a real product gap, not a bug — don't build an ad-hoc consent mechanism to close it; that's exactly the "build it once, properly" work this phase is for.

This keeps the phase-6 tutor buildable now without inventing DPDP consent UX under time pressure, while still closing the "blocked entirely" default safely for every user until phase 8 lands.
