# Phase 2 — Navigation shell

**Status:** ✅ done

## What shipped

- `RootNavigator.tsx`: reads `authClient.useSession()`. No session → `AuthScreen` directly (no `NavigationContainer` — nowhere to navigate to yet). Session present → `NavigationContainer` + `MainTabNavigator`, themed to match Restyle's light/dark tokens.
- `MainTabNavigator.tsx`: bottom tabs, Home · Learn · Tutor · Profile, each owning its own native stack (`stacks/{Home,Learn,Tutor,Profile}Stack.tsx`) per `CLAUDE.md`'s "bottom tabs + per-tab native stacks" rule. Every stack started as exactly one placeholder screen.
- Tab bar icons: Ionicons via `@expo/vector-icons`, outline↔filled swap on focus, tinted from theme tokens (`primary`/`textMuted`) so dark mode needs no extra handling. Chosen over a thinner line-icon set specifically because `specs/branding-and-voice.md` calls for a warm, playful register, not a corporate one.

## Notable decision

`disableHierarchicalLookup` and the bun/esbuild fixes from phase 1 had to land before this phase's first real Metro bundle would even complete — if you're seeing `Unable to resolve` errors on RN-ecosystem packages, check phase 1's environment-fix notes before assuming it's a phase-2 regression.

## What's NOT in this phase

Real per-tab content — that's phase 3 (Home/Learn/Profile) onward. This phase is purely the shell: tab bar + stacks + auth gating + icons.
