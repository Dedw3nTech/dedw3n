import { useState, useEffect } from 'react';
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
    const batch = requestQueue.splice(0, 2); // Process 2 at a time
    
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
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  isProcessing = false;
};

export function useTranslatedText(originalText: string): string {
  const { selectedLanguage } = useLanguage();
  const [translatedText, setTranslatedText] = useState(originalText);
  const [currentLang, setCurrentLang] = useState(selectedLanguage.code);

  useEffect(() => {
    console.log(`[Translation] Text: "${originalText}", Language: ${selectedLanguage.code}, Force Update: ${currentLang !== selectedLanguage.code}`);
    
    // Force update when language changes
    if (currentLang !== selectedLanguage.code) {
      setCurrentLang(selectedLanguage.code);
    }
    
    if (selectedLanguage.code === 'EN' || selectedLanguage.code === 'en' || !originalText.trim()) {
      console.log(`[Translation] Skipping translation for ${selectedLanguage.code}`);
      setTranslatedText(originalText);
      return;
    }

    const cacheKey = `${originalText}:${selectedLanguage.code}`;
    
    // Check cache first
    if (translationCache.has(cacheKey)) {
      const cached = translationCache.get(cacheKey)!;
      console.log(`[Translation] Using cached: "${originalText}" -> "${cached}"`);
      setTranslatedText(cached);
      return;
    }

    console.log(`[Translation] Queuing for translation: "${originalText}" to ${selectedLanguage.code}`);
    
    // Add to queue
    const promise = new Promise<string>((resolve) => {
      requestQueue.push({
        text: originalText,
        targetLang: selectedLanguage.code,
        resolve
      });
    });

    promise.then((translated) => {
      console.log(`[Translation] Received: "${originalText}" -> "${translated}"`);
      setTranslatedText(translated);
    });
    processTranslationQueue();
  }, [originalText, selectedLanguage.code, currentLang]);

  return translatedText;
}

// Component wrapper for easy translation
interface TranslatedTextProps {
  children: string;
  className?: string;
}

export function TranslatedText({ children, className }: TranslatedTextProps) {
  const { selectedLanguage } = useLanguage();
  const translatedText = useTranslatedText(children);
  
  // Force re-render with key when language changes
  return <span key={`${children}-${selectedLanguage.code}`} className={className}>{translatedText}</span>;
}