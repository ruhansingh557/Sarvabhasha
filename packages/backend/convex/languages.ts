import { v } from 'convex/values';
import { query } from './_generated/server';

/**
 * Language picker data. Reads the Convex `languages` TABLE, not
 * `@sarvabhasha/shared`'s `LANGUAGES` array directly — the array is only the
 * seed source (see `seed.ts`). Promoting a language from `draft` to `live` is
 * a data change made against this table, and this query is what makes that
 * change show up in the app with no deploy (CLAUDE.md rule 11).
 */
export const listLiveLanguages = query({
  args: {},
  returns: v.array(
    v.object({
      code: v.string(),
      nativeName: v.string(),
      englishName: v.string(),
      script: v.string(),
    }),
  ),
  handler: async (ctx) => {
    const languages = await ctx.db
      .query('languages')
      .withIndex('by_status_order', (q) => q.eq('status', 'live'))
      .collect();

    // The index already orders by (status, sortOrder), so this is already in
    // sortOrder order — no further sort needed.
    return languages.map((l) => ({
      code: l.code,
      nativeName: l.nativeName,
      englishName: l.englishName,
      script: l.script,
    }));
  },
});
