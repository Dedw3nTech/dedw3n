import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { resources } from '@/locales';

// Core supported languages with stable translation
export const languages = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'zh', name: 'Chinese' },
  { code: 'ja', name: 'Japanese' }
];

// Stable initialization with English default
const initialLanguage = localStorage.getItem('userLanguage') || 'en';

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: initialLanguage,
    fallbackLng: 'en',
    debug: false,
    interpolation: {
      escapeValue: false,
    },
    ns: 'common',
    defaultNS: 'common',
    supportedLngs: languages.map(lang => lang.code),
  });

// Simple language initialization
export async function initializeLanguageFromLocation() {
  // Keep existing language or default to English
  return;
}

// Simple language change function
export function changeLanguage(languageCode: string) {
  const targetLanguage = languages.find(lang => lang.code === languageCode);
  
  if (!targetLanguage) {
    languageCode = 'en';
  }
  
  i18n.changeLanguage(languageCode);
  localStorage.setItem('i18nextLng', languageCode);
  localStorage.setItem('userLanguage', languageCode);
  
  // Trigger app refresh for language change
  window.dispatchEvent(new CustomEvent('language-changed', { 
    detail: { language: languageCode }
  }));
}

export default i18n;