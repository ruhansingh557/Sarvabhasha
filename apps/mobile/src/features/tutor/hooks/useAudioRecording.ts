import { useCallback, useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import {
  useAudioRecorder,
  useAudioRecorderState,
  RecordingPresets,
  setAudioModeAsync,
  getRecordingPermissionsAsync,
  requestRecordingPermissionsAsync,
  type RecordingOptions,
} from 'expo-audio';
import { useMicPermissionStore } from '../store/micPermissionStore';

/**
 * A conversational voice turn, not a voice memo — 25s is generous enough for
 * a real sentence without letting a forgotten-open mic record indefinitely.
 * Auto-stops and processes at the cap rather than recording forever.
 */
const MAX_RECORDING_MS = 25_000;

/**
 * Below this, there's no realistic amount of speech captured — an accidental
 * tap, or a tap-then-immediate-second-tap. Skipping the ASR call for these
 * saves a Bhashini round-trip on a guaranteed-empty-or-noise transcript (the
 * same noise `transcribeSpeech`'s own `MIN_TRANSCRIPT_LENGTH` check catches
 * server-side, just cheaper to catch before ever calling it).
 */
const MIN_RECORDING_MS = 400;

/**
 * Tuned for speech, not music: mono/16kHz is the conventional ASR recording
 * configuration (smaller upload too) — kept in the same AAC/.m4a container as
 * `RecordingPresets.HIGH_QUALITY` since that's the one Expo-tested, reliably
 * cross-platform container this library ships (Android's `MediaRecorder`
 * backing this library has no raw/uncompressed WAV output option at all, so
 * true PCM isn't achievable here without a custom native module — out of
 * scope). If Bhashini's ASR pipeline turns out to need WAV specifically, that
 * will surface as a real `transcribeSpeech` failure to fix with a native
 * follow-up, not something to guess around further client-side.
 */
const VOICE_RECORDING_OPTIONS: RecordingOptions = {
  ...RecordingPresets.HIGH_QUALITY,
  sampleRate: 16000,
  numberOfChannels: 1,
  bitRate: 64000,
};

export interface RecordingResult {
  uri: string;
  durationMillis: number;
  /** Below `MIN_RECORDING_MS` — caller should skip ASR and prompt a retry. */
  tooShort: boolean;
}

export type StartRecordingResult = 'started' | 'permission_denied' | 'busy' | 'error';

interface UseAudioRecordingOptions {
  /** Fired when the `MAX_RECORDING_MS` cap stops the recording on its own —
   * i.e. the caller never tapped "stop" itself. Manual stops resolve through
   * the returned `stop()` promise instead; this is only for the auto case,
   * so the caller can drive its state machine forward either way. */
  onAutoStopped?: (result: RecordingResult | null) => void;
  /** Fired when the app is backgrounded mid-recording and the clip is
   * discarded (not processed — see `discard()` below). Lets the caller snap
   * its own phase back to idle immediately, rather than only discovering the
   * recording is gone the next time it tries to act on it. */
  onDiscardedInBackground?: () => void;
}

/**
 * Push-to-talk recording mechanics for the voice tutor. Deliberately scoped
 * to JUST recording — no ASR, no send, no playback — so the state machine in
 * `useVoiceTurn` composes this with the rest rather than one hook doing
 * everything.
 *
 * Corner cases this owns:
 *   - Mic permission: checks first, requests once, remembers a denial for
 *     the rest of this app session (`micPermissionStore`) so the OS dialog
 *     never gets re-triggered on every tap after a "don't allow".
 *   - Max duration cap: auto-stops and reports via `onAutoStopped`.
 *   - Near-zero duration: flagged via `tooShort` on the result rather than
 *     silently returned as if it were real speech — the caller decides what
 *     "too short" means for the user (skip ASR, prompt retry).
 *   - App backgrounded mid-recording: an `AppState` listener stops and
 *     discards the in-flight recording so nothing keeps recording behind the
 *     learner's back and nothing crashes on resume.
 *   - Double-tap / rapid re-tap: a busy-guard makes overlapping start/stop
 *     calls no-ops instead of racing the native recorder.
 *   - Manual stop racing the auto-stop timer (both firing near the cap):
 *     whichever finishes first "wins"; the other resolves to `null` rather
 *     than double-processing the same clip.
 */
export function useAudioRecording({
  onAutoStopped,
  onDiscardedInBackground,
}: UseAudioRecordingOptions = {}) {
  const recorder = useAudioRecorder(VOICE_RECORDING_OPTIONS);
  const recorderState = useAudioRecorderState(recorder, 200);
  const markDenied = useMicPermissionStore((s) => s.markDenied);
  const markGranted = useMicPermissionStore((s) => s.markGranted);
  const deniedThisSession = useMicPermissionStore((s) => s.deniedThisSession);

  const busyRef = useRef(false);
  const finishedRef = useRef(false);
  const maxDurationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onAutoStoppedRef = useRef(onAutoStopped);
  onAutoStoppedRef.current = onAutoStopped;
  const onDiscardedInBackgroundRef = useRef(onDiscardedInBackground);
  onDiscardedInBackgroundRef.current = onDiscardedInBackground;

  const clearMaxDurationTimer = useCallback(() => {
    if (maxDurationTimerRef.current) {
      clearTimeout(maxDurationTimerRef.current);
      maxDurationTimerRef.current = null;
    }
  }, []);

  const finishRecording = useCallback(async (): Promise<RecordingResult | null> => {
    if (finishedRef.current) return null; // already handled by whichever caller got here first
    finishedRef.current = true;
    clearMaxDurationTimer();

    const durationMillis = Math.round(recorder.currentTime * 1000);
    try {
      await recorder.stop();
    } catch {
      // Already stopped (e.g. released by a backgrounding discard) — the
      // duration/uri captured just above are still whatever was true right
      // before this call, which is what we report.
    }
    const uri = recorder.uri;
    if (!uri) return null;
    return { uri, durationMillis, tooShort: durationMillis < MIN_RECORDING_MS };
  }, [recorder, clearMaxDurationTimer]);

  const start = useCallback(async (): Promise<StartRecordingResult> => {
    if (busyRef.current || recorder.isRecording) return 'busy';
    busyRef.current = true;
    try {
      let granted = (await getRecordingPermissionsAsync()).granted;
      if (!granted) {
        if (deniedThisSession) return 'permission_denied';
        const response = await requestRecordingPermissionsAsync();
        granted = response.granted;
        if (!granted) {
          markDenied();
          return 'permission_denied';
        }
      }
      markGranted();

      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync();
      finishedRef.current = false;
      recorder.record();

      maxDurationTimerRef.current = setTimeout(() => {
        finishRecording().then((result) => onAutoStoppedRef.current?.(result));
      }, MAX_RECORDING_MS);

      return 'started';
    } catch {
      return 'error';
    } finally {
      busyRef.current = false;
    }
  }, [recorder, deniedThisSession, markDenied, markGranted, finishRecording]);

  const stop = useCallback(async (): Promise<RecordingResult | null> => {
    if (busyRef.current || !recorder.isRecording) return null;
    busyRef.current = true;
    try {
      return await finishRecording();
    } finally {
      busyRef.current = false;
    }
  }, [recorder, finishRecording]);

  const discard = useCallback(async () => {
    clearMaxDurationTimer();
    finishedRef.current = true;
    if (recorder.isRecording) {
      try {
        await recorder.stop();
      } catch {
        // Nothing to clean up — already stopped.
      }
    }
  }, [recorder, clearMaxDurationTimer]);

  // Backgrounded mid-recording (phone call, home button, notification, etc.)
  // — stop and discard rather than let it keep recording out of sight, or
  // risk the native recorder being torn down by the OS while still "active"
  // from this hook's point of view.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState) => {
      if (nextState !== 'active' && recorder.isRecording) {
        void discard().then(() => onDiscardedInBackgroundRef.current?.());
      }
    });
    return () => sub.remove();
  }, [recorder, discard]);

  useEffect(() => clearMaxDurationTimer, [clearMaxDurationTimer]);

  return {
    isRecording: recorderState.isRecording,
    durationMillis: recorderState.durationMillis,
    start,
    stop,
  };
}
