import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { insertVendorSchema, insertProductSchema, insertPostSchema, insertCommentSchema, insertMessageSchema, insertReviewSchema, insertCartSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication with passport
  setupAuth(app);

  // Auth middleware
  const isAuthenticated = (req: Request, res: Response, next: Function) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ message: "Unauthorized" });
  };

  // Register API Routes
  // All routes should be prefixed with /api
  // Authentication routes are handled by auth.ts

  // Vendor routes
  app.post("/api/vendors", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      
      // Check if user is already a vendor
      const existingVendor = await storage.getVendorByUserId(userId);
      if (existingVendor) {
        return res.status(400).json({ message: "User is already a vendor" });
      }
      
      const validatedData = insertVendorSchema.parse({
        ...req.body,
        userId,
      });
      
      const vendor = await storage.createVendor(validatedData);
      
      // Update user to mark as vendor
      const user = await storage.getUser(userId);
      if (user) {
        user.isVendor = true;
      }
      
      res.status(201).json(vendor);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Failed to create vendor" });
    }
  });

  app.get("/api/vendors", async (req, res) => {
    try {
      const vendors = await storage.listVendors();
      res.json(vendors);
    } catch (error) {
      res.status(500).json({ message: "Failed to list vendors" });
    }
  });

  app.get("/api/vendors/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const vendor = await storage.getVendor(id);
      
      if (!vendor) {
        return res.status(404).json({ message: "Vendor not found" });
      }
      
      res.json(vendor);
    } catch (error) {
      res.status(500).json({ message: "Failed to get vendor" });
    }
  });

  // Product routes
  app.post("/api/products", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      
      // Check if user is a vendor
      const vendor = await storage.getVendorByUserId(userId);
      if (!vendor) {
        return res.status(403).json({ message: "Only vendors can create products" });
      }
      
      const validatedData = insertProductSchema.parse({
        ...req.body,
        vendorId: vendor.id,
      });
      
      const product = await storage.createProduct(validatedData);
      res.status(201).json(product);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Failed to create product" });
    }
  });

  app.get("/api/products", async (req, res) => {
    try {
      const { category, vendorId, minPrice, maxPrice, isOnSale, isNew } = req.query;
      
      const filters: any = {};
      if (category) filters.category = category as string;
      if (vendorId) filters.vendorId = parseInt(vendorId as string);
      if (minPrice) filters.minPrice = parseFloat(minPrice as string);
      if (maxPrice) filters.maxPrice = parseFloat(maxPrice as string);
      if (isOnSale) filters.isOnSale = (isOnSale as string) === 'true';
      if (isNew) filters.isNew = (isNew as string) === 'true';
      
      const products = await storage.listProducts(filters);
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "Failed to list products" });
    }
  });

  app.get("/api/products/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const product = await storage.getProduct(id);
      
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      res.json(product);
    } catch (error) {
      res.status(500).json({ message: "Failed to get product" });
    }
  });

  app.put("/api/products/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const productId = parseInt(req.params.id);
      
      // Get the product
      const product = await storage.getProduct(productId);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      // Get the vendor
      const vendor = await storage.getVendor(product.vendorId);
      if (!vendor || vendor.userId !== userId) {
        return res.status(403).json({ message: "You can only update your own products" });
      }
      
      const validatedData = insertProductSchema.partial().parse(req.body);
      const updatedProduct = await storage.updateProduct(productId, validatedData);
      
      res.json(updatedProduct);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Failed to update product" });
    }
  });

  app.delete("/api/products/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const productId = parseInt(req.params.id);
      
      // Get the product
      const product = await storage.getProduct(productId);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      // Get the vendor
      const vendor = await storage.getVendor(product.vendorId);
      if (!vendor || vendor.userId !== userId) {
        return res.status(403).json({ message: "You can only delete your own products" });
      }
      
      await storage.deleteProduct(productId);
      res.json({ message: "Product deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete product" });
    }
  });

  // Category routes
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await storage.listCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Failed to list categories" });
    }
  });

  // Post routes
  app.post("/api/posts", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      
      const validatedData = insertPostSchema.parse({
        ...req.body,
        userId,
      });
      
      const post = await storage.createPost(validatedData);
      res.status(201).json(post);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Failed to create post" });
    }
  });

  app.get("/api/posts", async (req, res) => {
    try {
      const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;
      const posts = await storage.listPosts(userId);
      res.json(posts);
    } catch (error) {
      res.status(500).json({ message: "Failed to list posts" });
    }
  });

  // Comment routes
  app.post("/api/comments", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      
      const validatedData = insertCommentSchema.parse({
        ...req.body,
        userId,
      });
      
      const comment = await storage.createComment(validatedData);
      res.status(201).json(comment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Failed to create comment" });
    }
  });

  app.get("/api/posts/:postId/comments", async (req, res) => {
    try {
      const postId = parseInt(req.params.postId);
      const comments = await storage.listCommentsByPost(postId);
      res.json(comments);
    } catch (error) {
      res.status(500).json({ message: "Failed to list comments" });
    }
  });

  // Message routes
  app.post("/api/messages", isAuthenticated, async (req, res) => {
    try {
      const senderId = (req.user as any).id;
      
      const validatedData = insertMessageSchema.parse({
        ...req.body,
        senderId,
      });
      
      const message = await storage.createMessage(validatedData);
      res.status(201).json(message);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  app.get("/api/messages", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const messages = await storage.listMessagesByUser(userId);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: "Failed to list messages" });
    }
  });

  app.get("/api/messages/unread/count", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const count = await storage.countUnreadMessages(userId);
      res.json({ count });
    } catch (error) {
      res.status(500).json({ message: "Failed to count unread messages" });
    }
  });

  // Review routes
  app.post("/api/reviews", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      
      const validatedData = insertReviewSchema.parse({
        ...req.body,
        userId,
      });
      
      const review = await storage.createReview(validatedData);
      res.status(201).json(review);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Failed to create review" });
    }
  });

  app.get("/api/products/:productId/reviews", async (req, res) => {
    try {
      const productId = parseInt(req.params.productId);
      const reviews = await storage.listReviewsByProduct(productId);
      res.json(reviews);
    } catch (error) {
      res.status(500).json({ message: "Failed to list reviews" });
    }
  });

  app.get("/api/vendors/:vendorId/reviews", async (req, res) => {
    try {
      const vendorId = parseInt(req.params.vendorId);
      const reviews = await storage.listReviewsByVendor(vendorId);
      res.json(reviews);
    } catch (error) {
      res.status(500).json({ message: "Failed to list reviews" });
    }
  });

  // Cart routes
  app.post("/api/cart", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      
      const validatedData = insertCartSchema.parse({
        ...req.body,
        userId,
      });
      
      const cartItem = await storage.addToCart(validatedData);
      res.status(201).json(cartItem);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Failed to add to cart" });
    }
  });

  app.get("/api/cart", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const cartItems = await storage.listCartItems(userId);
      res.json(cartItems);
    } catch (error) {
      res.status(500).json({ message: "Failed to list cart items" });
    }
  });

  app.put("/api/cart/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const itemId = parseInt(req.params.id);
      
      // Get the cart item
      const cartItem = await storage.getCartItem(itemId);
      if (!cartItem) {
        return res.status(404).json({ message: "Cart item not found" });
      }
      
      // Check if the cart item belongs to the user
      if (cartItem.userId !== userId) {
        return res.status(403).json({ message: "You can only update your own cart items" });
      }
      
      const { quantity } = req.body;
      if (typeof quantity !== 'number' || quantity < 1) {
        return res.status(400).json({ message: "Quantity must be a positive number" });
      }
      
      const updatedCartItem = await storage.updateCartQuantity(itemId, quantity);
      res.json(updatedCartItem);
    } catch (error) {
      res.status(500).json({ message: "Failed to update cart item" });
    }
  });

  app.delete("/api/cart/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const itemId = parseInt(req.params.id);
      
      // Get the cart item
      const cartItem = await storage.getCartItem(itemId);
      if (!cartItem) {
        return res.status(404).json({ message: "Cart item not found" });
      }
      
      // Check if the cart item belongs to the user
      if (cartItem.userId !== userId) {
        return res.status(403).json({ message: "You can only remove your own cart items" });
      }
      
      await storage.removeFromCart(itemId);
      res.json({ message: "Cart item removed successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to remove cart item" });
    }
  });

  app.get("/api/cart/count", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const count = await storage.countCartItems(userId);
      res.json({ count });
    } catch (error) {
      res.status(500).json({ message: "Failed to count cart items" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
