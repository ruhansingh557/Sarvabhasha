import { useCallback, useEffect, useState } from 'react';
import * as FileSystem from 'expo-file-system/legacy';
import { useAction } from 'convex/react';
import { api } from '@backend/_generated/api';
import type { TutorConversation, SendErrorTag, GateTag } from './useTutorConversation';
import { useAudioRecording, type RecordingResult } from './useAudioRecording';
import { useTutorReplyAudio } from './useTutorReplyAudio';

export type VoicePhase = 'idle' | 'recording' | 'transcribing' | 'sending' | 'speaking';

export type VoiceIssue =
  | { kind: 'permission_denied' }
  | { kind: 'no_speech' }
  | { kind: 'asr_failed'; detail?: string }
  | { kind: 'send_error'; sendTag: SendErrorTag | GateTag | 'CREDITS_EXHAUSTED' }
  | { kind: 'tts_failed' };

/**
 * The push-to-talk state machine: `idle -> recording -> transcribing ->
 * sending -> speaking -> idle`. Composes `useAudioRecording` (mic mechanics),
 * `useTutorReplyAudio` (TTS-out), and `conversation.sendText` (the same
 * `tutor.sendMessage` call the text composer uses) rather than duplicating
 * any of the three.
 *
 * Deliberately built as state + effects, not one long imperative async
 * function bridging reactive Convex state through ad-hoc promises: the step
 * from "sent" to "reply arrived" depends on `conversation.messages`, which
 * updates on Convex's own schedule (immediately for a template reply,
 * whenever `generateReply` finishes for a Gemini one) — a persisted
 * `awaitingSinceId` piece of STATE plus an effect watching
 * `conversation.messages` picks that up correctly no matter how long it
 * takes or how many renders happen in between, without any "did I register
 * my listener before the update already fired" race to get right.
 */
export function useVoiceTurn(conversation: TutorConversation) {
  const transcribeSpeech = useAction(api.bhashini.asr.transcribeSpeech);
  const replyAudio = useTutorReplyAudio();

  const [phase, setPhase] = useState<VoicePhase>('idle');
  const [issue, setIssue] = useState<VoiceIssue | null>(null);
  const [lastTranscript, setLastTranscript] = useState<string | null>(null);
  // `undefined` = not currently waiting on a reply. `null` covers "waiting,
  // and there was no prior message at all" (brand-new conversation) — a real
  // possible value, so it can't double as the sentinel.
  const [awaitingSinceId, setAwaitingSinceId] = useState<string | null | undefined>(undefined);

  const processRecording = useCallback(
    async (result: RecordingResult | null) => {
      if (!result || result.tooShort) {
        setPhase('idle');
        setIssue({ kind: 'no_speech' });
        return;
      }

      const languageCode = conversation.languageCode;
      if (!languageCode) {
        // Shouldn't happen in practice — the voice screen only mounts once
        // the session (and its languageCode) has loaded — but a recording
        // that outlives the session somehow shouldn't crash on a missing arg.
        setPhase('idle');
        setIssue({ kind: 'asr_failed' });
        return;
      }

      setPhase('transcribing');
      setIssue(null);
      try {
        const audioBase64 = await FileSystem.readAsStringAsync(result.uri, { encoding: 'base64' });
        const asrResult = await transcribeSpeech({ audioBase64, languageCode });
        if (!asrResult.ok) {
          setPhase('idle');
          setIssue(
            asrResult.reason === 'empty_or_too_short'
              ? { kind: 'no_speech' }
              : { kind: 'asr_failed', detail: asrResult.reason },
          );
          return;
        }

        setLastTranscript(asrResult.transcript);

        // Snapshot BEFORE sending — sending itself is what makes a new
        // assistant row appear, so "new" is only meaningful relative to
        // whatever was last before this call.
        const beforeSendLastId = conversation.messages[conversation.messages.length - 1]?._id ?? null;
        setPhase('sending');
        const sendResult = await conversation.sendText(asrResult.transcript);
        if (sendResult.kind === 'error') {
          setPhase('idle');
          setIssue({ kind: 'send_error', sendTag: sendResult.tag });
          return;
        }
        setAwaitingSinceId(beforeSendLastId);
      } catch (err) {
        setPhase('idle');
        setIssue({ kind: 'asr_failed', detail: err instanceof Error ? err.message : String(err) });
      }
    },
    [conversation, transcribeSpeech],
  );

  const recording = useAudioRecording({
    onAutoStopped: processRecording,
    // The app was backgrounded mid-recording and the clip was discarded —
    // snap straight back to idle rather than leaving the UI showing
    // "Listening…" over a recording that no longer exists until the learner
    // happens to tap the (now-defunct) stop button.
    onDiscardedInBackground: () => setPhase('idle'),
  });

  // `sending -> speaking`, driven by the shared conversation's own reactive
  // `messages`/`sendErrorTag` rather than anything this hook polls itself.
  useEffect(() => {
    if (awaitingSinceId === undefined) return;

    const last = conversation.messages[conversation.messages.length - 1];
    if (last && last.role === 'assistant' && last._id !== awaitingSinceId) {
      setAwaitingSinceId(undefined);
      setPhase('speaking');
      void replyAudio
        .speak({
          messageId: last._id,
          text: last.text,
          languageCode: conversation.languageCode!,
          characterSlug: conversation.personaKey,
        })
        .then((outcome) => {
          setPhase('idle');
          if (outcome === 'failed') setIssue({ kind: 'tts_failed' });
        });
      return;
    }

    if (conversation.sendErrorTag === 'REPLY_TIMEOUT') {
      setAwaitingSinceId(undefined);
      setPhase('idle');
      setIssue({ kind: 'send_error', sendTag: 'REPLY_TIMEOUT' });
      conversation.clearSendError();
    }
    // conversation is a fresh object every render (it's a hook return value),
    // so depending on its stable pieces individually avoids re-running this
    // effect on every unrelated re-render of the parent.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    awaitingSinceId,
    conversation.messages,
    conversation.sendErrorTag,
    conversation.personaKey,
    conversation.languageCode,
    replyAudio,
  ]);

  const handleMicPress = useCallback(() => {
    if (phase === 'idle') {
      setIssue(null);
      void recording.start().then((result) => {
        if (result === 'permission_denied') {
          setIssue({ kind: 'permission_denied' });
          return;
        }
        if (result === 'started') {
          setPhase('recording');
        }
        // 'busy' / 'error': transient — leave phase as-is rather than
        // surfacing a confusing message for what's usually a stray
        // double-tap the debounce already absorbed.
      });
      return;
    }
    if (phase === 'recording') {
      void recording.stop().then(processRecording);
      return;
    }
    // transcribing / sending / speaking: one turn at a time, ignore the tap.
  }, [phase, recording, processRecording]);

  const dismissIssue = useCallback(() => setIssue(null), []);

  return {
    phase,
    issue,
    lastTranscript,
    recordingDurationMillis: recording.durationMillis,
    handleMicPress,
    dismissIssue,
    replayLastReply: replyAudio.replay,
    speakingMessageId: replyAudio.speakingMessageId,
  };
}
