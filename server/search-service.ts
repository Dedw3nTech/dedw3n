import { db } from "./db";
import { products, vendors, users } from "@shared/schema";
import { ilike, or, sql, eq, and } from "drizzle-orm";

interface TranslationResult {
  originalText: string;
  translatedText: string;
  detectedSourceLanguage: string;
}

interface SearchOptions {
  limit?: number;
  marketplace?: string;
  minRelevance?: number;
}

interface ProductSearchResult {
  id: number;
  name: string;
  title?: string;
  description: string;
  price: number;
  currency: string;
  imageUrl: string;
  category: string;
  subcategory?: string;
  marketplace: string;
  tags?: string[];
  collections?: string[];
  isOnSale?: boolean;
  createdAt?: Date;
  vendor?: any;
  relevanceScore: number;
  matchedLanguage?: string;
}

// Supported languages for translation expansion (top languages by usage)
const SEARCH_TRANSLATION_LANGUAGES = ['EN', 'ES', 'FR', 'DE', 'PT', 'ZH', 'AR'];

export class MultiLanguageSearchService {
  private translationCache: Map<string, { translations: string[], timestamp: number }>;
  private readonly TRANSLATION_CACHE_TTL = 3600000; // 1 hour

  constructor() {
    this.translationCache = new Map();
  }

  /**
   * Translate search query to multiple languages for expanded search
   */
  private async translateQuery(query: string, userLanguage: string): Promise<string[]> {
    const cacheKey = `${query}:${userLanguage}`;
    const cached = this.translationCache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp) < this.TRANSLATION_CACHE_TTL) {
      return cached.translations;
    }

    try {
      // Determine target languages (include user's language and top search languages)
      const targetLanguages = SEARCH_TRANSLATION_LANGUAGES.filter(
        lang => lang !== userLanguage.toUpperCase()
      ).slice(0, 4); // Limit to 4 additional languages for performance

      if (targetLanguages.length === 0) {
        // If user's language is already in the list, just use the original query
        return [query.trim()];
      }

      // Translate query to each target language separately
      const translationPromises = targetLanguages.map(async (targetLang) => {
        try {
          const response = await fetch('http://localhost:5000/api/translate/batch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              texts: [query],
              targetLanguage: targetLang,
              priority: 'instant'
            })
          });

          if (response.ok) {
            const data = await response.json();
            return data.translations?.[0]?.translatedText || null;
          }
          return null;
        } catch (error) {
          console.warn(`[MultiLangSearch] Translation to ${targetLang} failed:`, error);
          return null;
        }
      });

      const translatedTerms = await Promise.all(translationPromises);
      
      // Create unique set of search terms (original + all translations)
      const searchTerms = [
        query.trim(),
        ...translatedTerms.filter(Boolean)
      ].filter((term, index, self) => 
        term && self.indexOf(term) === index && term.length > 0 // Remove duplicates and empty strings
      );

      // Cache the results
      this.translationCache.set(cacheKey, {
        translations: searchTerms,
        timestamp: Date.now()
      });

      console.log(`[MultiLangSearch] Query "${query}" expanded to ${searchTerms.length} languages: ${searchTerms.slice(0, 3).join(', ')}${searchTerms.length > 3 ? '...' : ''}`);
      return searchTerms;

    } catch (error) {
      console.error('[MultiLangSearch] Translation error:', error);
      return [query]; // Fallback to original query
    }
  }

  /**
   * Build search conditions for multiple query variants
   */
  private buildSearchConditions(searchTerms: string[]) {
    const conditions = searchTerms.flatMap(term => [
      ilike(products.name, `%${term}%`),
      ilike(products.description, `%${term}%`),
      ilike(products.category, `%${term}%`),
      ilike(products.subcategory || '', `%${term}%`),
      // Search in tags array
      sql`EXISTS (
        SELECT 1 FROM unnest(${products.tags}) as tag 
        WHERE LOWER(tag) LIKE LOWER(${'%' + term + '%'})
      )`,
      // Search in collections array
      sql`EXISTS (
        SELECT 1 FROM unnest(${products.collections}) as collection 
        WHERE LOWER(collection) LIKE LOWER(${'%' + term + '%'})
      )`
    ]);

    return or(...conditions);
  }

  /**
   * Calculate relevance score for search results
   */
  private calculateRelevance(product: any, searchTerms: string[]): number {
    let score = 0;
    const productText = `${product.name} ${product.description} ${product.category}`.toLowerCase();

    searchTerms.forEach(term => {
      const lowerTerm = term.toLowerCase();
      
      // Exact match in name (highest weight)
      if (product.name?.toLowerCase() === lowerTerm) {
        score += 100;
      }
      // Name contains term
      else if (product.name?.toLowerCase().includes(lowerTerm)) {
        score += 50;
      }
      
      // Category match
      if (product.category?.toLowerCase() === lowerTerm) {
        score += 40;
      } else if (product.category?.toLowerCase().includes(lowerTerm)) {
        score += 20;
      }

      // Description contains term
      if (product.description?.toLowerCase().includes(lowerTerm)) {
        score += 10;
      }

      // Tags match
      if (product.tags?.some((tag: string) => tag.toLowerCase().includes(lowerTerm))) {
        score += 15;
      }

      // Collections match
      if (product.collections?.some((col: string) => col.toLowerCase().includes(lowerTerm))) {
        score += 15;
      }
    });

    // Boost newer products slightly
    const daysOld = product.createdAt 
      ? Math.floor((Date.now() - new Date(product.createdAt).getTime()) / (1000 * 60 * 60 * 24))
      : 365;
    const recencyBoost = Math.max(0, 10 - (daysOld / 30)); // Max 10 points, decays over time

    // Boost products with sales/popularity indicators
    const popularityBoost = product.isOnSale ? 5 : 0;

    return score + recencyBoost + popularityBoost;
  }

  /**
   * Main search method with multi-language support
   */
  async searchProducts(
    query: string, 
    userLanguage: string = 'EN', 
    options: SearchOptions = {}
  ): Promise<ProductSearchResult[]> {
    const startTime = Date.now();
    const { limit = 50, marketplace = 'all', minRelevance = 5 } = options;

    if (!query || query.trim().length === 0) {
      return [];
    }

    try {
      // Step 1: Expand query to multiple languages
      const searchTerms = await this.translateQuery(query, userLanguage);
      console.log(`[MultiLangSearch] Searching with ${searchTerms.length} term variants`);

      // Step 2: Build search conditions
      const searchConditions = this.buildSearchConditions(searchTerms);

      // Step 3: Build marketplace filter
      const marketplaceCondition = marketplace !== 'all' 
        ? eq(products.marketplace, marketplace as any)
        : undefined;

      // Step 4: Execute search query
      const whereClause = marketplaceCondition
        ? and(searchConditions, marketplaceCondition, eq(products.status, 'active'))
        : and(searchConditions, eq(products.status, 'active'));

      const results = await db
        .select({
          id: products.id,
          name: products.name,
          title: products.name,
          description: products.description,
          price: products.price,
          currency: products.currency,
          imageUrl: products.imageUrl,
          category: products.category,
          subcategory: products.subcategory,
          marketplace: products.marketplace,
          tags: products.tags,
          collections: products.collections,
          isOnSale: products.isOnSale,
          createdAt: products.createdAt,
          vendorId: products.vendorId
        })
        .from(products)
        .where(whereClause)
        .limit(limit * 2); // Get more results for relevance filtering

      // Step 5: Fetch vendor information for results
      const vendorIds = Array.from(new Set(results.map((p: any) => p.vendorId)));
      let vendorMap = new Map();
      
      if (vendorIds.length > 0) {
        const vendorData = await db
          .select({
            id: vendors.id,
            storeName: vendors.storeName,
            rating: vendors.rating,
            userId: vendors.userId
          })
          .from(vendors)
          .where(sql`${vendors.id} IN (${sql.join(vendorIds.map((id: any) => sql`${id}`), sql`, `)})`);

        vendorMap = new Map(vendorData.map((v: any) => [v.id, v]));
      }

      // Step 6: Calculate relevance scores and enrich results
      const scoredResults = results.map((product: any) => ({
        ...product,
        vendor: vendorMap.get(product.vendorId),
        relevanceScore: this.calculateRelevance(product, searchTerms),
        matchedLanguage: this.detectMatchedLanguage(product, searchTerms, query)
      }));

      // Step 7: Filter by minimum relevance and sort
      const filteredResults = scoredResults
        .filter((result: any) => result.relevanceScore >= minRelevance)
        .sort((a: any, b: any) => b.relevanceScore - a.relevanceScore)
        .slice(0, limit);

      const duration = Date.now() - startTime;
      console.log(`[MultiLangSearch] Found ${filteredResults.length} results in ${duration}ms (searched ${searchTerms.length} languages)`);

      return filteredResults;

    } catch (error) {
      console.error('[MultiLangSearch] Search error:', error);
      throw error;
    }
  }

  /**
   * Detect which language variant matched the product
   */
  private detectMatchedLanguage(product: any, searchTerms: string[], originalQuery: string): string {
    const productText = `${product.name} ${product.description}`.toLowerCase();
    
    // Check if original query matches directly
    if (productText.includes(originalQuery.toLowerCase())) {
      return 'original';
    }

    // Check which translation variant matched
    for (const term of searchTerms) {
      if (term !== originalQuery && productText.includes(term.toLowerCase())) {
        return 'translated';
      }
    }

    return 'partial';
  }

  /**
   * Get search suggestions based on popular queries and categories
   */
  async getSearchSuggestions(partialQuery: string, userLanguage: string = 'EN', limit: number = 5): Promise<string[]> {
    if (!partialQuery || partialQuery.trim().length < 2) {
      return [];
    }

    try {
      // Get category suggestions
      const categoryResults = await db
        .selectDistinct({ category: products.category })
        .from(products)
        .where(
          and(
            ilike(products.category, `%${partialQuery}%`),
            eq(products.status, 'active')
          )
        )
        .limit(limit);

      return categoryResults.map((r: any) => r.category).filter(Boolean);
    } catch (error) {
      console.error('[MultiLangSearch] Suggestion error:', error);
      return [];
    }
  }
}

// Export singleton instance
export const multiLangSearchService = new MultiLanguageSearchService();
