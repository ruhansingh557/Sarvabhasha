# Phase 9 — i18n expansion

**Status:** ◻ not started

## Goal

Translate `apps/mobile/src/translations/en.json` (and its `apps/admin` equivalent, once phase 10 exists) into more of the 22 `UI_LOCALES`. Only English exists today.

## Important: this is the OTHER translation lane

Root `CLAUDE.md` is explicit about "two translation lanes, do not confuse them":

- **UI chrome** (this phase) — machine translation is acceptable, owned by the `i18n-translator` agent, shardable (multiple instances can each own a group of top-level keys and merge).
- **Lesson phrase content** (phases 3/4's `phraseTranslations`) — never machine-translated without human/native review. Do not let this phase's tooling anywhere near that table.

## Mechanism (already established, not this phase's to design)

The `i18n-translator` agent normalizes the target locale against the English source and translates only missing/empty leaf strings through this project's own Bhashini Convex action. Just invoke it per locale (or per shard of keys) — don't hand-translate, don't reach for an external MT API.

## Practical starting point

Prioritize whichever locales correspond to phase 4's expanded phrase-content languages first (bn, ta, te, mr, kn) — a learner reading the app in a language it can't yet display coherently is a worse experience than English-only chrome with correctly-live lesson content in their language.
