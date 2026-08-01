import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@theme';
import { HomeStack } from './stacks/HomeStack';
import { LearnStack } from './stacks/LearnStack';
import { TutorStack } from './stacks/TutorStack';
import { ProfileStack } from './stacks/ProfileStack';
import type { MainTabParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();

/**
 * Bottom tabs: Home · Learn · Tutor · Profile. Each tab owns its own
 * native stack (CLAUDE.md: "bottom tabs + per-tab native stacks") even
 * though every stack is a single placeholder screen today.
 *
 * Icons: Ionicons, outline↔filled swap on focus. Ionicons' rounded, slightly
 * bold glyphs match the brand's warm/playful "not pastel, not muted" register
 * (specs/branding-and-voice.md) better than a hairline icon set. Color always
 * comes from the `color` prop React Navigation passes in (resolved from
 * `tabBarActiveTintColor`/`tabBarInactiveTintColor` above) — never hardcoded,
 * so dark mode is automatic. Size always comes from the `size` prop — never
 * a hardcoded pixel value.
 */
export function MainTabNavigator() {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
        },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeStack}
        options={{
          tabBarLabel: t('Navigation.HOME_TAB'),
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="LearnTab"
        component={LearnStack}
        options={{
          tabBarLabel: t('Navigation.LEARN_TAB'),
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'book' : 'book-outline'} color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="TutorTab"
        component={TutorStack}
        options={{
          tabBarLabel: t('Navigation.TUTOR_TAB'),
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? 'chatbubble-ellipses' : 'chatbubble-ellipses-outline'}
              color={color}
              size={size}
            />
          ),
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileStack}
        options={{
          tabBarLabel: t('Navigation.PROFILE_TAB'),
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? 'person-circle' : 'person-circle-outline'}
              color={color}
              size={size}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
