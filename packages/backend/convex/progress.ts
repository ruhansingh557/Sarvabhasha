import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import type { Doc, Id } from './_generated/dataModel';
import type { QueryCtx } from './_generated/server';
import { daysBetween } from '@sarvabhasha/shared';
import { getCurrentUserDoc, requireCurrentUserDoc } from './lib/currentUser';
import { assertDayKeyFresh } from './lib/dayKey';

/**
 * Phrase progress and the daily streak. Both update in `recordViewed`
 * — ONE mutation, ONE transaction — per schema.ts's structural decision 2:
 * "a check in one function and a call in another is not a limit," and the
 * same reasoning applies to progress/streak coherence. Two mutations here
 * would let a crash between them leave a viewed phrase with no streak credit.
 *
 * The "device-local day, server-clamped" check itself lives in
 * `lib/dayKey.ts` — `tutor.sendMessage`'s safety-net rate limit reuses the
 * exact same pattern, so it's shared rather than duplicated.
 */

/**
 * A placeholder heuristic, not tuned pedagogy: a phrase viewed at all is
 * mastery 1, 3+ views is 2, 6+ views is 3. Revisit once there is a real
 * signal (e.g. a pronunciation check) to base mastery on.
 */
function masteryLevelForViews(timesViewed: number): number {
  if (timesViewed >= 6) return 3;
  if (timesViewed >= 3) return 2;
  return 1;
}

/** Shared by `getStreak` and `home.getHomeSummary` — one query, reused. */
export async function fetchStreakDoc(
  ctx: QueryCtx,
  userId: Id<'users'>,
): Promise<Doc<'streaks'> | null> {
  return await ctx.db
    .query('streaks')
    .withIndex('by_user', (q) => q.eq('userId', userId))
    .first();
}

export const recordViewed = mutation({
  args: { phraseId: v.id('phrases'), dayKey: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    assertDayKeyFresh(args.dayKey);

    const user = await requireCurrentUserDoc(ctx);
    if (!user.targetLanguage) {
      throw new Error('No targetLanguage set — call users.setTargetLanguage first');
    }
    const targetLanguage = user.targetLanguage;

    // --- progress: upsert (user, phrase, language) ---
    const existingProgress = await ctx.db
      .query('progress')
      .withIndex('by_user_phrase_language', (q) =>
        q.eq('userId', user._id).eq('phraseId', args.phraseId).eq('languageCode', targetLanguage),
      )
      .first();

    const timesViewed = (existingProgress?.timesViewed ?? 0) + 1;
    const masteryLevel = Math.min(3, Math.max(0, masteryLevelForViews(timesViewed)));
    const lastViewedAt = Date.now();

    if (existingProgress) {
      await ctx.db.patch(existingProgress._id, { timesViewed, masteryLevel, lastViewedAt });
    } else {
      await ctx.db.insert('progress', {
        userId: user._id,
        phraseId: args.phraseId,
        languageCode: targetLanguage,
        timesViewed,
        masteryLevel,
        lastViewedAt,
      });
    }

    // --- streak: upsert (user) ---
    const streak = await fetchStreakDoc(ctx, user._id);
    if (!streak) {
      await ctx.db.insert('streaks', {
        userId: user._id,
        currentStreak: 1,
        longestStreak: 1,
        lastActiveDay: args.dayKey,
      });
    } else {
      const gap = daysBetween(streak.lastActiveDay, args.dayKey);
      if (gap === 0) {
        // Same day already recorded — no-op on the streak fields.
      } else if (gap === 1) {
        const currentStreak = streak.currentStreak + 1;
        await ctx.db.patch(streak._id, {
          currentStreak,
          longestStreak: Math.max(streak.longestStreak, currentStreak),
          lastActiveDay: args.dayKey,
        });
      } else if (gap > 1) {
        await ctx.db.patch(streak._id, { currentStreak: 1, lastActiveDay: args.dayKey });
      }
      // gap < 0: dayKey is earlier than the recorded lastActiveDay — a stale
      // or out-of-order call (e.g. a second device with clock skew). Ignore
      // rather than regress the streak or move lastActiveDay backward.
    }

    return null;
  },
});

const streakDoc = v.object({
  _id: v.id('streaks'),
  _creationTime: v.number(),
  userId: v.id('users'),
  currentStreak: v.number(),
  longestStreak: v.number(),
  lastActiveDay: v.string(),
});

const streakFallback = v.object({
  currentStreak: v.number(),
  longestStreak: v.number(),
  lastActiveDay: v.null(),
});

/** No session / no `users` row → `null`. Session but no streak yet → zeros. */
export const getStreak = query({
  args: {},
  returns: v.union(v.null(), streakDoc, streakFallback),
  handler: async (ctx) => {
    const user = await getCurrentUserDoc(ctx);
    if (!user) return null;

    const streak = await fetchStreakDoc(ctx, user._id);
    if (!streak) return { currentStreak: 0, longestStreak: 0, lastActiveDay: null };
    return streak;
  },
});
