# Sarvabhasha — Indian Language Learning App

> **Hard rules and conventions for agents working in this repo.** Specs say WHAT/WHY (`specs/`); this file says RULES. HOW comes from the code + Claude's training.

## What this project is

**Sarvabhasha** (सर्वभाषा — "all languages") is a mobile app that teaches everyday spoken Indian languages through short, funny, animated scenes paired with native audio, plus a conversational AI tutor.

Unlike `wo_mobile` (which mirrors a web app), this is a **greenfield product**. There is no upstream web client to port from. Product decisions are made here and recorded in `specs/`.

The reference repos that informed this architecture — read them for patterns, do not depend on them:

| Repo | What we took |
|---|---|
| `wadhwani/wo_mobile` | Agent + spec scaffolding, Restyle design-system discipline, feature-module anatomy |
| `personal/ai-drafted` | `@convex-dev/better-auth` wiring — `createClient` triggers, `createAuth` factory, `auth.config.ts` |
| `wadhwani/wf-locale-kit` | Bhashini TTS / translate Convex actions (Dhruva + ULCA pipelines) |
| `wadhwani/learn-bharat` | AI-tutor persona system, local intent detection + zero-token template responses |
| `personal/chitrakatha` | Convex workflow orchestration, durable job queue, human approval gate, per-language fan-out |

## Tech stack

| Concern | Choice | Notes |
|---|---|---|
| App shell | **Expo** (SDK 56+), React Native, TypeScript | CNG — `ios/`/`android/` are generated, not hand-edited |
| Form factors | **Phone, tablet, iPad, foldable** | `supportsTablet: true`, orientation `default`. Responsive by construction — see Rule 16 |
| Monorepo | **bun workspaces** | NOT pnpm — Metro breaks on symlinked `node_modules` |
| Backend + DB | **Convex** (`packages/backend/convex/`) | Reactive queries; there is no REST layer |
| Auth | **Better Auth** via `@convex-dev/better-auth` + `@better-auth/expo` | Session token in `expo-secure-store` |
| Navigation | **React Navigation v7** — bottom tabs + per-tab native stacks | Home · Learn · Tutor · Profile |
| UI primitives | **@shopify/restyle** `Box`/`Text` + `apps/mobile/src/shared/components/{atoms,molecules,organisms}` | |
| Client state | **Zustand**, MMKV-persisted | Server state is Convex — do not wrap it in React Query |
| Forms | react-hook-form + Zod | |
| i18n | i18next / react-i18next, flat `Feature.KEY` keys | 22 UI locales |
| Speech | **Bhashini** (ASR + TTS) — free, 16+ Indian languages | Convex actions in `packages/backend/convex/bhashini/` |
| AI tutor | **Gemini 3.1 Flash-Lite** default, escalate to 3 Flash | Never send raw audio — see Rule 12 |
| Animation | **fal.ai** via Convex action, blobs in Convex file storage | 8–10s clips, image-to-video from locked character refs |

## Repo layout

```
apps/mobile/          Expo app — the product
apps/admin/           Vite + React content console (approval gate, phrase curation)
packages/backend/     convex/ — schema, auth, bhashini, tutor, content pipeline
packages/shared/      language codes, category taxonomy, shared Zod schemas
specs/                knowledge base — read specs/_index.md first
```

## Knowledge Base — read first

- **Always start at [`specs/_index.md`](specs/_index.md).** It describes what the app does and why, with `file:line` pointers into the code.
- Before working on a feature, read `_index.md`, then only the spec files its **Cross-Cutting Lookup** table lists for your task.
- Specs are the source of truth for product intent; verify details against the referenced code, since line numbers drift.
- When your change alters documented behaviour, **update the spec in the same commit**.

## Hard rules

1. **Never hardcode colors.** Use Restyle semantic tokens (`textPrimary`, `textSecondary`, `textMuted`, `primary`, `accent`, `surface`, `background`, `border`, `error`, `success`, …). Raw hex or `palette.*` in a component **breaks dark mode**.
2. **Dark mode is non-negotiable.** Every screen renders correctly in `lightTheme` and `darkTheme`. Semantic tokens give you this for free; bypassing them takes it away.
3. **Reuse before you build.** Prefer `shared/components/{atoms,molecules,organisms}`. Promote a genuinely reusable component into `shared/` rather than copying it.
4. **Use the spacing & typography scales.** Spacing: `none/xs/s/m/l/xl/xxl/xxxl`. Text: `Text variant="…"`. No magic numbers where a token exists.
5. **Path aliases, not deep relative paths.** `@theme`, `@shared/*`, `@features/*`, `@core/*`, `@backend/*`, `@translations/*`.
6. **Feature anatomy is fixed:** `apps/mobile/src/features/<feature>/{screens,components,hooks,store,schemas,types,utils}/`. Note: **no `api/` folder** — Convex is the data layer.
7. **Server state = Convex hooks; client state = Zustand.** Use `useQuery`/`useMutation` from `convex/react`. Do not add TanStack Query, Redux, or an HTTP client.
8. **All user-facing strings are i18n keys** (`t('Feature.KEY')`), never literals.
9. **`bun`, not `npm`/`yarn`/`pnpm`.**
10. **Never call Bhashini TTS at runtime for lesson content.** Phrase audio is generated once at authoring time and stored in Convex file storage. Live Bhashini is reserved for ASR (pronunciation check, tutor voice input).
11. **Every content record carries a `languageCode`.** Nothing about language is hardcoded. Six languages are `live` at launch (hi, bn, ta, te, mr, kn); the other 16 exist as `draft`. Adding a language must be a data change, never a code change.
12. **Never send raw audio to Gemini.** Audio input bills at 2–7× text. Voice flows go Bhashini ASR → text → Gemini → Bhashini TTS. Cap tutor history at the last 8 turns plus a rolling summary — unbounded history makes cost grow quadratically.
13. **Rate limits are enforced in Convex, never on the client.** Tutor usage is metered server-side against a `usage` table keyed by user + day.
14. **Generated content never auto-publishes.** Every fal.ai clip and every machine-translated phrase passes a human approval gate before `status` becomes `live`.
15. **Honour the Refactoring-UI principles** (`.claude/skills/ui-development/references/refactoring-ui.md`) for every visual decision.
16. **No component assumes phone width.** The app ships on phones, tablets, iPads, and foldables. Use Restyle breakpoints (`phone: 0`, `tablet: 768`, `wide: 1024`) and responsive prop arrays. Never read `Dimensions.get('window')` at module scope, never hardcode a pixel width, never lock orientation to portrait. Full-bleed layouts get a `maxWidth` and centre — a 1024px-wide settings list is bad design, not tablet support.

## Cost discipline

This app has three metered dependencies. Treat any change that touches them as a cost change and say so in the PR.

| Dependency | Rate | Guardrail |
|---|---|---|
| Gemini 3.1 Flash-Lite | $0.25 / $1.50 per M tokens in/out | ~$0.0004 per tutor turn. Trim history, cache the system prompt (cache reads are 10% of base input), template the greetings. |
| fal.ai video | $0.05–$0.20 per second | 8–10s clips. Never text-to-video — always image-to-video from a FLUX keyframe built on a locked character reference. Animation is language-independent: generate once, fan out voice per language. Full 180-clip catalog ≈ $250–800 depending on model tier. |
| Bhashini | Free | Free, but slow and flaky. Never on the runtime path for lesson content. |

## Sub-agents (`.claude/agents/`)

| Agent | Use for |
|---|---|
| **`ui-guardian`** | ALL native UI work. Enforces the design system, dark-mode parity, Refactoring-UI. Invoke whenever a component is created or modified. |
| **`convex-engineer`** | Schema, queries, mutations, actions, auth wiring, indexes, rate limiting. Owns `packages/backend/convex/`. |
| **`content-pipeline-engineer`** | The phrase → translation → TTS → animation → approval → publish pipeline. Owns fal.ai and Bhashini authoring-time integration. |
| **`doc-creator`** | Writes one spec file in `specs/` for a domain, grounded in this repo's code. |
| **`doc-reviewer`** | Verifies a `doc-creator` spec against the code; asks the human only for genuinely unresolvable gaps. |
| **`i18n-translator`** | ALL translation / localization work for **UI strings**. Never hand-translates. |

> **Two translation lanes, do not confuse them.** UI strings (`translations/*.json`) are the `i18n-translator`'s job and machine translation is acceptable. **Lesson phrase content is not** — a wrong taught sentence is the product failing at its one job. Phrase translations go through `content-pipeline-engineer` and a native-reviewer approval gate.

## Specs

`specs/` documents what this app does and why (see `specs/_index.md`, `specs/_guidelines.md`). Maintained by `doc-creator` / `doc-reviewer`.

## Findings triage workflow

`specs/_findings.md` is the shared backlog of candidate bugs / perf / cleanup items. **Claim an item before starting it, reference its ID in your branch/PR, and delete its row when the fix merges.** The full protocol is in the header of that file.
