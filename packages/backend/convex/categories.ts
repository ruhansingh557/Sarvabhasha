import { v } from 'convex/values';
import { query } from './_generated/server';
import type { Id } from './_generated/dataModel';
import type { QueryCtx } from './_generated/server';
import { contentStatus } from './schema';
import { getCurrentUserDoc } from './lib/currentUser';
import { getLiveTranslationAndAudio, getLivePhrasesForCategory } from './lib/liveContent';

/**
 * Category chrome for the Learn tab.
 *
 * Deliberately different rule from every other client-facing query in this
 * file: `listCategories` returns ALL categories regardless of `status`, not
 * just `live` ones. Category slug/icon/order is navigation chrome, not lesson
 * content — a learner seeing a greyed-out "Numbers & Money (coming soon)"
 * tile is fine; a learner seeing an unreviewed machine-translated PHRASE is
 * the actual failure mode CLAUDE.md's live-only rule exists to prevent.
 * Phrase/translation/audio content underneath a category is still strictly
 * live-gated — see `getCategoryStats` below and `phrases.ts`.
 */

export type CategoryStats = {
  phraseCount: number;
  viewedCount: number;
  masteredCount: number;
};

/**
 * Per-category phrase/progress counts for one user + target language, for
 * every LIVE category at once. Exported so `home.ts` can reuse the exact same
 * join logic for its "continue learning" / totals computation instead of
 * duplicating it — the two screens must never disagree about what counts as
 * "browsable."
 *
 * Non-live categories are intentionally absent from the returned map — call
 * sites treat a missing entry as `{0, 0, 0}` (see `listCategories` below),
 * because a draft/archived category has no reviewed phrases to count.
 */
export async function getCategoryStats(
  ctx: QueryCtx,
  userId: Id<'users'>,
  targetLanguage: string,
): Promise<Map<Id<'categories'>, CategoryStats>> {
  const liveCategories = await ctx.db
    .query('categories')
    .withIndex('by_status_order', (q) => q.eq('status', 'live'))
    .collect();

  // Fetched once for the user+language and reused across every category
  // below, rather than re-querying per category — this is the "iterate
  // phrases first, restructure around a single progress fetch" shape.
  const progressRows = await ctx.db
    .query('progress')
    .withIndex('by_user_language', (q) => q.eq('userId', userId).eq('languageCode', targetLanguage))
    .collect();
  const progressByPhrase = new Map(progressRows.map((p) => [p.phraseId, p]));

  const stats = new Map<Id<'categories'>, CategoryStats>();

  for (const category of liveCategories) {
    const phrases = await getLivePhrasesForCategory(ctx, category._id);

    let phraseCount = 0;
    let viewedCount = 0;
    let masteredCount = 0;

    for (const phrase of phrases) {
      const gated = await getLiveTranslationAndAudio(ctx, phrase._id, targetLanguage);
      if (!gated) continue; // not browsable for this language yet

      phraseCount++;
      const progress = progressByPhrase.get(phrase._id);
      if (progress) {
        viewedCount++;
        if (progress.masteryLevel >= 3) masteredCount++;
      }
    }

    stats.set(category._id, { phraseCount, viewedCount, masteredCount });
  }

  return stats;
}

const categorySummary = v.object({
  _id: v.id('categories'),
  slug: v.string(),
  iconKey: v.string(),
  sortOrder: v.number(),
  status: contentStatus,
  phraseCount: v.number(),
  viewedCount: v.number(),
  masteredCount: v.number(),
});

/**
 * ALL categories (see file header for why), each annotated with live counts
 * for the caller's target language — zero when the category isn't `live`
 * yet, or the caller has no `targetLanguage` selected. Display name is
 * deliberately absent: that's `packages/shared`'s `i18nKey`, merged client-
 * side from the slug.
 */
export const listCategories = query({
  args: {},
  returns: v.array(categorySummary),
  handler: async (ctx) => {
    // Only 9 rows total — a full scan here is fine (see file header / task
    // spec); this is the one place in this codebase collect() on a whole
    // table is deliberate rather than an oversight.
    const categories = await ctx.db.query('categories').collect();
    categories.sort((a, b) => a.sortOrder - b.sortOrder);

    const user = await getCurrentUserDoc(ctx);
    const targetLanguage = user?.targetLanguage;

    const stats =
      user && targetLanguage ? await getCategoryStats(ctx, user._id, targetLanguage) : null;

    return categories.map((c) => {
      const s = c.status === 'live' ? stats?.get(c._id) : undefined;
      return {
        _id: c._id,
        slug: c.slug,
        iconKey: c.iconKey,
        sortOrder: c.sortOrder,
        status: c.status,
        phraseCount: s?.phraseCount ?? 0,
        viewedCount: s?.viewedCount ?? 0,
        masteredCount: s?.masteredCount ?? 0,
      };
    });
  },
});
