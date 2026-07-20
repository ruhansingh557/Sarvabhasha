import { useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from '@shopify/restyle';
import { ConvexReactClient, ConvexProvider } from 'convex/react';
import { ConvexBetterAuthProvider, type AuthClient } from '@convex-dev/better-auth/react';
import { lightTheme, darkTheme } from '@theme';
import { authClient } from '@core/auth/authClient';
import { RootNavigator } from '@navigation/RootNavigator';
import '@core/i18n';

const convex = new ConvexReactClient(process.env.EXPO_PUBLIC_CONVEX_URL as string, {
  expectAuth: true,
  unsavedChangesWarning: false,
});

export default function App() {
  const colorScheme = useColorScheme();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider theme={colorScheme === 'dark' ? darkTheme : lightTheme}>
          <ConvexProvider client={convex}>
            {/* Upstream generic-inference rough edge: createAuthClient's concrete
                plugin union doesn't structurally match AuthClient's constraint. */}
            <ConvexBetterAuthProvider client={convex} authClient={authClient as unknown as AuthClient}>
              <RootNavigator />
            </ConvexBetterAuthProvider>
          </ConvexProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
