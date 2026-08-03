import { daysBetween } from '@sarvabhasha/shared';

/**
 * Shared "device-local day, server-clamped" pattern. First written for
 * `progress.recordViewed`'s streak bookkeeping; `tutor.sendMessage` reuses it
 * verbatim for the safety-net daily rate limit — see
 * specs/monetization-and-limits.md's failure-modes table: "Clock skew on the
 * safety-net daily cap: day computed from device timezone, server-clamped to
 * ±1 day of its UTC date." Extracted here so the two call sites can't drift.
 *
 * `dayKey` ("YYYY-MM-DD") is computed by the CLIENT — only the client knows
 * the learner's local calendar day. That makes it client-supplied data,
 * which callers must not trust blindly: `assertDayKeyFresh` rejects any
 * value that strays more than one day from the SERVER's own UTC date.
 */

export function serverUtcDayKey(now: number): string {
  const d = new Date(now);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Throws if `dayKey` is more than one day from the server's own UTC date. */
export function assertDayKeyFresh(dayKey: string, now: number = Date.now()): void {
  const serverDay = serverUtcDayKey(now);
  const drift = daysBetween(serverDay, dayKey); // dayKey - serverDay, in days
  if (drift < -1 || drift > 1) {
    throw new Error(
      `dayKey "${dayKey}" is more than 1 day from the server's UTC date "${serverDay}" — ` +
        'rejecting as an untrusted clock.',
    );
  }
}
