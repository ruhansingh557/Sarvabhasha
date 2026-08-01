import { v } from 'convex/values';
import { query } from './_generated/server';
import { contentStatus } from './schema';
import { getCurrentUserDoc } from './lib/currentUser';
import { getLiveTranslationAndAudio, getLivePhrasesForCategory } from './lib/liveContent';

/**
 * Phrase content for the Learn tab. Every query here applies the live-gate
 * from `lib/liveContent.ts`: a phrase counts only when it AND its
 * translation AND its audio are all `live` for the caller's target language.
 *
 * Deliberately does NOT touch the `animations` table (no fal.ai/animation
 * this pass — see specs/content-pipeline.md and the planning note for this
 * change). Add that join when animation ships, not before.
 */

const speakerCharacter = v.union(
  v.literal('dadi'),
  v.literal('parent'),
  v.literal('kid'),
  v.literal('neighbour'),
);

const phraseDoc = v.object({
  _id: v.id('phrases'),
  _creationTime: v.number(),
  categoryId: v.id('categories'),
  phraseKey: v.string(),
  sourceText: v.string(),
  situation: v.string(),
  speakerCharacter,
  difficulty: v.number(),
  sortOrder: v.number(),
  status: contentStatus,
});

/**
 * Raw lookup by stable key, status untouched. `scripts/upload-animation.ts`
 * depends on this exact call shape (`{ phraseKey }` → doc with `_id`) to
 * resolve a phrase before recording a manually-uploaded clip against it —
 * this is admin/authoring tooling, not a learner-facing read, so it does not
 * live-gate.
 */
export const getByKey = query({
  args: { phraseKey: v.string() },
  returns: v.union(phraseDoc, v.null()),
  handler: async (ctx, args) => {
    return await ctx.db
      .query('phrases')
      .withIndex('by_key', (q) => q.eq('phraseKey', args.phraseKey))
      .first();
  },
});

const phraseListItem = v.object({
  phraseId: v.id('phrases'),
  phraseKey: v.string(),
  sourceText: v.string(),
  text: v.string(),
  transliteration: v.string(),
  masteryLevel: v.number(),
  timesViewed: v.number(),
});

/**
 * Discriminated union return: `needsTargetLanguage: true` means "don't even
 * try to render a phrase list — send the learner to the language picker
 * first." The client branches on this rather than inferring it from an empty
 * array, which would be indistinguishable from "this category has zero live
 * phrases in your language yet."
 */
export const listByCategory = query({
  args: { categorySlug: v.string() },
  returns: v.union(
    v.object({ needsTargetLanguage: v.literal(true), phrases: v.array(phraseListItem) }),
    v.object({ needsTargetLanguage: v.literal(false), phrases: v.array(phraseListItem) }),
  ),
  handler: async (ctx, args) => {
    const user = await getCurrentUserDoc(ctx);
    if (!user || !user.targetLanguage) {
      return { needsTargetLanguage: true as const, phrases: [] };
    }
    const targetLanguage = user.targetLanguage;

    const category = await ctx.db
      .query('categories')
      .withIndex('by_slug', (q) => q.eq('slug', args.categorySlug))
      .first();
    if (!category || category.status !== 'live') {
      return { needsTargetLanguage: false as const, phrases: [] };
    }

    const livePhrases = await getLivePhrasesForCategory(ctx, category._id);

    const phrases = [];
    for (const phrase of livePhrases) {
      const gated = await getLiveTranslationAndAudio(ctx, phrase._id, targetLanguage);
      if (!gated) continue; // translation or audio not live for this language yet

      const progress = await ctx.db
        .query('progress')
        .withIndex('by_user_phrase_language', (q) =>
          q.eq('userId', user._id).eq('phraseId', phrase._id).eq('languageCode', targetLanguage),
        )
        .first();

      phrases.push({
        phraseId: phrase._id,
        phraseKey: phrase.phraseKey,
        sourceText: phrase.sourceText,
        text: gated.translation.text,
        transliteration: gated.translation.transliteration,
        masteryLevel: progress?.masteryLevel ?? 0,
        timesViewed: progress?.timesViewed ?? 0,
      });
    }

    return { needsTargetLanguage: false as const, phrases };
  },
});

const phraseDetail = v.object({
  phraseId: v.id('phrases'),
  phraseKey: v.string(),
  sourceText: v.string(),
  situation: v.string(),
  speakerCharacter,
  text: v.string(),
  transliteration: v.string(),
  literalGloss: v.optional(v.string()),
  audioUrl: v.union(v.string(), v.null()),
  durationMs: v.number(),
  masteryLevel: v.number(),
  timesViewed: v.number(),
});

/**
 * The phrase-detail screen. Same live-gate as `listByCategory`, applied to
 * exactly one phrase. Returns `null` for any failure of that gate (no user,
 * no target language, phrase not live, translation/audio not live) — the
 * client shows one "not available" state rather than distinguishing why.
 *
 * NOTE: does not query `animations` — see file header.
 */
export const getDetail = query({
  args: { phraseId: v.id('phrases') },
  returns: v.union(phraseDetail, v.null()),
  handler: async (ctx, args) => {
    const user = await getCurrentUserDoc(ctx);
    if (!user || !user.targetLanguage) return null;
    const targetLanguage = user.targetLanguage;

    const phrase = await ctx.db.get(args.phraseId);
    if (!phrase || phrase.status !== 'live') return null;

    const gated = await getLiveTranslationAndAudio(ctx, phrase._id, targetLanguage);
    if (!gated) return null;

    const progress = await ctx.db
      .query('progress')
      .withIndex('by_user_phrase_language', (q) =>
        q.eq('userId', user._id).eq('phraseId', phrase._id).eq('languageCode', targetLanguage),
      )
      .first();

    return {
      phraseId: phrase._id,
      phraseKey: phrase.phraseKey,
      sourceText: phrase.sourceText,
      situation: phrase.situation,
      speakerCharacter: phrase.speakerCharacter,
      text: gated.translation.text,
      transliteration: gated.translation.transliteration,
      literalGloss: gated.translation.literalGloss,
      audioUrl: await ctx.storage.getUrl(gated.audio.storageId),
      durationMs: gated.audio.durationMs,
      masteryLevel: progress?.masteryLevel ?? 0,
      timesViewed: progress?.timesViewed ?? 0,
    };
  },
});
