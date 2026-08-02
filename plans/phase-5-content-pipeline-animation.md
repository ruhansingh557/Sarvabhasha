# Phase 5 — Content pipeline & animation (fal.ai)

**Status:** 🚧 in progress — pilot complete for the 5 greetings phrases (Dadi + Neighbour only), re-encoded down to demo-friendly file sizes; Parent/Kid character references now exist and are approved, other categories not started

## What shipped (2026-08-02 pilot)

All 5 `greetings` phrases now have a real, approved, `live` fal.ai animation clip, replacing what was a placeholder-only slot. `phrases.getDetail` does NOT yet serve these to the mobile app — that wiring is explicitly the next step, see "What's left" below.

**Character references**: Dadi and Neighbour only (Parent and Kid still ungenerated — needed once a category requiring them goes live). Each has a locked front/three-quarter/profile set:
- Front generated via `fal-ai/flux/dev` (text-to-image, the anchor).
- Three-quarter and profile generated via `fal-ai/flux-pro/kontext` (single-image *edit* of the front — "keep this exact character, change only the camera angle." This is what locks identity across angles, confirmed working well visually).

**Animation pipeline** (`packages/backend/convex/fal/`):
- `lib.ts` — shared `queue.fal.run` client (submit → poll `status_url` → fetch `response_url`), plain `fetch`, matching this codebase's `bhashini/tts.ts` convention. Polling, not webhooks (a webhook+signature-verification approach was considered — see "Open decision" below — but polling was sufficient at this volume and is what shipped).
- `characters.ts` — `generateCharacterReferences`, `upsertCharacter`, and the exported `CHARACTER_BIBLE` (full character descriptions) + `STYLE_ANCHOR` (the style prompt fragment, still written toward the original flat-outline ask — see the Art Direction revision in `specs/branding-and-voice.md`; left as-is since changing the prompt text doesn't change what the model actually outputs).
- `animations.ts` — `generateAnimationForPhrase` (one phrase: keyframe via `fal-ai/flux-pro/kontext/max/multi` conditioned on BOTH characters' references, then image-to-video via `fal-ai/kling-video/v2.5-turbo/pro/image-to-video`, then the existing `recordAnimation` mutation — lands as `draft`, nothing here auto-approves). `PHRASE_BEATS` is a hand-authored three-beat (SETUP/PHRASE/REACTION) breakdown per phrase, grounded in each phrase's `situation`/`sourceText`, not invented. `generateAnimationsForPhrases` fans a batch out via `ctx.scheduler` (see the bug note below for why).

**Real bugs found and fixed during the pilot** (worth knowing before touching this code):
1. **Missing-character bug**: `PHRASE_BEATS`'s `other` field (which second character appears alongside the speaker) was hardcoded to `'neighbour'` for every entry. For the two phrases where `speakerCharacter` is *also* `'neighbour'` (kaise-ho-how-are-you, shubh-prabhat-good-morning), `speaker === other`, so both keyframe reference-image slots resolved to the same character and the second character silently never appeared in the scene. Fixed by correcting `other` per-phrase, plus a runtime guard in `generateAnimationForPhrase` that now fails loudly (before spending on generation) if `speaker === other` again.
2. **Trait bleed-over bug**: even with both correct reference images supplied, `flux-pro/kontext/max/multi` has no structural way to label which image is which character — it's array position + prose only, confirmed against fal.ai's live schema. Without explicit labeling, the model can blend features across the two people; the observed failure was Dadi picking up Neighbour's moustache. Fixed by explicitly prefixing the prompt with "REFERENCE IMAGE 1 shows {name}: {trait anchor}" / "REFERENCE IMAGE 2 shows..." plus a direct named negative constraint on the specific trait that leaked. Confirmed fixed by direct visual re-inspection (frame extraction) after the fix.
3. **Batch-wrapper false failure**: the original batch call awaited all 5 phrase generations sequentially inside one outer action. Every individual generation succeeded and persisted, but the *outer* action's cumulative runtime got killed by the Convex platform before it could return its own summary — surfacing as a generic, misleading "✖ Failed... Error" after all the real work had already committed. Fixed by switching to `ctx.scheduler.runAfter` per phrase (staggered 5s apart) instead of one long-lived awaiting action.

## Verification performed

Every clip was independently downloaded and visually reviewed frame-by-frame (not just trusted from the generation response) before approval — the missing-Dadi bug and the moustache-bleed bug were BOTH caught this way, not by the generating agent's own self-report. `animations:approveAnimation` was run for the one correct clip per phrase; extra/broken draft attempts were left as unapproved `draft` rows rather than deleted (harmless — client queries only ever read `live`).

## Cost — full accounting, this pilot

| Item | Count | Unit | Subtotal |
|---|---|---|---|
| Character references (Dadi ×2 attempts — one accidental duplicate, Neighbour ×1) | 3 | $0.105 | $0.315 |
| Animation generations (keyframe $0.08 + 10s Kling video $0.70) | 9 | $0.78 | $7.02 |
| **Total spent** | | | **$7.335** |

Of the 9 animation generations: 5 are the live, usable clips ($3.90). 4 were wasted — 2 from the missing-character bug (kaise-ho, shubh-prabhat, first attempts), 1 from the moustache-bleed bug (kaise-ho attempt 2), and 1 from an unnecessary diagnostic duplicate on phir-milenge-goodbye ($3.12 total). Character-ref spend was all usable except one accidental duplicate generation. **Takeaway for future batches**: budget roughly 1.5-2x the "clean" per-clip cost to account for iteration — this pilot's real bugs (not flakiness) each cost a genuine retry.

## What shipped (2026-08-02, mobile wiring)

`phrases.getDetail` now resolves each phrase's live animation to a signed URL (`animationUrl: string | null`) via a new `getLiveAnimation` helper in `lib/liveContent.ts` — independent of the per-language translation/audio gate, since animation is `phraseId`-keyed. `PhraseDetailScreen` has a real `expo-video` player (`features/learn/components/PhraseAnimationPlayer.tsx`, first use of `expo-video` in the app): loops, muted, pauses on nav-away, themed loading spinner while the clip fetches, falls back to the existing placeholder when `animationUrl` is null (still most phrases). **Verified live in the iOS Simulator** — confirmed actually animating (not a frozen frame) by comparing two screenshots taken a few seconds apart.

## What shipped (2026-08-02, clip re-encode)

All 5 live clips re-encoded (720p, H.264 `libx264`, CRF 26, `scale=720:-2` to preserve the original ~0.54 aspect ratio, `-an` since the clips never had an audio track, `+faststart`) and re-uploaded via `scripts/upload-animation.ts` with a manifest built directly from the existing `animations` table rows (model/rate/duration/prompt read back via `convex data animations --format jsonArray`, not hand-transcribed, to avoid corrupting the reproducibility metadata). Each new draft was approved via `animations:approveAnimation`, which archived the corresponding oversized original per phrase — one live row per phrase, as before. Sizes: 10–15MB → 0.6–1.2MB per clip (roughly 90%+ smaller). Verified both by direct frame-extraction comparison against the original (visually indistinguishable at delivery resolution) and by reloading a phrase in the iOS Simulator to confirm the new signed URL actually fetches and plays.

No new fal.ai generation spend — this re-encoded existing footage rather than regenerating it. (`scripts/upload-animation.ts` prints an "estimated generation spend" line based on `rate × duration × attempt` regardless of whether fal.ai was actually called, which read as $3.50 for this batch — that number is an artifact of the script assuming its caller always just generated the clip; ignore it here.)

## What shipped (2026-08-02, Parent and Kid character references)

`CHARACTER_BIBLE` and `CharacterSlug` widened to include `parent` and `kid`, both authored fresh (the cast table in `specs/branding-and-voice.md` only had role/personality, no physical description) at the same level of detail as Dadi/Neighbour, grounded in the `STYLE_ANCHOR` and the existing two characters' register. Parent is written as Dadi's daughter — a mother, chosen over a father so the cast doesn't end up with three men's-register designs against Dadi alone on the women's side (documented as a code comment in `characters.ts` alongside the entry). Kid reads as a ~9-year-old boy, deliberately smaller/rounder-proportioned than both adults so scale alone signals "child."

**Real bug found and fixed**: Kid's FRONT image (the anchor `flux/dev` text-to-image generation) came back soft/out-of-focus across **4 consecutive full-batch regenerations** — every other character's front, and both of Kid's own Kontext-edited angles (three-quarter, profile, sourced from that same soft front each time), came out sharp every time. This ruled out random flakiness: something about `flux/dev`'s text-to-image pass specifically mis-rendered this prompt, while Kontext's image-*edit* pass (re-rendering from a source image + instructions, not literally sharpening) did not inherit the blur even when editing the blurry front. Two things changed: (1) `FRONT_BACKGROUND`'s "even **soft** daylight lighting" was reworded to "bright even daylight lighting, sharp focus throughout... no depth-of-field blur" — a plausible trigger word, though this alone did not fix a subsequent attempt; (2) added `regenerateFrontFromAngle`, a new `internalAction` that Kontext-edits an existing sharp angle image (e.g. three-quarter) back to a front-facing pose instead of re-rolling the full `flux/dev` + 2×Kontext generation — one $0.04 call instead of $0.105, and it reuses the two already-good images rather than gambling on all three again. This is now the documented repair path for this specific failure mode, not a one-off hack.

Every image (Parent's 3 angles, Kid's 3 angles post-repair) was independently downloaded and visually reviewed — same discipline as the animation pilot — before being treated as approved. Nothing downstream (no phrases, no keyframes, no animations) consumes Parent or Kid yet.

**Cost**: Parent $0.105 (first attempt, no issues). Kid: 4 full-batch attempts at $0.105 each ($0.42, all discarded except the sharp three-quarter/profile pair from the 4th) + one $0.04 targeted front repair = $0.46. **Total this pass: $0.565** — well over the ~$0.21 "clean" estimate quoted going in, consistent with this phase's established "budget 1.5-2x for iteration" lesson, though this particular overrun (4 identical soft-front attempts before trying a structurally different fix) is worth reading as "stop re-rolling after 2 identical failures and change approach" rather than just "iteration costs more."

## What's left in this phase

1. **No phrases or animations exist yet for Parent/Kid** — the character references are pure setup. Building `Family`, `Food & Market`, or another category on top of them (translations, audio, `PHRASE_BEATS`, keyframes, clips) is a separate, not-yet-started pass, deliberately deferred again this round in favor of closing out tooling/stability work.
2. **`generationJobs` table remains unused** — this pilot wrote results directly via `recordAnimation`, no job-queue tracking. Fine at this volume; revisit if/when batches get large enough that a queryable job-status table (vs. reading Convex logs) actually matters.
3. `animations.ts`'s two `TODO(auth)` markers are now resolved — `generateUploadUrl` requires an authenticated app user, `approveAnimation` derives the approver from the caller's identity. Role-based (admin-only) restriction is still deferred to phase 10 / `apps/admin`, which doesn't exist yet. Closing this broke `scripts/upload-animation.ts`'s and this session's own CLI-driven approval workflow (both acted as an unauthenticated/deploy-key caller with no app-user session); fixed by adding `generateUploadUrlInternal`/`approveAnimationInternal` — `internalMutation`s reachable only via `convex run`/the scheduler, never any client — as the trusted ops path, and pointing the upload script's upload-url step at `convex run` instead of the public mutation.
4. `STYLE_ANCHOR` in `characters.ts` still describes the original flat-outline look, contradicting the soft-shaded direction the spec actually locked in (see the Art Direction revision note in `specs/branding-and-voice.md`). Deliberately left as-is — it's baked into all four characters' already-approved production references, and changing the prompt text doesn't change what the model outputs anyway (confirmed earlier this phase). Worth a dedicated pass if it ever needs revisiting, not a blocker.

## Open decision, not yet made

Whether to move from polling to a webhook-based fal.ai integration (there's a verified pattern for this from a sibling project, `chitrakatha`, including its own accepted-but-unresolved gap around webhook signature verification). Not needed at this volume (5 clips); worth revisiting if/when this needs to scale to generating many clips concurrently.
