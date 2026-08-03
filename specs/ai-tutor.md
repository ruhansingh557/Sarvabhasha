# AI Tutor

> **Status:** Backend and mobile both built, in the SAME session, across two passes. The Convex conversation engine (`packages/backend/convex/tutor.ts`) enforces its own limits transactionally. The mobile tutor is **voice-primary**: a real Tutor tab with push-to-talk recording, spoken replies, and a large centred avatar (`apps/mobile/src/features/tutor/components/VoiceTutor.tsx`) — not the chat-only placeholder an earlier draft of this spec described. Text chat still exists, demoted to an always-reachable "Type instead" fallback (`TutorChat.tsx`), not removed. **Not yet verified:** a full voice turn ending in an actual spoken Gemini reply has never been observed live — see "What's still not verified" below.

## Purpose and scope

The AI tutor is free-form conversational practice in the learner's target language, layered on top of the fixed lesson content in Learn. Where a lesson phrase is authored once and never changes, the tutor lets a learner produce their own sentences and get a reply in character, from a persona built out of the same cast the learner already recognises from the lesson clips.

The tutor is **voice-primary by deliberate product decision**, not by default: "language is best learned from talking," reached after the project owner reviewed the first (chat-only) build running live. Push-to-talk is the default surface — tap the mic, speak, tap again, Dadi replies out loud. Text was NOT removed, on purpose: root `CLAUDE.md` documents Bhashini as "free, but slow and flaky," and a voice-only tutor with zero recourse when a transcription comes back garbled would be a worse experience than the chat-only build it replaced as the default. "Type instead" stays one tap away at all times.

This spec covers: the persona system, the `startSession` → `sendMessage` → `generateReply` conversation flow, local intent short-circuiting, age gating as a precondition, history/summary management, the now-real `expression` field, the voice-primary mobile architecture and its push-to-talk state machine, and per-language voice-support gating.

Does not cover:
- The money model — trial credits, the ₹50 pack, consumption order, receipt verification. See [`monetization-and-limits.md`](monetization-and-limits.md); this spec only describes tutor *behavior*, referencing that spec's enforcement rules where the two meet.
- The cast's visual identity, tone table, and hard lines on comedy/caricature. See [`branding-and-voice.md`](branding-and-voice.md); persona voice fragments are quoted from there, not re-derived.
- ASR as a Bhashini capability in general (pipeline languages, authoring-time TTS). See [`bhashini-speech.md`](bhashini-speech.md).

## Why personas reuse the cast, not new personalities

The tutor's persona `voice` fragments are lifted from the same four characters the learner watches in lesson clips — Dadi, Parent, Kid, Neighbour — not written fresh for the tutor. [`PERSONAS`](../packages/backend/convex/tutor.ts#L40-69) hard-codes each fragment with a comment stating it is "ported from `specs/branding-and-voice.md`'s cast table (not invented)." The reasoning: a learner who has just watched Dadi scold someone affectionately in a lesson clip should get the *same* Dadi in chat, not a generic tutor persona that happens to share a name. Continuity of character is the point — see `branding-and-voice.md`'s naming strategy ("the brand a user recognises is the character, not the word").

| Persona key | Display name | Voice register (condensed) |
|---|---|---|
| `dadi` (default) | Dadi | Warm, direct, mildly bossy; the authority on courtesy, corrects with affectionate confidence |
| `parent` | Parent | Practical, busy, mid-errand; plain and to the point |
| `kid` | Kid | ~9 years old, curious, literal, a comic engine, never mocking the learner |
| `neighbour` | Neighbour | Easygoing outside world — vendor, stranger, passer-by |

`DEFAULT_PERSONA_KEY = 'dadi'` — [tutor.ts:71](../packages/backend/convex/tutor.ts#L71) — matches `branding-and-voice.md`'s tone table, which names Dadi as the default "to reinforce the cast." A session's `personaKey` is chosen at `startSession` and is fixed for that session; there's no mutation to change persona mid-session.

## Conversation flow

```
startSession(languageCode, personaKey?)
  → assertAdult(user)                     age gate, hard precondition
  → language must exist and be status:"live"
  → insert tutorSessions row, personaKey defaults to "dadi"
  → returns sessionId

sendMessage(sessionId, text, dayKey)      ONE transaction, see below
  → assertDayKeyFresh(dayKey)              rejects a client clock drifted >1 day
  → text = text.trim(); throw if empty
  → assertAdult(user)                     re-checked, not trusted from startSession
  → session lookup; throw if missing or not this caller's
  → lazily grant trial credits row if none exists
  → detectIntent(text)?
      yes → template reply, insert both rows as source:"template", return {kind:"template"}
      no  → safety-net check → credits check+decrement → usage increment
            → insert user message (source:"gemini")
            → ctx.scheduler.runAfter(0, internal.tutor.generateReply, {sessionId})
            → return {kind:"scheduled", messageId}

generateReply(sessionId)                  internalAction, runs after sendMessage commits
  → load session + last TUTOR_HISTORY_WINDOW (16) messages
  → build system prompt from persona + languageCode + rollingSummary
  → call Gemini (structured JSON: {reply, expression})
  → insert assistant message (source:"gemini", model, tokensIn, tokensOut)
  → every 16 messages once ≥32 exist: regenerate rolling summary for the block that just fell out
```

`startSession` is [tutor.ts:192-224](../packages/backend/convex/tutor.ts#L192-224); `sendMessage` is [tutor.ts:295-421](../packages/backend/convex/tutor.ts#L295-421); `generateReply` is [tutor.ts:663-714](../packages/backend/convex/tutor.ts#L663-714).

### Local intent short-circuit

Before any credit, usage, or Gemini call is touched, `sendMessage` runs [`detectIntent`](../packages/backend/convex/tutor.ts#L145-150) against the raw text — a small set of regexes for `greeting`, `goodbye`, and `encouragement`, matching English plus script/romanized forms across the six live launch languages ([`INTENT_PATTERNS`](../packages/backend/convex/tutor.ts#L103-113)). A match returns a canned [`TEMPLATE_REPLIES`](../packages/backend/convex/tutor.ts#L115-143) string in the session's language, and both the user and assistant rows are inserted with `source: "template"`. This is explicitly a cost saver, not the primary UX — "most turns still go to Gemini" per the code comment — ported conceptually from `learn-bharat`'s `detectIntent`. Template turns never reach Gemini, never decrement credits, and never increment the `usage` counter (see Cost & limits).

### Why the age gate is checked twice

`assertAdult` runs once in `startSession` and again, independently, in every `sendMessage` call ([tutor.ts:83-92](../packages/backend/convex/tutor.ts#L83-92)). The comment calls this "defense in depth... not trusting that `startSession` was ever called for this session, or that the user's band hasn't changed (e.g. consent revoked) since." A session created while a user was `adult` doesn't grandfather them in if their band changes later — every message re-derives eligibility from the current `users` row.

## Age gating as a hard precondition

The tutor has no reachable path for `ageBand: "unknown"` or `"minor"`:

| `ageBand` | `startSession` / `sendMessage` behavior |
|---|---|
| `unknown` | Throws `AGE_GATE_REQUIRED: tell us your birth year before using the tutor.` — blocks entirely. |
| `minor` | Throws `PARENTAL_CONSENT_REQUIRED: the tutor needs parental permission for under-18 learners — coming soon.` |
| `adult` | Proceeds normally. |

`ageBand` is set exactly once per transition by [`users.setBirthYear`](../packages/backend/convex/users.ts#L131-148), the sole writer of the field. It computes age from the server's own `Date.now()` (never a client-supplied "now") against a self-declared `birthYear`, and always resolves to a real band — never leaves it `unknown` once called.

This is a deliberate, scoped-down build decision, not an oversight. Per [`plans/phase-8-onboarding-age-gating.md`](../plans/phase-8-onboarding-age-gating.md)'s 2026-08-03 entry, the original plan was to gate the entire tutor build behind a full phase-8 onboarding/consent redesign. That was pulled back: phase 6 (this build) ships only a **minimal** birth-year prompt — surfaced the first time a user opens the Tutor tab, following phase 3's precedent of a tab-triggered CTA rather than pre-app onboarding — enough to make the tutor legally reachable for the realistic pre-launch majority case (self-declared adults). The actual verifiable-parental-consent mechanism for `minor` is explicitly deferred to a real phase 8; a `<18` learner sees a "coming soon" gate, not a working consent flow, and that gate is a real product gap by design, not a bug to quietly patch.

This gating model is the same one [`monetization-and-limits.md`](monetization-and-limits.md) documents from the money side (the `adult`/`minor`/`unknown` table, DPDP rationale, self-declaration as an accepted risk) — read that spec for the *why regulate this at all*; this spec only documents where the code enforces it.

## The ASR-charity design decision

Voice input to the tutor is meant to go Bhashini ASR → text → Gemini (root `CLAUDE.md` rule 12 — raw audio never reaches Gemini). A transcript coming out of ASR can contain real errors: missing words, homophone substitutions, garbled fragments. The design choice recorded in [`buildSystemPrompt`](../packages/backend/convex/tutor.ts#L523-551) is to **not** run a second, separate LLM call to clean up the transcript before sending it to Gemini for a reply. Instead, the system prompt itself instructs Gemini to interpret the learner's message charitably — infer the likely intended meaning, and only ask for clarification if the message is "truly incomprehensible, not merely imperfect" ([tutor.ts:538-541](../packages/backend/convex/tutor.ts#L538-541)).

The stated reason is cost: a cleanup pass would be a second billed Gemini round-trip per voice turn, doubling the cost of every voice-originated message for a problem the same model can absorb inline for free as part of generating its reply anyway.

The one guard that **is** enforced sits upstream, in ASR itself, not in the tutor: [`transcribeSpeech`](../packages/backend/convex/bhashini/asr.ts#L119-148) rejects a transcript below `MIN_TRANSCRIPT_LENGTH` (2 characters after trimming) as `{ ok: false, reason: 'empty_or_too_short' }` ([asr.ts:41-42](../packages/backend/convex/bhashini/asr.ts#L41-42), [asr.ts:138-141](../packages/backend/convex/bhashini/asr.ts#L138-141)). That's a noise filter at the transcription boundary — it stops empty/near-empty audio from ever reaching the tutor as a "message" — not a correctness pass on real but imperfect speech, which is what the charitable-interpretation instruction is for instead.

## History management

`generateReply` sends Gemini only the last `LIMITS.TUTOR_HISTORY_WINDOW` messages (16, i.e. 8 user+assistant turns — [constants.ts:44-48](../packages/shared/src/constants.ts#L44-48)) via [`getRecentMessagesDesc`](../packages/backend/convex/tutor.ts#L432-443), plus the session's `rollingSummary` if one exists, folded into the system prompt ([tutor.ts:547-549](../packages/backend/convex/tutor.ts#L547-549)). This is the mechanism behind root `CLAUDE.md` rule 12's "cap tutor history at the last 8 turns plus a rolling summary — unbounded history makes cost grow quadratically," and the schema comment on `tutorSessions.rollingSummary` calls it out as "THE cost control" ([schema.ts:236-239](../packages/backend/convex/schema.ts#L236-239)).

The summary is **not** regenerated every turn. `generateReply` counts total session messages after inserting the reply, and only regenerates once a full window's worth has fallen out since the last regeneration — the condition is `total >= 2*window && total % window === 0` (32, 48, 64, ... messages), explicitly not at 16 itself, because "the first window hasn't pushed anything out yet" ([tutor.ts:695-699](../packages/backend/convex/tutor.ts#L695-699)). When it fires, [`summarizeFallingOutBlock`](../packages/backend/convex/tutor.ts#L627-654) makes one additional plain-text Gemini call over just the falling-out block (not the whole history) and appends the result to whatever summary already existed, via [`appendRollingSummary`](../packages/backend/convex/tutor.ts#L495-502). This summary call is a second Gemini hit, but only once every 16 messages, not every turn — batching is what keeps it cheap.

## The `expression` field — now real

Gemini's structured JSON response schema requires both `reply` and `expression`, the latter constrained to `neutral | happy | encouraging | thinking` (`EXPRESSIONS`, `schema.ts`'s exported `tutorExpression` validator). `callGemini` parses and validates it, falling back to `'neutral'` if Gemini returns something outside the enum.

**Persisted and consumed, as of the voice-primary pass.** `tutorMessages.expression` is now `v.optional(tutorExpression)` in `schema.ts`, `insertAssistantMessage` accepts and stores it, and `listMessages` returns it to the client. Mobile consumes it in `VoiceTutor.tsx`: while a reply is being spoken aloud, the avatar loops the clip matching that specific message's `expression` (falling back to `'neutral'` for template replies and any row predating this change, which have none). Dadi's four expression clips (`neutral`/`happy`/`encouraging`/`thinking`) are real, approved `personaAnimations` rows generated via fal.ai this session (~$4.29 total spend) — see `plans/phase-6-ai-tutor.md` for the generation notes (reroll counts, prompt fixes).

## Voice-primary mobile architecture

`apps/mobile/src/features/tutor/`:

- **`hooks/useTutorConversation.ts`** — the single source of truth both views share: session bootstrap (`startSession`), the message list (`listMessages`), credits/paywall state, age-gate routing, and one `sendText(text)` entry point. Neither `VoiceTutor` nor `TutorChat` compute their own session or messages — this is what guarantees the two views can never disagree about e.g. whether credits are exhausted.
- **`components/TutorConversation.tsx`** — owns the `voice`/`chat` mode switch. `mode` defaults to `'voice'` but the *effective* mode is forced to `'chat'` whenever `supportsVoiceTutor(languageCode)` is false — computed from `@sarvabhasha/shared`'s `ASR_LANGUAGES`/`TTS_LANGUAGES` sets at render time, not in an effect, specifically so a language with no voice coverage never flashes a mic button that's guaranteed to fail before falling back.
- **`components/VoiceTutor.tsx`** — the default view: a large centred `TutorAvatarPlayer` (`size="hero"`), a status caption reflecting the current phase, the last exchange's text underneath (voice-primary still shows the target-script spelling — it isn't text-invisible), and one push-to-talk mic button. "Type instead" is a small, always-visible top-corner link, not buried in a menu.
- **`hooks/useVoiceTurn.ts`** — the push-to-talk state machine: `idle → recording → transcribing → sending → speaking → idle`. Built as persisted state plus an effect watching the shared conversation's own reactive `messages`, not a hand-rolled promise chain — the "wait for the reply" step depends on Convex's own update timing (instant for a template match, whenever `generateReply` finishes for a Gemini one), which a promise bridge can't reliably wait on without a real race.
- **`hooks/useAudioRecording.ts`** — recording mechanics only (no ASR, no send, no playback), on `expo-audio`, mono/16kHz tuned for speech. Owns every corner case: mic-permission denial remembered for the rest of the app session (`store/micPermissionStore.ts`, deliberately not MMKV-persisted — a fresh app launch asks again) so the OS dialog never re-fires on every tap after a "don't allow"; a 25s max-duration auto-stop (a conversational turn, not a voice memo); a <400ms near-zero-duration short-circuit that skips the ASR call entirely rather than sending a guaranteed-empty transcript; an `AppState` listener that stops and discards an in-flight recording the instant the app backgrounds (phone call, home button, notification) and tells the state machine to snap back to `idle` immediately, rather than leaving "Listening…" showing over a recording that no longer exists; and a busy/finished-ref guard so a double-tap or a manual-stop racing the auto-stop timer can't double-process the same clip.
- **`hooks/useTutorReplyAudio.ts`** — calls the new `bhashini.tutorSpeech.synthesizeTutorReply` action once a fresh assistant message appears, plays the returned base64 audio via `expo-audio` (written to a temp file via `expo-file-system`, a new dependency), and resolves only once playback actually *finishes* (not once it starts) — driving `VoiceTutor`'s `speaking` phase for exactly as long as Dadi is actually talking.
- **`components/TutorChat.tsx`** — the original text-only view, preserved rather than deleted, now taking the shared `conversation` object as a prop and offering a "switch to voice" affordance (hidden if the language doesn't support it).

New backend supporting this: **`bhashini/tutorSpeech.ts`**'s `synthesizeTutorReply({text, languageCode, characterSlug})` — a live, runtime `action` (unlike `bhashini/tts.ts`'s authoring-time-only lesson audio) that synthesizes a tutor reply's speech on demand and returns base64 audio directly, never writing to Convex storage — a tutor reply is spoken once and discarded, there's no "generate once, reuse forever" the way lesson audio has. Voice gender comes from the same `voiceForCharacter()` lookup lesson audio uses, so Dadi's tutor voice matches her lesson-clip voice.

### What's still not verified

A full voice turn producing an actual **spoken Gemini reply** has never been observed end-to-end. Two independent reasons, neither a defect in this feature's own code:

1. The `GEMINI_API_KEY` configured on the dev deployment was reported and revoked by Google as a **leaked key** mid-session (confirmed via `bunx convex logs`, a real `403 PERMISSION_DENIED`, not guessed) — the project owner has since replaced it, but no call had succeeded against the old key.
2. Live-in-Simulator interactive verification (tapping through the actual push-to-talk flow) proved unreliable in the environment this was built in — GUI-automation tooling stalled/failed to register taps reliably, for reasons that look like an accessibility-permissions limitation of that environment, not an app bug. Everything up to and including a successful ASR transcription feeding `sendMessage` (the same call path the already-verified text fallback uses) is expected to work; hearing Dadi's actual spoken reply has not been personally confirmed by anyone in this session.

Whoever next has hands-on access to a real Simulator/device should do this by hand: tap the mic, speak, confirm a transcript appears, confirm Dadi's reply arrives both as text and as audio, confirm the avatar's expression clip matches the reply's tone.

## Known gaps

- **ASR/TTS metering is unenforced** — logged as `specs/_findings.md`'s **F-002**. Bhashini is free, so this isn't a billing risk, but neither `transcribeSpeech` nor `synthesizeTutorReply` checks or increments the `usage` table's reserved `'asr'`/`'tts'` kinds against `LIMITS.ASR_PER_DAY`.
- **Minor consent flow is intentionally unbuilt.** A `minor` learner gets a hard-coded "coming soon" rejection, not a working verifiable-parental-consent mechanism. This was a deliberate scope decision (`plans/phase-8-onboarding-age-gating.md`, 2026-08-03) to avoid blocking the tutor build on unresolved DPDP consent UX — tracked as real, not hidden, product debt.
- **`ASR_LANGUAGES`/`TTS_LANGUAGES` coverage is unverified against live Bhashini pipeline responses.** Both sets (now in `@sarvabhasha/shared`, used by mobile to decide whether to offer the mic at all) are still described in their own history as "a starting assumption... VERIFY against live pipeline responses before relying on a language here that hasn't actually been exercised."
- **No mutation lets a user change a session's persona after `startSession`.** Whether that's an intended constraint or simply unbuilt isn't stated anywhere in the code.
- **An app-wide, tutor-unrelated layout bug** was found while reviewing the redesign live — logged as `specs/_findings.md`'s **F-001**: the shared `Screen.tsx` shell has no safe-area top-inset handling, so any screen's top content can render under the status bar. Patched locally in `VoiceTutor.tsx`/`TutorChat.tsx` only; every other screen in the app still has the underlying gap.

## Data & state wiring

```
apps/mobile/src/features/tutor/screens/TutorScreen.tsx
        │  branches on ageBand / targetLanguage
        ▼
apps/mobile/src/features/tutor/components/TutorConversation.tsx
        │  voice/chat mode switch, gated by supportsVoiceTutor(languageCode)
        ├──▶ components/VoiceTutor.tsx  ──▶ hooks/useVoiceTurn.ts ──▶ hooks/useAudioRecording.ts
        │                                                          └▶ hooks/useTutorReplyAudio.ts
        └──▶ components/TutorChat.tsx        (the "Type instead" fallback)
        │
        ▼  both views share ONE hooks/useTutorConversation.ts
packages/backend/convex/tutor.ts
  startSession          mutation   → tutorSessions insert
  getSession            query      → tutorSessions by id, ownership-checked
  listMessages          query      → tutorMessages by_session, paginated (now returns `expression`)
  getCreditsBalance     query      → credits by_user (display-only, never gates)
  sendMessage           mutation   → tutorMessages insert(s), credits patch, usage patch/insert,
                                     schedules internal.tutor.generateReply
  generateReply          internalAction → Gemini fetch, tutorMessages insert (with expression),
                                     optional rollingSummary patch

packages/backend/convex/bhashini/asr.ts
  transcribeSpeech       action    → Bhashini ASR pipeline call, transcribe-and-discard (no storage write)

packages/backend/convex/bhashini/tutorSpeech.ts
  synthesizeTutorReply   action    → Bhashini TTS pipeline call, synthesize-and-discard (base64, no storage write)

packages/backend/convex/personaAnimations.ts
  getLiveClipsForCharacter  query  → Dadi's 4 live expression clips, by characterSlug
```

Schema tables touched ([schema.ts](../packages/backend/convex/schema.ts)):

| Table | Index used | Role |
|---|---|---|
| `tutorSessions` | `by_user_recent` | One row per conversation; `personaKey`, `rollingSummary`, `languageCode` |
| `tutorMessages` | `by_session` | Every turn, `source: gemini \| template`, optional `model`/`tokensIn`/`tokensOut`/`expression` |
| `users` | `by_authId` | `ageBand`, resolved via `requireCurrentUserDoc`/`getCurrentUserDoc` ([`lib/currentUser.ts`](../packages/backend/convex/lib/currentUser.ts)) |
| `credits` | `by_user` | Balance gate — see `monetization-and-limits.md` |
| `usage` | `by_user_day_kind` | `kind: 'tutor_turn'` safety-net counter; `kind: 'asr'`/`'tts'` reserved, unused (F-002) |
| `languages` | `by_code` | `startSession` requires `status: "live"` |
| `personaAnimations` | `by_character_expression` | Dadi's 4 approved expression clips, one live row per `(characterSlug, expression)` |

There is no `api/` folder and no REST layer — `sendMessage`/`startSession`/`listMessages`/`transcribeSpeech`/`synthesizeTutorReply` are the entire client-facing contract, called directly via `convex/react`'s `useMutation`/`useQuery`/`useAction` from the mobile hooks described above.

## Cost & limits

The tutor is the app's only Gemini-metered surface (root `CLAUDE.md`'s cost table: Gemini 3.1 Flash-Lite, $0.25/$1.50 per M tokens in/out, ~$0.0004/turn).

- **What triggers a call:** any `sendMessage` whose text does not match a local intent pattern. Template-matched turns cost nothing and never call Gemini.
- **Order of checks, exactly as coded** (all inside `sendMessage`'s single transaction, per the file's own top-of-file comment calling this "the highest-stakes function in this codebase"): `dayKey` freshness (`assertDayKeyFresh`) → empty-text check → age re-check → session-ownership check → lazy trial-credit grant → intent match (short-circuits here if matched) → safety-net daily cap (`usage.count >= SAFETY_NET_TUTOR_TURNS_PER_DAY`, 200) → credits balance check (`balance > 0`) → decrement credits → increment `usage` → insert user message → **schedule** `generateReply`.
- **Why scheduling, not calling inline:** mutations cannot `fetch`; the Gemini call happens in `generateReply`, an `internalAction` triggered via `ctx.scheduler.runAfter(0, ...)`. By the time it runs, the credit is already spent and the usage counter already incremented — a failure in the action (e.g. Gemini errors) does not re-open the gate or refund a retry.
- **The money-side limit itself** (trial size, pack size, the credits/usage tables, receipt idempotency) is owned by [`monetization-and-limits.md`](monetization-and-limits.md) — this spec only traces where in the tutor's code path that spec's rules are enforced.
- **The summary regeneration** is a second Gemini call, but batched to once per 16 messages (see History management), not per turn.
- **Bhashini ASR and the new tutor-reply TTS are both free** and explicitly not billed or credit-gated — see Known gaps (F-002) for the one place this is currently unenforced even as abuse-prevention.

## Failure modes & edge cases

| Scenario | Handling |
|---|---|
| `ageBand: "unknown"` calls `startSession` or `sendMessage` | Throws `AGE_GATE_REQUIRED`; client should route to the birth-year prompt. |
| `ageBand: "minor"` calls either | Throws `PARENTAL_CONSENT_REQUIRED`; no working consent flow exists yet (see Known gaps). |
| Empty/whitespace-only message text | `sendMessage` throws `Message text is empty.` before touching credits or usage. |
| `sessionId` belongs to another user, or doesn't exist | `getSession`/`listMessages`/`sendMessage` all check `session.userId !== user._id` and either return `null` (`getSession`) or throw `Session not found` (`listMessages`, a query, and `sendMessage`, a mutation). |
| Credits balance is 0 (trial spent, no pack) | `sendMessage` throws `CREDITS_EXHAUSTED` before any Gemini call; user/assistant message pair is never inserted for that turn. |
| Safety-net daily cap hit (200 tutor turns/day) | Throws `SAFETY_NET_EXCEEDED`; per `monetization-and-limits.md`, this is not meant to bind a real conversation. |
| `dayKey` more than 1 day from server's UTC date | `assertDayKeyFresh` throws — rejects a client clock that's drifted or been tampered with ([`lib/dayKey.ts`](../packages/backend/convex/lib/dayKey.ts#L26-35)). |
| Gemini response is not valid JSON despite `responseMimeType: "application/json"` | `callGemini` throws `Gemini returned non-JSON despite responseMimeType: ...` — the scheduled action fails; the user's message row remains inserted with no assistant reply ever appended. |
| Gemini returns an `expression` outside the four-value enum | Silently coerced to `'neutral'` — not surfaced as an error. |
| `generateReply` runs after the session was deleted | `getSessionForGeneration` returns `null`; the action returns early, no reply generated, no error thrown. |
| ASR transcript is empty or under 2 characters after trimming | `transcribeSpeech` returns `{ ok: false, reason: 'empty_or_too_short' }`, not an exception — same shape as a genuine provider failure, so `useVoiceTurn` has one branch (`no_speech`) to handle both. |
| ASR requested for a language with no Bhashini ASR pipeline | Returns `{ ok: false, reason: 'No Bhashini ASR pipeline for "<code>"' }` before any network call. |
| Mic permission denied | `useAudioRecording` remembers the denial for the rest of the app session (`micPermissionStore`) so the OS dialog never re-fires on every tap; the learner is routed to "Type instead." |
| Recording under 400ms | Flagged `tooShort`; the caller skips the ASR call entirely rather than sending a guaranteed-empty transcript. |
| App backgrounded mid-recording | An `AppState` listener stops and discards the in-flight recording immediately; the state machine snaps back to `idle` rather than showing "Listening…" over a dead recording. |
| Session's language has no ASR or TTS coverage | `supportsVoiceTutor(languageCode)` forces chat mode; the mic is never offered for that language regardless of the learner's own toggle. |

## Cross-references

| Concern | Authoritative spec |
|---|---|
| Trial credits, pack pricing, consumption order, receipt idempotency | [`monetization-and-limits.md`](monetization-and-limits.md) |
| Age bands, DPDP rationale, self-declaration as accepted risk | [`monetization-and-limits.md`](monetization-and-limits.md) |
| Character cast, tone table, hard lines on comedy | [`branding-and-voice.md`](branding-and-voice.md) |
| Schema tables (`tutorSessions`, `tutorMessages`, `credits`, `usage`, `users`) | [`data-model.md`](data-model.md) |
| Bhashini pipeline configs, language coverage, authoring-time TTS | [`bhashini-speech.md`](bhashini-speech.md) |
| Cost guardrails across all metered dependencies | root [`CLAUDE.md`](../CLAUDE.md) → Cost discipline |
