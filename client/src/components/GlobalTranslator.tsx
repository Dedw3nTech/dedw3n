import { useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useLocation } from 'wouter';

export function GlobalTranslator() {
  const [location] = useLocation();
  const { currentLanguage } = useLanguage();

  useEffect(() => {
    // Auto-translate all visible text when language or location changes
    if (currentLanguage !== 'EN') {
      const timer = setTimeout(() => {
        translatePageContent();
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [location, currentLanguage]);

  const translatePageContent = async () => {
    if (currentLanguage === 'EN') return;

    // Get all text nodes that need translation
    const textNodes = getAllTextNodes();
    const textsToTranslate: string[] = [];
    const nodeMap = new Map<string, Text[]>();

    textNodes.forEach(node => {
      const text = node.textContent?.trim();
      if (text && text.length > 0) {
        if (!nodeMap.has(text)) {
          nodeMap.set(text, []);
          textsToTranslate.push(text);
        }
        nodeMap.get(text)!.push(node);
      }
    });

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
          if (['script', 'style', 'noscript'].includes(tagName)) {
            return NodeFilter.FILTER_REJECT;
          }
          
          const text = node.textContent?.trim();
          if (!text || text.length < 2) {
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
  };

  return null;
}