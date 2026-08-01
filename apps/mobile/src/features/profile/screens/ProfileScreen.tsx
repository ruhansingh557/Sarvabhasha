import { useState } from 'react';
import { ActivityIndicator, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useQuery } from 'convex/react';
import { api } from '@backend/_generated/api';
import { Box, Text, useTheme } from '@theme';
import { authClient } from '@core/auth/authClient';
import { Screen } from '@shared/components/atoms/Screen';
import { Button } from '@shared/components/atoms/Button';
import { LanguagePicker } from '@shared/components/molecules/LanguagePicker';

/**
 * Profile tab. Sign-out logic/markup is unchanged from the placeholder — the
 * one functional bit that already worked. Everything else is new: account
 * email, current target language (with an inline `LanguagePicker` to change
 * it, same molecule Home's empty state uses), and streak stats.
 */
export function ProfileScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const user = useQuery(api.users.getCurrentUser);
  const languages = useQuery(api.languages.listLiveLanguages);
  const streak = useQuery(api.progress.getStreak);
  const [showLanguagePicker, setShowLanguagePicker] = useState(false);

  if (user === undefined || languages === undefined || streak === undefined) {
    return (
      <Box flex={1} backgroundColor="background" alignItems="center" justifyContent="center">
        <ActivityIndicator color={theme.colors.primary} />
      </Box>
    );
  }

  const targetLanguageName = user?.targetLanguage
    ? (languages.find((l) => l.code === user.targetLanguage)?.nativeName ?? user.targetLanguage)
    : null;

  return (
    <Screen scroll>
      <Text variant="h1" marginBottom="l">
        {t('Profile.TITLE')}
      </Text>

      <Box backgroundColor="surface" borderRadius="l" padding="l" marginBottom="l">
        <Text variant="label" marginBottom="xs">
          {t('Profile.ACCOUNT_LABEL')}
        </Text>
        <Text variant="body" marginBottom="m">
          {user?.email ?? ''}
        </Text>
        <Pressable onPress={() => authClient.signOut()}>
          <Box backgroundColor="primary" paddingVertical="s" alignItems="center" borderRadius="m">
            <Text variant="button">{t('Profile.SIGN_OUT_BUTTON')}</Text>
          </Box>
        </Pressable>
      </Box>

      <Box backgroundColor="surface" borderRadius="l" padding="l" marginBottom="l">
        <Text variant="label" marginBottom="xs">
          {t('Profile.TARGET_LANGUAGE_LABEL')}
        </Text>
        <Text variant="body" marginBottom="m">
          {targetLanguageName ?? t('Profile.NO_TARGET_LANGUAGE')}
        </Text>
        <Button variant="secondary" onPress={() => setShowLanguagePicker((v) => !v)}>
          {showLanguagePicker ? t('Profile.HIDE_LANGUAGE_PICKER') : t('Profile.CHANGE_LANGUAGE_BUTTON')}
        </Button>
        {showLanguagePicker ? (
          <Box marginTop="m">
            <LanguagePicker onSelected={() => setShowLanguagePicker(false)} />
          </Box>
        ) : null}
      </Box>

      <Box backgroundColor="surface" borderRadius="l" padding="l">
        <Text variant="label" marginBottom="s">
          {t('Profile.STREAK_LABEL')}
        </Text>
        <StatRow label={t('Profile.CURRENT_STREAK')} value={String(streak?.currentStreak ?? 0)} />
        <StatRow label={t('Profile.LONGEST_STREAK')} value={String(streak?.longestStreak ?? 0)} />
      </Box>
    </Screen>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <Box flexDirection="row" justifyContent="space-between" paddingVertical="xs">
      <Text variant="body" color="textSecondary">
        {label}
      </Text>
      <Text variant="body">{value}</Text>
    </Box>
  );
}
