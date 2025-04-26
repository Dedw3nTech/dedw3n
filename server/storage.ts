import {
  users, vendors, products, categories, posts, comments,
  likes, messages, notifications, reviews, follows, carts,
  wallets, transactions,
  type User, type InsertUser, type Vendor, type InsertVendor,
  type Product, type InsertProduct, type Category, type InsertCategory,
  type Post, type InsertPost, type Comment, type InsertComment,
  type Message, type InsertMessage, type Review, type InsertReview,
  type Cart, type InsertCart, type Wallet, type InsertWallet,
  type Transaction, type InsertTransaction
} from "@shared/schema";

// Interface for all storage operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  listUsers(): Promise<User[]>;

  // Vendor operations
  getVendor(id: number): Promise<Vendor | undefined>;
  getVendorByUserId(userId: number): Promise<Vendor | undefined>;
  createVendor(vendor: InsertVendor): Promise<Vendor>;
  updateVendorRating(id: number, rating: number): Promise<Vendor>;
  listVendors(): Promise<Vendor[]>;

  // Product operations
  getProduct(id: number): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product>;
  deleteProduct(id: number): Promise<boolean>;
  listProducts(filters?: {
    category?: string;
    vendorId?: number;
    minPrice?: number;
    maxPrice?: number;
    isOnSale?: boolean;
    isNew?: boolean;
  }): Promise<Product[]>;

  // Category operations
  getCategory(id: number): Promise<Category | undefined>;
  getCategoryByName(name: string): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  listCategories(): Promise<Category[]>;

  // Post operations
  getPost(id: number): Promise<Post | undefined>;
  createPost(post: InsertPost): Promise<Post>;
  updatePostStats(id: number, stats: { likes?: number; comments?: number; shares?: number }): Promise<Post>;
  deletePost(id: number): Promise<boolean>;
  listPosts(userId?: number): Promise<Post[]>;

  // Comment operations
  getComment(id: number): Promise<Comment | undefined>;
  createComment(comment: InsertComment): Promise<Comment>;
  listCommentsByPost(postId: number): Promise<Comment[]>;

  // Message operations
  getMessage(id: number): Promise<Message | undefined>;
  createMessage(message: InsertMessage): Promise<Message>;
  listMessagesByUser(userId: number): Promise<Message[]>;
  countUnreadMessages(userId: number): Promise<number>;

  // Review operations
  getReview(id: number): Promise<Review | undefined>;
  createReview(review: InsertReview): Promise<Review>;
  listReviewsByProduct(productId: number): Promise<Review[]>;
  listReviewsByVendor(vendorId: number): Promise<Review[]>;

  // Cart operations
  getCartItem(id: number): Promise<Cart | undefined>;
  addToCart(cart: InsertCart): Promise<Cart>;
  updateCartQuantity(id: number, quantity: number): Promise<Cart>;
  removeFromCart(id: number): Promise<boolean>;
  listCartItems(userId: number): Promise<Cart[]>;
  countCartItems(userId: number): Promise<number>;
  
  // Wallet operations
  getWallet(id: number): Promise<Wallet | undefined>;
  getWalletByUserId(userId: number): Promise<Wallet | undefined>;
  createWallet(wallet: InsertWallet): Promise<Wallet>;
  updateWalletBalance(id: number, amount: number): Promise<Wallet>;
  
  // Transaction operations
  getTransaction(id: number): Promise<Transaction | undefined>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  listTransactionsByWallet(walletId: number): Promise<Transaction[]>;
  listTransactionsByUser(userId: number): Promise<Transaction[]>;
  getTransactionsByCategory(walletId: number): Promise<Record<string, Transaction[]>>;
  getTransactionStats(walletId: number): Promise<{
    totalIncome: number;
    totalExpense: number;
    byCategoryExpense: Record<string, number>;
    byCategoryIncome: Record<string, number>;
  }>;
  
  // Order operations
  getOrder(id: number): Promise<Order | undefined>;
  getOrdersByUser(userId: number): Promise<Order[]>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrderStatus(id: number, status: string): Promise<Order>;
  
  // Order Item operations
  getOrderItem(id: number): Promise<OrderItem | undefined>;
  getOrderItemsByOrder(orderId: number): Promise<OrderItem[]>;
  createOrderItem(orderItem: InsertOrderItem): Promise<OrderItem>;
  updateOrderItemStatus(id: number, status: string): Promise<OrderItem>;
  
  // Vendor Analytics operations
  getVendorTotalSales(vendorId: number): Promise<number>;
  getVendorOrderStats(vendorId: number): Promise<{
    totalOrders: number;
    pendingOrders: number;
    shippedOrders: number;
    deliveredOrders: number;
    canceledOrders: number;
  }>;
  getVendorRevenueByPeriod(vendorId: number, period: "daily" | "weekly" | "monthly" | "yearly"): Promise<Record<string, number>>;
  getVendorTopProducts(vendorId: number, limit?: number): Promise<{ product: Product; totalSold: number; revenue: number }[]>;
  getVendorProfitLoss(vendorId: number): Promise<{
    totalRevenue: number;
    totalCost: number;
    netProfit: number;
    profitMargin: number;
  }>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private vendors: Map<number, Vendor>;
  private products: Map<number, Product>;
  private categories: Map<number, Category>;
  private posts: Map<number, Post>;
  private comments: Map<number, Comment>;
  private likes: Map<number, { postId: number; userId: number }>;
  private messages: Map<number, Message>;
  private notifications: Map<number, { userId: number; message: string; isRead: boolean }>;
  private reviews: Map<number, Review>;
  private follows: Map<number, { followerId: number; followingId: number }>;
  private carts: Map<number, Cart>;
  private wallets: Map<number, Wallet>;
  private transactions: Map<number, Transaction>;
  private orders: Map<number, Order>;
  private orderItems: Map<number, OrderItem>;

  private userIdCounter: number;
  private vendorIdCounter: number;
  private productIdCounter: number;
  private categoryIdCounter: number;
  private postIdCounter: number;
  private commentIdCounter: number;
  private likeIdCounter: number;
  private messageIdCounter: number;
  private notificationIdCounter: number;
  private reviewIdCounter: number;
  private followIdCounter: number;
  private cartIdCounter: number;
  private walletIdCounter: number;
  private transactionIdCounter: number;

  constructor() {
    this.users = new Map();
    this.vendors = new Map();
    this.products = new Map();
    this.categories = new Map();
    this.posts = new Map();
    this.comments = new Map();
    this.likes = new Map();
    this.messages = new Map();
    this.notifications = new Map();
    this.reviews = new Map();
    this.follows = new Map();
    this.carts = new Map();
    this.wallets = new Map();
    this.transactions = new Map();
    this.orders = new Map();
    this.orderItems = new Map();

    this.userIdCounter = 1;
    this.vendorIdCounter = 1;
    this.productIdCounter = 1;
    this.categoryIdCounter = 1;
    this.postIdCounter = 1;
    this.commentIdCounter = 1;
    this.likeIdCounter = 1;
    this.messageIdCounter = 1;
    this.notificationIdCounter = 1;
    this.reviewIdCounter = 1;
    this.followIdCounter = 1;
    this.cartIdCounter = 1;
    this.walletIdCounter = 1;
    this.transactionIdCounter = 1;

    this.initDefaultData();
  }

  private initDefaultData() {
    // Add default categories
    const categories = [
      "Fashion & Apparel",
      "Electronics",
      "Home & Garden",
      "Beauty & Personal Care",
      "Hand Crafted"
    ];

    categories.forEach(category => {
      this.createCategory({ name: category });
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(user: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const newUser: User = {
      id,
      ...user,
      createdAt: new Date(),
    };
    this.users.set(id, newUser);
    return newUser;
  }

  async listUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  // Vendor operations
  async getVendor(id: number): Promise<Vendor | undefined> {
    return this.vendors.get(id);
  }

  async getVendorByUserId(userId: number): Promise<Vendor | undefined> {
    return Array.from(this.vendors.values()).find(vendor => vendor.userId === userId);
  }

  async createVendor(vendor: InsertVendor): Promise<Vendor> {
    const id = this.vendorIdCounter++;
    const newVendor: Vendor = {
      id,
      ...vendor,
      rating: 0,
      ratingCount: 0,
    };
    this.vendors.set(id, newVendor);
    return newVendor;
  }

  async updateVendorRating(id: number, rating: number): Promise<Vendor> {
    const vendor = this.vendors.get(id);
    if (!vendor) throw new Error(`Vendor with id ${id} not found`);

    vendor.ratingCount++;
    vendor.rating = ((vendor.rating * (vendor.ratingCount - 1)) + rating) / vendor.ratingCount;
    this.vendors.set(id, vendor);
    return vendor;
  }

  async listVendors(): Promise<Vendor[]> {
    return Array.from(this.vendors.values());
  }

  // Product operations
  async getProduct(id: number): Promise<Product | undefined> {
    return this.products.get(id);
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const id = this.productIdCounter++;
    const newProduct: Product = {
      id,
      ...product,
      createdAt: new Date(),
    };
    this.products.set(id, newProduct);
    return newProduct;
  }

  async updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product> {
    const existingProduct = this.products.get(id);
    if (!existingProduct) throw new Error(`Product with id ${id} not found`);

    const updatedProduct = {
      ...existingProduct,
      ...product,
    };
    this.products.set(id, updatedProduct);
    return updatedProduct;
  }

  async deleteProduct(id: number): Promise<boolean> {
    return this.products.delete(id);
  }

  async listProducts(filters?: {
    category?: string;
    vendorId?: number;
    minPrice?: number;
    maxPrice?: number;
    isOnSale?: boolean;
    isNew?: boolean;
  }): Promise<Product[]> {
    let products = Array.from(this.products.values());

    if (filters) {
      if (filters.category) {
        products = products.filter(product => product.category === filters.category);
      }
      if (filters.vendorId) {
        products = products.filter(product => product.vendorId === filters.vendorId);
      }
      if (filters.minPrice !== undefined) {
        products = products.filter(product => product.price >= filters.minPrice!);
      }
      if (filters.maxPrice !== undefined) {
        products = products.filter(product => product.price <= filters.maxPrice!);
      }
      if (filters.isOnSale !== undefined) {
        products = products.filter(product => product.isOnSale === filters.isOnSale);
      }
      if (filters.isNew !== undefined) {
        products = products.filter(product => product.isNew === filters.isNew);
      }
    }

    return products;
  }

  // Category operations
  async getCategory(id: number): Promise<Category | undefined> {
    return this.categories.get(id);
  }

  async getCategoryByName(name: string): Promise<Category | undefined> {
    return Array.from(this.categories.values()).find(category => category.name === name);
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const id = this.categoryIdCounter++;
    const newCategory: Category = {
      id,
      ...category,
    };
    this.categories.set(id, newCategory);
    return newCategory;
  }

  async listCategories(): Promise<Category[]> {
    return Array.from(this.categories.values());
  }

  // Post operations
  async getPost(id: number): Promise<Post | undefined> {
    return this.posts.get(id);
  }

  async createPost(post: InsertPost): Promise<Post> {
    const id = this.postIdCounter++;
    const newPost: Post = {
      id,
      ...post,
      likes: 0,
      comments: 0,
      shares: 0,
      createdAt: new Date(),
    };
    this.posts.set(id, newPost);
    return newPost;
  }

  async updatePostStats(id: number, stats: { likes?: number; comments?: number; shares?: number }): Promise<Post> {
    const post = this.posts.get(id);
    if (!post) throw new Error(`Post with id ${id} not found`);

    if (stats.likes !== undefined) post.likes = stats.likes;
    if (stats.comments !== undefined) post.comments = stats.comments;
    if (stats.shares !== undefined) post.shares = stats.shares;

    this.posts.set(id, post);
    return post;
  }

  async deletePost(id: number): Promise<boolean> {
    return this.posts.delete(id);
  }

  async listPosts(userId?: number): Promise<Post[]> {
    let posts = Array.from(this.posts.values());
    
    if (userId) {
      posts = posts.filter(post => post.userId === userId);
    }
    
    // Sort by most recent first
    posts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    return posts;
  }

  // Comment operations
  async getComment(id: number): Promise<Comment | undefined> {
    return this.comments.get(id);
  }

  async createComment(comment: InsertComment): Promise<Comment> {
    const id = this.commentIdCounter++;
    const newComment: Comment = {
      id,
      ...comment,
      createdAt: new Date(),
    };
    this.comments.set(id, newComment);
    
    // Update post comment count
    const post = await this.getPost(comment.postId);
    if (post) {
      await this.updatePostStats(post.id, { comments: post.comments + 1 });
    }
    
    return newComment;
  }

  async listCommentsByPost(postId: number): Promise<Comment[]> {
    return Array.from(this.comments.values())
      .filter(comment => comment.postId === postId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  // Message operations
  async getMessage(id: number): Promise<Message | undefined> {
    return this.messages.get(id);
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const id = this.messageIdCounter++;
    const newMessage: Message = {
      id,
      ...message,
      isRead: false,
      createdAt: new Date(),
    };
    this.messages.set(id, newMessage);
    return newMessage;
  }

  async listMessagesByUser(userId: number): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter(message => message.senderId === userId || message.receiverId === userId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  async countUnreadMessages(userId: number): Promise<number> {
    return Array.from(this.messages.values())
      .filter(message => message.receiverId === userId && !message.isRead)
      .length;
  }

  // Review operations
  async getReview(id: number): Promise<Review | undefined> {
    return this.reviews.get(id);
  }

  async createReview(review: InsertReview): Promise<Review> {
    const id = this.reviewIdCounter++;
    const newReview: Review = {
      id,
      ...review,
      createdAt: new Date(),
    };
    this.reviews.set(id, newReview);
    
    // Update vendor rating
    await this.updateVendorRating(review.vendorId, review.rating);
    
    return newReview;
  }

  async listReviewsByProduct(productId: number): Promise<Review[]> {
    return Array.from(this.reviews.values())
      .filter(review => review.productId === productId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async listReviewsByVendor(vendorId: number): Promise<Review[]> {
    return Array.from(this.reviews.values())
      .filter(review => review.vendorId === vendorId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  // Cart operations
  async getCartItem(id: number): Promise<Cart | undefined> {
    return this.carts.get(id);
  }

  async addToCart(cart: InsertCart): Promise<Cart> {
    // Check if product already in cart
    const existingItem = Array.from(this.carts.values()).find(
      item => item.userId === cart.userId && item.productId === cart.productId
    );

    if (existingItem) {
      // Update quantity instead of adding new item
      return this.updateCartQuantity(existingItem.id, existingItem.quantity + cart.quantity);
    }

    const id = this.cartIdCounter++;
    const newCartItem: Cart = {
      id,
      ...cart,
      createdAt: new Date(),
    };
    this.carts.set(id, newCartItem);
    return newCartItem;
  }

  async updateCartQuantity(id: number, quantity: number): Promise<Cart> {
    const cartItem = this.carts.get(id);
    if (!cartItem) throw new Error(`Cart item with id ${id} not found`);

    cartItem.quantity = quantity;
    this.carts.set(id, cartItem);
    return cartItem;
  }

  async removeFromCart(id: number): Promise<boolean> {
    return this.carts.delete(id);
  }

  async listCartItems(userId: number): Promise<Cart[]> {
    const cartItems = Array.from(this.carts.values())
      .filter(item => item.userId === userId);
    
    // Add product details to each cart item
    for (const item of cartItems) {
      const product = await this.getProduct(item.productId);
      (item as any).product = product;
    }
    
    return cartItems;
  }

  async countCartItems(userId: number): Promise<number> {
    const cartItems = Array.from(this.carts.values())
      .filter(item => item.userId === userId);
    
    // Count total quantity
    let totalCount = 0;
    for (const item of cartItems) {
      if (item.quantity) {
        totalCount += item.quantity;
      } else {
        totalCount += 1; // Default to 1 if quantity is not defined
      }
    }
    
    return totalCount;
  }
  
  // Wallet operations
  async getWallet(id: number): Promise<Wallet | undefined> {
    return this.wallets.get(id);
  }
  
  async getWalletByUserId(userId: number): Promise<Wallet | undefined> {
    return Array.from(this.wallets.values()).find(wallet => wallet.userId === userId);
  }
  
  async createWallet(wallet: InsertWallet): Promise<Wallet> {
    const id = this.walletIdCounter++;
    const newWallet: Wallet = {
      id,
      ...wallet,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.wallets.set(id, newWallet);
    return newWallet;
  }
  
  async updateWalletBalance(id: number, amount: number): Promise<Wallet> {
    const wallet = this.wallets.get(id);
    if (!wallet) throw new Error(`Wallet with id ${id} not found`);
    
    wallet.balance += amount;
    wallet.updatedAt = new Date();
    this.wallets.set(id, wallet);
    return wallet;
  }
  
  // Transaction operations
  async getTransaction(id: number): Promise<Transaction | undefined> {
    return this.transactions.get(id);
  }
  
  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    const id = this.transactionIdCounter++;
    
    // Set default category if not provided based on transaction type
    let category = transaction.category;
    
    if (!category) {
      // Default categorization based on transaction type
      switch (transaction.type) {
        case 'deposit':
          category = 'income';
          break;
        case 'withdrawal':
          category = 'general';
          break;
        case 'payment':
          if (transaction.metadata) {
            try {
              const metadata = JSON.parse(transaction.metadata);
              if (metadata.productCategory) {
                category = metadata.productCategory;
              } else {
                category = 'shopping';
              }
            } catch {
              category = 'shopping';
            }
          } else {
            category = 'shopping';
          }
          break;
        case 'refund':
          category = 'refund';
          break;
        case 'transfer':
          category = 'transfer';
          break;
        default:
          category = 'other';
      }
    }
    
    // Set default payment method if not provided
    const paymentMethod = transaction.paymentMethod || 'wallet';
    
    const newTransaction: Transaction = {
      id,
      ...transaction,
      category,
      paymentMethod,
      createdAt: new Date(),
    };
    
    this.transactions.set(id, newTransaction);
    
    // If this is a deposit or a refund, add money to the wallet
    // If this is a withdrawal or a payment, subtract money from the wallet
    const wallet = await this.getWallet(transaction.walletId);
    if (wallet) {
      let adjustmentAmount = 0;
      
      if (transaction.type === 'deposit' || transaction.type === 'refund') {
        adjustmentAmount = transaction.amount;
      } else if (transaction.type === 'withdrawal' || transaction.type === 'payment') {
        adjustmentAmount = -transaction.amount; // Negative for withdrawals/payments
      }
      
      if (adjustmentAmount !== 0) {
        await this.updateWalletBalance(wallet.id, adjustmentAmount);
      }
    }
    
    return newTransaction;
  }
  
  async getTransactionsByCategory(walletId: number): Promise<Record<string, Transaction[]>> {
    const transactions = await this.listTransactionsByWallet(walletId);
    const categorized: Record<string, Transaction[]> = {};
    
    transactions.forEach(transaction => {
      if (!categorized[transaction.category]) {
        categorized[transaction.category] = [];
      }
      categorized[transaction.category].push(transaction);
    });
    
    return categorized;
  }
  
  async getTransactionStats(walletId: number): Promise<{
    totalIncome: number;
    totalExpense: number;
    byCategoryExpense: Record<string, number>;
    byCategoryIncome: Record<string, number>;
  }> {
    const transactions = await this.listTransactionsByWallet(walletId);
    
    let totalIncome = 0;
    let totalExpense = 0;
    const byCategoryExpense: Record<string, number> = {};
    const byCategoryIncome: Record<string, number> = {};
    
    transactions.forEach(transaction => {
      // Only process transactions that have a status and it's completed
      // If status is undefined (for backward compatibility), still process it
      if (transaction.status && transaction.status !== 'completed') return;
      
      if (transaction.type === 'deposit' || transaction.type === 'refund' || transaction.type === 'transfer_in') {
        totalIncome += transaction.amount;
        
        if (!byCategoryIncome[transaction.category]) {
          byCategoryIncome[transaction.category] = 0;
        }
        byCategoryIncome[transaction.category] += transaction.amount;
      } else if (transaction.type === 'withdrawal' || transaction.type === 'payment' || transaction.type === 'transfer_out') {
        totalExpense += transaction.amount;
        
        if (!byCategoryExpense[transaction.category]) {
          byCategoryExpense[transaction.category] = 0;
        }
        byCategoryExpense[transaction.category] += transaction.amount;
      }
    });
    
    return {
      totalIncome,
      totalExpense,
      byCategoryExpense,
      byCategoryIncome
    };
  }
  
  async listTransactionsByWallet(walletId: number): Promise<Transaction[]> {
    return Array.from(this.transactions.values())
      .filter(transaction => transaction.walletId === walletId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()); // Most recent first
  }
  
  async listTransactionsByUser(userId: number): Promise<Transaction[]> {
    const wallet = await this.getWalletByUserId(userId);
    if (!wallet) return [];
    
    return this.listTransactionsByWallet(wallet.id);
  }
}

export const storage = new MemStorage();
