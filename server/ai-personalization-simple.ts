import { Request, Response, NextFunction } from 'express';
import { db } from './db';
import { users, products, orders, cartItems, categories } from '@shared/schema';
import { eq, desc, and, inArray, sql, count, avg, ne, gt, lt } from 'drizzle-orm';

// Simplified AI personalization engine that works with existing schema
export class AIPersonalizationEngine {
  
  // Get personalized product recommendations based on user behavior
  async getPersonalizedRecommendations(userId: number, limit: number = 20): Promise<any[]> {
    try {
      console.log(`[AI Personalization] Getting recommendations for user ${userId}`);
      
      // 1. Get user's purchase history
      const userPurchases = await this.getUserPurchaseHistory(userId);
      
      // 2. Get user's cart items (current interests)
      const userCartItems = await this.getUserCartItems(userId);
      
      // 3. Generate recommendations using multiple strategies
      const recommendations = await this.generateRecommendations(userId, userPurchases, userCartItems);
      
      // 4. Diversify and limit results
      const diversifiedRecommendations = this.diversifyRecommendations(recommendations, limit);
      
      console.log(`[AI Personalization] Generated ${diversifiedRecommendations.length} recommendations for user ${userId}`);
      return diversifiedRecommendations;
      
    } catch (error) {
      console.error('Error getting personalized recommendations:', error);
      // Fallback to popular products
      return await this.getPopularProducts(limit);
    }
  }

  // Track user interaction for learning (simplified)
  async trackUserInteraction(userId: number, productId: number, interactionType: string, metadata?: any) {
    try {
      // For now, we'll use existing tables to track behavior
      // This could be enhanced later with dedicated interaction tables
      
      if (interactionType === 'view') {
        // Increment product views
        await db.execute(
          sql`UPDATE products SET views = COALESCE(views, 0) + 1 WHERE id = ${productId}`
        );
      }
      
      console.log(`[AI Personalization] Tracked ${interactionType} interaction for user ${userId} on product ${productId}`);
    } catch (error) {
      console.error('Error tracking user interaction:', error);
    }
  }

  // Get user's purchase history
  private async getUserPurchaseHistory(userId: number): Promise<any[]> {
    try {
      const purchases = await db
        .select({
          productId: orders.id, // Using order id as a proxy for now
          categoryId: products.category,
          price: products.price,
          productName: products.name,
          orderDate: orders.createdAt
        })
        .from(orders)
        .innerJoin(products, eq(orders.id, products.id)) // This is a simplified join
        .where(eq(orders.userId, userId))
        .orderBy(desc(orders.createdAt))
        .limit(50);

      return purchases;
    } catch (error) {
      console.error('Error getting purchase history:', error);
      return [];
    }
  }

  // Get user's cart items (current interests)
  private async getUserCartItems(userId: number): Promise<any[]> {
    try {
      const cartItems = await db
        .select({
          productId: cartItems.productId,
          categoryId: products.category,
          price: products.price,
          quantity: cartItems.quantity
        })
        .from(cartItems)
        .innerJoin(products, eq(cartItems.productId, products.id))
        .where(eq(cartItems.userId, userId));

      return cartItems;
    } catch (error) {
      console.error('Error getting cart items:', error);
      return [];
    }
  }

  // Generate recommendations using multiple strategies
  private async generateRecommendations(userId: number, purchases: any[], cartItems: any[]): Promise<any[]> {
    const recommendations: any[] = [];

    // Strategy 1: Category-based recommendations
    const categoryRecs = await this.getCategoryBasedRecommendations(purchases, cartItems, userId);
    recommendations.push(...categoryRecs);

    // Strategy 2: Price range based recommendations
    const priceRecs = await this.getPriceBasedRecommendations(purchases, cartItems, userId);
    recommendations.push(...priceRecs);

    // Strategy 3: Similar users (collaborative filtering simplified)
    const collaborativeRecs = await this.getCollaborativeRecommendations(userId);
    recommendations.push(...collaborativeRecs);

    // Strategy 4: Popular products in user's categories
    const popularRecs = await this.getPopularInCategoriesRecommendations(purchases, cartItems);
    recommendations.push(...popularRecs);

    // Remove duplicates and products user already has
    const uniqueRecommendations = this.removeDuplicatesAndOwned(recommendations, purchases, cartItems);

    return uniqueRecommendations;
  }

  // Category-based recommendations
  private async getCategoryBasedRecommendations(purchases: any[], cartItems: any[], userId: number): Promise<any[]> {
    try {
      // Get user's preferred categories
      const preferredCategories = [
        ...new Set([
          ...purchases.map(p => p.categoryId),
          ...cartItems.map(c => c.categoryId)
        ])
      ].filter(Boolean);

      if (preferredCategories.length === 0) {
        return [];
      }

      // Get products from preferred categories
      const categoryProducts = await db
        .select()
        .from(products)
        .where(
          and(
            inArray(products.category, preferredCategories),
            gt(products.stock, 0) // Only in-stock products
          )
        )
        .orderBy(desc(products.views), desc(products.createdAt))
        .limit(15);

      return categoryProducts.map(product => ({
        ...product,
        recommendationReason: 'Based on your browsing categories',
        score: 0.8
      }));
    } catch (error) {
      console.error('Error getting category-based recommendations:', error);
      return [];
    }
  }

  // Price range based recommendations
  private async getPriceBasedRecommendations(purchases: any[], cartItems: any[], userId: number): Promise<any[]> {
    try {
      const allPrices = [
        ...purchases.map(p => parseFloat(p.price)),
        ...cartItems.map(c => parseFloat(c.price))
      ];

      if (allPrices.length === 0) {
        return [];
      }

      const avgPrice = allPrices.reduce((sum, price) => sum + price, 0) / allPrices.length;
      const minPrice = avgPrice * 0.7;
      const maxPrice = avgPrice * 1.5;

      const priceRangeProducts = await db
        .select()
        .from(products)
        .where(
          and(
            gt(products.price, minPrice.toString()),
            lt(products.price, maxPrice.toString()),
            gt(products.stock, 0)
          )
        )
        .orderBy(desc(products.views))
        .limit(10);

      return priceRangeProducts.map(product => ({
        ...product,
        recommendationReason: 'Matches your price range',
        score: 0.6
      }));
    } catch (error) {
      console.error('Error getting price-based recommendations:', error);
      return [];
    }
  }

  // Simplified collaborative filtering
  private async getCollaborativeRecommendations(userId: number): Promise<any[]> {
    try {
      // Find users with similar cart items (simplified approach)
      const userCartItems = await db
        .select({ productId: cartItems.productId })
        .from(cartItems)
        .where(eq(cartItems.userId, userId));

      if (userCartItems.length === 0) {
        return [];
      }

      const productIds = userCartItems.map(item => item.productId);

      // Find other users who have similar items in cart
      const similarUserItems = await db
        .select({
          userId: cartItems.userId,
          productId: cartItems.productId
        })
        .from(cartItems)
        .where(
          and(
            inArray(cartItems.productId, productIds),
            ne(cartItems.userId, userId)
          )
        )
        .limit(50);

      // Get products that similar users have
      const recommendedProductIds = [...new Set(similarUserItems.map(item => item.productId))];
      
      if (recommendedProductIds.length === 0) {
        return [];
      }

      const collaborativeProducts = await db
        .select()
        .from(products)
        .where(
          and(
            inArray(products.id, recommendedProductIds),
            gt(products.stock, 0)
          )
        )
        .limit(10);

      return collaborativeProducts.map(product => ({
        ...product,
        recommendationReason: 'Users with similar interests also liked',
        score: 0.7
      }));
    } catch (error) {
      console.error('Error getting collaborative recommendations:', error);
      return [];
    }
  }

  // Popular products in user's categories
  private async getPopularInCategoriesRecommendations(purchases: any[], cartItems: any[]): Promise<any[]> {
    try {
      const userCategories = [
        ...new Set([
          ...purchases.map(p => p.categoryId),
          ...cartItems.map(c => c.categoryId)
        ])
      ].filter(Boolean);

      if (userCategories.length === 0) {
        return await this.getPopularProducts(5);
      }

      const popularProducts = await db
        .select()
        .from(products)
        .where(
          and(
            inArray(products.category, userCategories),
            gt(products.stock, 0)
          )
        )
        .orderBy(desc(products.views), desc(products.createdAt))
        .limit(8);

      return popularProducts.map(product => ({
        ...product,
        recommendationReason: 'Popular in your favorite categories',
        score: 0.5
      }));
    } catch (error) {
      console.error('Error getting popular category recommendations:', error);
      return [];
    }
  }

  // Get popular products as fallback
  private async getPopularProducts(limit: number = 10): Promise<any[]> {
    try {
      const popularProducts = await db
        .select()
        .from(products)
        .where(gt(products.stock, 0))
        .orderBy(desc(products.views), desc(products.createdAt))
        .limit(limit);

      return popularProducts.map(product => ({
        ...product,
        recommendationReason: 'Popular products',
        score: 0.3
      }));
    } catch (error) {
      console.error('Error getting popular products:', error);
      return [];
    }
  }

  // Remove duplicates and products user already owns/has in cart
  private removeDuplicatesAndOwned(recommendations: any[], purchases: any[], cartItems: any[]): any[] {
    const ownedProductIds = new Set([
      ...purchases.map(p => p.productId),
      ...cartItems.map(c => c.productId)
    ]);

    const seen = new Set();
    return recommendations.filter(product => {
      if (seen.has(product.id) || ownedProductIds.has(product.id)) {
        return false;
      }
      seen.add(product.id);
      return true;
    });
  }

  // Diversify recommendations by category and score
  private diversifyRecommendations(recommendations: any[], limit: number): any[] {
    // Sort by score first
    const sorted = recommendations.sort((a, b) => (b.score || 0) - (a.score || 0));
    
    // Diversify by category (max 3 per category)
    const categoryCount: { [key: string]: number } = {};
    const diversified: any[] = [];

    for (const product of sorted) {
      const category = product.category || 'uncategorized';
      const currentCount = categoryCount[category] || 0;

      if (currentCount < 3 && diversified.length < limit) {
        diversified.push(product);
        categoryCount[category] = currentCount + 1;
      }
    }

    // Fill remaining slots if needed
    for (const product of sorted) {
      if (diversified.length >= limit) break;
      if (!diversified.find(p => p.id === product.id)) {
        diversified.push(product);
      }
    }

    return diversified.slice(0, limit);
  }
}

// Middleware to track product views automatically
export function trackProductViewMiddleware() {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user?.id;
      const productId = parseInt(req.params.id);
      
      if (userId && productId) {
        const aiEngine = new AIPersonalizationEngine();
        
        // Track view asynchronously
        setImmediate(() => {
          aiEngine.trackUserInteraction(userId, productId, 'view', {
            userAgent: req.headers['user-agent'],
            timestamp: new Date(),
            referrer: req.headers.referer
          });
        });
      }
    } catch (error) {
      console.error('Error in track product view middleware:', error);
    }
    
    next();
  };
}

export const aiPersonalizationEngine = new AIPersonalizationEngine();