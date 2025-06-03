import { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

// Global cache and rate limiting
const translationCache = new Map<string, string>();
let requestQueue: Array<{ text: string; targetLang: string; resolve: (value: string) => void }> = [];
let isProcessing = false;

// Process translation requests with rate limiting
const processTranslationQueue = async () => {
  if (isProcessing || requestQueue.length === 0) return;
  
  isProcessing = true;
  
  while (requestQueue.length > 0) {
    const batch = requestQueue.splice(0, 3); // Process 3 at a time
    
    await Promise.all(batch.map(async ({ text, targetLang, resolve }) => {
      try {
        const response = await fetch('/api/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, targetLanguage: targetLang }),
        });

        if (response.ok) {
          const data = await response.json();
          const translated = data.translatedText || text;
          translationCache.set(`${text}:${targetLang}`, translated);
          resolve(translated);
        } else {
          resolve(text); // Fallback to original
        }
      } catch (error) {
        resolve(text); // Fallback on error
      }
    }));
    
    // Wait between batches to respect rate limits
    if (requestQueue.length > 0) {
      await new Promise(resolve => setTimeout(resolve, 300));
    }
  }
  
  isProcessing = false;
};

export function useOptimizedTranslation(text: string): string {
  const { selectedLanguage } = useLanguage();
  const [translatedText, setTranslatedText] = useState(text);

  useEffect(() => {
    if (selectedLanguage.code === 'EN' || !text.trim()) {
      setTranslatedText(text);
      return;
    }

    const cacheKey = `${text}:${selectedLanguage.code}`;
    
    // Check cache first
    if (translationCache.has(cacheKey)) {
      setTranslatedText(translationCache.get(cacheKey)!);
      return;
    }

    // Add to queue
    const promise = new Promise<string>((resolve) => {
      requestQueue.push({
        text,
        targetLang: selectedLanguage.code,
        resolve
      });
    });

    promise.then(setTranslatedText);
    processTranslationQueue();
  }, [text, selectedLanguage.code]);

  return translatedText;
}

// Simple component wrapper
export function TranslatedText({ children }: { children: string }) {
  const translatedText = useOptimizedTranslation(children);
  return <>{translatedText}</>;
}