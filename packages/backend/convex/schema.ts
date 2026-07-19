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

/** Content lifecycle. Client-facing queries return ONLY `live`. */
const contentStatus = v.union(
  v.literal('draft'),
  v.literal('review'),
  v.literal('live'),
  v.literal('archived'),
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
    /** ISO 639-1. Must be a language whose status is `live`. */
    targetLanguage: v.string(),

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
    source: v.string(), // "bhashini"
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
    /** Remaining tutor turns. Consumed only AFTER the free daily allowance. */
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
