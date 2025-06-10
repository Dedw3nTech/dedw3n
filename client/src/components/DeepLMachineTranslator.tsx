import { useEffect, useRef, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useLocation } from 'wouter';

// Pure DeepL Machine Translation Engine - No DOM manipulation
interface DeepLTranslationService {
  translate(text: string, targetLanguage: string): Promise<string>;
  translateBatch(texts: string[], targetLanguage: string): Promise<Map<string, string>>;
}

interface TranslationCache {
  [textKey: string]: {
    [language: string]: {
      translation: string;
      timestamp: number;
      confidence: number;
    };
  };
}

class DeepLMachineTranslationService implements DeepLTranslationService {
  private cache: TranslationCache = {};
  private readonly DEEPL_API_URL = 'https://api-free.deepl.com/v2/translate';
  private readonly CACHE_DURATION = 7200000; // 2 hours
  private readonly BATCH_SIZE = 50;
  private readonly RATE_LIMIT_DELAY = 200; // 5 requests/second

  // DeepL language mapping
  private mapLanguageCode(code: string): string {
    const mapping: { [key: string]: string } = {
      'EN': 'EN-US',
      'ES': 'ES',
      'FR': 'FR',
      'DE': 'DE',
      'IT': 'IT',
      'PT': 'PT-PT',
      'RU': 'RU',
      'JA': 'JA',
      'ZH': 'ZH',
      'NL': 'NL',
      'PL': 'PL',
      'SV': 'SV',
      'DA': 'DA',
      'FI': 'FI',
      'NO': 'NB',
      'CS': 'CS',
      'SK': 'SK',
      'BG': 'BG',
      'RO': 'RO',
      'EL': 'EL',
      'HU': 'HU',
      'TR': 'TR',
      'UK': 'UK',
      'AR': 'AR',
      'KO': 'KO'
    };
    return mapping[code] || 'EN-US';
  }

  private getCachedTranslation(text: string, language: string): string | null {
    const textCache = this.cache[text];
    if (!textCache || !textCache[language]) return null;

    const cached = textCache[language];
    if (Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.translation;
    }

    return null;
  }

  private setCachedTranslation(text: string, translation: string, language: string) {
    if (!this.cache[text]) {
      this.cache[text] = {};
    }
    
    this.cache[text][language] = {
      translation,
      timestamp: Date.now(),
      confidence: 1.0
    };
  }

  async translate(text: string, targetLanguage: string): Promise<string> {
    if (!text.trim() || targetLanguage === 'EN') {
      return text;
    }

    // Check cache first
    const cached = this.getCachedTranslation(text, targetLanguage);
    if (cached) {
      return cached;
    }

    const results = await this.translateBatch([text], targetLanguage);
    return results.get(text) || text;
  }

  async translateBatch(texts: string[], targetLanguage: string): Promise<Map<string, string>> {
    const results = new Map<string, string>();
    const uncachedTexts: string[] = [];

    // Check cache for all texts
    texts.forEach(text => {
      const cached = this.getCachedTranslation(text, targetLanguage);
      if (cached) {
        results.set(text, cached);
      } else if (text.trim()) {
        uncachedTexts.push(text);
      }
    });

    if (uncachedTexts.length === 0) {
      return results;
    }

    const apiKey = import.meta.env.VITE_DEEPL_API_KEY;
    if (!apiKey) {
      console.warn('[DeepL Service] API key not configured, using fallback');
      return this.fallbackTranslation(uncachedTexts, targetLanguage, results);
    }

    try {
      // Process in batches
      const batches = this.chunkArray(uncachedTexts, this.BATCH_SIZE);
      
      for (const batch of batches) {
        const translations = await this.callDeepLAPI(batch, targetLanguage, apiKey);
        
        translations.forEach((translation, index) => {
          const originalText = batch[index];
          results.set(originalText, translation);
          this.setCachedTranslation(originalText, translation, targetLanguage);
        });

        // Rate limiting
        if (batches.length > 1) {
          await new Promise(resolve => setTimeout(resolve, this.RATE_LIMIT_DELAY));
        }
      }

      console.log(`[DeepL Service] Translated ${uncachedTexts.length} texts to ${targetLanguage}`);
      
    } catch (error) {
      console.error('[DeepL Service] Translation failed:', error);
      return this.fallbackTranslation(uncachedTexts, targetLanguage, results);
    }

    return results;
  }

  private async callDeepLAPI(texts: string[], targetLanguage: string, apiKey: string): Promise<string[]> {
    const formData = new URLSearchParams();
    texts.forEach(text => formData.append('text', text));
    formData.append('target_lang', this.mapLanguageCode(targetLanguage));
    formData.append('preserve_formatting', '1');
    formData.append('tag_handling', 'html');

    const response = await fetch(this.DEEPL_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `DeepL-Auth-Key ${apiKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData
    });

    if (!response.ok) {
      if (response.status === 403) {
        throw new Error('DeepL API authentication failed');
      } else if (response.status === 456) {
        throw new Error('DeepL API quota exceeded');
      }
      throw new Error(`DeepL API error: ${response.status}`);
    }

    const data = await response.json();
    return data.translations.map((t: any) => t.text);
  }

  private async fallbackTranslation(texts: string[], targetLanguage: string, results: Map<string, string>): Promise<Map<string, string>> {
    try {
      const response = await fetch('/api/translate/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          texts: texts,
          targetLanguage: targetLanguage,
          priority: 'high'
        })
      });

      if (response.ok) {
        const data = await response.json();
        data.translations?.forEach(({ originalText, translatedText }: any) => {
          results.set(originalText, translatedText);
          this.setCachedTranslation(originalText, translatedText, targetLanguage);
        });
      }
    } catch (error) {
      // Return original texts if all translation methods fail
      texts.forEach(text => results.set(text, text));
    }

    return results;
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
}

// Machine Translation Context Provider
class MachineTranslationContext {
  private static instance: MachineTranslationContext;
  private deepLService: DeepLMachineTranslationService;
  private currentLanguage: string = 'EN';

  private constructor() {
    this.deepLService = new DeepLMachineTranslationService();
  }

  static getInstance(): MachineTranslationContext {
    if (!MachineTranslationContext.instance) {
      MachineTranslationContext.instance = new MachineTranslationContext();
    }
    return MachineTranslationContext.instance;
  }

  setLanguage(language: string) {
    this.currentLanguage = language;
  }

  async translateText(text: string): Promise<string> {
    if (this.currentLanguage === 'EN' || !text.trim()) {
      return text;
    }
    return this.deepLService.translate(text, this.currentLanguage);
  }

  async translateTexts(texts: string[]): Promise<Map<string, string>> {
    if (this.currentLanguage === 'EN') {
      const results = new Map<string, string>();
      texts.forEach(text => results.set(text, text));
      return results;
    }
    return this.deepLService.translateBatch(texts, this.currentLanguage);
  }
}

// Translation Hook for Components
export function useDeepLTranslation() {
  const { currentLanguage } = useLanguage();
  const translationContext = MachineTranslationContext.getInstance();

  useEffect(() => {
    translationContext.setLanguage(currentLanguage);
  }, [currentLanguage]);

  const translateText = useCallback(async (text: string): Promise<string> => {
    return translationContext.translateText(text);
  }, [currentLanguage]);

  const translateTexts = useCallback(async (texts: string[]): Promise<Map<string, string>> => {
    return translationContext.translateTexts(texts);
  }, [currentLanguage]);

  return {
    translateText,
    translateTexts,
    isTranslationEnabled: currentLanguage !== 'EN'
  };
}

// Machine Translation Manager Component
export function DeepLMachineTranslator() {
  const [location] = useLocation();
  const { currentLanguage } = useLanguage();
  const translationContext = useRef(MachineTranslationContext.getInstance());

  useEffect(() => {
    translationContext.current.setLanguage(currentLanguage);
    
    if (currentLanguage !== 'EN') {
      console.log(`[DeepL Machine Translator] Language set to ${currentLanguage}`);
      console.log('[DeepL Machine Translator] Translation service ready for API calls');
    }
  }, [currentLanguage, location]);

  return null;
}

// Export the translation service for direct API usage
export const deepLTranslationService = new DeepLMachineTranslationService();

export default DeepLMachineTranslator;