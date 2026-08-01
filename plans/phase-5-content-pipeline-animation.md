# Phase 5 — Content pipeline & animation (fal.ai)

**Status:** ◻ not started — blocked on external setup, not just code

## Goal

Replace the Learn tab's "animation coming soon" placeholder with real fal.ai-generated video, per `specs/branding-and-voice.md` and `specs/data-model.md`'s animation table design.

## Hard prerequisites (in order — nothing after step 1 can start without it)

1. **Character reference images for the four-character cast** (Dadi, Parent, Kid, Neighbour) — per `branding-and-voice.md`, this is explicitly "the first pipeline task — the bible is unusable until they exist." Not yet generated. Needs a locked front/three-quarter/profile reference set per character, approved by the project owner before any category batch.
2. **A fal.ai API key** — not yet configured (see root `CLAUDE.md`'s cost table: $0.05–$0.20/sec, 8–10s clips, image-to-video from a FLUX keyframe conditioned on the character references from step 1).
3. Decide whether a style LoRA is needed or FLUX reference conditioning alone is sufficient — explicitly unresolved in `branding-and-voice.md`, to be settled during the pilot.

## What the code side needs (once the above unblocks it)

- `generationJobs` table exists in schema but is currently **unused** — `animations.ts`'s header comment notes upload today is entirely manual (fal.ai playground + `scripts/upload-animation.ts`). Building the actual job queue/workflow (per `specs/content-pipeline.md`, currently unwritten) is part of this phase.
- Fix `animations.ts`'s two outstanding `TODO(auth)` markers (`generateUploadUrl` has no restriction, `approveAnimation`'s `approvedBy` is a raw client arg) before any of this is reachable outside a trusted admin session.
- Mobile: swap `PhraseDetailScreen`'s static placeholder for a real `expo-video` player (currently an installed, zero-usage dependency) once `phrases.getDetail` is extended to include the live animation's signed URL (it deliberately does NOT query `animations` today — that was phase 3's explicit scope cut).
- Author `specs/content-pipeline.md` (currently ◻ in `specs/_index.md`) once the actual pipeline shape is decided — this phase is exactly the kind of new-behavior work that spec is supposed to capture.

## Cost note

Every phrase's animation is generated **once** and reused across all 22 languages (schema's "structural decision 1") — getting this phase's `phraseId`-not-`phraseTranslationId` attachment wrong multiplies the bill by 22. It's already correct in the schema; just don't build a parallel path that violates it.
