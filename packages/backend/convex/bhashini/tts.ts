/**
 * Bhashini Text-to-Speech — AUTHORING TIME ONLY.
 *
 * Ported from wadhwani/wf-locale-kit/convex/bhashiniTTS.ts, with three changes
 * that matter for this app:
 *
 *   1. `internalAction`, not `action`. Bhashini is slow (2–5s) and flaky.
 *      Lesson audio is generated ONCE at authoring time and served from
 *      Convex storage forever after. This must not be reachable from the app.
 *      (CLAUDE.md rule 10.)
 *
 *   2. The blob is linked to an `audioAssets` row. The original returned an
 *      orphan storageId; here every clip belongs to a (phrase, language).
 *
 *   3. Idempotent. Re-running a batch skips phrases that already have audio,
 *      so a partial failure can be retried without regenerating everything.
 *
 * Bhashini is free for 22 Indian languages. Free, but rate-limited — batches
 * are staggered, not fired in parallel.
 */

import { v } from 'convex/values';
import { internalAction, internalQuery } from '../_generated/server';
import { internal } from '../_generated/api';
import type { Doc, Id } from '../_generated/dataModel';
import { voiceForCharacter, TTS_LANGUAGES } from '@sarvabhasha/shared';
import {
  getBhashiniCredentials,
  getTtsPipelineConfig,
  synthesizeTts,
  decodeBase64Audio,
} from './lib';

/**
 * TTS_LANGUAGES now lives in @sarvabhasha/shared (relocated from a local
 * const here) so the mobile client can check TTS coverage without importing
 * this server-only action module. Re-exported from here so
 * `bhashini/tutorSpeech.ts` (the runtime tutor-reply synth path) keeps
 * importing it from './tts' rather than needing its own import changed.
 */
export { TTS_LANGUAGES };

// `getTtsPipelineConfig`/`synthesizeTts` now live in `./lib` (shared with
// `vocabularyTts.ts`/`aksharmalaTts.ts`) — see that file's doc comment.

// ---------------------------------------------------------------- internals
//
// `findExistingAudio` (the idempotency check) and `insertAudioAsset` (the
// write path) live in `../lib/audioAssets.ts` — they're provider-agnostic
// and `google/tts.ts` reuses them as-is rather than duplicating them here.

export const getPhrase = internalQuery({
  args: { phraseId: v.id('phrases') },
  handler: async (ctx, args) => await ctx.db.get(args.phraseId),
});

export const getTranslation = internalQuery({
  args: { phraseId: v.id('phrases'), languageCode: v.string() },
  handler: async (ctx, args) =>
    await ctx.db
      .query('phraseTranslations')
      .withIndex('by_phrase_language', (q) =>
        q.eq('phraseId', args.phraseId).eq('languageCode', args.languageCode),
      )
      .first(),
});

// ------------------------------------------------------------------ actions

/**
 * Generate audio for ONE (phrase, language). Idempotent — skips if audio
 * already exists unless `force` is set.
 *
 * Voice is DERIVED from the phrase's `speakerCharacter`, not passed in.
 * One file per phrase, matched to whoever says the line. `genderOverride`
 * exists only for the per-language fallback described in CHARACTER_VOICES:
 * if a male voice is rough in some language, force female for that language
 * rather than ship an unintelligible clip.
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

export const generateAudioForPhrase = internalAction({
  args: {
    phraseId: v.id('phrases'),
    languageCode: v.string(),
    genderOverride: v.optional(v.union(v.literal('male'), v.literal('female'))),
    force: v.optional(v.boolean()),
  },
  handler: async (ctx, args): Promise<GenerateAudioResult> => {
    if (!TTS_LANGUAGES.has(args.languageCode)) {
      return { ok: false as const, reason: `No Bhashini TTS voice for "${args.languageCode}"` };
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
      const creds = getBhashiniCredentials();
      const config = await getTtsPipelineConfig(args.languageCode, gender, creds);
      const base64 = await synthesizeTts(translation.text, args.languageCode, gender, config, creds);

      const { bytes, durationMs } = decodeBase64Audio(base64);

      const storageId = await ctx.storage.store(new Blob([bytes], { type: 'audio/wav' }));

      const audioId: Id<'audioAssets'> = await ctx.runMutation(
        internal.lib.audioAssets.insertAudioAsset,
        {
          phraseId: args.phraseId,
          languageCode: args.languageCode,
          storageId,
          voiceGender: gender,
          durationMs,
          source: 'bhashini',
        },
      );

      return { ok: true as const, skipped: false, audioId, durationMs, bytes: bytes.length, gender };
    } catch (err) {
      return { ok: false as const, reason: (err as Error).message };
    }
  },
});

/**
 * Fan out one phrase across many languages.
 *
 * Sequential with a delay, deliberately. Bhashini is free but rate-limited,
 * and firing 22 parallel requests is the reliable way to get throttled.
 */
export const generateAudioForPhraseAllLanguages = internalAction({
  args: {
    phraseId: v.id('phrases'),
    languageCodes: v.array(v.string()),
    genderOverride: v.optional(v.union(v.literal('male'), v.literal('female'))),
    force: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const results: Array<{ languageCode: string; ok: boolean; detail: string }> = [];

    for (const languageCode of args.languageCodes) {
      const r = await ctx.runAction(internal.bhashini.tts.generateAudioForPhrase, {
        phraseId: args.phraseId,
        languageCode,
        genderOverride: args.genderOverride,
        force: args.force,
      });

      results.push({
        languageCode,
        ok: r.ok,
        detail: r.ok
          ? r.skipped
            ? 'already existed'
            : `${r.gender}, ${r.durationMs}ms, ${(r.bytes! / 1024).toFixed(0)}KB`
          : r.reason,
      });

      await new Promise((resolve) => setTimeout(resolve, 400));
    }

    return {
      phraseId: args.phraseId,
      succeeded: results.filter((r) => r.ok).length,
      failed: results.filter((r) => !r.ok).length,
      results,
    };
  },
});
