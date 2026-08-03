import { Image, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { Box, Text, useTheme } from '@theme';

interface VocabularyItemCardProps {
  englishWord: string;
  text: string;
  transliteration: string;
  imageUrl: string | null;
  /** Shown as a small badge over the image — Numbers passes its numeral `itemKey`, Vocabulary passes nothing. */
  numeralLabel?: string;
  /** Whether this item has LIVE audio at all — a null/undefined audio URL means "don't show a broken play button" (CLAUDE.md's learn-bharat lesson #4), not an error. */
  audioAvailable: boolean;
  isPlaying: boolean;
  onTogglePlay: () => void;
}

/**
 * One grid card for `VocabularyCategoryContent` (Numbers and Vocabulary
 * screens share this — Numbers is a `vocabularyCategories` row, not a
 * separate data shape). Mirrors `PhraseDetailScreen`'s caption/native-text/
 * transliteration hierarchy (English gloss small and muted above, the
 * native word prominent, Latin transliteration secondary below) rather than
 * inventing a new one.
 */
export function VocabularyItemCard({
  englishWord,
  text,
  transliteration,
  imageUrl,
  numeralLabel,
  audioAvailable,
  isPlaying,
  onTogglePlay,
}: VocabularyItemCardProps) {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <Box backgroundColor="surface" borderRadius="l" padding="m" gap="s">
      <Box
        aspectRatio={1}
        borderRadius="m"
        backgroundColor="background"
        alignItems="center"
        justifyContent="center"
        overflow="hidden"
        position="relative"
      >
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
        ) : (
          <Ionicons name="image-outline" size={28} color={theme.colors.textMuted} />
        )}
        {numeralLabel ? (
          <Box
            position="absolute"
            top={0}
            left={0}
            backgroundColor="primary"
            borderRadius="s"
            margin="xs"
            paddingHorizontal="s"
            paddingVertical="xs"
          >
            <Text variant="label" color="textInverse">
              {numeralLabel}
            </Text>
          </Box>
        ) : null}
      </Box>

      <Text variant="caption" color="textMuted">
        {englishWord}
      </Text>
      <Text variant="h3">{text}</Text>
      <Text variant="transliteration">{transliteration}</Text>

      {audioAvailable ? (
        <Pressable
          onPress={onTogglePlay}
          accessibilityRole="button"
          accessibilityLabel={isPlaying ? t('Learn.PAUSE_BUTTON_LABEL') : t('Learn.PLAY_BUTTON_LABEL')}
        >
          <Box
            flexDirection="row"
            alignItems="center"
            justifyContent="center"
            backgroundColor="primaryMuted"
            borderRadius="round"
            paddingVertical="xs"
            minHeight={44}
          >
            <Ionicons name={isPlaying ? 'pause' : 'play'} size={20} color={theme.colors.textPrimary} />
          </Box>
        </Pressable>
      ) : null}
    </Box>
  );
}
