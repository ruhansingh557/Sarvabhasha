/**
 * Shared Bhashini ULCA pipeline plumbing — the fetch-config-then-compute
 * pattern used by BOTH `tts.ts` (authoring-time only, `internalAction`) and
 * `asr.ts` (runtime, the app's live voice-input path, a plain `action`).
 * Extracted here so the two providers can't drift on credentials handling
 * or the pipeline endpoint — same account, same ULCA API, different
 * `taskType`.
 *
 * `getTtsPipelineConfig`/`synthesizeTts` below were promoted here from
 * `tts.ts` (2026-08, phase 13) so `vocabularyTts.ts` and `aksharmalaTts.ts`
 * can generate audio for vocabulary/number/aksharmala content through the
 * exact same proven HTTP flow instead of a second hand-copied version that
 * could drift. `tts.ts` itself now imports these rather than defining its
 * own local copies — no behavior change there, pure extraction.
 */

export const BHASHINI_PIPELINE_URL =
  'https://meity-auth.ulcacontrib.org/ulca/apis/v0/model/getModelsPipeline';
export const BHASHINI_COMPUTE_URL = 'https://dhruva-api.bhashini.gov.in/services/inference/pipeline';
export const PIPELINE_ID = '64392f96daac500b55c543cd';

export function getBhashiniCredentials(): { apiKey: string; userId: string } {
  const apiKey = process.env.BHASHINI_API_KEY;
  if (!apiKey) {
    throw new Error('BHASHINI_API_KEY is not set. Add it to the Convex deployment env.');
  }
  return { apiKey, userId: process.env.BHASHINI_USER_ID ?? apiKey };
}

/** Fetch the TTS pipeline config (serviceId, inference endpoint) for one (language, gender). */
export async function getTtsPipelineConfig(
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

/**
 * Synthesize `text` and return base64-encoded audio.
 *
 * `speed` is an OPTIONAL native ULCA config field (confirmed live 2026-08
 * against `ai4bharat/indic-tts-coqui-indo_aryan-gpu--t4`, the service this
 * pipeline resolves to for `hi`): a multiplier on speaking rate, applied by
 * the TTS model itself (duration control on its own acoustic output), not a
 * post-hoc resample — verified by comparing `speed: 0.7` against baseline on
 * the same input text: duration scaled by ~1/0.7 as expected while the
 * estimated fundamental pitch stayed within measurement noise (190.1Hz vs
 * 186.9Hz) and the WAV's own sample-rate header was unchanged (22050Hz both).
 * This is why `aksharmalaTts.ts` uses this over an `ffmpeg atempo` pass —
 * a real rate control beats time-stretching audio we already have.
 *
 * Omitted entirely (as every existing caller — `tts.ts`, `vocabularyTts.ts`
 * — does) it is simply absent from the request body, which is exactly the
 * request `tts.ts`/`vocabularyTts.ts` already sent before this parameter was
 * discovered: zero behavior change for lesson-phrase or vocabulary audio.
 */
export async function synthesizeTts(
  text: string,
  language: string,
  gender: 'male' | 'female',
  pipelineConfig: any,
  creds: { apiKey: string; userId: string },
  speed?: number,
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
          config: {
            language: { sourceLanguage: language },
            serviceId,
            gender,
            ...(speed !== undefined && { speed }),
          },
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

/** Base64 → Uint8Array, and Bhashini's rough 22.05kHz/16-bit/mono WAV duration estimate. */
export function decodeBase64Audio(base64: string): { bytes: Uint8Array; durationMs: number } {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  const durationMs = Math.round((bytes.length / (22050 * 2)) * 1000);
  return { bytes, durationMs };
}
