# Sarvabhasha — Spec Index

> **This file is the entry point for all agents.** Read it first, then read only the spec files relevant to your task.
> Specs describe **intent and behaviour** — the WHAT and WHY. `CLAUDE.md` says **RULES**; **HOW** comes from the code (referenced by `file:line`) + Claude's training.
> Authoring conventions live in [`_guidelines.md`](_guidelines.md) — read it before writing or reviewing a spec.

## What this project is

**Sarvabhasha** teaches everyday spoken Indian languages. A learner picks a target language, browses categories of real-world situations (greetings, bargaining in a market, asking directions), and learns short phrases through a funny 5–6 second animated scene with native audio. An AI tutor lets them practise conversation in that language.

This is a **greenfield product** — there is no upstream web app to port from. These specs are where product decisions get recorded.

The architecture:

- **Monorepo** (bun workspaces) — `apps/mobile` (Expo), `apps/admin` (content console), `packages/backend` (Convex), `packages/shared`.
- **Convex is the entire backend** — schema, queries, mutations, actions, file storage, workflow orchestration. There is no REST API and no separate server.
- **Features** (`apps/mobile/src/features/<feature>/`) own `screens/`, `components/`, `hooks/`, `store/`, `schemas/`, `types/`. No `api/` folder — Convex hooks are the data layer.
- **Navigation** — React Navigation v7, bottom tabs (Home · Learn · Tutor · Profile), each tab owning a native stack.
- **Theming** — Shopify Restyle, light/dark, semantic tokens.

Read [`architecture-overview.md`](architecture-overview.md) for the full picture. Root [`CLAUDE.md`](../CLAUDE.md) holds the hard rules and the cost guardrails.

Potential bugs and optimization candidates are tracked in [`_findings.md`](_findings.md).

## Spec Files

Status legend: ✅ written · ◻ planned (to be authored by the `doc-creator` agent).

| File | Status | Summary | Tags |
|------|:------:|---------|------|
| [`architecture-overview.md`](architecture-overview.md) | ◻ | Monorepo layout, Convex-as-backend, providers, navigation tree, screen→Convex-hook trace | architecture, foundational |
| [`tech-stack.md`](tech-stack.md) | ◻ | Expo SDK, RN version, bun workspaces, Convex, Better Auth, Restyle, Zustand, i18next | stack, build |
| [`navigation-and-routing.md`](navigation-and-routing.md) | ◻ | Root/Auth/Main navigators, the four-tab bar, typed param lists, deep links | routing, navigation |
| [`data-model.md`](data-model.md) | ✅ | Convex schema — language fan-out below the phrase, content lifecycle, metering, subscriptions, pipeline jobs | data, foundational |
| [`state-and-data-layer.md`](state-and-data-layer.md) | ◻ | Convex `useQuery`/`useMutation` patterns, optimistic updates, Zustand stores + MMKV, offline caching | data, state |
| [`theming-and-dark-mode.md`](theming-and-dark-mode.md) | ◻ | Restyle theme, semantic tokens, light/dark, text/card variants, spacing scale | theming, dark-mode |
| [`auth.md`](auth.md) | ◻ | Better Auth + Convex, Expo secure-store session, social sign-in, route gating, onboarding | auth, identity |
| [`home-and-dashboard.md`](home-and-dashboard.md) | ◻ | Home tab — streak, continue-learning, phrase of the day | home |
| [`learn-and-categories.md`](learn-and-categories.md) | ◻ | Learn tab — category taxonomy, phrase lists, the phrase player (video + audio + text + transliteration) | learn, content |
| [`ai-tutor.md`](ai-tutor.md) | ◻ | Gemini conversation, personas, intent templates, history trimming, voice loop via Bhashini, rate limits | ai, tutor |
| [`bhashini-speech.md`](bhashini-speech.md) | ◻ | Bhashini TTS at authoring time, ASR at runtime, pipeline configs, language coverage and quality tiers | speech, bhashini |
| [`content-pipeline.md`](content-pipeline.md) | ◻ | Phrase → translate → TTS → fal.ai animation → human approval → publish. Convex workflow + job queue | content, pipeline, fal |
| [`languages-and-rollout.md`](languages-and-rollout.md) | ◻ | The 6-live / 22-ready model, `status` flag, quality tiers, adding a language as data | i18n, content |
| [`monetization-and-limits.md`](monetization-and-limits.md) | ✅ | Free content + ₹50 tutor pack, consumption order, transactional enforcement, grant idempotency, age gating & DPDP consent | pricing, limits |
| [`profile-and-settings.md`](profile-and-settings.md) | ◻ | Profile tab, target-language switching, subscription management, settings | profile, settings |
| [`i18n-and-localization.md`](i18n-and-localization.md) | ◻ | i18next setup, flat `Feature.KEY` keys, device locale, the UI-vs-content translation split | i18n, localization |
| [`admin-console.md`](admin-console.md) | ◻ | The web content console — approval queue, phrase curation, pipeline monitoring, spend dashboards | admin, tooling |
| [`branding-and-voice.md`](branding-and-voice.md) | ✅ | Mascot cast, 2D cartoon art direction, three-beat clip structure, the mute test, tone, hard lines | brand, design |

## Cross-Cutting Lookup

Use this table to identify which files to read for a given task. Read **all** listed files, not just the first.

| If your task involves... | Read these files |
|--------------------------|-----------------|
| **Understanding the whole app** | `architecture-overview.md` + `tech-stack.md` |
| **Adding/changing a screen or route** | `navigation-and-routing.md` |
| **Login, session, route gating** | `auth.md` + `navigation-and-routing.md` |
| **A new query/mutation/table** | `data-model.md` + `state-and-data-layer.md` |
| **Any UI, styling, theming, dark mode** | `theming-and-dark-mode.md` (+ `.claude/skills/ui-development/SKILL.md`) |
| **Categories, phrases, the lesson player** | `learn-and-categories.md` + `data-model.md` |
| **The AI tutor, or anything Gemini** | `ai-tutor.md` + `monetization-and-limits.md` |
| **Speech, audio, TTS, ASR** | `bhashini-speech.md` |
| **Generating or publishing animations** | `content-pipeline.md` + `branding-and-voice.md` + `admin-console.md` |
| **Adding or promoting a language** | `languages-and-rollout.md` + `bhashini-speech.md` |
| **Paywalls, entitlements, limits** | `monetization-and-limits.md` + `data-model.md` |
| **Age gating, parental consent, DPDP** | `monetization-and-limits.md` + `auth.md` |
| **UI translations / RTL** | `i18n-and-localization.md` |
| **Anything that costs money per call** | root `CLAUDE.md` → Cost discipline, then `ai-tutor.md` / `content-pipeline.md` |

## How Specs Relate to Code

| Layer | Location | Purpose | Update trigger |
|-------|----------|---------|----------------|
| **Specs** | `specs/*.md` | Intent + behaviour | New feature, behaviour change, discovered gap |
| **Authoring guide** | `specs/_guidelines.md` | Format, voice, grounding rules | When the spec format evolves |
| **Root `CLAUDE.md`** | Repo root | Hard rules, stack, cost guardrails | When tooling/conventions change |

If the code and a spec disagree, the **code is the truth** for current behaviour — update the spec to match. These specs document reality, not aspiration.

## How these specs are produced

- **`doc-creator`** — explores the code and writes/updates one spec per [`_guidelines.md`](_guidelines.md).
- **`doc-reviewer`** — reviews a created spec against the code, asking the human only when a gap can't be resolved from the source.
