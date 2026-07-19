import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import en from '@translations/en.json';

/**
 * UI-string i18n only (flat `Feature.KEY`). Lesson content translation is a
 * separate, human-reviewed pipeline — see CLAUDE.md's "two translation lanes".
 * Only `en` is wired for now; the other 21 UI locales come from the
 * i18n-translator agent as each is localized.
 */
void i18n.use(initReactI18next).init({
  resources: { en: { translation: en } },
  lng: Localization.getLocales()[0]?.languageCode ?? 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

export default i18n;
