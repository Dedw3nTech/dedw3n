import { useState, useEffect, useCallback, useRef } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

// Single translation cache for the entire application
const globalTranslationCache = new Map<string, string>();

// Batch processing queue
interface BatchRequest {
  text: string;
  resolve: (text: string) => void;
  timestamp: number;
}

class DeepLTranslationManager {
  private static instance: DeepLTranslationManager;
  private batchQueue = new Map<string, BatchRequest[]>(); // language -> requests
  private processingLanguages = new Set<string>();
  private activeBatches = 0; // Track concurrent batches
  private lastBatchTime = 0; // Rate limiting
  private readonly BATCH_SIZE = 8; // Reduced for quota efficiency
  private readonly BATCH_DELAY = 200; // Increased delay to prevent rate limiting
  private readonly MAX_CONCURRENT_BATCHES = 2; // Limit concurrent requests

  static getInstance(): DeepLTranslationManager {
    if (!DeepLTranslationManager.instance) {
      DeepLTranslationManager.instance = new DeepLTranslationManager();
    }
    return DeepLTranslationManager.instance;
  }

  async translateText(text: string, targetLanguage: string): Promise<string> {
    // Skip translation for English or empty text
    if (!text.trim() || targetLanguage === 'EN') {
      return text;
    }

    // Check cache first
    const cacheKey = `${text}|||${targetLanguage}`;
    if (globalTranslationCache.has(cacheKey)) {
      return globalTranslationCache.get(cacheKey)!;
    }

    // Add to batch queue and return promise
    return new Promise((resolve) => {
      if (!this.batchQueue.has(targetLanguage)) {
        this.batchQueue.set(targetLanguage, []);
      }

      this.batchQueue.get(targetLanguage)!.push({
        text,
        resolve,
        timestamp: Date.now()
      });

      // Schedule batch processing with throttling
      this.scheduleBatchProcessing(targetLanguage);
    });
  }

  private scheduleBatchProcessing(language: string) {
    if (this.processingLanguages.has(language)) {
      return; // Already scheduled
    }

    this.processingLanguages.add(language);

    setTimeout(() => {
      this.processBatch(language);
    }, this.BATCH_DELAY);
  }

  private async processBatch(language: string) {
    const requests = this.batchQueue.get(language) || [];
    if (requests.length === 0) {
      this.processingLanguages.delete(language);
      return;
    }

    // Take up to BATCH_SIZE requests
    const batch = requests.splice(0, this.BATCH_SIZE);
    const texts = batch.map(req => req.text);

    try {
      const response = await fetch('/api/translate/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          texts,
          targetLanguage: language,
          priority: 'normal'
        })
      });

      if (response.ok) {
        const data = await response.json();
        const translations = data.translations || [];

        // Cache and resolve translations
        batch.forEach((request, index) => {
          const translatedText = translations[index]?.translatedText || request.text;
          const cacheKey = `${request.text}|||${language}`;
          
          globalTranslationCache.set(cacheKey, translatedText);
          request.resolve(translatedText);
        });
      } else {
        // Fallback to original text
        batch.forEach(request => request.resolve(request.text));
      }
    } catch (error) {
      console.error('Translation batch failed:', error);
      // Fallback to original text
      batch.forEach(request => request.resolve(request.text));
    }

    // Continue processing remaining requests
    this.processingLanguages.delete(language);
    if (this.batchQueue.get(language)?.length > 0) {
      this.scheduleBatchProcessing(language);
    }
  }
}

/**
 * Single unified translation hook for the entire application
 * Replaces all other translation hooks with DeepL-only authentic translations
 */
export function useDeepLTranslation(text: string) {
  const { selectedLanguage } = useLanguage();
  const [translatedText, setTranslatedText] = useState(text);
  const [isLoading, setIsLoading] = useState(false);
  const managerRef = useRef(DeepLTranslationManager.getInstance());
  const previousTextRef = useRef<string>();
  const previousLanguageRef = useRef<string>();

  const translate = useCallback(async (textToTranslate: string, targetLanguage: string) => {
    if (textToTranslate === previousTextRef.current && 
        targetLanguage === previousLanguageRef.current) {
      return; // Skip if same text and language
    }

    previousTextRef.current = textToTranslate;
    previousLanguageRef.current = targetLanguage;

    setIsLoading(true);
    
    try {
      const result = await managerRef.current.translateText(textToTranslate, targetLanguage);
      setTranslatedText(result);
    } catch (error) {
      console.error('Translation failed:', error);
      setTranslatedText(textToTranslate); // Fallback to original
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (text && selectedLanguage?.code) {
      translate(text, selectedLanguage.code);
    }
  }, [text, selectedLanguage?.code, translate]);

  return { translatedText, isLoading };
}

/**
 * Batch translation hook for multiple texts
 */
export function useDeepLBatchTranslation(texts: string[]) {
  const { selectedLanguage } = useLanguage();
  const [translatedTexts, setTranslatedTexts] = useState<string[]>(texts);
  const [isLoading, setIsLoading] = useState(false);
  const managerRef = useRef(DeepLTranslationManager.getInstance());

  useEffect(() => {
    if (!texts.length || !selectedLanguage?.code || selectedLanguage.code === 'EN') {
      setTranslatedTexts(texts);
      return;
    }

    const translateBatch = async () => {
      setIsLoading(true);
      
      try {
        const results = await Promise.all(
          texts.map(text => managerRef.current.translateText(text, selectedLanguage.code))
        );
        setTranslatedTexts(results);
      } catch (error) {
        console.error('Batch translation failed:', error);
        setTranslatedTexts(texts); // Fallback to original
      } finally {
        setIsLoading(false);
      }
    };

    translateBatch();
  }, [texts, selectedLanguage?.code]);

  return { translatedTexts, isLoading };
}

/**
 * Clear translation cache (for testing or reset purposes)
 */
export function clearTranslationCache() {
  globalTranslationCache.clear();
}