import type { ComponentProps } from 'react';
import { Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { Box, Text, useTheme } from '@theme';
import { vocabularyCategoryLabel, iconForVocabularyCategory } from '../utils/foundationsDisplay';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

interface VocabularyCategoryChipProps {
  slug: string;
  iconKey: string;
  selected: boolean;
  onPress: () => void;
}

/**
 * A selectable pill for one vocabulary category, in `VocabularyScreen`'s
 * horizontal category row. Distinct from
 * `shared/components/molecules/CategoryChip`: that component resolves
 * display name + icon from `packages/shared`'s STATIC phrase-category
 * taxonomy (`getCategory`/its own `CATEGORY_ICONS`) — vocabulary categories
 * are authored dynamically by the content pipeline and have no entry there,
 * hence `foundationsDisplay.ts`'s own maps. `selected` also has no analogue
 * in `CategoryChip` (Home's category row never highlights a selection).
 */
export function VocabularyCategoryChip({ slug, iconKey, selected, onPress }: VocabularyCategoryChipProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const label = vocabularyCategoryLabel(t, slug);
  const iconName: IoniconName = iconForVocabularyCategory(iconKey);

  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label}>
      <Box
        flexDirection="row"
        alignItems="center"
        justifyContent="center"
        gap="xs"
        backgroundColor={selected ? 'primary' : 'surface'}
        borderWidth={1}
        borderColor={selected ? 'primary' : 'border'}
        borderRadius="round"
        paddingHorizontal="m"
        paddingVertical="s"
        minHeight={44}
      >
        <Ionicons name={iconName} size={18} color={selected ? theme.colors.textInverse : theme.colors.primary} />
        <Text variant="label" color={selected ? 'textInverse' : 'textPrimary'}>
          {label}
        </Text>
      </Box>
    </Pressable>
  );
}
