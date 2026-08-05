import { useState } from 'react';
import { ActivityIndicator, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery } from 'convex/react';
import type { FunctionReturnType } from 'convex/server';
import { Ionicons } from '@expo/vector-icons';
import { api } from '@backend/_generated/api';
import { getLanguage, needsTallLineHeight } from '@sarvabhasha/shared';
import { Box, Text, useTheme } from '@theme';
import { Screen } from '@shared/components/atoms/Screen';
import { LanguagePicker } from '@shared/components/molecules/LanguagePicker';
import { usePhraseAudio } from '../hooks/usePhraseAudio';

type ScriptCharacter = FunctionReturnType<typeof api.aksharmala.listCharactersForScript>[number];

/**
 * Sequential Aksharmala flashcard — script derived from the learner's own
 * `targetLanguage` via `@sarvabhasha/shared`'s `getLanguage(...).script`
 * (`aksharmala.listCharactersForScript` is keyed by SCRIPT, not language —
 * see plans/phase-13-foundations-vocab-numbers-alphabet.md: one script's
 * character set serves every language sharing it).
 *
 * Pushed from the Learn root under the native stack header, same convention
 * as `PhraseList`/`PhraseDetail` — `topInset={false}` because the header
 * itself reserves the safe area.
 */
export function AksharmalaScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const user = useQuery(api.users.getCurrentUser);
  const targetLanguages = useQuery(api.languages.listLiveLanguages);
  const setTargetLanguage = useMutation(api.users.setTargetLanguage);

  const script = user?.targetLanguage ? getLanguage(user.targetLanguage)?.script : undefined;
  // `'skip'` while there is no resolvable script yet — same pattern
  // `HomeScreen` uses for `phrases.getDetail` when there is nothing to fetch.
  const characters = useQuery(api.aksharmala.listCharactersForScript, script ? { script } : 'skip');

  if (user === undefined || (script !== undefined && characters === undefined)) {
    return (
      <Screen topInset={false}>
        <Box flex={1} alignItems="center" justifyContent="center">
          <ActivityIndicator color={theme.colors.primary} />
        </Box>
      </Screen>
    );
  }

  if (!user?.targetLanguage || !script) {
    return (
      <Screen scroll topInset={false}>
        <Text variant="h1" marginBottom="s">
          {t('Learn.AKSHARMALA_TITLE')}
        </Text>
        <Text variant="body" color="textSecondary" marginBottom="l">
          {t('Learn.AKSHARMALA_NEEDS_LANGUAGE')}
        </Text>
        <LanguagePicker
          languages={targetLanguages}
          onSelect={(code) => setTargetLanguage({ languageCode: code })}
        />
      </Screen>
    );
  }

  if (!characters || characters.length === 0) {
    return (
      <Screen scroll topInset={false}>
        <Text variant="h1" marginBottom="s">
          {t('Learn.AKSHARMALA_TITLE')}
        </Text>
        <Text variant="body" color="textSecondary">
          {t('Learn.AKSHARMALA_EMPTY')}
        </Text>
      </Screen>
    );
  }

  return (
    <Screen scroll topInset={false}>
      {/*
        `m`, not `l` — this screen's whole flashcard interface (progress
        counter, glyph, romanization, audio button, example word, prev/next,
        jump-to-letter grid) has to fit one standard-phone viewport without
        scrolling; every token trimmed here and below buys back a few points
        toward that, without cutting any of those pieces.
      */}
      <Text variant="h1" marginBottom="m">
        {t('Learn.AKSHARMALA_TITLE')}
      </Text>
      {/*
        Remount on script change (only happens if the learner switches target
        language, which changes the whole card set) so the flashcard's own
        index state resets cleanly — same idiom as `PhraseAnimationPlayer`'s
        `key={detail.phraseId}`.
      */}
      <AksharmalaFlashcards
        key={script}
        characters={characters}
        tallScript={needsTallLineHeight(user.targetLanguage)}
      />
    </Screen>
  );
}

interface AksharmalaFlashcardsProps {
  characters: ScriptCharacter[];
  tallScript: boolean;
}

function AksharmalaFlashcards({ characters, tallScript }: AksharmalaFlashcardsProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const [index, setIndex] = useState(0);
  // Clamped defensively — the parent guarantees a non-empty, `key`-remounted
  // list per script, but a live Convex update could in principle shrink
  // `characters` out from under an already-mounted index.
  const safeIndex = Math.min(index, characters.length - 1);
  const current = characters[safeIndex]!;
  const audio = usePhraseAudio(current.audioUrl);

  const isFirst = safeIndex === 0;
  const isLast = safeIndex === characters.length - 1;
  const goPrev = () => setIndex((i) => Math.max(0, i - 1));
  const goNext = () => setIndex((i) => Math.min(characters.length - 1, i + 1));

  return (
    // `m`, not `l`, between the four top-level blocks (progress / card /
    // prev-next / jump grid) — see the fit-without-scrolling note on
    // `AksharmalaScreen`'s title above.
    <Box gap="m">
      <Text variant="caption" color="textMuted" textAlign="center">
        {t('Learn.AKSHARMALA_PROGRESS', { current: safeIndex + 1, total: characters.length })}
      </Text>

      <Box
        backgroundColor="surface"
        borderRadius="xl"
        alignItems="center"
        justifyContent="center"
        // Tall scripts still get MORE padding than non-tall (guards against
        // clipped matras/ascenders around the glyph), just a smaller gap
        // between the two than before (`xl`/`l`, not `xxl`/`xl`) — freed for
        // the fit-without-scrolling budget now that the glyph itself
        // (`h1`, not `hero`) also takes less vertical space.
        paddingVertical={tallScript ? 'xl' : 'l'}
        paddingHorizontal="l"
        gap="m"
      >
        {/*
          The glyph — `h1`, not `hero` (this app's largest token): the full
          flashcard (progress counter, glyph, romanization, audio button,
          example word, prev/next row, jump-to-letter grid) has to fit in one
          viewport without scrolling, and `hero` alone (56 lineHeight) ate too
          much of that budget on a standard phone. `h1` still reads as the
          card's main event — same size+weight tier (`fontWeight: '700'`)
          `hero`/`display` use, just the smallest of the three — while giving
          roughly half the vertical space back. Extra vertical padding (above)
          on tall scripts guards against clipped matras/ascenders instead of
          hand-tuning a lineHeight number.
        */}
        <Text variant="h1" textAlign="center">
          {current.character}
        </Text>
        <Text variant="h3" color="textSecondary">
          {current.romanization}
        </Text>

        {audio.isLoaded ? (
          <Pressable
            onPress={audio.toggle}
            accessibilityRole="button"
            accessibilityLabel={
              audio.playing ? t('Learn.PAUSE_BUTTON_LABEL') : t('Learn.PLAY_BUTTON_LABEL')
            }
          >
            <Box backgroundColor="primary" borderRadius="round" padding="m">
              <Ionicons
                name={audio.playing ? 'pause' : 'play'}
                size={24}
                color={theme.colors.textInverse}
              />
            </Box>
          </Pressable>
        ) : null}

        {current.exampleWord ? (
          <Box alignItems="center" marginTop="s">
            <Text variant="label" color="textSecondary">
              {t('Learn.AKSHARMALA_EXAMPLE_LABEL')}
            </Text>
            <Text variant="body">{current.exampleWord}</Text>
            {current.exampleTransliteration ? (
              <Text variant="transliteration">{current.exampleTransliteration}</Text>
            ) : null}
          </Box>
        ) : null}
      </Box>

      <Box flexDirection="row" gap="m">
        <Box flex={1}>
          <Pressable
            onPress={goPrev}
            disabled={isFirst}
            accessibilityRole="button"
            accessibilityLabel={t('Learn.AKSHARMALA_PREV_LABEL')}
          >
            <Box
              flexDirection="row"
              alignItems="center"
              justifyContent="center"
              backgroundColor="surface"
              borderRadius="m"
              minHeight={44}
              opacity={isFirst ? 0.5 : 1}
            >
              <Ionicons name="chevron-back" size={20} color={theme.colors.textPrimary} />
            </Box>
          </Pressable>
        </Box>
        <Box flex={1}>
          <Pressable
            onPress={goNext}
            disabled={isLast}
            accessibilityRole="button"
            accessibilityLabel={t('Learn.AKSHARMALA_NEXT_LABEL')}
          >
            <Box
              flexDirection="row"
              alignItems="center"
              justifyContent="center"
              backgroundColor="surface"
              borderRadius="m"
              minHeight={44}
              opacity={isLast ? 0.5 : 1}
            >
              <Ionicons name="chevron-forward" size={20} color={theme.colors.textPrimary} />
            </Box>
          </Pressable>
        </Box>
      </Box>

      <Box>
        <Text variant="label" color="textSecondary" marginBottom="s">
          {t('Learn.AKSHARMALA_JUMP_LABEL')}
        </Text>
        <Box flexDirection="row" flexWrap="wrap" gap="s">
          {characters.map((char, i) => {
            const selected = i === safeIndex;
            return (
              <Pressable
                key={char.scriptCharacterId}
                onPress={() => setIndex(i)}
                accessibilityRole="button"
                accessibilityLabel={char.character}
              >
                <Box
                  width={44}
                  height={44}
                  borderRadius="m"
                  alignItems="center"
                  justifyContent="center"
                  backgroundColor={selected ? 'primary' : 'surface'}
                  borderWidth={1}
                  borderColor={selected ? 'primary' : 'border'}
                >
                  <Text variant="body" color={selected ? 'textInverse' : 'textPrimary'}>
                    {char.character}
                  </Text>
                </Box>
              </Pressable>
            );
          })}
        </Box>
      </Box>
    </Box>
  );
}
