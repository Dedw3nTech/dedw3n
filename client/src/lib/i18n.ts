import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';

// Available languages
export const languages = [
  { code: 'en', name: 'English' },
  { code: 'fr', name: 'Français' },
  { code: 'pt', name: 'Português' },
  { code: 'zh', name: '中文' },    // Mandarin
  { code: 'hi', name: 'हिन्दी' },  // Hindi
  { code: 'ar', name: 'العربية' }, // Arabic
  { code: 'es', name: 'Español' }  // Spanish
];

i18n
  // Load translations from backend
  .use(Backend)
  // Detect user language
  .use(LanguageDetector)
  // Pass the i18n instance to react-i18next
  .use(initReactI18next)
  // Initialize i18next
  .init({
    fallbackLng: 'en',
    debug: import.meta.env.DEV,
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
    },
    backend: {
      loadPath: './locales/{{lng}}/{{ns}}.json',
    },
    ns: 'common',
    defaultNS: 'common',
    supportedLngs: ['en', 'fr', 'pt', 'zh', 'hi', 'ar', 'es'],
  });

export default i18n;