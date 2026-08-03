import { Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { Box, Text, useTheme, MAX_CONTENT_WIDTH } from '@theme';
import type { TutorConversation } from '../hooks/useTutorConversation';
import type { PersonaKey } from '../hooks/useTutorSession';
import { useVoiceTurn } from '../hooks/useVoiceTurn';
import { TutorAvatarPlayer, type AvatarExpression } from './TutorAvatarPlayer';
import { CreditsExhaustedNotice } from './CreditsExhaustedNotice';

const PERSONA_NAME_KEYS: Record<PersonaKey, string> = {
  dadi: 'Tutor.PERSONA_DADI',
  parent: 'Tutor.PERSONA_PARENT',
  kid: 'Tutor.PERSONA_KID',
  neighbour: 'Tutor.PERSONA_NEIGHBOUR',
};
const PERSONA_INITIALS: Record<PersonaKey, string> = {
  dadi: 'D',
  parent: 'P',
  kid: 'K',
  neighbour: 'N',
};

const MIC_BUTTON_SIZE = 88;

interface VoiceTutorProps {
  conversation: TutorConversation;
  onSwitchToChat: () => void;
}

/**
 * The voice-primary tutor surface: a large centred avatar, a caption for
 * whatever's happening right now, the last exchange's text underneath (so a
 * learner can still SEE the target-script spelling — voice-primary doesn't
 * mean text-invisible), and one big push-to-talk mic button. "Type instead"
 * stays reachable at all times as a small top-corner link, never removed —
 * see specs/ai-tutor.md's ASR-charity note and root CLAUDE.md's own call-out
 * that Bhashini is "free, but slow and flaky": a voice-only tutor with zero
 * recourse when a transcription comes back garbled would be worse than the
 * text-only chat this replaces as the default.
 *
 * Explicit `useSafeAreaInsets` top padding here (rather than relying on
 * anything upstream) fixes a real, pre-existing bug: the previous
 * chat-header layout had no top-inset handling at all and rendered its
 * persona row cramped directly under/behind the status bar — reproducible
 * on every screen in this app today, not unique to Tutor, but this is the
 * one this pass is responsible for fixing.
 */
export function VoiceTutor({ conversation, onSwitchToChat }: VoiceTutorProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const voiceTurn = useVoiceTurn(conversation);

  const personaDisplayName = t(PERSONA_NAME_KEYS[conversation.personaKey]);

  const lastAssistantMessage = [...conversation.messages].reverse().find((m) => m.role === 'assistant');
  const speakingMessage =
    voiceTurn.speakingMessageId != null
      ? conversation.messages.find((m) => m._id === voiceTurn.speakingMessageId)
      : undefined;

  const avatarExpression: AvatarExpression =
    voiceTurn.phase === 'transcribing' || voiceTurn.phase === 'sending'
      ? 'thinking'
      : voiceTurn.phase === 'speaking'
        ? ((speakingMessage?.expression as AvatarExpression | undefined) ?? 'neutral')
        : 'neutral';

  const statusLabel = (() => {
    if (voiceTurn.issue) return null; // the issue banner replaces the status caption
    switch (voiceTurn.phase) {
      case 'recording':
        return t('Tutor.VOICE_LISTENING');
      case 'transcribing':
        return t('Tutor.VOICE_TRANSCRIBING');
      case 'sending':
        return t('Tutor.THINKING_LABEL', { persona: personaDisplayName });
      case 'speaking':
        return t('Tutor.VOICE_SPEAKING', { persona: personaDisplayName });
      default:
        return t('Tutor.VOICE_TAP_TO_TALK', { persona: personaDisplayName });
    }
  })();

  const issueMessage = (() => {
    if (!voiceTurn.issue) return null;
    switch (voiceTurn.issue.kind) {
      case 'permission_denied':
        return t('Tutor.VOICE_MIC_PERMISSION_DENIED');
      case 'no_speech':
        return t('Tutor.VOICE_NO_SPEECH');
      case 'asr_failed':
        return t('Tutor.VOICE_ASR_ERROR');
      case 'tts_failed':
        return t('Tutor.VOICE_TTS_ERROR', { persona: personaDisplayName });
      case 'send_error':
        if (voiceTurn.issue.sendTag === 'SAFETY_NET_EXCEEDED') return t('Tutor.SEND_ERROR_SAFETY_NET');
        if (voiceTurn.issue.sendTag === 'REPLY_TIMEOUT') return t('Tutor.SEND_ERROR_REPLY_TIMEOUT');
        return t('Tutor.SEND_ERROR_GENERIC');
      default:
        return null;
    }
  })();

  const micDisabled =
    voiceTurn.phase === 'transcribing' ||
    voiceTurn.phase === 'sending' ||
    voiceTurn.phase === 'speaking' ||
    voiceTurn.issue?.kind === 'permission_denied';
  const isRecording = voiceTurn.phase === 'recording';

  return (
    <Box flex={1} backgroundColor="background" alignItems="center">
      <Box
        flex={1}
        width="100%"
        maxWidth={MAX_CONTENT_WIDTH}
        paddingHorizontal={{ phone: 'm', tablet: 'l' }}
        style={{ paddingTop: insets.top + theme.spacing.s }}
      >
        {/* Top row: persona name + credits, "Type instead" always reachable */}
        <Box flexDirection="row" alignItems="center" justifyContent="space-between" marginBottom="m">
          <Box>
            <Text variant="h3">{personaDisplayName}</Text>
            {conversation.creditsBalance ? (
              <Text variant="caption" color="textMuted">
                {t('Tutor.CREDITS_REMAINING', { count: conversation.creditsBalance.balance })}
              </Text>
            ) : null}
          </Box>
          <Pressable onPress={onSwitchToChat} accessibilityRole="button" hitSlop={8}>
            <Text variant="link">{t('Tutor.TYPE_INSTEAD_LINK')}</Text>
          </Pressable>
        </Box>

        {/* Centred focal area: avatar, status, last exchange */}
        <Box flex={1} alignItems="center" justifyContent="center" gap="m">
          <TutorAvatarPlayer
            clips={conversation.clips}
            initial={PERSONA_INITIALS[conversation.personaKey]}
            personaDisplayName={personaDisplayName}
            expression={avatarExpression}
            size="hero"
          />

          {statusLabel ? (
            <Text variant="body" color="textSecondary" textAlign="center">
              {statusLabel}
            </Text>
          ) : null}

          {issueMessage ? (
            <Box alignItems="center" gap="s">
              <Text variant="body" color="error" textAlign="center">
                {issueMessage}
              </Text>
              {voiceTurn.issue?.kind !== 'permission_denied' ? (
                <Pressable
                  onPress={voiceTurn.dismissIssue}
                  accessibilityRole="button"
                  hitSlop={8}
                >
                  <Text variant="link">{t('Tutor.VOICE_RETRY_BUTTON')}</Text>
                </Pressable>
              ) : null}
            </Box>
          ) : null}

          <Box width="100%" paddingHorizontal="m" gap="xs">
            {voiceTurn.lastTranscript ? (
              <Text variant="bodySmall" color="textMuted" textAlign="center">
                {t('Tutor.VOICE_YOU_SAID_LABEL')}: "{voiceTurn.lastTranscript}"
              </Text>
            ) : null}
            {lastAssistantMessage ? (
              <Pressable
                onPress={() => void voiceTurn.replayLastReply()}
                accessibilityRole="button"
                accessibilityLabel={t('Tutor.VOICE_REPLAY_LABEL')}
              >
                <Text variant="body" textAlign="center">
                  {lastAssistantMessage.text}
                </Text>
              </Pressable>
            ) : !voiceTurn.lastTranscript ? (
              <Text variant="body" color="textMuted" textAlign="center">
                {t('Tutor.EMPTY_CHAT_HINT')}
              </Text>
            ) : null}
          </Box>
        </Box>

        {/* Push-to-talk mic, or the paywall once trial credits are spent —
            same non-punitive stub as the text fallback, just reached from
            here too since running out of credits is a hard stop regardless
            of which input mode the learner was using. */}
        <Box alignItems="center" paddingBottom="l" paddingTop="m" width="100%">
          {conversation.showPaywall ? (
            <CreditsExhaustedNotice />
          ) : voiceTurn.issue?.kind === 'permission_denied' ? null : (
            <Pressable
              onPress={voiceTurn.handleMicPress}
              disabled={micDisabled}
              accessibilityRole="button"
              accessibilityLabel={
                isRecording ? t('Tutor.VOICE_STOP_LABEL') : t('Tutor.VOICE_MIC_LABEL', { persona: personaDisplayName })
              }
              accessibilityState={{ disabled: micDisabled, busy: voiceTurn.phase !== 'idle' && !isRecording }}
            >
              <Box
                width={MIC_BUTTON_SIZE}
                height={MIC_BUTTON_SIZE}
                borderRadius="round"
                alignItems="center"
                justifyContent="center"
                backgroundColor={isRecording ? 'error' : 'primary'}
                opacity={micDisabled ? 0.5 : 1}
              >
                <Ionicons
                  name={isRecording ? 'stop-circle' : 'mic'}
                  size={40}
                  color={theme.colors.textInverse}
                />
              </Box>
            </Pressable>
          )}
        </Box>
      </Box>
    </Box>
  );
}
