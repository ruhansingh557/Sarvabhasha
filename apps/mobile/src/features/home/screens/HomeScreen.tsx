import { ActivityIndicator, Pressable, ScrollView } from 'react-native';
import { useNavigation, type NavigationProp } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery } from 'convex/react';
import type { FunctionReturnType } from 'convex/server';
import { Ionicons } from '@expo/vector-icons';
import { api } from '@backend/_generated/api';
import { getCategory } from '@sarvabhasha/shared';
import { Box, Text, useTheme } from '@theme';
import { Screen } from '@shared/components/atoms/Screen';
import { LanguagePicker } from '@shared/components/molecules/LanguagePicker';
import { CategoryChip, iconForCategory } from '@shared/components/molecules/CategoryChip';
import type { MainTabParamList } from '@navigation/types';

/**
 * Home tab. `useQuery(api.home.getHomeSummary)` still drives the top-level
 * shape (see `packages/backend/convex/home.ts`) — this screen does not add
 * any new Convex functions. It adds two more READS of existing queries:
 *
 *   - `api.phrases.getDetail` for the "continue learning" phrase's actual
 *     content (native script + transliteration + English gloss), skipped
 *     entirely when there's nothing to continue. Same live-gated query
 *     `PhraseDetailScreen` already uses — this screen does not call
 *     `progress.recordViewed`, so just showing the card never marks the
 *     phrase as viewed.
 *   - `api.categories.listCategories` for the browse-categories chip row,
 *     the same query `LearnScreen` uses.
 *
 * Redesign rationale: plans/phase-12-v1-launch.md, "Step 8a — Home tab
 * redesign." The old layout (hero streak card, hero "N of 45 phrases"
 * card, unchecked-milestones list) read as bleak for a brand-new,
 * all-zero-stats learner. This version leads with actual content: the
 * streak shrinks to a header pill, the milestones checklist is gone
 * entirely, and the reclaimed space goes to a real phrase preview.
 *
 * `hasTargetLanguage: false` (no target language chosen yet) keeps the same
 * inline `LanguagePicker` treatment used by Learn's `PhraseListScreen`.
 */
export function HomeScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const navigation = useNavigation<NavigationProp<MainTabParamList>>();
  const summary = useQuery(api.home.getHomeSummary);
  const targetLanguages = useQuery(api.languages.listLiveLanguages);
  const setTargetLanguage = useMutation(api.users.setTargetLanguage);

  const continueLearning = summary?.hasTargetLanguage ? summary.continueLearning : null;
  const nextPhrase = useQuery(
    api.phrases.getDetail,
    continueLearning ? { phraseId: continueLearning.phraseId } : 'skip',
  );
  const categories = useQuery(api.categories.listCategories);

  const goToCategory = (categorySlug: string) =>
    navigation.navigate('LearnTab', { screen: 'PhraseList', params: { categorySlug } });

  if (summary === undefined) {
    return (
      <Box flex={1} backgroundColor="background" alignItems="center" justifyContent="center">
        <ActivityIndicator color={theme.colors.primary} />
      </Box>
    );
  }

  if (!summary.hasTargetLanguage) {
    return (
      <Screen scroll>
        <Box flex={1} justifyContent="center">
          <Text variant="h1" marginBottom="s">
            {t('Home.CHOOSE_LANGUAGE_TITLE')}
          </Text>
          <Text variant="body" color="textSecondary" marginBottom="l">
            {t('Home.CHOOSE_LANGUAGE_BODY')}
          </Text>
          <LanguagePicker
            languages={targetLanguages}
            onSelect={(code) => setTargetLanguage({ languageCode: code })}
          />
        </Box>
      </Screen>
    );
  }

  const { streak, totalPhrases, masteredCount } = summary;
  const liveCategories = (categories ?? []).filter((c) => c.status === 'live');
  const hasStreak = streak.currentStreak > 0;
  const allPhrasesDone = !continueLearning && totalPhrases > 0 && masteredCount >= totalPhrases;

  return (
    <Screen scroll>
      <Box
        flexDirection="row"
        alignItems="center"
        justifyContent="space-between"
        marginBottom="l"
      >
        <Text variant="h1">{t('Home.TITLE')}</Text>
        <Box
          flexDirection="row"
          alignItems="center"
          gap="xs"
          backgroundColor="surface"
          borderRadius="round"
          paddingHorizontal="s"
          paddingVertical="xs"
          accessibilityLabel={t('Home.STREAK_COUNT', { count: streak.currentStreak })}
        >
          <Ionicons
            name={hasStreak ? 'flame' : 'flame-outline'}
            size={16}
            color={hasStreak ? theme.colors.primary : theme.colors.textMuted}
          />
          <Text variant="label" color={hasStreak ? 'textPrimary' : 'textMuted'}>
            {streak.currentStreak}
          </Text>
        </Box>
      </Box>

      <ContinueLearningCard
        continueLearning={continueLearning}
        nextPhrase={nextPhrase}
        allPhrasesDone={allPhrasesDone}
        onPress={continueLearning ? () => goToCategory(continueLearning.categorySlug) : undefined}
      />

      {liveCategories.length > 0 ? (
        <Box marginTop="l">
          <Text variant="h3" marginBottom="s">
            {t('Home.CATEGORIES_TITLE')}
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <Box flexDirection="row" gap="s" paddingRight="l">
              {liveCategories.map((category) => (
                <CategoryChip
                  key={category._id}
                  slug={category.slug}
                  onPress={() => goToCategory(category.slug)}
                />
              ))}
            </Box>
          </ScrollView>
        </Box>
      ) : null}
    </Screen>
  );
}

type HomeSummary = Extract<
  FunctionReturnType<typeof api.home.getHomeSummary>,
  { hasTargetLanguage: true }
>;

interface ContinueLearningCardProps {
  continueLearning: HomeSummary['continueLearning'];
  nextPhrase: FunctionReturnType<typeof api.phrases.getDetail> | undefined;
  allPhrasesDone: boolean;
  onPress: (() => void) | undefined;
}

/**
 * The hero of the redesigned Home tab: a real content preview (native
 * script + transliteration + English gloss + category), not a bare button
 * or a stat. Three states beyond "has a real next phrase":
 *   - query still resolving (`nextPhrase === undefined`) — skeleton-ish
 *     loading card, same footprint, so the layout doesn't jump.
 *   - the phrase came back `null` (e.g. it stopped being live between the
 *     two queries) — falls back to the generic empty state rather than
 *     rendering blank/broken content.
 *   - `allPhrasesDone` — the learner has mastered everything currently
 *     live; a distinct, congratulatory message instead of an empty card.
 */
function ContinueLearningCard({
  continueLearning,
  nextPhrase,
  allPhrasesDone,
  onPress,
}: ContinueLearningCardProps) {
  const { t } = useTranslation();
  const theme = useTheme();

  if (!continueLearning) {
    const title = allPhrasesDone
      ? t('Home.ALL_PHRASES_DONE_TITLE')
      : t('Home.NOTHING_TO_LEARN_YET_TITLE');
    const body = allPhrasesDone
      ? t('Home.ALL_PHRASES_DONE_BODY')
      : t('Home.NOTHING_TO_LEARN_YET_BODY');

    return (
      <Box backgroundColor="surface" borderRadius="l" padding="l" alignItems="center" gap="xs">
        <Ionicons
          name={allPhrasesDone ? 'trophy-outline' : 'sparkles-outline'}
          size={28}
          color={theme.colors.primary}
        />
        <Text variant="h3" textAlign="center">
          {title}
        </Text>
        <Text variant="body" color="textSecondary" textAlign="center">
          {body}
        </Text>
      </Box>
    );
  }

  if (nextPhrase === undefined) {
    return (
      <Box
        backgroundColor="surface"
        borderRadius="l"
        padding="l"
        minHeight={160}
        alignItems="center"
        justifyContent="center"
      >
        <ActivityIndicator color={theme.colors.primary} />
      </Box>
    );
  }

  if (nextPhrase === null) {
    return (
      <Box backgroundColor="surface" borderRadius="l" padding="l" alignItems="center" gap="xs">
        <Ionicons name="sparkles-outline" size={28} color={theme.colors.primary} />
        <Text variant="h3" textAlign="center">
          {t('Home.NOTHING_TO_LEARN_YET_TITLE')}
        </Text>
        <Text variant="body" color="textSecondary" textAlign="center">
          {t('Home.NOTHING_TO_LEARN_YET_BODY')}
        </Text>
      </Box>
    );
  }

  const categoryDef = getCategory(continueLearning.categorySlug);
  const categoryName = categoryDef ? t(categoryDef.i18nKey) : continueLearning.categorySlug;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={t('Home.CONTINUE_LEARNING_A11Y', { phrase: nextPhrase.sourceText })}
    >
      <Box backgroundColor="surface" borderRadius="l" padding="l" gap="s">
        <Box flexDirection="row" alignItems="center" gap="s">
          <Box backgroundColor="primaryMuted" borderRadius="m" padding="s">
            <Ionicons
              name={iconForCategory(categoryDef?.iconKey)}
              size={20}
              color={theme.colors.textPrimary}
            />
          </Box>
          <Box flex={1}>
            <Text variant="label" color="textSecondary">
              {t('Home.CONTINUE_LEARNING_LABEL')}
            </Text>
            <Text variant="bodySmall" color="textMuted">
              {categoryName}
            </Text>
          </Box>
          <Ionicons name="chevron-forward" size={20} color={theme.colors.textMuted} />
        </Box>

        <Text variant="phrase">{nextPhrase.text}</Text>
        <Text variant="transliteration">{nextPhrase.transliteration}</Text>
        <Text variant="body" color="textSecondary">
          {nextPhrase.sourceText}
        </Text>
      </Box>
    </Pressable>
  );
}
