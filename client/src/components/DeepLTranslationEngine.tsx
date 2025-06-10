import { useEffect, useRef, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useLocation } from 'wouter';

// DeepL Translation Engine - Professional machine translation integration
interface DeepLTranslationCache {
  [key: string]: {
    translation: string;
    timestamp: number;
    language: string;
    confidence: number;
  };
}

interface TranslationBatch {
  texts: string[];
  nodes: Map<string, Array<{
    node: Text;
    type: 'text' | 'attribute' | 'svg' | 'special';
    element?: Element;
    attribute?: string;
  }>>;
}

class DeepLMachineTranslationEngine {
  private cache: DeepLTranslationCache = {};
  private translationInProgress: boolean = false;
  private lastScanHash: string = '';
  
  private readonly BATCH_SIZE = 50; // DeepL's recommended batch size
  private readonly CACHE_DURATION = 7200000; // 2 hours for high-quality translations
  private readonly SCAN_THROTTLE = 2000; // 2 seconds between scans
  private readonly DEEPL_API_ENDPOINT = 'https://api-free.deepl.com/v2/translate';

  constructor(private currentLanguage: string) {}

  // DeepL language code mapping
  private mapToDeepLLanguage(code: string): string {
    const deepLMapping: { [key: string]: string } = {
      'EN': 'EN-US',
      'ES': 'ES',
      'FR': 'FR', 
      'DE': 'DE',
      'IT': 'IT',
      'PT': 'PT-PT',
      'RU': 'RU',
      'JA': 'JA',
      'ZH': 'ZH',
      'NL': 'NL',
      'PL': 'PL',
      'SV': 'SV',
      'DA': 'DA',
      'FI': 'FI',
      'NO': 'NB',
      'CS': 'CS',
      'SK': 'SK',
      'SL': 'SL',
      'ET': 'ET',
      'LV': 'LV',
      'LT': 'LT',
      'BG': 'BG',
      'RO': 'RO',
      'EL': 'EL',
      'HU': 'HU',
      'TR': 'TR',
      'UK': 'UK',
      'AR': 'AR',
      'KO': 'KO'
    };
    return deepLMapping[code] || code;
  }

  // Advanced text validation for machine translation
  private isTranslatable(text: string): boolean {
    if (!text || text.length === 0) return false;
    if (/^\s*$/.test(text)) return false;
    
    // Skip technical content that shouldn't be translated
    if (/^https?:\/\//.test(text)) return false; // URLs
    if (/^[a-f0-9]{32,}$/i.test(text)) return false; // Long hashes
    if (/^[\{\}\[\]<>]{2,}$/.test(text)) return false; // Pure symbols
    if (/^[0-9\s\-\+\(\)]+$/.test(text) && text.length > 10) return false; // Phone numbers
    if (/^\d+(\.\d+)?[%$€£¥₹]+$/.test(text)) return false; // Currency amounts
    
    // Accept everything else for high-quality translation
    return true;
  }

  // Content change detection for efficient scanning
  private generateContentHash(): string {
    const textContent = document.body?.textContent || '';
    const attributeContent = Array.from(document.querySelectorAll('[placeholder], [alt], [title], [aria-label]'))
      .map(el => (el.getAttribute('placeholder') || '') + (el.getAttribute('alt') || '') + (el.getAttribute('title') || ''))
      .join('');
    return btoa(textContent + attributeContent).slice(0, 20);
  }

  // Comprehensive content extraction for machine translation
  private extractTranslatableContent(): TranslationBatch {
    const batch: TranslationBatch = {
      texts: [],
      nodes: new Map()
    };

    // Method 1: Text nodes extraction
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          const parent = node.parentElement;
          if (!parent) return NodeFilter.FILTER_REJECT;
          
          const tagName = parent.tagName?.toLowerCase();
          if (['script', 'style', 'noscript'].includes(tagName)) {
            return NodeFilter.FILTER_REJECT;
          }
          
          const text = node.textContent?.trim();
          return text && this.isTranslatable(text) ? 
            NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
        }
      }
    );

    let node;
    while (node = walker.nextNode()) {
      const text = node.textContent!.trim();
      this.addToBatch(batch, text, {
        node: node as Text,
        type: 'text'
      });
    }

    // Method 2: HTML attributes extraction
    const attributeSelectors = [
      'input[placeholder]', 'textarea[placeholder]', 'img[alt]', '[title]',
      '[aria-label]', '[data-tooltip]', '[data-title]', 'option', 'button'
    ];

    attributeSelectors.forEach(selector => {
      document.querySelectorAll(selector).forEach(element => {
        const attributes = ['placeholder', 'alt', 'title', 'aria-label', 'data-tooltip', 'data-title'];
        
        attributes.forEach(attr => {
          const value = element.getAttribute(attr);
          if (value && this.isTranslatable(value)) {
            this.addToBatch(batch, value, {
              node: document.createTextNode(value) as Text,
              type: 'attribute',
              element,
              attribute: attr
            });
          }
        });

        // Handle element text content
        if (['BUTTON', 'OPTION', 'LABEL'].includes(element.tagName)) {
          const textContent = element.textContent?.trim();
          if (textContent && this.isTranslatable(textContent)) {
            this.addToBatch(batch, textContent, {
              node: document.createTextNode(textContent) as Text,
              type: 'attribute',
              element,
              attribute: 'textContent'
            });
          }
        }
      });
    });

    // Method 3: SVG text elements
    document.querySelectorAll('text, tspan, textPath').forEach(element => {
      const text = element.textContent?.trim();
      if (text && this.isTranslatable(text)) {
        this.addToBatch(batch, text, {
          node: document.createTextNode(text) as Text,
          type: 'svg',
          element
        });
      }
    });

    return batch;
  }

  private addToBatch(batch: TranslationBatch, text: string, nodeInfo: any) {
    if (!batch.nodes.has(text)) {
      batch.nodes.set(text, []);
      batch.texts.push(text);
    }
    batch.nodes.get(text)!.push(nodeInfo);
  }

  // DeepL API integration with error handling
  private async translateWithDeepL(texts: string[], targetLanguage: string): Promise<any[]> {
    const apiKey = import.meta.env.VITE_DEEPL_API_KEY;
    
    if (!apiKey) {
      console.warn('[DeepL Engine] API key not configured, falling back to internal API');
      return this.fallbackToInternalAPI(texts, targetLanguage);
    }

    try {
      const formData = new URLSearchParams();
      texts.forEach(text => formData.append('text', text));
      formData.append('target_lang', this.mapToDeepLLanguage(targetLanguage));
      formData.append('preserve_formatting', '1');
      formData.append('tag_handling', 'html');

      const response = await fetch(this.DEEPL_API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Authorization': `DeepL-Auth-Key ${apiKey}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData
      });

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('DeepL API quota exceeded or invalid key');
        } else if (response.status === 456) {
          throw new Error('DeepL API quota exceeded');
        }
        throw new Error(`DeepL API error: ${response.status}`);
      }

      const data = await response.json();
      return data.translations.map((translation: any, index: number) => ({
        originalText: texts[index],
        translatedText: translation.text,
        detectedLanguage: translation.detected_source_language,
        confidence: 1.0 // DeepL provides high-quality translations
      }));

    } catch (error) {
      console.error('[DeepL Engine] Translation failed:', error);
      return this.fallbackToInternalAPI(texts, targetLanguage);
    }
  }

  // Fallback to internal API when DeepL fails
  private async fallbackToInternalAPI(texts: string[], targetLanguage: string): Promise<any[]> {
    try {
      const response = await fetch('/api/translate/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          texts: texts,
          targetLanguage: targetLanguage,
          priority: 'high'
        })
      });

      if (response.ok) {
        const data = await response.json();
        return data.translations;
      }
    } catch (error) {
      console.error('[DeepL Engine] Fallback API also failed:', error);
    }
    
    return texts.map(text => ({
      originalText: text,
      translatedText: text, // Return original if all fails
      confidence: 0
    }));
  }

  // Enhanced caching for machine translations
  private getCachedTranslation(text: string): string | null {
    const cached = this.cache[text];
    if (cached && 
        cached.language === this.currentLanguage && 
        Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.translation;
    }
    return null;
  }

  private setCachedTranslation(text: string, translation: string, confidence: number = 1.0) {
    this.cache[text] = {
      translation,
      timestamp: Date.now(),
      language: this.currentLanguage,
      confidence
    };
  }

  // Batch processing with DeepL optimization
  private async processBatch(batch: TranslationBatch) {
    if (batch.texts.length === 0) return;

    // Check cache first
    const uncachedTexts: string[] = [];
    const cachedTranslations = new Map<string, string>();

    batch.texts.forEach(text => {
      const cached = this.getCachedTranslation(text);
      if (cached) {
        cachedTranslations.set(text, cached);
      } else {
        uncachedTexts.push(text);
      }
    });

    console.log(`[DeepL Engine] Processing ${batch.texts.length} texts (${cachedTranslations.size} cached, ${uncachedTexts.length} new)`);

    // Apply cached translations immediately
    cachedTranslations.forEach((translation, originalText) => {
      this.applyTranslation(originalText, translation, batch.nodes.get(originalText) || []);
    });

    // Translate new texts with DeepL
    if (uncachedTexts.length > 0) {
      const batches = this.chunkArray(uncachedTexts, this.BATCH_SIZE);
      
      for (const textBatch of batches) {
        const translations = await this.translateWithDeepL(textBatch, this.currentLanguage);
        
        translations.forEach(({ originalText, translatedText, confidence }) => {
          this.setCachedTranslation(originalText, translatedText, confidence);
          this.applyTranslation(originalText, translatedText, batch.nodes.get(originalText) || []);
        });

        // Rate limiting for DeepL API
        if (batches.length > 1) {
          await new Promise(resolve => setTimeout(resolve, 200)); // 5 requests per second
        }
      }
    }
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  // Apply translations to DOM elements
  private applyTranslation(originalText: string, translatedText: string, nodeInfos: any[]) {
    nodeInfos.forEach(({ node, type, element, attribute }) => {
      try {
        if (type === 'attribute' && element && attribute) {
          if (attribute === 'textContent') {
            element.textContent = translatedText;
          } else {
            element.setAttribute(attribute, translatedText);
            
            // Live updates for form elements
            if (attribute === 'placeholder') {
              if (element.tagName === 'INPUT') {
                (element as HTMLInputElement).placeholder = translatedText;
              } else if (element.tagName === 'TEXTAREA') {
                (element as HTMLTextAreaElement).placeholder = translatedText;
              }
            }
          }
        } else if (type === 'svg' && element) {
          element.textContent = translatedText;
        } else if (type === 'text' && node.textContent === originalText) {
          node.textContent = translatedText;
        }
      } catch (error) {
        console.warn(`[DeepL Engine] Failed to apply translation: ${error}`);
      }
    });
  }

  // Main translation entry point
  async translatePage() {
    if (this.currentLanguage === 'EN') return;
    if (this.translationInProgress) return;

    const contentHash = this.generateContentHash();
    if (contentHash === this.lastScanHash) return;

    this.lastScanHash = contentHash;
    this.translationInProgress = true;

    try {
      const batch = this.extractTranslatableContent();
      await this.processBatch(batch);
      console.log(`[DeepL Engine] Successfully translated page content to ${this.currentLanguage}`);
    } catch (error) {
      console.error('[DeepL Engine] Page translation failed:', error);
    } finally {
      this.translationInProgress = false;
    }
  }

  updateLanguage(newLanguage: string) {
    this.currentLanguage = newLanguage;
    this.lastScanHash = '';
  }

  cleanup() {
    this.translationInProgress = false;
  }
}

// Smart content observer for dynamic content
class DeepLContentObserver {
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
    let hasSignificantChanges = false;

    mutations.forEach(mutation => {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        const hasTextContent = Array.from(mutation.addedNodes).some(node => 
          node.nodeType === Node.TEXT_NODE || 
          (node.nodeType === Node.ELEMENT_NODE && (node as Element).textContent?.trim())
        );
        if (hasTextContent) hasSignificantChanges = true;
      } else if (mutation.type === 'characterData' || mutation.type === 'attributes') {
        hasSignificantChanges = true;
      }
    });

    if (hasSignificantChanges) {
      if (this.debounceTimer) {
        clearTimeout(this.debounceTimer);
      }
      
      this.debounceTimer = setTimeout(() => {
        this.callback();
      }, 3000); // 3-second debounce for DeepL API efficiency
    }
  }
}

export function DeepLTranslationEngine() {
  const [location] = useLocation();
  const { currentLanguage } = useLanguage();
  const engineRef = useRef<DeepLMachineTranslationEngine | null>(null);
  const observerRef = useRef<DeepLContentObserver | null>(null);

  // Initialize DeepL translation engine
  useEffect(() => {
    engineRef.current = new DeepLMachineTranslationEngine(currentLanguage);
    
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

  // Main translation logic with DeepL optimization
  useEffect(() => {
    if (currentLanguage === 'EN') {
      if (observerRef.current) {
        observerRef.current.stop();
        observerRef.current = null;
      }
      return;
    }

    const translateCallback = () => {
      if (engineRef.current) {
        engineRef.current.translatePage();
      }
    };

    // Initial translation
    const initialTimer = setTimeout(translateCallback, 100);

    // Set up content observer for dynamic updates
    if (observerRef.current) {
      observerRef.current.stop();
    }
    observerRef.current = new DeepLContentObserver(translateCallback);
    observerRef.current.start();

    // Progressive scans for dynamic content
    const progressiveTimers = [
      setTimeout(translateCallback, 2000),  // Component updates
      setTimeout(translateCallback, 5000),  // Lazy content
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

export default DeepLTranslationEngine;