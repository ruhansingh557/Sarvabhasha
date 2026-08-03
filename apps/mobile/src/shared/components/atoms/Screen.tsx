import type { ReactNode } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useResponsiveProp } from '@shopify/restyle';
import { Box, MAX_CONTENT_WIDTH, useTheme, type Theme } from '@theme';

interface ScreenProps {
  children: ReactNode;
  /** Wrap content in a ScrollView. Needed whenever content may exceed one viewport. */
  scroll?: boolean;
  /**
   * Add the device's top safe-area inset (status bar / notch / Dynamic
   * Island) on top of this screen's normal top padding. Default `true` —
   * every tab-root screen in this app renders with `headerShown: false`, so
   * nothing upstream reserves that space and content would otherwise render
   * under the status bar (specs/_findings.md F-001).
   *
   * Set to `false` only when this screen already renders under a
   * native-stack header (`headerShown: true`, e.g. Learn's `PhraseList` /
   * `PhraseDetail`) — the header itself occupies the safe area, and adding
   * the inset again on top would double-pad.
   */
  topInset?: boolean;
}

/**
 * The outer/inner `Box` screen-shell wrapper from `AuthScreen`, generalized:
 * full-bleed themed background, content constrained to `MAX_CONTENT_WIDTH`
 * and centred on tablet/wide (CLAUDE.md rule 16 — a full-width settings list
 * on a 1024px screen is bad design, not tablet support). Every screen in
 * this app except Learn's category/phrase two-pane layout uses this shell.
 */
export function Screen({ children, scroll = false, topInset = true }: ScreenProps) {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  // Resolve the responsive `l`/`xl` padding token to a number via
  // useResponsiveProp (backed by useWindowDimensions, never a module-scope
  // Dimensions.get() — CLAUDE.md rule 16) so the inset can be added to it
  // rather than replacing it outright.
  const topPaddingToken = useResponsiveProp<Theme, 'l' | 'xl'>({ phone: 'l', tablet: 'xl' }) ?? 'l';
  const topPadding = theme.spacing[topPaddingToken] + (topInset ? insets.top : 0);

  const content = (
    <Box
      width="100%"
      maxWidth={MAX_CONTENT_WIDTH}
      alignSelf="center"
      flex={1}
      paddingHorizontal={{ phone: 'l', tablet: 'xl' }}
      paddingBottom={{ phone: 'l', tablet: 'xl' }}
      style={{ paddingTop: topPadding }}
    >
      {children}
    </Box>
  );

  if (scroll) {
    return (
      <Box flex={1} backgroundColor="background">
        <ScrollView contentContainerStyle={styles.scrollContent}>{content}</ScrollView>
      </Box>
    );
  }

  return (
    <Box flex={1} backgroundColor="background" alignItems="center">
      {content}
    </Box>
  );
}

const styles = StyleSheet.create({
  scrollContent: { flexGrow: 1 },
});
