/**
 * Shared Bhashini ULCA pipeline plumbing — the fetch-config-then-compute
 * pattern used by BOTH `tts.ts` (authoring-time only, `internalAction`) and
 * `asr.ts` (runtime, the app's live voice-input path, a plain `action`).
 * Extracted here so the two providers can't drift on credentials handling
 * or the pipeline endpoint — same account, same ULCA API, different
 * `taskType`.
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
