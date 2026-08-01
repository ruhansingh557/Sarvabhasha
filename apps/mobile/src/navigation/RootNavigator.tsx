import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, useColorScheme } from 'react-native';
import { NavigationContainer, DefaultTheme, DarkTheme, type Theme as NavigationTheme } from '@react-navigation/native';
import { useMutation } from 'convex/react';
import { api } from '@backend/_generated/api';
import { Box, useTheme } from '@theme';
import { authClient } from '@core/auth/authClient';
import { AuthScreen } from '@features/auth/screens/AuthScreen';
import { MainTabNavigator } from './MainTabNavigator';

/**
 * Root of the app, gated by auth state.
 *
 *   isPending -> themed loading spinner
 *   no session -> AuthScreen (no navigator needed, it has nowhere to go)
 *   session, users row not yet ensured -> themed loading spinner
 *   session -> NavigationContainer wrapping the tab shell
 *
 * `getOrCreateCurrentUser` fires exactly once per signed-in session, here,
 * before the tab shell (and therefore before Home/Learn/Profile's Convex
 * queries that assume a `users` row exists) ever renders. It's idempotent
 * server-side, but the client still guards against re-firing on every
 * re-render, and re-arms if the session changes (sign-out then a different
 * account signs in).
 */
export function RootNavigator() {
  const theme = useTheme();
  const colorScheme = useColorScheme();
  const { data: session, isPending } = authClient.useSession();
  const getOrCreateCurrentUser = useMutation(api.users.getOrCreateCurrentUser);
  const [userReady, setUserReady] = useState(false);
  const firedForRef = useRef<string | null>(null);

  useEffect(() => {
    const sessionKey = session?.user.email ?? null;

    if (!sessionKey) {
      firedForRef.current = null;
      setUserReady(false);
      return;
    }
    if (firedForRef.current === sessionKey) return;

    firedForRef.current = sessionKey;
    getOrCreateCurrentUser({})
      .catch(() => {
        // Swallow — Home/Learn/Profile tolerate a still-null `users` row and
        // this mutation is idempotent, so a transient failure here just
        // means the next launch tries again.
      })
      .finally(() => setUserReady(true));
  }, [session, getOrCreateCurrentUser]);

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

  if (!userReady) {
    return (
      <Box flex={1} backgroundColor="background" alignItems="center" justifyContent="center">
        <ActivityIndicator color={theme.colors.primary} />
      </Box>
    );
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
