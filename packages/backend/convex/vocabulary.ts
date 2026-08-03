import { v } from 'convex/values';
import { internalMutation, query } from './_generated/server';
import type { QueryCtx } from './_generated/server';
import { contentStatus } from './schema';
import { getCurrentUserDoc } from './lib/currentUser';
import {
  getLiveVocabularyItemsForCategory,
  getLiveVocabularyTranslationAndAudio,
} from './lib/liveContent';

/**
 * Vocabulary/Numbers content for the Learn tab — see
 * plans/phase-13-foundations-vocab-numbers-alphabet.md.
 *
 * Numbers is NOT a separate table or a branch in this file: it is a
 * `vocabularyCategories` row like any other (slug: "numbers"), reusing every
 * function below unchanged. A number is a word with a numeral for an image.
 *
 * Same live-gate discipline as `phrases.ts`: `listItemsByCategory` only
 * returns an item when the item itself AND its translation AND its audio are
 * all `live` for the caller's target language — see
 * `lib/liveContent.ts`'s vocabulary helpers.
 */

// ------------------------------------------------------------- client-facing

const vocabularyCategorySummary = v.object({
  _id: v.id('vocabularyCategories'),
  slug: v.string(),
  iconKey: v.string(),
  sortOrder: v.number(),
  status: contentStatus,
});

/**
 * Live categories only — unlike `categories.listCategories`, which
 * deliberately returns every status because phrase-category chrome doubles
 * as a "coming soon" teaser. Vocabulary categories have no such UI need
 * specified yet, so this stays simple: nothing not `live` is exposed.
 */
export const listCategories = query({
  args: {},
  returns: v.array(vocabularyCategorySummary),
  handler: async (ctx) => {
    const categories = await ctx.db
      .query('vocabularyCategories')
      .withIndex('by_status_order', (q) => q.eq('status', 'live'))
      .collect();
    return categories.map((c) => ({
      _id: c._id,
      slug: c.slug,
      iconKey: c.iconKey,
      sortOrder: c.sortOrder,
      status: c.status,
    }));
  },
});

const vocabularyListItem = v.object({
  vocabularyItemId: v.id('vocabularyItems'),
  itemKey: v.string(),
  englishWord: v.string(),
  imageUrl: v.union(v.string(), v.null()),
  text: v.string(),
  transliteration: v.string(),
  audioUrl: v.union(v.string(), v.null()),
  durationMs: v.number(),
});

/**
 * Mirrors `phrases.listByCategory`'s exact shape and auth pattern: a
 * discriminated `needsTargetLanguage` union rather than an ambiguous empty
 * array, and the target language is derived from the caller's own `users`
 * row — never accepted as a client argument (Rule 1).
 */
export const listItemsByCategory = query({
  args: { categorySlug: v.string() },
  returns: v.union(
    v.object({ needsTargetLanguage: v.literal(true), items: v.array(vocabularyListItem) }),
    v.object({ needsTargetLanguage: v.literal(false), items: v.array(vocabularyListItem) }),
  ),
  handler: async (ctx, args) => {
    const user = await getCurrentUserDoc(ctx);
    if (!user || !user.targetLanguage) {
      return { needsTargetLanguage: true as const, items: [] };
    }
    const targetLanguage = user.targetLanguage;

    const category = await ctx.db
      .query('vocabularyCategories')
      .withIndex('by_slug', (q) => q.eq('slug', args.categorySlug))
      .first();
    if (!category || category.status !== 'live') {
      return { needsTargetLanguage: false as const, items: [] };
    }

    const liveItems = await getLiveVocabularyItemsForCategory(ctx, category._id);

    const items = [];
    for (const item of liveItems) {
      const gated = await getLiveVocabularyTranslationAndAudio(ctx, item._id, targetLanguage);
      if (!gated) continue; // translation or audio not live for this language yet

      items.push({
        vocabularyItemId: item._id,
        itemKey: item.itemKey,
        englishWord: item.englishWord,
        imageUrl: item.imageStorageId ? await ctx.storage.getUrl(item.imageStorageId) : null,
        text: gated.translation.text,
        transliteration: gated.translation.transliteration,
        audioUrl: await ctx.storage.getUrl(gated.audio.storageId),
        durationMs: gated.audio.durationMs,
      });
    }
    items.sort((a, b) => a.itemKey.localeCompare(b.itemKey));

    return { needsTargetLanguage: false as const, items };
  },
});

// -------------------------------------------------------- authoring / admin

/**
 * Every internalMutation below is reachable ONLY via `npx convex run` or the
 * content pipeline's own actions — never from the mobile app (same
 * unreachable-by-clients reasoning as `seed.ts`'s header comment). That is
 * what makes idempotent upsert-by-human-key safe here instead of a guarded,
 * one-shot insert.
 *
 * Every lookup below resolves its category by `slug` first (an indexed
 * point lookup), then finds the target row within that category's own
 * `by_category_order` range and filters in memory for the exact `itemKey` —
 * bounded to one category's item count (~15–25, see the plan doc's content
 * scope), never a scan over the whole `vocabularyItems` table. This is the
 * same "index narrows first, filter finishes" shape the Convex guidelines
 * call out as fine, and it avoids adding a dedicated `by_key` index that
 * nothing else in this file needs.
 */
async function resolveCategory(ctx: QueryCtx, categorySlug: string) {
  const category = await ctx.db
    .query('vocabularyCategories')
    .withIndex('by_slug', (q) => q.eq('slug', categorySlug))
    .first();
  if (!category) {
    throw new Error(`No vocabulary category "${categorySlug}" — run upsertVocabularyCategory first.`);
  }
  return category;
}

async function resolveItem(ctx: QueryCtx, categorySlug: string, itemKey: string) {
  const category = await resolveCategory(ctx, categorySlug);
  const items = await ctx.db
    .query('vocabularyItems')
    .withIndex('by_category_order', (q) => q.eq('categoryId', category._id))
    .collect();
  const item = items.find((i) => i.itemKey === itemKey);
  if (!item) {
    throw new Error(
      `No vocabulary item "${itemKey}" in category "${categorySlug}" — run upsertVocabularyItem first.`,
    );
  }
  return item;
}

/**
 * Idempotent upsert of one category's chrome. Lands `draft` on first
 * insert; a re-run only patches `iconKey`/`sortOrder` and deliberately
 * leaves `status` untouched, so re-running this after a category has been
 * promoted (see `promoteCategoryToLive`) never silently demotes it back to
 * draft — unlike `seed.ts`'s `seedCategories`, which can safely re-patch
 * `status` every time because phrase-category `launchStatus` never changes
 * after seeding; vocabulary categories DO change status later, via an
 * explicit promotion step, so this upsert must not fight that.
 */
export const upsertVocabularyCategory = internalMutation({
  args: { slug: v.string(), iconKey: v.string(), sortOrder: v.number() },
  returns: v.id('vocabularyCategories'),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('vocabularyCategories')
      .withIndex('by_slug', (q) => q.eq('slug', args.slug))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, { iconKey: args.iconKey, sortOrder: args.sortOrder });
      return existing._id;
    }
    return await ctx.db.insert('vocabularyCategories', {
      slug: args.slug,
      iconKey: args.iconKey,
      sortOrder: args.sortOrder,
      status: 'draft',
    });
  },
});

/**
 * Idempotent upsert of one vocabulary item's English/structural content.
 *
 * Always lands (or re-lands) `draft`, even on an update — `englishWord` and
 * `imageStorageId` are the reviewable content here (the image in particular
 * is a fal.ai generation, CLAUDE.md rule 14), so changing either invalidates
 * any prior approval, same reasoning as `seed.ts`'s `seedTranslation`.
 * `imageStorageId` is optional so an item can be authored before its image
 * exists yet (pipeline step 1: word research; step 2: image generation) —
 * call this again with the image once it's ready.
 */
export const upsertVocabularyItem = internalMutation({
  args: {
    categorySlug: v.string(),
    itemKey: v.string(),
    englishWord: v.string(),
    imageStorageId: v.optional(v.id('_storage')),
    sortOrder: v.number(),
  },
  returns: v.id('vocabularyItems'),
  handler: async (ctx, args) => {
    const category = await resolveCategory(ctx, args.categorySlug);
    const items = await ctx.db
      .query('vocabularyItems')
      .withIndex('by_category_order', (q) => q.eq('categoryId', category._id))
      .collect();
    const existing = items.find((i) => i.itemKey === args.itemKey);

    const fields = {
      categoryId: category._id,
      itemKey: args.itemKey,
      englishWord: args.englishWord,
      imageStorageId: args.imageStorageId,
      sortOrder: args.sortOrder,
      status: 'draft' as const,
    };

    if (existing) {
      await ctx.db.patch(existing._id, fields);
      return existing._id;
    }
    return await ctx.db.insert('vocabularyItems', fields);
  },
});

/**
 * Stores ONE (item, language) translation. Same "always re-lands as draft,
 * clearing any prior review" discipline as `seed.ts`'s `seedTranslation`.
 */
export const upsertVocabularyTranslation = internalMutation({
  args: {
    categorySlug: v.string(),
    itemKey: v.string(),
    languageCode: v.string(),
    text: v.string(),
    transliteration: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const item = await resolveItem(ctx, args.categorySlug, args.itemKey);

    const existing = await ctx.db
      .query('vocabularyTranslations')
      .withIndex('by_item_language', (q) =>
        q.eq('vocabularyItemId', item._id).eq('languageCode', args.languageCode),
      )
      .first();

    const fields = {
      vocabularyItemId: item._id,
      languageCode: args.languageCode,
      text: args.text,
      transliteration: args.transliteration,
      status: 'draft' as const,
      reviewedBy: undefined,
      reviewedAt: undefined,
    };

    if (existing) {
      await ctx.db.patch(existing._id, fields);
    } else {
      await ctx.db.insert('vocabularyTranslations', fields);
    }
    return null;
  },
});

/**
 * Stores ONE (item, language) audio clip, generated once via
 * `bhashini/tts.ts`'s `synthesize` pattern — never called at runtime
 * (CLAUDE.md rule 10). A single narrator voice per language, not the
 * per-character convention `audioAssets` uses — see the plan doc's "Voice"
 * note and `schema.ts`'s `vocabularyAudio` comment.
 */
export const upsertVocabularyAudio = internalMutation({
  args: {
    categorySlug: v.string(),
    itemKey: v.string(),
    languageCode: v.string(),
    storageId: v.id('_storage'),
    voiceGender: v.union(v.literal('male'), v.literal('female')),
    durationMs: v.number(),
    source: v.union(v.literal('bhashini'), v.literal('google-tts')),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const item = await resolveItem(ctx, args.categorySlug, args.itemKey);

    const existing = await ctx.db
      .query('vocabularyAudio')
      .withIndex('by_item_language', (q) =>
        q.eq('vocabularyItemId', item._id).eq('languageCode', args.languageCode),
      )
      .first();

    const fields = {
      vocabularyItemId: item._id,
      languageCode: args.languageCode,
      storageId: args.storageId,
      voiceGender: args.voiceGender,
      durationMs: args.durationMs,
      source: args.source,
      status: 'draft' as const,
    };

    if (existing) {
      await ctx.db.patch(existing._id, fields);
    } else {
      await ctx.db.insert('vocabularyAudio', fields);
    }
    return null;
  },
});

/**
 * The approval gate for an item's OWN content — its English word and its
 * generated image. Deliberately separate from
 * `approveVocabularyTranslationAndAudio`: an item can be perfectly reviewed
 * in English (a good image, a correct word) while every language's
 * translation is still `draft`, and vice versa — `listItemsByCategory`
 * requires BOTH this AND the per-language gate before an item is browsable.
 * Before calling this, apply the same acceptance discipline as
 * `animations.ts`'s `approveAnimation`: is the generated image actually a
 * clear, brand-consistent depiction of the word, not a near-miss.
 */
export const approveVocabularyItem = internalMutation({
  args: { categorySlug: v.string(), itemKey: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const item = await resolveItem(ctx, args.categorySlug, args.itemKey);
    await ctx.db.patch(item._id, { status: 'live' });
    return null;
  },
});

/**
 * The human-review gate for one (item, language) pair, after a reviewer has
 * listened to the audio and read the translation. Flips BOTH to `live` —
 * mirrors `seed.ts`'s `approveTranslationAndAudio` exactly.
 */
export const approveVocabularyTranslationAndAudio = internalMutation({
  args: { categorySlug: v.string(), itemKey: v.string(), languageCode: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const item = await resolveItem(ctx, args.categorySlug, args.itemKey);

    const translation = await ctx.db
      .query('vocabularyTranslations')
      .withIndex('by_item_language', (q) =>
        q.eq('vocabularyItemId', item._id).eq('languageCode', args.languageCode),
      )
      .first();
    if (!translation) {
      throw new Error(`No "${args.languageCode}" translation for "${args.itemKey}"`);
    }
    await ctx.db.patch(translation._id, { status: 'live' });

    const audio = await ctx.db
      .query('vocabularyAudio')
      .withIndex('by_item_language', (q) =>
        q.eq('vocabularyItemId', item._id).eq('languageCode', args.languageCode),
      )
      .first();
    if (!audio) {
      throw new Error(`No "${args.languageCode}" audio for "${args.itemKey}"`);
    }
    await ctx.db.patch(audio._id, { status: 'live' });

    return null;
  },
});

/**
 * Promotes a vocabulary category's OWN row to `live` — a pure data change,
 * mirrors `seed.ts`'s `promoteLanguageToLive`. Does not check readiness
 * itself; the caller is expected to have confirmed full coverage via
 * `getCategoryCoverage` below first, same "process failure to catch before
 * this call" contract as the language-promotion mutation.
 */
export const promoteCategoryToLive = internalMutation({
  args: { slug: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const category = await resolveCategory(ctx, args.slug);
    await ctx.db.patch(category._id, { status: 'live' });
    return null;
  },
});

const coverageCell = v.object({
  languageCode: v.string(),
  hasTranslation: v.boolean(),
  translationStatus: v.union(contentStatus, v.null()),
  hasAudio: v.boolean(),
  audioStatus: v.union(contentStatus, v.null()),
  ready: v.boolean(),
});

const coverageRow = v.object({
  itemKey: v.string(),
  englishWord: v.string(),
  itemStatus: contentStatus,
  hasImage: v.boolean(),
  cells: v.array(coverageCell),
});

const coveragePerLanguage = v.object({
  languageCode: v.string(),
  translated: v.number(),
  withAudio: v.number(),
  ready: v.number(),
  total: v.number(),
  canPromote: v.boolean(),
});

/**
 * Coverage matrix for a whole vocabulary category — the same
 * "translation × audio completeness per language, before promoting" shape as
 * `review.ts`'s `getCategoryCoverage`. Returns ALL statuses on purpose (this
 * is an admin/authoring dashboard, not a learner-facing read) so it can show
 * holes, not just what's already live.
 */
export const getCategoryCoverage = query({
  args: { categorySlug: v.string(), languageCodes: v.array(v.string()) },
  returns: v.union(
    v.null(),
    v.object({
      category: v.object({ slug: v.string(), status: contentStatus }),
      rows: v.array(coverageRow),
      perLanguage: v.array(coveragePerLanguage),
    }),
  ),
  handler: async (ctx, args) => {
    const category = await ctx.db
      .query('vocabularyCategories')
      .withIndex('by_slug', (q) => q.eq('slug', args.categorySlug))
      .first();
    if (!category) return null;

    const items = await ctx.db
      .query('vocabularyItems')
      .withIndex('by_category_order', (q) => q.eq('categoryId', category._id))
      .collect();

    const rows = await Promise.all(
      items.map(async (item) => {
        const [translations, audio] = await Promise.all([
          ctx.db
            .query('vocabularyTranslations')
            .withIndex('by_item_language', (q) => q.eq('vocabularyItemId', item._id))
            .collect(),
          ctx.db
            .query('vocabularyAudio')
            .withIndex('by_item_language', (q) => q.eq('vocabularyItemId', item._id))
            .collect(),
        ]);

        const tByLang = new Map(translations.map((t) => [t.languageCode, t]));
        const aByLang = new Map(audio.map((a) => [a.languageCode, a]));

        return {
          itemKey: item.itemKey,
          englishWord: item.englishWord,
          itemStatus: item.status,
          hasImage: !!item.imageStorageId,
          cells: args.languageCodes.map((code) => ({
            languageCode: code,
            hasTranslation: tByLang.has(code),
            translationStatus: tByLang.get(code)?.status ?? null,
            hasAudio: aByLang.has(code),
            audioStatus: aByLang.get(code)?.status ?? null,
            ready: tByLang.get(code)?.status === 'live' && aByLang.get(code)?.status === 'live',
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
        /** A language cannot go `live` for this category with holes. */
        canPromote: cells.every((c) => c.ready) && rows.every((r) => r.itemStatus === 'live'),
      };
    });

    return { category: { slug: category.slug, status: category.status }, rows, perLanguage };
  },
});
