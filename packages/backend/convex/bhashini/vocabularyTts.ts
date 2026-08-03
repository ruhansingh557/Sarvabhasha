/**
 * Bhashini Text-to-Speech for vocabulary/number items — AUTHORING TIME ONLY.
 *
 * Sibling of `tts.ts` (phrase audio), reusing the exact same HTTP flow via
 * `./lib`'s `getTtsPipelineConfig`/`synthesizeTts`/`decodeBase64Audio` —
 * see plans/phase-13-foundations-vocab-numbers-alphabet.md. The only real
 * difference from `tts.ts` is WHERE the result is written:
 * `vocabulary.upsertVocabularyAudio`, keyed by (categorySlug, itemKey,
 * languageCode) instead of (phraseId, languageCode) — vocabulary items have
 * no `speakerCharacter` to derive a voice from, so gender defaults to
 * `female` (the plan doc's "single consistent narrator voice per language"
 * decision, reusing the existing convention that female voices are
 * generally better-trained on Bhashini) unless overridden.
 *
 * `internalAction` only, never a client-facing `action` — CLAUDE.md rule 10.
 */

import { v } from 'convex/values';
import { internalAction, internalQuery } from '../_generated/server';
import { internal } from '../_generated/api';
import type { Doc, Id } from '../_generated/dataModel';
import { TTS_LANGUAGES } from '@sarvabhasha/shared';
import { getBhashiniCredentials, getTtsPipelineConfig, synthesizeTts, decodeBase64Audio } from './lib';

// ---------------------------------------------------------------- internals

/**
 * Resolves (categorySlug, itemKey) → the item row, the same "narrow via
 * category index, filter in memory" shape `vocabulary.ts`'s own
 * (unexported) `resolveItem` uses — duplicated here rather than imported
 * because that helper isn't exported, and this file needs it from inside an
 * `internalQuery` (actions have no `ctx.db` of their own).
 */
export const getItemAndTranslation = internalQuery({
  args: { categorySlug: v.string(), itemKey: v.string(), languageCode: v.string() },
  handler: async (ctx, args) => {
    const category = await ctx.db
      .query('vocabularyCategories')
      .withIndex('by_slug', (q) => q.eq('slug', args.categorySlug))
      .first();
    if (!category) return { item: null, translation: null };

    const items = await ctx.db
      .query('vocabularyItems')
      .withIndex('by_category_order', (q) => q.eq('categoryId', category._id))
      .collect();
    const item = items.find((i) => i.itemKey === args.itemKey) ?? null;
    if (!item) return { item: null, translation: null };

    const translation = await ctx.db
      .query('vocabularyTranslations')
      .withIndex('by_item_language', (q) =>
        q.eq('vocabularyItemId', item._id).eq('languageCode', args.languageCode),
      )
      .first();

    return { item, translation };
  },
});

export const findExistingVocabularyAudio = internalQuery({
  args: { vocabularyItemId: v.id('vocabularyItems'), languageCode: v.string() },
  handler: async (ctx, args) =>
    await ctx.db
      .query('vocabularyAudio')
      .withIndex('by_item_language', (q) =>
        q.eq('vocabularyItemId', args.vocabularyItemId).eq('languageCode', args.languageCode),
      )
      .first(),
});

// ------------------------------------------------------------------ actions

type GenerateVocabularyAudioResult =
  | { ok: false; reason: string }
  | { ok: true; skipped: true }
  | {
      ok: true;
      skipped: false;
      durationMs: number;
      bytes: number;
      gender: 'male' | 'female';
      storageId: Id<'_storage'>;
      /** Signed URL, returned purely so an authoring script can fetch the clip for review. */
      audioUrl: string | null;
    };

/**
 * Generate audio for ONE (vocabulary item, language). Idempotent — skips if
 * audio already exists unless `force` is set, same contract as
 * `tts.generateAudioForPhrase`.
 */
export const generateVocabularyAudio = internalAction({
  args: {
    categorySlug: v.string(),
    itemKey: v.string(),
    languageCode: v.string(),
    genderOverride: v.optional(v.union(v.literal('male'), v.literal('female'))),
    force: v.optional(v.boolean()),
  },
  handler: async (ctx, args): Promise<GenerateVocabularyAudioResult> => {
    if (!TTS_LANGUAGES.has(args.languageCode)) {
      return { ok: false as const, reason: `No Bhashini TTS voice for "${args.languageCode}"` };
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

    const gender = args.genderOverride ?? 'female'; // narrator default, no speakerCharacter here

    try {
      const creds = getBhashiniCredentials();
      const config = await getTtsPipelineConfig(args.languageCode, gender, creds);
      const base64 = await synthesizeTts(translation.text, args.languageCode, gender, config, creds);
      const { bytes, durationMs } = decodeBase64Audio(base64);

      const storageId = await ctx.storage.store(new Blob([bytes], { type: 'audio/wav' }));

      await ctx.runMutation(internal.vocabulary.upsertVocabularyAudio, {
        categorySlug: args.categorySlug,
        itemKey: args.itemKey,
        languageCode: args.languageCode,
        storageId,
        voiceGender: gender,
        durationMs,
        source: 'bhashini',
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

/**
 * Fan out over a list of items in ONE category/language, sequentially with a
 * delay — Bhashini is free but rate-limited/flaky, same reasoning as
 * `tts.generateAudioForPhraseAllLanguages`.
 */
export const generateVocabularyAudioForCategory = internalAction({
  args: {
    categorySlug: v.string(),
    itemKeys: v.array(v.string()),
    languageCode: v.string(),
    genderOverride: v.optional(v.union(v.literal('male'), v.literal('female'))),
    force: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const results: Array<{
      itemKey: string;
      ok: boolean;
      detail: string;
      audioUrl: string | null;
    }> = [];

    for (const itemKey of args.itemKeys) {
      const r = await ctx.runAction(internal.bhashini.vocabularyTts.generateVocabularyAudio, {
        categorySlug: args.categorySlug,
        itemKey,
        languageCode: args.languageCode,
        genderOverride: args.genderOverride,
        force: args.force,
      });

      results.push({
        itemKey,
        ok: r.ok,
        detail: r.ok
          ? r.skipped
            ? 'already existed'
            : `${r.gender}, ${r.durationMs}ms, ${(r.bytes! / 1024).toFixed(0)}KB`
          : r.reason,
        audioUrl: r.ok && !r.skipped ? r.audioUrl : null,
      });

      await new Promise((resolve) => setTimeout(resolve, 400));
    }

    return {
      categorySlug: args.categorySlug,
      languageCode: args.languageCode,
      succeeded: results.filter((r) => r.ok).length,
      failed: results.filter((r) => !r.ok).length,
      results,
    };
  },
});
