import { useCallback, useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus, type AudioSource } from 'expo-audio';
import { useCachedAudioSource } from './useCachedAudioSource';

/**
 * First `expo-audio` usage in the app. Wraps `useAudioPlayer` +
 * `useAudioPlayerStatus` for a single phrase's pronunciation clip.
 *
 * `audioUrl` is guarded against null/undefined (the Convex query hasn't
 * resolved yet, or a phrase legitimately has no live audio) — `useAudioPlayer`
 * is called with `null` in that case rather than skipping the hook, since
 * hooks can't be called conditionally.
 *
 * The remote `audioUrl` is resolved through `useCachedAudioSource` before it
 * ever reaches `useAudioPlayer`: on first play it's downloaded once to
 * `FileSystem.cacheDirectory`, and every play after — this session, next
 * session, weeks later — is served from that local file with zero network
 * traffic. See that hook's doc comment for the full cache design (key,
 * concurrency, failure fallback). This is purely an internal swap: every
 * existing caller of this hook (`PhraseDetailScreen`,
 * `VocabularyCategoryContent`'s lifted-grid-player, `AksharmalaScreen`)
 * keeps calling it exactly as before and gets caching for free.
 */
export function usePhraseAudio(audioUrl: string | null | undefined) {
  const cachedUri = useCachedAudioSource(audioUrl);
  const source: AudioSource = cachedUri ? { uri: cachedUri } : null;
  const player = useAudioPlayer(source);
  const status = useAudioPlayerStatus(player);

  useEffect(() => {
    // Without this, phrase audio goes silent if the phone's physical mute
    // switch is on — which defeats the point of a pronunciation feature.
    // Called once per app session (module-level guard below), not on every
    // mount of this hook.
    ensureAudioModeConfigured();
  }, []);

  // Pause when the screen loses focus (back navigation, backgrounding the
  // app) so pronunciation audio never keeps playing behind the learner's
  // back — audio is meant to be global/exclusive (only one thing plays at a
  // time), and this is the same class of native-resource cleanup as
  // PhraseAnimationPlayer's video player's useFocusEffect. Wrapped in
  // try/catch for the same reason as that player: `useAudioPlayer` releases
  // its native shared object on unmount, and that release can race ahead of
  // this cleanup (e.g. rapid back-and-forth navigation), throwing if we call
  // a method on an already-released player — harmless, since a
  // released/unmounted player is already stopped.
  useFocusEffect(
    useCallback(() => {
      return () => {
        try {
          if (player.isLoaded) {
            player.pause();
          }
        } catch {
          // Native player already released — nothing to do.
        }
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [player]),
  );

  const toggle = () => {
    if (!player.isLoaded) return;
    if (status.playing) {
      player.pause();
    } else {
      player.play();
    }
  };

  // Unconditional start, as opposed to `toggle`'s "flip whatever it's doing
  // now" — added for `VocabularyCategoryContent`, which lifts ONE instance of
  // this hook to cover a whole grid of cards (CLAUDE.md's "audio state is
  // global" concern, applied without spinning up a per-card native player):
  // switching which item is "active" needs to both swap `audioUrl` (handled
  // by the caller re-rendering with a new prop) AND then actually start
  // playback once the new source finishes loading, which `toggle` alone
  // can't express. Purely additive — `PhraseDetailScreen`'s existing
  // `toggle`-only usage is unaffected.
  const play = () => {
    if (!player.isLoaded) return;
    player.play();
  };

  return {
    playing: status.playing,
    isLoaded: player.isLoaded,
    toggle,
    play,
  };
}

let audioModeConfigured = false;

function ensureAudioModeConfigured() {
  if (audioModeConfigured) return;
  audioModeConfigured = true;
  setAudioModeAsync({ playsInSilentMode: true }).catch(() => {
    // Best-effort — worst case the mute switch silences phrase audio, not a crash.
  });
}
