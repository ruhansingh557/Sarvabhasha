# Spec Authoring Guidelines (Sarvabhasha)

> **Read this before writing or reviewing any spec.** It defines the format, voice, and rules every file in `specs/` follows. The `doc-creator` and `doc-reviewer` sub-agents both operate against this document.

## What a spec is (and is not)

Specs describe the **WHAT** and the **WHY** of a feature or subsystem — the intent, the user-facing behaviour, and the decisions behind the code. They are the human- and LLM-readable map of this codebase.

- **Specs say WHAT (and WHY).** The product behaviour and the reasoning.
- **`CLAUDE.md` says RULES.** Hard conventions an agent must not break.
- **HOW comes from the code itself.** Specs point *at* code with `file:line` references; they do not reproduce it.

A spec is **not** a line-by-line walkthrough, API reference docs, or a changelog.

## Source of truth

**The code is the only ground truth.** This is a greenfield product — unlike a migration project, there is no upstream app whose behaviour can settle an ambiguity. That has one important consequence for authoring:

> If you cannot find it in the code, it is genuinely unknown. Not "look it up elsewhere" — unknown. It belongs in *Known gaps*.

Specs also carry **product decisions** that predate code — the category taxonomy, the language rollout model, the character bible. Where a spec records a decision rather than a shipped behaviour, say so in the Status line and mark the implementation status explicitly.

## File format

Every spec follows this skeleton:

```markdown
# <Title>

> **Status:** <Stable | Draft | Decided, unbuilt | Needs review> — one line on what this locks in.

## Purpose and scope

What this spec covers. Then an explicit **does not cover** list pointing to the
sibling specs that own those concerns.

## <Domain sections>

The substance: user-facing flows, states, decisions, constraints.
Reference real code with `file:line`. Tables for enumerations (screens, states,
statuses, tiers). Fenced flow blocks for sequences.

## Data & state wiring

How the feature connects through the layers:
screen (`apps/mobile/src/features/.../screens/`) → feature hook
(`features/.../hooks/use*.ts`) → Convex function (`packages/backend/convex/*.ts`),
plus the schema tables/indexes touched and the feature Zustand store.
Name the real hooks, functions, fields, indexes, and store actions.

**There is no REST layer, no HTTP client, and no `api/` folder.** A wiring section
that describes one is wrong.

## Cost & limits

Required for any domain touching Gemini, fal.ai, or Bhashini. What triggers the
call, roughly what it costs, and — precisely — where the entitlement check and
the usage increment happen. Omit this section only if the domain touches none.

## Failure modes & edge cases

Table: Scenario | Handling. Cover the unhappy paths the code actually handles
(empty / loading / error / offline / gated / rate-limited).

## Known gaps

Where behaviour is unclear, unbuilt, or unverified. The doc-reviewer turns
unresolved items here into clarification questions for the human.

## Cross-references

Table: Concern | Authoritative spec. Link siblings rather than duplicating.
```

**Purpose and scope**, the domain body, **Data & state wiring**, and **Cross-references** always appear.

## Voice and conventions

- **Present tense, declarative.** "The phrase query returns only `live` rows," not "We should filter…".
- **Concrete over vague.** Name the file, hook, Convex function, table, index, store action. Every non-obvious claim earns a `file:line` reference (paths relative to repo root).
- **Tables for enumerations.** Screens, statuses, tiers, languages, error states — tabulate them.
- **Markdown links for code references** so they are clickable: `[usePhrases.ts:42](apps/mobile/src/features/learn/hooks/usePhrases.ts#L42)`.
- **No invented detail.** If the code doesn't show it, it goes in *Known gaps*, not the body. Never guess a function name, field, index, or transition.
- **Never document a safeguard that doesn't exist.** If a spec says a rate limit or auth check is enforced and it isn't, the spec is actively dangerous — it will stop a future reader from adding the real one. Verify, or write it as a gap.
- **Keep specs ~150–400 lines.** If a domain is bigger, split it and link the parts from `_index.md`.

## Grounding rules for the doc-creator

1. Actually open the files. Trace screen → hook → Convex function, and the store, before writing the wiring section.
2. Quote real identifiers. A spec full of plausible-but-unverified names is worse than a short honest one.
3. When you assert behaviour, cite where you saw it. When you can't verify, say so in *Known gaps*.
4. For anything metered, trace the *order* of checks (auth → entitlement → usage → call) and record it exactly.

## Review rules for the doc-reviewer

1. Read the spec, then independently verify its claims against the code.
2. Flag anything unverifiable, internally inconsistent, or contradicted by the code.
3. **Only escalate to the human when a gap genuinely cannot be resolved from the code.** Resolve everything else yourself.
4. When the *code* is wrong rather than the spec, raise a **finding** in `_findings.md` — don't quietly reword the spec to match a bug.
5. Keep questions few, specific, decision-shaped, and batched.

## After writing or updating a spec

Add or update its row in the **Spec Files** table and the **Cross-Cutting Lookup** table in [`_index.md`](_index.md). A spec that isn't indexed is invisible to the next agent.
