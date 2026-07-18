---
name: ui-development
description: "Use this skill when creating or modifying React Native UI for wo_mobile (the Wadhwani skilling native app) — screens, components, styling, layout, theming, and dark mode. Covers Shopify Restyle Box/Text, the theme token system, shared atoms/molecules/organisms, react-native-paper, navigation, forms, and design-system compliance. Invoke for any visual change: new screens, styling, dark-mode parity, or porting a web UI to native."
---

# UI Development Skill (Native)

This skill governs all visual work in `wo_mobile`. The native app is the **same skilling product** as the web client `wsn_web_client` — when porting a web screen, match its behaviour and information hierarchy (see the local product snapshots in [`specs/web-reference/`](../../../specs/web-reference/)), but build with **native idioms**, never web ones.

## When to Use
- Creating new screens or components
- Building or modifying shared atoms/molecules/organisms
- Styling, theming, and **dark-mode** work
- Porting a `wsn_web_client` screen to native
- Responsive / tablet layout work
- Any visual change at all

## When Not to Use
- React Query data hooks / API service layer (that's feature logic, not UI)
- Zustand store logic
- Navigation graph restructuring (config, not UI)
- i18n JSON-only edits

---

## Workflow

### Step 1: Understand the context
- Read the existing screen/component to learn the local pattern.
- Check `src/theme/themes.ts` for available **color tokens**, `textVariants`, `cardVariants`, `buttonVariants`, `spacing`, and `borderRadii`.
- Check `src/shared/components/{atoms,molecules,organisms}` for a primitive you can **reuse instead of building**.
- If porting from web: capture the source screen's hierarchy, states, and flow from [`specs/web-reference/`](../../../specs/web-reference/) (or the `wsn_web_client` repo if cloned) — then translate, do not transliterate.

### Step 2: Build with the design system
- Compose layout with Restyle `Box` and text with `Text variant="…"` from `@theme`.
- Use **semantic color tokens only** (`textPrimary`, `surface`, `primary`, `border`, …) — never raw hex, never `palette.*` directly in a component.
- Use **spacing tokens** (`m`, `s`, `l`…) for padding/margin/gap — no magic numbers.
- Reuse shared components (`Button`, `Input`, `Card`, `ListItem`, `SearchBar`, `EmptyState`, `ErrorState`, `LoadingState`, `BackHeader`, `Modal`).
- All strings via `t('Feature.KEY')`.

### Step 3: Verify dark mode (mandatory)
- Confirm the screen renders correctly in **both** `lightTheme` and `darkTheme`. Because both palettes resolve from the same token names, semantic tokens get dark mode for free — any raw color you leave in **will break** in dark mode.
- Watch for: hardcoded `#fff`/`#000`, `palette.white`, shadows that vanish on dark surfaces, images/icons assuming a light background, and `StyleSheet` colors that don't come from `theme.colors`.

### Step 4: Apply Refactoring-UI judgement
- Run the visual decision through `references/refactoring-ui.md` — hierarchy, spacing, typography, depth. (Summary below.)

---

## Design System Quick Reference

### Theme access
```tsx
import { Box, Text, useTheme, spacing, typography } from '@theme';

const Example = () => {
  const theme = useTheme(); // theme.colors.*, theme.spacing.*
  return (
    <Box backgroundColor="surface" padding="m" borderRadius="l" gap="s">
      <Text variant="h3" color="textPrimary">Title</Text>
      <Text variant="body" color="textSecondary">Body copy</Text>
    </Box>
  );
};
```

### Color tokens (Restyle `theme.colors`, defined per-mode in `src/theme/themes.ts`)
| Token | Usage |
|-------|-------|
| `primary` | Primary brand / CTAs |
| `accent` | Accent (orange `#F9602C`) |
| `background` | Screen background |
| `surface` | Cards, sheets, elevated surfaces |
| `border` | Dividers, outlines |
| `textPrimary` | Headings / primary text |
| `textSecondary` | Secondary text |
| `textMuted` | Captions, hints |
| `textInverse` | Text on primary/accent fills |
| `error` / `success` / `warning` / `info` | Semantic states |

> These names are identical across `lightTheme` and `darkTheme`. Use the **name**, never the hex.

### Text variants (`<Text variant="…">`)
`hero · display · h1 · h2 · h3 · body · bodyLarge · bodySmall · caption · label · button · buttonSmall · link`

### Spacing scale
`none(0) · xs(4) · s(8) · m(16) · l(24) · xl(32) · xxl(48) · xxxl(64)`

### Border radii
`none · xs(2) · s(4) · m(8) · l(12) · xl(16) · xxl(24) · round(9999)`

### Variants
- **Cards:** `cardVariants` → `defaults · elevated · flat · outlined` (use the `Card` molecule).
- **Buttons:** `buttonVariants` → `primary · secondary · outline · ghost · disabled` (use the `Button` atom).

---

## Styling Approach

Two layers, used together:

1. **Restyle `Box`/`Text`** — preferred for layout & themeable props (color, spacing, radius). Dark-mode-aware automatically.
2. **`StyleSheet.create`** — for static layout details, pulling values from theme tokens:

```tsx
import { StyleSheet } from 'react-native';
import { spacing, typography } from '@theme';

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s,
    paddingHorizontal: spacing.m,
  },
  label: {
    fontSize: typography.fontSize.s,
    fontFamily: typography.fontFamily,
    lineHeight: typography.lineHeight.s,
  },
});
```

> If a `StyleSheet` rule needs a color, read it from `useTheme().colors.*` and pass it in — do **not** inline a hex. A static `StyleSheet` cannot switch with the theme.

Use **react-native-reanimated** for animation (see `Button`/`Input` atoms). Use **react-native-paper** only where the shared atoms don't already cover the need.

---

## Component Reuse Map

| Need | Use | Location |
|------|-----|----------|
| Button | `Button` (variants/sizes) | `src/shared/components/atoms/Button.tsx` |
| Text input | `Input` / `AnimatedTextInput` | `src/shared/components/atoms/` |
| Badge / Chip / Avatar / Divider / Spinner / ProgressBar | atoms | `src/shared/components/atoms/` |
| Card | `Card` | `src/shared/components/molecules/Card.tsx` |
| List row | `ListItem` | `src/shared/components/molecules/ListItem.tsx` |
| Search | `SearchBar` | `src/shared/components/molecules/SearchBar.tsx` |
| Tabs | `TabView` | `src/shared/components/molecules/TabView.tsx` |
| Empty / Error / Loading | `EmptyState` / `ErrorState` / `LoadingState` | `src/shared/components/molecules/` |
| Accordion | `AccordionComponent` / `SectionAccordion` | `src/shared/components/molecules/` |
| Screen header / back | `Header` / `BackHeader` | organisms / molecules |
| Modal / bottom sheet | `Modal` / `BottomToast` | organisms / molecules |

**Rule:** reach for an existing component first. If you build something broadly reusable, put it in `shared/`, not the feature folder.

---

## Component & screen scoping

```
src/shared/components/atoms|molecules|organisms   → cross-feature reusable UI
src/features/<feature>/screens/                    → screen components (registered in a nav stack)
src/features/<feature>/components/                 → feature-specific components
src/core/navigation/stacks/<Feature>Navigator.tsx  → typed param list + screen registration
```

Screens get their data from React Query hooks (`features/<feature>/hooks/`) and client state from the feature Zustand store — **the UI layer does not fetch directly**.

---

## Navigation (screens)

```tsx
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

const nav = useNavigation<NativeStackNavigationProp<JobsStackParamList>>();
nav.navigate('JobDetails', { jobId });
```
Add new routes to the feature's `…StackParamList` and `Stack.Screen` list in `src/core/navigation/stacks/`.

## Forms (in screens)

react-hook-form + Zod, with `Controller` wrapping the `Input` atom:
```tsx
<Controller control={control} name="email" render={({ field: { onChange, onBlur, value } }) => (
  <Input value={value} onChangeText={onChange} onBlur={onBlur}
         error={errors.email?.message} placeholder={t('Auth.EMAIL_PLACEHOLDER')} />
)} />
```

---

## Refactoring-UI Principles (honour these — full text in `references/refactoring-ui.md`)

**Hierarchy** — not all elements are equal; create 2–3 levels with size/weight/color. Emphasize by de-emphasizing. Labels are a last resort.
**Layout & spacing** — start with too much white space, then reduce. Spacing belongs to a system (use the spacing tokens). Avoid ambiguous spacing — elements should clearly group.
**Typography** — keep line length sane, line-height proportional (tighter for headings), align type sizes to the `textVariants` scale.
**Color** — semantic tokens, not raw values; don't rely on color alone (pair with icon/text/shape) — also an accessibility + dark-mode win.
**Depth & finishing** — use `cardVariants` shadows/elevation for hierarchy; prefer spacing/background over borders; verify shadows still read on dark surfaces.

---

## Pre-completion checklist

- [ ] Layout via `Box`; text via `Text variant="…"`?
- [ ] **Only semantic color tokens** — zero raw hex / `palette.*` in components?
- [ ] **Renders correctly in dark mode** (checked `darkTheme`)?
- [ ] Spacing/typography/radius from tokens (no magic numbers)?
- [ ] Reused a shared atom/molecule instead of rebuilding?
- [ ] All strings via `t('Feature.KEY')`?
- [ ] Path aliases (`@theme`, `@shared/*`) not deep relative imports?
- [ ] Component in the correct directory (shared vs feature)?
- [ ] Screen pulls data from a React Query hook, not directly?
- [ ] Clear visual hierarchy; Refactoring-UI applied?
