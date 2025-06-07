// DOM-Safe Translation Component - Prevents link breakage and text alteration
import React, { useState, useEffect, useRef, ReactNode } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

interface DOMSafeTranslationProps {
  children: ReactNode;
  className?: string;
  preserveStructure?: boolean;
  translateAttributes?: string[];
}

interface TextNode {
  text: string;
  index: number;
  parentElement: string;
}

export function DOMSafeTranslation({ 
  children, 
  className = '', 
  preserveStructure = true,
  translateAttributes = ['title', 'placeholder', 'aria-label']
}: DOMSafeTranslationProps) {
  const { translate, currentLanguage } = useLanguage();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const originalContentRef = useRef<string>('');
  const textNodesRef = useRef<TextNode[]>([]);

  // Extract text nodes while preserving DOM structure
  const extractTextNodes = (element: HTMLElement): TextNode[] => {
    const textNodes: TextNode[] = [];
    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          // Skip empty text nodes and whitespace-only nodes
          if (!node.textContent?.trim()) {
            return NodeFilter.FILTER_REJECT;
          }
          
          // Skip text nodes inside script, style, or other non-translatable elements
          const parent = node.parentElement;
          if (parent && ['SCRIPT', 'STYLE', 'CODE', 'PRE'].includes(parent.tagName)) {
            return NodeFilter.FILTER_REJECT;
          }
          
          // Skip text nodes that are part of URLs or email addresses
          const text = node.textContent.trim();
          if (text.includes('@') || text.startsWith('http') || text.startsWith('www.')) {
            return NodeFilter.FILTER_REJECT;
          }
          
          return NodeFilter.FILTER_ACCEPT;
        }
      }
    );

    let node;
    let index = 0;
    while (node = walker.nextNode()) {
      const textContent = node.textContent?.trim();
      if (textContent && textContent.length > 1) {
        textNodes.push({
          text: textContent,
          index: index++,
          parentElement: node.parentElement?.tagName || 'UNKNOWN'
        });
      }
    }

    return textNodes;
  };

  // Translate attributes that should be translated
  const translateAttributes = async (element: HTMLElement) => {
    const attributesToTranslate = ['title', 'placeholder', 'aria-label', 'alt'];
    
    for (const attr of attributesToTranslate) {
      const value = element.getAttribute(attr);
      if (value && value.trim() && currentLanguage !== 'EN') {
        try {
          const translatedValue = await translate(value);
          element.setAttribute(attr, translatedValue);
        } catch (error) {
          console.error(`Failed to translate attribute ${attr}:`, error);
        }
      }
    }

    // Recursively translate attributes in child elements
    for (const child of Array.from(element.children)) {
      await translateAttributes(child as HTMLElement);
    }
  };

  // Apply translations while preserving DOM structure
  const applyTranslations = async () => {
    if (!containerRef.current || currentLanguage === 'EN') return;

    setIsTranslating(true);

    try {
      // Extract text nodes from the current DOM
      const textNodes = extractTextNodes(containerRef.current);
      
      if (textNodes.length === 0) {
        setIsTranslating(false);
        return;
      }

      // Batch translate all text nodes
      const textsToTranslate = textNodes.map(node => node.text);
      const translations = await Promise.all(
        textsToTranslate.map(text => translate(text))
      );

      // Apply translations back to DOM
      const walker = document.createTreeWalker(
        containerRef.current,
        NodeFilter.SHOW_TEXT,
        {
          acceptNode: (node) => {
            if (!node.textContent?.trim()) return NodeFilter.FILTER_REJECT;
            const parent = node.parentElement;
            if (parent && ['SCRIPT', 'STYLE', 'CODE', 'PRE'].includes(parent.tagName)) {
              return NodeFilter.FILTER_REJECT;
            }
            const text = node.textContent.trim();
            if (text.includes('@') || text.startsWith('http') || text.startsWith('www.')) {
              return NodeFilter.FILTER_REJECT;
            }
            return NodeFilter.FILTER_ACCEPT;
          }
        }
      );

      let nodeIndex = 0;
      let node;
      while (node = walker.nextNode()) {
        const textContent = node.textContent?.trim();
        if (textContent && textContent.length > 1 && nodeIndex < translations.length) {
          // Preserve whitespace around the text
          const originalText = node.textContent || '';
          const leadingWhitespace = originalText.match(/^\s*/)?.[0] || '';
          const trailingWhitespace = originalText.match(/\s*$/)?.[0] || '';
          
          node.textContent = leadingWhitespace + translations[nodeIndex] + trailingWhitespace;
          nodeIndex++;
        }
      }

      // Translate attributes
      await translateAttributes(containerRef.current);

    } catch (error) {
      console.error('DOM-safe translation error:', error);
    } finally {
      setIsTranslating(false);
    }
  };

  // Store original content on mount
  useEffect(() => {
    if (containerRef.current && !originalContentRef.current) {
      originalContentRef.current = containerRef.current.innerHTML;
    }
  }, [children]);

  // Apply translations when language changes
  useEffect(() => {
    if (currentLanguage === 'EN' && originalContentRef.current && containerRef.current) {
      // Restore original content for English
      containerRef.current.innerHTML = originalContentRef.current;
    } else {
      // Apply translations for other languages
      const timer = setTimeout(() => {
        applyTranslations();
      }, 100); // Small delay to ensure DOM is ready

      return () => clearTimeout(timer);
    }
  }, [currentLanguage]);

  return (
    <div 
      ref={containerRef}
      className={`${className} ${isTranslating ? 'opacity-90' : ''}`}
      style={{ 
        transition: 'opacity 0.2s ease-in-out',
        minHeight: isTranslating ? '1em' : 'auto'
      }}
    >
      {children}
    </div>
  );
}

// Higher-order component for making any component DOM-safe translatable
export function withDOMSafeTranslation<P extends object>(
  Component: React.ComponentType<P>,
  options: Partial<DOMSafeTranslationProps> = {}
) {
  return function DOMSafeWrappedComponent(props: P) {
    return (
      <DOMSafeTranslation {...options}>
        <Component {...props} />
      </DOMSafeTranslation>
    );
  };
}

// Hook for manual DOM-safe translation
export function useDOMSafeTranslation() {
  const { translate, currentLanguage } = useLanguage();

  const translateElement = async (element: HTMLElement) => {
    if (currentLanguage === 'EN') return;

    const textNodes: { node: Node; originalText: string }[] = [];
    
    // Extract text nodes
    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          const text = node.textContent?.trim();
          if (!text || text.length < 2) return NodeFilter.FILTER_REJECT;
          
          const parent = node.parentElement;
          if (parent && ['SCRIPT', 'STYLE', 'CODE', 'PRE'].includes(parent.tagName)) {
            return NodeFilter.FILTER_REJECT;
          }
          
          if (text.includes('@') || text.startsWith('http') || text.startsWith('www.')) {
            return NodeFilter.FILTER_REJECT;
          }
          
          return NodeFilter.FILTER_ACCEPT;
        }
      }
    );

    let node;
    while (node = walker.nextNode()) {
      textNodes.push({
        node,
        originalText: node.textContent || ''
      });
    }

    // Translate all text nodes
    for (const { node, originalText } of textNodes) {
      try {
        const translated = await translate(originalText.trim());
        const leadingWhitespace = originalText.match(/^\s*/)?.[0] || '';
        const trailingWhitespace = originalText.match(/\s*$/)?.[0] || '';
        node.textContent = leadingWhitespace + translated + trailingWhitespace;
      } catch (error) {
        console.error('Translation error for node:', error);
      }
    }
  };

  return { translateElement };
}