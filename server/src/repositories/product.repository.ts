import { eq, and, ilike, gte, lte, desc, asc, inArray } from 'drizzle-orm';
import { BaseRepository } from '../core/base.repository';
import { db } from '../config/database.config';
import { products, users, vendors } from '../../../shared/schema';

export interface ProductSearchFilters {
  category?: string;
  marketplaceType?: string;
  priceMin?: number;
  priceMax?: number;
  vendorId?: number;
  location?: string;
  status?: string;
  offeringType?: string;
}

export interface ProductSortOptions {
  field: 'price' | 'createdAt' | 'updatedAt' | 'name' | 'views';
  direction: 'asc' | 'desc';
}

export interface ProductData {
  name: string;
  description: string;
  price: number;
  category: string;
  marketplaceType: string;
  offeringType: string;
  vendorId: number;
  imageUrl?: string;
  location?: string;
  weight?: number;
  dimensions?: string;
  stockQuantity?: number;
  vatIncluded?: boolean;
  vatRate?: number;
  isActive?: boolean;
}

export class ProductRepository extends BaseRepository {

  async createProduct(productData: ProductData): Promise<any> {
    try {
      const productCode = this.generateProductCode(productData.vendorId);
      
      const [product] = await db.insert(products).values({
        ...productData,
        productCode,
        isActive: productData.isActive ?? true,
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();

      return product;
    } catch (error) {
      console.error('[PRODUCT_REPOSITORY] Product creation error:', error);
      throw new Error('Failed to create product');
    }
  }

  async getProductById(id: number): Promise<any | null> {
    try {
      const result = await db.select({
        product: products,
        vendor: {
          id: vendors.id,
          storeName: vendors.storeName,
          businessName: vendors.businessName,
          userId: vendors.userId
        },
        user: {
          id: users.id,
          username: users.username,
          name: users.name,
          avatar: users.avatar
        }
      })
      .from(products)
      .leftJoin(vendors, eq(products.vendorId, vendors.id))
      .leftJoin(users, eq(vendors.userId, users.id))
      .where(eq(products.id, id))
      .limit(1);

      if (!result.length) {
        return null;
      }

      const { product, vendor, user } = result[0];
      return {
        ...product,
        vendor: vendor ? {
          ...vendor,
          user: user
        } : null
      };
    } catch (error) {
      console.error('[PRODUCT_REPOSITORY] Product retrieval error:', error);
      throw new Error('Failed to retrieve product');
    }
  }

  async getProductsByVendor(vendorId: number, page: number = 1, limit: number = 20): Promise<{ products: any[]; total: number; hasMore: boolean }> {
    try {
      const offset = (page - 1) * limit;

      const [productsList, totalCount] = await Promise.all([
        db.select()
          .from(products)
          .where(eq(products.vendorId, vendorId))
          .orderBy(desc(products.createdAt))
          .limit(limit)
          .offset(offset),
        
        db.select({ count: products.id })
          .from(products)
          .where(eq(products.vendorId, vendorId))
      ]);

      const total = totalCount.length;
      const hasMore = offset + productsList.length < total;

      return {
        products: productsList,
        total,
        hasMore
      };
    } catch (error) {
      console.error('[PRODUCT_REPOSITORY] Vendor products retrieval error:', error);
      throw new Error('Failed to retrieve vendor products');
    }
  }

  async searchProducts(
    query?: string,
    filters?: ProductSearchFilters,
    sort?: ProductSortOptions,
    page: number = 1,
    limit: number = 20
  ): Promise<{ products: any[]; total: number; hasMore: boolean }> {
    try {
      const offset = (page - 1) * limit;
      const conditions = [];

      // Text search
      if (query) {
        conditions.push(
          ilike(products.name, `%${query}%`)
        );
      }

      // Filters
      if (filters?.category) {
        conditions.push(eq(products.category, filters.category));
      }

      if (filters?.marketplaceType) {
        conditions.push(eq(products.marketplaceType, filters.marketplaceType));
      }

      if (filters?.vendorId) {
        conditions.push(eq(products.vendorId, filters.vendorId));
      }

      if (filters?.status) {
        conditions.push(eq(products.status, filters.status));
      }

      if (filters?.offeringType) {
        conditions.push(eq(products.offeringType, filters.offeringType));
      }

      if (filters?.priceMin !== undefined) {
        conditions.push(gte(products.price, filters.priceMin));
      }

      if (filters?.priceMax !== undefined) {
        conditions.push(lte(products.price, filters.priceMax));
      }

      // Only show active products by default
      conditions.push(eq(products.isActive, true));

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      // Sorting
      let orderBy;
      if (sort) {
        const direction = sort.direction === 'asc' ? asc : desc;
        switch (sort.field) {
          case 'price':
            orderBy = direction(products.price);
            break;
          case 'name':
            orderBy = direction(products.name);
            break;
          case 'views':
            orderBy = direction(products.views);
            break;
          case 'updatedAt':
            orderBy = direction(products.updatedAt);
            break;
          default:
            orderBy = desc(products.createdAt);
        }
      } else {
        orderBy = desc(products.createdAt);
      }

      const [productsList, totalCount] = await Promise.all([
        db.select({
          product: products,
          vendor: {
            id: vendors.id,
            storeName: vendors.storeName,
            businessName: vendors.businessName,
            userId: vendors.userId
          },
          user: {
            id: users.id,
            username: users.username,
            name: users.name,
            avatar: users.avatar
          }
        })
        .from(products)
        .leftJoin(vendors, eq(products.vendorId, vendors.id))
        .leftJoin(users, eq(vendors.userId, users.id))
        .where(whereClause)
        .orderBy(orderBy)
        .limit(limit)
        .offset(offset),
        
        db.select({ count: products.id })
          .from(products)
          .where(whereClause)
      ]);

      const total = totalCount.length;
      const hasMore = offset + productsList.length < total;

      const formattedProducts = productsList.map(({ product, vendor, user }) => ({
        ...product,
        vendor: vendor ? {
          ...vendor,
          user: user
        } : null
      }));

      return {
        products: formattedProducts,
        total,
        hasMore
      };
    } catch (error) {
      console.error('[PRODUCT_REPOSITORY] Product search error:', error);
      throw new Error('Failed to search products');
    }
  }

  async updateProduct(id: number, updates: Partial<ProductData>): Promise<any | null> {
    try {
      const [product] = await db.update(products)
        .set({
          ...updates,
          updatedAt: new Date()
        })
        .where(eq(products.id, id))
        .returning();

      return product;
    } catch (error) {
      console.error('[PRODUCT_REPOSITORY] Product update error:', error);
      throw new Error('Failed to update product');
    }
  }

  async deleteProduct(id: number): Promise<boolean> {
    try {
      const result = await db.delete(products)
        .where(eq(products.id, id))
        .returning({ id: products.id });

      return result.length > 0;
    } catch (error) {
      console.error('[PRODUCT_REPOSITORY] Product deletion error:', error);
      throw new Error('Failed to delete product');
    }
  }

  async incrementViews(id: number): Promise<boolean> {
    try {
      // TODO: Implement views increment when schema supports it
      // For now, return true as placeholder
      return true;
    } catch (error) {
      console.error('[PRODUCT_REPOSITORY] Views increment error:', error);
      throw new Error('Failed to increment views');
    }
  }

  async updateStock(id: number, quantity: number): Promise<boolean> {
    try {
      const [product] = await db.update(products)
        .set({
          stockQuantity: quantity,
          updatedAt: new Date()
        })
        .where(eq(products.id, id))
        .returning({ id: products.id });

      return !!product;
    } catch (error) {
      console.error('[PRODUCT_REPOSITORY] Stock update error:', error);
      throw new Error('Failed to update stock');
    }
  }

  async getProductsByIds(ids: number[]): Promise<any[]> {
    try {
      if (!ids.length) {
        return [];
      }

      const productsList = await db.select({
        product: products,
        vendor: {
          id: vendors.id,
          storeName: vendors.storeName,
          businessName: vendors.businessName,
          userId: vendors.userId
        },
        user: {
          id: users.id,
          username: users.username,
          name: users.name,
          avatar: users.avatar
        }
      })
      .from(products)
      .leftJoin(vendors, eq(products.vendorId, vendors.id))
      .leftJoin(users, eq(vendors.userId, users.id))
      .where(inArray(products.id, ids));

      return productsList.map(({ product, vendor, user }) => ({
        ...product,
        vendor: vendor ? {
          ...vendor,
          user: user
        } : null
      }));
    } catch (error) {
      console.error('[PRODUCT_REPOSITORY] Bulk product retrieval error:', error);
      throw new Error('Failed to retrieve products');
    }
  }

  async getProductStats(vendorId: number): Promise<{ totalProducts: number; activeProducts: number; totalViews: number; averagePrice: number }> {
    try {
      const [stats] = await db.select({
        totalProducts: products.id,
        activeProducts: products.isActive,
        totalViews: products.views,
        averagePrice: products.price
      })
      .from(products)
      .where(eq(products.vendorId, vendorId));

      // TODO: Implement proper aggregation when Drizzle supports it
      // For now, return basic stats structure
      return {
        totalProducts: 0,
        activeProducts: 0,
        totalViews: 0,
        averagePrice: 0
      };
    } catch (error) {
      console.error('[PRODUCT_REPOSITORY] Product stats error:', error);
      throw new Error('Failed to retrieve product stats');
    }
  }

  private generateProductCode(vendorId: number): string {
    const now = new Date();
    const productCount = Math.floor(Math.random() * 1000) + 1; // TODO: Get actual count
    return `${productCount}${vendorId}${now.getDate().toString().padStart(2, '0')}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getFullYear()}`;
  }
}