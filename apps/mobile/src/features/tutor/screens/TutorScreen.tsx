import { useTranslation } from 'react-i18next';
import { Box, Text, MAX_CONTENT_WIDTH } from '@theme';

/**
 * Placeholder — real screen lands with specs/ai-tutor.md.
 */
export function TutorScreen() {
  const { t } = useTranslation();

  return (
    <Box flex={1} backgroundColor="background" alignItems="center" justifyContent="center">
      <Box width="100%" maxWidth={MAX_CONTENT_WIDTH} padding={{ phone: 'l', tablet: 'xl' }}>
        <Text variant="h1" marginBottom="s">
          {t('Tutor.TITLE')}
        </Text>
        <Text variant="body" color="textSecondary">
          {t('Tutor.COMING_SOON')}
        </Text>
      </Box>
    </Box>
  );
}
