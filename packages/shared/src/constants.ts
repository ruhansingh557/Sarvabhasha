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
 */
export const LIMITS = {
  /** Free turns per day, every user, consumed before credits. */
  FREE_TUTOR_TURNS_PER_DAY: 5,
  /** Turns granted by the ₹50 pack. */
  TUTOR_PACK_CREDITS: 300,
  /** ASR calls per day for users holding credits. Bhashini is free; this bounds abuse. */
  ASR_PER_DAY: 200,
  /** Tutor history sent to Gemini: last N messages + rollingSummary. */
  TUTOR_HISTORY_WINDOW: 8,
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
