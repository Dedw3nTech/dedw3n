// Import all translation resources
import enCommon from './en/common.json';
import frCommon from './fr/common.json';
import ptCommon from './pt/common.json';
import esCommon from './es/common.json';
import zhCommon from './zh/common.json';
import hiCommon from './hi/common.json';
import arCommon from './ar/common.json';

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
  es: {
    common: esCommon
  },
  zh: {
    common: zhCommon
  },
  hi: {
    common: hiCommon
  },
  ar: {
    common: arCommon
  }
};

// Export translations by language
export const translationsByLanguage = {
  en: enCommon,
  fr: frCommon,
  pt: ptCommon,
  es: esCommon,
  zh: zhCommon,
  hi: hiCommon,
  ar: arCommon
};