import { v } from 'convex/values';
import { query } from './_generated/server';
import type { Id } from './_generated/dataModel';
import { PILOT_CATEGORY_SLUG } from '@sarvabhasha/shared';
import { getCurrentUserDoc } from './lib/currentUser';
import { getCategoryStats } from './categories';
import { getLiveTranslationAndAudio, getLivePhrasesForCategory } from './lib/liveContent';
import { fetchStreakDoc } from './progress';

/**
 * One query for the whole Home screen. Reuses `categories.getCategoryStats`
 * for totals (summed across every LIVE category, not just `greetings` — this
 * scales to more categories going live without a code change) and
 * `progress.fetchStreakDoc` for the streak, rather than re-deriving either.
 */

const streakSummary = v.object({
  currentStreak: v.number(),
  longestStreak: v.number(),
  lastActiveDay: v.union(v.string(), v.null()),
});

const continueLearning = v.object({
  phraseId: v.id('phrases'),
  categorySlug: v.string(),
});

const badges = v.object({
  firstPhraseViewed: v.boolean(),
  firstCategoryComplete: v.boolean(),
  sevenDayStreak: v.boolean(),
});

export const getHomeSummary = query({
  args: {},
  returns: v.union(
    v.object({ hasTargetLanguage: v.literal(false) }),
    v.object({
      hasTargetLanguage: v.literal(true),
      streak: streakSummary,
      totalPhrases: v.number(),
      viewedCount: v.number(),
      masteredCount: v.number(),
      continueLearning: v.union(continueLearning, v.null()),
      badges,
    }),
  ),
  handler: async (ctx) => {
    const user = await getCurrentUserDoc(ctx);
    if (!user || !user.targetLanguage) {
      return { hasTargetLanguage: false as const };
    }
    const targetLanguage = user.targetLanguage;

    // Totals across every live category — the same join `categories.ts`
    // uses, summed rather than per-category.
    let totalPhrases = 0;
    let viewedCount = 0;
    let masteredCount = 0;
    for (const s of (await getCategoryStats(ctx, user._id, targetLanguage)).values()) {
      totalPhrases += s.phraseCount;
      viewedCount += s.viewedCount;
      masteredCount += s.masteredCount;
    }

    const streakRow = await fetchStreakDoc(ctx, user._id);
    const streak = streakRow
      ? {
          currentStreak: streakRow.currentStreak,
          longestStreak: streakRow.longestStreak,
          lastActiveDay: streakRow.lastActiveDay,
        }
      : { currentStreak: 0, longestStreak: 0, lastActiveDay: null };

    // "Continue learning" and the `firstCategoryComplete` badge both hinge on
    // the pilot category's ordered, per-phrase browsable list — something
    // `getCategoryStats`'s aggregate counts don't preserve, so this walks
    // `greetings` once more, scoped to just that one category.
    const pilotCategory = await ctx.db
      .query('categories')
      .withIndex('by_slug', (q) => q.eq('slug', PILOT_CATEGORY_SLUG))
      .first();

    let continueLearningResult: { phraseId: Id<'phrases'>; categorySlug: string } | null = null;
    let firstCategoryComplete = false;

    if (pilotCategory && pilotCategory.status === 'live') {
      const livePhrases = await getLivePhrasesForCategory(ctx, pilotCategory._id);
      const browsable: Array<{ phraseId: Id<'phrases'>; masteryLevel: number }> = [];

      for (const phrase of livePhrases) {
        const gated = await getLiveTranslationAndAudio(ctx, phrase._id, targetLanguage);
        if (!gated) continue;

        const progress = await ctx.db
          .query('progress')
          .withIndex('by_user_phrase_language', (q) =>
            q
              .eq('userId', user._id)
              .eq('phraseId', phrase._id)
              .eq('languageCode', targetLanguage),
          )
          .first();

        browsable.push({ phraseId: phrase._id, masteryLevel: progress?.masteryLevel ?? 0 });
      }

      const next = browsable.find((p) => p.masteryLevel < 3);
      continueLearningResult = next
        ? { phraseId: next.phraseId, categorySlug: pilotCategory.slug }
        : null;

      // Only "complete" if there was something browsable to complete — an
      // empty list would otherwise trivially satisfy `.every()` and falsely
      // award the badge before any content exists for this language.
      firstCategoryComplete = browsable.length > 0 && browsable.every((p) => p.masteryLevel >= 3);
    }

    const anyProgress = await ctx.db
      .query('progress')
      .withIndex('by_user_language', (q) =>
        q.eq('userId', user._id).eq('languageCode', targetLanguage),
      )
      .first();

    return {
      hasTargetLanguage: true as const,
      streak,
      totalPhrases,
      viewedCount,
      masteredCount,
      continueLearning: continueLearningResult,
      badges: {
        firstPhraseViewed: !!anyProgress,
        firstCategoryComplete,
        sevenDayStreak: streak.currentStreak >= 7,
      },
    };
  },
});
