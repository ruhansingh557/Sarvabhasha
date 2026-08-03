# Phase 7 — Monetization

**Status:** ◻ not started

## Goal

The ₹50 Tutor Pack (300 turns, non-expiring) — the only paid product, per `specs/monetization-and-limits.md`. Content stays free forever; this phase only touches the tutor's paid overflow.

## Hard prerequisite

Phase 6 (AI Tutor) — there's nothing to sell credits *for* until the tutor consumes them.

## What already exists

- Schema: `credits` (`balance`, `lifetimePurchased`), `purchases` (`store`, `productId`, `transactionId` — **unique index, the idempotency key**, `status: pending|verified|refunded`). No mutation reads or writes either table yet.

## Known-unimplemented, called out explicitly in the spec (don't rediscover these, just do them)

- **Receipt verification** — Apple App Store Server API / Google Play Developer API integration. Nothing exists. Credits must never be granted from a client-reported purchase alone.
- **Grant idempotency** — the `purchases.by_transaction` unique index is the mechanism; the mutation enforcing "a replayed receipt never grants twice" doesn't exist yet.
- **Refund handling** — webhook/callback design not started.
- **Verify ₹50 is actually a selectable IAP tier on both App Store and Play Store for India before building UI around it** — the spec flags this as unconfirmed, not a safe assumption.

## Consumption order (revised — one-time trial, not a recurring daily allowance)

**2026-08-03 revision:** the free tier is no longer "5 turns/day, forever." It's a one-time grant of 10 credits at account creation, living in the *same* `credits.balance` a purchased pack tops up — no separate daily-allowance bucket. Consumption is just: `balance > 0 → decrement`, else reject with the pack. See `monetization-and-limits.md`'s full enforcement pseudocode before implementing; it's fully specified, not a design decision left to this phase.

This was changed because the original recurring free tier is an unbounded liability at scale (~$1,800/month forever at 10% DAU across 1M users), whereas a one-time trial is a bounded one-time cost (~$4,000 total, once, to onboard the entire eventual user base). Phase 6's tutor mutation is what actually grants the trial (lazily, the first time a user's `credits` row is touched) and enforces the balance check — this phase only needs the *purchase* side: verifying receipts and incrementing that same `balance`/`lifetimePurchased`.

A generous per-day safety-net cap (`usage` table, ~200/day) still exists independently, purely to bound a client bug or scripted abuse loop — it is not an economic lever and should not be tuned as one.
