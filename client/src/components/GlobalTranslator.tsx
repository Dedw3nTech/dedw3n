import { useEffect, useRef, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useLocation } from 'wouter';

// Advanced mutation observer for dynamic content detection
class DynamicContentObserver {
  private observer: MutationObserver;
  private translateCallback: () => void;
  private debounceTimer: NodeJS.Timeout | null = null;

  constructor(translateCallback: () => void) {
    this.translateCallback = translateCallback;
    this.observer = new MutationObserver(this.handleMutations.bind(this));
  }

  start() {
    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ['placeholder', 'alt', 'title', 'aria-label', 'value', 'content', 'data-tooltip']
    });
  }

  stop() {
    this.observer.disconnect();
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
  }

  private handleMutations(mutations: MutationRecord[]) {
    let hasTextChanges = false;

    mutations.forEach(mutation => {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        hasTextChanges = true;
      } else if (mutation.type === 'characterData') {
        hasTextChanges = true;
      } else if (mutation.type === 'attributes' && 
                 ['placeholder', 'alt', 'title', 'aria-label', 'value', 'content'].includes(mutation.attributeName!)) {
        hasTextChanges = true;
      }
    });

    if (hasTextChanges) {
      if (this.debounceTimer) {
        clearTimeout(this.debounceTimer);
      }
      this.debounceTimer = setTimeout(() => {
        this.translateCallback();
      }, 200);
    }
  }
}

export function GlobalTranslator() {
  const [location] = useLocation();
  const { currentLanguage } = useLanguage();
  const observerRef = useRef<DynamicContentObserver | null>(null);
  const lastTranslationTime = useRef<number>(0);
  const translationInProgress = useRef<boolean>(false);

  // Enhanced text validation - minimal filtering, maximum inclusion
  const isTextTranslatable = useCallback((text: string): boolean => {
    if (!text || text.length === 0) return false;
    
    // Only skip pure whitespace
    if (/^\s*$/.test(text)) return false;
    
    // Skip obvious technical content only
    if (/^https?:\/\//.test(text)) return false; // URLs
    if (/^[a-f0-9]{32,}$/i.test(text)) return false; // Long hashes
    if (/^[\{\}\[\]<>]{2,}$/.test(text)) return false; // Pure brackets/symbols
    
    // Accept EVERYTHING else including:
    // - Numbers: "1", "2024", "$50", "€15"
    // - Single chars: "A", "B", "€", "£", "★"
    // - Symbols: "♥", "✓", "→", "•"
    // - Mixed content: "v1.2", "COVID-19", "24/7"
    // - Short text: "Go", "Hi", "OK"
    
    return true;
  }, []);

  // Comprehensive DOM traversal including shadow DOM
  const getAllTextNodes = useCallback((): Text[] => {
    const textNodes: Text[] = [];
    const processedShadowRoots = new Set<ShadowRoot>();
    
    // Method 1: Deep DOM traversal with shadow DOM support
    const traverseElement = (root: Element | ShadowRoot | Document) => {
      const walker = document.createTreeWalker(
        root,
        NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT,
        {
          acceptNode: (node) => {
            if (node.nodeType === Node.TEXT_NODE) {
              const parent = node.parentElement;
              if (!parent) return NodeFilter.FILTER_REJECT;
              
              const tagName = parent.tagName?.toLowerCase();
              // Only skip script and style - allow everything else
              if (['script', 'style', 'noscript'].includes(tagName)) {
                return NodeFilter.FILTER_REJECT;
              }
              
              const text = node.textContent?.trim();
              if (!text) return NodeFilter.FILTER_REJECT;
              
              return NodeFilter.FILTER_ACCEPT;
            } else if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as Element;
              // Check for shadow DOM
              if (element.shadowRoot && !processedShadowRoots.has(element.shadowRoot)) {
                processedShadowRoots.add(element.shadowRoot);
                traverseElement(element.shadowRoot);
              }
              return NodeFilter.FILTER_SKIP;
            }
            return NodeFilter.FILTER_REJECT;
          }
        }
      );
      
      let node;
      while (node = walker.nextNode()) {
        if (node.nodeType === Node.TEXT_NODE) {
          textNodes.push(node as Text);
        }
      }
    };

    // Start from document root to catch everything
    traverseElement(document);

    // Method 2: Comprehensive attribute scanning
    const attributeSelectors = [
      'input[placeholder]',
      'textarea[placeholder]',
      'img[alt]',
      '[title]',
      '[aria-label]',
      '[aria-describedby]',
      '[data-tooltip]',
      '[data-title]',
      '[data-text]',
      'option',
      'optgroup[label]',
      'input[value]:not([type="hidden"]):not([type="password"]):not([type="email"]):not([type="url"])',
      'button:not([type="submit"]):not([type="reset"])',
      'meta[name="description"][content]',
      'meta[name="keywords"][content]',
      'link[title]',
      '[role="button"]',
      '[role="tab"]',
      '[role="menuitem"]'
    ];
    
    attributeSelectors.forEach(selector => {
      try {
        document.querySelectorAll(selector).forEach(element => {
          const attributes = [
            'placeholder', 'alt', 'title', 'aria-label', 'aria-describedby', 
            'data-tooltip', 'data-title', 'data-text', 'label', 'value', 'content'
          ];
          
          attributes.forEach(attr => {
            const value = element.getAttribute(attr);
            if (value && value.trim() && isTextTranslatable(value)) {
              const virtualTextNode = document.createTextNode(value);
              (virtualTextNode as any)._isAttribute = true;
              (virtualTextNode as any)._sourceElement = element;
              (virtualTextNode as any)._attributeName = attr;
              textNodes.push(virtualTextNode as Text);
            }
          });
          
          // Special handling for option/optgroup/button text content
          if (['OPTION', 'OPTGROUP', 'BUTTON'].includes(element.tagName)) {
            const textContent = element.textContent?.trim();
            if (textContent && isTextTranslatable(textContent) && 
                !['Submit', 'Reset', 'Cancel', 'OK'].includes(textContent)) {
              const virtualTextNode = document.createTextNode(textContent);
              (virtualTextNode as any)._isAttribute = true;
              (virtualTextNode as any)._sourceElement = element;
              (virtualTextNode as any)._attributeName = 'textContent';
              textNodes.push(virtualTextNode as Text);
            }
          }
        });
      } catch (error) {
        // Continue if selector fails
      }
    });

    // Method 3: SVG text elements
    try {
      document.querySelectorAll('text, tspan, textPath').forEach(element => {
        const text = element.textContent?.trim();
        if (text && isTextTranslatable(text)) {
          const virtualTextNode = document.createTextNode(text);
          (virtualTextNode as any)._isSVGText = true;
          (virtualTextNode as any)._sourceElement = element;
          textNodes.push(virtualTextNode as Text);
        }
      });
    } catch (error) {
      // Continue if SVG query fails
    }

    // Method 4: CSS generated content detection (informational only)
    try {
      let cssContentCount = 0;
      document.querySelectorAll('*').forEach(element => {
        const beforeContent = window.getComputedStyle(element, '::before').content;
        const afterContent = window.getComputedStyle(element, '::after').content;
        
        [beforeContent, afterContent].forEach((content, index) => {
          if (content && content !== 'none' && content !== '""' && content !== "''" && content.length > 2) {
            const cleanContent = content.replace(/^["']|["']$/g, '');
            if (cleanContent && isTextTranslatable(cleanContent)) {
              cssContentCount++;
              // Note: CSS content cannot be directly translated, but we track it
            }
          }
        });
      });
      if (cssContentCount > 0) {
        console.log(`[Global Translator] Detected ${cssContentCount} CSS generated content items (cannot translate)`);
      }
    } catch (error) {
      // CSS content detection is optional
    }

    // Method 5: Canvas and form elements with special attributes
    try {
      document.querySelectorAll('canvas[data-text], canvas[aria-label], [contenteditable="true"]').forEach(element => {
        const textData = element.getAttribute('data-text') || 
                         element.getAttribute('aria-label') ||
                         element.textContent?.trim();
        if (textData && isTextTranslatable(textData)) {
          const virtualTextNode = document.createTextNode(textData);
          (virtualTextNode as any)._isSpecialElement = true;
          (virtualTextNode as any)._sourceElement = element;
          textNodes.push(virtualTextNode as Text);
        }
      });
    } catch (error) {
      // Continue if special element query fails
    }
    
    console.log(`[Global Translator] Found ${textNodes.length} text nodes in DOM (comprehensive scan)`);
    return textNodes;
  }, [isTextTranslatable]);

  // Enhanced translation with comprehensive content handling
  const translatePageContent = useCallback(async () => {
    if (currentLanguage === 'EN') return;
    if (translationInProgress.current) return;
    
    const now = Date.now();
    if (now - lastTranslationTime.current < 100) return; // Prevent spam
    
    translationInProgress.current = true;
    lastTranslationTime.current = now;

    try {
      const textNodes = getAllTextNodes();
      const textsToTranslate: string[] = [];
      const nodeMap = new Map<string, Text[]>();
      const skippedTexts: string[] = [];
      let duplicateCount = 0;

      textNodes.forEach(node => {
        const text = node.textContent?.trim();
        if (text && text.length > 0) {
          if (isTextTranslatable(text)) {
            if (!nodeMap.has(text)) {
              nodeMap.set(text, []);
              textsToTranslate.push(text);
            } else {
              duplicateCount++;
            }
            nodeMap.get(text)!.push(node);
          } else {
            skippedTexts.push(text);
          }
        }
      });

      console.log(`[Global Translator] Processing ${textsToTranslate.length} unique texts (${duplicateCount} duplicates, ${skippedTexts.length} skipped)`);
      
      if (textsToTranslate.length === 0) return;

      const response = await fetch('/api/translate/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          texts: textsToTranslate,
          targetLanguage: currentLanguage,
          priority: 'high'
        })
      });

      if (response.ok) {
        const data = await response.json();
        let translatedCount = 0;
        
        data.translations?.forEach(({ originalText, translatedText }: any) => {
          const nodes = nodeMap.get(originalText);
          if (nodes) {
            nodes.forEach(node => {
              const nodeAny = node as any;
              
              try {
                if (nodeAny._isAttribute) {
                  const element = nodeAny._sourceElement;
                  const attributeName = nodeAny._attributeName;
                  
                  if (element && attributeName) {
                    if (attributeName === 'textContent') {
                      element.textContent = translatedText;
                    } else {
                      element.setAttribute(attributeName, translatedText);
                      
                      // Live property updates
                      if (attributeName === 'placeholder') {
                        if (element.tagName === 'INPUT') {
                          (element as HTMLInputElement).placeholder = translatedText;
                        } else if (element.tagName === 'TEXTAREA') {
                          (element as HTMLTextAreaElement).placeholder = translatedText;
                        }
                      }
                    }
                    translatedCount++;
                  }
                } else if (nodeAny._isSVGText) {
                  const element = nodeAny._sourceElement;
                  if (element && element.textContent === originalText) {
                    element.textContent = translatedText;
                    translatedCount++;
                  }
                } else if (nodeAny._isSpecialElement) {
                  const element = nodeAny._sourceElement;
                  if (element) {
                    if (element.getAttribute('data-text') === originalText) {
                      element.setAttribute('data-text', translatedText);
                    } else if (element.getAttribute('aria-label') === originalText) {
                      element.setAttribute('aria-label', translatedText);
                    } else if (element.hasAttribute('contenteditable')) {
                      element.textContent = translatedText;
                    }
                    translatedCount++;
                  }
                } else {
                  // Regular text nodes
                  if (node.textContent === originalText) {
                    node.textContent = translatedText;
                    translatedCount++;
                  }
                }
              } catch (error) {
                console.warn(`[Global Translator] Failed to apply translation for "${originalText}":`, error);
              }
            });
          }
        });
        
        console.log(`[Global Translator] Successfully applied ${translatedCount} translations`);
      } else {
        console.error(`[Global Translator] Translation API error:`, response.status, await response.text());
      }
    } catch (error) {
      console.error('[Global Translator] Translation failed:', error);
    } finally {
      translationInProgress.current = false;
    }
  }, [currentLanguage, getAllTextNodes, isTextTranslatable]);

  // Enhanced timing with multiple scan strategies
  useEffect(() => {
    console.log(`[Global Translator] Language/location changed: ${currentLanguage}, ${location}`);
    
    if (currentLanguage !== 'EN') {
      // Stop existing observer
      if (observerRef.current) {
        observerRef.current.stop();
        observerRef.current = null;
      }

      // Immediate scan for static content
      const immediateTimer = setTimeout(() => {
        translatePageContent();
      }, 50);

      // Set up dynamic content observer
      observerRef.current = new DynamicContentObserver(translatePageContent);
      observerRef.current.start();

      // Progressive scans for dynamic content
      const progressiveTimers = [
        setTimeout(() => translatePageContent(), 200),   // Fast initial content
        setTimeout(() => translatePageContent(), 500),   // React component updates
        setTimeout(() => translatePageContent(), 1000),  // Lazy loaded content
        setTimeout(() => translatePageContent(), 2000),  // Slow animations/transitions
        setTimeout(() => translatePageContent(), 5000),  // Very slow async content
      ];

      return () => {
        clearTimeout(immediateTimer);
        progressiveTimers.forEach(timer => clearTimeout(timer));
        if (observerRef.current) {
          observerRef.current.stop();
          observerRef.current = null;
        }
      };
    } else {
      // Clean up when switching to English
      if (observerRef.current) {
        observerRef.current.stop();
        observerRef.current = null;
      }
    }
  }, [location, currentLanguage, translatePageContent]);

  // Additional scan on component mount for initial page load
  useEffect(() => {
    if (currentLanguage !== 'EN') {
      const mountTimer = setTimeout(() => {
        console.log('[Global Translator] Mount scan for initial content');
        translatePageContent();
      }, 100);

      return () => clearTimeout(mountTimer);
    }
  }, [currentLanguage, translatePageContent]);

  return null;
}

export default GlobalTranslator;