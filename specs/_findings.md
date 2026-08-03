# Findings — triage backlog

> **Candidate** bugs, cost risks, and cleanup items surfaced while authoring specs or reviewing code. **Nothing here is confirmed work** — these are leads, not tickets.

## Protocol — read before taking an item

1. **Claim it.** Put your name/handle in the `Owner` column *before* you start. An unclaimed row is fair game; a claimed one is not.
2. **Reference the ID** (`F-001`) in your branch name and PR title.
3. **Delete the row** when the fix merges. This file shrinks over time — it is not a changelog.
4. **Disagree freely.** If a finding is wrong or not worth fixing, delete it with a one-line note in the PR. Don't leave dead rows.
5. **Adding a finding:** next sequential ID, a `file:line` reference, and a severity. One line of description. If it needs a paragraph, it needs a spec or an issue, not a row here.

Severity guide:

| | Meaning |
|---|---|
| **high** | Data leak, missing auth check, absent rate limit on a metered call, or anything that can run up spend or ship wrong lesson content |
| **med** | Wrong behaviour a user would notice; unindexed query on a growing table |
| **low** | Cleanup, dead code, minor inefficiency |

**A missing or non-functioning limit on Gemini or fal.ai is always `high`**, regardless of how unlikely the path looks. Those are the two dependencies that bill per call.

---

## Potential bugs

| ID | Severity | Description | Reference | Owner |
|----|:--------:|-------------|-----------|-------|
| F-001 | med | `Screen.tsx`'s shared shell has no `useSafeAreaInsets` handling — every screen's top content can render under/behind the status bar. Patched locally in the two Tutor views (`VoiceTutor.tsx`, `TutorChat.tsx`) this session; the underlying app-wide gap (Home/Learn/Profile/Auth) is untouched. | `apps/mobile/src/shared/components/atoms/Screen.tsx` | — |

## Performance / cost opportunities

| ID | Severity | Description | Reference | Owner |
|----|:--------:|-------------|-----------|-------|
| F-002 | low | Tutor ASR/TTS calls (`bhashini/asr.ts`, `bhashini/tutorSpeech.ts`) are unmetered — `usage.kind: 'asr'`/`'tts'` and `LIMITS.ASR_PER_DAY` are reserved in schema but no mutation checks/increments them. Bhashini is free so this isn't a billing risk, but it's an open abuse/rate-limit gap now that a real mobile voice UI calls both. | `packages/backend/convex/bhashini/asr.ts`, `bhashini/tutorSpeech.ts` | — |

## Content quality

> Findings about the *content*, not the code: a clip that fails the mute test, a phrase that's unnatural in a target language, a character that drifts off the bible. Raised by reviewers in the admin console.

| ID | Severity | Description | Language / Category | Owner |
|----|:--------:|-------------|---------------------|-------|
| — | — | *No findings yet.* | — | — |
