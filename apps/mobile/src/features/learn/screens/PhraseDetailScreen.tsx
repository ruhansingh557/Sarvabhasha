import { useCallback } from 'react';
import { ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useFocusEffect, useRoute, type RouteProp } from '@react-navigation/native';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@backend/_generated/api';
import { toDayKey } from '@sarvabhasha/shared';
import { Box, Text, useTheme } from '@theme';
import { Screen } from '@shared/components/atoms/Screen';
import { Button } from '@shared/components/atoms/Button';
import { usePhraseAudio } from '../hooks/usePhraseAudio';
import { PhraseAnimationPlayer } from '../components/PhraseAnimationPlayer';
import type { LearnStackParamList } from '@navigation/types';

/**
 * The phrase detail / "player" screen. `text`/`transliteration` are this
 * app's `phrase`/`transliteration` text variants' first real use:
 * deliberately large target-script text, Latin transliteration underneath.
 *
 * The animation slot renders a real `expo-video` player when
 * `detail.animationUrl` is a live fal.ai clip, and falls back to the themed
 * static placeholder otherwise — most phrases won't have a clip yet, and
 * that's the normal/expected state, not an error.
 */
export function PhraseDetailScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const route = useRoute<RouteProp<LearnStackParamList, 'PhraseDetail'>>();
  const detail = useQuery(api.phrases.getDetail, { phraseId: route.params.phraseId });
  const recordViewed = useMutation(api.progress.recordViewed);
  const audio = usePhraseAudio(detail?.audioUrl);

  // `useFocusEffect`, not `useEffect` — re-viewing an already-seen phrase
  // (navigating back into it) still records a view, matching how repeated
  // review is counted elsewhere in the product.
  useFocusEffect(
    useCallback(() => {
      if (!detail) return;
      recordViewed({ phraseId: detail.phraseId, dayKey: toDayKey() }).catch(() => {
        // Best-effort — a failed view record shouldn't block the learner
        // from seeing/hearing the phrase they navigated here for.
      });
      // Re-fire only when the resolved phrase identity changes.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [detail?.phraseId]),
  );

  if (detail === undefined) {
    return (
      <Box flex={1} backgroundColor="background" alignItems="center" justifyContent="center">
        <ActivityIndicator color={theme.colors.primary} />
      </Box>
    );
  }

  if (detail === null) {
    return (
      <Screen>
        <Box flex={1} alignItems="center" justifyContent="center">
          <Text variant="body" color="textSecondary" textAlign="center">
            {t('Learn.PHRASE_UNAVAILABLE')}
          </Text>
        </Box>
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <Text variant="caption" marginBottom="xs">
        {detail.sourceText}
      </Text>
      <Text variant="phrase" marginBottom="s">
        {detail.text}
      </Text>
      <Text variant="transliteration" marginBottom="l">
        {detail.transliteration}
      </Text>

      <Box marginBottom="l">
        <Button variant="secondary" onPress={audio.toggle} disabled={!audio.isLoaded}>
          {audio.playing ? t('Learn.PAUSE_AUDIO_BUTTON') : t('Learn.PLAY_AUDIO_BUTTON')}
        </Button>
      </Box>

      {detail.animationUrl ? (
        <PhraseAnimationPlayer key={detail.phraseId} animationUrl={detail.animationUrl} />
      ) : (
        <Box
          backgroundColor="surface"
          borderRadius="l"
          padding="xl"
          alignItems="center"
          justifyContent="center"
          marginBottom="l"
          width="100%"
          aspectRatio={16 / 9}
        >
          <Text variant="h1" marginBottom="s">
            {'\u{1F3AC}'}
          </Text>
          <Text variant="caption" textAlign="center">
            {t('Learn.ANIMATION_COMING_SOON')}
          </Text>
        </Box>
      )}

      {detail.literalGloss ? (
        <Box marginBottom="l">
          <Text variant="label" marginBottom="xs">
            {t('Learn.LITERAL_GLOSS_LABEL')}
          </Text>
          <Text variant="bodySmall" color="textSecondary">
            {detail.literalGloss}
          </Text>
        </Box>
      ) : null}

      <Text variant="label" marginBottom="xs">
        {t('Learn.SITUATION_LABEL')}
      </Text>
      <Text variant="bodySmall" color="textSecondary">
        {detail.situation}
      </Text>
    </Screen>
  );
}
