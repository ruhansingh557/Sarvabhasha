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
 */
const ICON_BADGE_SIZE = 44;

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
export function FoundationCard({ icon, title, countLabel, onPress }: FoundationCardProps) {
  const theme = useTheme();

  return (
    // `LearnScreen` wraps each card in a `Box flex={1}` inside a row — Yoga's
    // default `alignItems: stretch` on that row DOES stretch the wrapper to
    // match its taller sibling (e.g. Common Phrases' 2-line title + 2-line
    // count vs. a single short line elsewhere). But stretching stops at the
    // wrapper: this `Pressable` and the visible card `Box` below it don't
    // inherit that height unless THEY also grow, so `flex={1}` has to be
    // repeated on both — otherwise the short-content card's visible surface
    // still floats at its own natural (shorter) height inside the taller,
    // now-invisible wrapper. `minHeight={140}` stays as a floor for the case
    // where BOTH cards in a row have very short content.
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
      style={{ flex: 1 }}
    >
      <Box
        backgroundColor="surface"
        borderRadius="l"
        borderWidth={1}
        borderColor="border"
        padding="m"
        gap="s"
        flex={1}
        minHeight={140}
        style={{
          shadowColor: theme.colors.shadow,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 1,
          shadowRadius: 10,
          elevation: 3,
        }}
      >
        <Box
          width={ICON_BADGE_SIZE}
          height={ICON_BADGE_SIZE}
          backgroundColor="primaryMuted"
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
