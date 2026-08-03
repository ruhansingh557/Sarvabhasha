/**
 * Google Cloud Text-to-Speech — MANUAL FALLBACK for vocabulary/number audio,
 * AUTHORING TIME ONLY. Sibling of `google/tts.ts` (phrase audio fallback),
 * same reasoning: Bhashini is the free, primary provider; this exists for
 * exactly one situation — Bhashini returning a sustained failure for a
 * specific (vocabulary item, language) — where a human needs an alternative
 * to unblock one clip without waiting on Bhashini.
 *
 * Concrete instance that motivated adding this file (2026-08-03, follow-on
 * Foundations pass): `bhashini/vocabularyTts.ts`'s
 * `generateVocabularyAudio` for `animals/dog` (hi, "कुत्ता") returned
 * "TTS response missing audioContent" on SIX consecutive attempts across
 * ~30 seconds, with both genders, while a sibling item (`animals/cat`)
 * succeeded on the very next call — i.e. not a pipeline-wide outage, a
 * sustained failure specific to this one (item, language) pair, exactly the
 * documented trigger for this fallback in root CLAUDE.md's cost table.
 *
 * NOT automatic failover — nothing calls this from
 * `generateVocabularyAudio` or any batch path. A human decides, per (item,
 * language), that Bhashini has failed and explicitly runs this action.
 *
 * Reuses `google/tts.ts`'s `synthesize`/`getGoogleTtsKey`/`GOOGLE_VOICES`
 * directly (plain text-to-speech helpers, not phrase-specific) rather than
 * duplicating them, and `bhashini/vocabularyTts.ts`'s
 * `getItemAndTranslation`/`findExistingVocabularyAudio` internal queries —
 * same "one lookup helper, two TTS provider callers" shape `google/tts.ts`
 * itself uses against `bhashini/tts.ts`'s `getPhrase`/`getTranslation`.
 */

import { v } from 'convex/values';
import { internalAction } from '../_generated/server';
import { internal } from '../_generated/api';
import type { Doc, Id } from '../_generated/dataModel';
import { getGoogleTtsKey, synthesize, GOOGLE_VOICES } from './tts';

type GenerateVocabularyAudioGoogleResult =
  | { ok: false; reason: string }
  | { ok: true; skipped: true }
  | {
      ok: true;
      skipped: false;
      durationMs: number;
      bytes: number;
      gender: 'male' | 'female';
      storageId: Id<'_storage'>;
      audioUrl: string | null;
    };

/**
 * Generate audio for ONE (vocabulary item, language) via Google Cloud TTS.
 * Same shape/idempotency contract as
 * `bhashini/vocabularyTts.ts`'s `generateVocabularyAudio`.
 *
 * A human invokes this directly after confirming Bhashini has failed for
 * that (item, language) — e.g.
 *   npx convex run google/vocabularyTts:generateVocabularyAudioGoogle \
 *     '{"categorySlug": "animals", "itemKey": "dog", "languageCode": "hi"}'
 */
export const generateVocabularyAudioGoogle = internalAction({
  args: {
    categorySlug: v.string(),
    itemKey: v.string(),
    languageCode: v.string(),
    genderOverride: v.optional(v.union(v.literal('male'), v.literal('female'))),
    force: v.optional(v.boolean()),
  },
  handler: async (ctx, args): Promise<GenerateVocabularyAudioGoogleResult> => {
    if (!(args.languageCode in GOOGLE_VOICES)) {
      return { ok: false as const, reason: `No Google TTS voice for "${args.languageCode}"` };
    }

    const { item, translation } = await ctx.runQuery(
      internal.bhashini.vocabularyTts.getItemAndTranslation,
      { categorySlug: args.categorySlug, itemKey: args.itemKey, languageCode: args.languageCode },
    );
    if (!item) {
      return {
        ok: false as const,
        reason: `No vocabulary item "${args.itemKey}" in "${args.categorySlug}"`,
      };
    }
    if (!translation) {
      return { ok: false as const, reason: `No "${args.languageCode}" translation for "${args.itemKey}"` };
    }

    if (!args.force) {
      const existing: Doc<'vocabularyAudio'> | null = await ctx.runQuery(
        internal.bhashini.vocabularyTts.findExistingVocabularyAudio,
        { vocabularyItemId: item._id, languageCode: args.languageCode },
      );
      if (existing) return { ok: true as const, skipped: true };
    }

    const gender = args.genderOverride ?? 'female'; // same narrator default as the Bhashini path

    try {
      const apiKey = getGoogleTtsKey();
      const base64 = await synthesize(translation.text, args.languageCode, gender, apiKey);

      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

      const storageId = await ctx.storage.store(new Blob([bytes], { type: 'audio/wav' }));

      // LINEAR16 24kHz 16-bit mono — Google Cloud TTS's default sample rate.
      const durationMs = Math.round((bytes.length / (24000 * 2)) * 1000);

      await ctx.runMutation(internal.vocabulary.upsertVocabularyAudio, {
        categorySlug: args.categorySlug,
        itemKey: args.itemKey,
        languageCode: args.languageCode,
        storageId,
        voiceGender: gender,
        durationMs,
        source: 'google-tts',
      });

      const audioUrl = await ctx.storage.getUrl(storageId);
      return {
        ok: true as const,
        skipped: false,
        durationMs,
        bytes: bytes.length,
        gender,
        storageId,
        audioUrl,
      };
    } catch (err) {
      return { ok: false as const, reason: (err as Error).message };
    }
  },
});
