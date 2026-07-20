import { useTranslation } from 'react-i18next';
import { Box, Text, MAX_CONTENT_WIDTH } from '@theme';

/**
 * Placeholder — real screen lands with specs/learn-and-categories.md.
 * That spec is where the tablet/wide two-pane layout (category list left,
 * phrase list right) is designed; this pass is single-column at every
 * breakpoint, same as the other placeholder tabs.
 */
export function LearnScreen() {
  const { t } = useTranslation();

  return (
    <Box flex={1} backgroundColor="background" alignItems="center" justifyContent="center">
      <Box width="100%" maxWidth={MAX_CONTENT_WIDTH} padding={{ phone: 'l', tablet: 'xl' }}>
        <Text variant="h1" marginBottom="s">
          {t('Learn.TITLE')}
        </Text>
        <Text variant="body" color="textSecondary">
          {t('Learn.COMING_SOON')}
        </Text>
      </Box>
    </Box>
  );
}
