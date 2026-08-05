import { Box, Text, useTheme } from '@theme';

interface ProfileHeaderProps {
  name?: string;
  email?: string;
}

/** First letter of the first two words of `name`, or the first two chars of
 * `email` if there's no name yet — never blank, so the avatar always reads
 * as a badge rather than an empty circle. */
function initialsOf(name?: string, email?: string): string {
  const trimmedName = name?.trim();
  if (trimmedName) {
    const parts = trimmedName.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return (parts[0]!.charAt(0) + parts[1]!.charAt(0)).toUpperCase();
    return parts[0]!.slice(0, 2).toUpperCase();
  }
  const trimmedEmail = email?.trim();
  return trimmedEmail ? trimmedEmail.slice(0, 2).toUpperCase() : '?';
}

/**
 * The identity block at the top of Profile: an initials avatar, the
 * learner's name (or email, if no name is set yet), and the email as a
 * secondary line. Reads as the "who am I" anchor before the grouped
 * settings rows below it — the header/avatar pattern most profile/settings
 * screens use (project-owner ask: "sleek and cool", researched against real
 * reference apps rather than inventing something bespoke).
 */
export function ProfileHeader({ name, email }: ProfileHeaderProps) {
  const theme = useTheme();
  const trimmedName = name?.trim();

  return (
    <Box alignItems="center" marginBottom="xl">
      <Box
        width={80}
        height={80}
        borderRadius="round"
        backgroundColor="primary"
        alignItems="center"
        justifyContent="center"
        marginBottom="m"
        style={{
          shadowColor: theme.colors.shadow,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 1,
          shadowRadius: 12,
          elevation: 4,
        }}
      >
        <Text variant="h1" color="textInverse">
          {initialsOf(name, email)}
        </Text>
      </Box>
      <Text variant="h2" textAlign="center">
        {trimmedName || email || ''}
      </Text>
      {trimmedName && email ? (
        <Text variant="body" color="textSecondary" marginTop="xs">
          {email}
        </Text>
      ) : null}
    </Box>
  );
}
