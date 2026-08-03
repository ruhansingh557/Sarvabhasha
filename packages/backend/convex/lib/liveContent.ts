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

/**
 * Vocabulary/Numbers equivalent of `getLiveTranslationAndAudio` above — same
 * "both halves must independently be `live`" gate, just against the
 * `vocabularyTranslations`/`vocabularyAudio` tables instead of
 * `phraseTranslations`/`audioAssets`. See `vocabulary.ts`.
 */
export async function getLiveVocabularyTranslationAndAudio(
  ctx: QueryCtx,
  vocabularyItemId: Id<'vocabularyItems'>,
  languageCode: string,
): Promise<{ translation: Doc<'vocabularyTranslations'>; audio: Doc<'vocabularyAudio'> } | null> {
  const [translation, audio] = await Promise.all([
    ctx.db
      .query('vocabularyTranslations')
      .withIndex('by_item_language', (q) =>
        q.eq('vocabularyItemId', vocabularyItemId).eq('languageCode', languageCode),
      )
      .first(),
    ctx.db
      .query('vocabularyAudio')
      .withIndex('by_item_language', (q) =>
        q.eq('vocabularyItemId', vocabularyItemId).eq('languageCode', languageCode),
      )
      .first(),
  ]);

  if (!translation || translation.status !== 'live') return null;
  if (!audio || audio.status !== 'live') return null;
  return { translation, audio };
}

/**
 * Live vocabulary items for one category, in `sortOrder`. Bounded the same
 * way as `getLivePhrasesForCategory` — a category's item count is curated
 * (roughly 15–25 words, see the phase-13 plan doc's content-scope section),
 * so the in-memory status filter after the indexed fetch stays scoped to a
 * handful of rows.
 */
export async function getLiveVocabularyItemsForCategory(
  ctx: QueryCtx,
  categoryId: Id<'vocabularyCategories'>,
): Promise<Doc<'vocabularyItems'>[]> {
  const items = await ctx.db
    .query('vocabularyItems')
    .withIndex('by_category_order', (q) => q.eq('categoryId', categoryId))
    .collect();
  return items.filter((i) => i.status === 'live');
}

/**
 * Live characters for one script, in `sortOrder`. Bounded — a script's
 * character count is small (~30–50, see the phase-13 plan doc), so this is
 * never a scan over a growing table the way an unindexed lookup would be.
 */
export async function getLiveScriptCharactersForScript(
  ctx: QueryCtx,
  script: string,
): Promise<Doc<'scriptCharacters'>[]> {
  const characters = await ctx.db
    .query('scriptCharacters')
    .withIndex('by_script_order', (q) => q.eq('script', script))
    .collect();
  return characters.filter((c) => c.status === 'live');
}

/**
 * The `live` audio for one script character, or `null`. Like `audioAssets`
 * (and unlike `animations`), `scriptCharacterAudio` has no `attempt`/model
 * metadata — it is a single upserted row per character, re-recorded in place
 * via `aksharmala.ts`'s upsert mutation, not a growing set of attempts. A
 * plain `.first()` is therefore the right lookup, same as
 * `getLiveTranslationAndAudio` above.
 */
export async function getLiveScriptCharacterAudio(
  ctx: QueryCtx,
  scriptCharacterId: Id<'scriptCharacters'>,
): Promise<Doc<'scriptCharacterAudio'> | null> {
  const audio = await ctx.db
    .query('scriptCharacterAudio')
    .withIndex('by_character', (q) => q.eq('scriptCharacterId', scriptCharacterId))
    .first();
  return audio && audio.status === 'live' ? audio : null;
}
