import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { apiRequest } from '@/lib/queryClient';

export interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}

// DeepL supported languages - only authentic translations
export const supportedLanguages: Language[] = [
  { code: 'EN', name: 'English', nativeName: 'English', flag: '🇺🇸' },
  { code: 'ES', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'FR', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'DE', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  { code: 'IT', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹' },
  { code: 'PT', name: 'Portuguese', nativeName: 'Português', flag: '🇵🇹' },
  { code: 'RU', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺' },
  { code: 'JA', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
  { code: 'ZH', name: 'Chinese', nativeName: '中文', flag: '🇨🇳' },
  { code: 'KO', name: 'Korean', nativeName: '한국어', flag: '🇰🇷' },
  { code: 'NL', name: 'Dutch', nativeName: 'Nederlands', flag: '🇳🇱' },
  { code: 'PL', name: 'Polish', nativeName: 'Polski', flag: '🇵🇱' },
  { code: 'SV', name: 'Swedish', nativeName: 'Svenska', flag: '🇸🇪' },
  { code: 'DA', name: 'Danish', nativeName: 'Dansk', flag: '🇩🇰' },
  { code: 'FI', name: 'Finnish', nativeName: 'Suomi', flag: '🇫🇮' },
  { code: 'NO', name: 'Norwegian', nativeName: 'Norsk', flag: '🇳🇴' },
  { code: 'CS', name: 'Czech', nativeName: 'Čeština', flag: '🇨🇿' },
  { code: 'HU', name: 'Hungarian', nativeName: 'Magyar', flag: '🇭🇺' },
  { code: 'TR', name: 'Turkish', nativeName: 'Türkçe', flag: '🇹🇷' },
  { code: 'AR', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦' },
];

interface LanguageContextType {
  selectedLanguage: Language;
  currentLanguage: string;
  setSelectedLanguage: (language: Language) => void;
  setLanguage: (code: string) => void; // Backward compatibility alias
  translateText: (text: string, targetLanguage?: string) => Promise<string>;
  isTranslating: boolean;
  isLoading: boolean;
  updateUserLanguagePreference: (languageCode: string) => Promise<boolean>;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Translation cache to avoid repeated API calls
const translationCache = new Map<string, string>();

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(supportedLanguages[0]); // Default to English
  const [isTranslating, setIsTranslating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load user's language preference from backend or localStorage
  useEffect(() => {
    const loadLanguagePreference = async () => {
      try {
        // First try to get from backend if user is logged in
        const response = await fetch('/api/user/language', {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          }
        });

        if (response.ok) {
          const data = await response.json();
          const language = supportedLanguages.find(lang => lang.code === data.language);
          if (language) {
            setSelectedLanguage(language);
            localStorage.setItem('dedw3n-language', language.code);
            setIsLoading(false);
            return;
          }
        }
      } catch (error) {
        console.log('User not authenticated, using local storage');
      }

      // Fallback to localStorage
      const savedLanguage = localStorage.getItem('dedw3n-language');
      if (savedLanguage) {
        const language = supportedLanguages.find(lang => lang.code === savedLanguage);
        if (language) {
          setSelectedLanguage(language);
        }
      }
      setIsLoading(false);
    };

    loadLanguagePreference();
  }, []);

  // Update user language preference in backend
  const updateUserLanguagePreference = async (languageCode: string): Promise<boolean> => {
    try {
      const response = await apiRequest('POST', '/api/user/language', {
        language: languageCode
      });

      if (response.ok) {
        console.log('Language preference updated in backend');
        return true;
      }
    } catch (error) {
      console.log('Failed to update language preference in backend, user may not be authenticated');
    }
    return false;
  };

  // Save language preference both locally and in backend
  const handleSetLanguage = async (language: Language) => {
    console.log(`[Language Context] Changing language from ${selectedLanguage.code} to ${language.code}`);
    setSelectedLanguage(language);
    localStorage.setItem('dedw3n-language', language.code);
    
    // Try to update in backend (will silently fail if user not authenticated)
    await updateUserLanguagePreference(language.code);
    
    // Clear translation cache when language changes
    translationCache.clear();
  };

  const translateText = async (text: string, targetLanguage?: string): Promise<string> => {
    const target = targetLanguage || selectedLanguage.code;
    
    // Don't translate if target language is English
    if (target === 'EN') {
      return text;
    }

    // Check cache first
    const cacheKey = `${text}-${target}`;
    if (translationCache.has(cacheKey)) {
      return translationCache.get(cacheKey)!;
    }

    setIsTranslating(true);
    
    try {
      const response = await fetch('/api/translate/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          texts: [text],
          targetLanguage: target,
          priority: 'normal'
        }),
      });

      if (!response.ok) {
        throw new Error('Translation failed');
      }

      const data = await response.json();
      const translatedText = data.translations?.[0]?.translatedText || text;
      
      // Cache the translation
      translationCache.set(cacheKey, translatedText);
      
      return translatedText;
    } catch (error) {
      console.error('Translation error:', error);
      return text; // Return original text if translation fails
    } finally {
      setIsTranslating(false);
    }
  };

  // Backward compatibility alias for setLanguage
  const setLanguage = (code: string) => {
    const language = supportedLanguages.find(lang => lang.code === code);
    if (language) {
      handleSetLanguage(language);
    }
  };

  return (
    <LanguageContext.Provider value={{
      selectedLanguage,
      currentLanguage: selectedLanguage.code,
      setSelectedLanguage: handleSetLanguage,
      setLanguage,
      translateText,
      isTranslating,
      isLoading,
      updateUserLanguagePreference
    }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    // Provide fallback values instead of throwing error
    return {
      selectedLanguage: supportedLanguages[0],
      currentLanguage: 'EN',
      setSelectedLanguage: () => {},
      setLanguage: () => {},
      translateText: (text: string) => Promise.resolve(text),
      isTranslating: false,
      isLoading: false,
      updateUserLanguagePreference: () => Promise.resolve(false)
    };
  }
  return context;
}