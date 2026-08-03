import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Text } from '@theme';
import { Button } from '@shared/components/atoms/Button';

/**
 * Shown in place of the composer once `sendMessage` throws
 * `CREDITS_EXHAUSTED:` (or, proactively, once `getCreditsBalance` shows a
 * known zero balance) — the message history stays visible above it, only
 * sending is blocked. Non-punitive tone per specs/branding-and-voice.md's
 * error-states register: this states what happened and what's next, it
 * doesn't scold.
 *
 * The pack purchase button is a stub: phase 7 (real IAP) hasn't shipped, and
 * there's no existing purchase surface elsewhere in the app to route to
 * (checked Profile — no pack/purchase section exists yet). Tapping it
 * reveals a plain "coming soon" line instead of faking a working purchase.
 */
export function CreditsExhaustedNotice() {
  const { t } = useTranslation();
  const [showComingSoon, setShowComingSoon] = useState(false);

  return (
    <Box backgroundColor="surface" borderRadius="l" padding="l">
      <Text variant="h3" marginBottom="xs">
        {t('Tutor.CREDITS_EXHAUSTED_TITLE')}
      </Text>
      <Text variant="body" color="textSecondary" marginBottom="m">
        {t('Tutor.CREDITS_EXHAUSTED_BODY')}
      </Text>
      <Button onPress={() => setShowComingSoon(true)} disabled={showComingSoon}>
        {t('Tutor.GET_TUTOR_PACK_BUTTON')}
      </Button>
      {showComingSoon ? (
        <Text variant="caption" color="textMuted" marginTop="s">
          {t('Tutor.PACK_COMING_SOON')}
        </Text>
      ) : null}
    </Box>
  );
}
