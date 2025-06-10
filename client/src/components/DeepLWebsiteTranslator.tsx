import { useEffect, useRef, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useLocation } from 'wouter';
import { deepLTranslationService } from './DeepLMachineTranslator';

// Complete website integration with DeepL translation
class DeepLWebsiteIntegration {
  private cache: Map<string, Map<string, string>> = new Map();
  private translationInProgress: boolean = false;
  private elementMap: WeakMap<Element, string> = new WeakMap();
  private lastLanguage: string = 'EN';

  constructor(private currentLanguage: string) {
    this.lastLanguage = currentLanguage;
  }

  // Identify translatable website content
  private isWebsiteContent(text: string): boolean {
    if (!text || text.trim().length === 0) return false;
    if (/^\s*$/.test(text)) return false;
    
    // Skip purely technical content
    if (/^https?:\/\//.test(text)) return false;
    if (/^[a-f0-9]{32,}$/i.test(text)) return false;
    if (/^[\{\}\[\]<>\/\\]+$/.test(text)) return false;
    
    // Include all meaningful text content
    return true;
  }

  // Extract all website text elements
  private extractWebsiteContent(): Map<string, Set<Element>> {
    const contentMap = new Map<string, Set<Element>>();
    
    // Find all text-containing elements
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_ELEMENT,
      {
        acceptNode: (node) => {
          const element = node as Element;
          const tagName = element.tagName?.toLowerCase();
          
          // Skip non-content elements
          if (['script', 'style', 'noscript', 'meta', 'link'].includes(tagName)) {
            return NodeFilter.FILTER_REJECT;
          }
          
          return NodeFilter.FILTER_ACCEPT;
        }
      }
    );

    let element;
    while (element = walker.nextNode() as Element) {
      // Process text content
      const textContent = this.getElementTextContent(element);
      if (textContent && this.isWebsiteContent(textContent)) {
        if (!contentMap.has(textContent)) {
          contentMap.set(textContent, new Set());
        }
        contentMap.get(textContent)!.add(element);
        this.elementMap.set(element, textContent);
      }

      // Process attributes
      const attributes = ['placeholder', 'alt', 'title', 'aria-label', 'data-tooltip'];
      attributes.forEach(attr => {
        const value = element.getAttribute(attr);
        if (value && this.isWebsiteContent(value)) {
          const key = `attr:${attr}:${value}`;
          if (!contentMap.has(key)) {
            contentMap.set(key, new Set());
          }
          contentMap.get(key)!.add(element);
        }
      });
    }

    return contentMap;
  }

  // Get meaningful text content from element
  private getElementTextContent(element: Element): string {
    // For leaf elements with direct text
    if (element.children.length === 0) {
      return element.textContent?.trim() || '';
    }

    // For elements with minimal children, get direct text
    let directText = '';
    for (let i = 0; i < element.childNodes.length; i++) {
      const node = element.childNodes[i];
      if (node.nodeType === Node.TEXT_NODE) {
        directText += node.textContent || '';
      }
    }
    
    const trimmedText = directText.trim();
    if (trimmedText && trimmedText.length > 0) {
      return trimmedText;
    }

    return '';
  }

  // Apply translations to website elements
  private applyWebsiteTranslations(translations: Map<string, string>, contentMap: Map<string, Set<Element>>) {
    let appliedCount = 0;

    translations.forEach((translatedText, originalKey) => {
      const elements = contentMap.get(originalKey);
      if (!elements) return;

      elements.forEach(element => {
        try {
          if (originalKey.startsWith('attr:')) {
            // Handle attributes
            const [, attr, originalValue] = originalKey.split(':', 3);
            if (element.getAttribute(attr) === originalValue) {
              element.setAttribute(attr, translatedText);
              appliedCount++;

              // Update live properties
              if (attr === 'placeholder') {
                if (element.tagName === 'INPUT') {
                  (element as HTMLInputElement).placeholder = translatedText;
                } else if (element.tagName === 'TEXTAREA') {
                  (element as HTMLTextAreaElement).placeholder = translatedText;
                }
              }
            }
          } else {
            // Handle text content
            const currentText = this.elementMap.get(element);
            if (currentText === originalKey) {
              this.replaceElementText(element, originalKey, translatedText);
              appliedCount++;
            }
          }
        } catch (error) {
          console.warn('[DeepL Website] Failed to apply translation:', error);
        }
      });
    });

    return appliedCount;
  }

  // Replace text content in element
  private replaceElementText(element: Element, originalText: string, translatedText: string) {
    if (element.children.length === 0) {
      // Simple text element
      if (element.textContent?.trim() === originalText) {
        element.textContent = translatedText;
      }
    } else {
      // Element with children - replace only direct text nodes
      for (let i = 0; i < element.childNodes.length; i++) {
        const node = element.childNodes[i];
        if (node.nodeType === Node.TEXT_NODE && node.textContent?.trim() === originalText) {
          node.textContent = translatedText;
          break;
        }
      }
    }
  }

  // Main website translation function
  async translateWebsite() {
    if (this.currentLanguage === 'EN') return;
    if (this.translationInProgress) return;

    this.translationInProgress = true;

    try {
      const contentMap = this.extractWebsiteContent();
      const textsToTranslate: string[] = [];
      const cachedTranslations = new Map<string, string>();

      // Check cache and prepare texts
      contentMap.forEach((elements, text) => {
        const languageCache = this.cache.get(this.currentLanguage);
        const cached = languageCache?.get(text);

        if (cached) {
          cachedTranslations.set(text, cached);
        } else {
          // Extract clean text for translation
          const cleanText = text.startsWith('attr:') ? text.split(':', 3)[2] : text;
          if (cleanText && !textsToTranslate.includes(cleanText)) {
            textsToTranslate.push(cleanText);
          }
        }
      });

      console.log(`[DeepL Website] Processing ${contentMap.size} content elements (${cachedTranslations.size} cached, ${textsToTranslate.length} new)`);

      // Apply cached translations
      if (cachedTranslations.size > 0) {
        const appliedCached = this.applyWebsiteTranslations(cachedTranslations, contentMap);
        console.log(`[DeepL Website] Applied ${appliedCached} cached translations`);
      }

      // Translate new content
      if (textsToTranslate.length > 0) {
        const apiKey = import.meta.env.VITE_DEEPL_API_KEY;
        console.log(`[DeepL Website] Using ${apiKey ? 'DeepL API' : 'fallback API'} for ${textsToTranslate.length} texts`);

        const translations = await deepLTranslationService.translateBatch(textsToTranslate, this.currentLanguage);

        // Build website translation map
        const websiteTranslations = new Map<string, string>();
        contentMap.forEach((elements, originalKey) => {
          const cleanText = originalKey.startsWith('attr:') ? originalKey.split(':', 3)[2] : originalKey;
          const translation = translations.get(cleanText);

          if (translation && translation !== cleanText) {
            websiteTranslations.set(originalKey, translation);
            this.setCachedTranslation(originalKey, translation);
          }
        });

        const appliedNew = this.applyWebsiteTranslations(websiteTranslations, contentMap);
        console.log(`[DeepL Website] Applied ${appliedNew} new translations to ${this.currentLanguage}`);
      }

    } catch (error) {
      console.error('[DeepL Website] Website translation failed:', error);
    } finally {
      this.translationInProgress = false;
    }
  }

  private setCachedTranslation(text: string, translation: string) {
    if (!this.cache.has(this.currentLanguage)) {
      this.cache.set(this.currentLanguage, new Map());
    }
    this.cache.get(this.currentLanguage)!.set(text, translation);
  }

  updateLanguage(newLanguage: string) {
    this.currentLanguage = newLanguage;
    this.elementMap = new WeakMap(); // Reset element map for new language
  }

  cleanup() {
    this.translationInProgress = false;
    this.elementMap = new WeakMap();
  }
}

// Website content observer
class WebsiteContentObserver {
  private observer: MutationObserver;
  private debounceTimer: NodeJS.Timeout | null = null;

  constructor(private callback: () => void) {
    this.observer = new MutationObserver(this.handleMutations.bind(this));
  }

  start() {
    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ['placeholder', 'alt', 'title', 'aria-label', 'data-tooltip']
    });
  }

  stop() {
    this.observer.disconnect();
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
  }

  private handleMutations(mutations: MutationRecord[]) {
    let hasContentChanges = false;

    mutations.forEach(mutation => {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        const hasNewContent = Array.from(mutation.addedNodes).some(node => 
          node.nodeType === Node.ELEMENT_NODE || 
          (node.nodeType === Node.TEXT_NODE && node.textContent?.trim())
        );
        if (hasNewContent) hasContentChanges = true;
      } else if (mutation.type === 'characterData' || mutation.type === 'attributes') {
        hasContentChanges = true;
      }
    });

    if (hasContentChanges) {
      if (this.debounceTimer) {
        clearTimeout(this.debounceTimer);
      }
      
      this.debounceTimer = setTimeout(() => {
        this.callback();
      }, 1500); // 1.5-second debounce for content updates
    }
  }
}

export function DeepLWebsiteTranslator() {
  const [location] = useLocation();
  const { currentLanguage } = useLanguage();
  const integrationRef = useRef<DeepLWebsiteIntegration | null>(null);
  const observerRef = useRef<WebsiteContentObserver | null>(null);

  // Initialize website translation integration
  useEffect(() => {
    integrationRef.current = new DeepLWebsiteIntegration(currentLanguage);
    
    return () => {
      if (integrationRef.current) {
        integrationRef.current.cleanup();
      }
    };
  }, []);

  // Handle language changes
  useEffect(() => {
    if (integrationRef.current) {
      integrationRef.current.updateLanguage(currentLanguage);
    }
  }, [currentLanguage]);

  // Main website translation integration
  useEffect(() => {
    if (currentLanguage === 'EN') {
      if (observerRef.current) {
        observerRef.current.stop();
        observerRef.current = null;
      }
      return;
    }

    const translateWebsite = () => {
      if (integrationRef.current) {
        integrationRef.current.translateWebsite();
      }
    };

    // Initial website translation with immediate scan
    const initialTimer = setTimeout(translateWebsite, 100);

    // Set up content observer for dynamic updates
    if (observerRef.current) {
      observerRef.current.stop();
    }
    observerRef.current = new WebsiteContentObserver(translateWebsite);
    observerRef.current.start();

    // Progressive website scans for comprehensive coverage
    const progressiveTimers = [
      setTimeout(translateWebsite, 500),   // Quick follow-up
      setTimeout(translateWebsite, 1500),  // Component initialization
      setTimeout(translateWebsite, 4000),  // Lazy loaded content
      setTimeout(translateWebsite, 8000),  // Async content
    ];

    return () => {
      clearTimeout(initialTimer);
      progressiveTimers.forEach(timer => clearTimeout(timer));
      if (observerRef.current) {
        observerRef.current.stop();
        observerRef.current = null;
      }
    };
  }, [location, currentLanguage]);

  return null;
}

export default DeepLWebsiteTranslator;