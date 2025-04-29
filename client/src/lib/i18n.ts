import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { resources } from '@/locales';

// Only English is supported
export const languages = [
  { code: 'en', name: 'English' }
];

// Set English as the default language
localStorage.setItem('i18nextLng', 'en');
localStorage.setItem('userLanguage', 'en');

i18n
  // Pass the i18n instance to react-i18next
  .use(initReactI18next)
  // Initialize i18next
  .init({
    resources, // Use the bundled resources instead of HTTP backend
    lng: 'en', // Use English only
    fallbackLng: 'en',
    debug: import.meta.env.DEV,
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    ns: 'common',
    defaultNS: 'common',
    supportedLngs: ['en'],
  });

// Initialize language (always English)
export async function initializeLanguageFromLocation() {
  // No longer needed - English only
  return;
}

// Change language (for API compatibility, but will always use English)
export function changeLanguage(languageCode: string) {
  // Ignore other languages, always use English
  console.log('Language changing to English (only supported language)');
  i18n.changeLanguage('en');
  localStorage.setItem('i18nextLng', 'en');
  localStorage.setItem('userLanguage', 'en');
}

export default i18n;