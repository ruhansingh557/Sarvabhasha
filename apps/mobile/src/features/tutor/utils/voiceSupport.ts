import { ASR_LANGUAGES, TTS_LANGUAGES } from '@sarvabhasha/shared';

/**
 * Whether the voice-primary tutor UI can be offered at all for a given
 * session language. Both directions matter independently: ASR turns the
 * learner's speech into text (the mic button itself), TTS speaks Dadi's
 * reply back out loud. A language could in principle have one without the
 * other (the two Bhashini pipelines are configured separately — see
 * `packages/backend/convex/bhashini/asr.ts` and `tts.ts`'s own comments on
 * this), so callers check the specific capability they need rather than
 * assuming "voice support" is a single yes/no.
 *
 * Imports the same `ASR_LANGUAGES`/`TTS_LANGUAGES` sets the Convex actions
 * enforce server-side (`@sarvabhasha/shared`, not a client-side guess) so
 * there is exactly one place either list can drift — never a second,
 * independently-maintained copy here (CLAUDE.md rule 9's spirit: the client
 * mirrors server-resolved facts, it doesn't invent its own).
 */
export function supportsVoiceInput(languageCode: string | undefined): boolean {
  return !!languageCode && ASR_LANGUAGES.has(languageCode);
}

export function supportsSpokenReplies(languageCode: string | undefined): boolean {
  return !!languageCode && TTS_LANGUAGES.has(languageCode);
}

/**
 * The voice-primary screen needs both directions to make sense as the
 * DEFAULT view — a mic the learner can talk into but that only ever answers
 * in silent text is a broken promise ("she replies out loud"), and a spoken
 * reply with no way to ask a question by voice is half a feature. Either one
 * missing routes straight to the text fallback instead of offering a mic
 * button that would only sometimes work.
 */
export function supportsVoiceTutor(languageCode: string | undefined): boolean {
  return supportsVoiceInput(languageCode) && supportsSpokenReplies(languageCode);
}
