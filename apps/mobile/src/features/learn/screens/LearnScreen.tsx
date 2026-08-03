import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from 'convex/react';
import { api } from '@backend/_generated/api';
import { getLanguage } from '@sarvabhasha/shared';
import { Box, Text, useTheme } from '@theme';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@shared/components/atoms/Screen';
import { FoundationCard } from '../components/FoundationCard';
import { fallbackGlyphForScript } from '../utils/foundationsDisplay';
import type { LearnStackParamList } from '@navigation/types';

/**
 * Learn tab root — the locked "Foundations" IA (Option A, four equal-peer
 * cards, no inline previews): plans/phase-13-foundations-vocab-numbers-alphabet.md,
 * "Where this lives in the Learn tab." Exactly four cards, nothing else.
 * Each carries a live count so browsing answers "how much is in here?"
 * before tapping in; every category/character-set/word-list lives one tap
 * deeper, on its own screen.
 *
 * This screen deliberately does NOT get the two-pane tablet/wide treatment
 * `PhraseCategoriesScreen` (the former Learn root) still has — "only Learn
 * gets a genuinely different layout" (CLAUDE.md rule 16) refers to that
 * category/phrase drill-down specifically, not to this menu. A four-card
 * menu reads fine as a normal, centred, `Screen`-constrained page at every
 * breakpoint; inventing a wider variant here would be exactly the "invented
 * tablet-only screen" rule 16 warns against.
 */
export function LearnScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<LearnStackParamList>>();

  const phraseCategories = useQuery(api.categories.listCategories);
  const user = useQuery(api.users.getCurrentUser);
  const vocabCategories = useQuery(api.vocabulary.listCategories);
  const numbersResult = useQuery(api.vocabulary.listItemsByCategory, { categorySlug: 'numbers' });

  const targetScript = user?.targetLanguage ? getLanguage(user.targetLanguage)?.script : undefined;
  // `'skip'` until a script is resolvable — same pattern `HomeScreen` uses
  // for a query with nothing to fetch yet.
  const scriptCharacters = useQuery(
    api.aksharmala.listCharactersForScript,
    targetScript ? { script: targetScript } : 'skip',
  );

  // ---- Common Phrases: "N categories · M phrases", both derived from the
  // same live-only query LearnScreen used to drive its own category list.
  // Two independently-pluralizable quantities in one string means a single
  // `count` can't drive i18next's plural selection for both halves at once
  // (e.g. "1 category · 45 phrases" needs singular AND plural in the same
  // sentence) — so each half is its own `_one`/`_other` key, and the outer
  // template just joins the two already-resolved labels.
  const liveCategories = (phraseCategories ?? []).filter((c) => c.status === 'live');
  const commonPhrasesCount = phraseCategories
    ? t('Learn.COMMON_PHRASES_COUNT', {
        categoriesLabel: t('Learn.COMMON_PHRASES_CATEGORIES_COUNT', {
          count: liveCategories.length,
        }),
        phrasesLabel: t('Learn.COMMON_PHRASES_PHRASES_COUNT', {
          count: liveCategories.reduce((sum, c) => sum + c.phraseCount, 0),
        }),
      })
    : undefined;

  // ---- Aksharmala: count of LIVE characters for the learner's script, icon
  // is the actual script's first live vowel when available, falling back to
  // a representative glyph (never taught content) before that data exists.
  const aksharmalaCount = scriptCharacters
    ? t('Learn.AKSHARMALA_COUNT', { count: scriptCharacters.length })
    : undefined;
  const firstVowel = scriptCharacters?.find((c) => c.characterType === 'vowel');
  const aksharmalaGlyph = firstVowel?.character ?? fallbackGlyphForScript(targetScript);

  // ---- Numbers: count of LIVE items in the "numbers" vocabularyCategories row.
  const numbersCount =
    numbersResult && !numbersResult.needsTargetLanguage
      ? t('Learn.NUMBERS_COUNT', { count: numbersResult.items.length })
      : undefined;

  // ---- Vocabulary: category count (excluding "numbers", which has its own
  // card) rather than a total-word count — that would need a query per
  // category, which isn't worth adding for a root-screen badge.
  const nonNumberVocabCategories = (vocabCategories ?? []).filter((c) => c.slug !== 'numbers');
  const vocabularyCount = vocabCategories
    ? t('Learn.VOCABULARY_COUNT', { count: nonNumberVocabCategories.length })
    : undefined;

  return (
    <Screen scroll>
      <Text variant="h1" marginBottom="l">
        {t('Learn.TITLE')}
      </Text>
      <Box gap="s">
        <Box flexDirection="row" gap="s">
          <Box flex={1}>
            <FoundationCard
              icon={
                <Ionicons name="chatbubbles-outline" size={26} color={theme.colors.textInverse} />
              }
              title={t('Learn.COMMON_PHRASES_CARD_TITLE')}
              countLabel={commonPhrasesCount}
              badgeColor="primary"
              onPress={() => navigation.navigate('PhraseCategories')}
            />
          </Box>
          <Box flex={1}>
            <FoundationCard
              icon={
                <Text variant="h2" color="textInverse">
                  {aksharmalaGlyph}
                </Text>
              }
              title={t('Learn.AKSHARMALA_CARD_TITLE')}
              countLabel={aksharmalaCount}
              badgeColor="accent"
              onPress={() => navigation.navigate('Aksharmala')}
            />
          </Box>
        </Box>
        <Box flexDirection="row" gap="s">
          <Box flex={1}>
            <FoundationCard
              icon={
                <Ionicons name="calculator-outline" size={26} color={theme.colors.textInverse} />
              }
              title={t('Learn.NUMBERS_CARD_TITLE')}
              countLabel={numbersCount}
              badgeColor="info"
              onPress={() => navigation.navigate('Numbers')}
            />
          </Box>
          <Box flex={1}>
            <FoundationCard
              icon={<Ionicons name="images-outline" size={26} color={theme.colors.textInverse} />}
              title={t('Learn.VOCABULARY_CARD_TITLE')}
              countLabel={vocabularyCount}
              badgeColor="success"
              onPress={() => navigation.navigate('Vocabulary')}
            />
          </Box>
        </Box>
      </Box>
    </Screen>
  );
}
