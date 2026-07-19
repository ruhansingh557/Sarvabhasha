# Data Model

> **Status:** Decided, unbuilt — this spec defines the Convex schema before it exists. Implementation lands in `packages/backend/convex/schema.ts`; update this file and the code together.

## Purpose and scope

The complete Convex schema: tables, fields, status lifecycles, indexes, and the two structural decisions everything else inherits — how language fan-out works, and how metered usage is metered.

Does not cover: query/mutation patterns and client caching (see [`state-and-data-layer.md`](state-and-data-layer.md)); the generation pipeline that populates content tables (see [`content-pipeline.md`](content-pipeline.md)); tier definitions and paywall UX (see [`monetization-and-limits.md`](monetization-and-limits.md)).

## The two structural decisions

Everything below follows from these. Get them wrong and the fix is a migration.

**1. Language fan-out happens below the phrase, not at it.**

A phrase is a *concept* ("how much is this?"). Its translation, transliteration, and audio are per-language. Its **animation is not** — the same clip of a parent at a vegetable cart teaches the concept in all 22 languages.

```
phrases (language-independent)
  ├── animations         ← ONE per phrase, reused across every language
  ├── phraseTranslations ← one per language
  └── audioAssets        ← one per language
```

Attaching animation to the phrase rather than the translation is what makes 22 languages cost the same as one in fal.ai credits. It is the single most expensive thing to get wrong.

**2. Usage is a table, incremented in the same transaction that authorises the call.**

Convex mutations are transactional. A check-then-call split across two functions is not a limit. See [Metering](#metering).

## Content lifecycle

Every content row carries the same union:

| Status | Meaning | Visible to learner |
|---|---|---|
| `draft` | Generated or imported, unreviewed | ❌ |
| `review` | In the admin approval queue | ❌ |
| `live` | Human-approved, published | ✅ |
| `archived` | Withdrawn, retained for history | ❌ |

**Client-facing queries filter to `live`, always.** An unreviewed machine translation is a wrong lesson, and a learner has no way to know.

## Tables

### Identity

```ts
users: defineTable({
  authId: v.string(),              // Better Auth user id — see auth.ts triggers
  name: v.optional(v.string()),
  email: v.optional(v.string()),
  uiLanguage: v.string(),          // ISO 639-1, any of the 22
  targetLanguage: v.string(),      // ISO 639-1, must be a `live` language
  birthYear: v.optional(v.number()),
  ageBand: v.union(v.literal("unknown"), v.literal("minor"), v.literal("adult")),
  parentalConsentAt: v.optional(v.number()),
  onboardedAt: v.optional(v.number()),
  createdAt: v.number(),
}).index("by_authId", ["authId"])
```

Mirrored from the Better Auth component via `onCreate`/`onUpdate`/`onDelete` triggers, following the `ai-drafted` pattern. `uiLanguage` and `targetLanguage` are independent axes — a learner may read the app in Hindi while learning Tamil.

`ageBand` defaults to `unknown`, which **blocks the tutor entirely** until birth year is collected. Content is never age-gated. See [`monetization-and-limits.md`](monetization-and-limits.md) for the DPDP consent rules.
### Languages & categories

```ts
languages: defineTable({
  code: v.string(),                // ISO 639-1: hi, bn, ta, te, mr, kn, …
  nativeName: v.string(),          // हिन्दी
  englishName: v.string(),
  script: v.string(),              // devanagari, bengali, tamil, …
  status: v.union(v.literal("draft"), v.literal("review"),
                  v.literal("live"), v.literal("archived")),
  ttsQuality: v.union(v.literal("good"), v.literal("fair"), v.literal("none")),
  sortOrder: v.number(),
}).index("by_code", ["code"]).index("by_status", ["status"])

categories: defineTable({
  slug: v.string(),                // "greetings" — display name is an i18n key
  iconKey: v.string(),
  sortOrder: v.number(),
  status: /* lifecycle union */,
}).index("by_slug", ["slug"]).index("by_status_order", ["status", "sortOrder"])
```

**Category display names are i18n chrome, not data.** `Category.GREETINGS` in `translations/*.json`. The slug is the stable key.

Launch categories (also mirrored in `packages/shared` for the pipeline):

| Order | Slug | Covers |
|---|---|---|
| 1 | `greetings` | Greetings & Courtesy |
| 2 | `numbers-money` | Numbers, Money & Bargaining |
| 3 | `food-market` | Food & Market |
| 4 | `travel-directions` | Travel & Directions |
| 5 | `family` | Family & Relationships |
| 6 | `daily-routine` | Daily Routine |
| 7 | `health-body` | Health & Body |
| 8 | `emergency` | Emergency & Help |
| 9 | `school-work` | School & Work |

`ttsQuality` drives the rollout gate: a language with `none` cannot go `live`. Six are `live` at launch (hi, bn, ta, te, mr, kn); the other sixteen exist as `draft`. See [`languages-and-rollout.md`](languages-and-rollout.md).

### Content

```ts
phrases: defineTable({
  categoryId: v.id("categories"),
  phraseKey: v.string(),           // stable slug, e.g. "how-much-is-this"
  sourceText: v.string(),          // English source
  situation: v.string(),           // scene brief for the animation prompt
  speakerCharacter: v.union(       // dadi | parent | kid | neighbour
    v.literal("dadi"), v.literal("parent"),
    v.literal("kid"), v.literal("neighbour"),
  ),
  difficulty: v.number(),          // 1–3
  sortOrder: v.number(),
  status: /* lifecycle union */,
}).index("by_category_order", ["categoryId", "sortOrder"])
  .index("by_key", ["phraseKey"])
  .index("by_status", ["status"])

phraseTranslations: defineTable({
  phraseId: v.id("phrases"),
  languageCode: v.string(),
  text: v.string(),                // target script
  transliteration: v.string(),     // Latin
  literalGloss: v.optional(v.string()),
  status: /* lifecycle union */,
  reviewedBy: v.optional(v.id("users")),
  reviewedAt: v.optional(v.number()),
}).index("by_phrase_language", ["phraseId", "languageCode"])
  .index("by_language_status", ["languageCode", "status"])

audioAssets: defineTable({
  phraseId: v.id("phrases"),
  languageCode: v.string(),
  storageId: v.id("_storage"),
  voiceGender: v.union(v.literal("male"), v.literal("female")),
  durationMs: v.number(),
  source: v.string(),              // "bhashini"
  status: /* lifecycle union */,
}).index("by_phrase_language", ["phraseId", "languageCode"])

animations: defineTable({
  phraseId: v.id("phrases"),       // NOT phraseTranslationId — see decision 1
  storageId: v.id("_storage"),
  keyframeStorageIds: v.array(v.id("_storage")),
  model: v.string(),               // "fal-ai/kling-video/v2.5-turbo/pro"
  ratePerSecond: v.number(),       // rate at generation time, for cost audit
  durationSec: v.number(),
  seed: v.optional(v.number()),
  prompt: v.string(),
  attempt: v.number(),
  status: /* lifecycle union */,
  approvedBy: v.optional(v.id("users")),
  approvedAt: v.optional(v.number()),
}).index("by_phrase", ["phraseId"]).index("by_status", ["status"])

characters: defineTable({
  slug: v.string(),                // "dadi" | "parent" | "kid" | "neighbour"
  displayName: v.string(),
  description: v.string(),
  referenceStorageIds: v.array(v.id("_storage")),  // front, 3/4, profile
}).index("by_slug", ["slug"])
```

`model`, `ratePerSecond`, `seed`, `prompt`, and `attempt` on `animations` exist so a bad batch can be diagnosed and selectively regenerated rather than redone wholesale. `characters` is the bible from [`branding-and-voice.md`](branding-and-voice.md) made queryable — every keyframe generation conditions on `referenceStorageIds`.

### One voice per phrase, not two

`phrases.speakerCharacter` drives **both** the TTS voice (via `CHARACTER_VOICES` in `@sarvabhasha/shared`) and the animation prompt. There is exactly one `audioAsset` per (phrase, language) — not a male and a female version.

Generation is free, so the constraint isn't cost. It's **review time**: a human must listen to every clip, and two versions takes the full catalogue from ~1,080 clips (~4.5 hours) to ~2,160 (~9 hours). Skimmed review is how mispronounced audio ships.

The learner still hears both registers across the catalogue — which is the actual pedagogical need — and the voice matches whoever will be on screen once the phrase is animated, so audio and video stay coherent.

Per-language fallback: female voices are generally better trained in Bhashini. If a male voice is rough in a given language, pass `genderOverride: "female"` for that language. A mismatched gender is a smaller problem than an unintelligible clip.

User-selectable voice gender is a possible v2 feature — generated on demand for phrases people actually replay, never 1,080 clips up front.

### Progress

```ts
progress: defineTable({
  userId: v.id("users"),
  phraseId: v.id("phrases"),
  languageCode: v.string(),
  timesViewed: v.number(),
  masteryLevel: v.number(),        // 0–3
  lastViewedAt: v.number(),
}).index("by_user_language", ["userId", "languageCode"])
  .index("by_user_phrase_language", ["userId", "phraseId", "languageCode"])

streaks: defineTable({
  userId: v.id("users"),
  currentStreak: v.number(),
  longestStreak: v.number(),
  lastActiveDay: v.string(),       // "2026-07-18", user-local
}).index("by_user", ["userId"])
```

Progress is per `(user, phrase, language)` — switching target language starts a fresh track without losing the old one.

### Tutor

```ts
tutorSessions: defineTable({
  userId: v.id("users"),
  languageCode: v.string(),
  personaKey: v.string(),          // "dadi" — defaults to the cast
  rollingSummary: v.optional(v.string()),
  createdAt: v.number(),
  lastMessageAt: v.number(),
}).index("by_user_recent", ["userId", "lastMessageAt"])

tutorMessages: defineTable({
  sessionId: v.id("tutorSessions"),
  role: v.union(v.literal("user"), v.literal("assistant")),
  text: v.string(),
  source: v.union(v.literal("gemini"), v.literal("template")),
  model: v.optional(v.string()),
  tokensIn: v.optional(v.number()),
  tokensOut: v.optional(v.number()),
  createdAt: v.number(),
}).index("by_session", ["sessionId", "createdAt"])
```

`rollingSummary` is the cost control. Only the last 8 messages plus the summary go to Gemini — unbounded history makes input cost grow quadratically. `source: "template"` marks the zero-token intent-matched replies carried over from `learn-bharat`.

```ts
usage: defineTable({
  userId: v.id("users"),
  day: v.string(),                 // "2026-07-18", user-local
  kind: v.union(v.literal("tutor_turn"), v.literal("asr"), v.literal("tts")),
  count: v.number(),
}).index("by_user_day_kind", ["userId", "day", "kind"])
```

```ts
credits: defineTable({
  userId: v.id("users"),
  balance: v.number(),             // remaining tutor turns
  lifetimePurchased: v.number(),
  updatedAt: v.number(),
}).index("by_user", ["userId"])

purchases: defineTable({
  userId: v.id("users"),
  store: v.union(v.literal("apple"), v.literal("google")),
  productId: v.string(),           // "tutor_pack_300"
  transactionId: v.string(),       // UNIQUE — idempotency key
  creditsGranted: v.number(),
  priceMinor: v.number(),          // 5000 = ₹50.00
  currency: v.string(),            // "INR"
  status: v.union(v.literal("pending"), v.literal("verified"),
                  v.literal("refunded")),
  purchasedAt: v.number(),
}).index("by_transaction", ["transactionId"])
  .index("by_user", ["userId", "purchasedAt"])
```

`day` is a string, not a timestamp, so the daily increment is a single indexed lookup and a patch inside one transaction.

`by_transaction` is the **idempotency key**. Credits are granted only after server-side receipt verification, and a replayed receipt must never grant twice. This is the highest-value security property in the schema.

**The order is not negotiable:**

```
client → mutation:  resolve auth identity
                    check age band / consent
                    read usage(user, today, "tutor_turn")
                    free allowance left? → increment usage
                    else read credits    → decrement balance
                    neither              → reject
                    schedule the action        ← same transaction
        → action:   call Gemini / fal.ai
```

A check in one function and a call in another is not a limit. Absence of an enforced limit here is always a `high` finding.

| Source | Allowance |
|---|---|
| Free daily | 5 tutor turns/day, every user, consumed first |
| Tutor Pack (₹50) | 300 turns, non-expiring, consumed after the daily allowance |

See [`monetization-and-limits.md`](monetization-and-limits.md) for the full model.

### Pipeline

```ts
generationJobs: defineTable({
  phraseId: v.id("phrases"),
  languageCode: v.optional(v.string()),   // null for language-independent steps
  step: v.union(v.literal("translate"), v.literal("tts"),
                v.literal("keyframe"), v.literal("animate")),
  status: v.union(v.literal("queued"), v.literal("running"),
                  v.literal("succeeded"), v.literal("failed")),
  attempt: v.number(),
  costUsd: v.optional(v.number()),
  error: v.optional(v.string()),
  createdAt: v.number(),
}).index("by_status", ["status"])
  .index("by_phrase_step", ["phraseId", "step"])
```

`languageCode` being nullable is decision 1 showing up in the queue: `keyframe` and `animate` run once with no language; `translate` and `tts` fan out. `costUsd` per job is what makes the admin spend dashboard possible.

## Failure modes & edge cases

| Scenario | Handling |
|---|---|
| Learner's `targetLanguage` is demoted from `live` | Query returns empty; client prompts re-selection. Progress rows are retained. |
| Phrase is `live` but its translation in the target language is `draft` | Phrase is hidden for that language. Live-ness is per-translation, not per-phrase. |
| Animation approved, audio not yet generated | Phrase hidden. All three of translation, audio, animation must be `live`. |
| Same-day usage increment races across two devices | Convex mutations are transactional; last-write-wins on a read-modify-write is avoided by patching within the mutation. |
| Subscription lapses mid-session | Not applicable — credits are consumable, not recurring. A turn is authorised per-mutation, so an exhausted balance rejects the next turn. |
| Clock skew / timezone on `day` | Day string is computed from the user's device timezone and passed as an argument; the server clamps to ±1 day of its own UTC date to bound abuse. |
| fal.ai job fails on attempt 3 | Job stays `failed`, surfaces in the admin queue. Never auto-retried indefinitely — retries cost money. |

## Known gaps

- **Receipt validation** is unimplemented. Apple App Store Server API / Google Play Developer API integration must land before any pack is sold — credits are never granted from a client-reported purchase.
- **Verifiable parental consent** has a schema slot (`parentalConsentAt`) but no mechanism. DPDP requirements aren't settled; build it swappable.
- **Offline download** (a candidate perk) has no schema. Needs a client-side manifest and probably a `downloads` table.
- **Bhashini male voice quality per language is unverified.** Female voices are generally better trained. Test one male-speaker phrase in each of the six live languages during the first generation pass and record the result — it determines whether `neighbour` phrases need a per-language override.
- **Pronunciation scoring** via Bhashini ASR has no result table. Add when the feature is specced.
- The **±1 day clamp** on user-supplied `day` is a proposal, not a verified-safe bound.

## Cross-references

| Concern | Authoritative spec |
|---|---|
| Query/mutation patterns, caching, offline | [`state-and-data-layer.md`](state-and-data-layer.md) |
| How content tables get populated | [`content-pipeline.md`](content-pipeline.md) |
| Tier definitions, paywall, store billing | [`monetization-and-limits.md`](monetization-and-limits.md) |
| Tutor conversation behaviour and personas | [`ai-tutor.md`](ai-tutor.md) |
| Language `status` and quality tiers | [`languages-and-rollout.md`](languages-and-rollout.md) |
| The character bible behind `characters` | [`branding-and-voice.md`](branding-and-voice.md) |
| Better Auth wiring and the `users` mirror | [`auth.md`](auth.md) |
