import { storage } from './storage';
import { hashPassword } from './auth';

async function seedDatabase() {
  try {
    console.log('Starting database seeding...');

    // Create default admin user
    const adminExists = await storage.getUserByUsername('admin');
    if (!adminExists) {
      console.log('Creating admin user...');
      const admin = await storage.createUser({
        username: 'admin',
        password: await hashPassword('admin123'),
        name: 'Admin User',
        email: 'admin@example.com',
        isVendor: true,
      });
      console.log(`Admin user created with ID: ${admin.id}`);
    }

    // Create categories if they don't exist
    const categories = [
      'Fashion & Apparel',
      'Electronics',
      'Home & Garden',
      'Beauty & Personal Care',
      'Sports & Outdoors',
      'Books & Media'
    ];

    for (const categoryName of categories) {
      const categoryExists = await storage.getCategoryByName(categoryName);
      if (!categoryExists) {
        console.log(`Creating category: ${categoryName}...`);
        await storage.createCategory({ name: categoryName });
      }
    }

    // Create vendor account for admin
    let adminVendor = await storage.getVendorByUserId(1);
    if (!adminVendor) {
      console.log('Creating vendor account for admin...');
      adminVendor = await storage.createVendor({
        userId: 1,
        storeName: 'Admin Store',
        description: 'The official store of the marketplace',
      });
      
      // Update the vendor rating separately
      adminVendor = await storage.updateVendorRating(adminVendor.id, 4.9);
      console.log(`Vendor account created with ID: ${adminVendor.id}`);
    }

    // Create sample products
    const existingProducts = await storage.listProducts();
    if (existingProducts.length === 0) {
      console.log('Creating sample products...');
      
      const productData = [
        {
          name: 'Premium Wireless Headphones',
          description: 'Experience crystal-clear sound with our premium wireless headphones. Features noise cancellation, 30-hour battery life, and comfortable over-ear design.',
          price: 159.99, // GBP prices
          discountPrice: 129.99,
          category: 'Electronics',
          imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500',
          inventory: 50,
          isNew: true,
          isOnSale: true,
          vendorId: adminVendor.id,
        },
        {
          name: 'Smart Fitness Tracker',
          description: 'Track your fitness goals with our advanced fitness tracker. Monitors heart rate, steps, sleep quality, and connects to your smartphone for notifications.',
          price: 69.99, // GBP prices
          category: 'Electronics',
          imageUrl: 'https://images.unsplash.com/photo-1576243345690-4e4b79b63288?w=500',
          inventory: 75,
          isNew: true,
          isOnSale: false,
          vendorId: adminVendor.id,
        },
        {
          name: 'Organic Cotton T-Shirt',
          description: 'Soft, breathable, and eco-friendly organic cotton t-shirt. Available in multiple colors and sizes. Perfect for everyday wear.',
          price: 22.99, // GBP prices
          discountPrice: 19.99,
          category: 'Fashion & Apparel',
          imageUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500',
          inventory: 100,
          isNew: false,
          isOnSale: true,
          vendorId: adminVendor.id,
        },
        {
          name: 'Stainless Steel Water Bottle',
          description: 'Keep your drinks hot or cold for hours with our vacuum-insulated stainless steel water bottle. Leak-proof, BPA-free, and eco-friendly.',
          price: 27.50, // GBP prices
          category: 'Sports & Outdoors',
          imageUrl: 'https://images.unsplash.com/photo-1523362628745-0c100150b504?w=500',
          inventory: 120,
          isNew: false,
          isOnSale: false,
          vendorId: adminVendor.id,
        },
        {
          name: 'Aromatherapy Essential Oil Diffuser',
          description: 'Create a calming atmosphere with our ultrasonic essential oil diffuser. Features LED mood lighting, timer settings, and auto-shutoff for safety.',
          price: 34.99, // GBP prices
          discountPrice: 29.99,
          category: 'Home & Garden',
          imageUrl: 'https://images.unsplash.com/photo-1595981234058-a9302fb97229?w=500',
          inventory: 60,
          isNew: true,
          isOnSale: true,
          vendorId: adminVendor.id,
        },
        {
          name: 'Organic Face Serum',
          description: 'Rejuvenate your skin with our organic face serum. Packed with vitamins and antioxidants to help reduce fine lines and improve skin texture.',
          price: 45.99, // GBP prices
          category: 'Beauty & Personal Care',
          imageUrl: 'https://images.unsplash.com/photo-1570194065650-d99fb4a8e0ea?w=500',
          inventory: 40,
          isNew: true,
          isOnSale: false,
          vendorId: adminVendor.id,
        },
        {
          name: 'Bestselling Novel Collection',
          description: 'A collection of five bestselling novels from renowned authors. Perfect for book lovers and as a thoughtful gift.',
          price: 59.99, // GBP prices
          discountPrice: 49.99,
          category: 'Books & Media',
          imageUrl: 'https://images.unsplash.com/photo-1495640388908-25ae0a9ec5e5?w=500',
          inventory: 30,
          isNew: false,
          isOnSale: true,
          vendorId: adminVendor.id,
        },
        {
          name: 'Ergonomic Office Chair',
          description: 'Work in comfort with our ergonomic office chair. Features adjustable height, lumbar support, and breathable mesh back for all-day comfort.',
          price: 189.99, // GBP prices
          category: 'Home & Garden',
          imageUrl: 'https://images.unsplash.com/photo-1592078615290-033ee584e267?w=500',
          inventory: 25,
          isNew: false,
          isOnSale: false,
          vendorId: adminVendor.id,
        }
      ];

      for (const product of productData) {
        await storage.createProduct(product);
      }
      
      console.log(`Created ${productData.length} sample products`);
    }

    console.log('Database seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
  }
}

export { seedDatabase };