import { useState } from 'react';
import { ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery } from 'convex/react';
import { Ionicons } from '@expo/vector-icons';
import { api } from '@backend/_generated/api';
import { Box, Text, useTheme } from '@theme';
import { authClient } from '@core/auth/authClient';
import { Screen } from '@shared/components/atoms/Screen';
import { ProfileHeader } from '../components/ProfileHeader';
import { SettingsGroup } from '../components/SettingsGroup';
import { SettingsRow } from '../components/SettingsRow';
import { LanguageRow } from '../components/LanguageRow';
import { EditFieldSheet } from '../components/EditFieldSheet';
import { nameFieldSchema, birthYearFieldSchema } from '../schemas/editFieldSchemas';

/**
 * Profile tab — redesigned per project-owner feedback:
 *   1. Sign Out moved to the very end (was the first section — backwards
 *      for a destructive/exit action).
 *   2. Name and year-of-birth surfaced as editable fields (both already
 *      exist on the `users` schema; `updateName` is a new mirror of
 *      `setUiLanguage`'s pattern, `setBirthYear` already existed for the
 *      Tutor age-gate and is reused here rather than duplicated).
 *   3. Each language is now ONE compact `SettingsRow` (name + chevron)
 *      instead of a full card with a permanently-visible "Change language"
 *      button — tapping opens the same `LanguagePicker` molecule inside a
 *      `BottomSheet` (see `LanguageRow`).
 *   4. Grouped-rows layout (avatar/name header, then icon+label+value+chevron
 *      rows in shadowed `SettingsGroup` cards) instead of one full card per
 *      field — the same "eye-candy" visual language `FoundationCard`/
 *      `theme.ts`'s tint tokens already established for Learn.
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
  const updateName = useMutation(api.users.updateName);
  const setBirthYear = useMutation(api.users.setBirthYear);

  const [showNameSheet, setShowNameSheet] = useState(false);
  const [showBirthYearSheet, setShowBirthYearSheet] = useState(false);

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

  const uiLanguageName: string =
    allLanguages.find((l) => l.code === user?.uiLanguage)?.nativeName ?? user?.uiLanguage ?? '';

  return (
    <Screen scroll>
      <Text variant="h1" marginBottom="l">
        {t('Profile.TITLE')}
      </Text>

      <ProfileHeader name={user?.name} email={user?.email} />

      <Box marginBottom="l">
        <SettingsGroup>
          <SettingsRow
            icon="person-outline"
            label={t('Profile.NAME_LABEL')}
            value={user?.name?.trim() || t('Profile.NAME_NOT_SET')}
            onPress={() => setShowNameSheet(true)}
          />
          <SettingsRow
            icon="calendar-outline"
            label={t('Profile.BIRTH_YEAR_LABEL')}
            value={user?.birthYear ? String(user.birthYear) : t('Profile.BIRTH_YEAR_NOT_SET')}
            onPress={() => setShowBirthYearSheet(true)}
          />
        </SettingsGroup>
      </Box>

      <Box marginBottom="l">
        <Text variant="label" marginBottom="s" marginLeft="xs">
          {t('Profile.PREFERENCES_LABEL')}
        </Text>
        <SettingsGroup>
          <LanguageRow
            icon="globe-outline"
            label={t('Profile.UI_LANGUAGE_LABEL')}
            valueLabel={uiLanguageName}
            sheetTitle={t('Profile.UI_LANGUAGE_SHEET_TITLE')}
            languages={allLanguages}
            onSelect={(code) => setUiLanguage({ languageCode: code })}
          />
          <LanguageRow
            icon="school-outline"
            label={t('Profile.TARGET_LANGUAGE_LABEL')}
            valueLabel={targetLanguageName ?? t('Profile.NO_TARGET_LANGUAGE')}
            sheetTitle={t('Profile.TARGET_LANGUAGE_SHEET_TITLE')}
            languages={targetLanguages}
            onSelect={(code) => setTargetLanguage({ languageCode: code })}
          />
        </SettingsGroup>
      </Box>

      <Box marginBottom="xl">
        <Box flexDirection="row" alignItems="center" gap="xs" marginBottom="s" marginLeft="xs">
          <Ionicons name="flame" size={14} color={theme.colors.warning} />
          <Text variant="label">{t('Profile.STREAK_LABEL')}</Text>
        </Box>
        <SettingsGroup>
          <StatRow label={t('Profile.CURRENT_STREAK')} value={String(streak?.currentStreak ?? 0)} />
          <StatRow label={t('Profile.LONGEST_STREAK')} value={String(streak?.longestStreak ?? 0)} />
        </SettingsGroup>
      </Box>

      <Box marginTop="m">
        <SettingsGroup>
          <SettingsRow
            icon="log-out-outline"
            label={t('Profile.SIGN_OUT_BUTTON')}
            tone="danger"
            onPress={() => authClient.signOut()}
          />
        </SettingsGroup>
      </Box>

      <EditFieldSheet
        visible={showNameSheet}
        onClose={() => setShowNameSheet(false)}
        title={t('Profile.EDIT_NAME_TITLE')}
        label={t('Profile.NAME_LABEL')}
        defaultValue={user?.name ?? ''}
        schema={nameFieldSchema(t)}
        placeholder={t('Profile.NAME_PLACEHOLDER')}
        saveLabel={t('Profile.SAVE_BUTTON')}
        genericErrorMessage={t('Profile.EDIT_NAME_ERROR')}
        onSubmit={async (value) => {
          await updateName({ name: value });
        }}
      />

      <EditFieldSheet
        visible={showBirthYearSheet}
        onClose={() => setShowBirthYearSheet(false)}
        title={t('Profile.EDIT_BIRTH_YEAR_TITLE')}
        label={t('Profile.BIRTH_YEAR_LABEL')}
        defaultValue={user?.birthYear ? String(user.birthYear) : ''}
        schema={birthYearFieldSchema(t)}
        keyboardType="number-pad"
        maxLength={4}
        placeholder={t('Profile.BIRTH_YEAR_PLACEHOLDER')}
        saveLabel={t('Profile.SAVE_BUTTON')}
        genericErrorMessage={t('Profile.EDIT_BIRTH_YEAR_ERROR')}
        onSubmit={async (value) => {
          await setBirthYear({ birthYear: Number(value) });
        }}
      />
    </Screen>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <Box flexDirection="row" alignItems="center" justifyContent="space-between" minHeight={44} paddingVertical="s">
      <Text variant="body" color="textSecondary">
        {label}
      </Text>
      <Text variant="h3">{value}</Text>
    </Box>
  );
}
