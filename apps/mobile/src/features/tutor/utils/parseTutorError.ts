/**
 * `tutor.startSession`/`tutor.sendMessage` signal specific, expected failure
 * modes as tagged string prefixes on a thrown `Error` (see
 * packages/backend/convex/tutor.ts's `assertAdult` and `sendMessage`
 * comments) rather than a structured error type, so the client branches by
 * inspecting the message text. Convex re-throws the original message on the
 * client, so a substring check is robust to whatever wrapping/prefixing
 * Convex itself adds around it.
 */
export type TutorErrorTag =
  | 'AGE_GATE_REQUIRED'
  | 'PARENTAL_CONSENT_REQUIRED'
  | 'CREDITS_EXHAUSTED'
  | 'SAFETY_NET_EXCEEDED'
  | 'UNKNOWN';

const TAGS: readonly TutorErrorTag[] = [
  'AGE_GATE_REQUIRED',
  'PARENTAL_CONSENT_REQUIRED',
  'CREDITS_EXHAUSTED',
  'SAFETY_NET_EXCEEDED',
];

export function parseTutorErrorTag(error: unknown): TutorErrorTag {
  const message = error instanceof Error ? error.message : String(error);
  return TAGS.find((tag) => message.includes(tag)) ?? 'UNKNOWN';
}
