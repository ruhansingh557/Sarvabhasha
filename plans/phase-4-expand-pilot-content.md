# Phase 4 — Expand pilot content

**Status:** ◻ not started

## Goal

Grow content breadth within the existing (no-animation) content model before or in parallel with phase 5's video work: more categories, more languages for the phrases that already exist, and a less manual review workflow.

## Likely work

- More phrases in `greetings` (currently 5; `packages/shared`'s `PHRASES_PER_CATEGORY = 20` is the eventual target).
- Promote a second category from `draft` to `live` (candidates in sort order: `numbers-money`, `food-market` — see `specs/data-model.md`'s category table) — needs its own phrase set authored, same pattern as phase 3's `seed.ts`.
- Add translations for the existing 5 greetings phrases in the other 5 live languages (bn, ta, te, mr, kn) — needs either the project owner's own fluency or a native-speaker reviewer per language; this was explicitly flagged as the bottleneck in phase 3, not solved there.
- Consider whether `seed.ts` + manual `convex run` + dashboard-flip is still tolerable at this volume, or whether it's worth pulling phase 10 (admin console) forward — re-evaluate once this phase's actual content volume is known, don't assume.

## Open questions

- Who reviews non-Hindi translations? Not decided yet.
- Does category #2 reuse the same 4-character cast, or does it need a 5th character? Check `specs/branding-and-voice.md`'s cast table against the category's likely phrases before assuming reuse.
