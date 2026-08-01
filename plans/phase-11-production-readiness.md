# Phase 11 — Production readiness

**Status:** ◻ not started

## Goal

Everything needed to actually ship this to the App Store / Play Store, plus the explicitly-deferred nice-to-haves that don't block earlier phases.

## Known gaps to close

- **App icon/splash are solid-color placeholders** (`apps/mobile/assets/{icon,adaptive-icon,splash}.png` — generated programmatically as flat saffron/cream rectangles during phase 1 just to unblock local dev). Real branded assets need designing, presumably alongside or after phase 5's character reference art is locked.
- **EAS project not configured** — `app.json`'s `extra.eas.projectId` was removed during phase 1 (it was a placeholder string breaking local dev's codesigning cache). A real EAS project needs setting up before any TestFlight/internal-track build.
- **`apps/mobile/package.json`'s dependency versions** — several packages showed available updates during phase 1–3's `expo install --check` runs that weren't chased (e.g. newer Expo SDK 57 exists already). Decide on an SDK-upgrade cadence rather than drifting indefinitely.

## Explicitly deferred features, parking here rather than losing track of them

- **Social/leaderboard features** — phase 3 deferred these on purpose (no friend-graph schema, "keep it simple" scope call). Revisit only if streak/badge engagement alone proves insufficient.
- **Offline download** — a candidate perk per `specs/data-model.md`'s known gaps. No schema, no client manifest design yet. Needs a `downloads` table if it happens.
- **Pronunciation scoring via Bhashini ASR** — mentioned as a future possibility in `data-model.md`; no result table exists. Would piggyback on phase 6's ASR wiring once that exists.

## Not really a "phase" so much as an ongoing practice

Once real users exist, treat `specs/_findings.md`'s triage protocol as live — this file assumes a build sequence with no users yet; once phase 11 actually ships, bug/cost findings from real usage belong there, not here.
