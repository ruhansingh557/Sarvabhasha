import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen } from '@shared/components/atoms/Screen';
import { PhraseListContent } from '../components/PhraseListContent';
import type { LearnStackParamList } from '@navigation/types';

/**
 * Phone/pushed route for a single category's phrases. On tablet/wide this
 * same content renders inline as `LearnScreen`'s right pane instead — see
 * `PhraseListContent`, shared by both.
 */
export function PhraseListScreen() {
  const route = useRoute<RouteProp<LearnStackParamList, 'PhraseList'>>();
  const navigation = useNavigation<NativeStackNavigationProp<LearnStackParamList>>();

  return (
    <Screen scroll>
      <PhraseListContent
        categorySlug={route.params.categorySlug}
        onSelectPhrase={(phraseId) => navigation.navigate('PhraseDetail', { phraseId })}
      />
    </Screen>
  );
}
