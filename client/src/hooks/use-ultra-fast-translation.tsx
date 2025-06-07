import { useState, useEffect, useCallback, useRef } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

// Ultra-fast translation system with aggressive caching and request deduplication
const translationCache = new Map<string, string>();
const pendingRequests = new Map<string, Promise<string>>();
const batchQueue = new Map<string, string>();
let batchTimer: NodeJS.Timeout | null = null;

// Critical UI text that loads instantly - expanded for better performance
const INSTANT_TRANSLATIONS = new Map([
  ['Filter', { JA: 'フィルター', ES: 'Filtrar', FR: 'Filtrer', DE: 'Filter', ZH: '筛选' }],
  ['Search', { JA: '検索', ES: 'Buscar', FR: 'Chercher', DE: 'Suchen', ZH: '搜索' }],
  ['Products', { JA: '製品', ES: 'Productos', FR: 'Produits', DE: 'Produkte', ZH: '产品' }],
  ['Categories', { JA: 'カテゴリー', ES: 'Categorías', FR: 'Catégories', DE: 'Kategorien', ZH: '类别' }],
  ['Sort by', { JA: '並べ替え', ES: 'Ordenar por', FR: 'Trier par', DE: 'Sortieren nach', ZH: '排序' }],
  ['Add to Cart', { JA: 'カートに入れる', ES: 'Añadir al carrito', FR: 'Ajouter au panier', DE: 'In den Warenkorb', ZH: '加入购物车' }],
  ['Buy Now', { JA: '今すぐ購入', ES: 'Comprar ahora', FR: 'Acheter maintenant', DE: 'Jetzt kaufen', ZH: '立即购买' }],
  ['Loading', { JA: '読み込み中', ES: 'Cargando', FR: 'Chargement', DE: 'Wird geladen', ZH: '加载中' }],
  ['Price', { JA: '価格', ES: 'Precio', FR: 'Prix', DE: 'Preis', ZH: '价格' }],
  ['Share', { JA: 'シェア', ES: 'Compartir', FR: 'Partager', DE: 'Teilen', ZH: '分享' }],
  ['Electronics', { JA: 'エレクトロニクス', ES: 'Electrónica', FR: 'Électronique', DE: 'Elektronik', ZH: '电子产品' }],
  ['Fashion & Apparel', { JA: 'ファッション・アパレル', ES: 'Moda y prendas de vestir', FR: 'Mode et vêtements', DE: 'Mode und Bekleidung', ZH: '时尚服装' }],
  ['Books & Media', { JA: '本・メディア', ES: 'Libros y medios de comunicación', FR: 'Livres et médias', DE: 'Bücher und Medien', ZH: '书籍媒体' }],
  ['Sports & Outdoors', { JA: 'スポーツ・アウトドア', ES: 'Deportes y aire libre', FR: 'Sports et plein air', DE: 'Sport und Outdoor', ZH: '运动户外' }],
  ['Beauty & Personal Care', { JA: '美容・パーソナルケア', ES: 'Belleza y cuidado personal', FR: 'Beauté et soins personnels', DE: 'Schönheit und Körperpflege', ZH: '美容个护' }],
  ['Home & Garden', { JA: 'ホーム・ガーデン', ES: 'Hogar y jardinería', FR: 'Maison et jardin', DE: 'Haus und Garten', ZH: '家居园艺' }],
  ['Send Offer', { JA: 'オファーを送る', ES: 'Enviar oferta', FR: 'Envoyer une offre', DE: 'Angebot senden', ZH: '发送报价' }],
  ['Send Gift', { JA: 'ギフトを贈る', ES: 'Enviar regalo', FR: 'Envoyer un cadeau', DE: 'Geschenk senden', ZH: '发送礼物' }],
  ['Add to favorites', { JA: 'お気に入りに追加', ES: 'Añadir a favoritos', FR: 'Ajouter aux favoris', DE: 'Zu Favoriten hinzufügen', ZH: '添加到收藏' }],
  ['Remove from favorites', { JA: 'お気に入りから削除する', ES: 'Eliminar de favoritos', FR: 'Retirer des favoris', DE: 'Aus Favoriten entfernen', ZH: '从收藏中删除' }]
]);

// Batch size for optimal performance
const BATCH_SIZE = 50;
const BATCH_DELAY = 10; // 10ms delay for batching - much faster

/**
 * Ultra-fast translation hook with instant responses for critical UI
 * Uses aggressive caching, request deduplication, and intelligent batching
 */
export function useUltraFastTranslation(text: string, priority: 'instant' | 'fast' | 'normal' = 'normal') {
  const { currentLanguage } = useLanguage();
  const [translatedText, setTranslatedText] = useState(text);
  const [isLoading, setIsLoading] = useState(false);

  const getCacheKey = useCallback((text: string, language: string) => {
    return `${text}:${language}`;
  }, []);

  // Instant translation for critical UI elements
  const getInstantTranslation = useCallback((text: string, language: string) => {
    const translations = INSTANT_TRANSLATIONS.get(text);
    return translations?.[language as keyof typeof translations] || null;
  }, []);

  // Batch translation requests for optimal performance
  const processBatch = useCallback(async () => {
    if (batchQueue.size === 0) return;

    const batch = Array.from(batchQueue.entries());
    batchQueue.clear();

    const texts = batch.map(([text]) => text);
    const language = batch[0][1];

    try {
      const response = await fetch('/api/translate/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          texts,
          targetLanguage: language,
          priority: 'high'
        })
      });

      if (response.ok) {
        const { translations } = await response.json();
        
        translations.forEach((translation: any) => {
          const cacheKey = getCacheKey(translation.originalText, language);
          translationCache.set(cacheKey, translation.translatedText);
          
          // Remove from pending requests
          pendingRequests.delete(cacheKey);
        });
      }
    } catch (error) {
      console.error('Batch translation failed:', error);
      
      // Clear pending requests on error
      batch.forEach(([text]) => {
        const cacheKey = getCacheKey(text, language);
        pendingRequests.delete(cacheKey);
      });
    }
  }, [getCacheKey]);

  // Smart translation with caching and batching
  const smartTranslate = useCallback(async (textToTranslate: string, targetLanguage: string) => {
    if (targetLanguage === 'EN') {
      return textToTranslate;
    }

    const cacheKey = getCacheKey(textToTranslate, targetLanguage);

    // Check cache first
    const cached = translationCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Check for instant translation
    const instant = getInstantTranslation(textToTranslate, targetLanguage);
    if (instant) {
      translationCache.set(cacheKey, instant);
      return instant;
    }

    // Check if request is already pending
    const pending = pendingRequests.get(cacheKey);
    if (pending) {
      return pending;
    }

    // Create new request promise
    const requestPromise = new Promise<string>((resolve) => {
      // Add to batch queue
      batchQueue.set(textToTranslate, targetLanguage);

      // Set up batch timer
      if (batchTimer) {
        clearTimeout(batchTimer);
      }

      batchTimer = setTimeout(async () => {
        await processBatch();
        
        // Return cached result or fallback
        const result = translationCache.get(cacheKey) || textToTranslate;
        resolve(result);
      }, priority === 'instant' ? 0 : BATCH_DELAY);
    });

    pendingRequests.set(cacheKey, requestPromise);
    return requestPromise;
  }, [getCacheKey, getInstantTranslation, processBatch, priority]);

  // Main translation effect
  useEffect(() => {
    if (!text || currentLanguage === 'EN') {
      setTranslatedText(text);
      setIsLoading(false);
      return;
    }

    const translateText = async () => {
      setIsLoading(true);

      try {
        const result = await smartTranslate(text, currentLanguage);
        setTranslatedText(result);
      } catch (error) {
        console.error('Translation failed:', error);
        setTranslatedText(text); // Fallback to original text
      } finally {
        setIsLoading(false);
      }
    };

    translateText();
  }, [text, currentLanguage, smartTranslate]);

  return {
    translatedText,
    isLoading,
    originalText: text
  };
}

// Preload common translations for instant UI
export function preloadCriticalTranslations(language: string) {
  if (language === 'EN') return;

  INSTANT_TRANSLATIONS.forEach((translations, text) => {
    const translation = translations[language as keyof typeof translations];
    if (translation) {
      const cacheKey = `${text}:${language}`;
      translationCache.set(cacheKey, translation);
    }
  });
}

// Batch multiple translations at once
export function useBatchTranslation(texts: string[], priority: 'instant' | 'fast' | 'normal' = 'normal') {
  const { currentLanguage } = useLanguage();
  const [translations, setTranslations] = useState<string[]>(texts);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (currentLanguage === 'EN') {
      setTranslations(texts);
      return;
    }

    const batchTranslate = async () => {
      setIsLoading(true);

      try {
        const results = await Promise.all(
          texts.map(async (text) => {
            const cacheKey = `${text}:${currentLanguage}`;
            
            // Check cache
            const cached = translationCache.get(cacheKey);
            if (cached) return cached;

            // Check instant translations
            const instant = INSTANT_TRANSLATIONS.get(text);
            const instantTranslation = instant?.[currentLanguage as keyof typeof instant];
            if (instantTranslation) {
              translationCache.set(cacheKey, instantTranslation);
              return instantTranslation;
            }

            return text; // Fallback to original
          })
        );

        setTranslations(results);
      } catch (error) {
        console.error('Batch translation failed:', error);
        setTranslations(texts);
      } finally {
        setIsLoading(false);
      }
    };

    batchTranslate();
  }, [texts, currentLanguage]);

  return {
    translations,
    isLoading
  };
}