import { useEffect, useRef } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useLocation } from 'wouter';
import { deepLTranslationService } from './DeepLMachineTranslator';

class FinalTranslationEngine {
  private cache = new Map<string, Map<string, string>>();
  private processing = false;
  private currentLang = 'EN';
  private processedTexts = new Set<string>();
  private currentPageContent = '';

  constructor(language: string) {
    this.currentLang = language;
  }

  private isValidText(text: string): boolean {
    if (!text || text.length < 2) return false;
    if (/^[\d\s\-+().,;:!?%$€£¥]+$/.test(text)) return false;
    if (/^https?:\/\//.test(text)) return false;
    if (/^[a-f0-9]{8,}$/i.test(text)) return false;
    if (/^[\{\}\[\]<>\/\\#@$%^&*()_+=|`~]+$/.test(text)) return false;
    return true;
  }

  private hasPageChanged(): boolean {
    const currentContent = document.body.textContent?.substring(0, 1000) || '';
    if (currentContent !== this.currentPageContent) {
      this.currentPageContent = currentContent;
      return true;
    }
    return false;
  }

  private scanPage(): { textElements: Map<string, Element[]>, attributeElements: Map<string, { element: Element, attr: string }[]> } {
    const textElements = new Map<string, Element[]>();
    const attributeElements = new Map<string, { element: Element, attr: string }[]>();

    document.querySelectorAll('*').forEach(element => {
      const tagName = element.tagName?.toLowerCase();
      if (['script', 'style', 'noscript', 'meta', 'link', 'svg', 'path'].includes(tagName)) return;

      // Process text content for leaf elements
      if (element.children.length === 0) {
        const text = element.textContent?.trim();
        if (text && this.isValidText(text) && !this.processedTexts.has(text)) {
          if (!textElements.has(text)) textElements.set(text, []);
          textElements.get(text)!.push(element);
        }
      }

      // Process translatable attributes
      ['placeholder', 'alt', 'title', 'aria-label', 'aria-description'].forEach(attr => {
        const value = element.getAttribute(attr);
        if (value && this.isValidText(value) && !this.processedTexts.has(value)) {
          if (!attributeElements.has(value)) attributeElements.set(value, []);
          attributeElements.get(value)!.push({ element, attr });
        }
      });
    });

    return { textElements, attributeElements };
  }

  private applyTextTranslations(translations: Map<string, string>, textElements: Map<string, Element[]>): number {
    let applied = 0;

    translations.forEach((translation, original) => {
      if (translation === original) return;

      const elements = textElements.get(original);
      if (elements) {
        elements.forEach(element => {
          if (element.textContent?.trim() === original) {
            element.textContent = translation;
            this.processedTexts.add(original);
            applied++;
          }
        });
      }
    });

    return applied;
  }

  private applyAttributeTranslations(translations: Map<string, string>, attributeElements: Map<string, { element: Element, attr: string }[]>): number {
    let applied = 0;

    translations.forEach((translation, original) => {
      if (translation === original) return;

      const elements = attributeElements.get(original);
      if (elements) {
        elements.forEach(({ element, attr }) => {
          if (element.getAttribute(attr) === original) {
            element.setAttribute(attr, translation);
            this.processedTexts.add(original);
            
            // Update live properties
            if (attr === 'placeholder') {
              const input = element as HTMLInputElement | HTMLTextAreaElement;
              if ('placeholder' in input) {
                input.placeholder = translation;
              }
            }
            applied++;
          }
        });
      }
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

    // Only proceed if page content has changed
    if (!this.hasPageChanged()) return;

    this.processing = true;

    try {
      const { textElements, attributeElements } = this.scanPage();
      
      // Collect all unique texts
      const allTexts = new Set([
        ...textElements.keys(),
        ...attributeElements.keys()
      ]);

      if (allTexts.size === 0) return;

      const textsToTranslate: string[] = [];
      const cachedTranslations = new Map<string, string>();

      allTexts.forEach(text => {
        const cached = this.getCached(text);
        if (cached) {
          cachedTranslations.set(text, cached);
        } else {
          textsToTranslate.push(text);
        }
      });

      console.log(`[Final Translation] Processing ${allTexts.size} unique texts for ${this.currentLang}: ${cachedTranslations.size} cached, ${textsToTranslate.length} new`);

      // Apply cached translations
      let totalApplied = 0;
      if (cachedTranslations.size > 0) {
        const textApplied = this.applyTextTranslations(cachedTranslations, textElements);
        const attrApplied = this.applyAttributeTranslations(cachedTranslations, attributeElements);
        totalApplied += textApplied + attrApplied;
        console.log(`[Final Translation] Applied ${totalApplied} cached translations`);
      }

      // Translate new content
      if (textsToTranslate.length > 0) {
        const translations = await deepLTranslationService.translateBatch(textsToTranslate, this.currentLang);
        
        // Cache translations
        translations.forEach((translation, original) => {
          if (translation !== original) {
            this.setCached(original, translation);
          }
        });

        // Apply new translations
        const newTextApplied = this.applyTextTranslations(translations, textElements);
        const newAttrApplied = this.applyAttributeTranslations(translations, attributeElements);
        const newTotal = newTextApplied + newAttrApplied;
        totalApplied += newTotal;
        
        console.log(`[Final Translation] Applied ${newTotal} new translations`);
      }

      console.log(`[Final Translation] Completed ${this.currentLang} translation: ${totalApplied} total elements translated`);

    } catch (error) {
      console.error('[Final Translation] Translation failed:', error);
    } finally {
      this.processing = false;
    }
  }

  updateLanguage(newLanguage: string): void {
    this.currentLang = newLanguage;
    this.processedTexts.clear();
    this.currentPageContent = '';
    
    if (newLanguage !== 'EN') {
      // Single translation attempt after language change
      setTimeout(() => this.translatePage(), 300);
    }
  }

  cleanup(): void {
    this.processing = false;
    this.processedTexts.clear();
  }
}

export function FinalTranslationSystem() {
  const [location] = useLocation();
  const { currentLanguage } = useLanguage();
  const engineRef = useRef<FinalTranslationEngine | null>(null);

  useEffect(() => {
    engineRef.current = new FinalTranslationEngine(currentLanguage);
    return () => engineRef.current?.cleanup();
  }, []);

  useEffect(() => {
    engineRef.current?.updateLanguage(currentLanguage);
  }, [currentLanguage]);

  useEffect(() => {
    if (!engineRef.current || currentLanguage === 'EN') return;

    // Single translation per route change
    const timer = setTimeout(() => {
      engineRef.current?.translatePage();
    }, 600);

    return () => clearTimeout(timer);
  }, [location, currentLanguage]);

  return null;
}

export default FinalTranslationSystem;