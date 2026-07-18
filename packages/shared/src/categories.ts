/**
 * Category taxonomy — the nine launch categories, ordered by day-one utility.
 *
 * See specs/data-model.md and specs/learn-and-categories.md.
 *
 * Display names are NOT here. They are i18n chrome (`Category.GREETINGS` in
 * translations/*.json) because a learner reads them in their UI language.
 * The slug is the stable key. See CLAUDE.md rule 8 and the two-lane note.
 */

import type { LanguageStatus } from './languages';

export interface CategoryDef {
  slug: string;
  /** i18n key for the display name. */
  i18nKey: string;
  iconKey: string;
  sortOrder: number;
  launchStatus: LanguageStatus;
  /**
   * Which characters from the bible naturally carry this category.
   * Used to seed animation prompts. See specs/branding-and-voice.md.
   */
  cast: readonly CharacterSlug[];
}

export type CharacterSlug = 'dadi' | 'parent' | 'kid' | 'neighbour';

export const CATEGORIES: readonly CategoryDef[] = [
  {
    slug: 'greetings',
    i18nKey: 'Category.GREETINGS',
    iconKey: 'hand-wave',
    sortOrder: 1,
    launchStatus: 'live',
    cast: ['dadi', 'neighbour'],
  },
  {
    slug: 'numbers-money',
    i18nKey: 'Category.NUMBERS_MONEY',
    iconKey: 'coins',
    sortOrder: 2,
    launchStatus: 'draft',
    cast: ['parent', 'neighbour', 'kid'],
  },
  {
    slug: 'food-market',
    i18nKey: 'Category.FOOD_MARKET',
    iconKey: 'basket',
    sortOrder: 3,
    launchStatus: 'draft',
    cast: ['parent', 'neighbour'],
  },
  {
    slug: 'travel-directions',
    i18nKey: 'Category.TRAVEL_DIRECTIONS',
    iconKey: 'signpost',
    sortOrder: 4,
    launchStatus: 'draft',
    cast: ['parent', 'neighbour'],
  },
  {
    slug: 'family',
    i18nKey: 'Category.FAMILY',
    iconKey: 'people',
    sortOrder: 5,
    launchStatus: 'draft',
    cast: ['dadi', 'parent', 'kid'],
  },
  {
    slug: 'daily-routine',
    i18nKey: 'Category.DAILY_ROUTINE',
    iconKey: 'sun-clock',
    sortOrder: 6,
    launchStatus: 'draft',
    cast: ['dadi', 'kid'],
  },
  {
    slug: 'health-body',
    i18nKey: 'Category.HEALTH_BODY',
    iconKey: 'heart-pulse',
    sortOrder: 7,
    launchStatus: 'draft',
    cast: ['dadi', 'kid'],
  },
  {
    slug: 'emergency',
    i18nKey: 'Category.EMERGENCY',
    iconKey: 'alert',
    sortOrder: 8,
    launchStatus: 'draft',
    cast: ['parent', 'neighbour'],
  },
  {
    slug: 'school-work',
    i18nKey: 'Category.SCHOOL_WORK',
    iconKey: 'book',
    sortOrder: 9,
    launchStatus: 'draft',
    cast: ['kid', 'parent'],
  },
] as const;

/**
 * The pilot category. Locked first: highest-frequency phrases, most visually
 * expressive, easiest to judge whether the comedy lands. The character bible
 * and beat timing are calibrated here before any other category is generated.
 * See specs/content-pipeline.md rule 9.
 */
export const PILOT_CATEGORY_SLUG = 'greetings';

/** Target phrase count per category at launch. */
export const PHRASES_PER_CATEGORY = 20;

export function getCategory(slug: string): CategoryDef | undefined {
  return CATEGORIES.find((c) => c.slug === slug);
}
