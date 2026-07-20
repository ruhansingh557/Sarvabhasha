import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TutorScreen } from '@features/tutor/screens/TutorScreen';
import type { TutorStackParamList } from '../types';

const Stack = createNativeStackNavigator<TutorStackParamList>();

export function TutorStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tutor" component={TutorScreen} />
    </Stack.Navigator>
  );
}
