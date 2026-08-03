import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, type GestureResponderEvent } from 'react-native';
import { Box, Text, useTheme } from '@theme';

export type ButtonVariant = 'primary' | 'secondary';

interface ButtonProps {
  onPress: (event: GestureResponderEvent) => void;
  variant?: ButtonVariant;
  loading?: boolean;
  disabled?: boolean;
  children: ReactNode;
  /** Required for icon-only `children` (e.g. a send button) — string
   * children already read as accessible text, but a custom node has nothing
   * for a screen reader to announce without this. */
  accessibilityLabel?: string;
}

/**
 * The `Pressable` + `Box` + `Text variant="button"` pattern from
 * AuthScreen/ProfileScreen, generalized so the three new screens don't each
 * hand-roll their own (CLAUDE.md rule 3). `primary` is a filled CTA;
 * `secondary` is outlined, for a lower-emphasis action next to a primary one
 * — never rely on color alone, so the two also differ in fill (Refactoring-UI).
 *
 * `children` may be a plain string (rendered as `Text variant="button"`) or
 * a custom node, for callers that need an icon alongside the label.
 */
export function Button({
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  children,
  accessibilityLabel,
}: ButtonProps) {
  const theme = useTheme();
  const isDisabled = disabled || loading;
  const isPrimary = variant === 'primary';

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
    >
      <Box
        backgroundColor={isPrimary ? 'primary' : 'surface'}
        borderWidth={isPrimary ? 0 : 1}
        borderColor="primary"
        paddingVertical="s"
        paddingHorizontal="l"
        borderRadius="m"
        alignItems="center"
        justifyContent="center"
        minHeight={44}
        opacity={isDisabled ? 0.6 : 1}
      >
        {loading ? (
          <ActivityIndicator color={isPrimary ? theme.colors.textInverse : theme.colors.primary} />
        ) : typeof children === 'string' ? (
          <Text variant="button" color={isPrimary ? 'textInverse' : 'primary'}>
            {children}
          </Text>
        ) : (
          children
        )}
      </Box>
    </Pressable>
  );
}
