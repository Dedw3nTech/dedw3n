import { useEffect, useRef } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useLocation } from 'wouter';
import { deepLTranslationService } from './DeepLMachineTranslator';

// Direct website translation with DeepL - optimized for immediate UI translation
class DirectWebsiteTranslator {
  private cache = new Map<string, Map<string, string>>();
  private isTranslating = false;
  private currentLanguage = 'EN';

  constructor(language: string) {
    this.currentLanguage = language;
  }

  // Simple text validation
  private shouldTranslate(text: string): boolean {
    if (!text || text.trim().length === 0) return false;
    if (/^\s*$/.test(text)) return false;
    if (/^https?:\/\//.test(text)) return false;
    if (/^[a-f0-9]{32,}$/i.test(text)) return false;
    return true;
  }

  // Get all translatable elements
  private getTranslatableElements(): Array<{element: Element, text: string, type: 'text' | 'attr', attr?: string}> {
    const elements: Array<{element: Element, text: string, type: 'text' | 'attr', attr?: string}> = [];
    
    // Get all elements
    document.querySelectorAll('*').forEach(element => {
      const tagName = element.tagName?.toLowerCase();
      
      // Skip technical elements
      if (['script', 'style', 'noscript', 'meta', 'link'].includes(tagName)) {
        return;
      }

      // Check for direct text content
      if (element.childNodes.length === 1 && element.childNodes[0].nodeType === Node.TEXT_NODE) {
        const text = element.textContent?.trim() || '';
        if (this.shouldTranslate(text)) {
          elements.push({element, text, type: 'text'});
        }
      }

      // Check attributes
      ['placeholder', 'alt', 'title', 'aria-label'].forEach(attr => {
        const value = element.getAttribute(attr);
        if (value && this.shouldTranslate(value)) {
          elements.push({element, text: value, type: 'attr', attr});
        }
      });
    });

    return elements;
  }

  // Apply translation to element
  private applyTranslation(item: {element: Element, text: string, type: 'text' | 'attr', attr?: string}, translation: string) {
    try {
      if (item.type === 'text') {
        item.element.textContent = translation;
      } else if (item.type === 'attr' && item.attr) {
        item.element.setAttribute(item.attr, translation);
        
        // Update live properties
        if (item.attr === 'placeholder') {
          if (item.element.tagName === 'INPUT') {
            (item.element as HTMLInputElement).placeholder = translation;
          } else if (item.element.tagName === 'TEXTAREA') {
            (item.element as HTMLTextAreaElement).placeholder = translation;
          }
        }
      }
    } catch (error) {
      console.warn('Translation application failed:', error);
    }
  }

  // Get cached translation
  private getCached(text: string): string | null {
    return this.cache.get(this.currentLanguage)?.get(text) || null;
  }

  // Set cached translation
  private setCached(text: string, translation: string) {
    if (!this.cache.has(this.currentLanguage)) {
      this.cache.set(this.currentLanguage, new Map());
    }
    this.cache.get(this.currentLanguage)!.set(text, translation);
  }

  // Main translation function
  async translatePage(): Promise<void> {
    if (this.currentLanguage === 'EN' || this.isTranslating) return;
    
    this.isTranslating = true;

    try {
      const elements = this.getTranslatableElements();
      const textsToTranslate: string[] = [];
      const elementsByText = new Map<string, Array<{element: Element, text: string, type: 'text' | 'attr', attr?: string}>>();

      // Group elements by text and check cache
      elements.forEach(item => {
        const cached = this.getCached(item.text);
        if (cached) {
          this.applyTranslation(item, cached);
        } else {
          if (!elementsByText.has(item.text)) {
            elementsByText.set(item.text, []);
            textsToTranslate.push(item.text);
          }
          elementsByText.get(item.text)!.push(item);
        }
      });

      console.log(`[DeepL Direct] Found ${elements.length} elements, translating ${textsToTranslate.length} unique texts`);

      // Translate new texts
      if (textsToTranslate.length > 0) {
        const translations = await deepLTranslationService.translateBatch(textsToTranslate, this.currentLanguage);
        
        translations.forEach((translation, originalText) => {
          this.setCached(originalText, translation);
          const items = elementsByText.get(originalText) || [];
          items.forEach(item => this.applyTranslation(item, translation));
        });

        console.log(`[DeepL Direct] Applied ${translations.size} translations for ${this.currentLanguage}`);
      }

    } catch (error) {
      console.error('[DeepL Direct] Translation failed:', error);
    } finally {
      this.isTranslating = false;
    }
  }

  updateLanguage(newLanguage: string): void {
    this.currentLanguage = newLanguage;
  }
}

// Content observer for dynamic updates
class SimpleContentObserver {
  private observer: MutationObserver;
  private timer: NodeJS.Timeout | null = null;

  constructor(private callback: () => void) {
    this.observer = new MutationObserver(() => this.scheduleCallback());
  }

  start(): void {
    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ['placeholder', 'alt', 'title', 'aria-label']
    });
  }

  stop(): void {
    this.observer.disconnect();
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  private scheduleCallback(): void {
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => this.callback(), 2000);
  }
}

export function DeepLDirectTranslator() {
  const [location] = useLocation();
  const { currentLanguage } = useLanguage();
  const translatorRef = useRef<DirectWebsiteTranslator | null>(null);
  const observerRef = useRef<SimpleContentObserver | null>(null);

  // Initialize translator
  useEffect(() => {
    translatorRef.current = new DirectWebsiteTranslator(currentLanguage);
    return () => {
      if (observerRef.current) {
        observerRef.current.stop();
      }
    };
  }, []);

  // Handle language changes
  useEffect(() => {
    if (translatorRef.current) {
      translatorRef.current.updateLanguage(currentLanguage);
    }
  }, [currentLanguage]);

  // Main translation effect
  useEffect(() => {
    if (currentLanguage === 'EN') {
      if (observerRef.current) {
        observerRef.current.stop();
        observerRef.current = null;
      }
      return;
    }

    const translate = () => {
      if (translatorRef.current) {
        translatorRef.current.translatePage();
      }
    };

    // Initial translation
    const initialTimer = setTimeout(translate, 300);

    // Setup observer
    if (observerRef.current) {
      observerRef.current.stop();
    }
    observerRef.current = new SimpleContentObserver(translate);
    observerRef.current.start();

    // Follow-up translations
    const followUpTimers = [
      setTimeout(translate, 1000),
      setTimeout(translate, 3000)
    ];

    return () => {
      clearTimeout(initialTimer);
      followUpTimers.forEach(timer => clearTimeout(timer));
      if (observerRef.current) {
        observerRef.current.stop();
        observerRef.current = null;
      }
    };
  }, [location, currentLanguage]);

  return null;
}

export default DeepLDirectTranslator;