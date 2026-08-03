import { useTranslation } from 'react-i18next';
import { Text } from '@theme';
import { Screen } from '@shared/components/atoms/Screen';
import { VocabularyCategoryContent } from '../components/VocabularyCategoryContent';

/**
 * Numbers is a `vocabularyCategories` row (slug "numbers"), not a separate
 * data model or a separate grid renderer — see
 * plans/phase-13-foundations-vocab-numbers-alphabet.md. This screen is a
 * thin wrapper pinning `VocabularyCategoryContent` to that one category and
 * skipping straight to its grid, unlike `VocabularyScreen`'s category-picker
 * chrome (the plan doc's explicit deep-link requirement for this card).
 *
 * Pushed from the Learn root (`LearnScreen`'s "Numbers" card) under the
 * native stack header, same convention as `PhraseList`/`PhraseDetail` —
 * `topInset={false}` because the header itself reserves the safe area.
 */
export function NumbersScreen() {
  const { t } = useTranslation();

  return (
    <Screen scroll topInset={false}>
      <Text variant="h1" marginBottom="l">
        {t('Learn.NUMBERS_TITLE')}
      </Text>
      <VocabularyCategoryContent categorySlug="numbers" showNumeral />
    </Screen>
  );
}
