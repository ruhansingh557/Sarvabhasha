import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LearnScreen } from '@features/learn/screens/LearnScreen';
import type { LearnStackParamList } from '../types';

const Stack = createNativeStackNavigator<LearnStackParamList>();

export function LearnStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Learn" component={LearnScreen} />
    </Stack.Navigator>
  );
}
