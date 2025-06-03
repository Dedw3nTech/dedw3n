import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

export interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}

// DeepL supported languages
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
  { code: 'HI', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
];

interface LanguageContextType {
  selectedLanguage: Language;
  setSelectedLanguage: (language: Language) => void;
  translateText: (text: string, targetLanguage?: string) => Promise<string>;
  isTranslating: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Translation cache to avoid repeated API calls
const translationCache = new Map<string, string>();

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(supportedLanguages[0]); // Default to English
  const [isTranslating, setIsTranslating] = useState(false);

  // Load saved language preference
  useEffect(() => {
    const savedLanguage = localStorage.getItem('dedw3n-language');
    if (savedLanguage) {
      const language = supportedLanguages.find(lang => lang.code === savedLanguage);
      if (language) {
        setSelectedLanguage(language);
      }
    }
  }, []);

  // Save language preference
  const handleSetLanguage = (language: Language) => {
    setSelectedLanguage(language);
    localStorage.setItem('dedw3n-language', language.code);
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
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          targetLanguage: target,
        }),
      });

      if (!response.ok) {
        throw new Error('Translation failed');
      }

      const data = await response.json();
      const translatedText = data.translatedText;
      
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

  return (
    <LanguageContext.Provider value={{
      selectedLanguage,
      setSelectedLanguage: handleSetLanguage,
      translateText,
      isTranslating
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
      setSelectedLanguage: () => {},
      translateText: (text: string) => Promise.resolve(text),
      isTranslating: false
    };
  }
  return context;
}