import { useEffect, useRef, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useLocation } from 'wouter';
import { deepLTranslationService } from './DeepLMachineTranslator';

// Universal translation engine for complete website coverage
class UniversalTranslationEngine {
  private translationCache = new Map<string, Map<string, string>>();
  private elementRegistry = new WeakMap<Element, { original: string; translated: string; type: string }>();
  private isTranslating = false;
  private currentLanguage = 'EN';
  private observer: MutationObserver | null = null;
  private translationQueue = new Set<string>();
  private debounceTimer: NodeJS.Timeout | null = null;

  constructor(language: string) {
    this.currentLanguage = language;
    this.setupMutationObserver();
  }

  private setupMutationObserver() {
    this.observer = new MutationObserver((mutations) => {
      let hasContentChanges = false;

      mutations.forEach(mutation => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach(node => {
            if (node.nodeType === Node.ELEMENT_NODE || 
                (node.nodeType === Node.TEXT_NODE && node.textContent?.trim())) {
              hasContentChanges = true;
            }
          });
        } else if (mutation.type === 'characterData' || 
                   (mutation.type === 'attributes' && this.isTranslatableAttribute(mutation.attributeName))) {
          hasContentChanges = true;
        }
      });

      if (hasContentChanges) {
        this.scheduleTranslation();
      }
    });
  }

  private isTranslatableAttribute(attrName: string | null): boolean {
    return ['placeholder', 'alt', 'title', 'aria-label', 'data-tooltip', 'aria-description'].includes(attrName || '');
  }

  private scheduleTranslation() {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    this.debounceTimer = setTimeout(() => {
      this.translateAllContent();
    }, 500);
  }

  // Enhanced text validation
  private isTranslatableText(text: string): boolean {
    if (!text || typeof text !== 'string') return false;
    
    const trimmed = text.trim();
    if (trimmed.length < 2) return false;
    
    // Skip technical content
    if (/^[\d\s\-+().,;:!?]+$/.test(trimmed)) return false; // Numbers and punctuation only
    if (/^https?:\/\//.test(trimmed)) return false; // URLs
    if (/^[a-f0-9]{8,}$/i.test(trimmed)) return false; // Hex strings/IDs
    if (/^[\{\}\[\]<>\/\\#@$%^&*()_+=|`~]+$/.test(trimmed)) return false; // Symbols only
    if (/^(true|false|null|undefined|\d+px|\d+%|rgb\(|#[a-f0-9]{3,6})$/i.test(trimmed)) return false; // CSS/JS values
    
    // Skip single characters that are likely symbols
    if (trimmed.length === 1 && !/[a-zA-Z]/.test(trimmed)) return false;
    
    return true;
  }

  // Comprehensive element scanning
  private scanForTranslatableContent(): Map<string, Set<{ element: Element; type: 'text' | 'attribute'; attribute?: string }>> {
    const contentMap = new Map<string, Set<{ element: Element; type: 'text' | 'attribute'; attribute?: string }>>();
    
    // Get all elements except technical ones
    const allElements = Array.from(document.querySelectorAll('*')).filter(el => {
      const tagName = el.tagName?.toLowerCase();
      return !['script', 'style', 'noscript', 'meta', 'link', 'head', 'svg', 'path', 'defs', 'clipPath'].includes(tagName);
    });

    allElements.forEach(element => {
      // Process text content
      this.processElementText(element, contentMap);
      
      // Process attributes
      this.processElementAttributes(element, contentMap);
    });

    return contentMap;
  }

  private processElementText(element: Element, contentMap: Map<string, Set<{ element: Element; type: 'text' | 'attribute'; attribute?: string }>>) {
    // Handle elements with direct text content
    const directText = this.getDirectTextContent(element);
    if (directText && this.isTranslatableText(directText)) {
      if (!contentMap.has(directText)) {
        contentMap.set(directText, new Set());
      }
      contentMap.get(directText)!.add({ element, type: 'text' });
    }

    // Handle text nodes within elements
    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_TEXT,
      null
    );

    let textNode;
    while (textNode = walker.nextNode()) {
      const text = textNode.textContent?.trim();
      if (text && this.isTranslatableText(text) && textNode.parentElement) {
        // Make sure this text node belongs directly to meaningful content
        const parent = textNode.parentElement;
        if (parent && !['script', 'style'].includes(parent.tagName?.toLowerCase())) {
          if (!contentMap.has(text)) {
            contentMap.set(text, new Set());
          }
          contentMap.get(text)!.add({ element: parent, type: 'text' });
        }
      }
    }
  }

  private getDirectTextContent(element: Element): string {
    // For leaf elements
    if (element.children.length === 0) {
      return element.textContent?.trim() || '';
    }

    // For elements with children, get only direct text
    let directText = '';
    element.childNodes.forEach(node => {
      if (node.nodeType === Node.TEXT_NODE) {
        directText += node.textContent || '';
      }
    });

    return directText.trim();
  }

  private processElementAttributes(element: Element, contentMap: Map<string, Set<{ element: Element; type: 'text' | 'attribute'; attribute?: string }>>) {
    const translatableAttributes = [
      'placeholder', 'alt', 'title', 'aria-label', 'aria-description', 
      'data-tooltip', 'data-title', 'data-content', 'data-original-title'
    ];

    translatableAttributes.forEach(attr => {
      const value = element.getAttribute(attr);
      if (value && this.isTranslatableText(value)) {
        if (!contentMap.has(value)) {
          contentMap.set(value, new Set());
        }
        contentMap.get(value)!.add({ element, type: 'attribute', attribute: attr });
      }
    });
  }

  // Apply translations to elements
  private applyTranslations(
    translations: Map<string, string>, 
    contentMap: Map<string, Set<{ element: Element; type: 'text' | 'attribute'; attribute?: string }>>
  ): number {
    let applied = 0;

    translations.forEach((translation, originalText) => {
      const targets = contentMap.get(originalText);
      if (!targets) return;

      targets.forEach(target => {
        try {
          if (target.type === 'text') {
            this.applyTextTranslation(target.element, originalText, translation);
            applied++;
          } else if (target.type === 'attribute' && target.attribute) {
            this.applyAttributeTranslation(target.element, target.attribute, originalText, translation);
            applied++;
          }
        } catch (error) {
          console.warn(`Translation application failed for "${originalText}":`, error);
        }
      });
    });

    return applied;
  }

  private applyTextTranslation(element: Element, originalText: string, translation: string) {
    // Handle direct text content
    if (element.children.length === 0 && element.textContent?.trim() === originalText) {
      element.textContent = translation;
      this.elementRegistry.set(element, { original: originalText, translated: translation, type: 'text' });
      return;
    }

    // Handle text nodes within element
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null);
    let textNode;
    while (textNode = walker.nextNode()) {
      if (textNode.textContent?.trim() === originalText) {
        textNode.textContent = translation;
        this.elementRegistry.set(element, { original: originalText, translated: translation, type: 'text' });
        break;
      }
    }
  }

  private applyAttributeTranslation(element: Element, attribute: string, originalText: string, translation: string) {
    if (element.getAttribute(attribute) === originalText) {
      element.setAttribute(attribute, translation);
      this.elementRegistry.set(element, { original: originalText, translated: translation, type: `attr:${attribute}` });

      // Update live DOM properties
      this.updateLiveProperties(element, attribute, translation);
    }
  }

  private updateLiveProperties(element: Element, attribute: string, value: string) {
    if (attribute === 'placeholder') {
      const input = element as HTMLInputElement | HTMLTextAreaElement;
      if ('placeholder' in input) {
        input.placeholder = value;
      }
    } else if (attribute === 'title') {
      (element as any).title = value;
    }
  }

  // Cache management
  private getCachedTranslation(text: string): string | null {
    return this.translationCache.get(this.currentLanguage)?.get(text) || null;
  }

  private setCachedTranslation(text: string, translation: string) {
    if (!this.translationCache.has(this.currentLanguage)) {
      this.translationCache.set(this.currentLanguage, new Map());
    }
    this.translationCache.get(this.currentLanguage)!.set(text, translation);
  }

  // Main translation function
  async translateAllContent(): Promise<void> {
    if (this.currentLanguage === 'EN' || this.isTranslating) return;

    this.isTranslating = true;
    const startTime = Date.now();

    try {
      // Scan for translatable content
      const contentMap = this.scanForTranslatableContent();
      
      // Separate cached and new content
      const textsToTranslate: string[] = [];
      const cachedTranslations = new Map<string, string>();

      contentMap.forEach((targets, text) => {
        const cached = this.getCachedTranslation(text);
        if (cached) {
          cachedTranslations.set(text, cached);
        } else {
          textsToTranslate.push(text);
        }
      });

      console.log(`[Universal Translation] Processing ${contentMap.size} unique texts for ${this.currentLanguage}: ${cachedTranslations.size} cached, ${textsToTranslate.length} new`);

      // Apply cached translations immediately
      if (cachedTranslations.size > 0) {
        const appliedCached = this.applyTranslations(cachedTranslations, contentMap);
        console.log(`[Universal Translation] Applied ${appliedCached} cached translations`);
      }

      // Translate new content in batches
      if (textsToTranslate.length > 0) {
        const batchSize = 50; // Process in smaller batches for better performance
        let totalApplied = 0;

        for (let i = 0; i < textsToTranslate.length; i += batchSize) {
          const batch = textsToTranslate.slice(i, i + batchSize);
          
          try {
            const translations = await deepLTranslationService.translateBatch(batch, this.currentLanguage);
            
            // Cache and apply translations
            translations.forEach((translation, originalText) => {
              if (translation !== originalText) {
                this.setCachedTranslation(originalText, translation);
              }
            });

            const appliedInBatch = this.applyTranslations(translations, contentMap);
            totalApplied += appliedInBatch;

            console.log(`[Universal Translation] Batch ${Math.floor(i/batchSize) + 1}: Applied ${appliedInBatch} translations`);

          } catch (error) {
            console.error(`[Universal Translation] Batch translation failed:`, error);
          }

          // Small delay between batches to prevent API overload
          if (i + batchSize < textsToTranslate.length) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        }

        const duration = Date.now() - startTime;
        console.log(`[Universal Translation] Completed ${this.currentLanguage} translation: ${totalApplied} elements in ${duration}ms`);
      }

    } catch (error) {
      console.error(`[Universal Translation] Translation process failed:`, error);
    } finally {
      this.isTranslating = false;
    }
  }

  // Language change handler
  updateLanguage(newLanguage: string): void {
    this.currentLanguage = newLanguage;
    this.elementRegistry = new WeakMap(); // Reset for new language
    
    if (newLanguage !== 'EN') {
      // Schedule immediate translation for new language
      setTimeout(() => this.translateAllContent(), 100);
    }
  }

  // Start observing content changes
  startObserving(): void {
    if (this.observer && this.currentLanguage !== 'EN') {
      this.observer.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: true,
        attributes: true,
        attributeFilter: ['placeholder', 'alt', 'title', 'aria-label', 'aria-description', 'data-tooltip']
      });
    }
  }

  // Stop observing and cleanup
  cleanup(): void {
    if (this.observer) {
      this.observer.disconnect();
    }
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    this.isTranslating = false;
  }
}

export function UniversalTranslationEngine() {
  const [location] = useLocation();
  const { currentLanguage } = useLanguage();
  const engineRef = useRef<UniversalTranslationEngine | null>(null);

  // Initialize translation engine
  useEffect(() => {
    engineRef.current = new UniversalTranslationEngine(currentLanguage);
    
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

  // Main translation integration
  useEffect(() => {
    if (!engineRef.current) return;

    if (currentLanguage === 'EN') {
      engineRef.current.cleanup();
      return;
    }

    // Progressive translation schedule
    const translationSchedule = [
      { delay: 100, description: 'immediate' },
      { delay: 500, description: 'quick follow-up' },
      { delay: 1200, description: 'components loaded' },
      { delay: 2500, description: 'dynamic content' },
      { delay: 5000, description: 'lazy loaded content' },
    ];

    const timers = translationSchedule.map(({ delay, description }) => 
      setTimeout(() => {
        console.log(`[Universal Translation] Starting ${description} scan for ${currentLanguage}`);
        engineRef.current?.translateAllContent();
      }, delay)
    );

    // Start content observation
    const observerTimer = setTimeout(() => {
      engineRef.current?.startObserving();
    }, 1000);

    return () => {
      timers.forEach(timer => clearTimeout(timer));
      clearTimeout(observerTimer);
      if (engineRef.current) {
        engineRef.current.cleanup();
      }
    };
  }, [location, currentLanguage]);

  return null;
}

export default UniversalTranslationEngine;