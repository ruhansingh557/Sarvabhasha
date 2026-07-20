import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
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
 * Text-only labels for this pass — no icon set is installed yet. Adding
 * @expo/vector-icons is a reasonable follow-up, not required to ship a
 * working tab bar.
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
        options={{ tabBarLabel: t('Navigation.HOME_TAB') }}
      />
      <Tab.Screen
        name="LearnTab"
        component={LearnStack}
        options={{ tabBarLabel: t('Navigation.LEARN_TAB') }}
      />
      <Tab.Screen
        name="TutorTab"
        component={TutorStack}
        options={{ tabBarLabel: t('Navigation.TUTOR_TAB') }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileStack}
        options={{ tabBarLabel: t('Navigation.PROFILE_TAB') }}
      />
    </Tab.Navigator>
  );
}
