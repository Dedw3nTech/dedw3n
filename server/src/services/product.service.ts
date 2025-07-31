import { BaseService } from '../core/base.service';
import { ProductRepository, ProductData, ProductSearchFilters, ProductSortOptions } from '../repositories/product.repository';
import { VendorService } from './vendor.service';
import { BusinessError, ValidationError, NotFoundError } from '../core/errors';

export interface CreateProductRequest {
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
}

export interface UpdateProductRequest {
  name?: string;
  description?: string;
  price?: number;
  category?: string;
  imageUrl?: string;
  location?: string;
  weight?: number;
  dimensions?: string;
  stockQuantity?: number;
  vatIncluded?: boolean;
  vatRate?: number;
  isActive?: boolean;
}

export class ProductService extends BaseService {
  
  constructor(
    private productRepository: ProductRepository,
    private vendorService: VendorService
  ) {
    super();
  }

  async createProduct(productData: CreateProductRequest, userId: number): Promise<any> {
    try {
      // Validate input
      await this.validateProductData(productData);

      // Verify vendor ownership
      const vendor = await this.vendorService.getVendorById(productData.vendorId);
      if (!vendor) {
        throw new NotFoundError('Vendor not found');
      }

      if (vendor.userId !== userId) {
        throw new BusinessError('You can only create products for your own vendor account');
      }

      // Create product
      const product = await this.productRepository.createProduct(productData);

      console.log(`[PRODUCT_SERVICE] Product created: ${product.name} (ID: ${product.id})`);

      return product;
    } catch (error) {
      if (error instanceof ValidationError || error instanceof BusinessError || error instanceof NotFoundError) {
        throw error;
      }
      console.error('[PRODUCT_SERVICE] Product creation error:', error);
      throw new BusinessError('Failed to create product');
    }
  }

  async getProductById(id: number): Promise<any> {
    try {
      if (!this.isPositiveNumber(id)) {
        throw new ValidationError('Invalid product ID');
      }

      const product = await this.productRepository.getProductById(id);
      if (!product) {
        throw new NotFoundError('Product not found');
      }

      return product;
    } catch (error) {
      if (error instanceof ValidationError || error instanceof NotFoundError) {
        throw error;
      }
      console.error('[PRODUCT_SERVICE] Product retrieval error:', error);
      throw new BusinessError('Failed to retrieve product');
    }
  }

  async updateProduct(id: number, updates: UpdateProductRequest, userId: number): Promise<any> {
    try {
      // Validate input
      if (!this.isPositiveNumber(id)) {
        throw new ValidationError('Invalid product ID');
      }

      // Get existing product
      const existingProduct = await this.productRepository.getProductById(id);
      if (!existingProduct) {
        throw new NotFoundError('Product not found');
      }

      // Verify vendor ownership
      if (existingProduct.vendor?.userId !== userId) {
        throw new BusinessError('You can only update your own products');
      }

      // Validate updates
      if (updates.name && (updates.name.length < 1 || updates.name.length > 200)) {
        throw new ValidationError('Product name must be between 1 and 200 characters');
      }

      if (updates.description && updates.description.length > 2000) {
        throw new ValidationError('Product description must be at most 2000 characters');
      }

      if (updates.price !== undefined && !this.isPositiveNumber(updates.price)) {
        throw new ValidationError('Product price must be a positive number');
      }

      if (updates.stockQuantity !== undefined && updates.stockQuantity < 0) {
        throw new ValidationError('Stock quantity cannot be negative');
      }

      if (updates.vatRate !== undefined && (updates.vatRate < 0 || updates.vatRate > 100)) {
        throw new ValidationError('VAT rate must be between 0 and 100');
      }

      // Update product
      const updatedProduct = await this.productRepository.updateProduct(id, updates);

      console.log(`[PRODUCT_SERVICE] Product updated: ${id}`);

      return updatedProduct;
    } catch (error) {
      if (error instanceof ValidationError || error instanceof BusinessError || error instanceof NotFoundError) {
        throw error;
      }
      console.error('[PRODUCT_SERVICE] Product update error:', error);
      throw new BusinessError('Failed to update product');
    }
  }

  async deleteProduct(id: number, userId: number): Promise<boolean> {
    try {
      if (!this.isPositiveNumber(id)) {
        throw new ValidationError('Invalid product ID');
      }

      // Get existing product
      const existingProduct = await this.productRepository.getProductById(id);
      if (!existingProduct) {
        throw new NotFoundError('Product not found');
      }

      // Verify vendor ownership
      if (existingProduct.vendor?.userId !== userId) {
        throw new BusinessError('You can only delete your own products');
      }

      // Delete product
      const deleted = await this.productRepository.deleteProduct(id);

      if (deleted) {
        console.log(`[PRODUCT_SERVICE] Product deleted: ${id}`);
      }

      return deleted;
    } catch (error) {
      if (error instanceof ValidationError || error instanceof BusinessError || error instanceof NotFoundError) {
        throw error;
      }
      console.error('[PRODUCT_SERVICE] Product deletion error:', error);
      throw new BusinessError('Failed to delete product');
    }
  }

  async searchProducts(
    query?: string,
    filters?: ProductSearchFilters,
    sort?: ProductSortOptions,
    page: number = 1,
    limit: number = 20
  ): Promise<{ products: any[]; total: number; hasMore: boolean; page: number; limit: number }> {
    try {
      // Validate pagination
      if (!this.isPositiveNumber(page) || page < 1) {
        throw new ValidationError('Page must be a positive number');
      }

      if (!this.isPositiveNumber(limit) || limit < 1 || limit > 100) {
        throw new ValidationError('Limit must be between 1 and 100');
      }

      // Validate filters
      if (filters?.priceMin !== undefined && !this.isPositiveNumber(filters.priceMin)) {
        throw new ValidationError('Minimum price must be a positive number');
      }

      if (filters?.priceMax !== undefined && !this.isPositiveNumber(filters.priceMax)) {
        throw new ValidationError('Maximum price must be a positive number');
      }

      if (filters?.priceMin !== undefined && filters?.priceMax !== undefined && filters.priceMin > filters.priceMax) {
        throw new ValidationError('Minimum price cannot be greater than maximum price');
      }

      // Search products
      const result = await this.productRepository.searchProducts(query, filters, sort, page, limit);

      return {
        ...result,
        page,
        limit
      };
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      console.error('[PRODUCT_SERVICE] Product search error:', error);
      throw new BusinessError('Failed to search products');
    }
  }

  async getVendorProducts(vendorId: number, page: number = 1, limit: number = 20): Promise<{ products: any[]; total: number; hasMore: boolean; page: number; limit: number }> {
    try {
      if (!this.isPositiveNumber(vendorId)) {
        throw new ValidationError('Invalid vendor ID');
      }

      if (!this.isPositiveNumber(page) || page < 1) {
        throw new ValidationError('Page must be a positive number');
      }

      if (!this.isPositiveNumber(limit) || limit < 1 || limit > 100) {
        throw new ValidationError('Limit must be between 1 and 100');
      }

      const result = await this.productRepository.getProductsByVendor(vendorId, page, limit);

      return {
        ...result,
        page,
        limit
      };
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      console.error('[PRODUCT_SERVICE] Vendor products retrieval error:', error);
      throw new BusinessError('Failed to retrieve vendor products');
    }
  }

  async incrementProductViews(id: number): Promise<boolean> {
    try {
      if (!this.isPositiveNumber(id)) {
        throw new ValidationError('Invalid product ID');
      }

      const incremented = await this.productRepository.incrementViews(id);

      if (incremented) {
        console.log(`[PRODUCT_SERVICE] Product views incremented: ${id}`);
      }

      return incremented;
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      console.error('[PRODUCT_SERVICE] Views increment error:', error);
      // Don't throw error for view tracking failures
      return false;
    }
  }

  async updateProductStock(id: number, quantity: number, userId: number): Promise<boolean> {
    try {
      if (!this.isPositiveNumber(id)) {
        throw new ValidationError('Invalid product ID');
      }

      if (quantity < 0) {
        throw new ValidationError('Stock quantity cannot be negative');
      }

      // Get existing product to verify ownership
      const existingProduct = await this.productRepository.getProductById(id);
      if (!existingProduct) {
        throw new NotFoundError('Product not found');
      }

      // Verify vendor ownership
      if (existingProduct.vendor?.userId !== userId) {
        throw new BusinessError('You can only update stock for your own products');
      }

      const updated = await this.productRepository.updateStock(id, quantity);

      if (updated) {
        console.log(`[PRODUCT_SERVICE] Product stock updated: ${id} -> ${quantity}`);
      }

      return updated;
    } catch (error) {
      if (error instanceof ValidationError || error instanceof BusinessError || error instanceof NotFoundError) {
        throw error;
      }
      console.error('[PRODUCT_SERVICE] Stock update error:', error);
      throw new BusinessError('Failed to update product stock');
    }
  }

  async getProductsByIds(ids: number[]): Promise<any[]> {
    try {
      if (!Array.isArray(ids) || ids.length === 0) {
        return [];
      }

      // Validate all IDs
      for (const id of ids) {
        if (!this.isPositiveNumber(id)) {
          throw new ValidationError(`Invalid product ID: ${id}`);
        }
      }

      const products = await this.productRepository.getProductsByIds(ids);

      return products;
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      console.error('[PRODUCT_SERVICE] Bulk product retrieval error:', error);
      throw new BusinessError('Failed to retrieve products');
    }
  }

  private async validateProductData(productData: CreateProductRequest): Promise<void> {
    if (!productData.name || productData.name.length < 1 || productData.name.length > 200) {
      throw new ValidationError('Product name must be between 1 and 200 characters');
    }

    if (!productData.description || productData.description.length < 1 || productData.description.length > 2000) {
      throw new ValidationError('Product description must be between 1 and 2000 characters');
    }

    if (!this.isPositiveNumber(productData.price)) {
      throw new ValidationError('Product price must be a positive number');
    }

    if (!productData.category || productData.category.length < 1) {
      throw new ValidationError('Product category is required');
    }

    if (!productData.marketplaceType || productData.marketplaceType.length < 1) {
      throw new ValidationError('Marketplace type is required');
    }

    if (!productData.offeringType || productData.offeringType.length < 1) {
      throw new ValidationError('Offering type is required');
    }

    if (!this.isPositiveNumber(productData.vendorId)) {
      throw new ValidationError('Valid vendor ID is required');
    }

    if (productData.stockQuantity !== undefined && productData.stockQuantity < 0) {
      throw new ValidationError('Stock quantity cannot be negative');
    }

    if (productData.vatRate !== undefined && (productData.vatRate < 0 || productData.vatRate > 100)) {
      throw new ValidationError('VAT rate must be between 0 and 100');
    }

    if (productData.weight !== undefined && productData.weight < 0) {
      throw new ValidationError('Weight cannot be negative');
    }
  }
}