# Monetization & Limits

> **Status:** Decided, unbuilt — pricing model and enforcement design. Schema lives in [`data-model.md`](data-model.md); this spec owns the rules.

## Purpose and scope

The commercial model: what's free, what's paid, how credits are granted and consumed, and where limits are enforced. Also covers age gating and parental consent, because those gate the same tutor feature that the money gates.

Does not cover: tutor conversation behaviour (see [`ai-tutor.md`](ai-tutor.md)); the schema itself (see [`data-model.md`](data-model.md)).

## The model

**All learning content is free, forever.** Every category, phrase, animation, and audio clip. Content has zero marginal cost — generated once, amortized across every user — so gating it would suppress the user base without saving anything.

**The AI tutor is the only metered thing**, because it's the only thing with real per-use cost.

| | Price | What you get |
|---|---|---|
| **Free** | ₹0 | All content. 5 tutor turns per day, forever. |
| **Tutor Pack** | **₹50** | 300 tutor turns. Non-expiring. |

One paid product. Deliberately. Two options is a decision; four is a chore, and the whole point of ₹50 is that it sits below the threshold where anyone deliberates.

### Why ₹50

| | |
|---|---|
| Price | ₹50 ≈ $0.58 |
| Net after ~15% store cut | ~₹42 ≈ $0.50 |
| Cost per turn (Gemini 3.1 Flash-Lite) | ~$0.0004 |
| Cost of 300 turns | ~$0.12 |
| **Margin** | **~93%** |

₹50 also covers ~1,250 turns at raw cost, so there's headroom to raise the pack size later if 300 proves stingy.

The strategic argument matters as much as the margin: ₹50 is a pocket-money price. It's below the deliberation threshold. For a first paid product with no brand behind it, removing hesitation beats extracting revenue per sale.

**Verify before launch:** confirm ₹50 is a selectable IAP tier on both stores for India. Google Play supports low tiers; Apple has added sub-₹100 tiers. Do not assume.

## Consumption order

```
tutor turn requested
  → free daily allowance remaining today?  → consume it
  → else credits balance > 0?              → decrement credits
  → else                                   → reject, show pack
```

**The free 5/day is always consumed first, even for users holding credits.** This is deliberate: a paid user's 300 turns stretch much further, which makes the pack feel generous rather than consumed. It costs ~$0.06/month per active user and is the single cheapest retention lever available.

Template responses (greeting, goodbye, encouragement — matched locally, zero tokens) **do not consume anything.** They never reach Gemini. See [`ai-tutor.md`](ai-tutor.md).

## Enforcement

Enforcement is server-side and transactional. The client may *display* a paywall; only Convex may *enforce* one.

```
client → mutation:  resolve auth identity          (never a client-supplied userId)
                    check age gate / consent
                    read usage(user, today, "tutor_turn")
                    free allowance left?  → increment usage
                    else read credits     → decrement balance
                    neither               → throw, client shows pack
                    ─────────────────────── all in ONE transaction
        → action:   call Gemini
```

A check in one function and a call in another is not a limit. **A missing or bypassable limit here is always a `high` finding** in [`_findings.md`](_findings.md) — it's the only path in the app that can run up an unbounded bill.

### Grant idempotency

Credits are granted only after server-side receipt verification, keyed on the store transaction ID with a **unique index**. A replayed or duplicated receipt must never grant twice. This is the security property that matters most in this spec — an idempotency bug here is free money for anyone who finds it.

## Age gating & parental consent

The target audience is undecided, so the app is built for the **stricter** case: it must be safe and lawful for users under 18. That is a superset — safe for a minor is fine for an adult; the reverse is not true. Retrofitting consent onto a live user base means re-consenting everyone, which is why this is designed in now rather than deferred with the audience question.

India's **DPDP Act 2023** treats anyone under 18 as a child and requires *verifiable parental consent* before processing their data. An AI chatbot storing conversation history is squarely in scope.

| Band | Determined by | Tutor access | Consent |
|---|---|---|---|
| `adult` | self-declared birth year, 18+ | Full | Standard terms |
| `minor` | self-declared birth year, <18 | Gated on consent | Verifiable parental consent required |
| `unknown` | not yet asked | **Blocked** | — |

Rules:
- Birth year is asked during onboarding, before the tutor is reachable.
- `unknown` blocks the tutor entirely. Content stays free and open — there's no reason to gate learning material on age.
- Minors get a **stricter tutor system prompt**: language-learning topics only, no open-ended conversation, no personal-information solicitation.
- Purchases by minors follow the platform's family-purchase controls (Apple Ask to Buy, Google Family). Do not build a parallel mechanism.

Design the consent flow to be **replaceable**. The verification mechanism DPDP ultimately requires is not settled, and whatever ships first will likely need changing.

## Failure modes & edge cases

| Scenario | Handling |
|---|---|
| Receipt verification fails after purchase | `purchases.status = pending`; no credits granted. Retry job; surface in admin. Never grant optimistically. |
| Duplicate/replayed receipt | Unique index on transaction ID rejects it. Grant is idempotent. |
| Refund issued | Mark `refunded`; deduct remaining granted credits, floored at zero. Never negative. |
| User burns 300 turns in a day | Allowed. There is no daily cap on credits — they bought them. Cost is bounded by the pack. |
| Credits exhausted mid-conversation | Turn is rejected before the Gemini call. Session and history are preserved; pack offered inline. |
| Clock skew on the daily allowance | `day` computed from device timezone, server-clamped to ±1 day of its UTC date. |
| Minor's consent revoked | Tutor access stops immediately; content and progress are retained. |
| User declares 18+ falsely | Self-declaration is the practical ceiling. Documented as accepted risk, not solved. |

## Known gaps

- **Receipt verification** is unimplemented. Apple `verifyReceipt` / App Store Server API and Google Play Developer API both need server-side integration before any pack is sold.
- **Verifiable parental consent mechanism** is undecided. DPDP's requirements aren't fully settled; scope the first implementation to be swappable.
- **Refund webhooks** — handling for store-initiated refunds and chargebacks isn't designed.
- **Pack sizing** — 300 turns is a reasoned guess, not a measured one. Instrument consumption from day one and revisit once real usage exists.
- **Whether 5/day free is the right allowance** is untested. It's cheap enough to raise if conversion is weak.

## Cross-references

| Concern | Authoritative spec |
|---|---|
| `credits`, `purchases`, `usage` tables and indexes | [`data-model.md`](data-model.md) |
| Tutor behaviour, personas, history trimming, template replies | [`ai-tutor.md`](ai-tutor.md) |
| Onboarding, sign-in, the `users` mirror | [`auth.md`](auth.md) |
| Paywall and pack-purchase UI | [`profile-and-settings.md`](profile-and-settings.md) |
| Cost guardrails across all metered dependencies | root [`CLAUDE.md`](../CLAUDE.md) → Cost discipline |
