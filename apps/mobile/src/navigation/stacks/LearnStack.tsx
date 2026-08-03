import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LearnScreen } from '@features/learn/screens/LearnScreen';
import { PhraseCategoriesScreen } from '@features/learn/screens/PhraseCategoriesScreen';
import { PhraseListScreen } from '@features/learn/screens/PhraseListScreen';
import { PhraseDetailScreen } from '@features/learn/screens/PhraseDetailScreen';
import { AksharmalaScreen } from '@features/learn/screens/AksharmalaScreen';
import { NumbersScreen } from '@features/learn/screens/NumbersScreen';
import { VocabularyScreen } from '@features/learn/screens/VocabularyScreen';
import type { LearnStackParamList } from '../types';

const Stack = createNativeStackNavigator<LearnStackParamList>();

export function LearnStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Learn" component={LearnScreen} />
      {/*
        Every screen below is one tap deeper than the four-card Learn root
        (plans/phase-13-foundations-vocab-numbers-alphabet.md's locked
        Foundations IA), so each gets the native header back (title-less —
        the screen's own heading is already the first thing in its body) for
        a visible, accessible way back on every platform, not just the iOS
        swipe gesture — same convention `PhraseList`/`PhraseDetail` already
        used before this stack grew.
      */}
      <Stack.Screen
        name="PhraseCategories"
        component={PhraseCategoriesScreen}
        options={{ headerShown: true, title: '' }}
      />
      <Stack.Screen name="PhraseList" component={PhraseListScreen} options={{ headerShown: true, title: '' }} />
      <Stack.Screen
        name="PhraseDetail"
        component={PhraseDetailScreen}
        options={{ headerShown: true, title: '' }}
      />
      <Stack.Screen name="Aksharmala" component={AksharmalaScreen} options={{ headerShown: true, title: '' }} />
      <Stack.Screen name="Numbers" component={NumbersScreen} options={{ headerShown: true, title: '' }} />
      <Stack.Screen name="Vocabulary" component={VocabularyScreen} options={{ headerShown: true, title: '' }} />
    </Stack.Navigator>
  );
}
