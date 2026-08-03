import { useEffect, useState } from 'react';
import { ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@backend/_generated/api';
import type { Id } from '@backend/_generated/dataModel';
import { Box, Text, useTheme } from '@theme';
import { LanguagePicker } from '@shared/components/molecules/LanguagePicker';
import { usePhraseAudio } from '../hooks/usePhraseAudio';
import { VocabularyItemCard } from './VocabularyItemCard';

interface VocabularyCategoryContentProps {
  categorySlug: string;
  /** Numbers passes `true` so each card shows its `itemKey` (the numeral) as a badge; Vocabulary doesn't. */
  showNumeral?: boolean;
}

/**
 * The shared body for both `NumbersScreen` and `VocabularyScreen`:
 * `api.vocabulary.listItemsByCategory` branched on its discriminated-union
 * return, same shape/reasoning as `PhraseListContent`. Numbers IS a
 * `vocabularyCategories` row (slug "numbers"), not a separate data model —
 * see plans/phase-13-foundations-vocab-numbers-alphabet.md — so this is
 * genuinely one grid renderer, not two near-duplicates.
 *
 * Audio is lifted to ONE `usePhraseAudio` instance for the whole grid,
 * keyed to whichever item is "active" (playing or last played), instead of
 * one native player per card. That is both the cheaper choice for a
 * 15-25-item grid and what makes "only one thing plays at a time" (this
 * project's global-audio product concern) true here without a Zustand
 * store: there is only ever one native player object, so only one card can
 * ever actually be mid-playback.
 */
export function VocabularyCategoryContent({ categorySlug, showNumeral = false }: VocabularyCategoryContentProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const result = useQuery(api.vocabulary.listItemsByCategory, { categorySlug });
  const targetLanguages = useQuery(api.languages.listLiveLanguages);
  const setTargetLanguage = useMutation(api.users.setTargetLanguage);

  const [activeItemId, setActiveItemId] = useState<Id<'vocabularyItems'> | null>(null);
  const items = result && !result.needsTargetLanguage ? result.items : [];
  const activeItem = items.find((item) => item.vocabularyItemId === activeItemId) ?? null;
  const audio = usePhraseAudio(activeItem?.audioUrl);

  // Tapping a DIFFERENT card's play button only changes `activeItemId`
  // (below) — this effect is what turns that selection into actual
  // playback, once the newly-swapped source finishes loading. Re-tapping
  // the SAME card instead goes through `audio.toggle()` directly and never
  // touches `activeItemId`, so this effect does not re-fire and re-restart
  // a clip the learner just paused.
  useEffect(() => {
    if (activeItemId && audio.isLoaded) {
      audio.play();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeItemId, audio.isLoaded]);

  const handleTogglePlay = (itemId: Id<'vocabularyItems'>) => {
    if (activeItemId === itemId) {
      audio.toggle();
    } else {
      setActiveItemId(itemId);
    }
  };

  if (result === undefined) {
    return (
      <Box alignItems="center" justifyContent="center" padding="l">
        <ActivityIndicator color={theme.colors.primary} />
      </Box>
    );
  }

  if (result.needsTargetLanguage) {
    return (
      <Box>
        <Text variant="body" color="textSecondary" marginBottom="l">
          {t('Learn.VOCAB_NEEDS_TARGET_LANGUAGE_BODY')}
        </Text>
        <LanguagePicker
          languages={targetLanguages}
          onSelect={(code) => setTargetLanguage({ languageCode: code })}
        />
      </Box>
    );
  }

  if (items.length === 0) {
    return (
      <Text variant="body" color="textSecondary">
        {t('Learn.VOCAB_EMPTY_ITEMS')}
      </Text>
    );
  }

  return (
    <Box flexDirection="row" flexWrap="wrap" gap="m">
      {items.map((item) => (
        <Box key={item.vocabularyItemId} width={{ phone: '47%', tablet: '31%', wide: '23%' }}>
          <VocabularyItemCard
            englishWord={item.englishWord}
            text={item.text}
            transliteration={item.transliteration}
            imageUrl={item.imageUrl}
            numeralLabel={showNumeral ? item.itemKey : undefined}
            audioAvailable={!!item.audioUrl}
            isPlaying={activeItemId === item.vocabularyItemId && audio.playing}
            onTogglePlay={() => handleTogglePlay(item.vocabularyItemId)}
          />
        </Box>
      ))}
    </Box>
  );
}
