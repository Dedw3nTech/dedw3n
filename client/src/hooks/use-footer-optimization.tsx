import { useState, useEffect, useRef } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

interface FooterTranslations {
  allRightsReserved: string;
  privacyPolicy: string;
  termsOfService: string;
  cookiePolicy: string;
  communityGuidelines: string;
  contactUs: string;
  faq: string;
  shipping: string;
  partnerships: string;
  downloadMobileApp: string;
  downloadOnThe: string;
  appStore: string;
  getItOn: string;
  googlePlay: string;
  britishCompany: string;
  registeredOffice: string;
  bankRegistered: string;
  officialWebsite: string;
}

const FOOTER_CACHE_KEY = 'footer_translations_cache';
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes for footer content

export function useFooterOptimization(): {
  translations: FooterTranslations;
  isLoading: boolean;
} {
  const { currentLanguage } = useLanguage();
  const [translations, setTranslations] = useState<FooterTranslations>({
    allRightsReserved: "All rights reserved.",
    privacyPolicy: "Privacy Policy",
    termsOfService: "Terms of Service",
    cookiePolicy: "Cookie Policy",
    communityGuidelines: "Community Guidelines",
    contactUs: "Contact Us",
    faq: "FAQ",
    shipping: "Shipping",
    partnerships: "Partnerships",
    downloadMobileApp: "Download our mobile app",
    downloadOnThe: "Download on the",
    appStore: "App Store",
    getItOn: "Get it on",
    googlePlay: "Google Play",
    britishCompany: "is a British Company registered in England, Wales and Scotland under registration number",
    registeredOffice: "whose registered office is situated",
    bankRegistered: "Our bank is registered with HSBC UK IBAN",
    officialWebsite: "our sole official website is"
  });
  const [isLoading, setIsLoading] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const footerTexts = [
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
  ];

  // Check cache first
  const getCachedTranslations = (language: string): FooterTranslations | null => {
    try {
      const cached = localStorage.getItem(`${FOOTER_CACHE_KEY}_${language}`);
      if (cached) {
        const { translations: cachedTranslations, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_DURATION) {
          return cachedTranslations;
        }
      }
    } catch (error) {
      console.warn('Footer cache read error:', error);
    }
    return null;
  };

  // Save to cache
  const setCachedTranslations = (language: string, translations: FooterTranslations) => {
    try {
      localStorage.setItem(`${FOOTER_CACHE_KEY}_${language}`, JSON.stringify({
        translations,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.warn('Footer cache write error:', error);
    }
  };

  useEffect(() => {
    if (currentLanguage === 'EN') {
      return; // Use default English translations
    }

    // Cancel previous request if still pending
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Check cache first
    const cached = getCachedTranslations(currentLanguage);
    if (cached) {
      setTranslations(cached);
      return;
    }

    // Create new abort controller for this request
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    setIsLoading(true);

    // Super-fast high-priority batch translation request
    const startTime = Date.now();
    console.log(`[Footer Optimization] Starting batch translation for ${footerTexts.length} texts to ${currentLanguage}`);
    
    fetch('/api/translate/batch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        texts: footerTexts,
        targetLanguage: currentLanguage,
        priority: 'high'
      }),
      signal
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`Translation failed: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      if (signal.aborted) return;

      const translatedTexts = data.translations.map((t: any) => t.translatedText);
      
      const newTranslations: FooterTranslations = {
        allRightsReserved: translatedTexts[0] || footerTexts[0],
        privacyPolicy: translatedTexts[1] || footerTexts[1],
        termsOfService: translatedTexts[2] || footerTexts[2],
        cookiePolicy: translatedTexts[3] || footerTexts[3],
        communityGuidelines: translatedTexts[4] || footerTexts[4],
        contactUs: translatedTexts[5] || footerTexts[5],
        faq: translatedTexts[6] || footerTexts[6],
        shipping: translatedTexts[7] || footerTexts[7],
        partnerships: translatedTexts[8] || footerTexts[8],
        downloadMobileApp: translatedTexts[9] || footerTexts[9],
        downloadOnThe: translatedTexts[10] || footerTexts[10],
        appStore: translatedTexts[11] || footerTexts[11],
        getItOn: translatedTexts[12] || footerTexts[12],
        googlePlay: translatedTexts[13] || footerTexts[13],
        britishCompany: translatedTexts[14] || footerTexts[14],
        registeredOffice: translatedTexts[15] || footerTexts[15],
        bankRegistered: translatedTexts[16] || footerTexts[16],
        officialWebsite: translatedTexts[17] || footerTexts[17]
      };

      setTranslations(newTranslations);
      setCachedTranslations(currentLanguage, newTranslations);
      
      const totalTime = Date.now() - startTime;
      console.log(`[Footer Optimization] Completed in ${totalTime}ms - all ${footerTexts.length} footer texts translated`);
    })
    .catch(error => {
      if (signal.aborted) return;
      console.warn('Footer translation error:', error);
      const fallbackTime = Date.now() - startTime;
      console.log(`[Footer Optimization] Fallback after ${fallbackTime}ms - using original English texts`);
      // Keep original English translations as fallback
    })
    .finally(() => {
      if (!signal.aborted) {
        setIsLoading(false);
      }
    });

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [currentLanguage]);

  return {
    translations,
    isLoading
  };
}