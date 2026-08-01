import { useEffect } from 'react';
import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus, type AudioSource } from 'expo-audio';

/**
 * First `expo-audio` usage in the app. Wraps `useAudioPlayer` +
 * `useAudioPlayerStatus` for a single phrase's pronunciation clip.
 *
 * `audioUrl` is guarded against null/undefined (the Convex query hasn't
 * resolved yet, or a phrase legitimately has no live audio) — `useAudioPlayer`
 * is called with `null` in that case rather than skipping the hook, since
 * hooks can't be called conditionally.
 */
export function usePhraseAudio(audioUrl: string | null | undefined) {
  const source: AudioSource = audioUrl ? { uri: audioUrl } : null;
  const player = useAudioPlayer(source);
  const status = useAudioPlayerStatus(player);

  useEffect(() => {
    // Without this, phrase audio goes silent if the phone's physical mute
    // switch is on — which defeats the point of a pronunciation feature.
    // Called once per app session (module-level guard below), not on every
    // mount of this hook.
    ensureAudioModeConfigured();
  }, []);

  const toggle = () => {
    if (!player.isLoaded) return;
    if (status.playing) {
      player.pause();
    } else {
      player.play();
    }
  };

  return {
    playing: status.playing,
    isLoaded: player.isLoaded,
    toggle,
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
