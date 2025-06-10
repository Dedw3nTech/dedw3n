import { useEffect, useRef, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useLocation } from 'wouter';
import { deepLTranslationService } from './DeepLMachineTranslator';

// DeepL UI Text Translator - Translates website interface elements
class DeepLUITranslationEngine {
  private cache: Map<string, Map<string, string>> = new Map();
  private translationInProgress: boolean = false;
  private lastScanTime: number = 0;
  private readonly SCAN_THROTTLE = 2000; // 2 seconds between scans

  constructor(private currentLanguage: string) {}

  // UI text patterns that should be translated
  private isUIText(text: string): boolean {
    if (!text || text.length === 0) return false;
    if (/^\s*$/.test(text)) return false;
    
    // Skip technical content
    if (/^https?:\/\//.test(text)) return false;
    if (/^[a-f0-9]{32,}$/i.test(text)) return false;
    if (/^\d+(\.\d+)?[%$€£¥₹]+$/.test(text)) return false;
    if (/^[\{\}\[\]<>]+$/.test(text)) return false;
    
    // Include common UI text patterns
    const uiPatterns = [
      'Add to Cart', 'Shopping Cart', 'Orders & Returns', 'Vendor Dashboard',
      'Marketplace', 'Community', 'Dating', 'Contact', 'Currency', 'Language',
      'Electronics', 'Home & Garden', 'Beauty & Personal Care', 'Sports & Outdoors',
      'Books & Media', 'Product Status', 'On Sale', 'New Arrivals', 'Reset Filters',
      'Add Product/Service', 'Sold by', 'Sale', 'Liked', 'Dedw3n'
    ];
    
    // Check if text matches UI patterns or is general interface text
    if (uiPatterns.some(pattern => text.includes(pattern))) return true;
    if (text.length < 50 && /^[A-Za-z\s&\-']+$/.test(text)) return true;
    
    return true;
  }

  // Extract translatable UI elements
  private extractUIElements(): Map<string, Element[]> {
    const textElementMap = new Map<string, Element[]>();
    
    // Target specific UI selectors
    const uiSelectors = [
      'nav', 'header', 'button', 'a', 'label', 'span', 'div',
      '.nav-link', '.menu-item', '.button', '.link', '.title',
      '[role="button"]', '[role="link"]', '[role="menuitem"]'
    ];
    
    uiSelectors.forEach(selector => {
      try {
        document.querySelectorAll(selector).forEach(element => {
          // Skip if element has input/form elements that shouldn't be translated
          if (['INPUT', 'TEXTAREA', 'SELECT', 'SCRIPT', 'STYLE'].includes(element.tagName)) {
            return;
          }
          
          // Get direct text content (not nested)
          const textContent = this.getDirectTextContent(element);
          if (textContent && this.isUIText(textContent)) {
            if (!textElementMap.has(textContent)) {
              textElementMap.set(textContent, []);
            }
            textElementMap.get(textContent)!.push(element);
          }
          
          // Check attributes
          const attributes = ['placeholder', 'alt', 'title', 'aria-label'];
          attributes.forEach(attr => {
            const value = element.getAttribute(attr);
            if (value && this.isUIText(value)) {
              const key = `${attr}:${value}`;
              if (!textElementMap.has(key)) {
                textElementMap.set(key, []);
              }
              textElementMap.get(key)!.push(element);
            }
          });
        });
      } catch (error) {
        // Continue if selector fails
      }
    });
    
    return textElementMap;
  }

  // Get direct text content (not from nested elements)
  private getDirectTextContent(element: Element): string {
    let text = '';
    Array.from(element.childNodes).forEach(node => {
      if (node.nodeType === Node.TEXT_NODE) {
        text += node.textContent || '';
      }
    });
    return text.trim();
  }

  // Apply translations to UI elements
  private async applyUITranslations(translations: Map<string, string>, elementMap: Map<string, Element[]>) {
    translations.forEach((translatedText, originalKey) => {
      const elements = elementMap.get(originalKey);
      if (!elements) return;
      
      elements.forEach(element => {
        try {
          if (originalKey.includes(':')) {
            // Handle attributes
            const [attr, originalText] = originalKey.split(':', 2);
            if (element.getAttribute(attr) === originalText) {
              element.setAttribute(attr, translatedText);
              
              // Update live properties for form elements
              if (attr === 'placeholder') {
                if (element.tagName === 'INPUT') {
                  (element as HTMLInputElement).placeholder = translatedText;
                } else if (element.tagName === 'TEXTAREA') {
                  (element as HTMLTextAreaElement).placeholder = translatedText;
                }
              }
            }
          } else {
            // Handle text content - only replace direct text, not nested
            const directText = this.getDirectTextContent(element);
            if (directText === originalKey) {
              // Replace only the direct text nodes
              Array.from(element.childNodes).forEach(node => {
                if (node.nodeType === Node.TEXT_NODE && node.textContent?.trim() === directText) {
                  node.textContent = translatedText;
                }
              });
            }
          }
        } catch (error) {
          console.warn('[DeepL UI] Failed to apply translation:', error);
        }
      });
    });
  }

  // Main UI translation function
  async translateUI() {
    if (this.currentLanguage === 'EN') return;
    if (this.translationInProgress) return;
    
    const now = Date.now();
    if (now - this.lastScanTime < this.SCAN_THROTTLE) return;
    
    this.translationInProgress = true;
    this.lastScanTime = now;

    try {
      const elementMap = this.extractUIElements();
      const textsToTranslate: string[] = [];
      const cachedTranslations = new Map<string, string>();
      
      // Check cache and prepare texts for translation
      elementMap.forEach((elements, text) => {
        const languageCache = this.cache.get(this.currentLanguage);
        const cached = languageCache?.get(text);
        
        if (cached) {
          cachedTranslations.set(text, cached);
        } else {
          // Clean attribute keys for translation
          const cleanText = text.includes(':') ? text.split(':', 2)[1] : text;
          textsToTranslate.push(cleanText);
        }
      });

      console.log(`[DeepL UI] Processing ${elementMap.size} UI elements (${cachedTranslations.size} cached, ${textsToTranslate.length} new)`);

      // Apply cached translations immediately
      if (cachedTranslations.size > 0) {
        this.applyUITranslations(cachedTranslations, elementMap);
      }

      // Translate new texts
      if (textsToTranslate.length > 0) {
        const translations = await deepLTranslationService.translateBatch(textsToTranslate, this.currentLanguage);
        
        // Build translation map for UI elements
        const uiTranslations = new Map<string, string>();
        elementMap.forEach((elements, originalKey) => {
          const cleanText = originalKey.includes(':') ? originalKey.split(':', 2)[1] : originalKey;
          const translation = translations.get(cleanText);
          
          if (translation) {
            uiTranslations.set(originalKey, translation);
            this.setCachedTranslation(originalKey, translation);
          }
        });

        this.applyUITranslations(uiTranslations, elementMap);
        console.log(`[DeepL UI] Applied ${uiTranslations.size} UI translations`);
      }

    } catch (error) {
      console.error('[DeepL UI] UI translation failed:', error);
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
    this.lastScanTime = 0; // Force immediate scan on language change
  }

  cleanup() {
    this.translationInProgress = false;
  }
}

// UI Content Observer for dynamic interface updates
class UIContentObserver {
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
      attributeFilter: ['placeholder', 'alt', 'title', 'aria-label']
    });
  }

  stop() {
    this.observer.disconnect();
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
  }

  private handleMutations(mutations: MutationRecord[]) {
    let hasUIChanges = false;

    mutations.forEach(mutation => {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        const hasNewUI = Array.from(mutation.addedNodes).some(node => 
          node.nodeType === Node.ELEMENT_NODE && 
          ['BUTTON', 'A', 'NAV', 'SPAN', 'DIV'].includes((node as Element).tagName)
        );
        if (hasNewUI) hasUIChanges = true;
      } else if (mutation.type === 'characterData' || mutation.type === 'attributes') {
        hasUIChanges = true;
      }
    });

    if (hasUIChanges) {
      if (this.debounceTimer) {
        clearTimeout(this.debounceTimer);
      }
      
      this.debounceTimer = setTimeout(() => {
        this.callback();
      }, 1000); // 1-second debounce for UI updates
    }
  }
}

export function DeepLUITranslator() {
  const [location] = useLocation();
  const { currentLanguage } = useLanguage();
  const engineRef = useRef<DeepLUITranslationEngine | null>(null);
  const observerRef = useRef<UIContentObserver | null>(null);

  // Initialize UI translation engine
  useEffect(() => {
    engineRef.current = new DeepLUITranslationEngine(currentLanguage);
    
    return () => {
      if (engineRef.current) {
        engineRef.current.cleanup();
      }
    };
  }, []);

  // Handle language changes
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.updateLanguage(currentLanguage);
    }
  }, [currentLanguage]);

  // Main UI translation logic
  useEffect(() => {
    if (currentLanguage === 'EN') {
      if (observerRef.current) {
        observerRef.current.stop();
        observerRef.current = null;
      }
      return;
    }

    const translateUI = () => {
      if (engineRef.current) {
        engineRef.current.translateUI();
      }
    };

    // Initial UI translation
    const initialTimer = setTimeout(translateUI, 200);

    // Set up UI content observer
    if (observerRef.current) {
      observerRef.current.stop();
    }
    observerRef.current = new UIContentObserver(translateUI);
    observerRef.current.start();

    // Progressive UI scans
    const progressiveTimers = [
      setTimeout(translateUI, 1000),  // Initial UI load
      setTimeout(translateUI, 3000),  // Component updates
      setTimeout(translateUI, 6000),  // Lazy loaded UI
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

export default DeepLUITranslator;