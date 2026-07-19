/**
 * Review queries — the harness for checking text + audio across languages
 * BEFORE any animation exists.
 *
 * This is deliberately the first thing built. Bhashini TTS quality is uneven
 * across the 22 languages, and that is the riskiest assumption in the product:
 * if Tamil audio is garbled, you want to know now, not after spending on
 * animation. See specs/languages-and-rollout.md.
 *
 * These queries return `draft` rows on purpose — they are for the admin
 * console only, never the app. Client-facing queries filter to `live`
 * (CLAUDE.md rule / schema contentStatus).
 */

import { v } from 'convex/values';
import { query } from './_generated/server';

/**
 * Every language for one phrase, side by side: text, transliteration, audio.
 *
 * This is the review unit. A reviewer plays each language's audio against the
 * displayed text and marks it good or bad. That comparison is the whole point
 * of laying them out together rather than one language at a time.
 */
export const getPhraseAcrossLanguages = query({
  args: { phraseKey: v.string() },
  handler: async (ctx, args) => {
    const phrase = await ctx.db
      .query('phrases')
      .withIndex('by_key', (q) => q.eq('phraseKey', args.phraseKey))
      .first();
    if (!phrase) return null;

    const [translations, audio, animations] = await Promise.all([
      ctx.db
        .query('phraseTranslations')
        .withIndex('by_phrase_language', (q) => q.eq('phraseId', phrase._id))
        .collect(),
      ctx.db
        .query('audioAssets')
        .withIndex('by_phrase_language', (q) => q.eq('phraseId', phrase._id))
        .collect(),
      ctx.db
        .query('animations')
        .withIndex('by_phrase', (q) => q.eq('phraseId', phrase._id))
        .collect(),
    ]);

    const audioByLang = new Map(audio.map((a) => [a.languageCode, a]));

    const languages = await Promise.all(
      translations.map(async (t) => {
        const a = audioByLang.get(t.languageCode);
        return {
          languageCode: t.languageCode,
          text: t.text,
          transliteration: t.transliteration,
          literalGloss: t.literalGloss,
          translationStatus: t.status,
          reviewedAt: t.reviewedAt,
          audio: a
            ? {
                url: await ctx.storage.getUrl(a.storageId),
                durationMs: a.durationMs,
                voiceGender: a.voiceGender,
                status: a.status,
              }
            : null,
        };
      }),
    );

    languages.sort((x, y) => x.languageCode.localeCompare(y.languageCode));

    // Animation is language-INDEPENDENT — one clip serves every language.
    // Null here is expected and fine: the app is designed to work with a
    // static illustration until clips are produced, one at a time.
    const live = animations.find((a) => a.status === 'live');

    return {
      phrase: {
        _id: phrase._id,
        phraseKey: phrase.phraseKey,
        sourceText: phrase.sourceText,
        situation: phrase.situation,
        status: phrase.status,
      },
      languages,
      animation: live ? { url: await ctx.storage.getUrl(live.storageId) } : null,
      hasAnimation: !!live,
    };
  },
});

/**
 * Coverage matrix for a whole category: which (phrase × language) cells have
 * translation and audio, and which are missing.
 *
 * This is the dashboard that tells you whether a language is ready to promote
 * to `live`. A language with holes is not ready, regardless of how good the
 * cells that exist are.
 */
export const getCategoryCoverage = query({
  args: { categorySlug: v.string(), languageCodes: v.array(v.string()) },
  handler: async (ctx, args) => {
    const category = await ctx.db
      .query('categories')
      .withIndex('by_slug', (q) => q.eq('slug', args.categorySlug))
      .first();
    if (!category) return null;

    const phrases = await ctx.db
      .query('phrases')
      .withIndex('by_category_order', (q) => q.eq('categoryId', category._id))
      .collect();

    const rows = await Promise.all(
      phrases.map(async (p) => {
        const [translations, audio] = await Promise.all([
          ctx.db
            .query('phraseTranslations')
            .withIndex('by_phrase_language', (q) => q.eq('phraseId', p._id))
            .collect(),
          ctx.db
            .query('audioAssets')
            .withIndex('by_phrase_language', (q) => q.eq('phraseId', p._id))
            .collect(),
        ]);

        const tByLang = new Map(translations.map((t) => [t.languageCode, t]));
        const aByLang = new Map(audio.map((a) => [a.languageCode, a]));

        return {
          phraseKey: p.phraseKey,
          sourceText: p.sourceText,
          cells: args.languageCodes.map((code) => ({
            languageCode: code,
            hasTranslation: tByLang.has(code),
            translationStatus: tByLang.get(code)?.status ?? null,
            hasAudio: aByLang.has(code),
            audioStatus: aByLang.get(code)?.status ?? null,
            /** Ready = both exist AND both reviewed. */
            ready:
              tByLang.get(code)?.status === 'live' && aByLang.get(code)?.status === 'live',
          })),
        };
      }),
    );

    const perLanguage = args.languageCodes.map((code) => {
      const cells = rows.map((r) => r.cells.find((c) => c.languageCode === code)!);
      return {
        languageCode: code,
        translated: cells.filter((c) => c.hasTranslation).length,
        withAudio: cells.filter((c) => c.hasAudio).length,
        ready: cells.filter((c) => c.ready).length,
        total: rows.length,
        /** A language cannot go `live` with holes. */
        canPromote: cells.every((c) => c.ready),
      };
    });

    return { category: { slug: category.slug, status: category.status }, rows, perLanguage };
  },
});

/** Audio awaiting a listen. Ordered oldest first so nothing is stranded. */
export const getAudioReviewQueue = query({
  args: { languageCode: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const all = await ctx.db.query('audioAssets').collect();
    const pending = all
      .filter((a) => a.status === 'draft')
      .filter((a) => !args.languageCode || a.languageCode === args.languageCode)
      .sort((x, y) => x._creationTime - y._creationTime);

    return Promise.all(
      pending.map(async (a) => {
        const phrase = await ctx.db.get(a.phraseId);
        const translation = await ctx.db
          .query('phraseTranslations')
          .withIndex('by_phrase_language', (q) =>
            q.eq('phraseId', a.phraseId).eq('languageCode', a.languageCode),
          )
          .first();

        return {
          audioId: a._id,
          languageCode: a.languageCode,
          durationMs: a.durationMs,
          url: await ctx.storage.getUrl(a.storageId),
          sourceText: phrase?.sourceText ?? '(missing phrase)',
          text: translation?.text ?? '(missing translation)',
          transliteration: translation?.transliteration ?? '',
        };
      }),
    );
  },
});
