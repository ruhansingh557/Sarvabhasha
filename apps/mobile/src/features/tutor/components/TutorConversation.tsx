import { useState } from 'react';
import { ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Box, Text, useTheme } from '@theme';
import { useTutorConversation } from '../hooks/useTutorConversation';
import { supportsVoiceTutor } from '../utils/voiceSupport';
import { BirthYearGate } from './BirthYearGate';
import { ParentalConsentNotice } from './ParentalConsentNotice';
import { VoiceTutor } from './VoiceTutor';
import { TutorChat } from './TutorChat';

type Mode = 'voice' | 'chat';

/**
 * Orchestrates the tutor's two ways of having the same conversation: the
 * voice-primary `VoiceTutor` and the "Type instead" `TutorChat` fallback.
 * Both are views over ONE `useTutorConversation` — session, messages,
 * credits/paywall, and age-gate routing live there exactly once, so the two
 * views can never disagree about e.g. whether credits are exhausted.
 *
 * `effectiveMode` (not `mode` directly) is what actually gets rendered:
 * `mode` defaults optimistically to `'voice'` and can be toggled either way
 * by the learner, but a session whose language has no Bhashini ASR or TTS
 * coverage (`supportsVoiceTutor`) is forced to `'chat'` regardless of `mode`
 * — computing this at render time rather than in a `useEffect` avoids a
 * one-frame flash of a mic button that doesn't work: `languageCode` isn't
 * known on the very first render (the session is still loading), and an
 * effect reacting to it arriving would only correct course a render late.
 */
export function TutorConversation({ targetLanguage }: { targetLanguage: string }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const conversation = useTutorConversation(targetLanguage);
  const [mode, setMode] = useState<Mode>('voice');

  if (conversation.gateTag === 'AGE_GATE_REQUIRED') {
    return <BirthYearGate />;
  }
  if (conversation.gateTag === 'PARENTAL_CONSENT_REQUIRED') {
    return <ParentalConsentNotice />;
  }

  if (conversation.sessionError) {
    return (
      <Box flex={1} backgroundColor="background" alignItems="center" justifyContent="center" padding="l">
        <Text variant="body" color="error" textAlign="center">
          {t('Tutor.SESSION_START_ERROR')}
        </Text>
      </Box>
    );
  }

  if (conversation.sessionLoading || !conversation.sessionId) {
    return (
      <Box flex={1} backgroundColor="background" alignItems="center" justifyContent="center">
        <ActivityIndicator color={theme.colors.primary} />
      </Box>
    );
  }

  const voiceSupported = supportsVoiceTutor(conversation.languageCode);
  const effectiveMode: Mode = voiceSupported ? mode : 'chat';

  if (effectiveMode === 'voice') {
    return <VoiceTutor conversation={conversation} onSwitchToChat={() => setMode('chat')} />;
  }

  return (
    <TutorChat
      conversation={conversation}
      voiceSupported={voiceSupported}
      onSwitchToVoice={() => setMode('voice')}
    />
  );
}
