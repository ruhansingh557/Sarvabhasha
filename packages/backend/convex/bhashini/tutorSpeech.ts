/**
 * Bhashini Text-to-Speech for tutor replies — RUNTIME, unlike `tts.ts`.
 *
 * Root CLAUDE.md rule 12 names the voice-primary tutor flow exactly:
 * Bhashini ASR → text → Gemini → Bhashini TTS. `bhashini/asr.ts` is the ASR
 * half of that pipeline (live, a plain `action`); this module is the TTS
 * half. It is intentionally NOT a modification of `tts.ts` — `tts.ts` is
 * authoring-time-only by design (CLAUDE.md rule 10: lesson-phrase audio is
 * generated ONCE and stored in Convex file storage forever, never
 * synthesized live). A tutor reply is unique to one conversation turn —
 * there is no "generate once, store forever" for it — so this synthesizes
 * live, on demand, right after a Gemini reply lands (see `tutor.ts`'s
 * `generateReply`, which persists the `expression` this reply is spoken
 * with).
 *
 * Two things this module deliberately does NOT do, mirroring `asr.ts`'s own
 * documented gaps in the opposite direction:
 *   1. It never writes to Convex storage. Unlike a lesson clip, a tutor
 *      reply's synthesized audio is played once by the mobile client and
 *      discarded — no product reason to keep it, same reasoning `asr.ts`
 *      gives for not persisting raw ASR audio, just mirrored (synthesized
 *      output here instead of captured input there).
 *   2. It is not metered here. Bhashini is free (root CLAUDE.md's cost
 *      table). The schema's `usage` table already reserves a `kind: 'tts'`
 *      bucket, but no mutation reads or increments it on this path — the
 *      same known gap `asr.ts`'s header comment flags for `kind: 'asr'`.
 *      Wiring an actual per-user cap through a checked mutation wrapper is a
 *      follow-up for whichever pass builds the mobile voice-primary tutor
 *      UI, not done here.
 */

import { v } from 'convex/values';
import { action } from '../_generated/server';
import { voiceForCharacter } from '@sarvabhasha/shared';
import { BHASHINI_COMPUTE_URL, BHASHINI_PIPELINE_URL, PIPELINE_ID, getBhashiniCredentials } from './lib';
import { TTS_LANGUAGES } from './tts';
import { personaKeyValidator } from '../tutor';

async function getPipelineConfig(
  language: string,
  gender: 'male' | 'female',
  creds: { apiKey: string; userId: string },
) {
  const res = await fetch(BHASHINI_PIPELINE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      userID: creds.userId,
      ulcaApiKey: creds.apiKey,
    },
    body: JSON.stringify({
      pipelineTasks: [
        { taskType: 'tts', config: { language: { sourceLanguage: language }, gender } },
      ],
      pipelineRequestConfig: { pipelineId: PIPELINE_ID },
    }),
  });
  if (!res.ok) {
    throw new Error(`Bhashini pipeline config failed: ${res.status} — ${await res.text()}`);
  }
  return await res.json();
}

/** Returns base64 audio — same ULCA `taskType: 'tts'` shape `tts.ts` uses for lesson audio. */
async function synthesize(
  text: string,
  language: string,
  gender: 'male' | 'female',
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
          taskType: 'tts',
          config: { language: { sourceLanguage: language }, serviceId, gender },
        },
      ],
      inputData: { input: [{ source: text }] },
    }),
  });
  if (!res.ok) {
    throw new Error(`Bhashini TTS failed: ${res.status} — ${await res.text()}`);
  }

  const data = await res.json();
  const audio = data.pipelineResponse?.[0]?.audio?.[0]?.audioContent;
  if (!audio) throw new Error('TTS response missing audioContent');
  return audio;
}

/**
 * Synthesize one tutor reply out loud, on demand. Unlike `tts.ts`'s
 * `generateAudioForPhrase`, there is no phraseId/translation lookup — the
 * caller already has the text (Gemini's reply, straight from
 * `tutor.generateReply`) and the target language (the session's
 * `languageCode`); this is a thin synth-and-return wrapper, not a pipeline
 * step.
 *
 * Gender is derived from `characterSlug` via the same `voiceForCharacter`
 * lookup `tts.ts` uses for lesson audio, so a persona's spoken tutor voice
 * matches their lesson-clip voice (Dadi is always female, in the tutor and
 * in every lesson clip she narrates).
 *
 * Returns the base64 audio directly — no `ctx.storage.store` call. The
 * mobile client plays it once and throws it away.
 */
export const synthesizeTutorReply = action({
  args: {
    text: v.string(),
    languageCode: v.string(),
    characterSlug: personaKeyValidator,
  },
  returns: v.union(
    v.object({ ok: v.literal(true), audioBase64: v.string() }),
    v.object({ ok: v.literal(false), reason: v.string() }),
  ),
  handler: async (_ctx, args) => {
    const text = args.text.trim();
    if (!text) {
      return { ok: false as const, reason: 'empty_text' };
    }
    if (!TTS_LANGUAGES.has(args.languageCode)) {
      return { ok: false as const, reason: `No Bhashini TTS voice for "${args.languageCode}"` };
    }

    const gender = voiceForCharacter(args.characterSlug);

    try {
      const creds = getBhashiniCredentials();
      const pipelineConfig = await getPipelineConfig(args.languageCode, gender, creds);
      const audioBase64 = await synthesize(text, args.languageCode, gender, pipelineConfig, creds);
      return { ok: true as const, audioBase64 };
    } catch (err) {
      return { ok: false as const, reason: (err as Error).message };
    }
  },
});
