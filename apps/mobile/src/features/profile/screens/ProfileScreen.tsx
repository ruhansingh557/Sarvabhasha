import { Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Box, Text, MAX_CONTENT_WIDTH } from '@theme';
import { authClient } from '@core/auth/authClient';

/**
 * Placeholder — real screen lands with specs/profile-and-settings.md.
 * The sign-out button is the one functional bit: it's the only way back
 * to the auth screen for testing without restarting the app.
 */
export function ProfileScreen() {
  const { t } = useTranslation();

  return (
    <Box flex={1} backgroundColor="background" alignItems="center" justifyContent="center">
      <Box width="100%" maxWidth={MAX_CONTENT_WIDTH} padding={{ phone: 'l', tablet: 'xl' }}>
        <Text variant="h1" marginBottom="s">
          {t('Profile.TITLE')}
        </Text>
        <Text variant="body" color="textSecondary" marginBottom="l">
          {t('Profile.COMING_SOON')}
        </Text>
        <Pressable onPress={() => authClient.signOut()}>
          <Box backgroundColor="primary" paddingVertical="s" alignItems="center" borderRadius="m">
            <Text variant="button">{t('Profile.SIGN_OUT_BUTTON')}</Text>
          </Box>
        </Pressable>
      </Box>
    </Box>
  );
}
