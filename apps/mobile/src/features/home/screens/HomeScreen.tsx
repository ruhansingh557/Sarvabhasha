import { useTranslation } from 'react-i18next';
import { Box, Text, MAX_CONTENT_WIDTH } from '@theme';

/**
 * Placeholder — real screen lands with specs/home-and-dashboard.md.
 */
export function HomeScreen() {
  const { t } = useTranslation();

  return (
    <Box flex={1} backgroundColor="background" alignItems="center" justifyContent="center">
      <Box width="100%" maxWidth={MAX_CONTENT_WIDTH} padding={{ phone: 'l', tablet: 'xl' }}>
        <Text variant="h1" marginBottom="s">
          {t('Home.TITLE')}
        </Text>
        <Text variant="body" color="textSecondary">
          {t('Home.COMING_SOON')}
        </Text>
      </Box>
    </Box>
  );
}
