# Phase 6 — AI Tutor

**Status:** ◻ not started

## Goal

A working Tutor tab (currently a placeholder with a working sign-out-adjacent "coming soon" screen only) — conversational practice via Gemini, gated by the existing rate-limit/entitlement schema.

## What already exists to build on

- Schema: `tutorSessions`, `tutorMessages` (`source: 'gemini' | 'template'` — template replies are zero-token, matched locally, never billed), `usage` (keyed by user+day+kind), `credits`, `purchases` — all designed in `specs/data-model.md`, **none of it has a query/mutation built against it yet**.
- Root `CLAUDE.md`'s cost rules (already binding, not up for reinterpretation): never send raw audio to Gemini (Bhashini ASR → text → Gemini → Bhashini TTS), cap history at last 8 turns + rolling summary, cache the system prompt.
- `specs/ai-tutor.md` is currently ◻ (unwritten) — author it as part of this phase, not after.

## Likely work

- Convex: a `tutor.ts` module — start/continue a session, send a message (the single-transaction check-then-call pattern from `monetization-and-limits.md` applies here: resolve identity → check age gate → check free allowance/credits → increment usage → schedule the Gemini call, all in one mutation).
- Local intent-matching for template responses (greeting/goodbye/encouragement) — carried over conceptually from `learn-bharat` per the tech-stack table, not yet ported.
- Persona system: `personaKey` defaults to Dadi per `branding-and-voice.md`'s tone table; other personas (Didi, Master Ji) are optional.
- Mobile: chat UI, voice input via Bhashini ASR (first ASR usage anywhere in the app — TTS-only so far).

## Hard blocker

Age-gating (phase 8) — `ageBand: 'unknown'` **blocks the tutor entirely** per `monetization-and-limits.md`. Either phase 8 needs to land first, or at minimum a birth-year prompt needs to exist before this phase's tutor is reachable at all. Decide the ordering before starting — don't build a tutor UI that has no legal path to ever being used.
