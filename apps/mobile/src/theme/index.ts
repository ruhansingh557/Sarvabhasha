import {
  createBox,
  createText,
  useTheme as useRestyleTheme,
} from '@shopify/restyle';
import type { Theme } from './theme';

export { lightTheme, darkTheme, MAX_CONTENT_WIDTH } from './theme';
export type { Theme } from './theme';

/**
 * The ONLY layout and text primitives. See CLAUDE.md rules 1–4, 16.
 *
 *   <Box padding={{ phone: 'm', tablet: 'xl' }} backgroundColor="surface" />
 *   <Text variant="h2" color="textPrimary" />
 *
 * Never a raw hex, never a hardcoded pixel width, never Dimensions.get()
 * at module scope.
 */
export const Box = createBox<Theme>();
export const Text = createText<Theme>();

export const useTheme = () => useRestyleTheme<Theme>();
