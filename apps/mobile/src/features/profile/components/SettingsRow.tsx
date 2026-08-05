import { Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Box, Text, useTheme } from '@theme';

type IoniconName = keyof typeof Ionicons.glyphMap;

interface SettingsRowProps {
  icon: IoniconName;
  label: string;
  value?: string;
  onPress?: () => void;
  /**
   * `danger` is for a terminal action (Sign Out), not a "change this" field
   * — it drops the value/chevron (there is nothing to preview or navigate
   * into) and recolors icon + label TOGETHER, never relying on color alone
   * (CLAUDE.md/Refactoring-UI).
   */
  tone?: 'default' | 'danger';
  accessibilityLabel?: string;
}

/**
 * One compact settings line: icon, label, optional value, optional chevron.
 * Replaces Profile's old "full card + permanently-visible CTA button per
 * field" layout (project-owner feedback) with a single tappable row that
 * reads as ONE line — grouped with siblings via `SettingsGroup` below.
 * Feature-local for now (Profile is the only settings-shaped screen in the
 * app); promote to `shared/` if another feature needs the same shape
 * (CLAUDE.md rule 6, same reasoning as `FoundationCard`).
 */
export function SettingsRow({ icon, label, value, onPress, tone = 'default', accessibilityLabel }: SettingsRowProps) {
  const theme = useTheme();
  const isDanger = tone === 'danger';
  const iconColor = isDanger ? theme.colors.error : theme.colors.textSecondary;

  const content = (
    <Box flexDirection="row" alignItems="center" minHeight={44} paddingVertical="s" gap="m">
      <Ionicons name={icon} size={20} color={iconColor} />
      <Box flex={1}>
        <Text variant="body" color={isDanger ? 'error' : 'textPrimary'}>
          {label}
        </Text>
      </Box>
      {!isDanger && value ? (
        <Text variant="body" color="textSecondary" numberOfLines={1}>
          {value}
        </Text>
      ) : null}
      {!isDanger && onPress ? (
        <Ionicons name="chevron-forward" size={18} color={theme.colors.textMuted} />
      ) : null}
    </Box>
  );

  if (!onPress) return content;

  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={accessibilityLabel ?? label}>
      {content}
    </Pressable>
  );
}
