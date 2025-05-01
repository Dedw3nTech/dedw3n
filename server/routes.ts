import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
// WebSocket implementation moved to messaging-suite.ts
import { WebSocket } from 'ws';
import * as fs from 'fs';
import * as fsp from 'fs/promises';
import path from 'path';
// Import JWT functions from jwt-auth.ts instead of using jsonwebtoken directly
import { storage } from "./storage";
import { db } from "./db";
import { eq } from "drizzle-orm";
import { posts } from "@shared/schema";
import { setupAuth } from "./auth";
import { setupJwtAuth, verifyToken, revokeToken } from "./jwt-auth";
import { isAuthenticated as unifiedIsAuthenticated, requireRole } from './unified-auth';
import { registerPaymentRoutes } from "./payment";
import { registerPaypalRoutes } from "./paypal";
import { registerShippingRoutes } from "./shipping";
import { registerMobileMoneyRoutes } from "./mobile-money";
import { registerSubscriptionPaymentRoutes } from "./subscription-payment";
import { registerExclusiveContentRoutes } from "./exclusive-content";
import { registerSubscriptionRoutes } from "./subscription";
import { registerAdminRoutes } from "./admin";
import { registerMessagingSuite } from "./messaging-suite";
import { registerAIInsightsRoutes } from "./ai-insights";
import { registerNewsFeedRoutes } from "./news-feed";
import { seedDatabase } from "./seed";
import { socialMediaSuite } from "./social-media-suite";
import { 
  posts, insertVendorSchema, insertProductSchema, insertPostSchema, insertCommentSchema, 
  insertMessageSchema, insertReviewSchema, insertCartSchema, insertWalletSchema, 
  insertTransactionSchema, insertCommunitySchema, insertCommunityMemberSchema,
  insertMembershipTierSchema, insertMembershipSchema, insertEventSchema,
  insertEventRegistrationSchema, insertPollSchema, insertPollVoteSchema,
  insertCreatorEarningSchema, insertSubscriptionSchema, insertVideoSchema,
  insertVideoEngagementSchema, insertVideoPlaylistSchema, insertPlaylistItemSchema,
  insertVideoProductOverlaySchema, insertCommunityContentSchema
} from "@shared/schema";
import { z } from "zod";

// Content management API endpoints
interface PageContent {
  id: string;
  title: string;
  content: string;
  lastUpdated: Date;
}

// Store static page content
const pageContents: Record<string, PageContent> = {
  "faq": {
    id: "faq",
    title: "Frequently Asked Questions",
    content: `
      <h2>General Questions</h2>
      <div class="faq-item">
        <h3>What is Dedw3n?</h3>
        <p>Dedw3n is a comprehensive multi-vendor social marketplace and dating platform that creates meaningful digital connections through intelligent, adaptive social experiences. Our platform provides advanced financial interactions with seamless payment mechanisms, including e-wallet integration, real-time transaction processing, and intuitive user interfaces for managing digital transactions.</p>
      </div>
      
      <div class="faq-item">
        <h3>How do I create an account?</h3>
        <p>You can create an account by clicking on the "Sign Up" button in the top right corner of the page. Follow the instructions to complete your profile.</p>
      </div>
      
      <h2>Marketplace</h2>
      <div class="faq-item">
        <h3>What's the difference between C2C, B2C, and B2B marketplaces?</h3>
        <p>C2C (Consumer-to-Consumer) is for individual users selling to other individuals. B2C (Business-to-Consumer) is for businesses selling to individual customers. B2B (Business-to-Business) is for businesses selling products or services to other businesses.</p>
      </div>
      
      <div class="faq-item">
        <h3>How do I become a vendor?</h3>
        <p>You can become a vendor by navigating to the "Become a Vendor" page and following the application process. Once approved, you'll be able to list products and manage your store.</p>
      </div>
      
      <h2>Payments & Security</h2>
      <div class="faq-item">
        <h3>What payment methods are accepted?</h3>
        <p>We accept various payment methods including credit/debit cards, PayPal, e-wallet, and for African customers, we support mobile money transactions.</p>
      </div>
      
      <div class="faq-item">
        <h3>Is my personal information secure?</h3>
        <p>Yes, we take security seriously. All personal and payment information is encrypted and processed according to industry-standard security protocols.</p>
      </div>
      
      <h2>Social Features</h2>
      <div class="faq-item">
        <h3>How do communities work?</h3>
        <p>Communities are groups of users with shared interests. You can join existing communities or create your own. Some communities may offer tiered memberships with exclusive content and benefits.</p>
      </div>
      
      <div class="faq-item">
        <h3>Can I monetize my content?</h3>
        <p>Yes, creators can monetize content through various methods including premium subscriptions, direct sales, and exclusive community memberships.</p>
      </div>
    `,
    lastUpdated: new Date("2025-04-10")
  },
  "shipping": {
    id: "shipping",
    title: "Shipping & Returns Policy",
    content: `
      <h2>Shipping Policy</h2>
      <p>At Dedw3n, we work with multiple carriers to provide flexible shipping options for all marketplace purchases.</p>
      
      <h3>Shipping Methods</h3>
      <ul>
        <li><strong>Standard Shipping:</strong> 5-7 business days</li>
        <li><strong>Express Shipping:</strong> 2-3 business days</li>
        <li><strong>Next Day Delivery:</strong> Available for selected products and locations</li>
      </ul>
      
      <h3>International Shipping</h3>
      <p>International shipping is available to most countries. Delivery times may vary depending on destination and customs procedures. Additional duties and taxes may apply.</p>
      
      <h3>Shipping Costs</h3>
      <p>Shipping costs are calculated based on the destination, weight, and dimensions of the products. The exact shipping cost will be displayed during checkout.</p>
      
      <h2>Returns Policy</h2>
      <p>We want you to be completely satisfied with your purchase. If you're not completely satisfied, we're here to help.</p>
      
      <h3>Return Eligibility</h3>
      <ul>
        <li>Items can be returned within 30 days of receipt</li>
        <li>Items must be in original condition, unworn, unwashed, and with all tags attached</li>
        <li>Digital products, personalized items, and intimate products are not eligible for return</li>
      </ul>
      
      <h3>Return Process</h3>
      <ol>
        <li>Initiate a return request through your account dashboard</li>
        <li>Follow the instructions to print a return shipping label</li>
        <li>Package the item securely in its original packaging if possible</li>
        <li>Attach the return shipping label and drop off at the specified carrier location</li>
      </ol>
      
      <h3>Refunds</h3>
      <p>Once your return is received and inspected, we will process your refund. The refund will be issued to the original payment method within 5-10 business days, depending on your payment provider.</p>
      
      <h3>Exchanges</h3>
      <p>If you wish to exchange an item for a different size or color, please initiate a return and place a new order for the desired item.</p>
    `,
    lastUpdated: new Date("2025-04-12")
  },
  "privacy": {
    id: "privacy",
    title: "Privacy Policy",
    content: `
      <h2>Privacy Policy</h2>
      <p><strong>Last Updated:</strong> April 10, 2025</p>
      
      <p>This Privacy Policy describes how Dedw3n ("we", "our", or "us") collects, uses, and shares your personal information when you visit or make a purchase from our platform.</p>
      
      <h3>Information We Collect</h3>
      <p>When you visit the site, we automatically collect certain information about your device, including information about your web browser, IP address, time zone, and some of the cookies that are installed on your device.</p>
      
      <p>When you make a purchase or attempt to make a purchase through the site, we collect certain information from you, including your name, billing address, shipping address, payment information, email address, and phone number.</p>
      
      <h3>How We Use Your Information</h3>
      <p>We use the information that we collect to:</p>
      <ul>
        <li>Fulfill orders and process transactions</li>
        <li>Communicate with you about your orders, products, and services</li>
        <li>Screen our orders for potential risk or fraud</li>
        <li>Improve and optimize our site</li>
        <li>Provide personalized experiences and recommendations</li>
      </ul>
      
      <h3>Sharing Your Information</h3>
      <p>We share your personal information with service providers to help us provide our services and fulfill our contracts with you. For example, we use payment processors to securely handle payment information.</p>
      
      <h3>Behavioral Advertising</h3>
      <p>We use your personal information to provide you with targeted advertisements or marketing communications we believe may be of interest to you.</p>
      
      <h3>Data Retention</h3>
      <p>We will maintain your order information for our records unless and until you ask us to delete this information.</p>
      
      <h3>Your Rights</h3>
      <p>If you are a resident of the EU, UK, or California, you have specific rights regarding access to your personal data, correction of your personal data, deletion of your personal data, and objection to processing.</p>
      
      <h3>Changes to This Privacy Policy</h3>
      <p>We may update this privacy policy from time to time in order to reflect changes to our practices or for other operational, legal, or regulatory reasons.</p>
      
      <h3>Contact Us</h3>
      <p>For more information about our privacy practices, if you have questions, or if you would like to make a complaint, please contact us by e-mail at privacy@dedw3n.com.</p>
    `,
    lastUpdated: new Date("2025-04-10")
  },
  "terms": {
    id: "terms",
    title: "Terms of Service",
    content: `
      <h2>Terms of Service</h2>
      <p><strong>Last Updated:</strong> April 10, 2025</p>
      
      <h3>Overview</h3>
      <p>This website is operated by Dedw3n. Throughout the site, the terms "we", "us" and "our" refer to Dedw3n. Dedw3n offers this website, including all information, tools and services available from this site to you, the user, conditioned upon your acceptance of all terms, conditions, policies and notices stated here.</p>
      
      <h3>Online Marketplace Terms</h3>
      <p>By visiting our site and/or purchasing something from us, you engage in our "Service" and agree to be bound by the following terms and conditions ("Terms of Service", "Terms"), including those additional terms and conditions and policies referenced herein and/or available by hyperlink.</p>
      
      <h3>User Account</h3>
      <p>When you create an account with us, you must provide us information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account on our site.</p>
      
      <p>You are responsible for safeguarding the password that you use to access the service and for any activities or actions under your password, whether your password is with our service or a third-party service.</p>
      
      <h3>Products and Services</h3>
      <p>We have made every effort to display as accurately as possible the colors and images of our products. We cannot guarantee that your computer monitor's display of any color will be accurate.</p>
      
      <p>We reserve the right, but are not obligated, to limit the sales of our products or Services to any person, geographic region or jurisdiction.</p>
      
      <h3>Vendor Terms</h3>
      <p>If you register as a vendor on our platform, you agree to provide accurate product information, maintain fair pricing, and fulfill orders promptly. We reserve the right to remove products or suspend vendor accounts that violate our policies.</p>
      
      <h3>Social Features and User Content</h3>
      <p>When you create or make available any content on our platform, you represent and warrant that you own or have the necessary licenses, rights, consents, and permissions to use such content.</p>
      
      <h3>Termination</h3>
      <p>We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.</p>
      
      <h3>Limitation of Liability</h3>
      <p>In no case shall Dedw3n, our directors, officers, employees, affiliates, agents, contractors, interns, suppliers, service providers or licensors be liable for any injury, loss, claim, or any direct, indirect, incidental, punitive, special, or consequential damages of any kind.</p>
      
      <h3>Governing Law</h3>
      <p>These Terms shall be governed and construed in accordance with the laws of England and Wales, without regard to its conflict of law provisions.</p>
    `,
    lastUpdated: new Date("2025-04-10")
  },
  "cookies": {
    id: "cookies",
    title: "Cookie Policy",
    content: `
      <h2>Cookie Policy</h2>
      <p><strong>Last Updated:</strong> April 10, 2025</p>
      
      <h3>What Are Cookies</h3>
      <p>Cookies are small pieces of text sent to your web browser by a website you visit. A cookie file is stored in your web browser and allows the service or a third-party to recognize you and make your next visit easier and the service more useful to you.</p>
      
      <h3>How We Use Cookies</h3>
      <p>We use cookies for the following purposes:</p>
      <ul>
        <li><strong>Essential cookies:</strong> These cookies are required for the operation of our website. They include, for example, cookies that enable you to log into secure areas of our website, use a shopping cart, or make use of e-billing services.</li>
        <li><strong>Analytical/performance cookies:</strong> These allow us to recognize and count the number of visitors and to see how visitors move around our website when they are using it. This helps us to improve the way our website works, for example, by ensuring that users are finding what they are looking for easily.</li>
        <li><strong>Functionality cookies:</strong> These are used to recognize you when you return to our website. This enables us to personalize our content for you, greet you by name and remember your preferences.</li>
        <li><strong>Targeting cookies:</strong> These cookies record your visit to our website, the pages you have visited and the links you have followed. We will use this information to make our website and the advertising displayed on it more relevant to your interests.</li>
      </ul>
      
      <h3>Third-Party Cookies</h3>
      <p>In addition to our own cookies, we may also use various third-party cookies to report usage statistics of the service, deliver advertisements on and through the service, and so on.</p>
      
      <h3>Managing Cookies</h3>
      <p>Most web browsers allow some control of most cookies through the browser settings. Please be aware that if you disable or reject cookies, some features and services on our website may not work properly.</p>
      
      <h3>Contact Us</h3>
      <p>If you have any questions about our Cookie Policy, please contact us at privacy@dedw3n.com.</p>
    `,
    lastUpdated: new Date("2025-04-10")
  },
};

// FAQ, contact form submissions, etc.
interface ContactFormSubmission {
  id: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  submittedAt: Date;
  status: 'new' | 'reviewed' | 'responded';
}

const contactSubmissions: ContactFormSubmission[] = [];
let submissionId = 1;

export async function registerRoutes(app: Express): Promise<Server> {
  // Page content API endpoints
  app.get('/api/page/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const pageContent = pageContents[id];
    
    if (!pageContent) {
      return res.status(404).json({ message: `Page content for '${id}' not found` });
    }
    
    res.json(pageContent);
  });
  
  // Contact form API endpoint
  app.post('/api/contact', (req: Request, res: Response) => {
    try {
      const { name, email, subject, message } = req.body;
      
      // Basic validation
      if (!name || !email || !subject || !message) {
        return res.status(400).json({ message: "All fields are required" });
      }
      
      // Store the submission
      const submission: ContactFormSubmission = {
        id: submissionId++,
        name,
        email,
        subject,
        message,
        submittedAt: new Date(),
        status: 'new'
      };
      
      contactSubmissions.push(submission);
      
      // In a real application, we would also send an email notification here
      
      return res.status(201).json({ 
        message: "Your message has been received. We'll get back to you soon.",
        submissionId: submission.id
      });
    } catch (error) {
      console.error("Error submitting contact form:", error);
      return res.status(500).json({ message: "An error occurred while submitting your message" });
    }
  });
  
  // Admin-only endpoint to view contact submissions (would add proper authentication in production)
  app.get('/api/admin/contact-submissions', (req: Request, res: Response) => {
    // In production, this would be protected by authentication and authorization
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ message: "Unauthorized" });
    }
    
    res.json(contactSubmissions);
  });
  // Setup authentication with passport
  setupAuth(app);
  
  // Setup JWT authentication routes
  setupJwtAuth(app);
  
  // Unified auth endpoint for getting current user
  app.get('/api/auth/me', unifiedIsAuthenticated, (req: Request, res: Response) => {
    console.log('[DEBUG] /api/auth/me - Authenticated with unified auth');
    res.json(req.user);
  });
  
  // Development endpoint to get a token for testing
  if (process.env.NODE_ENV === 'development') {
    app.get('/api/auth/get-test-token/:userId', async (req: Request, res: Response) => {
      try {
        const userId = parseInt(req.params.userId);
        if (isNaN(userId)) {
          return res.status(400).json({ message: 'Invalid user ID' });
        }
        
        const user = await storage.getUser(userId);
        if (!user) {
          return res.status(404).json({ message: 'User not found' });
        }
        
        // Import directly to avoid circular dependencies
        const { generateToken } = require('./jwt-auth');
        
        const deviceInfo = {
          clientId: 'test-client',
          deviceType: req.headers['user-agent'] || 'unknown',
          ipAddress: req.ip || ''
        };
        
        const { token, expiresAt } = await generateToken(user.id, user.role || 'user', deviceInfo);
        
    // Add test endpoints for debugging
    app.get('/api/auth/test-auth', unifiedIsAuthenticated, (req: Request, res: Response) => {
      console.log('[DEBUG] Authentication successful in test-auth endpoint');
      res.json({
        message: 'Authentication successful',
        user: {
          id: req.user?.id,
          username: req.user?.username,
          role: req.user?.role
        }
      });
    });
    
    // Blob-integrated image upload API for social feed
    app.post('/api/social/upload-image', unifiedIsAuthenticated, async (req: Request, res: Response) => {
      try {
        const userId = req.user?.id;
        
        if (!userId) {
          return res.status(401).json({ message: "Authentication required" });
        }
        
        // Check if there's a blob image data
        if (!req.body.blob) {
          return res.status(400).json({ message: "No image data provided" });
        }
        
        let imageUrl = '';
        const description = req.body.description || '';
        const tags = req.body.tags || [];
        
        try {
          // Process the blob data
          const blobData = req.body.blob;
          
          // Validate that it's an image blob
          if (!blobData.startsWith('data:image/')) {
            return res.status(400).json({ message: "Invalid image format" });
          }
          
          // Extract the base64 data and file type
          const base64Data = blobData.split(',')[1];
          const mimeType = blobData.split(';')[0].split(':')[1];
          let fileExtension = 'png'; // Default
          
          // Try to get file extension from mime type
          if (mimeType) {
            const parts = mimeType.split('/');
            if (parts.length > 1) {
              fileExtension = parts[1] === 'jpeg' ? 'jpg' : parts[1];
            }
          }
          
          const filename = `image_${Date.now()}.${fileExtension}`;
          
          // Create uploads directory if it doesn't exist
          if (!fs.existsSync('./public/uploads')) {
            fs.mkdirSync('./public/uploads', { recursive: true });
          }
          if (!fs.existsSync('./public/uploads/images')) {
            fs.mkdirSync('./public/uploads/images', { recursive: true });
          }
          
          // Save the file
          fs.writeFileSync(`./public/uploads/images/${filename}`, base64Data, 'base64');
          imageUrl = `/uploads/images/${filename}`;
          
          console.log(`[DEBUG] Image successfully uploaded: ${imageUrl}`);
          
          // Create post with the uploaded image
          const postData = {
            userId,
            content: description,
            contentType: 'image' as const,
            imageUrl,
            isPublished: true,
            isPromoted: false,
          };
          
          // Add tags if provided
          if (tags && Array.isArray(tags) && tags.length > 0) {
            postData.tags = tags;
          }
          
          // Create the post in the database
          const newPost = await storage.createPost(postData);
          
          // Return the newly created post
          return res.status(201).json({
            success: true,
            imageUrl,
            post: newPost
          });
          
        } catch (error) {
          console.error('[ERROR] Failed to save image or create post:', error);
          return res.status(500).json({ message: 'Failed to save image' });
        }
      } catch (error) {
        console.error('[ERROR] Image upload failed:', error);
        res.status(500).json({ message: 'Image upload failed' });
      }
    });
    
    // Legacy test endpoint kept for backward compatibility
    app.post('/api/upload-test', unifiedIsAuthenticated, (req: Request, res: Response) => {
      console.log('[DEBUG] Upload test endpoint called with user:', req.user?.id);
      
      let filename = null;
      
      // Check if there's a base64 image
      if (req.body.image && req.body.image.startsWith('data:image')) {
        try {
          // Extract the base64 data
          const base64Data = req.body.image.split(',')[1];
          filename = `test_${Date.now()}.png`;
          
          // Create uploads directory if it doesn't exist
          if (!fs.existsSync('./public/uploads')) {
            fs.mkdirSync('./public/uploads', { recursive: true });
          }
          if (!fs.existsSync('./public/uploads/test')) {
            fs.mkdirSync('./public/uploads/test', { recursive: true });
          }
          
          // Save the file
          fs.writeFileSync(`./public/uploads/test/${filename}`, base64Data, 'base64');
          
          console.log(`[DEBUG] Test image saved as: /uploads/test/${filename}`);
        } catch (error) {
          console.error('[ERROR] Failed to save test image:', error);
          return res.status(500).json({ message: 'Failed to save test image' });
        }
      }
      
      res.json({
        message: 'Upload test successful',
        user: {
          id: req.user?.id,
          username: req.user?.username
        },
        imageSaved: filename !== null,
        imagePath: filename ? `/uploads/test/${filename}` : null
      });
    });
        
        res.json({ token, expiresAt, userId: user.id, username: user.username });
      } catch (error) {
        console.error('[ERROR] Error generating test token:', error);
        res.status(500).json({ message: 'Error generating test token' });
      }
    });
  }
  
  // Authentication validation endpoints
  app.get('/api/auth/validate', (req, res) => {
    console.log('[DEBUG] /api/auth/validate - Session validation attempt');
    if (req.isAuthenticated()) {
      console.log('[DEBUG] /api/auth/validate - User authenticated via session');
      return res.status(200).json({ message: 'Session authentication validated' });
    }
    console.log('[DEBUG] /api/auth/validate - Session validation failed');
    return res.status(401).json({ message: 'Not authenticated' });
  });
  
  // JWT validation - implemented in jwt-auth.ts but added here for consistency
  app.get('/api/auth/jwt/validate', (req, res) => {
    // This will be intercepted by the JWT middleware and only succeed if the JWT is valid
    console.log('[DEBUG] /api/auth/jwt/validate - JWT validation successful');
    return res.status(200).json({ message: 'JWT authentication validated' });
  });
  
  // Register admin routes
  registerAdminRoutes(app);
  
  // Register AI insights routes
  registerAIInsightsRoutes(app);

  // Create HTTP server from Express
  // Register news feed routes
  registerNewsFeedRoutes(app);
  
  const httpServer = createServer(app);
  
  // Seed the database with initial data
  await seedDatabase();

  // Backward compatibility for client-side code
  app.post("/api/register", (req, res) => res.redirect(307, "/api/auth/register"));
  app.post("/api/login", (req, res) => res.redirect(307, "/api/auth/login"));
  // Updated logout endpoint that handles both authentication methods
  app.post("/api/logout", async (req, res) => {
    try {
      console.log('[DEBUG] Processing logout request');
      
      // Explicitly set auth related headers to prevent caching
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.setHeader('Surrogate-Control', 'no-store');
      
      // Clear test user from debug mode
      if (req.user && !req.isAuthenticated()) {
        console.log('[DEBUG] Clearing debug-mode test user');
        req.user = undefined;
      }
      
      // 1. Handle Passport.js session-based logout first
      if (req.isAuthenticated()) {
        console.log('[DEBUG] Logging out authenticated session user');
        // Convert req.logout with callback to Promise
        await new Promise<void>((resolve) => {
          req.logout((err) => {
            if (err) {
              console.error('[ERROR] Session logout failed:', err);
            } else {
              console.log('[DEBUG] Session logout successful');
            }
            resolve(); // Always resolve to continue
          });
        });
      }
      
      // 2. Handle JWT token-based logout
      const authHeader = req.headers.authorization;
      let token: string | undefined;
      
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
        console.log('[DEBUG] Found token in Authorization header');
      } else if (req.query.token) {
        token = req.query.token as string;
        console.log('[DEBUG] Found token in query parameters');
      } else if (req.cookies && req.cookies.token) {
        token = req.cookies.token;
        console.log('[DEBUG] Found token in cookies');
      }
      
      if (token) {
        try {
          console.log('[DEBUG] Processing token revocation');
          
          // Call revoke token function if it exists in storage
          if (storage.revokeAuthToken) {
            const authToken = await storage.getAuthToken(token);
            if (authToken) {
              await storage.revokeAuthToken(authToken.id, 'User logout');
              console.log('[DEBUG] JWT token revoked successfully');
            } else {
              console.log('[DEBUG] Auth token not found in database');
            }
          } else if (typeof revokeToken === 'function') {
            // Use imported function if available
            await revokeToken(token, 'User logout');
            console.log('[DEBUG] JWT token revoked via revokeToken function');
          } else {
            console.log('[WARNING] No token revocation mechanism available');
          }
          
          // Clear all possible auth cookies
          if (req.cookies) {
            // Clear token cookie with all possible options
            res.clearCookie('token', { 
              path: '/', 
              httpOnly: true,
              secure: true,
              sameSite: 'strict'
            });
            res.clearCookie('token');
            
            // Also clear any other auth-related cookies
            res.clearCookie('connect.sid', { path: '/' });
            res.clearCookie('auth', { path: '/' });
            
            console.log('[DEBUG] All auth cookies cleared');
          }
        } catch (error) {
          console.error('[ERROR] JWT logout error:', error);
        }
      } else {
        console.log('[DEBUG] No auth token found during logout');
      }
      
      // Handle session cleanup more gracefully
      if (req.session) {
        try {
          console.log('[DEBUG] Attempting to destroy session');
          // Use Promise to handle session destroy
          await new Promise<void>((resolve) => {
            req.session.destroy((err) => {
              if (err) {
                console.error('[ERROR] Session destroy failed:', err);
              } else {
                console.log('[DEBUG] Session destroyed successfully');
              }
              resolve(); // Always resolve to continue
            });
          });
        } catch (sessionError) {
          console.error('[ERROR] Error during session destroy:', sessionError);
        }
      } else {
        console.log('[DEBUG] No session to destroy');
      }
      
      // Force session regeneration for extra security
      if (req.session) {
        try {
          // Set a flag in the session indicating explicit logout
          // This will be checked in unified-auth.ts to prevent auto-login
          req.session.userLoggedOut = true;
          req.session.save(() => {
            console.log('[DEBUG] Set userLoggedOut flag in session');
          });
          
          // @ts-ignore - Some types may be missing
          req.session.regenerate((err: Error) => {
            if (err) {
              console.error('[ERROR] Session regeneration failed:', err);
            } else {
              console.log('[DEBUG] Session regenerated successfully');
              
              // Set the flag again after regeneration for certainty
              if (req.session) {
                req.session.userLoggedOut = true;
                req.session.save();
              }
            }
          });
        } catch (regError) {
          console.error('[ERROR] Error during session regeneration:', regError);
        }
      }
      
      // Set header to signal client to prevent auto-login
      res.setHeader('X-Auth-Logged-Out', 'true');
      
      // Clear req.user - sometimes Passport.js can leave this
      req.user = undefined;
      
      // Return 204 status (No Content) as recommended for logout operations
      return res.status(204).end();
    } catch (error) {
      console.error('[ERROR] Logout error:', error);
      // Even on error, return success to prevent UI getting stuck
      return res.status(204).end();
    }
  });
  
  // This is the endpoint called by useAuth() in client code - we need direct implementation, not redirect
  app.get("/api/user", unifiedIsAuthenticated, (req, res) => {
    console.log('[DEBUG] /api/user - Authenticated with unified auth');
    res.json(req.user);
  });
  
  // User profile routes
  app.get("/api/users/id/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      console.log(`[DEBUG] Fetching profile for user ID: ${userId}`);
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const user = await storage.getUser(userId);
      
      console.log(`[DEBUG] User found by ID:`, user ? 'Yes' : 'No');
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Remove password before sending
      const { password, ...userData } = user;
      console.log(`[DEBUG] Returning user data for user ID: ${userId}`);
      res.json(userData);
    } catch (error) {
      console.error(`[ERROR] Failed to get profile for user ID ${req.params.userId}:`, error);
      res.status(500).json({ message: "Failed to fetch user profile" });
    }
  });
  

  
  // Search users API endpoint for autocomplete
  app.get("/api/users/search", async (req, res) => {
    try {
      const query = req.query.q as string;
      const limit = parseInt(req.query.limit as string) || 10;
      
      console.log(`[DEBUG] Searching users with query: ${query}, limit: ${limit}`);
      
      if (!query || query.length < 2) {
        return res.json([]);
      }
      
      const users = await storage.searchUsers(query, limit);
      console.log(`[DEBUG] Found ${users.length} users matching query: ${query}`);
      
      return res.json(users);
    } catch (error) {
      console.error("Error searching users:", error);
      return res.status(500).json({ message: "Failed to search users" });
    }
  });
  
  // Search posts API endpoint
  app.get("/api/posts/search", async (req, res) => {
    try {
      const query = req.query.q as string;
      const limit = parseInt(req.query.limit as string) || 10;
      
      console.log(`[DEBUG] Searching posts with query: ${query}, limit: ${limit}`);
      
      if (!query || query.length < 2) {
        return res.json([]);
      }
      
      // Return empty array for now until full implementation
      const posts = [];
      console.log(`[DEBUG] Returning empty posts array for search query: ${query}`);
      
      return res.json(posts);
    } catch (error) {
      console.error("Error searching posts:", error);
      return res.status(500).json({ message: "Failed to search posts" });
    }
  });
  
  // Search products API endpoint
  app.get("/api/products/search", async (req, res) => {
    try {
      const query = req.query.q as string;
      const limit = parseInt(req.query.limit as string) || 10;
      
      console.log(`[DEBUG] Searching products with query: ${query}, limit: ${limit}`);
      
      if (!query || query.length < 2) {
        return res.json([]);
      }
      
      // Return empty array for now until full implementation
      const products = [];
      console.log(`[DEBUG] Returning empty products array for search query: ${query}`);
      
      return res.json(products);
    } catch (error) {
      console.error("Error searching products:", error);
      return res.status(500).json({ message: "Failed to search products" });
    }
  });
  
  // Search communities API endpoint
  app.get("/api/communities/search", async (req, res) => {
    try {
      const query = req.query.q as string;
      const limit = parseInt(req.query.limit as string) || 10;
      
      console.log(`[DEBUG] Searching communities with query: ${query}, limit: ${limit}`);
      
      if (!query || query.length < 2) {
        return res.json([]);
      }
      
      // Return empty array for now until full implementation
      const communities = [];
      console.log(`[DEBUG] Returning empty communities array for search query: ${query}`);
      
      return res.json(communities);
    } catch (error) {
      console.error("Error searching communities:", error);
      return res.status(500).json({ message: "Failed to search communities" });
    }
  });

  app.get("/api/users/:username", async (req, res) => {
    try {
      const username = req.params.username;
      console.log(`[DEBUG] Fetching profile for username: ${username}`);
      const user = await storage.getUserByUsername(username);
      
      console.log(`[DEBUG] User found:`, user ? 'Yes' : 'No');
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Remove password before sending
      const { password, ...userData } = user;
      console.log(`[DEBUG] Returning user data for username: ${username}`);
      res.json(userData);
    } catch (error) {
      console.error(`[ERROR] Failed to get profile for ${req.params.username}:`, error);
      res.status(500).json({ message: "Failed to get user profile" });
    }
  });
  
  // Get user's posts by ID
  app.get("/api/users/id/:userId/posts", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const posts = await storage.getUserPosts(user.id);
      res.json(posts);
    } catch (error) {
      console.error(`[ERROR] Failed to get posts for user ID ${req.params.userId}:`, error);
      res.status(500).json({ message: "Failed to get user posts" });
    }
  });
  
  // Get user's posts by username
  app.get("/api/users/:username/posts", async (req, res) => {
    try {
      const username = req.params.username;
      const user = await storage.getUserByUsername(username);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const posts = await storage.getUserPosts(user.id);
      res.json(posts);
    } catch (error) {
      res.status(500).json({ message: "Failed to get user posts" });
    }
  });
  
  // Get user's communities by ID
  app.get("/api/users/id/:userId/communities", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Get communities the user is a member of
      const communities = await storage.getUserCommunities(user.id);
      res.json(communities);
    } catch (error) {
      console.error(`[ERROR] Failed to get communities for user ID ${req.params.userId}:`, error);
      res.status(500).json({ message: "Failed to get user communities" });
    }
  });
  
  // Get user's communities by username
  app.get("/api/users/:username/communities", async (req, res) => {
    try {
      const username = req.params.username;
      const user = await storage.getUserByUsername(username);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Get communities the user is a member of
      const communities = await storage.getUserCommunities(user.id);
      res.json(communities);
    } catch (error) {
      console.error("[ERROR] Failed to get user communities:", error);
      res.status(500).json({ message: "Failed to get user communities" });
    }
  });
  
  // Get user's vendor information by ID
  app.get("/api/users/id/:userId/vendor", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Check if user is a vendor
      if (!user.isVendor) {
        return res.status(404).json({ message: "User is not a vendor" });
      }
      
      // Get vendor info
      const vendorInfo = await storage.getVendorByUserId(user.id);
      
      if (!vendorInfo) {
        return res.status(404).json({ message: "Vendor information not found" });
      }
      
      res.json(vendorInfo);
    } catch (error) {
      console.error(`[ERROR] Failed to get vendor info for user ID ${req.params.userId}:`, error);
      res.status(500).json({ message: "Failed to get vendor information" });
    }
  });
  
  // Get user's vendor information by username
  app.get("/api/users/:username/vendor", async (req, res) => {
    try {
      const username = req.params.username;
      const user = await storage.getUserByUsername(username);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Check if user is a vendor
      if (!user.isVendor) {
        return res.status(404).json({ message: "User is not a vendor" });
      }
      
      // Get vendor info
      const vendorInfo = await storage.getVendorByUserId(user.id);
      
      if (!vendorInfo) {
        return res.status(404).json({ message: "Vendor information not found" });
      }
      
      res.json(vendorInfo);
    } catch (error) {
      console.error("[ERROR] Failed to get vendor info:", error);
      res.status(500).json({ message: "Failed to get vendor information" });
    }
  });

  // Using the unified authentication middleware imported from unified-auth.ts
  const isAuthenticated = unifiedIsAuthenticated;
  
  // User connection API endpoints
  app.post("/api/users/:userId/connect", isAuthenticated, async (req, res) => {
    try {
      const currentUserId = req.user?.id;
      const targetUserId = parseInt(req.params.userId);
      
      if (!currentUserId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      if (isNaN(targetUserId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      if (currentUserId === targetUserId) {
        return res.status(400).json({ message: "Cannot connect to yourself" });
      }
      
      // If storage.connectUsers is not implemented, just return success for now
      if (typeof storage.connectUsers === 'function') {
        await storage.connectUsers(currentUserId, targetUserId);
      }
      
      // Create a notification for the target user
      if (typeof storage.createNotification === 'function') {
        await storage.createNotification({
          userId: targetUserId,
          type: "connection_request",
          content: `User ${req.user?.username} wants to connect with you`,
          relatedUserId: currentUserId,
          read: false,
          createdAt: new Date()
        });
      }
      
      res.status(200).json({ connected: true });
    } catch (error) {
      console.error("Error connecting users:", error);
      res.status(500).json({ message: "Failed to connect users" });
    }
  });
  
  app.post("/api/users/:userId/disconnect", isAuthenticated, async (req, res) => {
    try {
      const currentUserId = req.user?.id;
      const targetUserId = parseInt(req.params.userId);
      
      if (!currentUserId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      if (isNaN(targetUserId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      // If storage.disconnectUsers is not implemented, just return success for now
      if (typeof storage.disconnectUsers === 'function') {
        await storage.disconnectUsers(currentUserId, targetUserId);
      }
      
      res.status(200).json({ connected: false });
    } catch (error) {
      console.error("Error disconnecting users:", error);
      res.status(500).json({ message: "Failed to disconnect users" });
    }
  });
  
  app.get("/api/users/:userId/connection", isAuthenticated, async (req, res) => {
    try {
      const currentUserId = req.user?.id;
      const targetUserId = parseInt(req.params.userId);
      
      if (!currentUserId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      if (isNaN(targetUserId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      let connected = false;
      
      // If storage.checkConnection is implemented, use it
      if (typeof storage.checkConnection === 'function') {
        connected = await storage.checkConnection(currentUserId, targetUserId);
      }
      
      res.status(200).json({ connected });
    } catch (error) {
      console.error("Error checking connection:", error);
      res.status(500).json({ message: "Failed to check connection status" });
    }
  });
  
  // API endpoint to get current user's statistics (posts, followers, following counts)
  // Fix blob URLs in user avatar (emergency cleanup route)
  app.post("/api/users/fix-blob-avatars", isAuthenticated, async (req, res) => {
    try {
      // Check if user is admin
      if (req.user.role !== 'admin') {
        return res.status(403).json({ error: "Only admin can perform this operation" });
      }
      
      // Get all users with blob URLs in avatar
      const users = await storage.listUsers();
      const usersWithBlobAvatars = users.filter(u => u.avatar && u.avatar.startsWith('blob:'));
      
      console.log(`Found ${usersWithBlobAvatars.length} users with blob avatars`);
      
      // Fix each user by setting their avatar to null
      const fixedUsers = [];
      for (const user of usersWithBlobAvatars) {
        console.log(`Fixing user ${user.id} (${user.username}) with avatar ${user.avatar}`);
        const updated = await storage.updateUser(user.id, { avatar: null });
        if (updated) {
          fixedUsers.push({ id: user.id, username: user.username });
        }
      }
      
      return res.status(200).json({
        success: true,
        message: `Fixed ${fixedUsers.length} users with blob avatars`,
        users: fixedUsers
      });
    } catch (error) {
      console.error("Error fixing blob avatars:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/user/stats", isAuthenticated, async (req, res) => {
    try {
      if (!req.user) {
        console.error(`[ERROR] No user found in request`);
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      const userId = (req.user as any).id;
      if (!userId) {
        console.error(`[ERROR] User ID missing in authenticated request`);
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      console.log(`[DEBUG] Fetching stats for current user ID: ${userId}`);
      
      try {
        // Get post count with timeout handling
        const postCountPromise = Promise.race([
          storage.getUserPostCount(userId),
          new Promise<number>((_, reject) => 
            setTimeout(() => reject(new Error('Post count timeout')), 3000)
          )
        ]);
        
        // Get follower count with timeout handling
        const followerCountPromise = Promise.race([
          storage.getFollowersCount(userId),
          new Promise<number>((_, reject) => 
            setTimeout(() => reject(new Error('Follower count timeout')), 3000)
          )
        ]);
        
        // Get following count with timeout handling
        const followingCountPromise = Promise.race([
          storage.getFollowingCount(userId),
          new Promise<number>((_, reject) => 
            setTimeout(() => reject(new Error('Following count timeout')), 3000)
          )
        ]);
        
        // Run all queries in parallel
        const [postCount, followerCount, followingCount] = await Promise.all([
          postCountPromise.catch(e => {
            console.error(`[ERROR] Post count query failed:`, e);
            return 0;
          }),
          followerCountPromise.catch(e => {
            console.error(`[ERROR] Follower count query failed:`, e);
            return 0;
          }),
          followingCountPromise.catch(e => {
            console.error(`[ERROR] Following count query failed:`, e);
            return 0;
          })
        ]);
        
        console.log(`[DEBUG] User stats - Posts: ${postCount}, Followers: ${followerCount}, Following: ${followingCount}`);
        
        return res.json({
          postCount,
          followerCount,
          followingCount
        });
      } catch (queryError) {
        console.error(`[ERROR] Database query error:`, queryError);
        return res.status(500).json({ 
          message: "Database error when fetching user statistics",
          error: queryError instanceof Error ? queryError.message : 'Unknown error'
        });
      }
    } catch (error) {
      console.error(`[ERROR] Failed to get stats for user:`, error);
      return res.status(500).json({ 
        message: "Failed to fetch user statistics",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // API endpoint to get any user's statistics (posts, followers, following counts) by user ID
  app.get("/api/users/:userId/stats", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      console.log(`[DEBUG] Fetching stats for user ID: ${userId}`);
      
      // Check if the user exists
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Get post count
      const postCount = await storage.getUserPostCount(userId);
      
      // Get follower count
      const followerCount = await storage.getFollowersCount(userId);
      
      // Get following count
      const followingCount = await storage.getFollowingCount(userId);
      
      console.log(`[DEBUG] User ${userId} stats - Posts: ${postCount}, Followers: ${followerCount}, Following: ${followingCount}`);
      
      res.json({
        postCount,
        followerCount,
        followingCount
      });
    } catch (error) {
      console.error(`[ERROR] Failed to get stats for user:`, error);
      res.status(500).json({ message: "Failed to fetch user statistics" });
    }
  });
  
  // API endpoint to get user profile information by user ID
  app.get("/api/users/:userId/profile", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      console.log(`[DEBUG] Fetching profile for user ID: ${userId}`);
      
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Extract only the necessary profile information (don't send sensitive data)
      const userProfile = {
        id: user.id,
        username: user.username,
        name: user.name || user.username,
        bio: user.bio,
        avatar: user.avatar,
        isVendor: user.isVendor,
        createdAt: user.createdAt
      };
      
      res.json(userProfile);
    } catch (error) {
      console.error(`[ERROR] Failed to get profile for user ID ${req.params.userId}:`, error);
      res.status(500).json({ message: "Failed to fetch user profile" });
    }
  });

  // Register API Routes
  // All routes should be prefixed with /api
  // Authentication routes are handled by auth.ts
  
  // Register payment routes
  registerPaymentRoutes(app);
  
  // Register PayPal routes
  registerPaypalRoutes(app);
  
  // Register shipping routes
  registerShippingRoutes(app);
  
  // Register mobile money payment routes
  registerMobileMoneyRoutes(app);
  
  // Register subscription payment routes
  registerSubscriptionPaymentRoutes(app);
  
  // Register subscription management routes
  registerSubscriptionRoutes(app);
  
  // Register exclusive content routes
  registerExclusiveContentRoutes(app);
  // Register integrated messaging suite with call and video functionality
  registerMessagingSuite(app, httpServer);
  
  // Notification API Routes
  
  // Get user notifications
  app.get("/api/notifications", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      
      const notifications = await storage.getNotifications(userId, limit);
      res.json(notifications);
    } catch (error) {
      console.error('Error getting notifications:', error);
      res.status(500).json({ message: "Failed to get notifications" });
    }
  });
  
  // Get unread notification count
  app.get("/api/notifications/unread/count", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const count = await storage.getUnreadNotificationCount(userId);
      res.json({ count });
    } catch (error) {
      console.error('Error getting unread notification count:', error);
      res.status(500).json({ message: "Failed to get unread notification count" });
    }
  });
  
  // Mark a notification as read
  app.post("/api/notifications/:id/mark-read", isAuthenticated, async (req, res) => {
    try {
      const notificationId = parseInt(req.params.id);
      
      if (isNaN(notificationId)) {
        return res.status(400).json({ message: "Invalid notification ID" });
      }
      
      await storage.markNotificationAsRead(notificationId);
      res.status(200).json({ message: "Notification marked as read" });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });
  
  // Mark all notifications as read
  app.post("/api/notifications/mark-all-read", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      await storage.markAllNotificationsAsRead(userId);
      res.status(200).json({ message: "All notifications marked as read" });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      res.status(500).json({ message: "Failed to mark all notifications as read" });
    }
  });
  
  // Cart API Routes
  
  // Get cart item count
  app.get("/api/cart/count", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const count = await storage.countCartItems(userId);
      res.json({ count });
    } catch (error) {
      console.error('Error getting cart count:', error);
      res.status(500).json({ message: "Failed to get cart count" });
    }
  });
  
  // Message API Routes
  
  // Message routes are now handled in messaging-suite.ts
  // See registerMessagingSuite(app, httpServer) above
  
  // Social Media API Routes
  
  // Social Tab API Endpoints
  
  // Get wall posts (feed content)
  app.get("/api/social/wall", async (req, res) => {
    try {
      // Get most recent posts - either from user's network or all public posts
      const isAuthenticated = req.isAuthenticated();
      const userId = isAuthenticated ? req.user!.id : undefined;
      
      const posts = await storage.listPosts({
        // If user is authenticated, prioritize posts from users they follow
        limit: 10,
      });
      
      res.json(posts);
    } catch (error) {
      console.error('Error getting wall posts:', error);
      res.status(500).json({ message: "Failed to load wall content" });
    }
  });
  
  // Get explore content (trending, discover)
  app.get("/api/social/explore", async (req, res) => {
    try {
      const trendingVideos = await storage.getTrendingVideos(5);
      
      // Get popular posts
      const popularPosts = await storage.listPosts({
        limit: 5
      });
      
      // Get popular communities
      const communities = await storage.listCommunities(5);
      
      // Get suggested users to follow
      const isAuthenticated = req.isAuthenticated();
      const userId = isAuthenticated ? req.user!.id : undefined;
      const suggestedUsers = userId ? await storage.getSuggestedUsers(userId, 5) : [];
      
      // Only return safe user data (remove passwords)
      const safeSuggestedUsers = suggestedUsers.map(user => {
        const { password, ...safeUserData } = user;
        return safeUserData;
      });
      
      res.json({
        trendingVideos,
        popularPosts,
        communities,
        suggestedUsers: safeSuggestedUsers
      });
    } catch (error) {
      console.error('Error getting explore content:', error);
      res.status(500).json({ message: "Failed to load explore content" });
    }
  });
  
  // Get user's video content
  app.get("/api/social/videos", async (req, res) => {
    try {
      const videos = await storage.listVideos();
      res.json(videos);
    } catch (error) {
      console.error('Error getting videos:', error);
      res.status(500).json({ message: "Failed to load videos" });
    }
  });
  
  // Get user's communities
  app.get("/api/social/communities", async (req, res) => {
    try {
      const isAuthenticated = req.isAuthenticated();
      const userId = isAuthenticated ? req.user!.id : undefined;
      
      // Get communities the user is a member of if authenticated
      let userCommunities = [];
      if (userId) {
        userCommunities = await storage.getUserCommunities(userId);
      }
      
      // Get public/featured communities for everyone
      const publicCommunities = await storage.listCommunities(10);
      
      res.json({
        userCommunities,
        publicCommunities
      });
    } catch (error) {
      console.error('Error getting communities:', error);
      res.status(500).json({ message: "Failed to load communities" });
    }
  });
  
  // Get active tab content based on tab name
  app.get("/api/social/tab/:tabName", async (req, res) => {
    try {
      const { tabName } = req.params;
      const isAuthenticated = req.isAuthenticated();
      const userId = isAuthenticated ? req.user!.id : undefined;
      
      let data = {};
      
      switch(tabName) {
        case 'wall':
          const posts = await storage.listPosts({ limit: 10 });
          data = { posts };
          break;
        case 'explore':
          const trendingVideos = await storage.getTrendingVideos(5);
          const popularPosts = await storage.listPosts({ limit: 5 });
          data = { trendingVideos, popularPosts };
          break;
        case 'messages':
          if (!userId) {
            return res.status(401).json({ message: "Authentication required" });
          }
          const conversations = await storage.getUserConversations(userId);
          data = { conversations };
          break;
        case 'videos':
          const videos = await storage.listVideos();
          data = { videos };
          break;
        case 'communities':
          const communities = await storage.listCommunities(10);
          let userCommunities = [];
          if (userId) {
            userCommunities = await storage.getUserCommunities(userId);
          }
          data = { communities, userCommunities };
          break;
        default:
          return res.status(400).json({ message: "Invalid tab name" });
      }
      
      res.json(data);
    } catch (error) {
      console.error(`Error getting content for tab ${req.params.tabName}:`, error);
      res.status(500).json({ message: `Failed to load ${req.params.tabName} content` });
    }
  });
  
  // Social Media API Routes - Follow System
  
  // Follow a user
  app.post("/api/social/follow/:userId", isAuthenticated, async (req, res) => {
    try {
      const followerId = req.user!.id;
      const followingId = parseInt(req.params.userId);
      
      if (isNaN(followingId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      // Check if the user exists
      const userToFollow = await storage.getUser(followingId);
      if (!userToFollow) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Check if trying to follow themselves
      if (followerId === followingId) {
        return res.status(400).json({ message: "You cannot follow yourself" });
      }
      
      // Create the follow relationship
      const follow = await storage.followUser(followerId, followingId);
      res.status(201).json({ message: "User followed successfully", follow });
    } catch (error) {
      console.error('Error following user:', error);
      res.status(500).json({ message: "Failed to follow user" });
    }
  });
  
  // Unfollow a user
  app.delete("/api/social/follow/:userId", isAuthenticated, async (req, res) => {
    try {
      const followerId = req.user!.id;
      const followingId = parseInt(req.params.userId);
      
      if (isNaN(followingId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      // Check if the user exists
      const userToUnfollow = await storage.getUser(followingId);
      if (!userToUnfollow) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Remove the follow relationship
      const result = await storage.unfollowUser(followerId, followingId);
      res.status(200).json({ message: "User unfollowed successfully" });
    } catch (error) {
      console.error('Error unfollowing user:', error);
      res.status(500).json({ message: "Failed to unfollow user" });
    }
  });
  
  // Check if following a user
  app.get("/api/social/follow/check/:userId", isAuthenticated, async (req, res) => {
    try {
      const followerId = req.user!.id;
      const followingId = parseInt(req.params.userId);
      
      if (isNaN(followingId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const isFollowing = await storage.isFollowing(followerId, followingId);
      res.json({ isFollowing });
    } catch (error) {
      console.error('Error checking follow status:', error);
      res.status(500).json({ message: "Failed to check follow status" });
    }
  });
  
  // Get followers of a user
  app.get("/api/social/followers/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      // Check if the user exists
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Get followers
      const followers = await storage.getFollowers(userId);
      
      // Remove sensitive information
      const sanitizedFollowers = followers.map(follower => {
        const { password, ...userData } = follower;
        return userData;
      });
      
      res.json(sanitizedFollowers);
    } catch (error) {
      console.error('Error getting followers:', error);
      res.status(500).json({ message: "Failed to get followers" });
    }
  });
  
  // Get users followed by a user
  app.get("/api/social/following/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      // Check if the user exists
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Get users this user is following
      const following = await storage.getFollowing(userId);
      
      // Remove sensitive information
      const sanitizedFollowing = following.map(followedUser => {
        const { password, ...userData } = followedUser;
        return userData;
      });
      
      res.json(sanitizedFollowing);
    } catch (error) {
      console.error('Error getting following:', error);
      res.status(500).json({ message: "Failed to get following users" });
    }
  });
  
  // Get posts count
  app.get("/api/social/posts/count/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      // Check if the user exists
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Get posts count
      const count = await storage.getUserPostCount(userId);
      res.json({ count });
    } catch (error) {
      console.error('Error getting posts count:', error);
      res.status(500).json({ message: "Failed to get posts count" });
    }
  });
  
  // Get followers count
  app.get("/api/social/followers/count/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      // Check if the user exists
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Get followers count
      const count = await storage.getFollowersCount(userId);
      res.json({ count });
    } catch (error) {
      console.error('Error getting followers count:', error);
      res.status(500).json({ message: "Failed to get followers count" });
    }
  });
  
  // Get following count
  app.get("/api/social/following/count/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      // Check if the user exists
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Get following count
      const count = await storage.getFollowingCount(userId);
      res.json({ count });
    } catch (error) {
      console.error('Error getting following count:', error);
      res.status(500).json({ message: "Failed to get following count" });
    }
  });
  
  // Get suggested users to follow
  app.get("/api/social/suggested", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      
      const suggestedUsers = await storage.getSuggestedUsers(userId, limit);
      
      // Remove sensitive information
      const sanitizedUsers = suggestedUsers.map(user => {
        const { password, ...userData } = user;
        return userData;
      });
      
      res.json(sanitizedUsers);
    } catch (error) {
      console.error('Error getting suggested users:', error);
      res.status(500).json({ message: "Failed to get suggested users" });
    }
  });
  
  // Update user profile
  app.patch("/api/users/profile", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      console.log(`[DEBUG] Updating profile for user ID: ${userId}`);
      
      // Handle JSON input
      const updates = req.body || {};
      console.log(`[DEBUG] Update data:`, updates);
      
      // Check if updates object is empty (except for avatar)
      const hasUpdates = Object.keys(updates).filter(key => key !== 'avatarUrl').length > 0 || updates.avatarUrl;
      
      if (!hasUpdates) {
        console.log(`[DEBUG] No updates provided for user ID: ${userId}`);
        return res.status(400).json({ message: "No updates provided" });
      }
      
      // Check if the user exists before attempting to update
      const existingUser = await storage.getUser(userId);
      if (!existingUser) {
        console.error(`[ERROR] User not found with ID: ${userId}`);
        return res.status(404).json({ message: "User not found" });
      }
      
      // Handle avatar uploads or external URLs
      if (updates.avatarUrl) {
        // Check if it's a base64 image
        if (updates.avatarUrl.startsWith('data:image')) {
          try {
            const base64Data = updates.avatarUrl.replace(/^data:image\/\w+;base64,/, '');
            
            // Create a unique filename 
            const filename = `avatar_${userId}_${Date.now()}.png`;
            
            // Create uploads directory if it doesn't exist
            if (!fs.existsSync('./public/uploads')) {
              fs.mkdirSync('./public/uploads', { recursive: true });
            }
            if (!fs.existsSync('./public/uploads/avatars')) {
              fs.mkdirSync('./public/uploads/avatars', { recursive: true });
            }
            
            // Save the file
            fs.writeFileSync(`./public/uploads/avatars/${filename}`, base64Data, 'base64');
            
            // Set the avatar URL to the saved file path
            updates.avatar = `/uploads/avatars/${filename}`;
            console.log(`[DEBUG] Avatar saved to: /uploads/avatars/${filename}`);
          } catch (error) {
            console.error(`[ERROR] Failed to save avatar: ${error}`);
            return res.status(500).json({ message: "Failed to save avatar image" });
          }
        } else if (!updates.avatarUrl.startsWith('blob:')) {
          // Use existing URL if it's not a blob URL
          updates.avatar = updates.avatarUrl;
        }
        // If it's a blob URL, ignore it
        delete updates.avatarUrl; // Remove the temporary field
      }
      
      // If we still have updates, proceed
      if (Object.keys(updates).length === 0) {
        console.log(`[DEBUG] No valid updates remain after processing for user ID: ${userId}`);
        return res.status(400).json({ message: "No valid updates provided" });
      }
      
      const updatedUser = await storage.updateUser(userId, updates);
      
      if (!updatedUser) {
        console.error(`[ERROR] Failed to update user with ID: ${userId}`);
        return res.status(404).json({ message: "User update failed" });
      }
      
      // Remove password before sending
      const { password, ...userData } = updatedUser;
      console.log(`[DEBUG] Profile updated successfully for user ID: ${userId}`);
      res.json(userData);
    } catch (error) {
      console.error(`[ERROR] Failed to update profile:`, error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });
  
  // Upload avatar endpoint
  app.post("/api/users/avatar", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const { imageData } = req.body;
      
      if (!imageData) {
        return res.status(400).json({ message: "No image data provided" });
      }
      
      // Check if it's a base64 image
      if (imageData.startsWith('data:image')) {
        const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
        
        // Create a unique filename
        const filename = `avatar_${userId}_${Date.now()}.png`;
        
        // Create uploads directory if it doesn't exist
        if (!fs.existsSync('./public/uploads')) {
          fs.mkdirSync('./public/uploads', { recursive: true });
        }
        if (!fs.existsSync('./public/uploads/avatars')) {
          fs.mkdirSync('./public/uploads/avatars', { recursive: true });
        }
        
        // Save the file
        fs.writeFileSync(`./public/uploads/avatars/${filename}`, base64Data, 'base64');
        
        // Update user's avatar field
        const avatarUrl = `/uploads/avatars/${filename}`;
        const updatedUser = await storage.updateUser(userId, { avatar: avatarUrl });
        
        if (!updatedUser) {
          return res.status(500).json({ message: "Failed to update avatar" });
        }
        
        return res.json({ avatarUrl });
      } else {
        return res.status(400).json({ message: "Invalid image format" });
      }
    } catch (error) {
      console.error(`[ERROR] Failed to upload avatar:`, error);
      res.status(500).json({ message: "Failed to upload avatar" });
    }
  });
  
  // Message routes
  // Get user's conversations
  app.get("/api/messages/conversations", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const conversations = await storage.getUserConversations(userId);
      res.json(conversations);
    } catch (error) {
      res.status(500).json({ message: "Failed to get conversations" });
    }
  });
  
  // Get conversation messages between users
  app.get("/api/messages/conversation/:partnerId", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const partnerId = parseInt(req.params.partnerId);
      const messages = await storage.getConversationMessages(userId, partnerId);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: "Failed to get conversation messages" });
    }
  });
  
  // Room-based messaging will be implemented in a future update
  // For now, we're focusing on direct user-to-user messaging
  
  // Get unread message count is now handled in message-routes.ts
  
  // Mark messages as read is now handled in message-routes.ts
  
  // Note: Notification endpoints are already defined above
  
  // Group chat and room-based messaging will be implemented in a future update
  // For now, we're focusing on direct user-to-user messaging
  
  // Video-related routes
  
  // Create a new video
  app.post("/api/videos", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      
      const validatedData = insertVideoSchema.parse({
        ...req.body,
        userId,
      });
      
      const video = await storage.createVideo(validatedData);
      res.status(201).json(video);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Failed to create video" });
    }
  });
  
  // Get all videos with optional filtering
  app.get("/api/videos", async (req, res) => {
    try {
      const filter: Record<string, any> = {};
      
      // Parse query parameters for filtering
      if (req.query.userId) {
        filter.userId = parseInt(req.query.userId as string);
      }
      
      if (req.query.videoType) {
        filter.videoType = req.query.videoType;
      }
      
      if (req.query.isPublished) {
        filter.isPublished = req.query.isPublished === 'true';
      }
      
      if (req.query.tags) {
        filter.tags = (req.query.tags as string).split(',');
      }
      
      const videos = await storage.listVideos(filter);
      res.json(videos);
    } catch (error) {
      res.status(500).json({ message: "Failed to list videos" });
    }
  });
  
  // Get trending videos - MUST be before the video ID route to avoid conflict
  app.get("/api/videos/trending", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const videos = await storage.getTrendingVideos(limit);
      res.json(videos);
    } catch (error) {
      res.status(500).json({ message: "Failed to get trending videos" });
    }
  });
  
  // Get videos by type - MUST be before the video ID route to avoid conflict
  app.get("/api/videos/type/:type", async (req, res) => {
    try {
      const type = req.params.type;
      const videos = await storage.getVideosByType(type);
      res.json(videos);
    } catch (error) {
      res.status(500).json({ message: "Failed to get videos by type" });
    }
  });
  
  // Get a specific video by ID - This route MUST come after all other /api/videos/* routes
  app.get("/api/videos/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const video = await storage.getVideo(id);
      
      if (!video) {
        return res.status(404).json({ message: "Video not found" });
      }
      
      res.json(video);
    } catch (error) {
      res.status(500).json({ message: "Failed to get video" });
    }
  });
  
  // Update a video
  app.patch("/api/videos/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const videoId = parseInt(req.params.id);
      
      // Verify video exists and belongs to the user
      const video = await storage.getVideo(videoId);
      if (!video) {
        return res.status(404).json({ message: "Video not found" });
      }
      
      if (video.userId !== userId) {
        return res.status(403).json({ message: "You can only update your own videos" });
      }
      
      const updatedVideo = await storage.updateVideo(videoId, req.body);
      res.json(updatedVideo);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Failed to update video" });
    }
  });
  
  // Delete a video
  app.delete("/api/videos/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const videoId = parseInt(req.params.id);
      
      // Verify video exists and belongs to the user
      const video = await storage.getVideo(videoId);
      if (!video) {
        return res.status(404).json({ message: "Video not found" });
      }
      
      if (video.userId !== userId) {
        return res.status(403).json({ message: "You can only delete your own videos" });
      }
      
      await storage.deleteVideo(videoId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete video" });
    }
  });
  
  // Get user's videos
  app.get("/api/users/:userId/videos", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const videos = await storage.getUserVideos(userId);
      res.json(videos);
    } catch (error) {
      res.status(500).json({ message: "Failed to get user videos" });
    }
  });
  
  // Create a video engagement (view, like, share, comment)
  app.post("/api/videos/:videoId/engagements", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const videoId = parseInt(req.params.videoId);
      
      // Verify video exists
      const video = await storage.getVideo(videoId);
      if (!video) {
        return res.status(404).json({ message: "Video not found" });
      }
      
      const validatedData = insertVideoEngagementSchema.parse({
        ...req.body,
        userId,
        videoId,
      });
      
      const engagement = await storage.createVideoEngagement(validatedData);
      res.status(201).json(engagement);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Failed to create video engagement" });
    }
  });
  
  // Get video engagements
  app.get("/api/videos/:videoId/engagements", async (req, res) => {
    try {
      const videoId = parseInt(req.params.videoId);
      const type = req.query.type as string | undefined;
      
      const engagements = await storage.getVideoEngagements(videoId, type);
      res.json(engagements);
    } catch (error) {
      res.status(500).json({ message: "Failed to get video engagements" });
    }
  });
  
  // Video product overlay routes
  
  // Create a product overlay for a video
  app.post("/api/videos/:videoId/product-overlays", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const videoId = parseInt(req.params.videoId);
      
      // Verify video exists
      const video = await storage.getVideo(videoId);
      if (!video) {
        return res.status(404).json({ message: "Video not found" });
      }
      
      // Only the video owner can add product overlays
      if (video.userId !== userId) {
        return res.status(403).json({ message: "You can only add product overlays to your own videos" });
      }
      
      const validatedData = insertVideoProductOverlaySchema.parse({
        ...req.body,
        videoId,
      });
      
      const overlay = await storage.createVideoProductOverlay(validatedData);
      res.status(201).json(overlay);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Failed to create product overlay" });
    }
  });
  
  // Get all product overlays for a video
  app.get("/api/videos/:videoId/product-overlays", async (req, res) => {
    try {
      const videoId = parseInt(req.params.videoId);
      
      // Verify video exists
      const video = await storage.getVideo(videoId);
      if (!video) {
        return res.status(404).json({ message: "Video not found" });
      }
      
      const overlays = await storage.getVideoProductOverlays(videoId);
      res.json(overlays);
    } catch (error) {
      res.status(500).json({ message: "Failed to get product overlays" });
    }
  });
  
  // Get a specific product overlay
  app.get("/api/product-overlays/:overlayId", async (req, res) => {
    try {
      const overlayId = parseInt(req.params.overlayId);
      const overlay = await storage.getVideoProductOverlay(overlayId);
      
      if (!overlay) {
        return res.status(404).json({ message: "Product overlay not found" });
      }
      
      res.json(overlay);
    } catch (error) {
      res.status(500).json({ message: "Failed to get product overlay" });
    }
  });
  
  // Premium Video Purchase Routes
  
  // Purchase access to a premium video
  app.post("/api/videos/:videoId/purchase", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const videoId = parseInt(req.params.videoId);
      
      // Verify video exists
      const video = await storage.getVideo(videoId);
      if (!video) {
        return res.status(404).json({ message: "Video not found" });
      }
      
      // Check if the video is premium
      if (!video.isPremium) {
        return res.status(400).json({ message: "This video is not premium content" });
      }
      
      // Check if user already purchased this video
      const existingPurchase = await storage.getVideoPurchaseByUserAndVideo(userId, videoId);
      if (existingPurchase) {
        return res.status(400).json({ message: "You already have access to this video" });
      }
      
      // Create purchase record
      const purchase = await storage.createVideoPurchase({
        userId,
        videoId,
        amount: video.price || 0,
        purchaseDate: new Date(),
        paymentMethod: req.body.paymentMethod || "wallet"
      });
      
      res.status(201).json({
        success: true,
        message: "Video access granted",
        purchase
      });
    } catch (error) {
      console.error("Error purchasing video:", error);
      res.status(500).json({ message: "Failed to process video purchase" });
    }
  });
  
  // Check if user has access to a premium video
  app.get("/api/videos/:videoId/access", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const videoId = parseInt(req.params.videoId);
      
      // Verify video exists
      const video = await storage.getVideo(videoId);
      if (!video) {
        return res.status(404).json({ message: "Video not found" });
      }
      
      // If video is not premium, everyone has access
      if (!video.isPremium) {
        return res.json({ hasAccess: true, isPremium: false });
      }
      
      // Check if the user is the creator (creators always have access to their own content)
      if (video.userId === userId) {
        return res.json({ hasAccess: true, isPremium: true, isCreator: true });
      }
      
      // Check if user has purchased this video
      const hasAccess = await storage.hasUserPurchasedVideo(userId, videoId);
      
      res.json({
        hasAccess,
        isPremium: true,
        isCreator: false,
        price: video.price || 0
      });
    } catch (error) {
      console.error("Error checking video access:", error);
      res.status(500).json({ message: "Failed to check video access" });
    }
  });
  
  // Get all videos purchased by the authenticated user
  app.get("/api/user/video-purchases", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      
      // Get all user's video purchases
      const purchases = await storage.getUserVideoPurchases(userId);
      
      // For each purchase, get the video details
      const purchasesWithDetails = await Promise.all(
        purchases.map(async (purchase) => {
          const video = await storage.getVideo(purchase.videoId);
          return {
            ...purchase,
            video: video || { title: "Video not available" }
          };
        })
      );
      
      res.json(purchasesWithDetails);
    } catch (error) {
      console.error("Error fetching user's video purchases:", error);
      res.status(500).json({ message: "Failed to fetch video purchases" });
    }
  });
  
  // Get revenue statistics for a creator's premium videos
  app.get("/api/creator/video-revenue", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      
      // Get revenue statistics
      const revenueStats = await storage.getCreatorVideoRevenue(userId);
      
      // Get all creator's videos
      const videos = await storage.getUserVideos(userId);
      
      // Get premium videos with detailed statistics
      const premiumVideos = [];
      for (const video of videos) {
        if (video.isPremium) {
          const revenue = await storage.getVideoRevenue(video.id);
          premiumVideos.push({
            ...video,
            revenue
          });
        }
      }
      
      res.json({
        totalRevenue: revenueStats.totalRevenue,
        premiumVideoCount: revenueStats.videoCount,
        premiumVideos
      });
    } catch (error) {
      console.error("Error fetching creator video revenue:", error);
      res.status(500).json({ message: "Failed to fetch video revenue statistics" });
    }
  });
  
  // Update a product overlay
  app.patch("/api/product-overlays/:overlayId", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const overlayId = parseInt(req.params.overlayId);
      
      // Get the overlay
      const overlay = await storage.getVideoProductOverlay(overlayId);
      if (!overlay) {
        return res.status(404).json({ message: "Product overlay not found" });
      }
      
      // Get the video to check ownership
      const video = await storage.getVideo(overlay.videoId);
      if (!video || video.userId !== userId) {
        return res.status(403).json({ message: "You can only update overlays on your own videos" });
      }
      
      const updatedOverlay = await storage.updateVideoProductOverlay(overlayId, req.body);
      res.json(updatedOverlay);
    } catch (error) {
      res.status(500).json({ message: "Failed to update product overlay" });
    }
  });
  
  // Delete a product overlay
  app.delete("/api/product-overlays/:overlayId", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const overlayId = parseInt(req.params.overlayId);
      
      // Get the overlay
      const overlay = await storage.getVideoProductOverlay(overlayId);
      if (!overlay) {
        return res.status(404).json({ message: "Product overlay not found" });
      }
      
      // Get the video to check ownership
      const video = await storage.getVideo(overlay.videoId);
      if (!video || video.userId !== userId) {
        return res.status(403).json({ message: "You can only delete overlays on your own videos" });
      }
      
      const success = await storage.deleteVideoProductOverlay(overlayId);
      if (success) {
        res.status(204).send();
      } else {
        res.status(500).json({ message: "Failed to delete product overlay" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to delete product overlay" });
    }
  });
  
  // Increment product overlay click count
  app.post("/api/product-overlays/:overlayId/click", async (req, res) => {
    try {
      const overlayId = parseInt(req.params.overlayId);
      
      // Get the overlay
      const overlay = await storage.getVideoProductOverlay(overlayId);
      if (!overlay) {
        return res.status(404).json({ message: "Product overlay not found" });
      }
      
      const updatedOverlay = await storage.incrementOverlayClickCount(overlayId);
      res.json(updatedOverlay);
    } catch (error) {
      res.status(500).json({ message: "Failed to record click" });
    }
  });
  
  // Increment product overlay conversion count (when purchase is made)
  app.post("/api/product-overlays/:overlayId/conversion", async (req, res) => {
    try {
      const overlayId = parseInt(req.params.overlayId);
      
      // Get the overlay
      const overlay = await storage.getVideoProductOverlay(overlayId);
      if (!overlay) {
        return res.status(404).json({ message: "Product overlay not found" });
      }
      
      const updatedOverlay = await storage.incrementOverlayConversionCount(overlayId);
      res.json(updatedOverlay);
    } catch (error) {
      res.status(500).json({ message: "Failed to record conversion" });
    }
  });
  
  // Playlist routes
  
  // Create a playlist
  app.post("/api/playlists", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      
      const validatedData = insertVideoPlaylistSchema.parse({
        ...req.body,
        userId,
      });
      
      const playlist = await storage.createPlaylist(validatedData);
      res.status(201).json(playlist);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Failed to create playlist" });
    }
  });
  
  // Get a specific playlist
  app.get("/api/playlists/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const playlist = await storage.getPlaylist(id);
      
      if (!playlist) {
        return res.status(404).json({ message: "Playlist not found" });
      }
      
      res.json(playlist);
    } catch (error) {
      res.status(500).json({ message: "Failed to get playlist" });
    }
  });
  
  // Update a playlist
  app.patch("/api/playlists/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const playlistId = parseInt(req.params.id);
      
      // Verify playlist exists and belongs to the user
      const playlist = await storage.getPlaylist(playlistId);
      if (!playlist) {
        return res.status(404).json({ message: "Playlist not found" });
      }
      
      if (playlist.userId !== userId) {
        return res.status(403).json({ message: "You can only update your own playlists" });
      }
      
      const updatedPlaylist = await storage.updatePlaylist(playlistId, req.body);
      res.json(updatedPlaylist);
    } catch (error) {
      res.status(500).json({ message: "Failed to update playlist" });
    }
  });
  
  // Delete a playlist
  app.delete("/api/playlists/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const playlistId = parseInt(req.params.id);
      
      // Verify playlist exists and belongs to the user
      const playlist = await storage.getPlaylist(playlistId);
      if (!playlist) {
        return res.status(404).json({ message: "Playlist not found" });
      }
      
      if (playlist.userId !== userId) {
        return res.status(403).json({ message: "You can only delete your own playlists" });
      }
      
      await storage.deletePlaylist(playlistId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete playlist" });
    }
  });
  
  // Get user's playlists
  app.get("/api/users/:userId/playlists", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const playlists = await storage.getUserPlaylists(userId);
      res.json(playlists);
    } catch (error) {
      res.status(500).json({ message: "Failed to get user playlists" });
    }
  });
  
  // Add video to playlist
  app.post("/api/playlists/:playlistId/videos", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const playlistId = parseInt(req.params.playlistId);
      
      // Verify playlist exists and belongs to the user
      const playlist = await storage.getPlaylist(playlistId);
      if (!playlist) {
        return res.status(404).json({ message: "Playlist not found" });
      }
      
      if (playlist.userId !== userId) {
        return res.status(403).json({ message: "You can only modify your own playlists" });
      }
      
      const videoId = req.body.videoId;
      if (!videoId) {
        return res.status(400).json({ message: "Video ID is required" });
      }
      
      // Verify video exists
      const video = await storage.getVideo(videoId);
      if (!video) {
        return res.status(404).json({ message: "Video not found" });
      }
      
      // Get the existing items to determine the position
      const playlistItems = await storage.getPlaylistItems(playlistId);
      const position = playlistItems.length > 0 ? 
        Math.max(...playlistItems.map(item => item.position)) + 1 : 
        0;
      
      const validatedData = insertPlaylistItemSchema.parse({
        playlistId,
        videoId,
        position,
      });
      
      const item = await storage.addToPlaylist(validatedData);
      
      // Update the playlist's video count
      await storage.updatePlaylist(playlistId, {
        videoCount: (playlist.videoCount || 0) + 1
      });
      
      res.status(201).json(item);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Failed to add video to playlist" });
    }
  });
  
  // Remove video from playlist
  app.delete("/api/playlists/:playlistId/videos/:videoId", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const playlistId = parseInt(req.params.playlistId);
      const videoId = parseInt(req.params.videoId);
      
      // Verify playlist exists and belongs to the user
      const playlist = await storage.getPlaylist(playlistId);
      if (!playlist) {
        return res.status(404).json({ message: "Playlist not found" });
      }
      
      if (playlist.userId !== userId) {
        return res.status(403).json({ message: "You can only modify your own playlists" });
      }
      
      const success = await storage.removeFromPlaylist(playlistId, videoId);
      
      if (success && playlist.videoCount !== null && playlist.videoCount > 0) {
        // Update the playlist's video count
        await storage.updatePlaylist(playlistId, {
          videoCount: playlist.videoCount - 1
        });
      }
      
      res.json({ success });
    } catch (error) {
      res.status(500).json({ message: "Failed to remove video from playlist" });
    }
  });
  
  // Get playlist items
  app.get("/api/playlists/:playlistId/videos", async (req, res) => {
    try {
      const playlistId = parseInt(req.params.playlistId);
      const playlistItems = await storage.getPlaylistItems(playlistId);
      res.json(playlistItems);
    } catch (error) {
      res.status(500).json({ message: "Failed to get playlist items" });
    }
  });

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
        await storage.updateUser(user.id, { isVendor: true });
      }
      
      res.status(201).json(vendor);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Failed to create vendor" });
    }
  });
  
  // Get user's vendor profile
  app.get("/api/vendors/me", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      
      // Get the vendor data for this user
      const vendor = await storage.getVendorByUserId(userId);
      
      if (!vendor) {
        return res.status(404).json({ message: "Vendor profile not found" });
      }
      
      res.json(vendor);
    } catch (error) {
      console.error("Error getting vendor profile:", error);
      res.status(500).json({ message: "Failed to get vendor profile" });
    }
  });
  
  // Get vendor products
  app.get("/api/vendors/products", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      
      // Get the vendor data for this user
      const vendor = await storage.getVendorByUserId(userId);
      
      if (!vendor) {
        return res.status(404).json({ message: "Vendor profile not found" });
      }
      
      // Get products by vendor ID
      const products = await storage.listProducts({ vendorId: vendor.id });
      
      res.json(products);
    } catch (error) {
      console.error("Error getting vendor products:", error);
      res.status(500).json({ message: "Failed to get vendor products" });
    }
  });
  
  // Get vendor orders
  app.get("/api/vendors/orders", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const status = req.query.status as string;
      
      // Get the vendor data for this user
      const vendor = await storage.getVendorByUserId(userId);
      
      if (!vendor) {
        return res.status(404).json({ message: "Vendor profile not found" });
      }
      
      // Get all order items for this vendor
      const orderItems = await storage.getVendorOrderItems(vendor.id, status);
      
      // Get order details for these items
      const orders = await storage.getOrdersForVendor(vendor.id, status);
      
      res.json({
        orders,
        orderItems
      });
    } catch (error) {
      console.error("Error getting vendor orders:", error);
      res.status(500).json({ message: "Failed to get vendor orders" });
    }
  });
  
  // Get vendor customers
  app.get("/api/vendors/customers", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      
      // Get the vendor data for this user
      const vendor = await storage.getVendorByUserId(userId);
      
      if (!vendor) {
        return res.status(404).json({ message: "Vendor profile not found" });
      }
      
      // Get top customers for this vendor
      const customers = await storage.getVendorTopBuyers(vendor.id, 20);
      
      res.json(customers);
    } catch (error) {
      console.error("Error getting vendor customers:", error);
      res.status(500).json({ message: "Failed to get vendor customers" });
    }
  });
  
  // Update shipping status
  app.put("/api/vendors/orders/:orderId/shipping", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const orderId = parseInt(req.params.orderId);
      const { status, trackingNumber } = req.body;
      
      // Get the vendor data for this user
      const vendor = await storage.getVendorByUserId(userId);
      
      if (!vendor) {
        return res.status(404).json({ message: "Vendor profile not found" });
      }
      
      // Check if the order belongs to this vendor
      const orderItems = await storage.getVendorOrderItems(vendor.id);
      const vendorOrderIds = new Set(orderItems.map(item => item.orderId));
      
      if (!vendorOrderIds.has(orderId)) {
        return res.status(403).json({ message: "Order does not belong to this vendor" });
      }
      
      // Update order shipping
      const updatedOrder = await storage.updateOrderShipping(orderId, vendor.id, status, trackingNumber);
      
      res.json(updatedOrder);
    } catch (error) {
      console.error("Error updating shipping status:", error);
      res.status(500).json({ message: "Failed to update shipping status" });
    }
  });
  
  // Update vendor settings
  app.put("/api/vendors/settings", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      
      // Get the vendor data for this user
      const vendor = await storage.getVendorByUserId(userId);
      
      if (!vendor) {
        return res.status(404).json({ message: "Vendor profile not found" });
      }
      
      // Validate input
      const validData = vendorUpdateSchema.safeParse(req.body);
      
      if (!validData.success) {
        return res.status(400).json({ message: "Invalid vendor data", errors: validData.error.format() });
      }
      
      // Update vendor settings
      const updatedVendor = await storage.updateVendorSettings(vendor.id, validData.data);
      
      res.json(updatedVendor);
    } catch (error) {
      console.error("Error updating vendor settings:", error);
      res.status(500).json({ message: "Failed to update vendor settings" });
    }
  });
  
  // Get vendor analytics summary
  app.get("/api/vendors/:vendorId/analytics/summary", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const vendorId = parseInt(req.params.vendorId);
      
      // Verify the vendor exists
      const vendor = await storage.getVendor(vendorId);
      if (!vendor) {
        return res.status(404).json({ message: "Vendor not found" });
      }
      
      // Make sure the user is the vendor or an admin
      if (vendor.userId !== userId && (req.user as any).role !== 'admin') {
        return res.status(403).json({ message: "You can only view your own analytics" });
      }
      
      // Get total sales
      const totalSales = await storage.getVendorTotalSales(vendorId);
      
      // Get order stats
      const orderStats = await storage.getVendorOrderStats(vendorId);
      
      // Get revenue data
      const revenueData = await storage.getVendorRevenueByPeriod(vendorId, "monthly");
      
      // Get top products
      const topProducts = await storage.getVendorTopProducts(vendorId, 5);
      
      // Get total products
      const productsCount = await storage.getVendorProductsCount(vendorId);
      
      // Get recent orders
      const recentOrders = await storage.getVendorRecentOrders(vendorId, 5);
      
      res.json({
        totalRevenue: totalSales || 0,
        totalOrders: orderStats?.totalOrders || 0,
        totalProducts: productsCount || 0,
        revenueData,
        topProducts,
        recentOrders,
      });
    } catch (error) {
      console.error("Error getting vendor analytics summary:", error);
      res.status(500).json({ message: "Failed to get analytics summary" });
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

  app.get("/api/vendors/user/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const vendor = await storage.getVendorByUserId(userId);
      
      if (!vendor) {
        return res.status(404).json({ message: "Vendor not found for this user" });
      }
      
      res.json(vendor);
    } catch (error) {
      res.status(500).json({ message: "Failed to get vendor by user ID" });
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

  // Enhanced post routes with direct JSON data for content and file uploads
  // Feed endpoints for social media functionality
  app.get("/api/feed/personal", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      console.log(`[INFO] Fetching personal feed for user ${userId}`);
      
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
      
      // Use the social media suite to get user's personalized feed
      // This will include the user's own posts and posts from followed users
      const feedPosts = await socialMediaSuite.getUserFeed(userId, {
        limit,
        offset
      });
      
      console.log(`[INFO] Retrieved ${feedPosts.length} posts for personal feed`);
      
      // Filter out any posts from the admin user (user id 1) if they exist
      const filteredPosts = feedPosts.filter(post => post.userId !== 1);
      
      console.log(`[INFO] After filtering user 1: ${filteredPosts.length} posts`);
      res.json(filteredPosts);
    } catch (error) {
      console.error("Error fetching personal feed:", error);
      res.status(500).json({ message: "Failed to fetch personal feed" });
    }
  });
  
  app.get("/api/feed/communities", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      console.log(`[INFO] Fetching communities feed for user ${userId}`);
      
      // Get the user's communities
      const userCommunities = await socialMediaSuite.getUserCommunities(userId);
      
      // If the user is not in any communities, return an empty array
      if (!userCommunities || userCommunities.length === 0) {
        console.log(`[INFO] User ${userId} is not in any communities`);
        return res.json([]);
      }
      
      // Get posts from the user's communities
      const communityIds = userCommunities.map(community => community.id);
      console.log(`[INFO] User ${userId} is in communities: ${communityIds.join(', ')}`);
      
      // Collect posts from each community
      let allCommunityPosts = [];
      for (const communityId of communityIds) {
        const communityPosts = await socialMediaSuite.getCommunityPosts(communityId);
        allCommunityPosts = [...allCommunityPosts, ...communityPosts];
      }
      
      // Sort by created date (newest first)
      allCommunityPosts.sort((a, b) => {
        const dateA = a.createdAt?.getTime() || 0;
        const dateB = b.createdAt?.getTime() || 0;
        return dateB - dateA;
      });
      
      // Apply limit and offset
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
      const paginatedPosts = allCommunityPosts.slice(offset, offset + limit);
      
      // Filter out any posts from the admin user (user id 1) if they exist
      const filteredPosts = paginatedPosts.filter(post => post.userId !== 1);
      
      console.log(`[INFO] Retrieved ${filteredPosts.length} posts for communities feed`);
      res.json(filteredPosts);
    } catch (error) {
      console.error("Error fetching communities feed:", error);
      res.status(500).json({ message: "Failed to fetch communities feed" });
    }
  });
  
  app.get("/api/feed/recommended", async (req, res) => {
    try {
      console.log(`[INFO] Fetching recommended feed`);
      
      // Use the social media suite to get trending posts
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      const trendingPosts = await socialMediaSuite.getTrendingPosts(limit);
      
      // Filter out any posts from the admin user (user id 1) if they exist
      const filteredPosts = trendingPosts.filter(post => post.userId !== 1);
      
      console.log(`[INFO] Retrieved ${filteredPosts.length} posts for recommended feed`);
      res.json(filteredPosts);
    } catch (error) {
      console.error("Error fetching recommended feed:", error);
      res.status(500).json({ message: "Failed to fetch recommended feed" });
    }
  });

  app.post("/api/posts", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      
      // Create a post data object from the JSON request
      const postData: any = {
        userId,
        content: req.body.content,
        contentType: req.body.contentType || 'standard',
      };
      
      // Add optional fields if they exist
      if (req.body.title) postData.title = req.body.title;
      if (req.body.communityId) postData.communityId = parseInt(req.body.communityId);
      
      // Handle tags array directly
      if (req.body.tags && Array.isArray(req.body.tags)) {
        postData.tags = req.body.tags;
      }
      
      // Handle media URLs
      if (req.body.imageUrl) {
        // Check if it's a base64 image
        if (req.body.imageUrl.startsWith('data:image')) {
          // Convert base64 to URL by storing it as an asset
          // This is a simplified approach - in production you would save to cloud storage
          const base64Data = req.body.imageUrl.split(',')[1];
          const filename = `image_${Date.now()}.png`;
          
          // Create uploads directory if it doesn't exist
          if (!fs.existsSync('./public/uploads')) {
            fs.mkdirSync('./public/uploads', { recursive: true });
          }
          if (!fs.existsSync('./public/uploads/images')) {
            fs.mkdirSync('./public/uploads/images', { recursive: true });
          }
          
          // Save the file
          fs.writeFileSync(`./public/uploads/images/${filename}`, base64Data, 'base64');
          
          // Set the image URL to the saved file
          postData.imageUrl = `/uploads/images/${filename}`;
        } else {
          // Use existing URL (for post editing)
          postData.imageUrl = req.body.imageUrl;
        }
      }
      
      // Handle video URLs
      if (req.body.videoUrl) {
        // Check if it's a base64 video
        if (req.body.videoUrl.startsWith('data:video')) {
          // Convert base64 to URL by storing it as an asset
          const base64Data = req.body.videoUrl.split(',')[1];
          const filename = `video_${Date.now()}.mp4`;
          
          // Create uploads directory if it doesn't exist
          if (!fs.existsSync('./public/uploads')) {
            fs.mkdirSync('./public/uploads', { recursive: true });
          }
          if (!fs.existsSync('./public/uploads/videos')) {
            fs.mkdirSync('./public/uploads/videos', { recursive: true });
          }
          
          // Save the file
          fs.writeFileSync(`./public/uploads/videos/${filename}`, base64Data, 'base64');
          
          // Set the video URL to the saved file
          postData.videoUrl = `/uploads/videos/${filename}`;
        } else {
          // Use existing URL (for post editing)
          postData.videoUrl = req.body.videoUrl;
        }
      }
      
      if (req.body.linkUrl) postData.linkUrl = req.body.linkUrl;
      if (req.body.isPromoted !== undefined) postData.isPromoted = req.body.isPromoted;
      
      // Explicitly set isPublished to true by default, unless specified otherwise
      postData.isPublished = req.body.isPublished !== undefined ? req.body.isPublished : true;
      
      console.log("Creating post with data:", postData);
      
      // Use our centralized API module
      try {
        // Import our social API module
        const socialApi = await import('./social-api');
        
        // Use the createApiPost function from our API module
        const post = await socialApi.createApiPost(postData);
        console.log("Post created successfully via API module:", post);
        
        return res.status(201).json(post);
      } catch (apiError) {
        console.error("API module error when creating post:", apiError);
        console.log("Falling back to database for post creation...");
        
        // If API fails, fall back to database storage
        // Validate the data before creating the post
        const validatedData = insertPostSchema.parse(postData);
        const post = await storage.createPost(validatedData);
        
        // Explicitly clear any in-memory posts cache
        try {
          storage.clearMemoryPostsCache();
        } catch (error) {
          console.log("Note: clearMemoryPostsCache not implemented, but this is not critical.");
        }
        
        return res.status(201).json(post);
      }
    } catch (error) {
      console.error("Error creating post:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Failed to create post" });
    }
  });

  app.put("/api/posts/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const postId = parseInt(req.params.id);
      
      // Get the post
      const post = await storage.getPost(postId);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      
      // Check if the post belongs to the user
      if (post.userId !== userId) {
        return res.status(403).json({ message: "You can only update your own posts" });
      }
      
      const validatedData = insertPostSchema.partial().parse(req.body);
      
      const updatedPost = await storage.updatePost(postId, validatedData);
      res.json(updatedPost);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Failed to update post" });
    }
  });

  app.get("/api/posts", async (req, res) => {
    try {
      console.log("============ GET /api/posts called ============");
      
      // Extract query parameters for filtering
      const options: {
        userId?: number;
        contentType?: string | string[];
        isPromoted?: boolean;
        tags?: string[];
        limit?: number;
        offset?: number;
      } = {};
      
      if (req.query.userId) {
        options.userId = parseInt(req.query.userId as string);
      }
      
      if (req.query.contentType) {
        options.contentType = req.query.contentType as string;
      }
      
      if (req.query.isPromoted !== undefined) {
        options.isPromoted = req.query.isPromoted === 'true';
      }
      
      if (req.query.tags) {
        options.tags = (req.query.tags as string).split(',');
      }
      
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      options.limit = limit;
      
      if (req.query.offset) {
        options.offset = parseInt(req.query.offset as string);
      }
      
      console.log("Fetching posts with options:", options);
      
      // Use our centralized API module
      try {
        // Import our social API module
        const socialApi = await import('./social-api');
        
        // Use the fetchPosts function from our API module
        const posts = await socialApi.fetchPosts(options);
        console.log(`Received ${posts.length} posts from API module`);
        
        return res.json(posts);
      } catch (apiError) {
        console.error("API module error:", apiError);
        
        // Fall back to database if API fails
        console.log("Falling back to database for posts...");
        
        // Try a direct query to bypass complex listPosts function
        let directPosts;
        try {
          directPosts = await db.select().from(posts).where(eq(posts.isPublished, true)).limit(limit);
          console.log("Direct DB posts query result:", directPosts);
        } catch (error) {
          console.error("Direct DB query error:", error);
          directPosts = [];
        }
        
        // If direct query returned posts, use those instead of going through storage
        if (directPosts && directPosts.length > 0) {
          console.log("Using direct query results instead of storage (found " + directPosts.length + " posts)");
          return res.json(directPosts);
        }
        
        // Otherwise fall back to regular storage method
        const storagePosts = await storage.listPosts(options);
        console.log("Storage listPosts result:", storagePosts);
        
        return res.json(storagePosts);
      }
      
    } catch (error) {
      console.error("Error in /api/posts endpoint:", error);
      res.status(500).json({ message: "Failed to list posts" });
    }
  });
  
  app.get("/api/posts/:id", async (req, res) => {
    try {
      const postId = parseInt(req.params.id);
      
      console.log(`Fetching single post with ID: ${postId}`);
      
      // Use our centralized API module
      try {
        // Import our social API module
        const socialApi = await import('./social-api');
        
        // Use the fetchPostById function from our API module
        const post = await socialApi.fetchPostById(postId);
        
        if (!post) {
          throw new Error(`Post with ID ${postId} not found in API`);
        }
        
        console.log(`Successfully retrieved post from API module:`, post);
        return res.json(post);
      } catch (apiError) {
        console.error("API module error for single post:", apiError);
        
        // Fall back to database if API fails
        console.log("Falling back to database for single post...");
        
        // Get post from local database
        const post = await storage.getPost(postId);
        
        if (!post) {
          return res.status(404).json({ message: "Post not found" });
        }
        
        // Increment view count
        await storage.incrementPostView(postId);
        
        return res.json(post);
      }
    } catch (error) {
      console.error("Error in /api/posts/:id endpoint:", error);
      res.status(500).json({ message: "Failed to get post" });
    }
  });
  
  // Like a post
  app.post("/api/posts/:id/like", isAuthenticated, async (req, res) => {
    try {
      const postId = parseInt(req.params.id);
      const userId = (req.user as any).id;
      
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      // Check if post exists
      const post = await storage.getPost(postId);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      
      // Use our new storage method to like the post
      const success = await storage.likePost(postId, userId);
      
      if (!success) {
        return res.status(500).json({ message: "Failed to like post" });
      }
      
      // Get the updated post
      const updatedPost = await storage.getPost(postId);
      
      res.status(201).json({ 
        success: true, 
        message: "Post liked successfully",
        likes: updatedPost?.likes || 0
      });
    } catch (error) {
      console.error("Error liking post:", error);
      res.status(500).json({ message: "Failed to like post" });
    }
  });
  
  // Unlike a post
  app.delete("/api/posts/:id/like", isAuthenticated, async (req, res) => {
    try {
      const postId = parseInt(req.params.id);
      const userId = (req.user as any).id;
      
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      // Check if post exists
      const post = await storage.getPost(postId);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      
      // Use our new storage method to unlike the post
      const success = await storage.unlikePost(postId, userId);
      
      if (!success) {
        return res.status(500).json({ message: "Failed to unlike post" });
      }
      
      // Get the updated post
      const updatedPost = await storage.getPost(postId);
      
      res.status(200).json({ 
        success: true, 
        message: "Post unliked successfully",
        likes: updatedPost?.likes || 0
      });
    } catch (error) {
      console.error("Error unliking post:", error);
      res.status(500).json({ message: "Failed to unlike post" });
    }
  });
  
  // Check if user has liked a post
  app.get("/api/posts/:id/like/check", isAuthenticated, async (req, res) => {
    try {
      const postId = parseInt(req.params.id);
      const userId = (req.user as any).id;
      
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      // Check if post exists
      const post = await storage.getPost(postId);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      
      // Use our new storage method to check if the post is liked by the user
      const isLiked = await storage.checkIfUserLikedPost(postId, userId);
      
      res.json({ isLiked });
    } catch (error) {
      console.error("Error checking post like status:", error);
      res.status(500).json({ message: "Failed to check like status" });
    }
  });
  
  // Get comments for a post
  app.get("/api/posts/:id/comments", async (req, res) => {
    try {
      const postId = parseInt(req.params.id);
      const limit = parseInt(req.query.limit as string) || 10;
      const offset = parseInt(req.query.offset as string) || 0;
      
      // Check if post exists
      const post = await storage.getPost(postId);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      
      const comments = await storage.getPostComments(postId, limit, offset);
      res.json(comments);
    } catch (error) {
      console.error("Error fetching comments:", error);
      res.status(500).json({ message: "Failed to fetch comments" });
    }
  });
  
  // Add comment to a post
  app.post("/api/posts/:id/comments", isAuthenticated, async (req, res) => {
    try {
      const postId = parseInt(req.params.id);
      const userId = (req.user as any).id;
      const { content } = req.body;
      
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      if (!content || content.trim() === "") {
        return res.status(400).json({ message: "Comment content is required" });
      }
      
      // Check if post exists
      const post = await storage.getPost(postId);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      
      // Create comment using our storage method
      const comment = await storage.createComment({
        postId,
        userId,
        content: content.trim(),
        createdAt: new Date()
      });
      
      // Get user details to add to response
      const user = await storage.getUser(userId);
      
      // Return comment with user details
      res.status(201).json({
        ...comment,
        user: {
          id: user?.id,
          username: user?.username,
          name: user?.name,
          avatar: user?.avatar
        }
      });
    } catch (error) {
      console.error("Error adding comment:", error);
      res.status(500).json({ message: "Failed to add comment" });
    }
  });
  
  app.put("/api/posts/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const postId = parseInt(req.params.id);
      
      // Get the post
      const post = await storage.getPost(postId);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      
      // Check if the post belongs to the user
      if (post.userId !== userId) {
        return res.status(403).json({ message: "You can only update your own posts" });
      }
      
      const validatedData = insertPostSchema.partial().parse(req.body);
      const updatedPost = await storage.updatePost(postId, validatedData);
      
      res.json(updatedPost);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Failed to update post" });
    }
  });
  
  // This endpoint was replaced with the one at line ~2980
  
  app.delete("/api/posts/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const postId = parseInt(req.params.id);
      
      // Get the post
      const post = await storage.getPost(postId);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      
      // Check if the post belongs to the user
      if (post.userId !== userId) {
        return res.status(403).json({ message: "You can only delete your own posts" });
      }
      
      await storage.deletePost(postId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete post" });
    }
  });
  
  // Promotion management endpoints
  app.post("/api/posts/:id/promote", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const postId = parseInt(req.params.id);
      
      // Get the post
      const post = await storage.getPost(postId);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      
      // Check if the post belongs to the user
      if (post.userId !== userId) {
        return res.status(403).json({ message: "You can only promote your own posts" });
      }
      
      // Get promotion end date from request or default to 7 days from now
      const endDateString = req.body.endDate;
      let endDate: Date;
      
      if (endDateString) {
        endDate = new Date(endDateString);
      } else {
        endDate = new Date();
        endDate.setDate(endDate.getDate() + 7); // Default: 7 days from now
      }
      
      const promotedPost = await storage.promotePost(postId, endDate);
      res.json(promotedPost);
    } catch (error) {
      res.status(500).json({ message: "Failed to promote post" });
    }
  });
  
  app.post("/api/posts/:id/unpromote", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const postId = parseInt(req.params.id);
      
      // Get the post
      const post = await storage.getPost(postId);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      
      // Check if the post belongs to the user
      if (post.userId !== userId) {
        return res.status(403).json({ message: "You can only unpromote your own posts" });
      }
      
      const unpromotedPost = await storage.unpromotePost(postId);
      res.json(unpromotedPost);
    } catch (error) {
      res.status(500).json({ message: "Failed to unpromote post" });
    }
  });
  
  // Social network explore routes
  app.get("/api/explore/trending", async (req, res) => {
    try {
      // Get trending posts - those with most likes, comments and views
      const limit = parseInt(req.query.limit as string) || 10;
      const trending = await storage.getTrendingPosts(limit);
      res.json(trending);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch trending content" });
    }
  });
  
  app.get("/api/explore/tags", async (req, res) => {
    try {
      // Get popular tags
      const limit = parseInt(req.query.limit as string) || 20;
      const tags = await storage.getPopularTags(limit);
      res.json(tags);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch popular tags" });
    }
  });
  
  app.get("/api/explore/communities", async (req, res) => {
    try {
      // Get recommended communities
      const limit = parseInt(req.query.limit as string) || 10;
      const communities = await storage.getPopularCommunities(limit);
      res.json(communities);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch recommended communities" });
    }
  });
  
  app.get("/api/explore/products", async (req, res) => {
    try {
      // Get featured products
      const limit = parseInt(req.query.limit as string) || 10;
      const products = await storage.getFeaturedProducts(limit);
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch featured products" });
    }
  });
  
  app.get("/api/explore/users", async (req, res) => {
    try {
      // Get suggested users
      const limit = parseInt(req.query.limit as string) || 10;
      const userId = req.isAuthenticated() ? (req.user as any).id : undefined;
      
      const users = await storage.getSuggestedUsers(limit, userId);
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch suggested users" });
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

  // This endpoint was replaced with the one at line ~3080

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

  // Alternative unread message count endpoint is now handled in message-routes.ts

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

  // Vendor Analytics routes
  app.get("/api/vendors/:vendorId/analytics/total-sales", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const vendorId = parseInt(req.params.vendorId);
      
      // Verify the vendor exists
      const vendor = await storage.getVendor(vendorId);
      if (!vendor) {
        return res.status(404).json({ message: "Vendor not found" });
      }
      
      // Make sure the user is the vendor or an admin
      if (vendor.userId !== userId) {
        return res.status(403).json({ message: "You can only view your own analytics" });
      }
      
      const totalSales = await storage.getVendorTotalSales(vendorId);
      res.json({ totalSales });
    } catch (error) {
      res.status(500).json({ message: "Failed to get total sales analytics" });
    }
  });
  
  app.get("/api/vendors/:vendorId/analytics/order-stats", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const vendorId = parseInt(req.params.vendorId);
      
      // Verify the vendor exists
      const vendor = await storage.getVendor(vendorId);
      if (!vendor) {
        return res.status(404).json({ message: "Vendor not found" });
      }
      
      // Make sure the user is the vendor or an admin
      if (vendor.userId !== userId) {
        return res.status(403).json({ message: "You can only view your own analytics" });
      }
      
      const orderStats = await storage.getVendorOrderStats(vendorId);
      res.json(orderStats);
    } catch (error) {
      res.status(500).json({ message: "Failed to get order stats analytics" });
    }
  });
  
  app.get("/api/vendors/:vendorId/analytics/revenue", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const vendorId = parseInt(req.params.vendorId);
      const period = (req.query.period as "daily" | "weekly" | "monthly" | "yearly") || "monthly";
      
      // Validate period
      if (!["daily", "weekly", "monthly", "yearly"].includes(period)) {
        return res.status(400).json({ message: "Invalid period. Use daily, weekly, monthly, or yearly." });
      }
      
      // Verify the vendor exists
      const vendor = await storage.getVendor(vendorId);
      if (!vendor) {
        return res.status(404).json({ message: "Vendor not found" });
      }
      
      // Make sure the user is the vendor or an admin
      if (vendor.userId !== userId) {
        return res.status(403).json({ message: "You can only view your own analytics" });
      }
      
      const revenueData = await storage.getVendorRevenueByPeriod(vendorId, period);
      res.json(revenueData);
    } catch (error) {
      res.status(500).json({ message: "Failed to get revenue analytics" });
    }
  });
  
  app.get("/api/vendors/:vendorId/analytics/top-products", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const vendorId = parseInt(req.params.vendorId);
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
      
      // Verify the vendor exists
      const vendor = await storage.getVendor(vendorId);
      if (!vendor) {
        return res.status(404).json({ message: "Vendor not found" });
      }
      
      // Make sure the user is the vendor or an admin
      if (vendor.userId !== userId) {
        return res.status(403).json({ message: "You can only view your own analytics" });
      }
      
      const topProducts = await storage.getVendorTopProducts(vendorId, limit);
      res.json(topProducts);
    } catch (error) {
      res.status(500).json({ message: "Failed to get top products analytics" });
    }
  });
  
  app.get("/api/vendors/:vendorId/analytics/profit-loss", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const vendorId = parseInt(req.params.vendorId);
      
      // Verify the vendor exists
      const vendor = await storage.getVendor(vendorId);
      if (!vendor) {
        return res.status(404).json({ message: "Vendor not found" });
      }
      
      // Make sure the user is the vendor or an admin
      if (vendor.userId !== userId) {
        return res.status(403).json({ message: "You can only view your own analytics" });
      }
      
      const profitLossData = await storage.getVendorProfitLoss(vendorId);
      res.json(profitLossData);
    } catch (error) {
      res.status(500).json({ message: "Failed to get profit/loss analytics" });
    }
  });
  
  // Get top buyers for a vendor
  app.get("/api/vendors/:vendorId/analytics/top-buyers", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const vendorId = parseInt(req.params.vendorId);
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
      
      // Verify the vendor exists
      const vendor = await storage.getVendor(vendorId);
      if (!vendor) {
        return res.status(404).json({ message: "Vendor not found" });
      }
      
      // Make sure the user is the vendor or an admin
      if (vendor.userId !== userId) {
        return res.status(403).json({ message: "You can only view your own analytics" });
      }
      
      const topBuyers = await storage.getVendorTopBuyers(vendorId, limit);
      res.json(topBuyers);
    } catch (error) {
      res.status(500).json({ message: "Failed to get top buyers analytics" });
    }
  });

  // HTTP server already initialized at the top of the function
  
  // Add member directory routes
  app.get("/api/members", async (req, res) => {
    try {
      const users = await storage.listUsers();
      // Remove sensitive data like passwords before sending
      const members = users.map(user => {
        const { password, ...memberData } = user;
        return memberData;
      });
      res.json(members);
    } catch (error) {
      res.status(500).json({ message: "Failed to list members" });
    }
  });
  
  // Messaging API endpoints
  
  // Get conversations for the current user
  app.get("/api/messages/conversations", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const conversations = await storage.getUserConversations(userId);
      
      // Enhance participants with current user info
      const currentUser = await storage.getUser(userId);
      if (currentUser) {
        conversations.forEach(conversation => {
          const { password, ...safeCurrentUser } = currentUser;
          // Add or update the current user's info in participants
          const participantIndex = conversation.participants.findIndex(
            (p: any) => p.id === userId
          );
          
          if (participantIndex >= 0) {
            conversation.participants[participantIndex] = {
              ...conversation.participants[participantIndex],
              ...safeCurrentUser,
            };
          }
        });
      }
      
      res.json(conversations);
    } catch (error) {
      console.error("Error getting conversations:", error);
      res.status(500).json({ message: "Failed to get conversations" });
    }
  });
  
  // Get messages for a specific conversation
  app.get("/api/messages/conversations/:userId", isAuthenticated, async (req, res) => {
    try {
      const currentUserId = (req.user as any).id;
      const otherUserId = parseInt(req.params.userId);
      
      // Validate the other user exists
      const otherUser = await storage.getUser(otherUserId);
      if (!otherUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Get messages between these users
      const messages = await storage.getConversationMessages(currentUserId, otherUserId);
      
      // Mark messages from the other user as read
      const unreadMessages = messages.filter(
        msg => msg.senderId === otherUserId && !msg.isRead
      );
      
      // Update read status in parallel
      await Promise.all(
        unreadMessages.map(msg => storage.markMessageAsRead(msg.id))
      );
      
      res.json(messages);
    } catch (error) {
      console.error("Error getting conversation messages:", error);
      res.status(500).json({ message: "Failed to get messages" });
    }
  });
  
  // Send a message to an existing conversation
  app.post("/api/messages/conversations/:userId", isAuthenticated, async (req, res) => {
    try {
      const senderId = (req.user as any).id;
      const receiverId = parseInt(req.params.userId);
      const { content } = req.body;
      
      if (!content || !content.trim()) {
        return res.status(400).json({ message: "Message content is required" });
      }
      
      // Validate the receiver exists
      const receiver = await storage.getUser(receiverId);
      if (!receiver) {
        return res.status(404).json({ message: "Recipient not found" });
      }
      
      // Create the message
      const newMessage = await storage.createMessage({
        senderId,
        receiverId,
        content,
        isRead: false,
        createdAt: new Date()
      });
      
      res.status(201).json(newMessage);
    } catch (error) {
      console.error("Error sending message:", error);
      res.status(500).json({ message: "Failed to send message" });
    }
  });
  
  // Start a new conversation
  app.post("/api/messages/conversations", isAuthenticated, async (req, res) => {
    try {
      const senderId = (req.user as any).id;
      const { recipientUsername, firstMessage } = req.body;
      
      if (!recipientUsername) {
        return res.status(400).json({ message: "Recipient username is required" });
      }
      
      if (!firstMessage || !firstMessage.trim()) {
        return res.status(400).json({ message: "Message content is required" });
      }
      
      // Find the recipient user
      const recipient = await storage.getUserByUsername(recipientUsername);
      if (!recipient) {
        return res.status(404).json({ message: "Recipient not found" });
      }
      
      // Don't allow messaging self
      if (recipient.id === senderId) {
        return res.status(400).json({ message: "Cannot message yourself" });
      }
      
      // Create the first message
      const newMessage = await storage.createMessage({
        senderId,
        receiverId: recipient.id,
        content: firstMessage,
        messageType: 'text',
        isRead: false,
        createdAt: new Date()
      });
      
      res.status(201).json({
        message: newMessage,
        recipientId: recipient.id,
        recipientUsername: recipient.username
      });
    } catch (error) {
      console.error("Error starting conversation:", error);
      res.status(500).json({ message: "Failed to start conversation" });
    }
  });
  
  // Unread message count endpoint is now handled in message-routes.ts

  app.get("/api/members/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = await storage.getUser(id);
      
      if (!user) {
        return res.status(404).json({ message: "Member not found" });
      }
      
      // Remove password before sending
      const { password, ...memberData } = user;
      res.json(memberData);
    } catch (error) {
      res.status(500).json({ message: "Failed to get member" });
    }
  });
  
  // Wallet routes
  app.post("/api/wallets", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      
      // Check if user already has a wallet
      const existingWallet = await storage.getWalletByUserId(userId);
      if (existingWallet) {
        return res.status(400).json({ message: "User already has a wallet" });
      }
      
      const validatedData = insertWalletSchema.parse({
        ...req.body,
        userId,
        // Set default wallet currency to GBP if not provided
        currency: req.body.currency || 'GBP',
        // Set default balance to 0 if not provided
        balance: req.body.balance || 0,
        // Set wallet to active by default
        isActive: req.body.isActive !== undefined ? req.body.isActive : true,
      });
      
      const wallet = await storage.createWallet(validatedData);
      res.status(201).json(wallet);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Failed to create wallet" });
    }
  });
  
  app.get("/api/wallets/me", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const wallet = await storage.getWalletByUserId(userId);
      
      if (!wallet) {
        return res.status(404).json({ message: "Wallet not found" });
      }
      
      res.json(wallet);
    } catch (error) {
      res.status(500).json({ message: "Failed to get wallet" });
    }
  });
  
  app.post("/api/transactions", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      
      // Get the user's wallet
      const wallet = await storage.getWalletByUserId(userId);
      if (!wallet) {
        return res.status(404).json({ message: "Wallet not found, please create a wallet first" });
      }
      
      // Check if sufficient funds for withdrawals and payments
      if ((req.body.type === 'withdrawal' || req.body.type === 'payment') && 
          wallet.balance < req.body.amount) {
        return res.status(400).json({ message: "Insufficient funds" });
      }
      
      const validatedData = insertTransactionSchema.parse({
        ...req.body,
        walletId: wallet.id,
      });
      
      const transaction = await storage.createTransaction(validatedData);
      
      // If this is a payment transaction with order metadata, create an order record
      if (req.body.type === 'payment' && req.body.metadata) {
        try {
          const metadata = typeof req.body.metadata === 'string' 
            ? JSON.parse(req.body.metadata) 
            : req.body.metadata;
            
          if (metadata.items && metadata.shipping) {
            // Create order from the payment
            const items = typeof metadata.items === 'string' 
              ? JSON.parse(metadata.items) 
              : metadata.items;
              
            const shipping = typeof metadata.shipping === 'string' 
              ? JSON.parse(metadata.shipping) 
              : metadata.shipping;
            
            // Create order record
            await storage.createOrder({
              userId,
              totalAmount: req.body.amount,
              status: 'processing',
              items: JSON.stringify(items),
              shippingAddress: shipping.address ? JSON.stringify(shipping.address) : null,
              shippingMethod: shipping.method ? shipping.method.toString() : null,
              shippingCost: shipping.cost || 0,
              paymentMethod: 'wallet',
              paymentId: transaction.id.toString(),
              notes: `Paid with e-wallet. Transaction ID: ${transaction.id}`,
              createdAt: new Date()
            });
            
            // Clear user's cart after successful order
            await storage.clearCart(userId);
          }
        } catch (parseError) {
          console.error("Error processing payment metadata:", parseError);
          // We don't fail the transaction if the order creation fails
          // The transaction is already done at this point
        }
      }
      
      res.status(201).json(transaction);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Failed to create transaction" });
    }
  });
  
  app.get("/api/transactions", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const transactions = await storage.listTransactionsByUser(userId);
      
      // Fetch related user information for transfer transactions
      const transactionsWithUserInfo = await Promise.all(
        transactions.map(async transaction => {
          if ((transaction.type === 'transfer_in' || transaction.type === 'transfer_out') && transaction.relatedUserId) {
            try {
              const relatedUser = await storage.getUser(transaction.relatedUserId);
              if (relatedUser) {
                // Remove sensitive data like password
                const { password, ...userData } = relatedUser;
                return {
                  ...transaction,
                  relatedUser: userData
                };
              }
            } catch (err) {
              console.error('Error fetching related user:', err);
            }
          }
          return transaction;
        })
      );
      
      res.json(transactionsWithUserInfo);
    } catch (error) {
      res.status(500).json({ message: "Failed to list transactions" });
    }
  });
  
  // Additional endpoint to get transactions for a specific user (needed for spending analytics)
  app.get("/api/transactions/user/:userId", isAuthenticated, async (req, res) => {
    try {
      const requestingUserId = (req.user as any).id;
      const targetUserId = parseInt(req.params.userId);
      
      // Users can only see their own transactions (security check)
      if (requestingUserId !== targetUserId) {
        return res.status(403).json({ message: "You can only view your own transactions" });
      }
      
      const transactions = await storage.listTransactionsByUser(targetUserId);
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ message: "Failed to list user transactions" });
    }
  });
  
  // New endpoints for categorized transactions
  app.get("/api/transactions/categories", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const wallet = await storage.getWalletByUserId(userId);
      
      if (!wallet) {
        return res.status(404).json({ message: "Wallet not found" });
      }
      
      const categorizedTransactions = await storage.getTransactionsByCategory(wallet.id);
      res.json(categorizedTransactions);
    } catch (error) {
      res.status(500).json({ message: "Failed to get categorized transactions" });
    }
  });
  
  app.get("/api/transactions/stats", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const wallet = await storage.getWalletByUserId(userId);
      
      if (!wallet) {
        return res.status(404).json({ message: "Wallet not found" });
      }
      
      const stats = await storage.getTransactionStats(wallet.id);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to get transaction statistics" });
    }
  });
  
  // Wallet transfers route
  app.post("/api/transfers", isAuthenticated, async (req, res) => {
    try {
      const senderId = (req.user as any).id;
      const { recipientUsername, amount, description } = req.body;
      
      if (!recipientUsername) {
        return res.status(400).json({ message: "Recipient username is required" });
      }
      
      if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
        return res.status(400).json({ message: "Amount must be a positive number" });
      }
      
      // Get sender's wallet
      const senderWallet = await storage.getWalletByUserId(senderId);
      if (!senderWallet) {
        return res.status(404).json({ message: "Sender's wallet not found" });
      }
      
      // Check if sender has enough funds
      if (senderWallet.balance < Number(amount)) {
        return res.status(400).json({ message: "Insufficient funds" });
      }
      
      // Get recipient by username
      const recipient = await storage.getUserByUsername(recipientUsername);
      if (!recipient) {
        return res.status(404).json({ message: "Recipient not found" });
      }
      
      // Get or create recipient's wallet
      let recipientWallet = await storage.getWalletByUserId(recipient.id);
      if (!recipientWallet) {
        // Create a wallet for the recipient if they don't have one
        recipientWallet = await storage.createWallet({
          userId: recipient.id,
          balance: 0,
          currency: "GBP", // Use GBP as default currency
          isActive: true
        });
      }
      
      // Create a transaction for the sender (transfer_out)
      const senderTransaction = await storage.createTransaction({
        type: "transfer_out",
        amount: Number(amount),
        walletId: senderWallet.id,
        description: description || `Transfer to ${recipientUsername}`,
        category: "transfer",
        paymentMethod: "wallet",
        status: "completed",
        relatedUserId: recipient.id  // Link to recipient's user ID
      });
      
      // Create a transaction for the recipient (transfer_in)
      const recipientTransaction = await storage.createTransaction({
        type: "transfer_in",
        amount: Number(amount),
        walletId: recipientWallet.id,
        description: description || `Transfer from ${(req.user as any).username}`,
        category: "transfer",
        paymentMethod: "wallet",
        status: "completed",
        relatedUserId: senderId  // Link to sender's user ID
      });
      
      // Update wallet balances
      await storage.updateWalletBalance(senderWallet.id, senderWallet.balance - Number(amount));
      await storage.updateWalletBalance(recipientWallet.id, recipientWallet.balance + Number(amount));
      
      res.status(201).json({ 
        success: true, 
        message: "Transfer completed successfully",
        transaction: senderTransaction
      });
    } catch (error) {
      console.error("Transfer error:", error);
      res.status(500).json({ message: "Failed to process transfer" });
    }
  });
  
  // Community management API routes
  // Communities routes
  app.post("/api/communities", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      
      const validatedData = insertCommunitySchema.parse({
        ...req.body,
        ownerId: userId,
      });
      
      const community = await storage.createCommunity(validatedData);
      res.status(201).json(community);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Failed to create community" });
    }
  });
  
  app.get("/api/communities", async (req, res) => {
    try {
      const options: any = {};
      
      // Extract query parameters
      if (req.query.ownerId) {
        options.ownerId = parseInt(req.query.ownerId as string);
      }
      
      if (req.query.visibility) {
        options.visibility = req.query.visibility;
      }
      
      if (req.query.topics) {
        options.topics = (req.query.topics as string).split(',');
      }
      
      if (req.query.isVerified !== undefined) {
        options.isVerified = req.query.isVerified === 'true';
      }
      
      if (req.query.limit) {
        options.limit = parseInt(req.query.limit as string);
      }
      
      if (req.query.offset) {
        options.offset = parseInt(req.query.offset as string);
      }
      
      const communities = await storage.listCommunities(options);
      res.json(communities);
    } catch (error) {
      res.status(500).json({ message: "Failed to list communities" });
    }
  });
  
  app.get("/api/communities/:id", async (req, res) => {
    try {
      const communityId = parseInt(req.params.id);
      const community = await storage.getCommunity(communityId);
      
      if (!community) {
        return res.status(404).json({ message: "Community not found" });
      }
      
      res.json(community);
    } catch (error) {
      res.status(500).json({ message: "Failed to get community" });
    }
  });
  
  app.put("/api/communities/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const communityId = parseInt(req.params.id);
      
      // Get the community
      const community = await storage.getCommunity(communityId);
      if (!community) {
        return res.status(404).json({ message: "Community not found" });
      }
      
      // Check if the user is the owner
      if (community.ownerId !== userId) {
        return res.status(403).json({ message: "Only the community owner can update it" });
      }
      
      const validatedData = insertCommunitySchema.partial().parse(req.body);
      const updatedCommunity = await storage.updateCommunity(communityId, validatedData);
      
      res.json(updatedCommunity);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Failed to update community" });
    }
  });
  
  // Community membership routes
  app.post("/api/communities/:id/members", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const communityId = parseInt(req.params.id);
      
      // Check if community exists
      const community = await storage.getCommunity(communityId);
      if (!community) {
        return res.status(404).json({ message: "Community not found" });
      }
      
      // Check if already a member
      const existingMembership = await storage.getMembershipStatus(communityId, userId);
      if (existingMembership) {
        return res.status(400).json({ message: "Already a member of this community" });
      }
      
      // Add as member
      const member = await storage.addCommunityMember({
        communityId,
        userId,
        role: "member"
      });
      
      res.status(201).json(member);
    } catch (error) {
      res.status(500).json({ message: "Failed to join community" });
    }
  });
  
  app.get("/api/communities/:id/members", async (req, res) => {
    try {
      const communityId = parseInt(req.params.id);
      const { role } = req.query;
      
      // Check if community exists
      const community = await storage.getCommunity(communityId);
      if (!community) {
        return res.status(404).json({ message: "Community not found" });
      }
      
      // Get members, optionally filtered by role
      const members = await storage.listCommunityMembers(
        communityId, 
        role ? (role as string) : undefined
      );
      
      // Enrich with user information
      const membersWithUserInfo = await Promise.all(
        members.map(async (member) => {
          const user = await storage.getUser(member.userId);
          if (user) {
            const { password, ...userData } = user;
            return {
              ...member,
              user: userData
            };
          }
          return member;
        })
      );
      
      res.json(membersWithUserInfo);
    } catch (error) {
      res.status(500).json({ message: "Failed to list community members" });
    }
  });
  
  app.delete("/api/communities/:communityId/members/:userId", isAuthenticated, async (req, res) => {
    try {
      const requestingUserId = (req.user as any).id;
      const communityId = parseInt(req.params.communityId);
      const targetUserId = parseInt(req.params.userId);
      
      // Check if community exists
      const community = await storage.getCommunity(communityId);
      if (!community) {
        return res.status(404).json({ message: "Community not found" });
      }
      
      // Check permissions: must be removing self or be the owner
      if (requestingUserId !== targetUserId && community.ownerId !== requestingUserId) {
        return res.status(403).json({ message: "You don't have permission to remove this member" });
      }
      
      // Remove member
      const result = await storage.removeCommunityMember(communityId, targetUserId);
      
      if (result) {
        res.status(200).json({ message: "Member removed successfully" });
      } else {
        res.status(404).json({ message: "Member not found" });
      }
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to remove member" });
    }
  });
  
  // Membership tiers routes
  app.post("/api/communities/:id/tiers", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const communityId = parseInt(req.params.id);
      
      // Check if community exists and user is the owner
      const community = await storage.getCommunity(communityId);
      if (!community) {
        return res.status(404).json({ message: "Community not found" });
      }
      
      if (community.ownerId !== userId) {
        return res.status(403).json({ message: "Only the community owner can create membership tiers" });
      }
      
      const validatedData = insertMembershipTierSchema.parse({
        ...req.body,
        communityId,
      });
      
      const tier = await storage.createMembershipTier(validatedData);
      res.status(201).json(tier);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Failed to create membership tier" });
    }
  });
  
  app.get("/api/communities/:id/tiers", async (req, res) => {
    try {
      const communityId = parseInt(req.params.id);
      
      // Check if community exists
      const community = await storage.getCommunity(communityId);
      if (!community) {
        return res.status(404).json({ message: "Community not found" });
      }
      
      const tiers = await storage.listMembershipTiers(communityId);
      res.json(tiers);
    } catch (error) {
      res.status(500).json({ message: "Failed to list membership tiers" });
    }
  });
  
  // Membership subscription routes
  app.post("/api/communities/:id/memberships", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const communityId = parseInt(req.params.id);
      const { tierId } = req.body;
      
      if (!tierId) {
        return res.status(400).json({ message: "Tier ID is required" });
      }
      
      // Check if community exists
      const community = await storage.getCommunity(communityId);
      if (!community) {
        return res.status(404).json({ message: "Community not found" });
      }
      
      // Check if tier exists and is active
      const tier = await storage.getMembershipTier(tierId);
      if (!tier) {
        return res.status(404).json({ message: "Membership tier not found" });
      }
      
      if (!tier.isActive) {
        return res.status(400).json({ message: "This membership tier is not currently available" });
      }
      
      // Check if tier belongs to this community
      if (tier.communityId !== communityId) {
        return res.status(400).json({ message: "This tier does not belong to the specified community" });
      }
      
      // Check if the tier has reached its member limit
      if (tier.maxMembers) {
        const currentMemberCount = await storage.getTierMemberCount(tierId);
        if (currentMemberCount >= tier.maxMembers) {
          return res.status(400).json({ message: "This tier has reached its member limit" });
        }
      }
      
      // Check if user already has an active subscription to this community
      const existingMembership = await storage.getUserCommunityMembership(userId, communityId);
      if (existingMembership && existingMembership.status === "active") {
        return res.status(400).json({ message: "You already have an active membership in this community" });
      }
      
      // For free tiers, create membership immediately
      if (tier.price <= 0) {
        // Calculate end date based on tier duration
        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + tier.durationDays);
        
        // Create the membership
        const membership = await storage.createMembership({
          userId,
          tierId,
          communityId,
          status: "active",
          paymentStatus: "paid", // Free tiers are automatically "paid"
          startDate,
          endDate,
          autoRenew: true
        });
        
        res.status(201).json({
          membership,
          tier,
          requiresPayment: false
        });
      } else {
        // For paid tiers, return tier information so the client can initiate payment
        res.status(200).json({
          tier,
          requiresPayment: true,
          paymentOptions: [
            {
              method: "stripe",
              endpoint: "/api/membership/payment/stripe/create-intent"
            },
            {
              method: "paypal",
              endpoint: "/api/membership/payment/paypal/create-order"
            }
          ]
        });
      }
    } catch (error) {
      console.error("Failed to create membership:", error);
      res.status(500).json({ message: "Failed to create membership" });
    }
  });
  
  app.get("/api/communities/:id/memberships/user", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const communityId = parseInt(req.params.id);
      
      // Check if community exists
      const community = await storage.getCommunity(communityId);
      if (!community) {
        return res.status(404).json({ message: "Community not found" });
      }
      
      // Get user's membership for this community
      const membership = await storage.getUserCommunityMembership(userId, communityId);
      if (!membership) {
        return res.status(404).json({ message: "You are not a member of this community" });
      }
      
      res.json(membership);
    } catch (error) {
      res.status(500).json({ message: "Failed to get membership information" });
    }
  });
  
  app.get("/api/users/me/memberships", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      
      // Get all user's memberships
      const memberships = await storage.getUserMemberships(userId);
      res.json(memberships);
    } catch (error) {
      res.status(500).json({ message: "Failed to get user memberships" });
    }
  });
  
  app.post("/api/memberships/:id/cancel", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const membershipId = parseInt(req.params.id);
      
      // Check if membership exists and belongs to the user
      const membership = await storage.getMembership(membershipId);
      if (!membership) {
        return res.status(404).json({ message: "Membership not found" });
      }
      
      if (membership.userId !== userId) {
        return res.status(403).json({ message: "You do not have permission to cancel this membership" });
      }
      
      // Cancel the membership
      const updatedMembership = await storage.cancelMembership(membershipId);
      res.json(updatedMembership);
    } catch (error) {
      res.status(500).json({ message: "Failed to cancel membership" });
    }
  });
  
  // Events routes
  app.post("/api/communities/:id/events", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const communityId = parseInt(req.params.id);
      
      // Check if community exists
      const community = await storage.getCommunity(communityId);
      if (!community) {
        return res.status(404).json({ message: "Community not found" });
      }
      
      // Check if the user is a member or the owner
      const isMember = await storage.getMembershipStatus(communityId, userId);
      if (!isMember && community.ownerId !== userId) {
        return res.status(403).json({ message: "Only community members can create events" });
      }
      
      const validatedData = insertEventSchema.parse({
        ...req.body,
        communityId,
        hostId: userId
      });
      
      const event = await storage.createEvent(validatedData);
      res.status(201).json(event);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Failed to create event" });
    }
  });
  
  app.get("/api/communities/:id/events", async (req, res) => {
    try {
      const communityId = parseInt(req.params.id);
      
      // Check if community exists
      const community = await storage.getCommunity(communityId);
      if (!community) {
        return res.status(404).json({ message: "Community not found" });
      }
      
      // Get events with optional filters
      const options: any = { communityId };
      
      if (req.query.eventType) {
        options.eventType = req.query.eventType;
      }
      
      if (req.query.startAfter) {
        options.startAfter = new Date(req.query.startAfter as string);
      }
      
      if (req.query.isPublished !== undefined) {
        options.isPublished = req.query.isPublished === 'true';
      }
      
      const events = await storage.listEvents(options);
      
      // Enrich with host information
      const eventsWithHostInfo = await Promise.all(
        events.map(async (event) => {
          const host = await storage.getUser(event.hostId);
          if (host) {
            const { password, ...hostData } = host;
            return {
              ...event,
              host: hostData
            };
          }
          return event;
        })
      );
      
      res.json(eventsWithHostInfo);
    } catch (error) {
      res.status(500).json({ message: "Failed to list events" });
    }
  });
  
  // Polls routes
  app.post("/api/communities/:id/polls", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const communityId = parseInt(req.params.id);
      
      // Check if community exists
      const community = await storage.getCommunity(communityId);
      if (!community) {
        return res.status(404).json({ message: "Community not found" });
      }
      
      // Check if the user is a member or owner
      const isMember = await storage.getMembershipStatus(communityId, userId);
      if (!isMember && community.ownerId !== userId) {
        return res.status(403).json({ message: "Only community members can create polls" });
      }
      
      const validatedData = insertPollSchema.parse({
        ...req.body,
        communityId,
        creatorId: userId
      });
      
      const poll = await storage.createPoll(validatedData);
      res.status(201).json(poll);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Failed to create poll" });
    }
  });
  
  app.get("/api/communities/:id/polls", async (req, res) => {
    try {
      const communityId = parseInt(req.params.id);
      
      // Check if community exists
      const community = await storage.getCommunity(communityId);
      if (!community) {
        return res.status(404).json({ message: "Community not found" });
      }
      
      // Get active status from query params
      const isActive = req.query.isActive !== undefined 
        ? req.query.isActive === 'true'
        : undefined;
      
      const polls = await storage.listPolls(communityId, isActive);
      
      // Enrich with creator info
      const enrichedPolls = await Promise.all(
        polls.map(async (poll) => {
          const creator = await storage.getUser(poll.creatorId);
          let creatorData = null;
          if (creator) {
            const { password, ...userData } = creator;
            creatorData = userData;
          }
          
          return {
            ...poll,
            creator: creatorData
          };
        })
      );
      
      res.json(enrichedPolls);
    } catch (error) {
      res.status(500).json({ message: "Failed to list polls" });
    }
  });
  
  app.post("/api/polls/:id/vote", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const pollId = parseInt(req.params.id);
      
      // Validate selected options
      if (!req.body.selectedOptions || !Array.isArray(req.body.selectedOptions)) {
        return res.status(400).json({ message: "selectedOptions must be an array" });
      }
      
      try {
        const vote = await storage.castVote({
          pollId,
          userId,
          selectedOptions: req.body.selectedOptions
        });
        
        res.status(201).json(vote);
      } catch (error) {
        return res.status(400).json({ message: error instanceof Error ? error.message : "Failed to cast vote" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to cast vote" });
    }
  });
  
  // Creator earnings routes
  app.get("/api/creator/earnings", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      
      const earnings = await storage.listCreatorEarnings(userId);
      res.json(earnings);
    } catch (error) {
      res.status(500).json({ message: "Failed to get creator earnings" });
    }
  });
  
  app.get("/api/creator/stats", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      
      const stats = await storage.getCreatorRevenueStats(userId);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to get creator stats" });
    }
  });

  // WebSocket functionality is now fully integrated in messaging-suite.ts

  // Community Content Routes
  
  // Get all content for a community (with filtering and pagination)
  app.get("/api/communities/:communityId/content", async (req, res) => {
    try {
      const communityId = parseInt(req.params.communityId);
      
      // Extract query parameters for filtering
      const { contentType, tierId, isFeatured, creatorId, limit, offset } = req.query;
      
      // Build options object with proper type conversion
      const options: any = {};
      if (contentType) options.contentType = contentType as string;
      if (tierId) options.tierId = parseInt(tierId as string);
      if (isFeatured) options.isFeatured = isFeatured === 'true';
      if (creatorId) options.creatorId = parseInt(creatorId as string);
      if (limit) options.limit = parseInt(limit as string);
      if (offset) options.offset = parseInt(offset as string);
      
      const contents = await storage.listCommunityContents(communityId, options);
      res.json(contents);
    } catch (error) {
      console.error("Error fetching community content:", error);
      res.status(500).json({ message: "Failed to fetch community content" });
    }
  });
  
  // Get accessible content for the authenticated user
  app.get("/api/communities/:communityId/accessible-content", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const communityId = parseInt(req.params.communityId);
      
      const accessibleContent = await storage.getUserAccessibleContent(userId, communityId);
      res.json(accessibleContent);
    } catch (error) {
      console.error("Error fetching accessible content:", error);
      res.status(500).json({ message: "Failed to fetch accessible content" });
    }
  });
  
  // Get a specific content item
  app.get("/api/community-content/:contentId", async (req, res) => {
    try {
      const contentId = parseInt(req.params.contentId);
      const content = await storage.getCommunityContent(contentId);
      
      if (!content) {
        return res.status(404).json({ message: "Content not found" });
      }
      
      // Increment view count if user is authenticated
      if (req.isAuthenticated()) {
        await storage.incrementContentView(contentId);
      }
      
      res.json(content);
    } catch (error) {
      console.error("Error fetching content item:", error);
      res.status(500).json({ message: "Failed to fetch content item" });
    }
  });
  
  // Create a new content item (requires authentication)
  app.post("/api/communities/:communityId/content", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const communityId = parseInt(req.params.communityId);
      
      // Check if user is a member with permission to create content
      const membership = await storage.getUserCommunityMembership(userId, communityId);
      if (!membership) {
        return res.status(403).json({ message: "You must be a member of this community to create content" });
      }
      
      // Validate the data using the insert schema
      const validatedData = insertCommunityContentSchema.parse({
        ...req.body,
        communityId,
        creatorId: userId,
      });
      
      const newContent = await storage.createCommunityContent(validatedData);
      res.status(201).json(newContent);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      console.error("Error creating content:", error);
      res.status(500).json({ message: "Failed to create content" });
    }
  });
  
  // Update a content item (creator only)
  app.patch("/api/community-content/:contentId", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const contentId = parseInt(req.params.contentId);
      
      // Get the content item
      const content = await storage.getCommunityContent(contentId);
      if (!content) {
        return res.status(404).json({ message: "Content not found" });
      }
      
      // Check if user is the creator
      if (content.creatorId !== userId) {
        return res.status(403).json({ message: "You can only edit your own content" });
      }
      
      // Update the content
      const updatedContent = await storage.updateCommunityContent(contentId, req.body);
      res.json(updatedContent);
    } catch (error) {
      console.error("Error updating content:", error);
      res.status(500).json({ message: "Failed to update content" });
    }
  });
  
  // Delete a content item (creator only)
  app.delete("/api/community-content/:contentId", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const contentId = parseInt(req.params.contentId);
      
      // Get the content item
      const content = await storage.getCommunityContent(contentId);
      if (!content) {
        return res.status(404).json({ message: "Content not found" });
      }
      
      // Check if user is the creator
      if (content.creatorId !== userId) {
        return res.status(403).json({ message: "You can only delete your own content" });
      }
      
      // Delete the content
      const success = await storage.deleteCommunityContent(contentId);
      if (success) {
        res.status(200).json({ message: "Content deleted successfully" });
      } else {
        res.status(500).json({ message: "Failed to delete content" });
      }
    } catch (error) {
      console.error("Error deleting content:", error);
      res.status(500).json({ message: "Failed to delete content" });
    }
  });

  return httpServer;
}
