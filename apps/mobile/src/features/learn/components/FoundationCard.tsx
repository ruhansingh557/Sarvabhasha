import type { ReactNode } from 'react';
import { Pressable } from 'react-native';
import { Box, Text } from '@theme';

interface FoundationCardProps {
  /** An `<Ionicons>` element or a `<Text variant="hero">` glyph — this card is icon-agnostic. */
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
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={title}>
      <Box backgroundColor="surface" borderRadius="l" padding="l" gap="m" minHeight={140}>
        <Box backgroundColor="primaryMuted" borderRadius="m" padding="s" alignSelf="flex-start">
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
