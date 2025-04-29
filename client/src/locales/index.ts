// Import all translation resources
import enCommon from './en/common.json';
import frCommon from './fr/common.json';
import ptCommon from './pt/common.json';

// Empty placeholder for languages we'll add later
const emptyTranslation = {};

// Bundle all translations
export const resources = {
  en: {
    common: enCommon
  },
  fr: {
    common: frCommon
  },
  pt: {
    common: ptCommon
  },
  // Other languages use the English translation as a fallback for now
  zh: {
    common: emptyTranslation
  },
  hi: {
    common: emptyTranslation
  },
  ar: {
    common: emptyTranslation
  },
  es: {
    common: emptyTranslation
  }
};

// Export translations by language
export const translationsByLanguage = {
  en: enCommon,
  fr: frCommon,
  pt: ptCommon,
  zh: emptyTranslation,
  hi: emptyTranslation,
  ar: emptyTranslation,
  es: emptyTranslation
};