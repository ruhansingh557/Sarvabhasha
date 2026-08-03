/**
 * Bhashini Automatic Speech Recognition — RUNTIME, unlike `tts.ts`.
 *
 * Root CLAUDE.md rule 12 names this exact path: voice flows go
 * Bhashini ASR → text → Gemini → Bhashini TTS, and raw audio never reaches
 * Gemini. That means — unlike TTS, which is generated once at authoring
 * time and is deliberately unreachable from the app — this action IS the
 * live voice-input path and is a plain `action`, not an `internalAction`.
 *
 * Two things this module deliberately does NOT do, both on purpose:
 *   1. It never writes to Convex storage. `tts.ts` keeps its audio forever
 *      (it's the lesson clip); this transcribes and discards — there is no
 *      product reason to retain a learner's raw voice input, and keeping it
 *      would be a privacy liability for no benefit.
 *   2. It is not metered here. Bhashini is free (see root CLAUDE.md's cost
 *      table), so this isn't a billing gate the way `tutor.sendMessage`'s
 *      credits check is. The schema's `usage` table already has a kind:
 *      'asr' bucket and @sarvabhasha/shared's LIMITS.ASR_PER_DAY reserves a
 *      number for it — wiring an actual per-user cap through a checked
 *      mutation wrapper is a follow-up for whichever pass builds the mobile
 *      voice-input UI, not done here (this file is the raw provider call
 *      only, mirroring how `tts.ts` is the raw call and `bhashini/tts.ts`'s
 *      callers are what add bookkeeping).
 */

import { v } from 'convex/values';
import { action } from '../_generated/server';
import { ASR_LANGUAGES } from '@sarvabhasha/shared';
import { BHASHINI_COMPUTE_URL, BHASHINI_PIPELINE_URL, PIPELINE_ID, getBhashiniCredentials } from './lib';

// ASR_LANGUAGES lives in @sarvabhasha/shared (relocated from a local const
// here) so the mobile client can check ASR coverage without importing this
// server-only action module. It mirrors `TTS_LANGUAGES` as a starting
// assumption — ASR and TTS coverage on Bhashini are not guaranteed identical,
// so VERIFY against live pipeline responses before relying on a language here
// that hasn't actually been exercised.

/** Below this length after trimming, treat the transcript as noise, not text. */
const MIN_TRANSCRIPT_LENGTH = 2;

async function getPipelineConfig(language: string, creds: { apiKey: string; userId: string }) {
  const res = await fetch(BHASHINI_PIPELINE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      userID: creds.userId,
      ulcaApiKey: creds.apiKey,
    },
    body: JSON.stringify({
      pipelineTasks: [{ taskType: 'asr', config: { language: { sourceLanguage: language } } }],
      pipelineRequestConfig: { pipelineId: PIPELINE_ID },
    }),
  });
  if (!res.ok) {
    throw new Error(`Bhashini ASR pipeline config failed: ${res.status} — ${await res.text()}`);
  }
  return await res.json();
}

/** Returns the raw transcript, un-trimmed and un-validated — callers check length. */
async function transcribe(
  audioBase64: string,
  language: string,
  pipelineConfig: any,
  creds: { apiKey: string; userId: string },
): Promise<string> {
  const serviceId = pipelineConfig.pipelineResponseConfig?.[0]?.config?.[0]?.serviceId;
  const authToken = pipelineConfig.pipelineInferenceAPIEndPoint?.inferenceApiKey?.value;
  const callbackUrl =
    pipelineConfig.pipelineInferenceAPIEndPoint?.callbackUrl ?? BHASHINI_COMPUTE_URL;

  if (!serviceId) throw new Error('Pipeline config missing serviceId');

  const res = await fetch(callbackUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(authToken && { Authorization: authToken }),
      ulcaApiKey: creds.apiKey,
      userID: creds.userId,
    },
    body: JSON.stringify({
      pipelineTasks: [
        {
          taskType: 'asr',
          config: { language: { sourceLanguage: language }, serviceId },
        },
      ],
      // ULCA's ASR input shape — audio content, not text `source` (that's the
      // TTS/translate shape `tts.ts` uses).
      inputData: { audio: [{ audioContent: audioBase64 }] },
    }),
  });
  if (!res.ok) {
    throw new Error(`Bhashini ASR failed: ${res.status} — ${await res.text()}`);
  }

  const data = await res.json();
  const transcript = data.pipelineResponse?.[0]?.output?.[0]?.source;
  if (typeof transcript !== 'string') {
    throw new Error('ASR response missing transcript');
  }
  return transcript;
}

/**
 * Transcribe one voice-input clip. Wraps both the "no pipeline for this
 * language" and "transcript too short to be real speech" cases in the SAME
 * `{ ok: false, reason }` shape as a genuine provider failure, so the mobile
 * client has one branch to handle ("didn't catch that, try again") instead
 * of needing to distinguish exception-like failures from a bare empty
 * string. Success wraps the transcript too (`{ ok: true, transcript }`)
 * rather than returning a bare string, so the two cases stay a proper
 * discriminated union at the Convex validator boundary.
 */
export const transcribeSpeech = action({
  args: {
    audioBase64: v.string(),
    languageCode: v.string(),
  },
  returns: v.union(
    v.object({ ok: v.literal(true), transcript: v.string() }),
    v.object({ ok: v.literal(false), reason: v.string() }),
  ),
  handler: async (_ctx, args) => {
    if (!ASR_LANGUAGES.has(args.languageCode)) {
      return { ok: false as const, reason: `No Bhashini ASR pipeline for "${args.languageCode}"` };
    }

    try {
      const creds = getBhashiniCredentials();
      const pipelineConfig = await getPipelineConfig(args.languageCode, creds);
      const raw = await transcribe(args.audioBase64, args.languageCode, pipelineConfig, creds);

      const trimmed = raw.trim();
      if (trimmed.length < MIN_TRANSCRIPT_LENGTH) {
        return { ok: false as const, reason: 'empty_or_too_short' };
      }

      return { ok: true as const, transcript: trimmed };
    } catch (err) {
      return { ok: false as const, reason: (err as Error).message };
    }
  },
});
