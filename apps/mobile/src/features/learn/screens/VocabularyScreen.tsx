import { useState } from 'react';
import { ActivityIndicator, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useQuery } from 'convex/react';
import { api } from '@backend/_generated/api';
import { Box, Text, useTheme } from '@theme';
import { Screen } from '@shared/components/atoms/Screen';
import { VocabularyCategoryChip } from '../components/VocabularyCategoryChip';
import { VocabularyCategoryContent } from '../components/VocabularyCategoryContent';

/**
 * Vocabulary tab: category chips → `VocabularyCategoryContent`'s card grid.
 * The "numbers" category is deliberately excluded from this chip row — it
 * has its own dedicated Learn-root card and screen (`NumbersScreen`), so
 * surfacing it a second time here would be the exact "same information
 * shown twice" redundancy the plan doc's IA section explicitly called out
 * and rejected for the Learn root itself.
 *
 * Pushed from the Learn root under the native stack header, same convention
 * as `PhraseList`/`PhraseDetail`/`NumbersScreen`.
 */
export function VocabularyScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const categories = useQuery(api.vocabulary.listCategories);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);

  const browsableCategories = (categories ?? [])
    .filter((c) => c.slug !== 'numbers')
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder);
  const activeSlug = selectedSlug ?? browsableCategories[0]?.slug ?? null;

  return (
    <Screen scroll topInset={false}>
      <Text variant="h1" marginBottom="l">
        {t('Learn.VOCABULARY_TITLE')}
      </Text>

      {categories === undefined ? (
        <Box alignItems="center" justifyContent="center" padding="l">
          <ActivityIndicator color={theme.colors.primary} />
        </Box>
      ) : browsableCategories.length === 0 ? (
        <Text variant="body" color="textSecondary">
          {t('Learn.VOCABULARY_EMPTY_CATEGORIES')}
        </Text>
      ) : (
        <>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <Box flexDirection="row" gap="s" paddingRight="l" marginBottom="l">
              {browsableCategories.map((category) => (
                <VocabularyCategoryChip
                  key={category._id}
                  slug={category.slug}
                  iconKey={category.iconKey}
                  selected={category.slug === activeSlug}
                  onPress={() => setSelectedSlug(category.slug)}
                />
              ))}
            </Box>
          </ScrollView>
          {activeSlug ? <VocabularyCategoryContent categorySlug={activeSlug} /> : null}
        </>
      )}
    </Screen>
  );
}
