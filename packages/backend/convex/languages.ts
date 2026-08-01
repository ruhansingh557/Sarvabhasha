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

/**
 * All 22 languages, regardless of `status`. For UI-language selection
 * (`users.uiLanguage`), NOT target-language/lesson-content selection.
 *
 * Unlike `listLiveLanguages`, this is deliberately unfiltered: which language
 * the interface chrome renders in is not a claim about lesson-content
 * readiness, so a `draft` language (no reviewed phrases yet) is still a
 * legitimate UI language choice. See the `uiLanguage` schema comment in
 * `schema.ts` ("ISO 639-1, any of the 22").
 */
export const listAllLanguages = query({
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
    // No status predicate to express here — every row is wanted regardless
    // of status — and the table is bounded (22 rows, seeded once, never
    // grows with users or content), so a full scan is the right call rather
    // than routing through an index that would only reorder the same rows.
    const languages = await ctx.db.query('languages').collect();

    return languages
      .slice()
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((l) => ({
        code: l.code,
        nativeName: l.nativeName,
        englishName: l.englishName,
        script: l.script,
      }));
  },
});
