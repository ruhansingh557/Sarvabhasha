# Phase 1 — Foundation

**Status:** ✅ done

## What shipped

- Monorepo scaffold: bun workspaces, `apps/mobile` (Expo), `apps/admin` (not yet scaffolded), `packages/backend` (Convex), `packages/shared`.
- Convex backend initialized, `convex dev` running against a dev deployment.
- `@convex-dev/better-auth` wired: `convex.config.ts`, `auth.config.ts`, `auth.ts` (email/password, no social providers, no email verification — dev-scoped on purpose), `http.ts`. `BETTER_AUTH_SECRET` set on the deployment.
- Expo app entry point (`index.js`, `App.tsx`) — this app had *zero* runnable code before this phase. Restyle theme (`theme.ts`/`theme/index.ts`) with light/dark tokens, breakpoints, text variants. Minimal i18next bootstrap (`core/i18n/`), English only.
- `AuthScreen` — sign-up/sign-in/sign-out, react-hook-form + zod. This became the style template every later screen follows.
- Backend content groundwork: `schema.ts` (the full table set — see `specs/data-model.md`), `bhashini/tts.ts` (authoring-time TTS action), `review.ts` (admin-only cross-language review queries), `animations.ts` (admin upload/approve, still has two `TODO(auth)` markers — not yet fixed).

## Notable environment fixes (not app code, but real time sinks — recorded so they aren't rediscovered)

- The machine's default `bun` (`/usr/local/bin/bun`) was an x86_64 binary running under Rosetta on this arm64 Mac, causing wrong-platform esbuild resolution. Fixed by installing a native arm64 bun to `~/.bun/bin/bun` and prepending it to `PATH` in `~/.zshrc`. **Always use `~/.bun/bin/bun` explicitly in scripts/commands** — the plain `bun` on PATH may still resolve to the broken one depending on shell state.
- `apps/mobile/metro.config.js` had `disableHierarchicalLookup: true`, which broke resolution of any nested dependency in bun's per-package `node_modules` layout (e.g. `react-native-gesture-handler`'s own `invariant` dependency). Fixed by setting it to `false` — bun's store relies on hierarchical lookup working.
- Expo SDK package versions had drifted from what the installed Expo Go build actually expected (react-native, react, the RN ecosystem libs). Fixed via `expo install --fix`.
- `idb` (Facebook's iOS UI-automation tool) is installed on this machine (`idb-companion` via a trusted `facebook/fb` Homebrew tap, `fb-idb` via pip to `~/Library/Python/3.9/bin`) specifically so Claude can drive the Simulator (tap/type/screenshot) without asking the user to do it manually. Use `idb ui describe-all` to get exact tappable element frames (in points, not pixels) rather than estimating coordinates from screenshots.

## Known gaps carried forward

- `animations.generateUploadUrl` and `approveAnimation` still have unresolved `TODO(auth)` markers (no auth restriction / raw client-supplied `approvedBy`). Not yet a problem since nothing calls them outside manual admin use, but flag before `apps/admin` (phase 10) exposes this to real users.
- Only English UI strings exist (see phase 9).
