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

## Consumption order (already decided, just needs implementing alongside phase 6's tutor mutation)

Free 5/day allowance consumed first, always — even for users holding credits — then credits balance, then reject with a paywall prompt. See `monetization-and-limits.md`'s full enforcement pseudocode before implementing; it's fully specified, not a design decision left to this phase.
