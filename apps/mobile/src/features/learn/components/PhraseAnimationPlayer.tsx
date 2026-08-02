import { useCallback } from 'react';
import { ActivityIndicator, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useEvent } from 'expo';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Box, useTheme } from '@theme';

interface PhraseAnimationPlayerProps {
  /** Signed Convex storage URL for this phrase's fal.ai clip. Never null here
   * — the caller only mounts this component once `animationUrl` is present. */
  animationUrl: string;
}

/**
 * The lesson's silent, ambient teaching clip (fal.ai image-to-video, 9:16
 * portrait, 8-10s). Meaning is carried entirely by gesture/posture — there is
 * no burned-in audio, lip-sync, or target-script text. This is deliberately
 * independent of `usePhraseAudio`'s Bhashini TTS "Play" button elsewhere on
 * this screen; the two are never synced against each other.
 *
 * Autoplays + loops muted while this screen is focused, and pauses when the
 * learner navigates away rather than continuing to play off-screen.
 */
export function PhraseAnimationPlayer({ animationUrl }: PhraseAnimationPlayerProps) {
  const theme = useTheme();

  const player = useVideoPlayer(animationUrl, (p) => {
    p.loop = true;
    p.muted = true;
  });

  // Reactive mirror of `player.status` — the property itself doesn't
  // re-render the component when it changes underneath us.
  const { status } = useEvent(player, 'statusChange', { status: player.status });

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
      width={{ phone: '100%', tablet: 360, wide: 400 }}
      alignSelf="center"
      aspectRatio={9 / 16}
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
    </Box>
  );
}
