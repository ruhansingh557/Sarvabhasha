import type { ReactNode } from 'react';
import { Pressable } from 'react-native';
import { Box, Text } from '@theme';

interface ListCardProps {
  title: string;
  subtitle?: string;
  /** e.g. "3/20 learned" — right-aligned, muted. */
  trailingText?: string;
  /** Visually muted, non-pressable "coming soon" state. */
  disabled?: boolean;
  onPress?: () => void;
  /** Optional leading glyph/icon — this app uses emoji, not an icon set. */
  leading?: ReactNode;
  /** Highlights the row as the current selection — used by Learn's tablet/wide two-pane layout. */
  selected?: boolean;
}

/**
 * A tappable row: title + optional subtitle + optional trailing text +
 * optional disabled/muted state. Shared by the category grid and the phrase
 * list rather than each screen hand-rolling its own card (CLAUDE.md rule 3).
 */
export function ListCard({
  title,
  subtitle,
  trailingText,
  disabled = false,
  onPress,
  leading,
  selected = false,
}: ListCardProps) {
  const isInteractive = !disabled && !!onPress;

  const row = (
    <Box
      flexDirection="row"
      alignItems="center"
      backgroundColor="surface"
      borderRadius="m"
      borderWidth={selected ? 1 : 0}
      borderColor="primary"
      padding="m"
      minHeight={44}
      opacity={disabled ? 0.5 : 1}
      gap="m"
    >
      {leading}
      <Box flex={1}>
        <Text variant="body" color={disabled ? 'textMuted' : 'textPrimary'}>
          {title}
        </Text>
        {subtitle ? (
          <Text variant="bodySmall" color="textSecondary" marginTop="xs">
            {subtitle}
          </Text>
        ) : null}
      </Box>
      {trailingText ? (
        <Text variant="caption" color="textMuted">
          {trailingText}
        </Text>
      ) : null}
      {isInteractive ? (
        <Text variant="body" color="textMuted">
          {'›'}
        </Text>
      ) : null}
    </Box>
  );

  if (!isInteractive) {
    return row;
  }

  return (
    <Pressable onPress={onPress} accessibilityRole="button">
      {row}
    </Pressable>
  );
}
