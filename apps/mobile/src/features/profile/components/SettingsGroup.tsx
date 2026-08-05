import { Children, Fragment, type ReactNode } from 'react';
import { StyleSheet } from 'react-native';
import { Box, useTheme } from '@theme';

interface SettingsGroupProps {
  children: ReactNode;
}

/**
 * Wraps `SettingsRow` children in one rounded, shadowed `surface` card with
 * hairline dividers between rows (indented past the icon, matching the
 * standard grouped-table look) — one coherent group per section instead of
 * Profile's old "one full card per field" layout. Shadow read against
 * `theme.colors.shadow`, verified in both themes (see `theme.ts`'s own
 * comment on that token).
 */
export function SettingsGroup({ children }: SettingsGroupProps) {
  const theme = useTheme();
  const rows = Children.toArray(children);

  return (
    <Box
      backgroundColor="surface"
      borderRadius="l"
      paddingHorizontal="m"
      style={{
        shadowColor: theme.colors.shadow,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 1,
        shadowRadius: 10,
        elevation: 2,
      }}
    >
      {rows.map((row, index) => (
        <Fragment key={index}>
          {row}
          {index < rows.length - 1 ? (
            <Box height={StyleSheet.hairlineWidth} backgroundColor="border" marginLeft="xl" />
          ) : null}
        </Fragment>
      ))}
    </Box>
  );
}
