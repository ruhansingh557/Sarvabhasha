import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LearnScreen } from '@features/learn/screens/LearnScreen';
import { PhraseListScreen } from '@features/learn/screens/PhraseListScreen';
import { PhraseDetailScreen } from '@features/learn/screens/PhraseDetailScreen';
import type { LearnStackParamList } from '../types';

const Stack = createNativeStackNavigator<LearnStackParamList>();

export function LearnStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Learn" component={LearnScreen} />
      {/*
        Sub-screens get the native header back (title-less — the category /
        phrase name is already the first thing in the screen body) so there
        is a visible, accessible way back on every platform, not just the
        iOS swipe gesture.
      */}
      <Stack.Screen name="PhraseList" component={PhraseListScreen} options={{ headerShown: true, title: '' }} />
      <Stack.Screen
        name="PhraseDetail"
        component={PhraseDetailScreen}
        options={{ headerShown: true, title: '' }}
      />
    </Stack.Navigator>
  );
}
