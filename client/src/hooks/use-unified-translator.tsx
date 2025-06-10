import { useState, useCallback, useRef } from 'react';
import { apiRequest } from '@/lib/queryClient';

interface TranslationRequest {
  texts: string[];
  targetLanguage: string;
  priority: 'instant' | 'high' | 'normal' | 'low';
  wrapping?: {
    maxWidth?: number;
    containerType?: 'button' | 'paragraph' | 'title' | 'menu';
    preserveFormatting?: boolean;
  };
  context?: {
    componentId?: string;
    pageId?: string;
    userAgent?: string;
  };
}

interface TranslationResult {
  originalText: string;
  translatedText: string;
  wrappedText?: string;
  estimatedWidth?: number;
  truncated?: boolean;
}

interface TranslationResponse {
  translations: TranslationResult[];
  cacheHit: boolean;
  processingTime: number;
  batchId: string;
}

export function useUnifiedTranslator() {
  const [isTranslating, setIsTranslating] = useState(false);
  const [metrics, setMetrics] = useState<any>(null);
  const translationCache = useRef(new Map<string, TranslationResult>());

  const translateWithWrapping = useCallback(async (
    texts: string[],
    targetLanguage: string,
    options: {
      priority?: 'instant' | 'high' | 'normal' | 'low';
      wrapping?: {
        maxWidth?: number;
        containerType?: 'button' | 'paragraph' | 'title' | 'menu';
        preserveFormatting?: boolean;
      };
      context?: {
        componentId?: string;
        pageId?: string;
      };
    } = {}
  ): Promise<TranslationResult[]> => {
    if (!texts.length || targetLanguage === 'EN') {
      return texts.map(text => ({
        originalText: text,
        translatedText: text,
        wrappedText: text
      }));
    }

    setIsTranslating(true);

    try {
      const request: TranslationRequest = {
        texts,
        targetLanguage,
        priority: options.priority || 'high',
        wrapping: options.wrapping,
        context: {
          ...options.context,
          userAgent: navigator.userAgent
        }
      };

      console.log(`[Unified Translator] Processing ${texts.length} texts with text wrapping for ${targetLanguage}`);

      const response = await apiRequest<TranslationResponse>('/api/translate/unified', {
        method: 'POST',
        body: JSON.stringify(request),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      // Cache the results
      response.translations.forEach(result => {
        const cacheKey = `${targetLanguage}:${result.originalText}`;
        translationCache.current.set(cacheKey, result);
      });

      console.log(`[Unified Translator] Completed in ${response.processingTime}ms - Cache hit: ${response.cacheHit}`);

      return response.translations;
    } catch (error) {
      console.error('[Unified Translator] Translation failed:', error);
      // Return original texts as fallback
      return texts.map(text => ({
        originalText: text,
        translatedText: text,
        wrappedText: text
      }));
    } finally {
      setIsTranslating(false);
    }
  }, []);

  const translateComponent = useCallback(async (
    texts: string[],
    targetLanguage: string,
    componentType: 'navigation' | 'button' | 'form' | 'content'
  ): Promise<TranslationResult[]> => {
    if (!texts.length || targetLanguage === 'EN') {
      return texts.map(text => ({
        originalText: text,
        translatedText: text,
        wrappedText: text
      }));
    }

    setIsTranslating(true);

    try {
      console.log(`[Component Translator] Processing ${texts.length} texts for ${componentType} component`);

      const response = await apiRequest<TranslationResponse>('/api/translate/component', {
        method: 'POST',
        body: JSON.stringify({
          texts,
          targetLanguage,
          componentType
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      // Cache the results
      response.translations.forEach(result => {
        const cacheKey = `${targetLanguage}:${result.originalText}`;
        translationCache.current.set(cacheKey, result);
      });

      return response.translations;
    } catch (error) {
      console.error('[Component Translator] Translation failed:', error);
      return texts.map(text => ({
        originalText: text,
        translatedText: text,
        wrappedText: text
      }));
    } finally {
      setIsTranslating(false);
    }
  }, []);

  const getMetrics = useCallback(async () => {
    try {
      const response = await apiRequest<any>('/api/translate/unified/metrics');
      setMetrics(response);
      return response;
    } catch (error) {
      console.error('[Unified Translator] Failed to fetch metrics:', error);
      return null;
    }
  }, []);

  const getCachedTranslation = useCallback((text: string, targetLanguage: string): TranslationResult | null => {
    const cacheKey = `${targetLanguage}:${text}`;
    return translationCache.current.get(cacheKey) || null;
  }, []);

  const clearCache = useCallback(() => {
    translationCache.current.clear();
    console.log('[Unified Translator] Cache cleared');
  }, []);

  return {
    translateWithWrapping,
    translateComponent,
    getMetrics,
    getCachedTranslation,
    clearCache,
    isTranslating,
    metrics
  };
}

// Text wrapping utility for manual DOM text processing
export function applyTextWrapping(
  element: HTMLElement,
  wrappedText: string,
  options: {
    estimatedWidth?: number;
    truncated?: boolean;
  } = {}
) {
  if (!element || !wrappedText) return;

  // Apply the wrapped text
  element.textContent = wrappedText;

  // Add CSS classes based on wrapping result
  if (options.truncated) {
    element.classList.add('text-truncated');
    element.title = element.getAttribute('data-original-text') || wrappedText;
  }

  // Set width constraints if specified
  if (options.estimatedWidth) {
    element.style.maxWidth = `${options.estimatedWidth}px`;
  }

  // Add wrapping indicator class
  element.classList.add('text-wrapped');
}

// Component-specific text wrapping configurations
export const WRAPPING_CONFIGS = {
  navigation: {
    maxWidth: 120,
    containerType: 'menu' as const,
    preserveFormatting: true
  },
  button: {
    maxWidth: 150,
    containerType: 'button' as const,
    preserveFormatting: false
  },
  card: {
    maxWidth: 250,
    containerType: 'paragraph' as const,
    preserveFormatting: true
  },
  content: {
    maxWidth: 600,
    containerType: 'paragraph' as const,
    preserveFormatting: true
  },
  title: {
    maxWidth: 400,
    containerType: 'title' as const,
    preserveFormatting: true
  }
};