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
