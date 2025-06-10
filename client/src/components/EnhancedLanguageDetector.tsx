import { useEffect, useRef } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { deepLTranslationService } from './DeepLMachineTranslator';

// Enhanced language detection and translation system
class EnhancedLanguageIntegration {
  private cache = new Map<string, Map<string, string>>();
  private isProcessing = false;
  private currentLang = 'EN';
  private processedElements = new WeakSet<Element>();

  constructor(language: string) {
    this.currentLang = language;
  }

  // Identify all translatable content
  private getTranslatableContent(): Map<string, Element[]> {
    const contentMap = new Map<string, Element[]>();
    
    // Get all potential text elements
    const elements = Array.from(document.querySelectorAll('*')).filter(el => {
      const tag = el.tagName?.toLowerCase();
      return !['script', 'style', 'noscript', 'meta', 'link', 'svg', 'path'].includes(tag);
    });

    elements.forEach(element => {
      // Process direct text content
      if (element.childNodes.length === 1 && element.firstChild?.nodeType === Node.TEXT_NODE) {
        const text = element.textContent?.trim();
        if (text && this.isValidText(text)) {
          if (!contentMap.has(text)) contentMap.set(text, []);
          contentMap.get(text)!.push(element);
        }
      }

      // Process form elements and attributes
      this.processElementAttributes(element, contentMap);
    });

    return contentMap;
  }

  private isValidText(text: string): boolean {
    if (!text || text.length < 2) return false;
    if (/^[\d\s\-+().,]+$/.test(text)) return false; // Numbers/symbols only
    if (/^https?:\/\//.test(text)) return false; // URLs
    if (/^[A-F0-9]{32,}$/i.test(text)) return false; // Hashes
    if (/^[\{\}\[\]<>\/\\]+$/.test(text)) return false; // Markup
    return true;
  }

  private processElementAttributes(element: Element, contentMap: Map<string, Element[]>) {
    const attrs = ['placeholder', 'alt', 'title', 'aria-label', 'data-tooltip'];
    
    attrs.forEach(attr => {
      const value = element.getAttribute(attr);
      if (value && this.isValidText(value)) {
        const key = `[${attr}]${value}`;
        if (!contentMap.has(key)) contentMap.set(key, []);
        contentMap.get(key)!.push(element);
      }
    });
  }

  // Apply translations to elements
  private applyTranslations(translations: Map<string, string>, contentMap: Map<string, Element[]>) {
    let applied = 0;

    translations.forEach((translation, originalKey) => {
      const elements = contentMap.get(originalKey) || [];
      
      elements.forEach(element => {
        try {
          if (originalKey.startsWith('[') && originalKey.includes(']')) {
            // Handle attributes
            const match = originalKey.match(/^\[([^\]]+)\](.+)$/);
            if (match) {
              const [, attr, originalValue] = match;
              if (element.getAttribute(attr) === originalValue) {
                element.setAttribute(attr, translation);
                this.updateLiveProperty(element, attr, translation);
                applied++;
              }
            }
          } else {
            // Handle text content
            if (element.textContent?.trim() === originalKey) {
              element.textContent = translation;
              this.processedElements.add(element);
              applied++;
            }
          }
        } catch (error) {
          console.warn('Translation application failed:', error);
        }
      });
    });

    return applied;
  }

  private updateLiveProperty(element: Element, attr: string, value: string) {
    if (attr === 'placeholder') {
      const input = element as HTMLInputElement | HTMLTextAreaElement;
      if ('placeholder' in input) {
        input.placeholder = value;
      }
    }
  }

  // Cache management
  private getCached(text: string): string | null {
    return this.cache.get(this.currentLang)?.get(text) || null;
  }

  private setCached(text: string, translation: string) {
    if (!this.cache.has(this.currentLang)) {
      this.cache.set(this.currentLang, new Map());
    }
    this.cache.get(this.currentLang)!.set(text, translation);
  }

  // Main translation process
  async translateContent(): Promise<void> {
    if (this.currentLang === 'EN' || this.isProcessing) return;

    this.isProcessing = true;

    try {
      const contentMap = this.getTranslatableContent();
      const textsToTranslate: string[] = [];
      const cachedTranslations = new Map<string, string>();

      // Separate cached and new content
      contentMap.forEach((elements, text) => {
        const cached = this.getCached(text);
        if (cached) {
          cachedTranslations.set(text, cached);
        } else {
          const cleanText = text.startsWith('[') ? text.replace(/^\[[^\]]+\]/, '') : text;
          if (!textsToTranslate.includes(cleanText)) {
            textsToTranslate.push(cleanText);
          }
        }
      });

      console.log(`[Enhanced Lang] Processing ${contentMap.size} elements: ${cachedTranslations.size} cached, ${textsToTranslate.length} new`);

      // Apply cached translations
      if (cachedTranslations.size > 0) {
        const appliedCached = this.applyTranslations(cachedTranslations, contentMap);
        console.log(`[Enhanced Lang] Applied ${appliedCached} cached translations`);
      }

      // Translate new content
      if (textsToTranslate.length > 0) {
        const translations = await deepLTranslationService.translateBatch(textsToTranslate, this.currentLang);
        
        // Map translations back to original keys
        const mappedTranslations = new Map<string, string>();
        contentMap.forEach((elements, originalKey) => {
          const cleanText = originalKey.startsWith('[') ? originalKey.replace(/^\[[^\]]+\]/, '') : originalKey;
          const translation = translations.get(cleanText);
          
          if (translation && translation !== cleanText) {
            mappedTranslations.set(originalKey, translation);
            this.setCached(originalKey, translation);
          }
        });

        const appliedNew = this.applyTranslations(mappedTranslations, contentMap);
        console.log(`[Enhanced Lang] Applied ${appliedNew} new translations to ${this.currentLang}`);
      }

    } catch (error) {
      console.error('[Enhanced Lang] Translation process failed:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  updateLanguage(newLanguage: string): void {
    this.currentLang = newLanguage;
    this.processedElements = new WeakSet(); // Reset for new language
  }

  cleanup(): void {
    this.isProcessing = false;
    this.processedElements = new WeakSet();
  }
}

// Content change observer
class ContentChangeObserver {
  private observer: MutationObserver;
  private debounceTimer: NodeJS.Timeout | null = null;

  constructor(private onContentChange: () => void) {
    this.observer = new MutationObserver((mutations) => {
      const hasContentChanges = mutations.some(mutation => 
        mutation.type === 'childList' || 
        mutation.type === 'characterData' ||
        (mutation.type === 'attributes' && ['placeholder', 'alt', 'title', 'aria-label'].includes(mutation.attributeName || ''))
      );

      if (hasContentChanges) {
        this.scheduleCallback();
      }
    });
  }

  start(): void {
    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ['placeholder', 'alt', 'title', 'aria-label', 'data-tooltip']
    });
  }

  stop(): void {
    this.observer.disconnect();
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
  }

  private scheduleCallback(): void {
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      this.onContentChange();
    }, 1000); // 1-second debounce
  }
}

export function EnhancedLanguageDetector() {
  const { currentLanguage } = useLanguage();
  const integrationRef = useRef<EnhancedLanguageIntegration | null>(null);
  const observerRef = useRef<ContentChangeObserver | null>(null);

  // Initialize language integration
  useEffect(() => {
    integrationRef.current = new EnhancedLanguageIntegration(currentLanguage);
    
    return () => {
      if (integrationRef.current) {
        integrationRef.current.cleanup();
      }
      if (observerRef.current) {
        observerRef.current.stop();
      }
    };
  }, []);

  // Handle language updates
  useEffect(() => {
    if (integrationRef.current) {
      integrationRef.current.updateLanguage(currentLanguage);
    }
  }, [currentLanguage]);

  // Main translation integration
  useEffect(() => {
    if (currentLanguage === 'EN') {
      if (observerRef.current) {
        observerRef.current.stop();
        observerRef.current = null;
      }
      return;
    }

    const translatePage = () => {
      if (integrationRef.current) {
        integrationRef.current.translateContent();
      }
    };

    // Initial translation with progressive scans
    const timers = [
      setTimeout(translatePage, 200),   // Immediate
      setTimeout(translatePage, 800),   // Quick follow-up
      setTimeout(translatePage, 2000),  // Components loaded
      setTimeout(translatePage, 5000),  // Async content
    ];

    // Setup content observer
    if (observerRef.current) {
      observerRef.current.stop();
    }
    observerRef.current = new ContentChangeObserver(translatePage);
    observerRef.current.start();

    return () => {
      timers.forEach(timer => clearTimeout(timer));
      if (observerRef.current) {
        observerRef.current.stop();
        observerRef.current = null;
      }
    };
  }, [currentLanguage]);

  return null;
}

export default EnhancedLanguageDetector;