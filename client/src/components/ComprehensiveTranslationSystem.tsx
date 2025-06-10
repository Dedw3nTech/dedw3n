import { useEffect, useRef } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useLocation } from 'wouter';
import { deepLTranslationService } from './DeepLMachineTranslator';

interface TranslationElement {
  element: Element;
  originalText: string;
  type: 'text' | 'attribute';
  attribute?: string;
}

class TranslationCore {
  private cache = new Map<string, Map<string, string>>();
  private processing = false;
  private currentLang = 'EN';
  private observer: MutationObserver | null = null;
  private debounceTimer: NodeJS.Timeout | null = null;

  constructor(language: string) {
    this.currentLang = language;
    this.initializeObserver();
  }

  private initializeObserver() {
    this.observer = new MutationObserver((mutations) => {
      const hasChanges = mutations.some(mutation => 
        mutation.type === 'childList' || 
        mutation.type === 'characterData' ||
        (mutation.type === 'attributes' && this.isWorthyAttribute(mutation.attributeName))
      );

      if (hasChanges) {
        this.scheduleTranslation();
      }
    });
  }

  private isWorthyAttribute(attr: string | null): boolean {
    return ['placeholder', 'alt', 'title', 'aria-label'].includes(attr || '');
  }

  private scheduleTranslation() {
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => this.translatePage(), 800);
  }

  private isValidText(text: string): boolean {
    if (!text || text.length < 2) return false;
    if (/^[\d\s\-+().,;:!?]+$/.test(text)) return false;
    if (/^https?:\/\//.test(text)) return false;
    if (/^[a-f0-9]{8,}$/i.test(text)) return false;
    if (/^[\{\}\[\]<>\/\\#@$%^&*()_+=|`~]+$/.test(text)) return false;
    return true;
  }

  private scanElements(): Map<string, TranslationElement[]> {
    const textMap = new Map<string, TranslationElement[]>();
    
    document.querySelectorAll('*').forEach(element => {
      const tagName = element.tagName?.toLowerCase();
      if (['script', 'style', 'noscript', 'meta', 'link'].includes(tagName)) return;

      // Text content
      if (element.children.length === 0) {
        const text = element.textContent?.trim();
        if (text && this.isValidText(text)) {
          if (!textMap.has(text)) textMap.set(text, []);
          textMap.get(text)!.push({
            element,
            originalText: text,
            type: 'text'
          });
        }
      }

      // Attributes
      ['placeholder', 'alt', 'title', 'aria-label'].forEach(attr => {
        const value = element.getAttribute(attr);
        if (value && this.isValidText(value)) {
          if (!textMap.has(value)) textMap.set(value, []);
          textMap.get(value)!.push({
            element,
            originalText: value,
            type: 'attribute',
            attribute: attr
          });
        }
      });
    });

    return textMap;
  }

  private applyTranslations(translations: Map<string, string>, elementMap: Map<string, TranslationElement[]>): number {
    let applied = 0;

    translations.forEach((translation, original) => {
      const elements = elementMap.get(original);
      if (!elements) return;

      elements.forEach(({ element, type, attribute }) => {
        try {
          if (type === 'text' && element.textContent?.trim() === original) {
            element.textContent = translation;
            applied++;
          } else if (type === 'attribute' && attribute && element.getAttribute(attribute) === original) {
            element.setAttribute(attribute, translation);
            if (attribute === 'placeholder' && element instanceof HTMLInputElement) {
              element.placeholder = translation;
            }
            applied++;
          }
        } catch (error) {
          console.warn('Translation failed:', error);
        }
      });
    });

    return applied;
  }

  private getCached(text: string): string | null {
    return this.cache.get(this.currentLang)?.get(text) || null;
  }

  private setCached(text: string, translation: string) {
    if (!this.cache.has(this.currentLang)) {
      this.cache.set(this.currentLang, new Map());
    }
    this.cache.get(this.currentLang)!.set(text, translation);
  }

  async translatePage(): Promise<void> {
    if (this.currentLang === 'EN' || this.processing) return;

    this.processing = true;

    try {
      const elementMap = this.scanElements();
      const textsToTranslate: string[] = [];
      const cachedTranslations = new Map<string, string>();

      elementMap.forEach((elements, text) => {
        const cached = this.getCached(text);
        if (cached) {
          cachedTranslations.set(text, cached);
        } else {
          textsToTranslate.push(text);
        }
      });

      console.log(`[Translation System] Processing ${elementMap.size} texts: ${cachedTranslations.size} cached, ${textsToTranslate.length} new`);

      // Apply cached translations
      if (cachedTranslations.size > 0) {
        const appliedCached = this.applyTranslations(cachedTranslations, elementMap);
        console.log(`[Translation System] Applied ${appliedCached} cached translations`);
      }

      // Translate new content
      if (textsToTranslate.length > 0) {
        const translations = await deepLTranslationService.translateBatch(textsToTranslate, this.currentLang);
        
        translations.forEach((translation, original) => {
          if (translation !== original) {
            this.setCached(original, translation);
          }
        });

        const appliedNew = this.applyTranslations(translations, elementMap);
        console.log(`[Translation System] Applied ${appliedNew} new translations for ${this.currentLang}`);
      }

    } catch (error) {
      console.error('[Translation System] Failed:', error);
    } finally {
      this.processing = false;
    }
  }

  updateLanguage(newLanguage: string): void {
    this.currentLang = newLanguage;
    if (newLanguage !== 'EN') {
      setTimeout(() => this.translatePage(), 100);
    }
  }

  startObserving(): void {
    if (this.observer && this.currentLang !== 'EN') {
      this.observer.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: true,
        attributes: true,
        attributeFilter: ['placeholder', 'alt', 'title', 'aria-label']
      });
    }
  }

  cleanup(): void {
    if (this.observer) {
      this.observer.disconnect();
    }
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    this.processing = false;
  }
}

export function ComprehensiveTranslationSystem() {
  const [location] = useLocation();
  const { currentLanguage } = useLanguage();
  const systemRef = useRef<TranslationCore | null>(null);

  useEffect(() => {
    systemRef.current = new TranslationCore(currentLanguage);
    return () => systemRef.current?.cleanup();
  }, []);

  useEffect(() => {
    systemRef.current?.updateLanguage(currentLanguage);
  }, [currentLanguage]);

  useEffect(() => {
    if (!systemRef.current || currentLanguage === 'EN') return;

    const timers = [
      setTimeout(() => systemRef.current?.translatePage(), 200),
      setTimeout(() => systemRef.current?.translatePage(), 800),
      setTimeout(() => systemRef.current?.translatePage(), 2000),
      setTimeout(() => systemRef.current?.translatePage(), 4000),
    ];

    const observerTimer = setTimeout(() => systemRef.current?.startObserving(), 1000);

    return () => {
      timers.forEach(timer => clearTimeout(timer));
      clearTimeout(observerTimer);
    };
  }, [location, currentLanguage]);

  return null;
}

export default ComprehensiveTranslationSystem;