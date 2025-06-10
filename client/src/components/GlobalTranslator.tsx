import { useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useLocation } from 'wouter';

export function GlobalTranslator() {
  const [location] = useLocation();
  const { currentLanguage } = useLanguage();

  useEffect(() => {
    // Auto-translate all visible text when language or location changes
    console.log(`[Global Translator] Language changed to: ${currentLanguage}, Location: ${location}`);
    if (currentLanguage !== 'EN') {
      const timer = setTimeout(() => {
        translatePageContent();
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [location, currentLanguage]);

  // Also trigger translation on mount
  useEffect(() => {
    if (currentLanguage !== 'EN') {
      const timer = setTimeout(() => {
        console.log('[Global Translator] Initial translation trigger');
        translatePageContent();
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, []);

  const isTextTranslatable = (text: string): boolean => {
    if (!text || text.length === 0) return false;
    
    // Only skip pure whitespace and technical patterns
    if (/^\s*$/.test(text)) return false;
    if (/^[\{\}\[\]<>\/\\]+$/.test(text)) return false; // Only technical symbols
    if (/^https?:\/\//.test(text)) return false; // URLs
    if (/^[a-f0-9]{32,}$/i.test(text)) return false; // Hashes/IDs
    
    // Accept EVERYTHING else including:
    // - Numbers: "1", "2024", "$50"
    // - Single chars: "A", "B", "€"
    // - Symbols: "★", "♥", "✓"
    // - Mixed content: "v1.2", "COVID-19"
    
    return true;
  };

  const translatePageContent = async () => {
    if (currentLanguage === 'EN') return;

    // Get all text nodes that need translation
    const textNodes = getAllTextNodes();
    const textsToTranslate: string[] = [];
    const nodeMap = new Map<string, Text[]>();
    const skippedTexts: string[] = [];

    textNodes.forEach(node => {
      const text = node.textContent?.trim();
      if (text && text.length > 0) {
        // Additional filtering for meaningful content
        const isTranslatable = isTextTranslatable(text);
        
        if (isTranslatable) {
          if (!nodeMap.has(text)) {
            nodeMap.set(text, []);
            textsToTranslate.push(text);
          }
          nodeMap.get(text)!.push(node);
        } else {
          skippedTexts.push(text);
        }
      }
    });

    console.log(`[Global Translator] Found ${textsToTranslate.length} texts to translate:`, textsToTranslate.slice(0, 10));
    if (skippedTexts.length > 0) {
      console.log(`[Global Translator] Skipped ${skippedTexts.length} non-translatable texts:`, skippedTexts.slice(0, 5));
    }

    if (textsToTranslate.length === 0) return;

    try {
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
        
        data.translations?.forEach(({ originalText, translatedText }: any) => {
          const nodes = nodeMap.get(originalText);
          if (nodes) {
            nodes.forEach(node => {
              const nodeAny = node as any;
              
              if (nodeAny._isAttribute) {
                // Handle attribute text nodes
                const element = nodeAny._sourceElement;
                const attributeName = nodeAny._attributeName;
                
                if (element && attributeName) {
                  if (attributeName === 'textContent') {
                    // Special case for option/optgroup text content
                    element.textContent = translatedText;
                  } else {
                    element.setAttribute(attributeName, translatedText);
                    
                    // Special handling for specific attributes
                    if (attributeName === 'placeholder' && element.tagName === 'INPUT') {
                      (element as HTMLInputElement).placeholder = translatedText;
                    } else if (attributeName === 'placeholder' && element.tagName === 'TEXTAREA') {
                      (element as HTMLTextAreaElement).placeholder = translatedText;
                    }
                  }
                }
              } else if (nodeAny._isSVGText) {
                // Handle SVG text elements
                const element = nodeAny._sourceElement;
                if (element && element.textContent === originalText) {
                  element.textContent = translatedText;
                }
              } else if (nodeAny._isCSSContent) {
                // Handle CSS generated content (can't directly modify, but log for awareness)
                console.log(`[Global Translator] CSS content detected but cannot be translated: "${originalText}"`);
              } else if (nodeAny._isCanvasText) {
                // Handle canvas text data attributes
                const element = nodeAny._sourceElement;
                if (element) {
                  if (element.getAttribute('data-text') === originalText) {
                    element.setAttribute('data-text', translatedText);
                  } else if (element.getAttribute('aria-label') === originalText) {
                    element.setAttribute('aria-label', translatedText);
                  }
                }
              } else {
                // Handle regular text nodes
                if (node.textContent === originalText) {
                  node.textContent = translatedText;
                }
              }
            });
          }
        });
        
        console.log(`[Global Translator] Successfully translated ${data.translations?.length || 0} texts`);
      } else {
        console.error(`[Global Translator] Translation API error:`, response.status);
      }
    } catch (error) {
      console.error('Translation failed:', error);
    }
  };

  const getAllTextNodes = (): Text[] => {
    const textNodes: Text[] = [];
    
    // Method 1: TreeWalker for all visible text nodes
    const walker = document.createTreeWalker(
      document.documentElement, // Start from html element to catch everything
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          const parent = node.parentElement;
          if (!parent) return NodeFilter.FILTER_REJECT;
          
          const tagName = parent.tagName.toLowerCase();
          // Only skip script and style - allow everything else
          if (['script', 'style'].includes(tagName)) {
            return NodeFilter.FILTER_REJECT;
          }
          
          const text = node.textContent?.trim();
          if (!text || text.length === 0) {
            return NodeFilter.FILTER_REJECT;
          }
          
          return NodeFilter.FILTER_ACCEPT;
        }
      }
    );

    let node;
    while (node = walker.nextNode()) {
      textNodes.push(node as Text);
    }
    
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
      'option',
      'optgroup[label]',
      'input[value]:not([type="hidden"]):not([type="password"])',
      'button[value]',
      'meta[name="description"][content]',
      'meta[name="keywords"][content]',
      'link[title]'
    ];
    
    attributeSelectors.forEach(selector => {
      document.querySelectorAll(selector).forEach(element => {
        const attributes = ['placeholder', 'alt', 'title', 'aria-label', 'aria-describedby', 'data-tooltip', 'data-title', 'label', 'value', 'content'];
        
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
        
        // Special handling for option and optgroup text content
        if (element.tagName === 'OPTION' || element.tagName === 'OPTGROUP') {
          const textContent = element.textContent?.trim();
          if (textContent && isTextTranslatable(textContent)) {
            const virtualTextNode = document.createTextNode(textContent);
            (virtualTextNode as any)._isAttribute = true;
            (virtualTextNode as any)._sourceElement = element;
            (virtualTextNode as any)._attributeName = 'textContent';
            textNodes.push(virtualTextNode as Text);
          }
        }
      });
    });
    
    // Method 3: SVG text elements
    const svgTextElements = document.querySelectorAll('text, tspan, textPath');
    svgTextElements.forEach(element => {
      const text = element.textContent?.trim();
      if (text && isTextTranslatable(text)) {
        const virtualTextNode = document.createTextNode(text);
        (virtualTextNode as any)._isSVGText = true;
        (virtualTextNode as any)._sourceElement = element;
        textNodes.push(virtualTextNode as Text);
      }
    });
    
    // Method 4: CSS generated content (::before and ::after)
    try {
      document.querySelectorAll('*').forEach(element => {
        const beforeContent = window.getComputedStyle(element, '::before').content;
        const afterContent = window.getComputedStyle(element, '::after').content;
        
        [beforeContent, afterContent].forEach((content, index) => {
          if (content && content !== 'none' && content !== '""' && content !== "''") {
            const cleanContent = content.replace(/^["']|["']$/g, '');
            if (cleanContent && isTextTranslatable(cleanContent)) {
              const virtualTextNode = document.createTextNode(cleanContent);
              (virtualTextNode as any)._isCSSContent = true;
              (virtualTextNode as any)._sourceElement = element;
              (virtualTextNode as any)._pseudoElement = index === 0 ? 'before' : 'after';
              textNodes.push(virtualTextNode as Text);
            }
          }
        });
      });
    } catch (error) {
      // Ignore CSS content errors - not critical
    }
    
    // Method 5: Canvas and WebGL text (data attributes)
    const canvasElements = document.querySelectorAll('canvas[data-text], canvas[aria-label]');
    canvasElements.forEach(canvas => {
      const textData = canvas.getAttribute('data-text') || canvas.getAttribute('aria-label');
      if (textData && isTextTranslatable(textData)) {
        const virtualTextNode = document.createTextNode(textData);
        (virtualTextNode as any)._isCanvasText = true;
        (virtualTextNode as any)._sourceElement = canvas;
        textNodes.push(virtualTextNode as Text);
      }
    });
    
    console.log(`[Global Translator] Found ${textNodes.length} text nodes in DOM (including attributes)`);
    return textNodes;
  };

  return null;
}