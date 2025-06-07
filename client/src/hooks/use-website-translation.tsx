import { useState, useEffect, useRef } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

interface WebsiteTranslationCache {
  [key: string]: {
    headerTexts: string[];
    footerTexts: string[];
    pageTexts: string[];
    timestamp: number;
  };
}

class WebsiteTranslationManager {
  private cache: WebsiteTranslationCache = {};
  private isTranslating = false;
  private currentLanguage = 'EN';
  private CACHE_DURATION = 45 * 60 * 1000; // 45 minutes for website-wide cache

  // All website texts organized by section
  private websiteTexts = {
    header: [
      "Buy from a friend (C2C)",
      "Buy from a store (B2C)", 
      "Business (B2B)",
      "Search products...",
      "Liked",
      "Shopping Cart",
      "Orders & Returns",
      "Vendor Dashboard"
    ],
    footer: [
      "All rights reserved.",
      "Privacy Policy",
      "Terms of Service", 
      "Cookie Policy",
      "Community Guidelines",
      "Contact Us",
      "FAQ",
      "Shipping",
      "Partnerships",
      "Download our mobile app",
      "Download on the",
      "App Store",
      "Get it on",
      "Google Play",
      "is a British Company registered in England, Wales and Scotland under registration number",
      "whose registered office is situated",
      "Our bank is registered with HSBC UK IBAN",
      "our sole official website is"
    ],
    common: [
      "Loading...",
      "Error",
      "Success",
      "Cancel",
      "Save",
      "Delete",
      "Edit",
      "View",
      "Back",
      "Next",
      "Previous",
      "Submit",
      "Close",
      "Open",
      "Select",
      "Choose",
      "Filter",
      "Sort",
      "Search",
      "Add",
      "Remove",
      "Update",
      "Refresh",
      "Download",
      "Upload",
      "Share",
      "Like",
      "Unlike",
      "Follow",
      "Unfollow",
      "Subscribe",
      "Unsubscribe"
    ]
  };

  private getCacheKey(language: string): string {
    return `website:${language}`;
  }

  private getCachedTranslations(language: string): WebsiteTranslationCache[string] | null {
    const key = this.getCacheKey(language);
    const cached = this.cache[key];
    
    if (!cached) return null;
    
    const age = Date.now() - cached.timestamp;
    if (age > this.CACHE_DURATION) {
      delete this.cache[key];
      return null;
    }
    
    return cached;
  }

  private setCachedTranslations(
    language: string, 
    headerTexts: string[], 
    footerTexts: string[], 
    pageTexts: string[]
  ): void {
    const key = this.getCacheKey(language);
    this.cache[key] = {
      headerTexts,
      footerTexts,
      pageTexts,
      timestamp: Date.now()
    };
  }

  public async translateWebsite(language: string): Promise<{
    headerTexts: string[];
    footerTexts: string[];
    pageTexts: string[];
  }> {
    if (language === 'EN') {
      return {
        headerTexts: this.websiteTexts.header,
        footerTexts: this.websiteTexts.footer,
        pageTexts: this.websiteTexts.common
      };
    }

    // Check cache first for instant response
    const cached = this.getCachedTranslations(language);
    if (cached) {
      console.log(`[Website Translation] Cache hit for ${language} - instant loading`);
      return {
        headerTexts: cached.headerTexts,
        footerTexts: cached.footerTexts,
        pageTexts: cached.pageTexts
      };
    }

    if (this.isTranslating) {
      // Return original texts while translation is in progress
      return {
        headerTexts: this.websiteTexts.header,
        footerTexts: this.websiteTexts.footer,
        pageTexts: this.websiteTexts.common
      };
    }

    this.isTranslating = true;
    this.currentLanguage = language;

    const allTexts = [
      ...this.websiteTexts.header,
      ...this.websiteTexts.footer,
      ...this.websiteTexts.common
    ];

    console.log(`[Website Translation] Translating entire website (${allTexts.length} texts) to ${language}`);
    const startTime = Date.now();

    try {
      const response = await fetch('/api/translate/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          texts: allTexts,
          targetLanguage: language,
          priority: 'instant'
        })
      });

      if (!response.ok) {
        throw new Error(`Website translation failed: ${response.status}`);
      }

      const data = await response.json();
      const totalTime = Date.now() - startTime;

      // Split translations back into sections
      const headerCount = this.websiteTexts.header.length;
      const footerCount = this.websiteTexts.footer.length;
      
      const translatedTexts = data.translations.map((t: any) => t.translatedText || t.originalText);
      
      const headerTexts = translatedTexts.slice(0, headerCount);
      const footerTexts = translatedTexts.slice(headerCount, headerCount + footerCount);
      const pageTexts = translatedTexts.slice(headerCount + footerCount);

      // Cache the results
      this.setCachedTranslations(language, headerTexts, footerTexts, pageTexts);

      console.log(`[Website Translation] Complete website translated in ${totalTime}ms - ${allTexts.length} texts cached for instant future access`);

      return { headerTexts, footerTexts, pageTexts };
    } catch (error) {
      console.warn('Website translation error:', error);
      // Return original texts on error
      return {
        headerTexts: this.websiteTexts.header,
        footerTexts: this.websiteTexts.footer,
        pageTexts: this.websiteTexts.common
      };
    } finally {
      this.isTranslating = false;
    }
  }

  public clearCache(): void {
    this.cache = {};
    console.log('[Website Translation] Cache cleared');
  }

  public getCacheStats(): { languages: number; totalTexts: number } {
    const languages = Object.keys(this.cache).length;
    const totalTexts = Object.values(this.cache).reduce((sum, cached) => {
      return sum + cached.headerTexts.length + cached.footerTexts.length + cached.pageTexts.length;
    }, 0);
    
    return { languages, totalTexts };
  }
}

// Global website translation manager
const websiteTranslationManager = new WebsiteTranslationManager();

export function useWebsiteTranslation() {
  const { currentLanguage } = useLanguage();
  const [translations, setTranslations] = useState({
    headerTexts: websiteTranslationManager['websiteTexts'].header,
    footerTexts: websiteTranslationManager['websiteTexts'].footer,
    pageTexts: websiteTranslationManager['websiteTexts'].common
  });
  const [isLoading, setIsLoading] = useState(false);
  const lastLanguageRef = useRef(currentLanguage);

  useEffect(() => {
    // Only trigger translation if language actually changed
    if (lastLanguageRef.current === currentLanguage) return;
    
    lastLanguageRef.current = currentLanguage;
    setIsLoading(true);

    websiteTranslationManager.translateWebsite(currentLanguage)
      .then((result) => {
        setTranslations(result);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [currentLanguage]);

  const clearCache = () => {
    websiteTranslationManager.clearCache();
  };

  const getCacheStats = () => {
    return websiteTranslationManager.getCacheStats();
  };

  return {
    translations,
    isLoading,
    clearCache,
    getCacheStats
  };
}

// Hook for getting specific section translations
export function useHeaderTranslations() {
  const { translations } = useWebsiteTranslation();
  return translations.headerTexts;
}

export function useFooterTranslations() {
  const { translations } = useWebsiteTranslation();
  return translations.footerTexts;
}

export function usePageTranslations() {
  const { translations } = useWebsiteTranslation();
  return translations.pageTexts;
}