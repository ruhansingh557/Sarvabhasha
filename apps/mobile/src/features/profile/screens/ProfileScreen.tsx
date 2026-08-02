import { useState } from 'react';
import { ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@backend/_generated/api';
import { Box, Text, useTheme } from '@theme';
import { authClient } from '@core/auth/authClient';
import { Screen } from '@shared/components/atoms/Screen';
import { Button } from '@shared/components/atoms/Button';
import { LanguagePicker } from '@shared/components/molecules/LanguagePicker';

/**
 * Profile tab. Account email, current target language (with an inline
 * `LanguagePicker` to change it, same molecule Home's empty state uses),
 * display (UI) language, streak stats, and sign-out via the shared `Button`
 * atom.
 */
export function ProfileScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const user = useQuery(api.users.getCurrentUser);
  const targetLanguages = useQuery(api.languages.listLiveLanguages);
  const allLanguages = useQuery(api.languages.listAllLanguages);
  const streak = useQuery(api.progress.getStreak);
  const setTargetLanguage = useMutation(api.users.setTargetLanguage);
  const setUiLanguage = useMutation(api.users.setUiLanguage);
  const [showLanguagePicker, setShowLanguagePicker] = useState(false);
  const [showUiLanguagePicker, setShowUiLanguagePicker] = useState(false);

  if (
    user === undefined ||
    targetLanguages === undefined ||
    allLanguages === undefined ||
    streak === undefined
  ) {
    return (
      <Box flex={1} backgroundColor="background" alignItems="center" justifyContent="center">
        <ActivityIndicator color={theme.colors.primary} />
      </Box>
    );
  }

  const targetLanguageName = user?.targetLanguage
    ? (targetLanguages.find((l) => l.code === user.targetLanguage)?.nativeName ?? user.targetLanguage)
    : null;

  const uiLanguageName =
    allLanguages.find((l) => l.code === user?.uiLanguage)?.nativeName ?? user?.uiLanguage;

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
        <Button onPress={() => authClient.signOut()}>{t('Profile.SIGN_OUT_BUTTON')}</Button>
      </Box>

      <Box backgroundColor="surface" borderRadius="l" padding="l" marginBottom="l">
        <Text variant="label" marginBottom="xs">
          {t('Profile.UI_LANGUAGE_LABEL')}
        </Text>
        <Text variant="body" marginBottom="m">
          {uiLanguageName}
        </Text>
        <Button variant="secondary" onPress={() => setShowUiLanguagePicker((v) => !v)}>
          {showUiLanguagePicker
            ? t('Profile.HIDE_UI_LANGUAGE_PICKER')
            : t('Profile.CHANGE_UI_LANGUAGE_BUTTON')}
        </Button>
        {showUiLanguagePicker ? (
          <Box marginTop="m">
            <LanguagePicker
              languages={allLanguages}
              onSelect={(code) => setUiLanguage({ languageCode: code })}
              onSelected={() => setShowUiLanguagePicker(false)}
            />
          </Box>
        ) : null}
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
            <LanguagePicker
              languages={targetLanguages}
              onSelect={(code) => setTargetLanguage({ languageCode: code })}
              onSelected={() => setShowLanguagePicker(false)}
            />
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
