import { useState, useEffect, useCallback, useRef } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

// Global translation cache for the entire website
const globalTranslationCache = new Map<string, string>();
const TEXT_EXTRACTION_CACHE = new Map<string, string[]>();

// Website text extractor - collects all text content from the website
const extractWebsiteTexts = (): string[] => {
  const texts = new Set<string>();
  
  // Extract from current DOM
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: (node) => {
        const text = node.textContent?.trim();
        if (!text || text.length < 2) return NodeFilter.FILTER_REJECT;
        
        // Skip script, style, and other non-visible elements
        const parent = node.parentElement;
        if (!parent) return NodeFilter.FILTER_REJECT;
        
        const tagName = parent.tagName.toLowerCase();
        if (['script', 'style', 'noscript', 'template'].includes(tagName)) {
          return NodeFilter.FILTER_REJECT;
        }
        
        return NodeFilter.FILTER_ACCEPT;
      }
    }
  );

  let node;
  while (node = walker.nextNode()) {
    const text = node.textContent?.trim();
    if (text && text.length > 1) {
      texts.add(text);
    }
  }

  // Add predefined static texts that might not be in DOM yet
  const staticTexts = [
    // Navigation
    'Home', 'Marketplace', 'Community', 'Dating', 'Business', 'Messages', 
    'Notifications', 'Cart', 'Profile', 'Settings', 'Logout', 'Login',
    
    // Product actions
    'Add to Cart', 'Buy Now', 'View Details', 'Share', 'Like', 'Report',
    'Send Offer', 'Gift', 'Save', 'Compare', 'Quick View', 'Add to Wishlist',
    
    // Categories
    'Electronics', 'Fashion', 'Home & Garden', 'Sports', 'Beauty', 'Books',
    'Automotive', 'Health', 'Toys', 'Food', 'Services', 'Real Estate',
    
    // Common UI
    'Search', 'Filter', 'Sort by', 'Price', 'Rating', 'Reviews', 'Description',
    'Specifications', 'Shipping', 'Returns', 'Contact Seller', 'Ask Question',
    
    // Forms
    'Submit', 'Cancel', 'Save', 'Delete', 'Edit', 'Update', 'Create', 'Close',
    'Next', 'Previous', 'Continue', 'Back', 'Finish', 'Confirm',
    
    // Status
    'Available', 'Out of Stock', 'On Sale', 'New', 'Featured', 'Popular',
    'Trending', 'Best Seller', 'Limited Time', 'Free Shipping',
    
    // User actions
    'Sign Up', 'Sign In', 'Forgot Password', 'Reset Password', 'Change Password',
    'Verify Email', 'Update Profile', 'Manage Account', 'Privacy Settings',
    
    // Notifications
    'You have new messages', 'Order confirmed', 'Payment successful',
    'Item shipped', 'Delivery scheduled', 'Review pending',
    
    // Errors
    'Something went wrong', 'Please try again', 'Invalid input', 'Required field',
    'Connection error', 'Not found', 'Access denied', 'Session expired'
  ];

  staticTexts.forEach(text => texts.add(text));

  return Array.from(texts);
};

// Global translation manager
class GlobalTranslationManager {
  private isTranslating = false;
  private pendingLanguage: string | null = null;
  private subscribers: Set<() => void> = new Set();

  subscribe(callback: () => void) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  private notify() {
    this.subscribers.forEach(callback => callback());
  }

  async translateWebsite(targetLanguage: string): Promise<void> {
    if (this.isTranslating) {
      this.pendingLanguage = targetLanguage;
      return;
    }

    this.isTranslating = true;
    this.notify();

    try {
      console.log(`[Global Translation] Starting website translation to ${targetLanguage}`);
      
      // Extract all website texts
      const allTexts = extractWebsiteTexts();
      console.log(`[Global Translation] Extracted ${allTexts.length} texts`);

      // Filter texts that need translation (not cached)
      const textsToTranslate = allTexts.filter(text => {
        const cacheKey = `${text}:${targetLanguage}`;
        return !globalTranslationCache.has(cacheKey);
      });

      if (textsToTranslate.length === 0) {
        console.log(`[Global Translation] All texts already cached for ${targetLanguage}`);
        this.isTranslating = false;
        this.notify();
        return;
      }

      console.log(`[Global Translation] Translating ${textsToTranslate.length} new texts`);

      // Split into smaller chunks to avoid rate limits
      const chunkSize = 20;
      const chunks = [];
      for (let i = 0; i < textsToTranslate.length; i += chunkSize) {
        chunks.push(textsToTranslate.slice(i, i + chunkSize));
      }

      // Process chunks sequentially to avoid rate limits
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        try {
          // Add delay between requests to avoid rate limiting
          if (i > 0) {
            await new Promise(resolve => setTimeout(resolve, 200));
          }
          
          const response = await fetch('/api/translate/batch', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({
              texts: chunk,
              targetLanguage: targetLanguage,
              priority: 'low' // Lower priority to avoid overwhelming the API
            }),
          });

          if (!response.ok) {
            throw new Error(`Translation failed for chunk ${i + 1}`);
          }

          const data = await response.json();
          
          // Cache all translations
          data.translations.forEach((translation: any) => {
            const cacheKey = `${translation.originalText}:${targetLanguage}`;
            globalTranslationCache.set(cacheKey, translation.translatedText);
          });

          console.log(`[Global Translation] Completed chunk ${i + 1}/${chunks.length}`);
        } catch (error) {
          console.error(`[Global Translation] Error in chunk ${i + 1}:`, error);
        }
      }
      console.log(`[Global Translation] Website translation completed for ${targetLanguage}`);

    } catch (error) {
      console.error('[Global Translation] Translation failed:', error);
    } finally {
      this.isTranslating = false;
      this.notify();

      // Process pending language change if any
      if (this.pendingLanguage && this.pendingLanguage !== targetLanguage) {
        const nextLanguage = this.pendingLanguage;
        this.pendingLanguage = null;
        setTimeout(() => this.translateWebsite(nextLanguage), 100);
      }
    }
  }

  getTranslation(text: string, language: string): string {
    if (language === 'EN' || language === 'en') return text;
    
    const cacheKey = `${text}:${language}`;
    return globalTranslationCache.get(cacheKey) || text;
  }

  isCurrentlyTranslating(): boolean {
    return this.isTranslating;
  }
}

const globalTranslationManager = new GlobalTranslationManager();

// Hook for global website translation
export function useGlobalTranslation() {
  const { selectedLanguage } = useLanguage();
  const [isTranslating, setIsTranslating] = useState(false);
  const previousLanguageRef = useRef(selectedLanguage.code);

  // Subscribe to translation manager updates
  useEffect(() => {
    const unsubscribe = globalTranslationManager.subscribe(() => {
      setIsTranslating(globalTranslationManager.isCurrentlyTranslating());
    });

    return unsubscribe;
  }, []);

  // Trigger translation when language changes
  useEffect(() => {
    if (previousLanguageRef.current !== selectedLanguage.code) {
      previousLanguageRef.current = selectedLanguage.code;
      
      if (selectedLanguage.code !== 'EN' && selectedLanguage.code !== 'en') {
        globalTranslationManager.translateWebsite(selectedLanguage.code);
      }
    }
  }, [selectedLanguage.code]);

  const getTranslation = useCallback((text: string): string => {
    return globalTranslationManager.getTranslation(text, selectedLanguage.code);
  }, [selectedLanguage.code]);

  return {
    getTranslation,
    isTranslating,
    translateWebsite: (language: string) => globalTranslationManager.translateWebsite(language),
  };
}

// High-performance instant translation hook
export function useInstantTranslation(text: string): string {
  const { selectedLanguage } = useLanguage();
  const [translatedText, setTranslatedText] = useState(text);

  useEffect(() => {
    if (!text || selectedLanguage.code === 'EN' || selectedLanguage.code === 'en') {
      setTranslatedText(text);
      return;
    }

    const translation = globalTranslationManager.getTranslation(text, selectedLanguage.code);
    setTranslatedText(translation);

    // Subscribe to global translation updates
    const unsubscribe = globalTranslationManager.subscribe(() => {
      const updatedTranslation = globalTranslationManager.getTranslation(text, selectedLanguage.code);
      setTranslatedText(updatedTranslation);
    });

    return unsubscribe;
  }, [text, selectedLanguage.code]);

  return translatedText;
}

// Optimized batch translation for component arrays
export function useOptimizedTranslationBatch(texts: string[]): string[] {
  const { selectedLanguage } = useLanguage();
  const [translatedTexts, setTranslatedTexts] = useState<string[]>(texts);

  useEffect(() => {
    if (selectedLanguage.code === 'EN' || selectedLanguage.code === 'en') {
      setTranslatedTexts(texts);
      return;
    }

    const translations = texts.map(text => 
      globalTranslationManager.getTranslation(text, selectedLanguage.code)
    );
    setTranslatedTexts(translations);

    // Subscribe to global translation updates
    const unsubscribe = globalTranslationManager.subscribe(() => {
      const updatedTranslations = texts.map(text => 
        globalTranslationManager.getTranslation(text, selectedLanguage.code)
      );
      setTranslatedTexts(updatedTranslations);
    });

    return unsubscribe;
  }, [texts, selectedLanguage.code]);

  return translatedTexts;
}