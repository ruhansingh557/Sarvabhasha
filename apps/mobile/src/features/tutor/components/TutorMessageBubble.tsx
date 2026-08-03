import { Box, Text } from '@theme';

interface TutorMessageBubbleProps {
  role: 'user' | 'assistant';
  text: string;
}

/**
 * A single chat turn. `text` is conversation content the learner typed or
 * Gemini/a template generated — Convex data flowing through as a prop, never
 * i18n (CLAUDE.md rule 8's lesson-content exception applies here too: this
 * is free-form conversation, not chrome). `variant="body"`'s generous
 * line-height (theme.ts) is already tuned against Devanagari/Bengali
 * diacritics, so no extra script-specific handling is needed here.
 *
 * User turns lean right in `primary`/`textInverse` (never rely on color
 * alone — side + fill both differ from the assistant's `surface` bubble on
 * the left), capped at 80% width so a short message doesn't stretch
 * full-bleed on tablet/wide.
 */
export function TutorMessageBubble({ role, text }: TutorMessageBubbleProps) {
  const isUser = role === 'user';

  return (
    <Box
      alignSelf={isUser ? 'flex-end' : 'flex-start'}
      maxWidth="80%"
      backgroundColor={isUser ? 'primary' : 'surface'}
      borderRadius="l"
      paddingVertical="s"
      paddingHorizontal="m"
      marginBottom="s"
    >
      <Text variant="body" color={isUser ? 'textInverse' : 'textPrimary'}>
        {text}
      </Text>
    </Box>
  );
}
