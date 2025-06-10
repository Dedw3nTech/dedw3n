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
    
    // Skip URLs
    if (/^https?:\/\//.test(text)) return false;
    
    // Skip email addresses
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)) return false;
    
    // Skip file paths
    if (/^[\.\/]/.test(text) || text.includes('\\')) return false;
    
    // Skip CSS selectors and HTML attributes
    if (/^[\.\#\[\]]/.test(text)) return false;
    
    // Skip JSON-like strings
    if (/^\{.*\}$/.test(text) || /^\[.*\]$/.test(text)) return false;
    
    // Skip pure punctuation
    if (/^[^\w\s]+$/.test(text)) return false;
    
    // Skip single characters that aren't letters (but allow meaningful single letters)
    if (text.length === 1 && !/[a-zA-Z]/.test(text)) return false;
    
    // Skip pure numbers with currency/math symbols only
    if (/^[\d\s\.\,\(\)\-\+\*\/\%\$\£\€\¥]+$/.test(text)) return false;
    
    // Skip version numbers and technical identifiers
    if (/^v?\d+\.\d+/.test(text)) return false;
    
    // Allow everything else - be inclusive for user content
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
              if (node.textContent === originalText) {
                node.textContent = translatedText;
              }
            });
          }
        });
      }
    } catch (error) {
      console.error('Translation failed:', error);
    }
  };

  const getAllTextNodes = (): Text[] => {
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          const parent = node.parentElement;
          if (!parent) return NodeFilter.FILTER_REJECT;
          
          const tagName = parent.tagName.toLowerCase();
          if (['script', 'style', 'noscript', 'code', 'pre'].includes(tagName)) {
            return NodeFilter.FILTER_REJECT;
          }
          
          // Skip if parent has data-no-translate attribute
          if (parent.hasAttribute('data-no-translate') || parent.closest('[data-no-translate]')) {
            return NodeFilter.FILTER_REJECT;
          }
          
          const text = node.textContent?.trim();
          if (!text || text.length === 0) {
            return NodeFilter.FILTER_REJECT;
          }
          
          // More inclusive filtering - only skip pure whitespace, pure numbers, or very short non-words
          // Allow single characters if they're letters (like "A", "B" for grades, etc.)
          if (/^\s*$/.test(text)) {
            return NodeFilter.FILTER_REJECT;
          }
          
          // Skip pure numbers with no letters, but allow mixed content like "2024", "v1.0", etc.
          if (/^[\d\s\.\,\(\)\-\+\*\/\%\$\£\€\¥]+$/.test(text)) {
            return NodeFilter.FILTER_REJECT;
          }
          
          // Skip very short content that's likely not meaningful text (but allow single meaningful words)
          if (text.length === 1 && !/[a-zA-Z]/.test(text)) {
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
    
    console.log(`[Global Translator] Found ${textNodes.length} text nodes in DOM`);
    return textNodes;
  };

  return null;
}