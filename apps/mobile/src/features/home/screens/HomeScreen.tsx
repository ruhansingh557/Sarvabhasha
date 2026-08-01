import { ActivityIndicator } from 'react-native';
import { useNavigation, type NavigationProp } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useQuery } from 'convex/react';
import { api } from '@backend/_generated/api';
import { Box, Text, useTheme } from '@theme';
import { Screen } from '@shared/components/atoms/Screen';
import { Button } from '@shared/components/atoms/Button';
import { LanguagePicker } from '@shared/components/molecules/LanguagePicker';
import type { MainTabParamList } from '@navigation/types';

/**
 * Home tab. `useQuery(api.home.getHomeSummary)` drives everything here — see
 * `packages/backend/convex/home.ts` for the one-query-per-screen shape.
 *
 * `hasTargetLanguage: false` (no target language chosen yet) gets the same
 * inline `LanguagePicker` treatment used by Learn's `PhraseListScreen`.
 */
export function HomeScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const navigation = useNavigation<NavigationProp<MainTabParamList>>();
  const summary = useQuery(api.home.getHomeSummary);

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
          <LanguagePicker />
        </Box>
      </Screen>
    );
  }

  const { streak, totalPhrases, viewedCount, continueLearning, badges } = summary;

  return (
    <Screen scroll>
      <Text variant="h1" marginBottom="l">
        {t('Home.TITLE')}
      </Text>

      <Box
        backgroundColor="surface"
        borderRadius="l"
        padding="l"
        marginBottom="m"
        flexDirection="row"
        alignItems="center"
        gap="m"
      >
        <Text variant="hero">{'\u{1F525}'}</Text>
        <Box flex={1}>
          <Text variant="h2">{t('Home.STREAK_COUNT', { count: streak.currentStreak })}</Text>
          <Text variant="caption">{t('Home.LONGEST_STREAK', { count: streak.longestStreak })}</Text>
        </Box>
      </Box>

      <Box backgroundColor="surface" borderRadius="l" padding="l" marginBottom="l">
        <Text variant="label" marginBottom="xs">
          {t('Home.PROGRESS_LABEL')}
        </Text>
        <Text variant="h3">{t('Home.PROGRESS_SUMMARY', { viewed: viewedCount, total: totalPhrases })}</Text>
      </Box>

      {continueLearning ? (
        <Box marginBottom="l">
          <Button
            onPress={() =>
              navigation.navigate('LearnTab', {
                screen: 'PhraseList',
                params: { categorySlug: continueLearning.categorySlug },
              })
            }
          >
            {t('Home.CONTINUE_LEARNING_BUTTON')}
          </Button>
        </Box>
      ) : null}

      <Text variant="h3" marginBottom="s">
        {t('Home.BADGES_TITLE')}
      </Text>
      <BadgeRow label={t('Home.BADGE_FIRST_PHRASE')} earned={badges.firstPhraseViewed} />
      <BadgeRow label={t('Home.BADGE_FIRST_CATEGORY')} earned={badges.firstCategoryComplete} />
      <BadgeRow label={t('Home.BADGE_SEVEN_DAY_STREAK')} earned={badges.sevenDayStreak} />
    </Screen>
  );
}

function BadgeRow({ label, earned }: { label: string; earned: boolean }) {
  return (
    <Box flexDirection="row" alignItems="center" paddingVertical="s" gap="s">
      <Text variant="body">{earned ? '✅' : '⬜'}</Text>
      <Text variant="body" color={earned ? 'textPrimary' : 'textMuted'}>
        {label}
      </Text>
    </Box>
  );
}
