import { useEffect, useCallback, useRef } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

interface TranslationObserver {
  observer: MutationObserver;
  queue: Set<string>;
  timer: NodeJS.Timeout | null;
}

class SiteWideTranslator {
  private static instance: SiteWideTranslator;
  private observers = new Map<string, TranslationObserver>();
  private translationCache = new Map<string, Map<string, string>>();
  private pendingTranslations = new Set<string>();
  private batchTimer: NodeJS.Timeout | null = null;
  private currentLanguage = 'EN';

  static getInstance(): SiteWideTranslator {
    if (!SiteWideTranslator.instance) {
      SiteWideTranslator.instance = new SiteWideTranslator();
    }
    return SiteWideTranslator.instance;
  }

  private constructor() {
    console.log('[Site Translator] Initializing comprehensive translation system');
  }

  setLanguage(language: string) {
    this.currentLanguage = language;
    if (language === 'EN') {
      this.restoreOriginalText();
    } else {
      this.translateAllVisibleText();
    }
  }

  clearCache() {
    console.log('[Site Translator] Clearing translation cache for language change');
    this.translationCache.clear();
    this.pendingTranslations.clear();
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }
  }

  private async translateAllVisibleText() {
    const textNodes = this.getAllTextNodes();
    const textsToTranslate: string[] = [];
    const nodeMap = new Map<string, Text[]>();

    textNodes.forEach(node => {
      const text = node.textContent?.trim();
      if (text && text.length > 0 && !this.isAlreadyTranslated(text)) {
        if (!nodeMap.has(text)) {
          nodeMap.set(text, []);
          textsToTranslate.push(text);
        }
        nodeMap.get(text)!.push(node);
      }
    });

    if (textsToTranslate.length > 0) {
      await this.batchTranslate(textsToTranslate, nodeMap);
    }
  }

  private getAllTextNodes(): Text[] {
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          const parent = node.parentElement;
          if (!parent) return NodeFilter.FILTER_REJECT;
          
          // Skip script, style, and other non-visible elements
          const tagName = parent.tagName.toLowerCase();
          if (['script', 'style', 'noscript', 'textarea'].includes(tagName)) {
            return NodeFilter.FILTER_REJECT;
          }
          
          // Skip if parent is hidden
          const style = window.getComputedStyle(parent);
          if (style.display === 'none' || style.visibility === 'hidden') {
            return NodeFilter.FILTER_REJECT;
          }
          
          // Skip empty or whitespace-only text
          const text = node.textContent?.trim();
          if (!text || text.length === 0) {
            return NodeFilter.FILTER_REJECT;
          }
          
          // Skip numeric-only content
          if (/^\d+(\.\d+)?$/.test(text)) {
            return NodeFilter.FILTER_REJECT;
          }
          
          return NodeFilter.FILTER_ACCEPT;
        }
      }
    );

    const textNodes: Text[] = [];
    let node;
    while (node = walker.nextNode()) {
      textNodes.push(node as Text);
    }
    
    return textNodes;
  }

  private isAlreadyTranslated(text: string): boolean {
    const langCache = this.translationCache.get(this.currentLanguage);
    return langCache?.has(text) || false;
  }

  private async batchTranslate(texts: string[], nodeMap: Map<string, Text[]>) {
    try {
      const response = await fetch('/api/translate/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          texts,
          targetLanguage: this.currentLanguage,
          priority: 'high'
        }),
      });

      if (!response.ok) {
        console.error('[Site Translator] Batch translation failed:', response.status);
        return;
      }

      const data = await response.json();
      const translations: Array<{originalText: string, translatedText: string}> = data.translations;

      // Cache translations
      if (!this.translationCache.has(this.currentLanguage)) {
        this.translationCache.set(this.currentLanguage, new Map());
      }
      const langCache = this.translationCache.get(this.currentLanguage)!;

      // Apply translations to DOM
      translations.forEach(({ originalText, translatedText }) => {
        langCache.set(originalText, translatedText);
        
        const nodes = nodeMap.get(originalText);
        if (nodes) {
          nodes.forEach(node => {
            if (node.textContent === originalText) {
              // Store original text as data attribute for restoration
              if (node.parentElement && !node.parentElement.dataset.originalText) {
                node.parentElement.dataset.originalText = originalText;
              }
              node.textContent = translatedText;
            }
          });
        }
      });

      console.log(`[Site Translator] Translated ${translations.length} text elements to ${this.currentLanguage}`);
    } catch (error) {
      console.error('[Site Translator] Translation error:', error);
    }
  }

  private restoreOriginalText() {
    // Restore all elements with original text data
    const elementsWithOriginal = document.querySelectorAll('[data-original-text]');
    elementsWithOriginal.forEach(element => {
      const originalText = element.dataset.originalText;
      if (originalText) {
        const textNode = this.findDirectTextNode(element);
        if (textNode) {
          textNode.textContent = originalText;
        }
        delete element.dataset.originalText;
      }
    });
  }

  private findDirectTextNode(element: Element): Text | null {
    for (let i = 0; i < element.childNodes.length; i++) {
      const node = element.childNodes[i];
      if (node.nodeType === Node.TEXT_NODE && node.textContent?.trim()) {
        return node as Text;
      }
    }
    return null;
  }

  observePage(pageId: string) {
    if (this.observers.has(pageId)) {
      return; // Already observing
    }

    const observer = new MutationObserver((mutations) => {
      let shouldTranslate = false;
      
      mutations.forEach(mutation => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach(node => {
            if (node.nodeType === Node.ELEMENT_NODE || node.nodeType === Node.TEXT_NODE) {
              shouldTranslate = true;
            }
          });
        }
      });

      if (shouldTranslate && this.currentLanguage !== 'EN') {
        // Debounce translations
        if (this.batchTimer) {
          clearTimeout(this.batchTimer);
        }
        this.batchTimer = setTimeout(() => {
          this.translateAllVisibleText();
        }, 300);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true
    });

    this.observers.set(pageId, {
      observer,
      queue: new Set(),
      timer: null
    });

    console.log(`[Site Translator] Started observing page: ${pageId}`);
  }

  stopObserving(pageId: string) {
    const observerData = this.observers.get(pageId);
    if (observerData) {
      observerData.observer.disconnect();
      if (observerData.timer) {
        clearTimeout(observerData.timer);
      }
      this.observers.delete(pageId);
      console.log(`[Site Translator] Stopped observing page: ${pageId}`);
    }
  }

  cleanup() {
    this.observers.forEach((observerData, pageId) => {
      this.stopObserving(pageId);
    });
    this.translationCache.clear();
    this.pendingTranslations.clear();
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }
  }
}

export function useSiteTranslator(pageId: string = 'default') {
  const { language } = useLanguage();
  const translatorRef = useRef(SiteWideTranslator.getInstance());
  const currentPageRef = useRef(pageId);

  // Handle language changes
  useEffect(() => {
    const translator = translatorRef.current;
    translator.clearCache();
    translator.setLanguage(language);
  }, [language]);

  // Start observing the page
  useEffect(() => {
    const translator = translatorRef.current;
    translator.observePage(pageId);
    currentPageRef.current = pageId;

    return () => {
      translator.stopObserving(pageId);
    };
  }, [pageId]);

  // Translate immediately when component mounts
  useEffect(() => {
    const translator = translatorRef.current;
    if (language !== 'EN') {
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        translator.setLanguage(language);
      }, 100);
    }
  }, [language]);

  const translateNow = useCallback(() => {
    const translator = translatorRef.current;
    if (language !== 'EN') {
      translator.setLanguage(language);
    }
  }, [language]);

  return { translateNow };
}