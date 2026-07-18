# Sarvabhasha — सर्वभाषा

Learn everyday spoken Indian languages through short animated scenes with native
audio, plus a conversational AI tutor.

> **Agents: read [`CLAUDE.md`](CLAUDE.md) first, then [`specs/_index.md`](specs/_index.md).**

## Layout

```
apps/
  mobile/          Expo app — phone, tablet, iPad, foldable
  admin/           Content console (approval queue, curation)   [not scaffolded]
packages/
  backend/         Convex — schema, auth, bhashini, tutor, pipeline
  shared/          Language registry, category taxonomy, limits
specs/             Knowledge base — start at _index.md
.claude/
  agents/          6 sub-agents
  skills/          ui-development
```

## Setup

```bash
bun install

# Backend — creates the deployment and generates types
cd packages/backend && bunx convex dev

# Mobile (separate terminal)
cd apps/mobile && bun run prebuild && bun run ios
```

**Use `bun`, never npm/yarn/pnpm.** Metro cannot resolve pnpm's symlinked
`node_modules`; `metro.config.js` is configured for bun's hoisting.

### Xcode note

Xcode 27 (macOS 27 "Golden Gate", currently beta) replaced `Simulator.app` with
`DeviceHub.app`, which breaks `expo run:ios` **and** the React Native community
CLI alike. Develop on macOS 26 + Xcode 26, or build via EAS with a pinned Xcode.

## Stack

Expo · React Native · TypeScript · Convex · Better Auth · Restyle ·
React Navigation v7 · Zustand + MMKV · i18next · Bhashini · Gemini · fal.ai

## The decisions worth knowing before you touch anything

1. **Convex is the whole backend.** No REST layer, no HTTP client, no `api/`
   folder in feature modules. `useQuery`/`useMutation` are the data layer.

2. **Animation hangs off `phrases`, not `phraseTranslations`.** A clip is
   language-independent — the same scene teaches the concept in all 22
   languages. Only translation and TTS fan out. Attaching animation to the
   translation would multiply the fal.ai bill by 22.

3. **Live-ness is per-translation.** A phrase can be `live` while its Tamil
   translation is `draft`; it just won't appear for Tamil learners. This is
   what lets languages be promoted as *data*, never a deploy.

4. **Usage is incremented in the same transaction that authorises the call.**
   A check in one function and a call in another is not a limit.

5. **Nothing generative auto-publishes.** Every clip and every machine
   translation passes a human gate. Translation review needs a native speaker.

6. **No component assumes phone width.** Restyle breakpoints, no module-scope
   `Dimensions.get()`, no locked orientation.

## Cost

Three metered dependencies. Treat any change touching them as a cost change.

| | Rate | Guardrail |
|---|---|---|
| Gemini 3.1 Flash-Lite | $0.25 / $1.50 per M tok | ~$0.0004/turn. Trim history to 8 turns + summary. Never send raw audio. |
| fal.ai video | $0.05–$0.20/sec | 8–10s, image-to-video only. Generate once, reuse across languages. |
| Bhashini | free | Slow and flaky — authoring time only, never the runtime path. |

## Status

Scaffolded. Schema, shared registries, theme, and Expo config are in place;
Convex functions, navigation, and screens are not yet written.
