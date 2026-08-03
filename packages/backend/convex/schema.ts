import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

/**
 * Sarvabhasha Convex schema.
 *
 * Authoritative design: specs/data-model.md. Update both together.
 *
 * TWO STRUCTURAL DECISIONS everything else inherits:
 *
 *   1. Language fan-out happens BELOW the phrase, not at it.
 *      A phrase is a concept. Its translation and audio are per-language.
 *      Its ANIMATION IS NOT — `animations.phraseId`, never a translation id.
 *      This is what makes 22 languages cost the same as 1 in fal.ai credits.
 *
 *   2. Usage is incremented in the SAME TRANSACTION that authorises the call.
 *      A check in one function and a call in another is not a limit.
 */

/**
 * Content lifecycle. Client-facing queries return ONLY `live`.
 * Exported so query/mutation return validators elsewhere can reuse the same
 * union instead of redeclaring it (Rule 10: unions for status fields, never
 * a bare string).
 */
export const contentStatus = v.union(
  v.literal('draft'),
  v.literal('review'),
  v.literal('live'),
  v.literal('archived'),
);

/**
 * Which TTS provider generated an `audioAssets` row. Bhashini is primary
 * (free, 22-language coverage); `google-tts` is a manually-invoked fallback
 * for when Bhashini fails for a given (phrase, language) — see
 * `convex/google/tts.ts`. A union, not a bare string, so a typo'd provider
 * name fails at the schema boundary instead of silently landing in the DB.
 */
export const audioSource = v.union(v.literal('bhashini'), v.literal('google-tts'));

/**
 * The four looping avatar-clip states a tutor turn can carry. Shared between
 * `personaAnimations` (the language-independent avatar clip per
 * character+expression) and `tutorMessages` (which expression a given
 * Gemini-sourced assistant reply carries) so both tables draw from one
 * definition instead of two copies drifting apart. `tutor.ts`'s `EXPRESSIONS`
 * const is the same four values in array form, for Gemini's JSON response
 * schema — that one can't be a Convex validator, so it stays separate.
 */
export const tutorExpression = v.union(
  v.literal('neutral'),
  v.literal('happy'),
  v.literal('encouraging'),
  v.literal('thinking'),
);

/**
 * A script character's grammatical role. Exported the same way as
 * `tutorExpression` above, for reuse anywhere else that needs to talk about
 * Aksharmala content (e.g. a future `apps/admin` filter) without redeclaring
 * the union. See `scriptCharacters` below for why this is keyed by SCRIPT,
 * not by language.
 */
export const scriptCharacterType = v.union(
  v.literal('vowel'),
  v.literal('consonant'),
  v.literal('conjunct'),
);

export default defineSchema({
  // ---------------------------------------------------------------- identity

  /**
   * Mirrored from the Better Auth component via onCreate/onUpdate/onDelete
   * triggers. NEVER accept a userId as a client argument — derive it from the
   * auth identity. See specs/auth.md and the ai-drafted reference pattern.
   */
  users: defineTable({
    authId: v.string(),
    name: v.optional(v.string()),
    email: v.optional(v.string()),

    /** ISO 639-1. Any of the 22 — independent of targetLanguage. */
    uiLanguage: v.string(),
    /**
     * ISO 639-1. Must be a language whose status is `live`.
     * `undefined` is a REAL state, not a missing-data bug: a brand-new user
     * has not chosen one yet. The client renders a "choose your language"
     * empty state rather than treating this as an error. Set exactly once
     * via `users.setTargetLanguage`, which enforces the `live` constraint.
     */
    targetLanguage: v.optional(v.string()),

    /**
     * `unknown` BLOCKS the tutor entirely until birth year is collected.
     * Content is never age-gated. See specs/monetization-and-limits.md.
     */
    birthYear: v.optional(v.number()),
    ageBand: v.union(v.literal('unknown'), v.literal('minor'), v.literal('adult')),
    parentalConsentAt: v.optional(v.number()),

    onboardedAt: v.optional(v.number()),
    createdAt: v.number(),
  }).index('by_authId', ['authId']),

  // -------------------------------------------------------------- catalogue

  /**
   * Seeded from @sarvabhasha/shared LANGUAGES, but `status` lives HERE.
   * Promoting a language is a data change, never a deploy (CLAUDE.md rule 11).
   * A language with ttsQuality `none` must never reach `live`.
   */
  languages: defineTable({
    code: v.string(),
    nativeName: v.string(),
    englishName: v.string(),
    script: v.string(),
    ttsQuality: v.union(v.literal('good'), v.literal('fair'), v.literal('none')),
    status: contentStatus,
    sortOrder: v.number(),
  })
    .index('by_code', ['code'])
    .index('by_status_order', ['status', 'sortOrder']),

  /** Display name is an i18n key, not a column — see specs/data-model.md. */
  categories: defineTable({
    slug: v.string(),
    iconKey: v.string(),
    sortOrder: v.number(),
    status: contentStatus,
  })
    .index('by_slug', ['slug'])
    .index('by_status_order', ['status', 'sortOrder']),

  // ---------------------------------------------------------------- content

  /** Language-INDEPENDENT. The concept being taught. */
  phrases: defineTable({
    categoryId: v.id('categories'),
    /** Stable slug, e.g. "how-much-is-this". */
    phraseKey: v.string(),
    /** English source text. */
    sourceText: v.string(),
    /** Scene brief driving the animation prompt. Three beats. */
    situation: v.string(),
    /**
     * Who says this line. Drives the TTS voice (via CHARACTER_VOICES in
     * @sarvabhasha/shared) AND the animation prompt, so audio and video stay
     * coherent instead of drifting apart.
     *
     * ONE audio file per phrase, matched to the speaker — not male+female
     * versions of everything. Review time, not generation cost, is the
     * constraint. See specs/data-model.md.
     */
    speakerCharacter: v.union(
      v.literal('dadi'),
      v.literal('parent'),
      v.literal('kid'),
      v.literal('neighbour'),
    ),
    difficulty: v.number(),
    sortOrder: v.number(),
    status: contentStatus,
  })
    .index('by_category_order', ['categoryId', 'sortOrder'])
    .index('by_key', ['phraseKey'])
    .index('by_status', ['status']),

  /**
   * Per-language. Live-ness is PER TRANSLATION — a phrase can be live while
   * its Tamil translation is still draft, and it simply won't appear for
   * Tamil learners. That is what lets languages be promoted independently.
   */
  phraseTranslations: defineTable({
    phraseId: v.id('phrases'),
    languageCode: v.string(),
    /** Target script. */
    text: v.string(),
    /** Latin transliteration. */
    transliteration: v.string(),
    literalGloss: v.optional(v.string()),
    status: contentStatus,
    /** Must be a NATIVE SPEAKER. Machine translation never ships unreviewed. */
    reviewedBy: v.optional(v.id('users')),
    reviewedAt: v.optional(v.number()),
  })
    .index('by_phrase_language', ['phraseId', 'languageCode'])
    .index('by_language_status', ['languageCode', 'status']),

  /** Per-language. Generated ONCE at authoring time — never called at runtime. */
  audioAssets: defineTable({
    phraseId: v.id('phrases'),
    languageCode: v.string(),
    storageId: v.id('_storage'),
    voiceGender: v.union(v.literal('male'), v.literal('female')),
    durationMs: v.number(),
    source: audioSource,
    status: contentStatus,
  }).index('by_phrase_language', ['phraseId', 'languageCode']),

  /**
   * LANGUAGE-INDEPENDENT — note `phraseId`, NOT a translation id.
   * One clip serves all 22 languages. Getting this wrong multiplies the
   * fal.ai bill by 22.
   *
   * model/ratePerSecond/seed/prompt/attempt exist so a bad batch can be
   * diagnosed and selectively regenerated instead of redone wholesale.
   */
  animations: defineTable({
    phraseId: v.id('phrases'),
    storageId: v.id('_storage'),
    keyframeStorageIds: v.array(v.id('_storage')),
    model: v.string(),
    /** Rate at generation time, for cost audit. Rates drift. */
    ratePerSecond: v.number(),
    durationSec: v.number(),
    seed: v.optional(v.number()),
    prompt: v.string(),
    attempt: v.number(),
    status: contentStatus,
    approvedBy: v.optional(v.id('users')),
    approvedAt: v.optional(v.number()),
  })
    .index('by_phrase', ['phraseId'])
    .index('by_status', ['status']),

  /** The character bible, made queryable. Every keyframe conditions on these. */
  characters: defineTable({
    slug: v.string(), // dadi | parent | kid | neighbour
    displayName: v.string(),
    description: v.string(),
    /** Front, three-quarter, profile. Locked references. */
    referenceStorageIds: v.array(v.id('_storage')),
  }).index('by_slug', ['slug']),

  /**
   * AI-tutor avatar state loops. Conceptually distinct from `animations`
   * (language-independent LESSON clips keyed by `phraseId`): these are
   * PERSONA clips keyed by (character, expression) with no phrase or
   * language at all — the tutor avatar loops the same "thinking" clip for
   * Dadi regardless of what language the learner is studying or what she's
   * saying. `tutor.ts`'s Gemini call returns one of these four expressions
   * per turn (see its `EXPRESSIONS` const); the mobile client resolves the
   * matching clip and loops it while that turn is on screen.
   *
   * Same reproducibility metadata and approval lifecycle as `animations` —
   * a bad batch must be diagnosable and selectively regenerable, and nothing
   * generative auto-publishes (CLAUDE.md rule 14).
   */
  personaAnimations: defineTable({
    characterSlug: v.union(
      v.literal('dadi'),
      v.literal('parent'),
      v.literal('kid'),
      v.literal('neighbour'),
    ),
    expression: tutorExpression,
    storageId: v.id('_storage'),
    keyframeStorageIds: v.array(v.id('_storage')),
    model: v.string(),
    /** Rate at generation time, for cost audit. Rates drift. */
    ratePerSecond: v.number(),
    durationSec: v.number(),
    seed: v.optional(v.number()),
    prompt: v.string(),
    attempt: v.number(),
    status: contentStatus,
    approvedBy: v.optional(v.id('users')),
    approvedAt: v.optional(v.number()),
  })
    .index('by_character_expression', ['characterSlug', 'expression'])
    .index('by_status', ['status']),

  // ------------------------------------------------------------ foundations
  //
  // Vocabulary, Numbers, and Aksharmala (the alphabet) — see
  // plans/phase-13-foundations-vocab-numbers-alphabet.md. Distinct from the
  // phrases/animations model above: each item here is a single standalone
  // concept (a word, a number, a letter), not a situational scene, so there
  // is no `situation`/`speakerCharacter` anywhere in this section. Numbers is
  // NOT a separate table — it is a `vocabularyCategories` row like any other
  // (slug: "numbers"), reusing `vocabularyItems`/`vocabularyTranslations`/
  // `vocabularyAudio` exactly. A number is a word with a numeral for an image.

  /** Same "chrome vs content" split as `categories` — display name is an i18n key. */
  vocabularyCategories: defineTable({
    slug: v.string(),
    iconKey: v.string(),
    sortOrder: v.number(),
    status: contentStatus,
  })
    .index('by_slug', ['slug'])
    .index('by_status_order', ['status', 'sortOrder']),

  /**
   * Language-INDEPENDENT, same structural trick as `animations.phraseId`
   * (schema.ts structural decision 1): a picture of an apple doesn't change
   * per language, so ONE `imageStorageId` is shared across every language's
   * translation instead of being duplicated 22 times.
   *
   * `imageStorageId` is OPTIONAL, unlike `animations.storageId` — this is a
   * deliberate difference from the phrase model, not an oversight. Phrase
   * `situation`/`sourceText` are hand-typed English, so `phrases.status` can
   * be `live` at insert time; a vocabulary item's image is itself a fal.ai
   * generation (CLAUDE.md rule 14: generated content never auto-publishes),
   * so an item can exist mid-authoring (word researched, image not generated
   * yet, or generated but not yet approved) with no image attached. A
   * missing or unapproved image simply keeps `status` at `draft` — see
   * `vocabulary.ts`'s `approveVocabularyItem`.
   */
  vocabularyItems: defineTable({
    categoryId: v.id('vocabularyCategories'),
    /** Stable slug within its category, e.g. "apple". */
    itemKey: v.string(),
    englishWord: v.string(),
    imageStorageId: v.optional(v.id('_storage')),
    sortOrder: v.number(),
    status: contentStatus,
  })
    .index('by_category_order', ['categoryId', 'sortOrder'])
    .index('by_status', ['status']),

  /**
   * Per-language. Live-ness is PER TRANSLATION, same as `phraseTranslations` —
   * an item can be live while its Tamil translation is still draft.
   */
  vocabularyTranslations: defineTable({
    vocabularyItemId: v.id('vocabularyItems'),
    languageCode: v.string(),
    /** Target script. */
    text: v.string(),
    /** Latin transliteration. */
    transliteration: v.string(),
    status: contentStatus,
    /** Must be a NATIVE SPEAKER. Machine translation never ships unreviewed. */
    reviewedBy: v.optional(v.id('users')),
    reviewedAt: v.optional(v.number()),
  })
    .index('by_item_language', ['vocabularyItemId', 'languageCode'])
    .index('by_language_status', ['languageCode', 'status']),

  /**
   * Per-language. Generated ONCE at authoring time via `bhashini/tts.ts` —
   * never called at runtime (CLAUDE.md rule 10). Vocabulary/Numbers items
   * aren't tied to a scene character, so `voiceGender` picks a single
   * consistent narrator voice per language rather than the per-character
   * convention `phrases`/`audioAssets` use — see
   * plans/phase-13-foundations-vocab-numbers-alphabet.md's "Voice" note.
   */
  vocabularyAudio: defineTable({
    vocabularyItemId: v.id('vocabularyItems'),
    languageCode: v.string(),
    storageId: v.id('_storage'),
    voiceGender: v.union(v.literal('male'), v.literal('female')),
    durationMs: v.number(),
    source: audioSource,
    status: contentStatus,
  }).index('by_item_language', ['vocabularyItemId', 'languageCode']),

  /**
   * Aksharmala content, keyed by SCRIPT — deliberately NOT `languageCode`.
   * `languages.script` (in `@sarvabhasha/shared`) already models this:
   * `devanagari` alone covers hi, mr, ne, sa, kok, doi, mai, and brx — 8 of
   * the 22 languages share one script. Keying by script means building one
   * script's ~46-character set serves every language using it once, instead
   * of duplicating the same rows per language (12 real content builds across
   * 22 languages, not 22). Getting this wrong doesn't multiply a metered
   * bill the way the animation mistake would, but it is still exactly the
   * kind of per-language duplication this project's structural patterns
   * exist to avoid — see CLAUDE.md rule 2 / rule 11.
   *
   * No `imageStorageId` — the character's own glyph, rendered client-side in
   * the appropriate script font, IS the visual. Nothing to generate.
   *
   * Held to a STRICTER review bar than phrase content (see the plan doc):
   * unlike a phrase's phrasing, "the alphabet" is maximally checkable by any
   * literate speaker of that script, and a partial or wrong character set is
   * a trust failure, not a stylistic quibble. `exampleWord`/
   * `exampleTransliteration` are optional — not every character (e.g. some
   * conjuncts) needs one.
   */
  scriptCharacters: defineTable({
    script: v.string(),
    character: v.string(),
    characterType: scriptCharacterType,
    romanization: v.string(),
    exampleWord: v.optional(v.string()),
    exampleTransliteration: v.optional(v.string()),
    sortOrder: v.number(),
    status: contentStatus,
  })
    .index('by_script_order', ['script', 'sortOrder'])
    .index('by_status', ['status']),

  /**
   * ONE audio clip per character per SCRIPT — not per language, same reuse
   * win as `scriptCharacters` itself. Generated once via `bhashini/tts.ts`,
   * never live at runtime.
   */
  scriptCharacterAudio: defineTable({
    scriptCharacterId: v.id('scriptCharacters'),
    storageId: v.id('_storage'),
    durationMs: v.number(),
    source: audioSource,
    status: contentStatus,
  }).index('by_character', ['scriptCharacterId']),

  // --------------------------------------------------------------- progress

  /** Per (user, phrase, language) — switching target starts a fresh track. */
  progress: defineTable({
    userId: v.id('users'),
    phraseId: v.id('phrases'),
    languageCode: v.string(),
    timesViewed: v.number(),
    masteryLevel: v.number(), // 0–3
    lastViewedAt: v.number(),
  })
    .index('by_user_language', ['userId', 'languageCode'])
    .index('by_user_phrase_language', ['userId', 'phraseId', 'languageCode']),

  streaks: defineTable({
    userId: v.id('users'),
    currentStreak: v.number(),
    longestStreak: v.number(),
    /** "2026-07-19", user-local. */
    lastActiveDay: v.string(),
  }).index('by_user', ['userId']),

  // ------------------------------------------------------------------ tutor

  tutorSessions: defineTable({
    userId: v.id('users'),
    languageCode: v.string(),
    personaKey: v.string(),
    /**
     * THE cost control. Only the last 8 messages + this summary go to Gemini.
     * Unbounded history makes input cost grow quadratically.
     */
    rollingSummary: v.optional(v.string()),
    createdAt: v.number(),
    lastMessageAt: v.number(),
  }).index('by_user_recent', ['userId', 'lastMessageAt']),

  tutorMessages: defineTable({
    sessionId: v.id('tutorSessions'),
    role: v.union(v.literal('user'), v.literal('assistant')),
    text: v.string(),
    /** `template` = zero-token local intent match. Never billed. */
    source: v.union(v.literal('gemini'), v.literal('template')),
    model: v.optional(v.string()),
    tokensIn: v.optional(v.number()),
    tokensOut: v.optional(v.number()),
    /**
     * Which looping avatar clip the mobile client should play while this
     * reply is being spoken aloud. Optional because only a Gemini-sourced
     * assistant reply ever has one — user-role rows and `source: "template"`
     * rows (both user- and assistant-side) never call Gemini, so they never
     * get an expression.
     */
    expression: v.optional(tutorExpression),
    createdAt: v.number(),
  }).index('by_session', ['sessionId', 'createdAt']),

  // ------------------------------------------------------- metering & money

  /**
   * `day` is a STRING, not a timestamp, so the daily check is one indexed
   * lookup and a patch inside a single transaction.
   */
  usage: defineTable({
    userId: v.id('users'),
    day: v.string(),
    kind: v.union(v.literal('tutor_turn'), v.literal('asr'), v.literal('tts')),
    count: v.number(),
  }).index('by_user_day_kind', ['userId', 'day', 'kind']),

  credits: defineTable({
    userId: v.id('users'),
    /**
     * Remaining tutor turns. Holds BOTH the one-time trial grant (10, lazily
     * inserted at first tutor use) and any purchased pack turns — one number,
     * one enforcement path. See specs/monetization-and-limits.md.
     */
    balance: v.number(),
    lifetimePurchased: v.number(),
    updatedAt: v.number(),
  }).index('by_user', ['userId']),

  /**
   * `by_transaction` is the IDEMPOTENCY KEY. Credits are granted only after
   * server-side receipt verification, and a replayed receipt must never grant
   * twice. Highest-value security property in this schema.
   */
  purchases: defineTable({
    userId: v.id('users'),
    store: v.union(v.literal('apple'), v.literal('google')),
    productId: v.string(), // "tutor_pack_300"
    transactionId: v.string(),
    creditsGranted: v.number(),
    priceMinor: v.number(), // 5000 = ₹50.00
    currency: v.string(),
    status: v.union(v.literal('pending'), v.literal('verified'), v.literal('refunded')),
    purchasedAt: v.number(),
  })
    .index('by_transaction', ['transactionId'])
    .index('by_user', ['userId', 'purchasedAt']),

  // --------------------------------------------------------------- pipeline

  /**
   * `languageCode` is NULLABLE by design: keyframe/animate run ONCE with no
   * language; translate/tts fan out per language. That nullability is
   * structural decision 1 showing up in the queue.
   *
   * `costUsd` per job is what makes the admin spend dashboard possible.
   */
  generationJobs: defineTable({
    phraseId: v.id('phrases'),
    languageCode: v.optional(v.string()),
    step: v.union(
      v.literal('translate'),
      v.literal('tts'),
      v.literal('keyframe'),
      v.literal('animate'),
    ),
    status: v.union(
      v.literal('queued'),
      v.literal('running'),
      v.literal('succeeded'),
      v.literal('failed'),
    ),
    attempt: v.number(),
    costUsd: v.optional(v.number()),
    error: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index('by_status', ['status'])
    .index('by_phrase_step', ['phraseId', 'step']),
});
