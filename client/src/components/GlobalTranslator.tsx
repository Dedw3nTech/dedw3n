import { useEffect } from 'react';
import { useMasterBatchTranslation } from '@/hooks/use-master-translation';
import { useLanguage } from '@/contexts/LanguageContext';
import { useLocation } from 'wouter';

export function GlobalTranslator() {
  const [location] = useLocation();
  const { currentLanguage } = useLanguage();

  useEffect(() => {
    if (currentLanguage !== 'EN') {
      const timer = setTimeout(() => {
        translatePageContent();
      }, 500); // Slightly longer delay for comprehensive translation

      return () => clearTimeout(timer);
    }
  }, [location, currentLanguage]);

  const translatePageContent = async () => {
    if (currentLanguage === 'EN') return;

    const textNodes = getAllTextNodes();
    const textsToTranslate: string[] = [];
    const nodeMap = new Map<string, Text[]>();

    textNodes.forEach(node => {
      const text = node.textContent?.trim();
      if (text && text.length > 0 && !isAlreadyTranslated(text)) {
        if (!nodeMap.has(text)) {
          nodeMap.set(text, []);
          textsToTranslate.push(text);
        }
        nodeMap.get(text)!.push(node);
      }
    });

    console.log(`[Global Translator] Found ${textsToTranslate.length} texts to translate for ${currentLanguage}`);

    if (textsToTranslate.length === 0) return;

    try {
      const response = await fetch('/api/translate/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          texts: textsToTranslate,
          targetLanguage: currentLanguage,
          priority: 'instant'
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`[Global Translator] Translated ${data.translations?.length || 0} texts`);
        
        data.translations?.forEach(({ originalText, translatedText }: any) => {
          const nodes = nodeMap.get(originalText);
          if (nodes) {
            nodes.forEach(node => {
              if (node.textContent === originalText) {
                // Store original for restoration
                if (node.parentElement && !node.parentElement.dataset.originalText) {
                  node.parentElement.dataset.originalText = originalText;
                }
                node.textContent = translatedText;
              }
            });
          }
        });
      }
    } catch (error) {
      console.error('[Global Translator] Translation failed:', error);
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
          
          // Skip if marked as no-translate
          if (parent.dataset.noTranslate || parent.dataset.translate === 'no') {
            return NodeFilter.FILTER_REJECT;
          }
          
          const text = node.textContent?.trim();
          if (!text || text.length < 1) {
            return NodeFilter.FILTER_REJECT;
          }
          
          // Accept all text content with minimal filtering
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

  const isAlreadyTranslated = (text: string): boolean => {
    // Simple heuristic - if it contains non-English characters, likely already translated
    return /[áéíóúñüàèìòùâêîôûäëïöçßæøåłżščžýřť]/i.test(text);
  };

  return null;
}