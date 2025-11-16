import { storage } from './storage';
import { hashPassword } from './auth';
import type { Category } from '@shared/schema';

async function seedDatabase() {
  try {
    console.log('Starting optimized database seeding...');
    const startTime = Date.now();

    // OPTIMIZATION: Early exit check - admin user is the primary indicator
    let admin = await storage.getUserByUsername('admin');
    if (!admin) {
      console.log('Creating admin user...');
      admin = await storage.createUser({
        username: 'admin',
        password: await hashPassword('admin123'),
        name: 'Admin User',
        email: 'info@dedw3n.com',
        emailVerified: true,
        isVendor: true,
        role: 'admin',
      });
      console.log(`Admin user created with ID: ${admin.id}`);
    } else {
      console.log(`Admin user already exists with ID: ${admin.id}`);
      
      // Update admin email if needed
      if (admin.email !== 'info@dedw3n.com' || !admin.emailVerified) {
        console.log('Updating admin email...');
        await storage.updateUser(admin.id, {
          email: 'info@dedw3n.com',
          emailVerified: true,
        });
        console.log('✅ Admin email updated');
      } else {
        console.log('✅ Admin email configured correctly');
      }
    }

    // OPTIMIZATION: Batch category creation with single query check
    const categoryNames = [
      'Fashion & Apparel',
      'Electronics',
      'Home & Garden',
      'Beauty & Personal Care',
      'Sports & Outdoors',
      'Books & Media'
    ];

    // Single query to get all existing categories
    const existingCategories = await storage.listCategories();
    const existingCategoryNames = new Set(existingCategories.map((c: Category) => c.name));
    
    // Filter and batch insert only missing categories
    const missingCategories = categoryNames.filter(name => !existingCategoryNames.has(name));
    if (missingCategories.length > 0) {
      console.log(`Creating ${missingCategories.length} categories...`);
      // Create in parallel batches for speed
      await Promise.all(
        missingCategories.map(name => storage.createCategory({ name }))
      );
      console.log(`✅ Created ${missingCategories.length} categories`);
    }

    // OPTIMIZATION: Vendor creation with early exit
    let adminVendor = await storage.getVendorByUserId(admin.id);
    if (!adminVendor) {
      console.log('Creating vendor account for admin...');
      adminVendor = await storage.createVendor({
        userId: admin.id,
        vendorType: 'business',
        storeName: 'Admin Store',
        businessName: 'Dedw3n Admin Store',
        businessType: 'Marketplace',
        email: 'admin@dedw3n.com',
        phone: '+44 20 1234 5678',
        address: '123 Admin Street',
        city: 'London',
        state: 'England',
        zipCode: 'SW1A 1AA',
        country: 'United Kingdom',
        description: 'The official store of the marketplace',
      });
      console.log(`✅ Vendor account created with ID: ${adminVendor.id}`);
    }

    // No sample products - marketplace uses only real vendor-created products
    console.log('✅ Database seeding complete - using real products only');

    const duration = Date.now() - startTime;
    console.log(`Database seeding completed successfully in ${duration}ms!`);
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  }
}

export { seedDatabase };