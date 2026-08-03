import { useEffect, useState } from 'react';
import { useMutation, usePaginatedQuery, useQuery } from 'convex/react';
import { api } from '@backend/_generated/api';
import type { Doc } from '@backend/_generated/dataModel';
import { toDayKey } from '@sarvabhasha/shared';
import { useTutorSession } from './useTutorSession';
import { usePersonaAnimations } from './usePersonaAnimations';
import { parseTutorErrorTag } from '../utils/parseTutorError';

/**
 * Generous but bounded: `listMessages` paginates in ascending (oldest-first)
 * order — see the original comment this was lifted from in `TutorChat.tsx`
 * (still true, just now lives here since both the voice view and the text
 * fallback view need the same message list).
 */
const INITIAL_MESSAGE_PAGE_SIZE = 200;

/** See the original comment on this constant in `TutorChat.tsx`'s prior
 * revision — unchanged reasoning, just centralized here since both the voice
 * and text views need to give up waiting on the same schedule. */
const REPLY_TIMEOUT_MS = 20_000;

export type SendErrorTag = 'SAFETY_NET_EXCEEDED' | 'REPLY_TIMEOUT' | 'UNKNOWN';
export type GateTag = 'AGE_GATE_REQUIRED' | 'PARENTAL_CONSENT_REQUIRED';
export type SendTextResult =
  | { kind: 'template'; reply: string }
  | { kind: 'scheduled'; messageId: Doc<'tutorMessages'>['_id'] }
  | { kind: 'error'; tag: SendErrorTag | GateTag | 'CREDITS_EXHAUSTED' };

/**
 * Everything about the active tutor conversation that is NOT specific to how
 * the learner is currently interacting with it (voice vs. the "Type instead"
 * text fallback) — session bootstrap, the message list, credits/paywall,
 * age-gate routing, and the single `sendText` entry point both input modes
 * call into `tutor.sendMessage` through. Lifted out of what used to be
 * `TutorChat`'s own component body so the voice view and the text view share
 * ONE copy of this (gating/paywall/timeout handling that would otherwise
 * need to stay in sync by hand across two components).
 *
 * `sendText` is deliberately modality-agnostic: a typed message and an ASR
 * transcript both arrive here as a plain string and go through the exact
 * same `tutor.sendMessage` call, so credits/age-gate/safety-net all just
 * work unchanged regardless of how the text was produced.
 */
export function useTutorConversation(targetLanguage: string) {
  const { sessionId, personaKey, languageCode, isLoading: sessionLoading, error: sessionError } =
    useTutorSession(targetLanguage);
  const clips = usePersonaAnimations(personaKey);
  const creditsBalance = useQuery(api.tutor.getCreditsBalance);
  const sendMessage = useMutation(api.tutor.sendMessage);

  const {
    results: messages,
    status: pageStatus,
    loadMore,
  } = usePaginatedQuery(
    api.tutor.listMessages,
    sessionId ? { sessionId } : 'skip',
    { initialNumItems: INITIAL_MESSAGE_PAGE_SIZE },
  );

  const [sending, setSending] = useState(false);
  const [awaitingReplyForId, setAwaitingReplyForId] = useState<Doc<'tutorMessages'>['_id'] | null>(
    null,
  );
  const [sendErrorTag, setSendErrorTag] = useState<SendErrorTag | null>(null);
  const [gateTag, setGateTag] = useState<GateTag | null>(null);
  const [creditsExhaustedFromSend, setCreditsExhaustedFromSend] = useState(false);

  // Clear the "thinking" indicator once an assistant row appears after the
  // user message we're waiting on — deterministic given ascending order, no
  // polling loop needed (Convex's reactive queries re-render this on their
  // own once `generateReply` inserts the row, or immediately for a template
  // reply that inserted both rows synchronously inside `sendMessage`).
  useEffect(() => {
    if (!awaitingReplyForId) return;
    const idx = messages.findIndex((m) => m._id === awaitingReplyForId);
    if (idx === -1) return;
    const hasReplyAfter = messages.slice(idx + 1).some((m) => m.role === 'assistant');
    if (hasReplyAfter) setAwaitingReplyForId(null);
  }, [messages, awaitingReplyForId]);

  // Give up waiting after REPLY_TIMEOUT_MS. Cleared automatically the moment
  // the effect above resolves `awaitingReplyForId` back to `null` on a real
  // reply, since that change re-triggers this effect too.
  useEffect(() => {
    if (!awaitingReplyForId) return;
    const timeoutId = setTimeout(() => {
      setAwaitingReplyForId(null);
      setSendErrorTag('REPLY_TIMEOUT');
    }, REPLY_TIMEOUT_MS);
    return () => clearTimeout(timeoutId);
  }, [awaitingReplyForId]);

  const knownExhausted = creditsBalance?.granted === true && creditsBalance.balance <= 0;
  const showPaywall = creditsExhaustedFromSend || knownExhausted;

  const clearSendError = () => setSendErrorTag(null);

  /**
   * The one path both input modes call. Returns a result rather than
   * throwing — callers (the composer's `handleSend`, the voice turn state
   * machine) branch on `result.kind` instead of try/catching, since "credits
   * exhausted" and "age gate flipped mid-session" are expected outcomes here,
   * not exceptional ones.
   */
  const sendText = async (text: string): Promise<SendTextResult> => {
    const trimmed = text.trim();
    if (!trimmed || sending || awaitingReplyForId || showPaywall || !sessionId) {
      return { kind: 'error', tag: 'UNKNOWN' };
    }

    setSending(true);
    setSendErrorTag(null);
    try {
      const result = await sendMessage({ sessionId, text: trimmed, dayKey: toDayKey() });
      if (result.kind === 'scheduled') {
        setAwaitingReplyForId(result.messageId);
      }
      return result;
    } catch (err) {
      const tag = parseTutorErrorTag(err);
      if (tag === 'CREDITS_EXHAUSTED') {
        setCreditsExhaustedFromSend(true);
        return { kind: 'error', tag: 'CREDITS_EXHAUSTED' };
      }
      if (tag === 'AGE_GATE_REQUIRED' || tag === 'PARENTAL_CONSENT_REQUIRED') {
        setGateTag(tag);
        return { kind: 'error', tag };
      }
      const resolvedTag: SendErrorTag = tag === 'SAFETY_NET_EXCEEDED' ? 'SAFETY_NET_EXCEEDED' : 'UNKNOWN';
      setSendErrorTag(resolvedTag);
      return { kind: 'error', tag: resolvedTag };
    } finally {
      setSending(false);
    }
  };

  return {
    sessionId,
    personaKey,
    languageCode,
    clips,
    messages,
    pageStatus,
    loadMore,
    creditsBalance,
    showPaywall,
    gateTag,
    sessionError,
    sessionLoading,
    sending,
    awaitingReplyForId,
    sendErrorTag,
    clearSendError,
    sendText,
  };
}

export type TutorConversation = ReturnType<typeof useTutorConversation>;
