import type { ComponentProps } from 'react';
import { Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { getCategory } from '@sarvabhasha/shared';
import { Box, Text, useTheme } from '@theme';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

/**
 * `CategoryDef.iconKey` (packages/shared/src/categories.ts) is a stable,
 * content-side key — not an icon-library name. This is the one place that
 * translates it to an actual Ionicons glyph, so Home's chip row and hero
 * card badge (and any future consumer) stay in sync rather than each
 * hand-rolling their own mapping.
 */
const CATEGORY_ICONS: Record<string, IoniconName> = {
  'hand-wave': 'hand-left-outline',
  coins: 'cash-outline',
  basket: 'basket-outline',
  signpost: 'navigate-outline',
  people: 'people-outline',
  'sun-clock': 'time-outline',
  'heart-pulse': 'pulse-outline',
  alert: 'warning-outline',
  book: 'book-outline',
};
const DEFAULT_CATEGORY_ICON: IoniconName = 'ellipse-outline';

export function iconForCategory(iconKey: string | undefined): IoniconName {
  if (!iconKey) return DEFAULT_CATEGORY_ICON;
  return CATEGORY_ICONS[iconKey] ?? DEFAULT_CATEGORY_ICON;
}

interface CategoryChipProps {
  /** `categories.slug` — resolved to a display name + icon via `getCategory`. */
  slug: string;
  onPress: () => void;
}

/**
 * A single tappable category pill: icon + localized category name. Used by
 * Home's horizontal "browse categories" row. Cross-feature-worthy (Learn's
 * category list could reuse this later), so it lives in `shared/`, not
 * `features/home/` — CLAUDE.md rule 3/6.
 *
 * Deliberately navigation-agnostic: `onPress` is supplied by the caller
 * rather than this component importing `useNavigation` itself, matching
 * `ListCard`'s pattern (CLAUDE.md rule 9 — UI components don't own routing
 * decisions, just render what they're told).
 */
export function CategoryChip({ slug, onPress }: CategoryChipProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const def = getCategory(slug);
  const label = def ? t(def.i18nKey) : slug;
  const iconName = iconForCategory(def?.iconKey);

  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label}>
      <Box
        flexDirection="row"
        alignItems="center"
        justifyContent="center"
        gap="xs"
        backgroundColor="surface"
        borderWidth={1}
        borderColor="border"
        borderRadius="round"
        paddingHorizontal="m"
        paddingVertical="s"
        minHeight={44}
      >
        <Ionicons name={iconName} size={18} color={theme.colors.primary} />
        <Text variant="label" color="textPrimary">
          {label}
        </Text>
      </Box>
    </Pressable>
  );
}
