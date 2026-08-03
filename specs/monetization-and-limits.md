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
| **Free trial** | ₹0 | All content, forever. **10 tutor turns, once** — a one-time taste of the tutor, not a renewing allowance. |
| **Tutor Pack** | **₹50** | 300 tutor turns. Non-expiring. |

One paid product. Deliberately. Two options is a decision; four is a chore, and the whole point of ₹50 is that it sits below the threshold where anyone deliberates.

### Why a one-time trial, not a recurring daily allowance

The original design gave every user 5 free tutor turns *per day, forever*. At scale that's an unbounded recurring liability: even a modest 10% daily-active tutor-usage rate across 1M users is ~150,000 turns/day, forever — roughly $1,800/month in perpetuity, growing with the user base, with no purchase ever required to keep costing money.

A one-time trial converts that into a bounded, one-time cost: 10 turns × 1M users, granted once, lazily, the first time each user actually opens the tutor (not at account creation — a user who never touches the tutor never costs anything), is ~$4,000 total at the outside — spent once, onboarding the *entire* eventual user base, not monthly. After the trial, the tutor is fully gated behind the pack. The trial's job is purely to let a new user experience the tutor once — enough to decide whether to buy — not to be a viable way to use it for free indefinitely.

**Accepted risk, not solved:** a user can cycle through multiple free accounts to get repeated trials. This is the same class of risk as self-declared age (below) — documented and accepted, not engineered around. It isn't worth building device-fingerprinting or phone-verification to close a hole this small relative to the cost it would save.

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
  → credits balance > 0?   → decrement credits
  → else                   → reject, show pack
```

There is no daily allowance to check first — the trial and any purchased pack both live in the *same* `credits.balance`. A user has no `credits` row at all until they first send the tutor a message; at that point the row is created with balance 10 (the trial grant, applied once, lazily, at first tutor use — not at account creation — never reissued); buying a pack adds 300 more to the same balance. One number, one enforcement path, no separate "which bucket am I spending from" logic.

Template responses (greeting, goodbye, encouragement — matched locally, zero tokens) **do not consume anything.** They never reach Gemini. See [`ai-tutor.md`](ai-tutor.md).

## Enforcement

Enforcement is server-side and transactional. The client may *display* a paywall; only Convex may *enforce* one.

```
client → mutation:  resolve auth identity          (never a client-supplied userId)
                    check age gate / consent
                    read credits(user)
                    balance > 0?  → decrement balance
                    else          → throw, client shows pack
                    ─────────────────────── all in ONE transaction
        → action:   call Gemini
```

A check in one function and a call in another is not a limit. **A missing or bypassable limit here is always a `high` finding** in [`_findings.md`](_findings.md) — it's the only path in the app that can run up an unbounded bill.

### Safety-net rate limit (not an economic control)

Independently of the credits balance, `usage(user, day, "tutor_turn")` still caps turns at a generous per-day ceiling (e.g. 200) even for a user sitting on a full 300-turn pack. This exists purely to bound the blast radius of a client bug or a scripted loop hammering the endpoint — it is not meant to ever bind a real conversation, and should not be tuned as a monetization lever.

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
| User burns 300 turns in a day | Allowed up to the safety-net cap (~200/day) — a real conversation never gets near it. Cost is bounded by the pack either way. |
| Credits exhausted (trial or paid) mid-conversation | Turn is rejected before the Gemini call. Session and history are preserved; pack offered inline. |
| Clock skew on the safety-net daily cap | `day` computed from device timezone, server-clamped to ±1 day of its UTC date. |
| Minor's consent revoked | Tutor access stops immediately; content and progress are retained. |
| User declares 18+ falsely | Self-declaration is the practical ceiling. Documented as accepted risk, not solved. |

## Known gaps

- **Receipt verification** is unimplemented. Apple `verifyReceipt` / App Store Server API and Google Play Developer API both need server-side integration before any pack is sold.
- **Verifiable parental consent mechanism** is undecided. DPDP's requirements aren't fully settled; scope the first implementation to be swappable.
- **Refund webhooks** — handling for store-initiated refunds and chargebacks isn't designed.
- **Pack sizing** — 300 turns is a reasoned guess, not a measured one. Instrument consumption from day one and revisit once real usage exists.
- **Trial size** — 10 turns is a reasoned guess, not a measured one. Cheap to raise (each extra turn across the whole eventual user base costs ~$0.0004 × user count, once) if it proves too stingy to convert; watch trial-to-purchase conversion once there's real data.
- **Multi-account trial cycling** — accepted risk, see above. Revisit only if it shows up as a material share of cost in practice.

## Cross-references

| Concern | Authoritative spec |
|---|---|
| `credits`, `purchases`, `usage` tables and indexes | [`data-model.md`](data-model.md) |
| Tutor behaviour, personas, history trimming, template replies | [`ai-tutor.md`](ai-tutor.md) |
| Onboarding, sign-in, the `users` mirror | [`auth.md`](auth.md) |
| Paywall and pack-purchase UI | [`profile-and-settings.md`](profile-and-settings.md) |
| Cost guardrails across all metered dependencies | root [`CLAUDE.md`](../CLAUDE.md) → Cost discipline |
