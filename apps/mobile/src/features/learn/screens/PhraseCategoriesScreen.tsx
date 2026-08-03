import { useState } from 'react';
import { ActivityIndicator, ScrollView, useWindowDimensions } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from 'convex/react';
import { api } from '@backend/_generated/api';
import { getCategory } from '@sarvabhasha/shared';
import { Box, Text, useTheme, MAX_CONTENT_WIDTH } from '@theme';
import { Screen } from '@shared/components/atoms/Screen';
import { ListCard } from '@shared/components/molecules/ListCard';
import { PhraseListContent } from '../components/PhraseListContent';
import type { LearnStackParamList } from '@navigation/types';

/**
 * The "Common Phrases" destination — behaviorally UNCHANGED from when this
 * was the Learn tab's own root (before the four-card Foundations IA landed;
 * see plans/phase-13-foundations-vocab-numbers-alphabet.md, "Where this
 * lives in the Learn tab"). Reached by tapping the "Common Phrases" card on
 * `LearnScreen`, which is now the tab root instead.
 *
 * Still the one screen in this app with a genuinely different tablet/wide
 * layout (CLAUDE.md rule 16 / the layout-intent table): phone pushes a
 * `PhraseList` stack screen on category tap, tablet/wide shows both panes at
 * once — categories left, the tapped category's phrases right.
 *
 * Sidebar width is a fixed constant (like `MAX_CONTENT_WIDTH`), not a
 * fraction of window width, so it reads as a stable nav rail rather than a
 * proportional split.
 *
 * Unlike its former life as the tab root, this screen is now PUSHED under
 * the native stack header (`headerShown: true`, title `''`) — so neither
 * branch below adds the device's top safe-area inset itself anymore; the
 * header already reserves it. (Previously the wide branch added `insets.top`
 * manually because it bypassed `Screen` entirely while ALSO being the
 * `headerShown: false` tab root — see specs/_findings.md F-001's original
 * fix. That reasoning no longer applies now that a header is always present
 * here.)
 */
const CATEGORY_PANE_WIDTH = 320;

export function PhraseCategoriesScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const isWide = width >= theme.breakpoints.tablet;
  const navigation = useNavigation<NativeStackNavigationProp<LearnStackParamList>>();
  const categories = useQuery(api.categories.listCategories);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);

  if (categories === undefined) {
    return (
      <Box flex={1} backgroundColor="background" alignItems="center" justifyContent="center">
        <ActivityIndicator color={theme.colors.primary} />
      </Box>
    );
  }

  const firstLiveSlug = categories.find((c) => c.status === 'live')?.slug ?? null;
  const activeSlug = isWide ? (selectedSlug ?? firstLiveSlug) : null;

  const categoryList = (
    <Box gap="s">
      {categories.map((category) => {
        const def = getCategory(category.slug);
        const displayName = def ? t(def.i18nKey) : category.slug;
        const isLive = category.status === 'live';

        return (
          <ListCard
            key={category._id}
            title={displayName}
            subtitle={isLive ? undefined : t('Learn.COMING_SOON_LABEL')}
            trailingText={
              isLive
                ? t('Learn.CATEGORY_PROGRESS', {
                    viewed: category.viewedCount,
                    total: category.phraseCount,
                  })
                : undefined
            }
            disabled={!isLive}
            selected={isWide && activeSlug === category.slug}
            onPress={
              isLive
                ? () =>
                    isWide
                      ? setSelectedSlug(category.slug)
                      : navigation.navigate('PhraseList', { categorySlug: category.slug })
                : undefined
            }
          />
        );
      })}
    </Box>
  );

  if (!isWide) {
    return (
      <Screen scroll topInset={false}>
        <Text variant="h1" marginBottom="l">
          {t('Learn.COMMON_PHRASES_TITLE')}
        </Text>
        {categoryList}
      </Screen>
    );
  }

  return (
    <Box flex={1} backgroundColor="background" flexDirection="row">
      <Box width={CATEGORY_PANE_WIDTH} backgroundColor="surface" borderRightWidth={1} borderColor="border">
        <ScrollView contentContainerStyle={{ padding: theme.spacing.l }}>
          <Text variant="h1" marginBottom="l">
            {t('Learn.COMMON_PHRASES_TITLE')}
          </Text>
          {categoryList}
        </ScrollView>
      </Box>
      <Box flex={1}>
        <ScrollView
          contentContainerStyle={{
            padding: theme.spacing.xl,
            flexGrow: 1,
          }}
        >
          {/*
            Cap the pane's own content width (CLAUDE.md rule 16 — full-bleed
            content gets a maxWidth). The sidebar/pane split itself is the
            intentional "genuinely different" tablet layout, but on a very
            wide iPad or unfolded foldable the *right pane alone* can still
            exceed a sane reading/row width, stretching each ListCard's
            title/trailing-text gap absurdly wide. Left-aligned, not centred,
            since this pane already sits to the right of the fixed sidebar.
          */}
          <Box width="100%" maxWidth={MAX_CONTENT_WIDTH}>
            {activeSlug ? (
              <PhraseListContent
                categorySlug={activeSlug}
                onSelectPhrase={(phraseId) => navigation.navigate('PhraseDetail', { phraseId })}
              />
            ) : (
              <Text variant="body" color="textMuted">
                {t('Learn.SELECT_CATEGORY_PROMPT')}
              </Text>
            )}
          </Box>
        </ScrollView>
      </Box>
    </Box>
  );
}
