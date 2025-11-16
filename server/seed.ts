import { storage } from './storage';
import { hashPassword } from './auth';
import type { Category } from '@shared/schema';

// OPTIMIZATION: Batch size for chunking large inserts
const BATCH_SIZE = 100;

// OPTIMIZATION: Helper to chunk arrays for batch processing
function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

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

    // OPTIMIZATION: Efficient product count check
    const existingProducts = await storage.listProducts();
    if (existingProducts.length === 0) {
      console.log('Creating sample products...');
      
      const productData = [
        {
          name: 'Premium Wireless Headphones',
          description: 'Experience crystal-clear sound with our premium wireless headphones. Features noise cancellation, 30-hour battery life, and comfortable over-ear design.',
          slug: 'premium-wireless-headphones',
          price: 159.99,
          discountPrice: 129.99,
          category: 'Electronics',
          imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500',
          marketplace: 'b2c' as const,
          vendorId: adminVendor.id,
        },
        {
          name: 'Smart Fitness Tracker',
          description: 'Track your fitness goals with our advanced fitness tracker. Monitors heart rate, steps, sleep quality, and connects to your smartphone for notifications.',
          slug: 'smart-fitness-tracker',
          price: 69.99,
          category: 'Electronics',
          imageUrl: 'https://images.unsplash.com/photo-1576243345690-4e4b79b63288?w=500',
          marketplace: 'b2c' as const,
          vendorId: adminVendor.id,
        },
        {
          name: 'Organic Cotton T-Shirt',
          description: 'Soft, breathable, and eco-friendly organic cotton t-shirt. Available in multiple colors and sizes. Perfect for everyday wear.',
          slug: 'organic-cotton-t-shirt',
          price: 22.99,
          discountPrice: 19.99,
          category: 'Fashion & Apparel',
          imageUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500',
          marketplace: 'b2c' as const,
          inventory: 100,
          isNew: false,
          isOnSale: true,
          vendorId: adminVendor.id,
        },
        {
          name: 'Stainless Steel Water Bottle',
          description: 'Keep your drinks hot or cold for hours with our vacuum-insulated stainless steel water bottle. Leak-proof, BPA-free, and eco-friendly.',
          slug: 'stainless-steel-water-bottle',
          price: 27.50,
          category: 'Sports & Outdoors',
          imageUrl: 'https://images.unsplash.com/photo-1523362628745-0c100150b504?w=500',
          marketplace: 'b2c' as const,
          inventory: 120,
          isNew: false,
          isOnSale: false,
          vendorId: adminVendor.id,
        },
        {
          name: 'Aromatherapy Essential Oil Diffuser',
          description: 'Create a calming atmosphere with our ultrasonic essential oil diffuser. Features LED mood lighting, timer settings, and auto-shutoff for safety.',
          slug: 'aromatherapy-essential-oil-diffuser',
          price: 34.99,
          discountPrice: 29.99,
          category: 'Home & Garden',
          imageUrl: 'https://images.unsplash.com/photo-1595981234058-a9302fb97229?w=500',
          marketplace: 'b2c' as const,
          inventory: 60,
          isNew: true,
          isOnSale: true,
          vendorId: adminVendor.id,
        },
        {
          name: 'Organic Face Serum',
          description: 'Rejuvenate your skin with our organic face serum. Packed with vitamins and antioxidants to help reduce fine lines and improve skin texture.',
          slug: 'organic-face-serum',
          price: 45.99,
          category: 'Beauty & Personal Care',
          imageUrl: 'https://images.unsplash.com/photo-1570194065650-d99fb4a8e0ea?w=500',
          marketplace: 'b2c' as const,
          inventory: 40,
          isNew: true,
          isOnSale: false,
          vendorId: adminVendor.id,
        },
        {
          name: 'Bestselling Novel Collection',
          description: 'A collection of five bestselling novels from renowned authors. Perfect for book lovers and as a thoughtful gift.',
          slug: 'bestselling-novel-collection',
          price: 59.99,
          discountPrice: 49.99,
          category: 'Books & Media',
          imageUrl: 'https://images.unsplash.com/photo-1495640388908-25ae0a9ec5e5?w=500',
          marketplace: 'b2c' as const,
          inventory: 30,
          isNew: false,
          isOnSale: true,
          vendorId: adminVendor.id,
        },
        {
          name: 'Ergonomic Office Chair',
          description: 'Work in comfort with our ergonomic office chair. Features adjustable height, lumbar support, and breathable mesh back for all-day comfort.',
          slug: 'ergonomic-office-chair',
          price: 189.99,
          category: 'Home & Garden',
          imageUrl: 'https://images.unsplash.com/photo-1592078615290-033ee584e267?w=500',
          marketplace: 'b2c' as const,
          inventory: 25,
          isNew: false,
          isOnSale: false,
          vendorId: adminVendor.id,
        }
      ];

      // OPTIMIZATION: Chunk products into batches to avoid memory issues
      const productChunks = chunkArray(productData, BATCH_SIZE);
      let totalCreated = 0;
      
      for (let i = 0; i < productChunks.length; i++) {
        const chunk = productChunks[i];
        console.log(`Processing product batch ${i + 1}/${productChunks.length} (${chunk.length} products)...`);
        
        // OPTIMIZATION: Parallel creation within each batch
        await Promise.all(
          chunk.map(product => storage.createProduct(product))
        );
        
        totalCreated += chunk.length;
        console.log(`✅ Progress: ${totalCreated}/${productData.length} products created`);
      }
      
      console.log(`✅ Created ${productData.length} sample products in ${productChunks.length} batch(es)`);
    } else {
      console.log(`✅ Skipped products - ${existingProducts.length} already exist`);
    }

    const duration = Date.now() - startTime;
    console.log(`Database seeding completed successfully in ${duration}ms!`);
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  }
}

export { seedDatabase };