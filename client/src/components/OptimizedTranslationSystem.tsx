import { useEffect, useRef } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useLocation } from 'wouter';
import { deepLTranslationService } from './DeepLMachineTranslator';

class TranslationEngine {
  private cache = new Map<string, Map<string, string>>();
  private processing = false;
  private currentLang = 'EN';
  private translatedElements = new WeakSet<Element>();
  private lastScanHash = '';

  constructor(language: string) {
    this.currentLang = language;
  }

  private isValidText(text: string): boolean {
    if (!text || text.length < 2) return false;
    if (/^[\d\s\-+().,;:!?]+$/.test(text)) return false;
    if (/^https?:\/\//.test(text)) return false;
    if (/^[a-f0-9]{8,}$/i.test(text)) return false;
    return true;
  }

  private getPageHash(): string {
    return document.body.textContent?.substring(0, 500) || '';
  }

  private scanForContent(): { texts: string[], elementMap: Map<string, Element[]> } {
    const texts: string[] = [];
    const elementMap = new Map<string, Element[]>();
    
    document.querySelectorAll('*').forEach(element => {
      const tagName = element.tagName?.toLowerCase();
      if (['script', 'style', 'noscript', 'meta', 'link'].includes(tagName)) return;
      if (this.translatedElements.has(element)) return;

      // Text content
      if (element.children.length === 0) {
        const text = element.textContent?.trim();
        if (text && this.isValidText(text)) {
          if (!texts.includes(text)) texts.push(text);
          if (!elementMap.has(text)) elementMap.set(text, []);
          elementMap.get(text)!.push(element);
        }
      }

      // Attributes
      ['placeholder', 'alt', 'title', 'aria-label'].forEach(attr => {
        const value = element.getAttribute(attr);
        if (value && this.isValidText(value)) {
          const key = `${attr}:${value}`;
          if (!texts.includes(value)) texts.push(value);
          if (!elementMap.has(key)) elementMap.set(key, []);
          elementMap.get(key)!.push(element);
        }
      });
    });

    return { texts, elementMap };
  }

  private applyTranslations(translations: Map<string, string>, elementMap: Map<string, Element[]>): number {
    let applied = 0;

    translations.forEach((translation, original) => {
      if (translation === original) return;

      // Text elements
      const textElements = elementMap.get(original);
      if (textElements) {
        textElements.forEach(element => {
          if (element.textContent?.trim() === original && !this.translatedElements.has(element)) {
            element.textContent = translation;
            this.translatedElements.add(element);
            applied++;
          }
        });
      }

      // Attribute elements
      ['placeholder', 'alt', 'title', 'aria-label'].forEach(attr => {
        const attrElements = elementMap.get(`${attr}:${original}`);
        if (attrElements) {
          attrElements.forEach(element => {
            if (element.getAttribute(attr) === original && !this.translatedElements.has(element)) {
              element.setAttribute(attr, translation);
              if (attr === 'placeholder' && element instanceof HTMLInputElement) {
                element.placeholder = translation;
              }
              this.translatedElements.add(element);
              applied++;
            }
          });
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

    const currentHash = this.getPageHash();
    if (currentHash === this.lastScanHash) return;
    this.lastScanHash = currentHash;

    this.processing = true;

    try {
      const { texts, elementMap } = this.scanForContent();
      if (texts.length === 0) return;

      const textsToTranslate: string[] = [];
      const cachedTranslations = new Map<string, string>();

      texts.forEach(text => {
        const cached = this.getCached(text);
        if (cached) {
          cachedTranslations.set(text, cached);
        } else {
          textsToTranslate.push(text);
        }
      });

      console.log(`[Optimized Translation] Processing ${texts.length} texts: ${cachedTranslations.size} cached, ${textsToTranslate.length} new`);

      // Apply cached translations
      if (cachedTranslations.size > 0) {
        const appliedCached = this.applyTranslations(cachedTranslations, elementMap);
        console.log(`[Optimized Translation] Applied ${appliedCached} cached translations`);
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
        console.log(`[Optimized Translation] Applied ${appliedNew} new translations for ${this.currentLang}`);
      }

    } catch (error) {
      console.error('[Optimized Translation] Failed:', error);
    } finally {
      this.processing = false;
    }
  }

  updateLanguage(newLanguage: string): void {
    this.currentLang = newLanguage;
    this.translatedElements = new WeakSet();
    this.lastScanHash = '';
    
    if (newLanguage !== 'EN') {
      setTimeout(() => this.translatePage(), 200);
    }
  }

  cleanup(): void {
    this.processing = false;
    this.translatedElements = new WeakSet();
  }
}

export function OptimizedTranslationSystem() {
  const [location] = useLocation();
  const { currentLanguage } = useLanguage();
  const systemRef = useRef<TranslationEngine | null>(null);

  useEffect(() => {
    systemRef.current = new TranslationEngine(currentLanguage);
    return () => systemRef.current?.cleanup();
  }, []);

  useEffect(() => {
    systemRef.current?.updateLanguage(currentLanguage);
  }, [currentLanguage]);

  useEffect(() => {
    if (!systemRef.current || currentLanguage === 'EN') return;

    // Single translation attempt per location/language change
    const timer = setTimeout(() => {
      systemRef.current?.translatePage();
    }, 500);

    return () => clearTimeout(timer);
  }, [location, currentLanguage]);

  return null;
}

export default OptimizedTranslationSystem;