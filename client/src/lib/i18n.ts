import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { resources } from '@/locales';

// Core supported languages with stable translation (matching available translation files)
export const languages = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇵🇹' },
  { code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳' }
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