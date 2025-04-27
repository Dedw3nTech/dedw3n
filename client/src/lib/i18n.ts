import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';
import { detectUserLocation, getUserPreferredLanguage, saveUserLanguage, supportedLanguages } from './locationDetection';

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
    supportedLngs: supportedLanguages,
  });

// Initialize language based on geo-location
export async function initializeLanguageFromLocation() {
  try {
    // Check from multiple sources to ensure we find the saved preference
    // 1. Check our own localStorage key
    const customSavedLanguage = localStorage.getItem('userLanguage');
    
    // 2. Check i18next's default localStorage key
    const i18nextSavedLanguage = localStorage.getItem('i18nextLng');
    
    // 3. Check our function that reads from application storage
    const appSavedLanguage = getUserPreferredLanguage();
    
    // Use the first valid language we find
    const savedLanguage = customSavedLanguage || i18nextSavedLanguage || appSavedLanguage;
    
    if (savedLanguage && supportedLanguages.includes(savedLanguage)) {
      console.log('Loading saved language preference:', savedLanguage);
      await i18n.changeLanguage(savedLanguage);
      // Make sure language is saved in all places
      saveUserLanguage(savedLanguage);
      localStorage.setItem('i18nextLng', savedLanguage);
      localStorage.setItem('userLanguage', savedLanguage);
      return;
    }

    // If no saved preference, detect location and get appropriate language
    const locationInfo = await detectUserLocation();
    
    if (locationInfo && locationInfo.language && supportedLanguages.includes(locationInfo.language)) {
      console.log('Setting language based on location:', locationInfo.language);
      // Change the language
      await i18n.changeLanguage(locationInfo.language);
      // Save the detected language preference in all places
      saveUserLanguage(locationInfo.language);
      localStorage.setItem('i18nextLng', locationInfo.language);
      localStorage.setItem('userLanguage', locationInfo.language);
    }
  } catch (error) {
    console.error('Error initializing language from location:', error);
  }
}

// Change language and save preference
export function changeLanguage(languageCode: string) {
  console.log('Language changing from', i18n.language, 'to', languageCode);
  const prevLanguage = i18n.language;
  i18n.changeLanguage(languageCode);
  saveUserLanguage(languageCode);
  
  // Dispatch custom event for language change to force components to update
  window.dispatchEvent(new CustomEvent('language-changed', { 
    detail: { from: prevLanguage, to: languageCode } 
  }));
}

export default i18n;