import { useCallback, useEffect, useRef, useState } from 'react';
import * as FileSystem from 'expo-file-system/legacy';
import { useAudioPlayer, useAudioPlayerStatus, setAudioModeAsync, type AudioSource } from 'expo-audio';
import { useAction } from 'convex/react';
import { api } from '@backend/_generated/api';
import type { PersonaKey } from './useTutorSession';

export type SpeakOutcome = 'played' | 'failed';

/**
 * Speaks one tutor reply out loud via `bhashini.tutorSpeech.synthesizeTutorReply`
 * + `expo-audio` playback. Mirrors `usePhraseAudio`'s
 * `useAudioPlayer`/`useAudioPlayerStatus` pattern (this app's established
 * "first expo-audio usage" precedent) rather than inventing a new one, with
 * one difference that pattern didn't need: the source here isn't a stable
 * Convex-hosted URL, it's synthesized fresh per call and has to be written to
 * a local file first — `synthesizeTutorReply` returns base64, and
 * `useAudioPlayer` needs a URI, not a data blob.
 *
 * `speak()` resolves its returned promise only once playback actually
 * FINISHES (or synthesis/write fails) — not once it starts. This matters:
 * the caller (`useVoiceTurn`) needs to know when to hand the avatar back to
 * its idle loop, and that can only be answered by whoever owns the player's
 * own `didJustFinish` status, i.e. here. An earlier draft tried to infer
 * "finished" from outside by watching `speakingMessageId` turn back to
 * `null`, which raced: the render right after calling `speak()` still shows
 * the OLD (usually already-null) value, before the async synth call has had
 * a chance to run at all, so that check fired one render too early. Wrapping
 * completion in the promise `speak()` itself returns removes the race by
 * construction — there's no "check somebody else's state at the right
 * moment" to race in the first place.
 *
 * Deliberately synthesize-and-discard, matching the backend's own contract
 * (`tutorSpeech.ts`'s doc comment: "played once by the mobile client and
 * discarded — no product reason to keep it"): the temp file this writes is
 * overwritten by the next call and never surfaced anywhere else.
 */
export function useTutorReplyAudio() {
  const synthesizeTutorReply = useAction(api.bhashini.tutorSpeech.synthesizeTutorReply);

  const [source, setSource] = useState<AudioSource>(null);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [error, setError] = useState<'failed' | null>(null);

  const player = useAudioPlayer(source);
  const status = useAudioPlayerStatus(player);
  const autoPlayRef = useRef(false);
  const finishResolverRef = useRef<((outcome: SpeakOutcome) => void) | null>(null);

  useEffect(() => {
    ensureRecordingCapableAudioModeConfigured();
  }, []);

  // Fire `.play()` the instant the freshly-set source finishes loading —
  // `useAudioPlayer` starts loading a new source as soon as it's passed in,
  // but doesn't auto-play it.
  useEffect(() => {
    if (autoPlayRef.current && player.isLoaded) {
      autoPlayRef.current = false;
      player.play();
    }
  }, [player, status.isLoaded]);

  // Playback genuinely finished — resolve whichever `speak()` call is
  // waiting, and clear the "who's speaking" pointer.
  useEffect(() => {
    if (status.didJustFinish) {
      setSpeakingMessageId(null);
      finishResolverRef.current?.('played');
      finishResolverRef.current = null;
    }
  }, [status.didJustFinish]);

  const speak = useCallback(
    (args: {
      messageId: string;
      text: string;
      languageCode: string;
      characterSlug: PersonaKey;
    }): Promise<SpeakOutcome> => {
      setError(null);
      return new Promise<SpeakOutcome>((resolve) => {
        finishResolverRef.current = resolve;
        const fail = () => {
          setError('failed');
          finishResolverRef.current = null;
          resolve('failed');
        };
        (async () => {
          try {
            const result = await synthesizeTutorReply({
              text: args.text,
              languageCode: args.languageCode,
              characterSlug: args.characterSlug,
            });
            if (!result.ok) {
              // `tutorSpeech.ts` returns failure reasons as plain strings, not
              // a discriminated enum (unlike `asr.ts`) — the caller already
              // gated the voice screen on `TTS_LANGUAGES` before ever getting
              // here, so in practice this is a real synthesis failure
              // (network, Bhashini flake), not a coverage gap.
              fail();
              return;
            }
            // `cacheDirectory` is typed nullable (no writable cache on this
            // platform/state) — treat that as a synthesis-path failure too
            // rather than writing to a broken "nulltutor-reply-….wav" path.
            if (!FileSystem.cacheDirectory) {
              fail();
              return;
            }
            // Bhashini's TTS output is 16-bit mono WAV (see `bhashini/tts.ts`'s
            // own "Rough: Bhashini returns 22.05kHz 16-bit mono WAV" comment —
            // `synthesizeTutorReply` reuses the same `synthesize()` pipeline,
            // so the extension here matches, not a guess).
            const fileUri = `${FileSystem.cacheDirectory}tutor-reply-${Date.now()}.wav`;
            await FileSystem.writeAsStringAsync(fileUri, result.audioBase64, { encoding: 'base64' });
            autoPlayRef.current = true;
            setSpeakingMessageId(args.messageId);
            setSource({ uri: fileUri });
            // Resolution happens later, via the `didJustFinish` effect above.
          } catch {
            fail();
          }
        })();
      });
    },
    [synthesizeTutorReply],
  );

  /** Re-attempt the same audio already loaded (e.g. the learner tapping a
   * "hear that again" affordance on the last reply). Does not re-synthesize —
   * just replays what's already in the local temp file. */
  const replay = useCallback(async () => {
    if (player.isLoaded) {
      await player.seekTo(0);
      player.play();
    }
  }, [player]);

  return {
    /** Non-null while this specific message's audio is actively playing —
     * compare against a message's `_id` to know whether IT is the one being
     * spoken, not just "something is playing". Drives which avatar
     * expression clip to loop while speaking. */
    speakingMessageId,
    isSpeaking: status.playing,
    error,
    speak,
    replay,
  };
}

let audioModeConfigured = false;

/** Same idempotent-module-guard pattern as `usePhraseAudio`'s
 * `ensureAudioModeConfigured`, extended with `allowsRecording: true` since
 * this app's audio mode now needs to serve both playback (this hook) and
 * recording (`useAudioRecording`) — `expo-audio` has one global audio mode,
 * not a per-player one. */
function ensureRecordingCapableAudioModeConfigured() {
  if (audioModeConfigured) return;
  audioModeConfigured = true;
  setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true }).catch(() => {
    // Best-effort — worst case the mute switch silences it, not a crash.
  });
}
