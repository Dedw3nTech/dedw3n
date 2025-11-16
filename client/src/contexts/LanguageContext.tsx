import { createContext, useContext, useState, ReactNode, useEffect, useRef } from 'react';
import { apiRequest } from '@/lib/queryClient';
import PersistentTranslationCache from '@/lib/persistent-translation-cache';
import { masterTranslationManager } from '@/hooks/use-master-translation';
import { globalTranslationSeeds } from '@/lib/translationSeeds';

export interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}

// DeepL supported languages - only authentic translations (alphabetically ordered)
export const supportedLanguages: Language[] = [
  { code: 'AR', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦' },
  { code: 'ZH', name: 'Chinese', nativeName: '中文', flag: '🇨🇳' },
  { code: 'CS', name: 'Czech', nativeName: 'Čeština', flag: '🇨🇿' },
  { code: 'DA', name: 'Danish', nativeName: 'Dansk', flag: '🇩🇰' },
  { code: 'NL', name: 'Dutch', nativeName: 'Nederlands', flag: '🇳🇱' },
  { code: 'EN', name: 'English', nativeName: 'English', flag: '🇺🇸' },
  { code: 'FI', name: 'Finnish', nativeName: 'Suomi', flag: '🇫🇮' },
  { code: 'FR', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'DE', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  { code: 'HU', name: 'Hungarian', nativeName: 'Magyar', flag: '🇭🇺' },
  { code: 'IT', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹' },
  { code: 'JA', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
  { code: 'KO', name: 'Korean', nativeName: '한국어', flag: '🇰🇷' },
  { code: 'NO', name: 'Norwegian', nativeName: 'Norsk', flag: '🇳🇴' },
  { code: 'PL', name: 'Polish', nativeName: 'Polski', flag: '🇵🇱' },
  { code: 'PT', name: 'Portuguese', nativeName: 'Português', flag: '🇵🇹' },
  { code: 'RU', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺' },
  { code: 'ES', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'SV', name: 'Swedish', nativeName: 'Svenska', flag: '🇸🇪' },
  { code: 'TR', name: 'Turkish', nativeName: 'Türkçe', flag: '🇹🇷' },
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
  getCacheStats: () => any; // Cache statistics for monitoring
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Persistent translation cache - survives page reloads
const persistentCache = PersistentTranslationCache.getInstance();

export function LanguageProvider({ children }: { children: ReactNode }) {
  // Initialize immediately from localStorage for instant rendering (optimistic)
  const getInitialLanguage = (): Language => {
    const savedLanguage = localStorage.getItem('dedw3n-language');
    if (savedLanguage) {
      const language = supportedLanguages.find(lang => lang.code === savedLanguage);
      if (language) return language;
    }
    return supportedLanguages.find(lang => lang.code === 'EN') || supportedLanguages[0];
  };
  
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(getInitialLanguage());
  const [isTranslating, setIsTranslating] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // Never block rendering
  
  // Track initial language to prevent overwriting user changes during load
  const initialLanguageCode = useRef(getInitialLanguage().code);
  const hasLoadedFromBackend = useRef(false);
  
  // Track which languages have had seeds preloaded to avoid duplicates
  const preloadedLanguages = useRef(new Set<string>());
  
  // Deduplicate seeds once (avoid repeated Set creation)
  const uniqueSeedsRef = useRef<string[]>(Array.from(new Set(globalTranslationSeeds)));

  // Register global component once on mount and unregister on unmount
  useEffect(() => {
    const componentId = 'language-context/global-seed-preload';
    masterTranslationManager.registerComponent(componentId);
    
    return () => {
      masterTranslationManager.unregisterComponent(componentId);
    };
  }, []);

  // Preload global translation seeds for a given language
  const preloadTranslationSeeds = async (languageCode: string): Promise<void> => {
    // Skip if English (no translation needed)
    if (languageCode === 'EN') {
      return;
    }

    // Skip if already preloaded for this language
    if (preloadedLanguages.current.has(languageCode)) {
      return;
    }

    const componentId = 'language-context/global-seed-preload';
    
    try {
      console.log(`[Language Context] Preloading ${uniqueSeedsRef.current.length} translation seeds for ${languageCode}`);
      
      // Preload translations using high priority for instant availability
      await new Promise<void>((resolve, reject) => {
        masterTranslationManager.translateBatch(
          uniqueSeedsRef.current,
          languageCode,
          'high', // High priority for critical UI strings
          componentId,
          (translations: Record<string, string>) => {
            try {
              // Store in persistent cache for survival across page reloads
              Object.entries(translations).forEach(([text, translatedText]) => {
                if (typeof text === 'string' && typeof translatedText === 'string') {
                  persistentCache.set(text, languageCode, translatedText, 'EN', 'high');
                }
              });
              
              console.log(`[Language Context] Successfully preloaded ${Object.keys(translations).length} translation seeds for ${languageCode}`);
              resolve();
            } catch (cacheError) {
              reject(cacheError);
            }
          }
        );
      });

      // Mark this language as preloaded
      preloadedLanguages.current.add(languageCode);
    } catch (error) {
      console.error(`[Language Context] Failed to preload translation seeds for ${languageCode}:`, error);
      // Don't throw - gracefully degrade to on-demand translation
    }
  };

  // Load user's language preference from backend AFTER initial render (non-blocking)
  // Uses HTTP caching (ETag + Cache-Control) to minimize DB queries
  useEffect(() => {
    // Only load once on mount
    if (hasLoadedFromBackend.current) return;
    
    const loadLanguagePreference = async () => {
      try {
        // Non-blocking: fetch in background, update if different
        // Browser will use cached response if ETag matches (HTTP 304)
        const response = await fetch('/api/user/language', {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          }
        });

        if (response.ok) {
          const data = await response.json();
          
          // If user is authenticated and has a language preference
          if (data.authenticated && data.language) {
            const language = supportedLanguages.find(lang => lang.code === data.language);
            
            // CRITICAL: Only update if user hasn't changed language since mount
            // This prevents race condition where backend overwrites manual user changes
            setSelectedLanguage(current => {
              // If current language matches initial, user hasn't changed it - safe to update from backend
              if (current.code === initialLanguageCode.current && language && language.code !== current.code) {
                console.log('[Language Context] Updating language from backend (cached):', language.code);
                localStorage.setItem('dedw3n-language', language.code);
                return language;
              }
              // User has changed language since mount - don't overwrite
              return current;
            });
          }
        }
        hasLoadedFromBackend.current = true;
      } catch (error) {
        // Silent fail - already using localStorage/default language
        console.log('[Language Context] Could not fetch from backend (using cached):', error);
        hasLoadedFromBackend.current = true;
      }
    };

    // Run in background without blocking
    void loadLanguagePreference();
  }, []);

  // Preload translation seeds whenever language changes
  useEffect(() => {
    void preloadTranslationSeeds(selectedLanguage.code);
  }, [selectedLanguage.code]);

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
    const oldLanguageCode = selectedLanguage.code;
    
    setSelectedLanguage(language);
    localStorage.setItem('dedw3n-language', language.code);
    
    // Try to update in backend (will silently fail if user not authenticated)
    await updateUserLanguagePreference(language.code);
    
    // Clear translation cache for old language to prevent stale entries
    persistentCache.clearLanguage(oldLanguageCode);
    console.log(`[Language Context] Cleared persistent cache for ${oldLanguageCode}`);
    
    // Clear Master Translation Manager cache for old language
    try {
      masterTranslationManager.clearLanguageCache?.(oldLanguageCode);
      console.log(`[Language Context] Cleared Master Translation cache for ${oldLanguageCode}`);
    } catch (error) {
      console.warn('[Language Context] Failed to clear Master Translation cache:', error);
    }
    
    // Note: Preloading for new language is handled by the useEffect hook
  };

  const translateText = async (text: string, targetLanguage?: string): Promise<string> => {
    const target = targetLanguage || selectedLanguage.code;
    
    // Don't translate if target language is English
    if (target === 'EN') {
      return text;
    }

    // Check persistent cache first (survives page reloads)
    const cached = persistentCache.get(text, target);
    if (cached) {
      return cached;
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
      
      // Cache the translation in persistent storage
      persistentCache.set(text, target, translatedText, 'EN', 'normal');
      
      return translatedText;
    } catch (error) {
      console.error('Translation error:', error);
      return text; // Return original text if translation fails
    } finally {
      setIsTranslating(false);
    }
  };

  // Get cache statistics for monitoring
  const getCacheStats = () => {
    return persistentCache.getStats();
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
      updateUserLanguagePreference,
      getCacheStats
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
      updateUserLanguagePreference: () => Promise.resolve(false),
      getCacheStats: () => ({ size: 0, languages: [], hitRate: 0, oldestEntry: 0, newestEntry: 0 })
    };
  }
  return context;
}