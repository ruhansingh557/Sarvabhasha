import { createTheme } from '@shopify/restyle';

/**
 * Restyle theme. See specs/theming-and-dark-mode.md.
 *
 * RULES (CLAUDE.md 1, 2, 16 — enforced by the ui-guardian agent):
 *   - Components use SEMANTIC tokens only. `palette` is private to this file.
 *     A raw hex or a `palette.*` reference in a component breaks dark mode.
 *   - Both themes define the SAME token names. That is what makes dark mode
 *     free — and what bypassing tokens takes away.
 *   - No component assumes phone width. Use `breakpoints` + responsive props.
 */

// Private. NEVER import this outside this file.
const palette = {
  // Warm Indian daylight — matches the animation art direction.
  saffron400: '#F5A524',
  saffron500: '#E8890C',
  saffron600: '#C26E05',

  teal400: '#2DD4BF',
  teal500: '#14B8A6',
  teal600: '#0D9488',

  cream50: '#FFF8F0',
  cream100: '#FDF1E3',

  ink900: '#14110E',
  ink800: '#231E19',
  ink700: '#3A322A',
  ink500: '#6B5D4F',
  ink300: '#A89684',
  ink200: '#D6C9B8',
  ink100: '#EADFD1',

  white: '#FFFFFF',

  red500: '#DC2626',
  red400: '#F87171',
  green500: '#16A34A',
  green400: '#4ADE80',
  amber500: '#D97706',
  amber400: '#FBBF24',
  blue500: '#2563EB',
  blue400: '#60A5FA',
};

/**
 * Breakpoints. Phone, tablet/iPad, and wide (landscape tablet, foldable open).
 * `phone: 0` is the base — every style without a breakpoint applies from here.
 */
const breakpoints = {
  phone: 0,
  tablet: 768,
  wide: 1024,
};

const spacing = {
  none: 0,
  xs: 4,
  s: 8,
  m: 16,
  l: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
};

const borderRadii = {
  xs: 2,
  s: 4,
  m: 8,
  l: 16,
  xl: 24,
  xxl: 32,
  round: 9999,
};

/**
 * Line heights run generous relative to font size. Latin-tuned line-height
 * clips Devanagari matras and Bengali/Gurmukhi ascenders. See TALL_SCRIPTS
 * in @sarvabhasha/shared. Test every variant against the longest script,
 * not English.
 */
const textVariants = {
  defaults: { fontSize: 16, lineHeight: 26, color: 'textPrimary' },
  hero: { fontSize: 40, lineHeight: 56, fontWeight: '700', color: 'textPrimary' },
  display: { fontSize: 32, lineHeight: 46, fontWeight: '700', color: 'textPrimary' },
  h1: { fontSize: 28, lineHeight: 40, fontWeight: '700', color: 'textPrimary' },
  h2: { fontSize: 22, lineHeight: 33, fontWeight: '600', color: 'textPrimary' },
  h3: { fontSize: 18, lineHeight: 28, fontWeight: '600', color: 'textPrimary' },
  bodyLarge: { fontSize: 18, lineHeight: 29, color: 'textPrimary' },
  body: { fontSize: 16, lineHeight: 26, color: 'textPrimary' },
  bodySmall: { fontSize: 14, lineHeight: 23, color: 'textSecondary' },
  caption: { fontSize: 12, lineHeight: 19, color: 'textMuted' },
  label: { fontSize: 13, lineHeight: 20, fontWeight: '600', color: 'textSecondary' },
  button: { fontSize: 16, lineHeight: 24, fontWeight: '600', color: 'textInverse' },
  link: { fontSize: 16, lineHeight: 26, fontWeight: '600', color: 'primary' },

  /** The phrase being taught, in the target script. Deliberately large. */
  phrase: { fontSize: 30, lineHeight: 48, fontWeight: '600', color: 'textPrimary' },
  /** Latin transliteration under a phrase. */
  transliteration: { fontSize: 16, lineHeight: 26, color: 'textSecondary' },
};

export const lightTheme = createTheme({
  colors: {
    primary: palette.saffron500,
    primaryMuted: palette.saffron400,
    accent: palette.teal500,

    background: palette.cream50,
    surface: palette.white,
    surfaceRaised: palette.white,
    border: palette.ink100,
    overlay: 'rgba(20, 17, 14, 0.55)',

    textPrimary: palette.ink900,
    textSecondary: palette.ink500,
    textMuted: palette.ink300,
    textInverse: palette.white,

    error: palette.red500,
    success: palette.green500,
    warning: palette.amber500,
    info: palette.blue500,
  },
  spacing,
  borderRadii,
  breakpoints,
  textVariants,
});

export type Theme = typeof lightTheme;

export const darkTheme: Theme = {
  ...lightTheme,
  colors: {
    ...lightTheme.colors,
    primary: palette.saffron400,
    primaryMuted: palette.saffron600,
    accent: palette.teal400,

    background: palette.ink900,
    surface: palette.ink800,
    surfaceRaised: palette.ink700,
    border: palette.ink700,
    overlay: 'rgba(0, 0, 0, 0.7)',

    textPrimary: palette.cream100,
    textSecondary: palette.ink200,
    textMuted: palette.ink300,
    textInverse: palette.ink900,

    error: palette.red400,
    success: palette.green400,
    warning: palette.amber400,
    info: palette.blue400,
  },
};

/**
 * Max content width on tablet/wide. Full-bleed layouts constrain and centre —
 * a 1024px-wide settings list is bad design, not tablet support.
 * Only the Learn tab gets a genuinely different (two-pane) layout.
 */
export const MAX_CONTENT_WIDTH = 720;
