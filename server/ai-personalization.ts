import { Request, Response, NextFunction } from 'express';
import { db } from './db';
import { users, products, orders, userInteractions, userPreferences, categories } from '@shared/schema';
import { eq, desc, and, inArray, sql, count, avg } from 'drizzle-orm';

// User interaction tracking for AI personalization
export interface UserBehaviorData {
  userId: number;
  productViews: number[];
  categoryViews: { [categoryId: number]: number };
  searchTerms: string[];
  purchaseHistory: number[];
  timeSpentOnProducts: { [productId: number]: number };
  priceRange: { min: number; max: number };
  brandPreferences: string[];
  seasonalPatterns: { [month: number]: string[] };
}

// AI recommendation engine using collaborative filtering and content-based filtering
export class AIPersonalizationEngine {
  
  // Track user interactions for machine learning
  async trackUserInteraction(userId: number, productId: number, interactionType: 'view' | 'search' | 'purchase' | 'like' | 'cart', metadata?: any) {
    try {
      await db.insert(userInteractions).values({
        userId,
        productId,
        interactionType,
        metadata: metadata ? JSON.stringify(metadata) : null,
        timestamp: new Date()
      });
      
      // Update user preferences in real-time
      await this.updateUserPreferences(userId);
    } catch (error) {
      console.error('Error tracking user interaction:', error);
    }
  }

  // Analyze user behavior patterns using AI algorithms
  async getUserBehaviorProfile(userId: number): Promise<UserBehaviorData> {
    try {
      // Get user interactions
      const interactions = await db
        .select()
        .from(userInteractions)
        .where(eq(userInteractions.userId, userId))
        .orderBy(desc(userInteractions.timestamp))
        .limit(1000);

      // Get purchase history
      const purchases = await db
        .select({ productId: orders.productId })
        .from(orders)
        .where(eq(orders.userId, userId));

      // Analyze category preferences
      const categoryViews: { [categoryId: number]: number } = {};
      const productViews: number[] = [];
      const searchTerms: string[] = [];
      const timeSpentOnProducts: { [productId: number]: number } = {};

      interactions.forEach(interaction => {
        if (interaction.interactionType === 'view') {
          productViews.push(interaction.productId);
          // Simulate time spent tracking
          timeSpentOnProducts[interaction.productId] = (timeSpentOnProducts[interaction.productId] || 0) + 1;
        }
        
        if (interaction.interactionType === 'search' && interaction.metadata) {
          try {
            const searchData = JSON.parse(interaction.metadata);
            if (searchData.searchTerm) {
              searchTerms.push(searchData.searchTerm);
            }
          } catch (e) {
            console.error('Error parsing search metadata:', e);
          }
        }
      });

      // Get category preferences from product views
      const viewedProducts = await db
        .select({ categoryId: products.categoryId })
        .from(products)
        .where(inArray(products.id, productViews));

      viewedProducts.forEach(product => {
        if (product.categoryId) {
          categoryViews[product.categoryId] = (categoryViews[product.categoryId] || 0) + 1;
        }
      });

      return {
        userId,
        productViews: [...new Set(productViews)],
        categoryViews,
        searchTerms: [...new Set(searchTerms)],
        purchaseHistory: purchases.map(p => p.productId).filter(Boolean),
        timeSpentOnProducts,
        priceRange: await this.calculatePriceRange(userId),
        brandPreferences: await this.getBrandPreferences(userId),
        seasonalPatterns: await this.getSeasonalPatterns(userId)
      };
    } catch (error) {
      console.error('Error getting user behavior profile:', error);
      return {
        userId,
        productViews: [],
        categoryViews: {},
        searchTerms: [],
        purchaseHistory: [],
        timeSpentOnProducts: {},
        priceRange: { min: 0, max: 1000 },
        brandPreferences: [],
        seasonalPatterns: {}
      };
    }
  }

  // AI-powered product recommendations using multiple algorithms
  async getPersonalizedRecommendations(userId: number, limit: number = 20): Promise<any[]> {
    try {
      const behaviorProfile = await this.getUserBehaviorProfile(userId);
      
      // 1. Collaborative Filtering - Find similar users
      const similarUsers = await this.findSimilarUsers(userId, behaviorProfile);
      
      // 2. Content-Based Filtering - Based on user preferences
      const contentBasedRecs = await this.getContentBasedRecommendations(behaviorProfile);
      
      // 3. Popularity-Based recommendations for new users
      const popularProducts = await this.getPopularProducts();
      
      // 4. Combine recommendations using weighted scoring
      const combinedRecommendations = await this.combineRecommendations([
        { type: 'collaborative', products: similarUsers, weight: 0.4 },
        { type: 'content', products: contentBasedRecs, weight: 0.4 },
        { type: 'popular', products: popularProducts, weight: 0.2 }
      ], behaviorProfile);

      // 5. Apply business rules and filters
      const filteredRecommendations = await this.applyBusinessRules(combinedRecommendations, behaviorProfile);
      
      return filteredRecommendations.slice(0, limit);
    } catch (error) {
      console.error('Error getting personalized recommendations:', error);
      // Fallback to popular products
      return await this.getPopularProducts(limit);
    }
  }

  // Find users with similar behavior patterns
  private async findSimilarUsers(userId: number, behaviorProfile: UserBehaviorData): Promise<any[]> {
    try {
      // Get users who viewed similar products
      const similarUserIds = await db
        .select({ 
          userId: userInteractions.userId,
          similarity: sql<number>`COUNT(DISTINCT ${userInteractions.productId})`.as('similarity')
        })
        .from(userInteractions)
        .where(
          and(
            inArray(userInteractions.productId, behaviorProfile.productViews),
            sql`${userInteractions.userId} != ${userId}`
          )
        )
        .groupBy(userInteractions.userId)
        .orderBy(desc(sql`similarity`))
        .limit(10);

      // Get products these similar users liked/purchased
      const recommendedProductIds = await db
        .select({ productId: userInteractions.productId })
        .from(userInteractions)
        .where(
          and(
            inArray(userInteractions.userId, similarUserIds.map(u => u.userId)),
            inArray(userInteractions.interactionType, ['purchase', 'like']),
            sql`${userInteractions.productId} NOT IN (${behaviorProfile.productViews.join(',') || '0'})`
          )
        )
        .groupBy(userInteractions.productId)
        .orderBy(desc(count(userInteractions.productId)))
        .limit(15);

      return await this.getProductDetails(recommendedProductIds.map(p => p.productId));
    } catch (error) {
      console.error('Error finding similar users:', error);
      return [];
    }
  }

  // Content-based recommendations using user preferences
  private async getContentBasedRecommendations(behaviorProfile: UserBehaviorData): Promise<any[]> {
    try {
      const preferredCategories = Object.keys(behaviorProfile.categoryViews)
        .sort((a, b) => behaviorProfile.categoryViews[parseInt(b)] - behaviorProfile.categoryViews[parseInt(a)])
        .slice(0, 5)
        .map(id => parseInt(id));

      if (preferredCategories.length === 0) {
        return [];
      }

      const recommendedProducts = await db
        .select()
        .from(products)
        .where(
          and(
            inArray(products.categoryId, preferredCategories),
            sql`${products.price} BETWEEN ${behaviorProfile.priceRange.min} AND ${behaviorProfile.priceRange.max}`,
            sql`${products.id} NOT IN (${behaviorProfile.productViews.join(',') || '0'})`
          )
        )
        .orderBy(desc(products.rating))
        .limit(15);

      return recommendedProducts;
    } catch (error) {
      console.error('Error getting content-based recommendations:', error);
      return [];
    }
  }

  // Get popular products as fallback
  private async getPopularProducts(limit: number = 10): Promise<any[]> {
    try {
      return await db
        .select()
        .from(products)
        .orderBy(desc(products.rating), desc(products.views))
        .limit(limit);
    } catch (error) {
      console.error('Error getting popular products:', error);
      return [];
    }
  }

  // Combine multiple recommendation sources with weighted scoring
  private async combineRecommendations(
    sources: Array<{ type: string; products: any[]; weight: number }>,
    behaviorProfile: UserBehaviorData
  ): Promise<any[]> {
    const productScores: { [productId: number]: number } = {};
    const allProducts: { [productId: number]: any } = {};

    sources.forEach(source => {
      source.products.forEach((product, index) => {
        const baseScore = (source.products.length - index) / source.products.length;
        const weightedScore = baseScore * source.weight;
        
        productScores[product.id] = (productScores[product.id] || 0) + weightedScore;
        allProducts[product.id] = product;
      });
    });

    // Sort by combined score
    const sortedProducts = Object.entries(productScores)
      .sort(([, scoreA], [, scoreB]) => scoreB - scoreA)
      .map(([productId]) => allProducts[parseInt(productId)]);

    return sortedProducts;
  }

  // Apply business rules and filters
  private async applyBusinessRules(recommendations: any[], behaviorProfile: UserBehaviorData): Promise<any[]> {
    // Filter out out-of-stock products
    const inStockProducts = recommendations.filter(product => 
      product.stock && product.stock > 0
    );

    // Apply price range filter
    const priceFilteredProducts = inStockProducts.filter(product =>
      product.price >= behaviorProfile.priceRange.min && 
      product.price <= behaviorProfile.priceRange.max
    );

    // Diversify categories (don't show too many from same category)
    const diversifiedProducts = this.diversifyByCategory(priceFilteredProducts);

    return diversifiedProducts;
  }

  // Diversify recommendations by category
  private diversifyByCategory(products: any[], maxPerCategory: number = 3): any[] {
    const categoryCount: { [categoryId: number]: number } = {};
    const diversified: any[] = [];

    products.forEach(product => {
      const categoryId = product.categoryId || 0;
      const currentCount = categoryCount[categoryId] || 0;
      
      if (currentCount < maxPerCategory) {
        diversified.push(product);
        categoryCount[categoryId] = currentCount + 1;
      }
    });

    return diversified;
  }

  // Helper functions
  private async calculatePriceRange(userId: number): Promise<{ min: number; max: number }> {
    try {
      const userOrders = await db
        .select({ price: products.price })
        .from(orders)
        .innerJoin(products, eq(orders.productId, products.id))
        .where(eq(orders.userId, userId));

      if (userOrders.length === 0) {
        return { min: 0, max: 1000 };
      }

      const prices = userOrders.map(o => o.price);
      const avgPrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
      
      return {
        min: Math.max(0, avgPrice * 0.5),
        max: avgPrice * 2
      };
    } catch (error) {
      return { min: 0, max: 1000 };
    }
  }

  private async getBrandPreferences(userId: number): Promise<string[]> {
    try {
      const brandInteractions = await db
        .select({ brand: products.brand })
        .from(userInteractions)
        .innerJoin(products, eq(userInteractions.productId, products.id))
        .where(eq(userInteractions.userId, userId))
        .groupBy(products.brand)
        .orderBy(desc(count(products.brand)))
        .limit(5);

      return brandInteractions.map(b => b.brand).filter(Boolean);
    } catch (error) {
      return [];
    }
  }

  private async getSeasonalPatterns(userId: number): Promise<{ [month: number]: string[] }> {
    // Simplified seasonal pattern analysis
    // In a real implementation, this would analyze purchase patterns by season
    return {};
  }

  private async getProductDetails(productIds: number[]): Promise<any[]> {
    if (productIds.length === 0) return [];
    
    try {
      return await db
        .select()
        .from(products)
        .where(inArray(products.id, productIds));
    } catch (error) {
      console.error('Error getting product details:', error);
      return [];
    }
  }

  // Update user preferences based on interactions
  private async updateUserPreferences(userId: number): Promise<void> {
    try {
      const behaviorProfile = await this.getUserBehaviorProfile(userId);
      
      // Save/update user preferences
      await db
        .insert(userPreferences)
        .values({
          userId,
          preferredCategories: Object.keys(behaviorProfile.categoryViews),
          priceRangeMin: behaviorProfile.priceRange.min,
          priceRangeMax: behaviorProfile.priceRange.max,
          preferredBrands: behaviorProfile.brandPreferences,
          updatedAt: new Date()
        })
        .onConflictDoUpdate({
          target: userPreferences.userId,
          set: {
            preferredCategories: Object.keys(behaviorProfile.categoryViews),
            priceRangeMin: behaviorProfile.priceRange.min,
            priceRangeMax: behaviorProfile.priceRange.max,
            preferredBrands: behaviorProfile.brandPreferences,
            updatedAt: new Date()
          }
        });
    } catch (error) {
      console.error('Error updating user preferences:', error);
    }
  }
}

// Middleware to track user interactions automatically
export function trackInteractionMiddleware(interactionType: 'view' | 'search' | 'purchase' | 'like' | 'cart') {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user?.id;
      const productId = parseInt(req.params.id) || parseInt(req.body.productId);
      
      if (userId && productId) {
        const aiEngine = new AIPersonalizationEngine();
        
        // Track interaction asynchronously
        setImmediate(() => {
          aiEngine.trackUserInteraction(userId, productId, interactionType, {
            userAgent: req.headers['user-agent'],
            timestamp: new Date(),
            referrer: req.headers.referer
          });
        });
      }
    } catch (error) {
      console.error('Error in track interaction middleware:', error);
    }
    
    next();
  };
}

export const aiPersonalizationEngine = new AIPersonalizationEngine();