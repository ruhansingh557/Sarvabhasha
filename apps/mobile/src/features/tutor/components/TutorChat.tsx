import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { Box, Text, useTheme, MAX_CONTENT_WIDTH } from '@theme';
import { Button } from '@shared/components/atoms/Button';
import type { TutorConversation } from '../hooks/useTutorConversation';
import type { PersonaKey } from '../hooks/useTutorSession';
import { TutorAvatarPlayer } from './TutorAvatarPlayer';
import { TutorMessageBubble } from './TutorMessageBubble';
import { CreditsExhaustedNotice } from './CreditsExhaustedNotice';

/** UI chrome labels for a fixed, backend-defined enum (PersonaKey) — same
 * class of i18n key as `Category.GREETINGS` etc., not lesson content. */
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

interface TutorChatProps {
  conversation: TutorConversation;
  /** Whether the voice-primary view is even reachable for this session's
   * language — if not, there's no "switch to voice" affordance to show, and
   * a short note explains why the learner landed straight here instead. */
  voiceSupported: boolean;
  onSwitchToVoice: () => void;
}

/**
 * The "Type instead" fallback: the original text-only chat surface (list,
 * bubbles, composer) this app shipped before the voice-primary redesign —
 * preserved as-is rather than deleted, per the redesign brief, since Bhashini
 * ASR/TTS being "free, but slow and flaky" (root CLAUDE.md) means voice needs
 * a real, fully-working way out, not a token gesture. Session bootstrap,
 * messages, credits, and gating now live in `useTutorConversation` (shared
 * with `VoiceTutor`) rather than here — this component owns only the
 * composer's local `draft` text state, which is chat-view-specific.
 */
export function TutorChat({ conversation, voiceSupported, onSwitchToVoice }: TutorChatProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const {
    personaKey,
    clips,
    messages,
    pageStatus,
    loadMore,
    creditsBalance,
    showPaywall,
    sending,
    awaitingReplyForId,
    sendErrorTag,
    sendText,
  } = conversation;

  const [draft, setDraft] = useState('');
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    if (messages.length > 0) {
      listRef.current?.scrollToEnd({ animated: true });
    }
  }, [messages.length, awaitingReplyForId]);

  const personaDisplayName = t(PERSONA_NAME_KEYS[personaKey]);
  const canSend = draft.trim().length > 0 && !sending && !awaitingReplyForId && !showPaywall;

  const handleSend = async () => {
    if (!canSend) return;
    const text = draft;
    setDraft('');
    const result = await sendText(text);
    if (result.kind === 'error') {
      // Put the draft back so the learner doesn't lose what they typed on a
      // transient failure (safety-net / generic / timeout) — credits-exhausted
      // and age-gate cases render their own full-screen replacement instead,
      // so losing the draft there doesn't matter.
      setDraft(text);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Box flex={1} backgroundColor="background" alignItems="center">
        <Box
          flex={1}
          width="100%"
          maxWidth={MAX_CONTENT_WIDTH}
          paddingHorizontal={{ phone: 'm', tablet: 'l' }}
          paddingBottom={{ phone: 'm', tablet: 'l' }}
          style={{ paddingTop: insets.top + theme.spacing.s }}
        >
          {/* Persona header */}
          <Box flexDirection="row" alignItems="center" gap="m" marginBottom="m">
            <TutorAvatarPlayer
              clips={clips}
              initial={PERSONA_INITIALS[personaKey]}
              personaDisplayName={personaDisplayName}
            />
            <Box flex={1}>
              <Text variant="h2">{personaDisplayName}</Text>
              {creditsBalance ? (
                <Text variant="caption" color="textMuted">
                  {t('Tutor.CREDITS_REMAINING', { count: creditsBalance.balance })}
                </Text>
              ) : null}
            </Box>
            {voiceSupported ? (
              <Pressable onPress={onSwitchToVoice} accessibilityRole="button" hitSlop={8}>
                <Text variant="link">{t('Tutor.SWITCH_TO_VOICE_LINK')}</Text>
              </Pressable>
            ) : null}
          </Box>

          {!voiceSupported ? (
            <Text variant="caption" color="textMuted" marginBottom="s">
              {t('Tutor.VOICE_UNAVAILABLE_LANGUAGE')}
            </Text>
          ) : null}

          {/* Message list */}
          <Box flex={1}>
            <FlatList
              ref={listRef}
              data={messages}
              keyExtractor={(item) => item._id}
              renderItem={({ item }) => <TutorMessageBubble role={item.role} text={item.text} />}
              contentContainerStyle={{ flexGrow: 1, paddingBottom: theme.spacing.s }}
              ListHeaderComponent={
                pageStatus === 'CanLoadMore' ? (
                  <Pressable
                    onPress={() => loadMore(200)}
                    accessibilityRole="button"
                  >
                    <Text variant="link" textAlign="center" marginBottom="s">
                      {t('Tutor.LOAD_OLDER_BUTTON')}
                    </Text>
                  </Pressable>
                ) : null
              }
              ListEmptyComponent={
                pageStatus === 'LoadingFirstPage' ? (
                  <Box flex={1} alignItems="center" justifyContent="center">
                    <ActivityIndicator color={theme.colors.primary} />
                  </Box>
                ) : (
                  <Box flex={1} alignItems="center" justifyContent="center" padding="l">
                    <Text variant="body" color="textMuted" textAlign="center">
                      {t('Tutor.EMPTY_CHAT_HINT')}
                    </Text>
                  </Box>
                )
              }
              ListFooterComponent={
                awaitingReplyForId ? (
                  <Box alignSelf="flex-start" backgroundColor="surface" borderRadius="l" padding="m">
                    <Text variant="bodySmall" color="textMuted">
                      {t('Tutor.THINKING_LABEL', { persona: personaDisplayName })}
                    </Text>
                  </Box>
                ) : null
              }
            />
          </Box>

          {/* Composer / paywall */}
          {showPaywall ? (
            <CreditsExhaustedNotice />
          ) : (
            <Box>
              {sendErrorTag ? (
                <Text variant="caption" color="error" marginBottom="xs">
                  {sendErrorTag === 'SAFETY_NET_EXCEEDED'
                    ? t('Tutor.SEND_ERROR_SAFETY_NET')
                    : sendErrorTag === 'REPLY_TIMEOUT'
                      ? t('Tutor.SEND_ERROR_REPLY_TIMEOUT')
                      : t('Tutor.SEND_ERROR_GENERIC')}
                </Text>
              ) : null}
              <Box flexDirection="row" alignItems="center" gap="s">
                {/* Deliberately inert placeholder — this view is reached only
                    when voice isn't supported for this language, or the
                    learner explicitly chose "Type instead", so a mic button
                    here would either always fail or duplicate the voice
                    screen's own mic. No Pressable, no onPress: must never
                    look tappable. */}
                <Box
                  width={44}
                  height={44}
                  borderRadius="round"
                  borderWidth={1}
                  borderColor="border"
                  alignItems="center"
                  justifyContent="center"
                  opacity={0.4}
                >
                  <Ionicons name="mic-outline" size={20} color={theme.colors.textMuted} />
                </Box>
                <TextInput
                  style={{
                    flex: 1,
                    borderWidth: 1,
                    borderColor: theme.colors.border,
                    borderRadius: theme.borderRadii.m,
                    paddingHorizontal: theme.spacing.m,
                    paddingVertical: theme.spacing.s,
                    color: theme.colors.textPrimary,
                    fontSize: 16,
                    minHeight: 44,
                  }}
                  value={draft}
                  onChangeText={setDraft}
                  placeholder={t('Tutor.MESSAGE_PLACEHOLDER')}
                  placeholderTextColor={theme.colors.textMuted}
                  multiline
                  editable={!awaitingReplyForId}
                />
                <Button
                  onPress={handleSend}
                  disabled={!canSend}
                  loading={sending}
                  accessibilityLabel={t('Tutor.SEND_BUTTON_LABEL')}
                >
                  <Ionicons
                    name="send"
                    size={20}
                    color={canSend ? theme.colors.textInverse : theme.colors.textMuted}
                  />
                </Button>
              </Box>
            </Box>
          )}
        </Box>
      </Box>
    </KeyboardAvoidingView>
  );
}
