import type { ReactNode } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { Box, MAX_CONTENT_WIDTH } from '@theme';

interface ScreenProps {
  children: ReactNode;
  /** Wrap content in a ScrollView. Needed whenever content may exceed one viewport. */
  scroll?: boolean;
}

/**
 * The outer/inner `Box` screen-shell wrapper from `AuthScreen`, generalized:
 * full-bleed themed background, content constrained to `MAX_CONTENT_WIDTH`
 * and centred on tablet/wide (CLAUDE.md rule 16 — a full-width settings list
 * on a 1024px screen is bad design, not tablet support). Every screen in
 * this app except Learn's category/phrase two-pane layout uses this shell.
 */
export function Screen({ children, scroll = false }: ScreenProps) {
  const content = (
    <Box
      width="100%"
      maxWidth={MAX_CONTENT_WIDTH}
      alignSelf="center"
      flex={1}
      padding={{ phone: 'l', tablet: 'xl' }}
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
