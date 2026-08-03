/**
 * Content lifecycle and metering constants shared by the app, the admin
 * console, and the Convex backend.
 *
 * See specs/data-model.md and specs/monetization-and-limits.md.
 */

/** Content lifecycle. Client-facing queries return ONLY `live`. */
export const CONTENT_STATUS = ['draft', 'review', 'live', 'archived'] as const;
export type ContentStatus = (typeof CONTENT_STATUS)[number];

export const AGE_BANDS = ['unknown', 'minor', 'adult'] as const;
export type AgeBand = (typeof AGE_BANDS)[number];

/**
 * Metering. These numbers are ENFORCED IN CONVEX, never on the client
 * (CLAUDE.md rule 13). They are exported here only so the UI can display
 * remaining balance and render the paywall — never to gate anything.
 *
 * See specs/monetization-and-limits.md — revised 2026-08 to a one-time trial
 * credit replacing the original "5 free turns/day, forever" allowance (an
 * unbounded recurring liability at scale). The trial IS the initial
 * `credits.balance`, granted lazily at first tutor use, never reissued.
 */
export const LIMITS = {
  /**
   * One-time trial grant. Lazily applied to a user's `credits` row the
   * first time they touch the tutor (not at account creation) — see
   * `tutor.sendMessage`. Not a renewing daily allowance.
   */
  TRIAL_CREDITS: 10,
  /** Turns granted by the ₹50 pack. */
  TUTOR_PACK_CREDITS: 300,
  /**
   * Safety-net cap on `usage(user, day, 'tutor_turn')`. Bounds a client bug
   * or scripted loop — NOT an economic control, since the credits balance
   * already gates real usage. Should never bind a genuine conversation; do
   * not tune this as a monetization lever.
   */
  SAFETY_NET_TUTOR_TURNS_PER_DAY: 200,
  /** ASR calls per day for users holding credits. Bhashini is free; this bounds abuse. */
  ASR_PER_DAY: 200,
  /**
   * Tutor history sent to Gemini: last N messages + rollingSummary. Root
   * CLAUDE.md rule 12 says "last 8 turns" — a turn is one user message +
   * one assistant reply, so this is 16 messages, not 8.
   */
  TUTOR_HISTORY_WINDOW: 16,
} as const;

export const PRODUCTS = {
  TUTOR_PACK: {
    id: 'tutor_pack_300',
    credits: LIMITS.TUTOR_PACK_CREDITS,
    priceMinor: 5000, // ₹50.00
    currency: 'INR',
  },
} as const;

/**
 * Animation constraints. See specs/branding-and-voice.md.
 * Under ~7s there is no room for three beats; over ~12s the model drifts.
 */
export const ANIMATION = {
  MIN_DURATION_SEC: 7,
  MAX_DURATION_SEC: 10,
  /** Realistic acceptance rate on stylized character animation. */
  EXPECTED_REROLL_FACTOR: 2.5,
} as const;

/**
 * Bhashini provider coverage. These two sets are NOT identical — ASR and TTS
 * pipeline availability on Bhashini are not guaranteed to match — so they are
 * kept as two distinct sets, not merged/reconciled. Relocated here (from
 * `packages/backend/convex/bhashini/asr.ts` and `.../tts.ts`) so both the
 * Convex backend and the mobile client can check language coverage without
 * the client importing server-only Convex runtime code
 * (`action()`/`_generated/server`) into the Expo/Metro bundle.
 */

/**
 * Languages with a Bhashini ASR pipeline. Mirrors `TTS_LANGUAGES` as a
 * starting assumption — ASR and TTS coverage on Bhashini are not guaranteed
 * identical, so VERIFY against live pipeline responses before relying on a
 * language here that hasn't actually been exercised.
 */
export const ASR_LANGUAGES = new Set([
  'hi', 'bn', 'te', 'mr', 'ta', 'ur', 'gu', 'kn',
  'ml', 'pa', 'as', 'or', 'ne', 'sa', 'sd', 'en',
]);

/**
 * Languages with a Bhashini TTS voice. Absence here is why `ttsQuality: 'none'`
 * exists in @sarvabhasha/shared — a language with no voice can never go live.
 */
export const TTS_LANGUAGES = new Set([
  'hi', 'bn', 'te', 'mr', 'ta', 'ur', 'gu', 'kn',
  'ml', 'pa', 'as', 'or', 'ne', 'sa', 'sd', 'en',
]);

/**
 * Day key in the user's local timezone, e.g. "2026-07-19".
 * Passed to Convex as an argument; the server clamps to ±1 day of its own
 * UTC date to bound abuse. See specs/data-model.md.
 */
export function toDayKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Whole calendar days between two `toDayKey()` strings, `b - a`. Negative
 * when `b` is earlier than `a`. Parsed as UTC noon (not midnight) so DST
 * transitions in either the user's or the server's zone can never round a
 * one-day gap down to zero or up to two.
 *
 * Used for both the streak-continuation check (gap === 1 → increment,
 * gap > 1 → reset) and the server's ±1 day clamp on a client-supplied
 * `dayKey` in `progress.recordViewed`.
 */
export function daysBetween(a: string, b: string): number {
  const toUtcNoon = (key: string) => new Date(`${key}T12:00:00Z`).getTime();
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((toUtcNoon(b) - toUtcNoon(a)) / msPerDay);
}
