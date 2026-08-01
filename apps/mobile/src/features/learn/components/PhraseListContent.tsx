import { ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@backend/_generated/api';
import type { Id } from '@backend/_generated/dataModel';
import { getCategory } from '@sarvabhasha/shared';
import { Box, Text, useTheme } from '@theme';
import { ListCard } from '@shared/components/molecules/ListCard';
import { LanguagePicker } from '@shared/components/molecules/LanguagePicker';

interface PhraseListContentProps {
  categorySlug: string;
  onSelectPhrase: (phraseId: Id<'phrases'>) => void;
}

/** Mastery is tracked 0–3 (see `progress.ts`'s `masteryLevelForViews`). */
const MAX_MASTERY_LEVEL = 3;

/**
 * The body of the phrase list for one category: `api.phrases.listByCategory`
 * branched on its discriminated-union return. Extracted from
 * `PhraseListScreen` (feature-specific, not `shared/` — this is Learn's
 * domain shape) so it can also back the tablet/wide two-pane right pane in
 * `LearnScreen` without duplicating the query + state handling.
 */
export function PhraseListContent({ categorySlug, onSelectPhrase }: PhraseListContentProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const result = useQuery(api.phrases.listByCategory, { categorySlug });
  const targetLanguages = useQuery(api.languages.listLiveLanguages);
  const setTargetLanguage = useMutation(api.users.setTargetLanguage);
  const categoryDef = getCategory(categorySlug);
  const title = categoryDef ? t(categoryDef.i18nKey) : categorySlug;

  if (result === undefined) {
    return (
      <Box flex={1} alignItems="center" justifyContent="center" padding="l">
        <ActivityIndicator color={theme.colors.primary} />
      </Box>
    );
  }

  if (result.needsTargetLanguage) {
    return (
      <Box>
        <Text variant="h2" marginBottom="s">
          {title}
        </Text>
        <Text variant="body" color="textSecondary" marginBottom="l">
          {t('Learn.NEEDS_TARGET_LANGUAGE_BODY')}
        </Text>
        <LanguagePicker
          languages={targetLanguages}
          onSelect={(code) => setTargetLanguage({ languageCode: code })}
        />
      </Box>
    );
  }

  if (result.phrases.length === 0) {
    return (
      <Box>
        <Text variant="h2" marginBottom="s">
          {title}
        </Text>
        <Text variant="body" color="textSecondary">
          {t('Learn.EMPTY_PHRASE_LIST')}
        </Text>
      </Box>
    );
  }

  return (
    <Box flex={1}>
      <Text variant="h2" marginBottom="m">
        {title}
      </Text>
      <Box gap="s">
        {result.phrases.map((phrase) => (
          <ListCard
            key={phrase.phraseId}
            title={phrase.text}
            subtitle={phrase.transliteration}
            trailingText={t('Learn.MASTERY_TRAILING', {
              level: phrase.masteryLevel,
              max: MAX_MASTERY_LEVEL,
            })}
            onPress={() => onSelectPhrase(phrase.phraseId)}
          />
        ))}
      </Box>
    </Box>
  );
}
