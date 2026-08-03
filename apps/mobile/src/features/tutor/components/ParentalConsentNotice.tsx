import { useTranslation } from 'react-i18next';
import { Box, Text } from '@theme';
import { Screen } from '@shared/components/atoms/Screen';

/**
 * The blocking "coming soon" notice for `ageBand: 'minor'`. Per
 * specs/ai-tutor.md: this is a deliberate, documented product gap, not a
 * bug — there is no verifiable-parental-consent mechanism yet (real phase 8
 * work), so a `<18` learner gets a clear, warm dead-end here rather than a
 * workaround or a fake consent flow. No CTA, because there is nothing real
 * to route to yet.
 */
export function ParentalConsentNotice() {
  const { t } = useTranslation();

  return (
    <Screen scroll>
      <Box flex={1} alignItems="center" justifyContent="center">
        <Text variant="hero" marginBottom="m" textAlign="center">
          {'\u{1F49B}'}
        </Text>
        <Text variant="h1" marginBottom="s" textAlign="center">
          {t('Tutor.PARENTAL_CONSENT_TITLE')}
        </Text>
        <Text variant="body" color="textSecondary" textAlign="center">
          {t('Tutor.PARENTAL_CONSENT_BODY')}
        </Text>
      </Box>
    </Screen>
  );
}
