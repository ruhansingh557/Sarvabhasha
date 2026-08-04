/**
 * Google Cloud Text-to-Speech — MANUAL FALLBACK, AUTHORING TIME ONLY.
 *
 * Bhashini (`bhashini/tts.ts`) is the primary TTS provider: free, and it
 * covers all 22 target languages. This module exists for exactly one
 * situation — Bhashini returning a sustained failure for a specific
 * (phrase, language) (see `plans/phase-4-expand-pilot-content.md`'s Marathi
 * row: a two-day, language-specific `504 Gateway Time-out`) — where a human
 * needs an alternative to unblock one clip without waiting on Bhashini.
 *
 * This is NOT automatic failover. Nothing in this codebase calls
 * `generateAudioForPhraseGoogle` from `generateAudioForPhrase` or from any
 * other function — there is no live traffic here to route in the first
 * place, since every TTS call in this pipeline is a one-off authoring-time
 * `convex run` invocation reviewed by a human before publish (root
 * CLAUDE.md rule 10). A human decides, per (phrase, language), that Bhashini
 * has failed and explicitly runs this action instead.
 *
 * Mirrors `bhashini/tts.ts` in shape: same idempotency check
 * (`lib/audioAssets.findExistingAudio`, shared — not duplicated), same
 * `insertAudioAsset` write path (shared, `source: 'google-tts'`), same
 * `{ phraseId, languageCode, genderOverride?, force? }` args, same result
 * union. `getPhrase`/`getTranslation` are reused directly from
 * `bhashini/tts.ts` via `internal.bhashini.tts.*` — they're plain phrase/
 * translation lookups, not Bhashini-specific, so duplicating them here would
 * just be two copies of the same query.
 *
 * Google Cloud TTS is a genuinely metered, paid dependency (unlike
 * Bhashini) — see the Cost discipline table in root CLAUDE.md. Expected
 * volume is near-zero: this only runs when a human decides Bhashini has
 * failed for a specific clip, not as a batch pipeline.
 */

import { v } from 'convex/values';
import { internalAction } from '../_generated/server';
import { internal } from '../_generated/api';
import type { Doc, Id } from '../_generated/dataModel';
import { voiceForCharacter } from '@sarvabhasha/shared';

const GOOGLE_TTS_URL = 'https://texttospeech.googleapis.com/v1/text:synthesize';

/**
 * Chirp 3: HD voice names, verified against
 * https://docs.cloud.google.com/text-to-speech/docs/chirp3-hd (2026-08) —
 * the same 30 named voices (format `<locale>-Chirp3-HD-<Name>`) are offered
 * across every locale the tier supports, and hi-IN/bn-IN/ta-IN/te-IN/mr-IN/
 * kn-IN are all confirmed in that tier's language-availability list. Using
 * one female and one male name from that fixed roster — rather than
 * per-language `Standard-A/B/C/D` letters, whose gender assignment is not
 * guaranteed consistent locale to locale — avoids guessing a voice ID that
 * doesn't exist for a given language.
 *
 * `ssmlGender` is sent alongside `name` because the REST API requires the
 * field, but `name` is what actually selects the voice.
 */
export const GOOGLE_VOICES: Record<string, { male: string; female: string }> = {
  hi: { female: 'hi-IN-Chirp3-HD-Kore', male: 'hi-IN-Chirp3-HD-Charon' },
  bn: { female: 'bn-IN-Chirp3-HD-Kore', male: 'bn-IN-Chirp3-HD-Charon' },
  ta: { female: 'ta-IN-Chirp3-HD-Kore', male: 'ta-IN-Chirp3-HD-Charon' },
  te: { female: 'te-IN-Chirp3-HD-Kore', male: 'te-IN-Chirp3-HD-Charon' },
  mr: { female: 'mr-IN-Chirp3-HD-Kore', male: 'mr-IN-Chirp3-HD-Charon' },
  kn: { female: 'kn-IN-Chirp3-HD-Kore', male: 'kn-IN-Chirp3-HD-Charon' },
  // Added 2026-08-03 (plans/phase-12-v1-launch.md Step 1) — Bhashini is dead
  // for both (Gujarati: sustained 504 at the compute layer; Urdu: flat 400,
  // no model registered), but Google's `voices.list` confirms real Chirp3-HD
  // coverage for gu-IN/ur-IN right now. Same fixed-roster reasoning as above.
  gu: { female: 'gu-IN-Chirp3-HD-Kore', male: 'gu-IN-Chirp3-HD-Charon' },
  ur: { female: 'ur-IN-Chirp3-HD-Kore', male: 'ur-IN-Chirp3-HD-Charon' },
  // Added 2026-08-04 for Aksharmala (Gurmukhi/pa, Malayalam/ml) — confirmed
  // via a live `voices.list` call that pa-IN/ml-IN both carry the full
  // 30-voice Chirp3-HD roster, same as every locale above.
  pa: { female: 'pa-IN-Chirp3-HD-Kore', male: 'pa-IN-Chirp3-HD-Charon' },
  ml: { female: 'ml-IN-Chirp3-HD-Kore', male: 'ml-IN-Chirp3-HD-Charon' },
};

/** BCP-47 locale Google expects, keyed by our ISO 639-1 `languageCode`. */
export const GOOGLE_LOCALE: Record<string, string> = {
  hi: 'hi-IN',
  bn: 'bn-IN',
  ta: 'ta-IN',
  te: 'te-IN',
  mr: 'mr-IN',
  kn: 'kn-IN',
  gu: 'gu-IN',
  ur: 'ur-IN',
  pa: 'pa-IN',
  ml: 'ml-IN',
};

export function getGoogleTtsKey(): string {
  const key = process.env.GOOGLE_CLOUD_TTS_API_KEY;
  if (!key) {
    throw new Error(
      'GOOGLE_CLOUD_TTS_API_KEY is not set. Provision a Cloud Text-to-Speech API key in the ' +
        'Google Cloud console, then run `bunx convex env set GOOGLE_CLOUD_TTS_API_KEY <key>` ' +
        'to add it to the Convex deployment env.',
    );
  }
  return key;
}

/**
 * Returns base64 `audioContent` (LINEAR16 WAV), or throws with the response
 * body on failure.
 *
 * `speakingRate` is OPTIONAL and omitted from the request entirely unless
 * passed — every existing call site (`generateAudioForPhraseGoogle` below)
 * doesn't pass it, so live phrase-fallback audio is byte-for-byte unaffected
 * by this addition. It exists for `google/aksharmalaTtsTrial.ts`, which needs
 * to slow Chirp3-HD's pace to compare against Bhashini's `speed: 0.6`
 * Aksharmala clips. Google's REST API documents this as a genuine linear
 * rate control in `[0.25, 4.0]` (1.0 = native speed), unlike Bhashini's
 * reverse-engineered `speed` field — see that trial file for why 0.6 was
 * chosen and how it was verified to actually take effect.
 */
export async function synthesize(
  text: string,
  languageCode: string,
  gender: 'male' | 'female',
  apiKey: string,
  speakingRate?: number,
): Promise<string> {
  const locale = GOOGLE_LOCALE[languageCode];
  const voiceName = GOOGLE_VOICES[languageCode]?.[gender];
  if (!locale || !voiceName) {
    throw new Error(`No Google TTS voice configured for "${languageCode}"`);
  }

  const res = await fetch(`${GOOGLE_TTS_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      input: { text },
      voice: {
        languageCode: locale,
        name: voiceName,
        ssmlGender: gender === 'male' ? 'MALE' : 'FEMALE',
      },
      audioConfig: {
        audioEncoding: 'LINEAR16',
        ...(speakingRate !== undefined ? { speakingRate } : {}),
      },
    }),
  });
  if (!res.ok) {
    throw new Error(`Google TTS synthesize failed: ${res.status} — ${await res.text()}`);
  }

  const data = await res.json();
  const audio = data.audioContent;
  if (!audio) throw new Error('Google TTS response missing audioContent');
  return audio;
}

// ------------------------------------------------------------------ actions

/**
 * Generate audio for ONE (phrase, language) via Google Cloud TTS. Same
 * shape as `bhashini/tts.ts`'s `generateAudioForPhrase`: idempotent (skips
 * if audio already exists unless `force`), voice gender derived from the
 * phrase's `speakerCharacter` unless `genderOverride` is given.
 *
 * A human invokes this directly — e.g.
 *   bunx convex run google/tts:generateAudioForPhraseGoogle \
 *     '{"phraseId": "...", "languageCode": "mr"}'
 * — after confirming Bhashini has failed for that (phrase, language).
 */
type GenerateAudioResult =
  | { ok: false; reason: string }
  | { ok: true; skipped: true; audioId: Id<'audioAssets'> }
  | {
      ok: true;
      skipped: false;
      audioId: Id<'audioAssets'>;
      durationMs: number;
      bytes: number;
      gender: 'male' | 'female';
    };

export const generateAudioForPhraseGoogle = internalAction({
  args: {
    phraseId: v.id('phrases'),
    languageCode: v.string(),
    genderOverride: v.optional(v.union(v.literal('male'), v.literal('female'))),
    force: v.optional(v.boolean()),
  },
  handler: async (ctx, args): Promise<GenerateAudioResult> => {
    if (!(args.languageCode in GOOGLE_VOICES)) {
      return { ok: false as const, reason: `No Google TTS voice for "${args.languageCode}"` };
    }

    const phrase: Doc<'phrases'> | null = await ctx.runQuery(internal.bhashini.tts.getPhrase, {
      phraseId: args.phraseId,
    });
    if (!phrase) return { ok: false as const, reason: 'Phrase not found' };

    const gender = args.genderOverride ?? voiceForCharacter(phrase.speakerCharacter);

    if (!args.force) {
      const existing: Doc<'audioAssets'> | null = await ctx.runQuery(
        internal.lib.audioAssets.findExistingAudio,
        { phraseId: args.phraseId, languageCode: args.languageCode },
      );
      if (existing) return { ok: true as const, skipped: true, audioId: existing._id };
    }

    const translation: Doc<'phraseTranslations'> | null = await ctx.runQuery(
      internal.bhashini.tts.getTranslation,
      { phraseId: args.phraseId, languageCode: args.languageCode },
    );
    if (!translation) {
      return { ok: false as const, reason: `No translation for ${args.languageCode}` };
    }

    try {
      const apiKey = getGoogleTtsKey();
      const base64 = await synthesize(translation.text, args.languageCode, gender, apiKey);

      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

      const storageId = await ctx.storage.store(new Blob([bytes], { type: 'audio/wav' }));

      // LINEAR16 24kHz 16-bit mono — Google Cloud TTS's default sample rate.
      const durationMs = Math.round((bytes.length / (24000 * 2)) * 1000);

      const audioId: Id<'audioAssets'> = await ctx.runMutation(
        internal.lib.audioAssets.insertAudioAsset,
        {
          phraseId: args.phraseId,
          languageCode: args.languageCode,
          storageId,
          voiceGender: gender,
          durationMs,
          source: 'google-tts',
        },
      );

      return { ok: true as const, skipped: false, audioId, durationMs, bytes: bytes.length, gender };
    } catch (err) {
      return { ok: false as const, reason: (err as Error).message };
    }
  },
});
