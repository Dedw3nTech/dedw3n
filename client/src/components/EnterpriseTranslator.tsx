import { useEffect, useRef, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useLocation } from 'wouter';

// Enterprise-grade translation engine inspired by Transifex DOM
interface TranslationCache {
  [key: string]: {
    translation: string;
    timestamp: number;
    language: string;
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

class EnterpriseTranslationEngine {
  private cache: TranslationCache = {};
  private pendingBatch: TranslationBatch | null = null;
  private batchTimer: NodeJS.Timeout | null = null;
  private lastScanHash: string = '';
  private translationInProgress: boolean = false;
  
  private readonly BATCH_SIZE = 100;
  private readonly BATCH_DELAY = 2000; // 2 second batching
  private readonly CACHE_DURATION = 3600000; // 1 hour
  private readonly SCAN_THROTTLE = 3000; // 3 seconds between scans

  constructor(private currentLanguage: string) {}

  // Intelligent text validation with minimal filtering
  private isTranslatable(text: string): boolean {
    if (!text || text.length === 0) return false;
    if (/^\s*$/.test(text)) return false;
    if (/^https?:\/\//.test(text)) return false;
    if (/^[a-f0-9]{32,}$/i.test(text)) return false;
    return true;
  }

  // Generate content hash for change detection
  private generateContentHash(): string {
    const textContent = document.body?.textContent || '';
    const attributeContent = Array.from(document.querySelectorAll('[placeholder], [alt], [title], [aria-label]'))
      .map(el => (el.getAttribute('placeholder') || '') + (el.getAttribute('alt') || '') + (el.getAttribute('title') || ''))
      .join('');
    return btoa(textContent + attributeContent).slice(0, 20);
  }

  // Comprehensive DOM scanning with enterprise patterns
  private scanDOM(): TranslationBatch {
    const batch: TranslationBatch = {
      texts: [],
      nodes: new Map()
    };

    // Method 1: Text nodes with optimized tree walker
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

    // Method 2: Attribute scanning
    const attributeSelectors = [
      'input[placeholder]', 'textarea[placeholder]', 'img[alt]', '[title]', 
      '[aria-label]', '[data-tooltip]', 'option', 'button'
    ];

    attributeSelectors.forEach(selector => {
      document.querySelectorAll(selector).forEach(element => {
        const attributes = ['placeholder', 'alt', 'title', 'aria-label', 'data-tooltip'];
        
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

        // Special handling for button/option text
        if (['BUTTON', 'OPTION'].includes(element.tagName)) {
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

    // Method 3: SVG elements
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

  // Enterprise-grade caching
  private getCachedTranslation(text: string): string | null {
    const cached = this.cache[text];
    if (cached && 
        cached.language === this.currentLanguage && 
        Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.translation;
    }
    return null;
  }

  private setCachedTranslation(text: string, translation: string) {
    this.cache[text] = {
      translation,
      timestamp: Date.now(),
      language: this.currentLanguage
    };
  }

  // Intelligent batching system
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

    console.log(`[Enterprise Translator] Processing ${batch.texts.length} texts (${cachedTranslations.size} cached, ${uncachedTexts.length} new)`);

    // Apply cached translations immediately
    cachedTranslations.forEach((translation, originalText) => {
      this.applyTranslation(originalText, translation, batch.nodes.get(originalText) || []);
    });

    // Fetch new translations in optimized batches
    if (uncachedTexts.length > 0) {
      const batches = this.chunkArray(uncachedTexts, this.BATCH_SIZE);
      
      for (const textBatch of batches) {
        try {
          const response = await fetch('/api/translate/batch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              texts: textBatch,
              targetLanguage: this.currentLanguage,
              priority: 'normal'
            })
          });

          if (response.ok) {
            const data = await response.json();
            data.translations?.forEach(({ originalText, translatedText }: any) => {
              this.setCachedTranslation(originalText, translatedText);
              this.applyTranslation(originalText, translatedText, batch.nodes.get(originalText) || []);
            });
          }
        } catch (error) {
          console.error('[Enterprise Translator] Batch translation failed:', error);
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

  private applyTranslation(originalText: string, translatedText: string, nodeInfos: any[]) {
    nodeInfos.forEach(({ node, type, element, attribute }) => {
      try {
        if (type === 'attribute' && element && attribute) {
          if (attribute === 'textContent') {
            element.textContent = translatedText;
          } else {
            element.setAttribute(attribute, translatedText);
            
            // Live property updates for form elements
            if (attribute === 'placeholder' && element.tagName === 'INPUT') {
              (element as HTMLInputElement).placeholder = translatedText;
            }
          }
        } else if (type === 'svg' && element) {
          element.textContent = translatedText;
        } else if (type === 'text' && node.textContent === originalText) {
          node.textContent = translatedText;
        }
      } catch (error) {
        console.warn(`[Enterprise Translator] Failed to apply translation: ${error}`);
      }
    });
  }

  // Main translation entry point with intelligent throttling
  async translatePage() {
    if (this.currentLanguage === 'EN') return;
    if (this.translationInProgress) return;

    const contentHash = this.generateContentHash();
    if (contentHash === this.lastScanHash) return; // No content changes

    this.lastScanHash = contentHash;
    this.translationInProgress = true;

    try {
      const batch = this.scanDOM();
      await this.processBatch(batch);
    } catch (error) {
      console.error('[Enterprise Translator] Translation failed:', error);
    } finally {
      this.translationInProgress = false;
    }
  }

  // Clean up resources
  cleanup() {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
    }
    this.pendingBatch = null;
  }

  // Update language context
  updateLanguage(newLanguage: string) {
    this.currentLanguage = newLanguage;
    this.lastScanHash = ''; // Force rescan on language change
  }
}

// Smart mutation observer with enterprise patterns
class SmartContentObserver {
  private observer: MutationObserver;
  private debounceTimer: NodeJS.Timeout | null = null;
  private changeCount: number = 0;
  
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
    let significantChanges = false;

    mutations.forEach(mutation => {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        // Only count significant node additions
        const hasTextNodes = Array.from(mutation.addedNodes).some(node => 
          node.nodeType === Node.TEXT_NODE || 
          (node.nodeType === Node.ELEMENT_NODE && (node as Element).textContent?.trim())
        );
        if (hasTextNodes) significantChanges = true;
      } else if (mutation.type === 'characterData') {
        significantChanges = true;
      } else if (mutation.type === 'attributes') {
        significantChanges = true;
      }
    });

    if (significantChanges) {
      this.changeCount++;
      
      if (this.debounceTimer) {
        clearTimeout(this.debounceTimer);
      }
      
      // Adaptive debouncing based on change frequency
      const debounceTime = this.changeCount > 10 ? 5000 : 3000;
      
      this.debounceTimer = setTimeout(() => {
        this.changeCount = 0;
        this.callback();
      }, debounceTime);
    }
  }
}

export function EnterpriseTranslator() {
  const [location] = useLocation();
  const { currentLanguage } = useLanguage();
  const engineRef = useRef<EnterpriseTranslationEngine | null>(null);
  const observerRef = useRef<SmartContentObserver | null>(null);
  const lastLocationRef = useRef<string>('');

  // Initialize translation engine
  useEffect(() => {
    engineRef.current = new EnterpriseTranslationEngine(currentLanguage);
    
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

  // Main translation logic with smart scheduling
  useEffect(() => {
    if (currentLanguage === 'EN') {
      // Stop observer when in English
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

    // Initial translation with smart timing
    const isLocationChange = location !== lastLocationRef.current;
    lastLocationRef.current = location;
    
    const initialDelay = isLocationChange ? 100 : 500;
    const initialTimer = setTimeout(translateCallback, initialDelay);

    // Set up smart content observer
    if (observerRef.current) {
      observerRef.current.stop();
    }
    observerRef.current = new SmartContentObserver(translateCallback);
    observerRef.current.start();

    // Progressive scans for dynamic content (reduced frequency)
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

export default EnterpriseTranslator;