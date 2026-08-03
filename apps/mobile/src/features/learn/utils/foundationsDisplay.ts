import type { ComponentProps } from 'react';
import type { Ionicons } from '@expo/vector-icons';

type IoniconName = ComponentProps<typeof Ionicons>['name'];
type Translate = (key: string) => string;

/**
 * Display helpers for the Foundations surfaces (Aksharmala/Numbers/
 * Vocabulary) — see plans/phase-13-foundations-vocab-numbers-alphabet.md.
 *
 * Vocabulary categories are authored dynamically by the content pipeline
 * (`vocabulary.upsertVocabularyCategory`), unlike the static phrase-category
 * taxonomy in `packages/shared/src/categories.ts` — there is no `i18nKey`
 * field on a `vocabularyCategories` row to translate through. The maps below
 * translate the plan doc's initial category list ("Content scope" section) by
 * `slug`/`iconKey`; anything outside this set still renders sensibly
 * (humanized slug, generic icon) rather than breaking — the same
 * graceful-fallback shape `LearnScreen`/`PhraseListContent` already use for
 * an unmapped PHRASE-category slug (`categoryDef ? t(def.i18nKey) : slug`).
 */
const VOCAB_CATEGORY_LABEL_KEYS: Record<string, string> = {
  family: 'Learn.VOCAB_CATEGORY_FAMILY',
  'food-drink': 'Learn.VOCAB_CATEGORY_FOOD_DRINK',
  food: 'Learn.VOCAB_CATEGORY_FOOD_DRINK',
  animals: 'Learn.VOCAB_CATEGORY_ANIMALS',
  animal: 'Learn.VOCAB_CATEGORY_ANIMALS',
  colours: 'Learn.VOCAB_CATEGORY_COLOURS',
  colors: 'Learn.VOCAB_CATEGORY_COLOURS',
  colour: 'Learn.VOCAB_CATEGORY_COLOURS',
  color: 'Learn.VOCAB_CATEGORY_COLOURS',
  'body-parts': 'Learn.VOCAB_CATEGORY_BODY_PARTS',
  body: 'Learn.VOCAB_CATEGORY_BODY_PARTS',
  'household-items': 'Learn.VOCAB_CATEGORY_HOUSEHOLD_ITEMS',
  household: 'Learn.VOCAB_CATEGORY_HOUSEHOLD_ITEMS',
  clothing: 'Learn.VOCAB_CATEGORY_CLOTHING',
  nature: 'Learn.VOCAB_CATEGORY_NATURE',
  'time-days': 'Learn.VOCAB_CATEGORY_TIME_DAYS',
  time: 'Learn.VOCAB_CATEGORY_TIME_DAYS',
  transport: 'Learn.VOCAB_CATEGORY_TRANSPORT',
  'common-objects': 'Learn.VOCAB_CATEGORY_COMMON_OBJECTS',
  objects: 'Learn.VOCAB_CATEGORY_COMMON_OBJECTS',
  vegetables: 'Learn.VOCAB_CATEGORY_VEGETABLES',
};

function humanizeSlug(slug: string): string {
  return slug.replace(/[-_]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Category display name: mapped i18n key when known, humanized slug otherwise. */
export function vocabularyCategoryLabel(t: Translate, slug: string): string {
  const key = VOCAB_CATEGORY_LABEL_KEYS[slug];
  return key ? t(key) : humanizeSlug(slug);
}

const VOCAB_CATEGORY_ICONS: Record<string, IoniconName> = {
  family: 'people-outline',
  food: 'restaurant-outline',
  'food-drink': 'restaurant-outline',
  animal: 'paw-outline',
  animals: 'paw-outline',
  colour: 'color-palette-outline',
  colours: 'color-palette-outline',
  color: 'color-palette-outline',
  colors: 'color-palette-outline',
  body: 'body-outline',
  'body-parts': 'body-outline',
  household: 'home-outline',
  'household-items': 'home-outline',
  clothing: 'shirt-outline',
  nature: 'leaf-outline',
  time: 'calendar-outline',
  'time-days': 'calendar-outline',
  transport: 'car-outline',
  objects: 'cube-outline',
  'common-objects': 'cube-outline',
  numbers: 'calculator-outline',
  vegetables: 'nutrition-outline',
};
const DEFAULT_VOCAB_ICON: IoniconName = 'ellipse-outline';

/** Category icon: mapped Ionicon when the backend's `iconKey` is known, generic glyph otherwise. */
export function iconForVocabularyCategory(iconKey: string | undefined): IoniconName {
  if (!iconKey) return DEFAULT_VOCAB_ICON;
  return VOCAB_CATEGORY_ICONS[iconKey] ?? DEFAULT_VOCAB_ICON;
}

/**
 * Best-effort representative glyph per script, used ONLY as a fallback for
 * the Learn root's Aksharmala card icon — before `aksharmala.listCharactersForScript`
 * has resolved, or before a script has any live vowel character seeded yet.
 * Once real data is available, `LearnScreen` prefers the actual first LIVE
 * vowel for the learner's script instead — this map never stands in for
 * taught content, only for "what glyph represents this script" chrome.
 */
const SCRIPT_FALLBACK_GLYPH: Record<string, string> = {
  devanagari: 'अ',
  bengali: 'অ',
  tamil: 'அ',
  telugu: 'అ',
  kannada: 'ಅ',
  gujarati: 'અ',
  malayalam: 'അ',
  gurmukhi: 'ਅ',
  odia: 'ଅ',
  arabic: 'ا',
  meetei: 'ꯑ',
  'ol-chiki': 'ᱚ',
};
export const DEFAULT_AKSHARMALA_GLYPH = 'Aa';

export function fallbackGlyphForScript(script: string | undefined): string {
  if (!script) return DEFAULT_AKSHARMALA_GLYPH;
  return SCRIPT_FALLBACK_GLYPH[script] ?? DEFAULT_AKSHARMALA_GLYPH;
}
