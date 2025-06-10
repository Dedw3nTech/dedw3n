import { translationOptimizer } from './translation-optimizer';

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

interface TranslationResponse {
  translations: Array<{
    originalText: string;
    translatedText: string;
    wrappedText?: string;
    estimatedWidth?: number;
    truncated?: boolean;
  }>;
  cacheHit: boolean;
  processingTime: number;
  batchId: string;
}

interface TextWrapResult {
  wrappedText: string;
  estimatedWidth: number;
  truncated: boolean;
  lineCount: number;
}

class UnifiedTranslationService {
  private static instance: UnifiedTranslationService;
  private translationCache = new Map<string, any>();
  private pendingBatches = new Map<string, Promise<any>>();
  private metrics = {
    totalRequests: 0,
    cacheHits: 0,
    avgProcessingTime: 0,
    wrappingOperations: 0
  };

  static getInstance(): UnifiedTranslationService {
    if (!UnifiedTranslationService.instance) {
      UnifiedTranslationService.instance = new UnifiedTranslationService();
    }
    return UnifiedTranslationService.instance;
  }

  private constructor() {
    console.log('[Unified Translation] Initializing service with text wrapping capabilities');
  }

  async processTranslationRequest(request: TranslationRequest): Promise<TranslationResponse> {
    const startTime = Date.now();
    const batchId = this.generateBatchId();
    
    this.metrics.totalRequests++;

    // Filter and validate texts
    const validTexts = request.texts.filter(text => 
      text && 
      typeof text === 'string' && 
      text.trim().length >= 1 && 
      text.trim().length <= 1000
    );

    if (validTexts.length === 0) {
      return this.createEmptyResponse(batchId, startTime);
    }

    // Check cache first
    const cacheResults = this.checkCache(validTexts, request.targetLanguage);
    const uncachedTexts = cacheResults.uncached;

    let translations: any[] = [...cacheResults.cached];

    // Process uncached translations if any
    if (uncachedTexts.length > 0) {
      try {
        const translationResults = await this.performTranslation(uncachedTexts, request.targetLanguage);
        
        // Cache the new translations
        translationResults.forEach(result => {
          const cacheKey = this.getCacheKey(result.originalText, request.targetLanguage);
          this.translationCache.set(cacheKey, result);
        });

        translations.push(...translationResults);
      } catch (error) {
        console.error('[Unified Translation] Translation failed:', error);
        // Return original texts as fallback
        translations.push(...uncachedTexts.map(text => ({
          originalText: text,
          translatedText: text
        })));
      }
    }

    // Apply text wrapping if requested
    if (request.wrapping) {
      translations = await this.applyTextWrapping(translations, request.wrapping);
    }

    const processingTime = Date.now() - startTime;
    this.updateMetrics(processingTime, cacheResults.cached.length > 0);

    return {
      translations,
      cacheHit: cacheResults.cached.length === validTexts.length,
      processingTime,
      batchId
    };
  }

  private async performTranslation(texts: string[], targetLanguage: string): Promise<any[]> {
    // Use existing translation optimizer for actual API calls
    return await translationOptimizer.translateBatch(texts, targetLanguage, 'high');
  }

  private async applyTextWrapping(translations: any[], wrapping: any): Promise<any[]> {
    this.metrics.wrappingOperations++;
    
    return Promise.all(translations.map(async (translation) => {
      const wrapResult = await this.wrapText(translation.translatedText, wrapping);
      
      return {
        ...translation,
        wrappedText: wrapResult.wrappedText,
        estimatedWidth: wrapResult.estimatedWidth,
        truncated: wrapResult.truncated
      };
    }));
  }

  private async wrapText(text: string, options: any): Promise<TextWrapResult> {
    const {
      maxWidth = 300,
      containerType = 'paragraph',
      preserveFormatting = true
    } = options;

    // Estimate character width based on container type
    const charWidthMap = {
      button: 8,
      title: 12,
      menu: 9,
      paragraph: 7
    };

    const avgCharWidth = charWidthMap[containerType] || 8;
    const maxCharsPerLine = Math.floor(maxWidth / avgCharWidth);

    // Simple text wrapping algorithm
    if (text.length <= maxCharsPerLine) {
      return {
        wrappedText: text,
        estimatedWidth: text.length * avgCharWidth,
        truncated: false,
        lineCount: 1
      };
    }

    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      
      if (testLine.length <= maxCharsPerLine) {
        currentLine = testLine;
      } else {
        if (currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          // Word is too long, truncate it
          lines.push(word.substring(0, maxCharsPerLine - 3) + '...');
          currentLine = '';
        }
      }
    }

    if (currentLine) {
      lines.push(currentLine);
    }

    // Limit to maximum lines based on container type
    const maxLines = containerType === 'button' ? 2 : containerType === 'title' ? 3 : 10;
    const truncated = lines.length > maxLines;
    
    if (truncated) {
      lines.splice(maxLines - 1);
      if (lines.length > 0) {
        lines[lines.length - 1] = lines[lines.length - 1].substring(0, maxCharsPerLine - 3) + '...';
      }
    }

    const wrappedText = lines.join('\n');
    const estimatedWidth = Math.max(...lines.map(line => line.length * avgCharWidth));

    return {
      wrappedText,
      estimatedWidth,
      truncated,
      lineCount: lines.length
    };
  }

  private checkCache(texts: string[], targetLanguage: string) {
    const cached: any[] = [];
    const uncached: string[] = [];

    texts.forEach(text => {
      const cacheKey = this.getCacheKey(text, targetLanguage);
      const cachedResult = this.translationCache.get(cacheKey);
      
      if (cachedResult) {
        cached.push(cachedResult);
      } else {
        uncached.push(text);
      }
    });

    return { cached, uncached };
  }

  private getCacheKey(text: string, targetLanguage: string): string {
    return `${targetLanguage}:${text}`;
  }

  private generateBatchId(): string {
    return `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private createEmptyResponse(batchId: string, startTime: number): TranslationResponse {
    return {
      translations: [],
      cacheHit: false,
      processingTime: Date.now() - startTime,
      batchId
    };
  }

  private updateMetrics(processingTime: number, wasCache: boolean) {
    if (wasCache) {
      this.metrics.cacheHits++;
    }
    
    // Update average processing time
    this.metrics.avgProcessingTime = 
      (this.metrics.avgProcessingTime * (this.metrics.totalRequests - 1) + processingTime) / 
      this.metrics.totalRequests;
  }

  getMetrics() {
    return {
      ...this.metrics,
      cacheHitRate: this.metrics.totalRequests > 0 ? 
        (this.metrics.cacheHits / this.metrics.totalRequests * 100).toFixed(1) + '%' : '0%'
    };
  }

  clearCache() {
    this.translationCache.clear();
    console.log('[Unified Translation] Cache cleared');
  }

  // Intelligent text processing for specific UI components
  async processComponentText(
    texts: string[], 
    targetLanguage: string, 
    componentType: 'navigation' | 'button' | 'form' | 'content'
  ): Promise<TranslationResponse> {
    const wrappingConfig = this.getComponentWrappingConfig(componentType);
    
    return this.processTranslationRequest({
      texts,
      targetLanguage,
      priority: componentType === 'navigation' ? 'instant' : 'high',
      wrapping: wrappingConfig,
      context: {
        componentId: componentType
      }
    });
  }

  private getComponentWrappingConfig(componentType: string) {
    const configs = {
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
      form: {
        maxWidth: 200,
        containerType: 'paragraph' as const,
        preserveFormatting: true
      },
      content: {
        maxWidth: 600,
        containerType: 'paragraph' as const,
        preserveFormatting: true
      }
    };

    return configs[componentType] || configs.content;
  }
}

export const unifiedTranslationService = UnifiedTranslationService.getInstance();
export type { TranslationRequest, TranslationResponse };