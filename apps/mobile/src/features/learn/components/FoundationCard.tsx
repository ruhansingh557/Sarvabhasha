import type { ReactNode } from 'react';
import { Pressable } from 'react-native';
import { Box, Text, useTheme } from '@theme';

/**
 * Fixed size of the icon badge every card shares — an Ionicon (rendered at
 * 26px elsewhere in this feature) or a single script glyph (rendered at
 * `h2`) both need to sit inside the SAME box so all four Learn-root cards
 * read as the same shape. Don't let this hug content (`alignSelf: flex-start`
 * sizing to whatever `icon` renders) — that's what let Aksharmala's `hero`
 * glyph balloon its badge past the other three.
 *
 * Bumped from the original 44 to give the badge more visual weight (project
 * owner: cards read "blunt" at the old size) — still a single shared
 * constant, so all four badges stay identically sized.
 */
const ICON_BADGE_SIZE = 52;

/**
 * Single shared, EXPLICIT height for every Learn-root card. `LearnScreen`
 * renders the four cards as two independent flex-row containers (one per
 * row) — Yoga's `alignItems: stretch` only equalizes height among siblings
 * within the SAME row, so it can make the two cards in row 1 match each
 * other, and the two in row 2 match each other, but it has no mechanism to
 * equalize row 1 against row 2. Row 1 (Common Phrases + Aksharmala) computes
 * taller than row 2 because Common Phrases' title and count both wrap to two
 * lines while the other three cards' content is one line each. Since RN/Yoga
 * has no 2D-grid equal-height primitive, the fix is to stop deriving height
 * from content at all: every card gets this same fixed `height`, sized to
 * the worst case (Common Phrases' two-line title + two-line count) so nothing
 * clips, with shorter cards simply carrying a little empty space instead of
 * shrinking to fit.
 *
 * Derived from real tokens in `src/theme/theme.ts`, not guessed:
 *   padding="m" (top + bottom)         16 * 2 = 32
 *   icon badge                                   52
 *   gap="s" (badge -> text block)                 8
 *   title, `h3` lineHeight, 2 lines    28 * 2 = 56
 *   count `marginTop="xs"`                         4
 *   count, `caption` lineHeight, 2 lines 19 * 2 = 38
 *                                       ----------------
 *                                       total  = 190
 */
const CARD_HEIGHT = 190;

/**
 * Badge background — a solid semantic token per card, so the four Learn-root
 * cards read as distinct destinations rather than four copies of the same
 * template. Restricted to tokens that resolve to a DARK color in dark theme
 * and a mid/vivid color in light theme (the same brightness-flip `primary`
 * already has) so `textInverse` reads correctly as the icon color against
 * any of them in both themes — see `FoundationCard`'s icon color choice
 * below, and the same `badgeColor`/`textInverse` pairing already used for
 * `primary` throughout the app (`Button`, `TutorMessageBubble`,
 * `VocabularyItemCard`). `warning`/`error` are deliberately excluded: this is
 * a plain navigation menu, and those tokens carry a cautionary/negative
 * connotation that would mislead here.
 */
type BadgeColor = 'primary' | 'accent' | 'success' | 'info';

/**
 * Each badge color's matching light card-surface tint (`theme.ts`'s
 * `primaryTint`/`accentTint`/`successTint`/`infoTint`) — badge and background
 * read as one coordinated hue family per card instead of four identical
 * white boxes with different-colored badges. See the tint tokens' own
 * comments in `theme.ts` for why these are pale washes rather than a reuse
 * of the badge color itself (caption-text contrast).
 */
const TINT_BY_BADGE: Record<BadgeColor, 'primaryTint' | 'accentTint' | 'successTint' | 'infoTint'> = {
  primary: 'primaryTint',
  accent: 'accentTint',
  success: 'successTint',
  info: 'infoTint',
};

interface FoundationCardProps {
  /** An `<Ionicons>` element or a `<Text variant="h2">` glyph — this card is icon-agnostic. */
  icon: ReactNode;
  title: string;
  /**
   * Live count string, e.g. "9 categories · 45 phrases" — omitted (no second
   * line) while the underlying query is still resolving. Per the locked
   * Learn-tab IA (plans/phase-13-foundations-vocab-numbers-alphabet.md,
   * "Where this lives in the Learn tab"): a number answers "how much is in
   * here" before tapping in, and nothing is previewed inline beyond it.
   */
  countLabel?: string;
  /** Distinct per-card badge color — see `BadgeColor` above. */
  badgeColor: BadgeColor;
  onPress: () => void;
}

/**
 * One of the Learn tab root's four equal-peer cards (Common Phrases /
 * Aksharmala / Numbers / Vocabulary — Option A from the locked IA decision).
 * Deliberately feature-local, not `shared/`: this exact tile shape (icon chip
 * + title + live count, no inline preview) is specific to the Learn root
 * today — promote it to `shared/components` later if another surface needs
 * the same shape (CLAUDE.md rule 6).
 */
export function FoundationCard({ icon, title, countLabel, badgeColor, onPress }: FoundationCardProps) {
  const theme = useTheme();

  return (
    // `LearnScreen` wraps each card in a `Box flex={1}` inside a row — Yoga's
    // default `alignItems: stretch` on that row DOES stretch the wrapper to
    // match its taller sibling within that SAME row. But stretching stops at
    // the wrapper: this `Pressable` and the visible card `Box` below it don't
    // inherit that height unless THEY also grow, so `flex={1}` has to be
    // repeated on both — otherwise the short-content card's visible surface
    // still floats at its own natural (shorter) height inside the taller,
    // now-invisible wrapper. That fix stays (it's still correct and needed
    // for within-row equalization when the shell around a card gets taller
    // for any reason), but it can't equalize row 1 against row 2 — nothing
    // in Yoga can, across two independent flex containers. `height=
    // {CARD_HEIGHT}` below is what makes every card the same height,
    // regardless of row. React Native's `flex` (unlike web CSS) defaults
    // `flexBasis` to `auto`, not `0` — so an explicit `height` and `flex={1}`
    // coexist fine: `height` sets the base size, `flex={1}` only lets it
    // grow if the row ever offers extra space.
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
      style={{ flex: 1 }}
    >
      <Box
        backgroundColor={TINT_BY_BADGE[badgeColor]}
        borderRadius="l"
        borderWidth={1}
        borderColor="border"
        padding="m"
        gap="s"
        flex={1}
        height={CARD_HEIGHT}
        style={{
          shadowColor: theme.colors.shadow,
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 1,
          shadowRadius: 14,
          elevation: 4,
        }}
      >
        <Box
          width={ICON_BADGE_SIZE}
          height={ICON_BADGE_SIZE}
          backgroundColor={badgeColor}
          borderRadius="m"
          alignItems="center"
          justifyContent="center"
        >
          {icon}
        </Box>
        <Box>
          <Text variant="h3">{title}</Text>
          {countLabel ? (
            <Text variant="caption" color="textMuted" marginTop="xs">
              {countLabel}
            </Text>
          ) : null}
        </Box>
      </Box>
    </Pressable>
  );
}
