/**
 * Language registry — the single source of truth for every language the app
 * knows about, in either role (UI locale or learning target).
 *
 * See specs/languages-and-rollout.md and specs/data-model.md.
 *
 * IMPORTANT: this file describes the *catalogue*. Whether a language is
 * actually selectable as a learning target is decided by the `status` column
 * of the Convex `languages` table at runtime, NOT by this file. Promoting a
 * language must be a data change, never a code change (CLAUDE.md rule 11).
 * `launchStatus` below is only the seed value.
 */

export type LanguageStatus = 'draft' | 'review' | 'live' | 'archived';

/**
 * Bhashini TTS voice quality. A language with `none` can never be promoted
 * to `live` — there is no way to teach pronunciation without audio.
 * These ratings are a starting assessment and MUST be re-verified against
 * live Bhashini output before any language is promoted.
 */
export type TtsQuality = 'good' | 'fair' | 'none';

export interface LanguageDef {
  /** ISO 639-1 where one exists, else ISO 639-3. Kannada is `kn`, NOT `ka` (Georgian). */
  code: string;
  nativeName: string;
  englishName: string;
  script: string;
  ttsQuality: TtsQuality;
  launchStatus: LanguageStatus;
  sortOrder: number;
}

export const LANGUAGES: readonly LanguageDef[] = [
  // ---- Live at launch: good TTS, large speaker base ----
  { code: 'hi',  nativeName: 'हिन्दी',        englishName: 'Hindi',     script: 'devanagari', ttsQuality: 'good', launchStatus: 'live',  sortOrder: 1 },
  { code: 'bn',  nativeName: 'বাংলা',         englishName: 'Bengali',   script: 'bengali',    ttsQuality: 'good', launchStatus: 'live',  sortOrder: 2 },
  { code: 'ta',  nativeName: 'தமிழ்',         englishName: 'Tamil',     script: 'tamil',      ttsQuality: 'good', launchStatus: 'live',  sortOrder: 3 },
  { code: 'te',  nativeName: 'తెలుగు',        englishName: 'Telugu',    script: 'telugu',     ttsQuality: 'good', launchStatus: 'live',  sortOrder: 4 },
  { code: 'mr',  nativeName: 'मराठी',         englishName: 'Marathi',   script: 'devanagari', ttsQuality: 'good', launchStatus: 'live',  sortOrder: 5 },
  { code: 'kn',  nativeName: 'ಕನ್ನಡ',         englishName: 'Kannada',   script: 'kannada',    ttsQuality: 'good', launchStatus: 'live',  sortOrder: 6 },

  // ---- Draft: promote per-language after native-speaker review ----
  { code: 'gu',  nativeName: 'ગુજરાતી',       englishName: 'Gujarati',  script: 'gujarati',   ttsQuality: 'good', launchStatus: 'draft', sortOrder: 7 },
  { code: 'ml',  nativeName: 'മലയാളം',       englishName: 'Malayalam', script: 'malayalam',  ttsQuality: 'good', launchStatus: 'draft', sortOrder: 8 },
  { code: 'pa',  nativeName: 'ਪੰਜਾਬੀ',        englishName: 'Punjabi',   script: 'gurmukhi',   ttsQuality: 'good', launchStatus: 'draft', sortOrder: 9 },
  { code: 'or',  nativeName: 'ଓଡ଼ିଆ',         englishName: 'Odia',      script: 'odia',       ttsQuality: 'fair', launchStatus: 'draft', sortOrder: 10 },
  { code: 'as',  nativeName: 'অসমীয়া',       englishName: 'Assamese',  script: 'bengali',    ttsQuality: 'fair', launchStatus: 'draft', sortOrder: 11 },
  { code: 'ur',  nativeName: 'اردو',           englishName: 'Urdu',      script: 'arabic',     ttsQuality: 'fair', launchStatus: 'draft', sortOrder: 12 },
  { code: 'ne',  nativeName: 'नेपाली',        englishName: 'Nepali',    script: 'devanagari', ttsQuality: 'fair', launchStatus: 'draft', sortOrder: 13 },
  { code: 'sa',  nativeName: 'संस्कृतम्',      englishName: 'Sanskrit',  script: 'devanagari', ttsQuality: 'fair', launchStatus: 'draft', sortOrder: 14 },
  { code: 'ks',  nativeName: 'कॉशुर',         englishName: 'Kashmiri',  script: 'devanagari', ttsQuality: 'none', launchStatus: 'draft', sortOrder: 15 },
  { code: 'sd',  nativeName: 'سنڌي',           englishName: 'Sindhi',    script: 'arabic',     ttsQuality: 'none', launchStatus: 'draft', sortOrder: 16 },
  { code: 'kok', nativeName: 'कोंकणी',        englishName: 'Konkani',   script: 'devanagari', ttsQuality: 'none', launchStatus: 'draft', sortOrder: 17 },
  { code: 'doi', nativeName: 'डोगरी',         englishName: 'Dogri',     script: 'devanagari', ttsQuality: 'none', launchStatus: 'draft', sortOrder: 18 },
  { code: 'mai', nativeName: 'मैथिली',        englishName: 'Maithili',  script: 'devanagari', ttsQuality: 'none', launchStatus: 'draft', sortOrder: 19 },
  { code: 'brx', nativeName: 'बड़ो',           englishName: 'Bodo',      script: 'devanagari', ttsQuality: 'none', launchStatus: 'draft', sortOrder: 20 },
  { code: 'mni', nativeName: 'ꯃꯤꯇꯩ ꯂꯣꯟ',      englishName: 'Manipuri',  script: 'meetei',     ttsQuality: 'none', launchStatus: 'draft', sortOrder: 21 },
  { code: 'sat', nativeName: 'ᱥᱟᱱᱛᱟᱲᱤ',       englishName: 'Santali',   script: 'ol-chiki',   ttsQuality: 'none', launchStatus: 'draft', sortOrder: 22 },
] as const;

/** Selectable as a learning target at launch. */
export const LAUNCH_LIVE_LANGUAGES = LANGUAGES.filter((l) => l.launchStatus === 'live');

/**
 * UI locales. Every language ships as a UI locale regardless of learning-target
 * status — the two axes are independent. A learner may read the app in Hindi
 * while learning Tamil. See specs/i18n-and-localization.md.
 */
export const UI_LOCALES = LANGUAGES.map((l) => l.code);

/**
 * Scripts needing extra line-height headroom so diacritics are not clipped.
 * Latin-tuned line-height cuts the top of Devanagari matras. See ui-guardian.
 */
export const TALL_SCRIPTS = ['devanagari', 'bengali', 'gurmukhi', 'odia', 'malayalam'] as const;

export function getLanguage(code: string): LanguageDef | undefined {
  return LANGUAGES.find((l) => l.code === code);
}

/** A language can never go `live` without usable TTS. */
export function canPromoteToLive(code: string): boolean {
  const lang = getLanguage(code);
  return !!lang && lang.ttsQuality !== 'none';
}

export function needsTallLineHeight(code: string): boolean {
  const lang = getLanguage(code);
  return !!lang && (TALL_SCRIPTS as readonly string[]).includes(lang.script);
}
