# Phase 6 — AI Tutor

**Status:** 🚧 in progress — backend done; mobile UI built and redesigned voice-primary (this session); `specs/ai-tutor.md` needs a refresh pass to match; phase 8's real age-gating/consent flow (beyond the minimal birth-year prompt shipped here) is still open.

## Mobile UI — voice-primary redesign (this session, second pass)

The first mobile pass (below, "Mobile UI — done") shipped a text-only chat screen. Live in-Simulator verification of that build surfaced two things that changed direction:

1. **A real layout bug**: the persona header (small avatar + name) had no safe-area top-inset handling and rendered cramped under/behind the status bar. Traced to `Screen.tsx`'s shared shell also having no `useSafeAreaInsets` anywhere — a pre-existing, app-wide gap (Home/Learn/Profile/Auth all show the same status-bar overlap), not unique to Tutor. Fixed locally in the two tutor views this pass touches (`VoiceTutor.tsx`, `TutorChat.tsx`) via a direct `useSafeAreaInsets` call each; **`Screen.tsx` itself and every other screen still have the underlying gap** — worth a dedicated follow-up pass across the app, out of scope here.
2. **The product-owner decision**, after seeing the chat UI running live: "language is best learned from talking" — the tutor becomes voice-primary. Large centred avatar, push-to-talk mic, spoken replies. Text stays as an explicit, fully-functional "Type instead" fallback (never removed) specifically *because* Bhashini is documented (root `CLAUDE.md`) as "free, but slow and flaky" — a voice-only tutor with no recourse on a garbled transcription would be a regression, not an upgrade.

**New backend, built alongside (by `convex-engineer`, in the same session):**
- `bhashini/tutorSpeech.ts` — `synthesizeTutorReply({text, languageCode, characterSlug})`, live Bhashini TTS for tutor replies specifically (distinct from `tts.ts`'s authoring-time-only lesson audio) — synthesize-and-discard, not persisted, mirroring `asr.ts`'s own "transcribe-and-discard" shape in the opposite direction.
- `tutorMessages.expression` — the previously-scaffolding-only field is now actually persisted on Gemini-sourced assistant rows and returned by `listMessages`, closing the gap the first pass's backend section flagged.
- `ASR_LANGUAGES`/`TTS_LANGUAGES` relocated from `packages/backend/convex/bhashini/{asr,tts}.ts` into `packages/shared/src/constants.ts`, both now exported — the mobile client needs to know per-language voice coverage to decide whether to offer the mic at all, and mobile can't safely import Convex-server-only source files directly (action wrappers, `_generated/server`), so the two sets moved to the cross-runtime-safe package instead of being duplicated client-side.

**Mobile architecture** (`apps/mobile/src/features/tutor/`):
- `hooks/useTutorConversation.ts` — session bootstrap, message list, credits/paywall, age-gate routing, and one `sendText(text)` entry point, lifted out of the old `TutorChat` component body so BOTH the voice view and the text fallback share exactly one copy (no risk of the two drifting on how credits-exhausted or the reply-timeout is handled).
- `components/TutorConversation.tsx` — owns the `voice`/`chat` mode switch; forces `chat` regardless of the learner's own toggle when `supportsVoiceTutor(languageCode)` is false (computed at render time from the shared `ASR_LANGUAGES`/`TTS_LANGUAGES` sets — no mic ever offered for a language with no coverage, rather than one that's offered and always fails).
- `components/VoiceTutor.tsx` — the new default view: hero avatar (`TutorAvatarPlayer`'s `size="hero"`, up to 224pt, vs. the original 56–72pt chat-header badge — same component, two sizes), push-to-talk mic, last-exchange caption (voice-primary still surfaces the target-script text, doesn't hide it), "Type instead" always reachable top-right.
- `hooks/useVoiceTurn.ts` — the `idle → recording → transcribing → sending → speaking → idle` state machine. Built as persisted state + effects reacting to the shared conversation's own `messages`/`sendErrorTag`, not a hand-rolled promise bridge across hook boundaries — an early draft tried the promise-bridge approach for the "wait for the reply" step and had a real one-render race, documented in the hook's own comment as the reason for the current shape.
- `hooks/useAudioRecording.ts` — push-to-talk mechanics on `expo-audio` (`useAudioRecorder`, mono/16kHz `RecordingOptions` tuned for speech — Android's `MediaRecorder` backing has no raw-PCM/WAV output option at all, so the recording stays AAC/`.m4a`; if Bhashini's ASR turns out to need WAV specifically, that's a real follow-up, not something guessable further client-side). Owns every corner case in the brief: mic-permission remember-the-denial-this-session (`store/micPermissionStore.ts`, deliberately not MMKV-persisted), 25s max-duration auto-stop, <400ms near-zero-duration short-circuit (skips the ASR call entirely), an `AppState` listener that stops+discards mid-recording on backgrounding and notifies the state machine to snap back to idle immediately, and a busy/finished-ref guard against double-tap and the manual-stop-vs-auto-stop-timer race.
- `hooks/useTutorReplyAudio.ts` — `synthesizeTutorReply` + `expo-audio` playback of the base64 WAV reply (written to a cache-dir temp file via the new `expo-file-system` dependency, `/legacy` API for its simple `base64` encoding option — the new `File`/`Directory` class API's base64 methods weren't confidently identifiable from the installed types without more digging, so `/legacy` was the lower-risk choice). `speak()`'s returned promise resolves only once playback actually finishes (via the player's `didJustFinish` status), not once it starts — see the hook's own comment for the race this avoids.
- `TutorChat.tsx` — the original text-only view, preserved as the fallback rather than deleted, adapted to take the shared `conversation` object as a prop instead of computing its own session/messages, plus a "Switch to voice"/"voice unavailable in this language" affordance.

**New mobile dependency:** `expo-file-system` (`~56.0.8`, `expo install`'d) — the app's first use of it, needed to bridge base64 audio (both directions: ASR upload, TTS playback) to/from a file URI.

**What's verified vs. not, as of this pass:** typecheck clean project-wide. Live-in-Simulator verification of the ASR/send path was blocked at the very last step by an unrelated, pre-existing issue — the configured `GEMINI_API_KEY` was reported by Google as a leaked key (403, confirmed via `bunx convex logs`, not guessed) — so a real spoken Gemini reply has never been observed end-to-end; everything up to and including a successful ASR transcription feeding into `tutor.sendMessage` is expected to work (same `sendMessage` call the already-verified text path uses) but was last confirmed against the OLD text-only build, before this redesign. Re-verify the full voice turn once the key is replaced.

**Known follow-ups, explicitly not done this pass:**
- `Screen.tsx` and every other screen's status-bar-overlap gap (see point 1 above).
- `ASR_LANGUAGES`'s own header comment still calls its coverage "a starting assumption... VERIFY against live pipeline responses" — unchanged by this pass, just relocated.
- ASR/TTS per-day metering (`usage.kind: 'asr'`/`'tts'`, `LIMITS.ASR_PER_DAY`) remains unwired, as flagged in the original backend pass below.
- If Bhashini's ASR pipeline rejects the AAC/`.m4a` recording format, a native WAV-capable recording path would need real native work (Android's `MediaRecorder` has no built-in raw PCM output) — not attempted here.

## Mobile UI — done (first pass, text-only chat)

## Backend — done (`packages/backend/convex/`)

- **`users.setBirthYear`** — the only writer of `ageBand`; self-declared birth year → `adult`/`minor`, server clock (`Date.now()`), never leaves `unknown` once called.
- **`tutor.ts`** — `startSession` (age gate + `languages.status==='live'` check), `sendMessage` (the single-transaction gate: age re-check → lazy one-time trial grant → local template match → safety-net rate limit → credits check-and-decrement → usage increment → scheduled Gemini call, per the REVISED monetization model — one-time 10-turn trial replacing the old "5/day forever" allowance), `generateReply` (`internalAction`, Gemini `gemini-3.1-flash-lite`, structured JSON output `{reply, expression}`, rolling-summary regeneration every 8 messages), plus read-only `getSession`/`listMessages`/`getCreditsBalance` for the mobile pass.
- **`bhashini/asr.ts`** — new, plain `action` (unlike TTS's `internalAction`), transcribe-and-discard, no storage write, `{ok:false, reason:'empty_or_too_short'}` guard on near-empty transcripts. Metering (the schema's `usage` kind `'asr'` / `LIMITS.ASR_PER_DAY`) is NOT wired yet — flagged as a follow-up for whoever builds the mobile voice-input flow.
- **`packages/shared/src/constants.ts`** — `LIMITS.FREE_TUTOR_TURNS_PER_DAY` (the old model) replaced with `LIMITS.TRIAL_CREDITS` (10) and `LIMITS.SAFETY_NET_TUTOR_TURNS_PER_DAY` (200), per the revised `specs/monetization-and-limits.md`.
- Small refactor alongside: `lib/dayKey.ts` extracted from `progress.ts` (the "device-local day, server-clamped" helper) since `tutor.sendMessage`'s safety-net cap needed the identical pattern — `progress.recordViewed` now calls the shared helper instead of a private copy. `bhashini/lib.ts` extracted from `tts.ts` (pipeline URL constants + credentials) so `asr.ts` doesn't duplicate them.

**Known gap carried forward:** `tutorMessages` has no field to persist Gemini's `expression` value (`neutral | happy | encouraging | thinking`) — schema was frozen for this pass. `generateReply` requests and validates it (forces clean structured output) but currently discards it. Add a schema field when the mobile client is ready to wire it to fal.ai avatar clips.

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
