import { v } from 'convex/values';
import { internalMutation } from './_generated/server';
import { LANGUAGES, CATEGORIES, PILOT_CATEGORY_SLUG } from '@sarvabhasha/shared';

/**
 * Authoring-time setup, not app functionality.
 *
 * Every export here is an `internalMutation` — reachable ONLY via
 * `npx convex run seed:<name>`, never from the mobile app or admin console.
 * That is what makes it safe for these to be idempotent upserts rather than
 * guarded, one-shot inserts: re-running a seed script during content setup
 * should never fail or duplicate rows.
 *
 * `seedTranslation` deliberately takes phrase TEXT as an argument rather than
 * containing any Hindi/Bengali/etc. content itself — translation text is
 * supplied by a human at call time, never hardcoded here.
 */

export const seedLanguages = internalMutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    for (const lang of LANGUAGES) {
      const existing = await ctx.db
        .query('languages')
        .withIndex('by_code', (q) => q.eq('code', lang.code))
        .first();

      const fields = {
        code: lang.code,
        nativeName: lang.nativeName,
        englishName: lang.englishName,
        script: lang.script,
        ttsQuality: lang.ttsQuality,
        // `launchStatus` is only the SEED value — promoting a language after
        // this is a data change against the `languages` table, not a re-run
        // of this function (CLAUDE.md rule 11).
        status: lang.launchStatus,
        sortOrder: lang.sortOrder,
      };

      if (existing) {
        await ctx.db.patch(existing._id, fields);
      } else {
        await ctx.db.insert('languages', fields);
      }
    }
    return null;
  },
});

export const seedCategories = internalMutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    for (const category of CATEGORIES) {
      const existing = await ctx.db
        .query('categories')
        .withIndex('by_slug', (q) => q.eq('slug', category.slug))
        .first();

      const fields = {
        slug: category.slug,
        iconKey: category.iconKey,
        sortOrder: category.sortOrder,
        status: category.launchStatus,
      };

      if (existing) {
        await ctx.db.patch(existing._id, fields);
      } else {
        await ctx.db.insert('categories', fields);
      }
    }
    return null;
  },
});

/**
 * Hand-authored English structural metadata for the pilot category — NOT
 * machine-translated content, so `status: 'live'` from the start is correct
 * here (CLAUDE.md's "generated content never auto-publishes" rule targets
 * AI-generated/translated material, not this). `seedCategories` must have
 * run first.
 */
const GREETINGS_PHRASES = [
  {
    phraseKey: 'namaste-hello',
    sourceText: 'Hello, how are you?',
    situation: 'A neighbour greets Dadi on the street in the morning.',
    speakerCharacter: 'dadi' as const,
    difficulty: 1,
    sortOrder: 1,
  },
  {
    phraseKey: 'dhanyavaad-thank-you',
    sourceText: 'Thank you',
    situation: 'Dadi thanks the neighbour for carrying her bag.',
    speakerCharacter: 'dadi' as const,
    difficulty: 1,
    sortOrder: 2,
  },
  {
    phraseKey: 'kaise-ho-how-are-you',
    sourceText: 'How are you doing?',
    situation: 'The neighbour asks Dadi how she has been.',
    speakerCharacter: 'neighbour' as const,
    difficulty: 1,
    sortOrder: 3,
  },
  {
    phraseKey: 'phir-milenge-goodbye',
    sourceText: 'See you again',
    situation: 'Dadi waves goodbye to the neighbour at the end of their chat.',
    speakerCharacter: 'dadi' as const,
    difficulty: 1,
    sortOrder: 4,
  },
  {
    phraseKey: 'shubh-prabhat-good-morning',
    sourceText: 'Good morning',
    situation: 'The neighbour greets Dadi first thing in the morning.',
    speakerCharacter: 'neighbour' as const,
    difficulty: 1,
    sortOrder: 5,
  },
];

export const seedGreetingsPhrases = internalMutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const category = await ctx.db
      .query('categories')
      .withIndex('by_slug', (q) => q.eq('slug', PILOT_CATEGORY_SLUG))
      .first();
    if (!category) {
      throw new Error(`Category "${PILOT_CATEGORY_SLUG}" not found — run seedCategories first.`);
    }

    for (const phrase of GREETINGS_PHRASES) {
      const existing = await ctx.db
        .query('phrases')
        .withIndex('by_key', (q) => q.eq('phraseKey', phrase.phraseKey))
        .first();
      if (existing) continue; // safe to re-run

      await ctx.db.insert('phrases', {
        categoryId: category._id,
        phraseKey: phrase.phraseKey,
        sourceText: phrase.sourceText,
        situation: phrase.situation,
        speakerCharacter: phrase.speakerCharacter,
        difficulty: phrase.difficulty,
        sortOrder: phrase.sortOrder,
        status: 'live',
      });
    }
    return null;
  },
});

/**
 * The second category. Same "hand-authored English structural metadata,
 * status: 'live' from the start" reasoning as GREETINGS_PHRASES above — see
 * plans/phase-5-content-pipeline-animation.md's "Plan: numbers-money" section
 * for how this phrase set was chosen (cross-checked against real Hindi
 * phrasebook/dictionary sources, not invented) and why Neighbour plays "the
 * vendor" across all five, giving the category a small coherent narrative.
 */
const NUMBERS_MONEY_PHRASES = [
  {
    phraseKey: 'kitne-ka-hai-how-much',
    sourceText: 'How much is this?',
    situation: 'Parent picks up vegetables at the Neighbour’s cart and asks the price.',
    speakerCharacter: 'parent' as const,
    difficulty: 1,
    sortOrder: 1,
  },
  {
    phraseKey: 'bahut-mahanga-too-expensive',
    sourceText: 'That’s too expensive',
    situation: 'The Neighbour names a price; Parent reacts, unimpressed.',
    speakerCharacter: 'parent' as const,
    difficulty: 1,
    sortOrder: 2,
  },
  {
    phraseKey: 'thoda-kam-karo-lower-price',
    sourceText: 'Can you lower the price a little?',
    situation: 'Parent tries to talk the price down before buying.',
    speakerCharacter: 'parent' as const,
    difficulty: 1,
    sortOrder: 3,
  },
  {
    phraseKey: 'paanch-rupaye-five-rupees',
    sourceText: 'I have five rupees',
    situation: 'Kid counts his coins at the Neighbour’s sweet stall, proud of the exact amount.',
    speakerCharacter: 'kid' as const,
    difficulty: 1,
    sortOrder: 4,
  },
  {
    phraseKey: 'chutta-nahi-hai-no-change',
    sourceText: 'I don’t have change',
    situation: 'The Neighbour can’t break Parent’s large note.',
    speakerCharacter: 'neighbour' as const,
    difficulty: 1,
    sortOrder: 5,
  },
];

export const seedNumbersMoneyPhrases = internalMutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const category = await ctx.db
      .query('categories')
      .withIndex('by_slug', (q) => q.eq('slug', 'numbers-money'))
      .first();
    if (!category) {
      throw new Error('Category "numbers-money" not found — run seedCategories first.');
    }

    for (const phrase of NUMBERS_MONEY_PHRASES) {
      const existing = await ctx.db
        .query('phrases')
        .withIndex('by_key', (q) => q.eq('phraseKey', phrase.phraseKey))
        .first();
      if (existing) continue; // safe to re-run

      await ctx.db.insert('phrases', {
        categoryId: category._id,
        phraseKey: phrase.phraseKey,
        sourceText: phrase.sourceText,
        situation: phrase.situation,
        speakerCharacter: phrase.speakerCharacter,
        difficulty: phrase.difficulty,
        sortOrder: phrase.sortOrder,
        status: 'live',
      });
    }
    return null;
  },
});

/**
 * Stores ONE (phrase, language) translation. Text is supplied by the caller
 * — this function has no opinion on what any language's translation says.
 *
 * Always lands (or re-lands) as `status: 'draft'`, even on an update to an
 * existing row: editing the text invalidates whatever review a previous
 * version received, so any prior `reviewedBy`/`reviewedAt` is cleared along
 * with it. A human flips it to `live` afterward, outside this function —
 * exactly the same gate machine-translated content goes through everywhere
 * else in this codebase.
 */
export const seedTranslation = internalMutation({
  args: {
    phraseKey: v.string(),
    languageCode: v.string(),
    text: v.string(),
    transliteration: v.string(),
    literalGloss: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const phrase = await ctx.db
      .query('phrases')
      .withIndex('by_key', (q) => q.eq('phraseKey', args.phraseKey))
      .first();
    if (!phrase) {
      throw new Error(`No phrase with key "${args.phraseKey}" — seed the phrase first.`);
    }

    const existing = await ctx.db
      .query('phraseTranslations')
      .withIndex('by_phrase_language', (q) =>
        q.eq('phraseId', phrase._id).eq('languageCode', args.languageCode),
      )
      .first();

    const fields = {
      phraseId: phrase._id,
      languageCode: args.languageCode,
      text: args.text,
      transliteration: args.transliteration,
      literalGloss: args.literalGloss,
      status: 'draft' as const,
      reviewedBy: undefined,
      reviewedAt: undefined,
    };

    if (existing) {
      await ctx.db.patch(existing._id, fields);
    } else {
      await ctx.db.insert('phraseTranslations', fields);
    }
    return null;
  },
});

/**
 * The human-review gate for one (phrase, language) pair, after a reviewer has
 * actually listened to the audio and read the translation. Flips BOTH the
 * translation and audio to `live` — a phrase isn't browsable to a learner
 * until both are, so approving one without the other is never useful.
 *
 * Stopgap until `apps/admin` exists: at seed-data volume (a handful of rows),
 * running this via `npx convex run` is cheaper and more auditable than a
 * dedicated approval UI would be to build right now.
 */
export const approveTranslationAndAudio = internalMutation({
  args: { phraseKey: v.string(), languageCode: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const phrase = await ctx.db
      .query('phrases')
      .withIndex('by_key', (q) => q.eq('phraseKey', args.phraseKey))
      .first();
    if (!phrase) {
      throw new Error(`No phrase with key "${args.phraseKey}"`);
    }

    const translation = await ctx.db
      .query('phraseTranslations')
      .withIndex('by_phrase_language', (q) =>
        q.eq('phraseId', phrase._id).eq('languageCode', args.languageCode),
      )
      .first();
    if (!translation) {
      throw new Error(`No "${args.languageCode}" translation for "${args.phraseKey}"`);
    }
    await ctx.db.patch(translation._id, { status: 'live' });

    const audio = await ctx.db
      .query('audioAssets')
      .withIndex('by_phrase_language', (q) =>
        q.eq('phraseId', phrase._id).eq('languageCode', args.languageCode),
      )
      .first();
    if (!audio) {
      throw new Error(`No "${args.languageCode}" audio for "${args.phraseKey}"`);
    }
    await ctx.db.patch(audio._id, { status: 'live' });

    return null;
  },
});
