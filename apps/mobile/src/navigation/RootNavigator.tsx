import { ActivityIndicator, useColorScheme } from 'react-native';
import { NavigationContainer, DefaultTheme, DarkTheme, type Theme as NavigationTheme } from '@react-navigation/native';
import { Box, useTheme } from '@theme';
import { authClient } from '@core/auth/authClient';
import { AuthScreen } from '@features/auth/screens/AuthScreen';
import { MainTabNavigator } from './MainTabNavigator';

/**
 * Root of the app, gated by auth state.
 *
 *   isPending -> themed loading spinner
 *   no session -> AuthScreen (no navigator needed, it has nowhere to go)
 *   session -> NavigationContainer wrapping the tab shell
 */
export function RootNavigator() {
  const theme = useTheme();
  const colorScheme = useColorScheme();
  const { data: session, isPending } = authClient.useSession();

  if (isPending) {
    return (
      <Box flex={1} backgroundColor="background" alignItems="center" justifyContent="center">
        <ActivityIndicator color={theme.colors.primary} />
      </Box>
    );
  }

  if (!session) {
    return <AuthScreen />;
  }

  const isDark = colorScheme === 'dark';
  const baseNavigationTheme = isDark ? DarkTheme : DefaultTheme;
  const navigationTheme: NavigationTheme = {
    ...baseNavigationTheme,
    colors: {
      ...baseNavigationTheme.colors,
      primary: theme.colors.primary,
      background: theme.colors.background,
      card: theme.colors.surface,
      text: theme.colors.textPrimary,
      border: theme.colors.border,
      notification: theme.colors.accent,
    },
  };

  return (
    <NavigationContainer theme={navigationTheme}>
      <MainTabNavigator />
    </NavigationContainer>
  );
}
