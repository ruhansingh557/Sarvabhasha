import { useState } from 'react';
import { ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@backend/_generated/api';
import { Box, Text, useTheme } from '@theme';
import { ListCard } from './ListCard';

interface LanguagePickerProps {
  /** Called after `setTargetLanguage` succeeds — e.g. to dismiss an inline picker. */
  onSelected?: (languageCode: string) => void;
}

/**
 * Renders `api.languages.listLiveLanguages` as tappable rows and calls
 * `api.users.setTargetLanguage` on tap. Used inline (not a separate nav
 * route) by both Home's "choose your language" empty state and Profile's
 * "change language" section — shared rather than duplicated (CLAUDE.md rule 3).
 */
export function LanguagePicker({ onSelected }: LanguagePickerProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const languages = useQuery(api.languages.listLiveLanguages);
  const setTargetLanguage = useMutation(api.users.setTargetLanguage);
  const [pendingCode, setPendingCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSelect = async (code: string) => {
    setError(null);
    setPendingCode(code);
    try {
      await setTargetLanguage({ languageCode: code });
      onSelected?.(code);
    } catch {
      setError(t('LanguagePicker.ERROR'));
    } finally {
      setPendingCode(null);
    }
  };

  if (languages === undefined) {
    return (
      <Box padding="m" alignItems="center">
        <ActivityIndicator color={theme.colors.primary} />
      </Box>
    );
  }

  return (
    <Box gap="s">
      {languages.map((language) => (
        <ListCard
          key={language.code}
          title={language.nativeName}
          subtitle={language.englishName}
          disabled={pendingCode !== null}
          trailingText={pendingCode === language.code ? t('LanguagePicker.SAVING') : undefined}
          onPress={() => handleSelect(language.code)}
        />
      ))}
      {error ? (
        <Text variant="caption" color="error">
          {error}
        </Text>
      ) : null}
    </Box>
  );
}
