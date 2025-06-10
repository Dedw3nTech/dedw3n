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
    
    // Only skip pure whitespace
    if (/^\s*$/.test(text)) return false;
    
    // Allow EVERYTHING else - be maximally inclusive
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
                  element.setAttribute(attributeName, translatedText);
                  
                  // Special handling for specific attributes
                  if (attributeName === 'placeholder' && element.tagName === 'INPUT') {
                    (element as HTMLInputElement).placeholder = translatedText;
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
    
    // Method 2: Find text in input placeholders, alt texts, titles
    const elementsWithText = document.querySelectorAll('input[placeholder], img[alt], [title], [aria-label]');
    elementsWithText.forEach(element => {
      const placeholder = element.getAttribute('placeholder');
      const alt = element.getAttribute('alt');
      const title = element.getAttribute('title');
      const ariaLabel = element.getAttribute('aria-label');
      
      [placeholder, alt, title, ariaLabel].forEach(text => {
        if (text && text.trim()) {
          // Create a virtual text node for attribute text
          const virtualTextNode = document.createTextNode(text);
          (virtualTextNode as any)._isAttribute = true;
          (virtualTextNode as any)._sourceElement = element;
          (virtualTextNode as any)._attributeName = 
            text === placeholder ? 'placeholder' :
            text === alt ? 'alt' :
            text === title ? 'title' : 'aria-label';
          textNodes.push(virtualTextNode as Text);
        }
      });
    });
    
    // Method 3: Find text in button values and form labels
    const formElements = document.querySelectorAll('input[value], button[value], option, label');
    formElements.forEach(element => {
      const value = element.getAttribute('value') || (element as HTMLElement).innerText;
      if (value && value.trim() && value !== 'Submit' && value !== 'Reset') {
        const virtualTextNode = document.createTextNode(value);
        (virtualTextNode as any)._isAttribute = true;
        (virtualTextNode as any)._sourceElement = element;
        (virtualTextNode as any)._attributeName = 'value';
        textNodes.push(virtualTextNode as Text);
      }
    });
    
    console.log(`[Global Translator] Found ${textNodes.length} text nodes in DOM (including attributes)`);
    return textNodes;
  };

  return null;
}