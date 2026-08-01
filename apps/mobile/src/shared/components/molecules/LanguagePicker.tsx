import { useState } from 'react';
import { ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Box, Text, useTheme } from '@theme';
import { ListCard } from './ListCard';

export interface LanguageOption {
  code: string;
  nativeName: string;
  englishName: string;
  script: string;
}

interface LanguagePickerProps {
  /**
   * The language list to render — e.g. `api.languages.listLiveLanguages` for
   * target-language selection or `api.languages.listAllLanguages` for
   * UI-language selection. `undefined` renders the loading state, matching
   * the raw `useQuery` result so callers can pass it straight through.
   */
  languages: LanguageOption[] | undefined;
  /**
   * Called with the tapped language's code. The caller owns which mutation
   * this maps to (`setTargetLanguage`, `setUiLanguage`, …) — this component
   * only knows how to render a list and report a tap.
   */
  onSelect: (languageCode: string) => unknown;
  /** Called after `onSelect` resolves — e.g. to dismiss an inline picker. */
  onSelected?: (languageCode: string) => void;
}

/**
 * Renders a language list as tappable rows and reports taps via `onSelect`.
 * Deliberately data-agnostic: used inline (not a separate nav route) by
 * Home's "choose your language" empty state, Learn's "needs target language"
 * state, and Profile's target-language AND display-language sections — one
 * shared component instead of near-duplicates (CLAUDE.md rule 3).
 */
export function LanguagePicker({ languages, onSelect, onSelected }: LanguagePickerProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const [pendingCode, setPendingCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSelect = async (code: string) => {
    setError(null);
    setPendingCode(code);
    try {
      await onSelect(code);
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
