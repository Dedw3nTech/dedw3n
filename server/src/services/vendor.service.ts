import { BaseService } from '../core/base.service';
import { VendorRepository, VendorData, VendorProfileData } from '../repositories/vendor.repository';
import { UserService } from './user.service';
import { BusinessError, ValidationError, NotFoundError } from '../core/errors';

export interface CreateVendorRequest {
  storeName: string;
  businessName?: string;
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  logoUrl?: string;
  bannerUrl?: string;
  marketplaceTypes?: string[];
  businessHours?: object;
  shippingOptions?: object;
  paymentMethods?: string[];
}

export interface UpdateVendorRequest {
  storeName?: string;
  businessName?: string;
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  logoUrl?: string;
  bannerUrl?: string;
  businessHours?: object;
  shippingOptions?: object;
  paymentMethods?: string[];
}

export class VendorService extends BaseService {
  
  constructor(
    private vendorRepository: VendorRepository,
    private userService: UserService
  ) {
    super();
  }

  async createVendor(vendorData: CreateVendorRequest, userId: number): Promise<any> {
    try {
      // Validate input
      await this.validateVendorData(vendorData);

      // Check if user exists
      const user = await this.userService.getUserById(userId);
      if (!user) {
        throw new NotFoundError('User not found');
      }

      // Check if user already has a vendor account
      const existingVendor = await this.vendorRepository.getVendorByUserId(userId);
      if (existingVendor) {
        throw new BusinessError('User already has a vendor account');
      }

      // Validate email if provided
      if (vendorData.email && !this.validateEmail(vendorData.email)) {
        throw new ValidationError('Invalid email format');
      }

      // Create vendor
      const vendor = await this.vendorRepository.createVendor({
        ...vendorData,
        userId,
        isActive: true
      });

      // Update user to vendor role
      await this.userService.updateUser(userId, { isVendor: true, role: 'vendor' });

      console.log(`[VENDOR_SERVICE] Vendor created: ${vendor.storeName} (ID: ${vendor.id})`);

      return vendor;
    } catch (error) {
      if (error instanceof ValidationError || error instanceof BusinessError || error instanceof NotFoundError) {
        throw error;
      }
      console.error('[VENDOR_SERVICE] Vendor creation error:', error);
      throw new BusinessError('Failed to create vendor account');
    }
  }

  async getVendorById(id: number): Promise<any> {
    try {
      if (!this.isPositiveNumber(id)) {
        throw new ValidationError('Invalid vendor ID');
      }

      const vendor = await this.vendorRepository.getVendorById(id);
      if (!vendor) {
        throw new NotFoundError('Vendor not found');
      }

      return vendor;
    } catch (error) {
      if (error instanceof ValidationError || error instanceof NotFoundError) {
        throw error;
      }
      console.error('[VENDOR_SERVICE] Vendor retrieval error:', error);
      throw new BusinessError('Failed to retrieve vendor');
    }
  }

  async getVendorByUserId(userId: number): Promise<any | null> {
    try {
      if (!this.isPositiveNumber(userId)) {
        throw new ValidationError('Invalid user ID');
      }

      const vendor = await this.vendorRepository.getVendorByUserId(userId);

      return vendor;
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      console.error('[VENDOR_SERVICE] Vendor by user retrieval error:', error);
      throw new BusinessError('Failed to retrieve vendor by user');
    }
  }

  async updateVendor(id: number, updates: UpdateVendorRequest, userId: number): Promise<any> {
    try {
      // Validate input
      if (!this.isPositiveNumber(id)) {
        throw new ValidationError('Invalid vendor ID');
      }

      // Get existing vendor
      const existingVendor = await this.vendorRepository.getVendorById(id);
      if (!existingVendor) {
        throw new NotFoundError('Vendor not found');
      }

      // Verify ownership
      if (existingVendor.userId !== userId) {
        throw new BusinessError('You can only update your own vendor account');
      }

      // Validate updates
      if (updates.storeName && (updates.storeName.length < 1 || updates.storeName.length > 100)) {
        throw new ValidationError('Store name must be between 1 and 100 characters');
      }

      if (updates.description && updates.description.length > 1000) {
        throw new ValidationError('Description must be at most 1000 characters');
      }

      if (updates.email && !this.validateEmail(updates.email)) {
        throw new ValidationError('Invalid email format');
      }

      if (updates.website && !this.isValidUrl(updates.website)) {
        throw new ValidationError('Invalid website URL');
      }

      // Update vendor
      const updatedVendor = await this.vendorRepository.updateVendor(id, updates);

      console.log(`[VENDOR_SERVICE] Vendor updated: ${id}`);

      return updatedVendor;
    } catch (error) {
      if (error instanceof ValidationError || error instanceof BusinessError || error instanceof NotFoundError) {
        throw error;
      }
      console.error('[VENDOR_SERVICE] Vendor update error:', error);
      throw new BusinessError('Failed to update vendor');
    }
  }

  async deleteVendor(id: number, userId: number): Promise<boolean> {
    try {
      if (!this.isPositiveNumber(id)) {
        throw new ValidationError('Invalid vendor ID');
      }

      // Get existing vendor
      const existingVendor = await this.vendorRepository.getVendorById(id);
      if (!existingVendor) {
        throw new NotFoundError('Vendor not found');
      }

      // Verify ownership
      if (existingVendor.userId !== userId) {
        throw new BusinessError('You can only delete your own vendor account');
      }

      // Delete vendor
      const deleted = await this.vendorRepository.deleteVendor(id);

      if (deleted) {
        // Update user role back to regular user
        await this.userService.updateUser(userId, { isVendor: false, role: 'user' });
        console.log(`[VENDOR_SERVICE] Vendor deleted: ${id}`);
      }

      return deleted;
    } catch (error) {
      if (error instanceof ValidationError || error instanceof BusinessError || error instanceof NotFoundError) {
        throw error;
      }
      console.error('[VENDOR_SERVICE] Vendor deletion error:', error);
      throw new BusinessError('Failed to delete vendor');
    }
  }

  async searchVendors(
    query?: string,
    marketplaceType?: string,
    location?: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{ vendors: any[]; total: number; hasMore: boolean; page: number; limit: number }> {
    try {
      // Validate pagination
      if (!this.isPositiveNumber(page) || page < 1) {
        throw new ValidationError('Page must be a positive number');
      }

      if (!this.isPositiveNumber(limit) || limit < 1 || limit > 100) {
        throw new ValidationError('Limit must be between 1 and 100');
      }

      // Search vendors
      const result = await this.vendorRepository.searchVendors(query, marketplaceType, location, page, limit);

      return {
        ...result,
        page,
        limit
      };
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      console.error('[VENDOR_SERVICE] Vendor search error:', error);
      throw new BusinessError('Failed to search vendors');
    }
  }

  async activateVendor(id: number, adminUserId: number): Promise<boolean> {
    try {
      if (!this.isPositiveNumber(id)) {
        throw new ValidationError('Invalid vendor ID');
      }

      // TODO: Add admin role check when role system is implemented
      // For now, any authenticated user can activate (placeholder)

      const activated = await this.vendorRepository.activateVendor(id);

      if (activated) {
        console.log(`[VENDOR_SERVICE] Vendor activated: ${id} by admin ${adminUserId}`);
      }

      return activated;
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      console.error('[VENDOR_SERVICE] Vendor activation error:', error);
      throw new BusinessError('Failed to activate vendor');
    }
  }

  async deactivateVendor(id: number, adminUserId: number): Promise<boolean> {
    try {
      if (!this.isPositiveNumber(id)) {
        throw new ValidationError('Invalid vendor ID');
      }

      // TODO: Add admin role check when role system is implemented
      // For now, any authenticated user can deactivate (placeholder)

      const deactivated = await this.vendorRepository.deactivateVendor(id);

      if (deactivated) {
        console.log(`[VENDOR_SERVICE] Vendor deactivated: ${id} by admin ${adminUserId}`);
      }

      return deactivated;
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      console.error('[VENDOR_SERVICE] Vendor deactivation error:', error);
      throw new BusinessError('Failed to deactivate vendor');
    }
  }

  async getVendorDashboardStats(vendorId: number, userId: number): Promise<any> {
    try {
      if (!this.isPositiveNumber(vendorId)) {
        throw new ValidationError('Invalid vendor ID');
      }

      // Verify ownership
      const vendor = await this.vendorRepository.getVendorById(vendorId);
      if (!vendor) {
        throw new NotFoundError('Vendor not found');
      }

      if (vendor.userId !== userId) {
        throw new BusinessError('You can only view your own vendor dashboard');
      }

      const stats = await this.vendorRepository.getVendorDashboardStats(vendorId);

      return stats;
    } catch (error) {
      if (error instanceof ValidationError || error instanceof BusinessError || error instanceof NotFoundError) {
        throw error;
      }
      console.error('[VENDOR_SERVICE] Dashboard stats error:', error);
      throw new BusinessError('Failed to retrieve dashboard stats');
    }
  }

  async getVendorCommissions(vendorId: number, userId: number, page: number = 1, limit: number = 20): Promise<any> {
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

      // Verify ownership
      const vendor = await this.vendorRepository.getVendorById(vendorId);
      if (!vendor) {
        throw new NotFoundError('Vendor not found');
      }

      if (vendor.userId !== userId) {
        throw new BusinessError('You can only view your own commission data');
      }

      const result = await this.vendorRepository.getVendorCommissions(vendorId, page, limit);

      return {
        ...result,
        page,
        limit
      };
    } catch (error) {
      if (error instanceof ValidationError || error instanceof BusinessError || error instanceof NotFoundError) {
        throw error;
      }
      console.error('[VENDOR_SERVICE] Commission retrieval error:', error);
      throw new BusinessError('Failed to retrieve commission data');
    }
  }

  private async validateVendorData(vendorData: CreateVendorRequest): Promise<void> {
    if (!vendorData.storeName || vendorData.storeName.length < 1 || vendorData.storeName.length > 100) {
      throw new ValidationError('Store name must be between 1 and 100 characters');
    }

    if (vendorData.businessName && vendorData.businessName.length > 100) {
      throw new ValidationError('Business name must be at most 100 characters');
    }

    if (vendorData.description && vendorData.description.length > 1000) {
      throw new ValidationError('Description must be at most 1000 characters');
    }

    if (vendorData.address && vendorData.address.length > 200) {
      throw new ValidationError('Address must be at most 200 characters');
    }

    if (vendorData.phone && vendorData.phone.length > 20) {
      throw new ValidationError('Phone number must be at most 20 characters');
    }
  }

  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
}