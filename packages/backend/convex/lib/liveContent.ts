import type { Doc, Id } from '../_generated/dataModel';
import type { QueryCtx } from '../_generated/server';

/**
 * THE live-gate. Every phrase-content read in this codebase must apply this
 * independently — a phrase can be `live` while its Tamil translation is
 * still `draft`, or while the translation is `live` but the matching audio
 * hasn't been generated yet. Both translation AND audio must be `live` for
 * the (phrase, language) pair, or the phrase does not exist for that
 * learner. See schema.ts's `phraseTranslations` comment and
 * specs/data-model.md's failure-modes table.
 *
 * Returns `null` if either half of the gate fails, so call sites can treat
 * "not live" and "not found" identically (both mean: skip this phrase).
 */
export async function getLiveTranslationAndAudio(
  ctx: QueryCtx,
  phraseId: Id<'phrases'>,
  languageCode: string,
): Promise<{ translation: Doc<'phraseTranslations'>; audio: Doc<'audioAssets'> } | null> {
  const [translation, audio] = await Promise.all([
    ctx.db
      .query('phraseTranslations')
      .withIndex('by_phrase_language', (q) =>
        q.eq('phraseId', phraseId).eq('languageCode', languageCode),
      )
      .first(),
    ctx.db
      .query('audioAssets')
      .withIndex('by_phrase_language', (q) =>
        q.eq('phraseId', phraseId).eq('languageCode', languageCode),
      )
      .first(),
  ]);

  if (!translation || translation.status !== 'live') return null;
  if (!audio || audio.status !== 'live') return null;
  return { translation, audio };
}

/**
 * The phrase's live animation, if one exists. Animation is
 * LANGUAGE-INDEPENDENT (schema.ts structural decision 1) — keyed by
 * `phraseId`, never a translation id, so one clip serves every language.
 * `animations.approveAnimation` archives any previous `live` row when a new
 * one is approved, so at most one `live` animation exists per phrase at a
 * time; this reads all rows for the phrase (bounded — a handful of
 * generation attempts, not a growing set) and returns the live one, or
 * `null` if the phrase has no live animation yet (the normal case — most
 * phrases won't have one).
 */
export async function getLiveAnimation(
  ctx: QueryCtx,
  phraseId: Id<'phrases'>,
): Promise<Doc<'animations'> | null> {
  const animations = await ctx.db
    .query('animations')
    .withIndex('by_phrase', (q) => q.eq('phraseId', phraseId))
    .collect();
  return animations.find((a) => a.status === 'live') ?? null;
}

/**
 * Live phrases for one category, in `sortOrder`. Bounded by the index on
 * `categoryId` — a category's phrase count is small and curated (target
 * ~20/category, see `@sarvabhasha/shared`'s `PHRASES_PER_CATEGORY`), so the
 * in-memory status filter after the indexed fetch is scoped to that handful
 * of rows, not a scan over the whole `phrases` table.
 */
export async function getLivePhrasesForCategory(
  ctx: QueryCtx,
  categoryId: Id<'categories'>,
): Promise<Doc<'phrases'>[]> {
  const phrases = await ctx.db
    .query('phrases')
    .withIndex('by_category_order', (q) => q.eq('categoryId', categoryId))
    .collect();
  return phrases.filter((p) => p.status === 'live');
}
