# Phase 10 — Admin console

**Status:** ◻ not started — `apps/admin` doesn't exist yet, not even scaffolded

## Goal

Replace the manual `npx convex run seed:approveTranslationAndAudio '{"phraseKey":...}'` + Convex-dashboard-data-browser workflow (phase 3's stopgap) with a real approval queue UI, per `specs/admin-console.md` (currently ◻, unwritten).

## What it needs to expose, minimum viable

- The `review.ts` queries already exist and are exactly what this UI reads: `getPhraseAcrossLanguages`, `getCategoryCoverage`, `getAudioReviewQueue`. They're already scoped "admin console only, never the app" — this phase is literally their first consumer.
- New mutations this phase will need that don't exist yet: promoting a `phraseTranslations`/`audioAssets` row individually (phase 3's `approveTranslationAndAudio` flips both together, which was fine at seed-data volume but is presumably too coarse for a real reviewer workflow), and fixing `animations.ts`'s two outstanding `TODO(auth)` markers (`generateUploadUrl`, `approveAnimation`) since this UI would be the first thing making them reachable by someone other than the developer running `convex run` by hand.
- Per root `CLAUDE.md`'s tech table: Vite + React content console. Not Expo, not React Native — a separate web app in `apps/admin`.

## Reasonable trigger to pull this phase forward

If phase 4 or 5's content volume makes the manual dashboard-flip workflow genuinely painful before phases 6–9 are done, it's fine to do this phase out of order — the numbering here is a default sequence, not a strict dependency chain past phase 3.
