import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { resources } from '@/locales';

// Comprehensive language support with DeepL integration
export const languages = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ru', name: 'Russian' },
  { code: 'ja', name: 'Japanese' },
  { code: 'zh', name: 'Chinese' },
  { code: 'ko', name: 'Korean' },
  { code: 'nl', name: 'Dutch' },
  { code: 'pl', name: 'Polish' },
  { code: 'sv', name: 'Swedish' },
  { code: 'da', name: 'Danish' },
  { code: 'fi', name: 'Finnish' },
  { code: 'no', name: 'Norwegian' },
  { code: 'cs', name: 'Czech' },
  { code: 'hu', name: 'Hungarian' },
  { code: 'tr', name: 'Turkish' },
  { code: 'ar', name: 'Arabic' },
  { code: 'hi', name: 'Hindi' }
];

// Dynamic language detection and initialization
const getInitialLanguage = () => {
  const stored = localStorage.getItem('userLanguage');
  if (stored && languages.find(lang => lang.code === stored)) {
    return stored;
  }
  
  // Browser language detection with fallback
  const browserLang = navigator.language.split('-')[0];
  const supportedLang = languages.find(lang => lang.code === browserLang);
  return supportedLang ? supportedLang.code : 'en';
};

const initialLanguage = getInitialLanguage();

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: initialLanguage,
    fallbackLng: 'en',
    debug: import.meta.env.DEV,
    interpolation: {
      escapeValue: false,
    },
    ns: 'common',
    defaultNS: 'common',
    supportedLngs: languages.map(lang => lang.code),
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage']
    }
  });

// Enhanced language initialization with location detection
export async function initializeLanguageFromLocation() {
  try {
    // Try to detect user's location and set appropriate language
    const response = await fetch('https://ipapi.co/json/');
    const data = await response.json();
    
    // Map country codes to language codes
    const countryToLanguage: Record<string, string> = {
      'ES': 'es', 'MX': 'es', 'AR': 'es', 'CO': 'es', 'PE': 'es',
      'FR': 'fr', 'CA': 'fr', 'BE': 'fr', 'CH': 'fr',
      'DE': 'de', 'AT': 'de',
      'IT': 'it',
      'PT': 'pt', 'BR': 'pt',
      'RU': 'ru', 'BY': 'ru', 'KZ': 'ru',
      'JP': 'ja',
      'CN': 'zh', 'TW': 'zh', 'HK': 'zh',
      'KR': 'ko',
      'NL': 'nl',
      'PL': 'pl',
      'SE': 'sv',
      'DK': 'da',
      'FI': 'fi',
      'NO': 'no',
      'CZ': 'cs',
      'HU': 'hu',
      'TR': 'tr',
      'SA': 'ar', 'AE': 'ar', 'EG': 'ar', 'MA': 'ar',
      'IN': 'hi'
    };
    
    const detectedLanguage = countryToLanguage[data.country_code] || 'en';
    const supportedLanguage = languages.find(lang => lang.code === detectedLanguage);
    
    if (supportedLanguage && !localStorage.getItem('userLanguage')) {
      changeLanguage(detectedLanguage);
      console.log(`Language auto-detected: ${supportedLanguage.name} (${detectedLanguage})`);
    }
  } catch (error) {
    console.log('Location-based language detection failed, using browser language');
  }
}

// Enhanced language change with translation system integration
export function changeLanguage(languageCode: string) {
  const targetLanguage = languages.find(lang => lang.code === languageCode);
  
  if (!targetLanguage) {
    console.warn(`Unsupported language: ${languageCode}, falling back to English`);
    languageCode = 'en';
  }
  
  console.log(`Switching to: ${targetLanguage?.name || 'English'} (${languageCode})`);
  
  i18n.changeLanguage(languageCode);
  localStorage.setItem('i18nextLng', languageCode);
  localStorage.setItem('userLanguage', languageCode);
  
  // Dispatch custom event for language change to trigger app-wide updates
  window.dispatchEvent(new CustomEvent('language-changed', { 
    detail: { language: languageCode, name: targetLanguage?.name || 'English' }
  }));
}

export default i18n;