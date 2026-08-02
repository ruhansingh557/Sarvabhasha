import { useCallback } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useFocusEffect } from '@react-navigation/native';
import { useEvent } from 'expo';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Ionicons } from '@expo/vector-icons';
import { Box, Text, useTheme } from '@theme';

interface PhraseAnimationPlayerProps {
  /** Signed Convex storage URL for this phrase's fal.ai clip. Never null here
   * — the caller only mounts this component once `animationUrl` is present. */
  animationUrl: string;
  /**
   * The phrase in the target script (the caller's `detail.text`), overlaid as
   * a persistent caption for the whole clip duration. This is Convex lesson
   * data threaded down as a prop, not an i18n string — it's rendered
   * client-side per the learner's actual target language, which is exactly
   * why it belongs here rather than baked into the clip: the same clip is
   * reused across all 22 languages (see the "LANGUAGE-INDEPENDENCE
   * DEVIATION" note atop packages/backend/convex/fal/animations.ts), so only
   * a client-side overlay can be correct per-language.
   */
  overlayText: string;
  /**
   * Whether the phrase's pronunciation clip (Bhashini TTS, owned by
   * `usePhraseAudio` in the screen) is currently playing. This component
   * never imports that hook itself — it stays a generic video player and the
   * screen wires audio into it via this prop plus `onToggleAudio`, so it has
   * no direct Bhashini/audio dependency of its own.
   */
  audioPlaying: boolean;
  /** Toggles the pronunciation audio. Invoked by the combined play/pause
   * control below, alongside the video's own play/pause. */
  onToggleAudio: () => void;
}

/**
 * The lesson's silent, ambient teaching clip (fal.ai image-to-video, 9:16
 * portrait, 8-10s). Meaning is carried entirely by gesture/posture — there is
 * no burned-in audio, lip-sync, or target-script text.
 *
 * A single overlaid play/pause icon (center-tap, YouTube/Instagram
 * convention) controls this clip AND `usePhraseAudio`'s Bhashini TTS
 * pronunciation clip together, per the project owner's explicit "one combined
 * control" request. The video's own play/pause state (`playingChange`) is
 * the primary signal the icon reflects — it loops continuously, while the
 * audio is a short one-shot clip that naturally finishes on its own even
 * while the video keeps looping. Pausing pauses the video always, and the
 * audio only if it was actually mid-playback (never force-started just to
 * immediately pause it); resuming plays the video always, and starts the
 * audio only if it isn't already playing.
 *
 * The video autoplays + loops muted while this screen is focused (unchanged
 * from before this control existed — the learner shouldn't have to tap to
 * see the clip play the first time), and pauses when the learner navigates
 * away rather than continuing to play off-screen.
 */
export function PhraseAnimationPlayer({
  animationUrl,
  overlayText,
  audioPlaying,
  onToggleAudio,
}: PhraseAnimationPlayerProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();

  // Tablet/wide keep a fixed width (360/400pt) with the clip's native 9:16
  // aspectRatio deriving height from that — already a reasonably sized box
  // there. Phone instead derives size from the *viewport height*: deriving
  // height from a full-width box made the portrait clip ~714pt tall on a
  // ~402pt-wide phone (width * 16/9), nearly the entire screen before any
  // scrolling. Capping to ~48% of window height and deriving width from that
  // via the same 9:16 ratio keeps the clip prominent without pushing the
  // "when to use this" caption off-screen. `Math.min` guards a landscape
  // phone, where 48% of a short window height could otherwise derive a width
  // wider than the screen itself.
  const isTablet = windowWidth >= theme.breakpoints.tablet;
  const isWide = windowWidth >= theme.breakpoints.wide;
  const phoneHeight = windowHeight * 0.48;
  const phoneWidth = Math.min(phoneHeight * (9 / 16), windowWidth);
  const boxWidth = isTablet ? (isWide ? 400 : 360) : phoneWidth;
  const boxHeight = isTablet ? boxWidth * (16 / 9) : phoneHeight;

  const player = useVideoPlayer(animationUrl, (p) => {
    p.loop = true;
    p.muted = true;
  });

  // Reactive mirror of `player.status` — the property itself doesn't
  // re-render the component when it changes underneath us.
  const { status } = useEvent(player, 'statusChange', { status: player.status });
  // Same reasoning for `player.playing`: this drives the combined icon below,
  // so it needs to re-render on every play/pause, not just read once.
  const { isPlaying: videoPlaying } = useEvent(player, 'playingChange', {
    isPlaying: player.playing,
  });

  const handleToggle = useCallback(() => {
    if (videoPlaying) {
      player.pause();
      // Only pause the audio if it was actually mid-playback — force-pausing
      // an audio clip that was never started would be a no-op but a
      // misleading one to reason about, and `usePhraseAudio.toggle` would
      // instead START it if called while stopped.
      if (audioPlaying) {
        onToggleAudio();
      }
    } else {
      player.play();
      if (!audioPlaying) {
        onToggleAudio();
      }
    }
  }, [videoPlaying, audioPlaying, onToggleAudio, player]);

  useFocusEffect(
    useCallback(() => {
      player.play();
      return () => {
        // Best-effort: expo-video's player auto-releases its native shared
        // object on unmount, and that release can race ahead of this cleanup
        // (e.g. navigating back unmounts the screen before this runs). Calling
        // a method on an already-released player throws
        // NativeSharedObjectNotFoundException — harmless here, since an
        // unmounted/released player is already stopped, so there's nothing
        // left to pause. Same "best-effort cleanup" pattern as
        // usePhraseAudio.ts's setAudioModeAsync call.
        try {
          player.pause();
        } catch {
          // Native player already released — nothing to do.
        }
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [player]),
  );

  return (
    <Box
      width={boxWidth}
      height={boxHeight}
      alignSelf="center"
      borderRadius="l"
      overflow="hidden"
      backgroundColor="surface"
      marginBottom="l"
      position="relative"
    >
      <VideoView
        player={player}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        nativeControls={false}
      />
      {status === 'loading' ? (
        <Box
          position="absolute"
          top={0}
          bottom={0}
          left={0}
          right={0}
          alignItems="center"
          justifyContent="center"
        >
          <ActivityIndicator color={theme.colors.primary} />
        </Box>
      ) : null}
      {/*
        Combined play/pause control — center-tap, the YouTube/Instagram
        convention for a primary video affordance. The `Pressable` covers the
        whole clip (a bigger, more forgiving tap target than the icon alone;
        the icon's own padding-based circle already clears the 44pt minimum
        on its own). Centered vertically keeps it well clear of the bottom
        caption band below, so the two overlays never collide.
      */}
      <Pressable
        onPress={handleToggle}
        accessibilityRole="button"
        accessibilityLabel={
          videoPlaying ? t('Learn.PAUSE_BUTTON_LABEL') : t('Learn.PLAY_BUTTON_LABEL')
        }
        style={StyleSheet.absoluteFill}
      >
        <Box flex={1} alignItems="center" justifyContent="center">
          <Box backgroundColor="overlay" borderRadius="round" padding="m">
            <Ionicons
              name={videoPlaying ? 'pause' : 'play'}
              size={28}
              color={theme.colors.overlayText}
            />
          </Box>
        </Box>
      </Pressable>
      {/*
        Persistent caption, like a lower-third — not word-by-word subtitles,
        since there's no word-level timing data and the clip has no real
        audio track to sync against. `overlay` is a dark scrim in BOTH themes
        (it doesn't track `primary`, which is what `textInverse` tracks), so
        the text token is `overlayText`, not `textInverse` — see theme.ts.
      */}
      <Box
        position="absolute"
        left={0}
        right={0}
        bottom={0}
        backgroundColor="overlay"
        paddingVertical="s"
        paddingHorizontal="m"
      >
        <Text variant="transliteration" color="overlayText" textAlign="center">
          {overlayText}
        </Text>
      </Box>
    </Box>
  );
}
