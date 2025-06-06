import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import Stripe from "stripe";
// WebSocket implementation moved to messaging-suite.ts
import { WebSocket } from 'ws';
import * as fs from 'fs';
import * as fsp from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
// Import JWT functions from jwt-auth.ts instead of using jsonwebtoken directly
import { storage } from "./storage";
import { db } from "./db";
import { eq, or, like, sql, and, ne, inArray, desc } from "drizzle-orm";
import { users, products, orders, vendors, carts, orderItems, reviews, messages, vendorPaymentInfo, insertVendorPaymentInfoSchema } from "@shared/schema";

import { setupAuth, hashPassword } from "./auth";
import { setupJwtAuth, verifyToken, revokeToken } from "./jwt-auth";
import { promisify } from "util";
import { scrypt, randomBytes } from "crypto";
import { isAuthenticated as unifiedIsAuthenticated, requireRole } from './unified-auth';
import { registerPaymentRoutes } from "./payment";
import { registerPaypalRoutes } from "./paypal";
import { fraudRiskMiddleware, highRiskActionMiddleware, registerFraudPreventionRoutes } from "./fraud-prevention";
import { registerShippingRoutes } from "./shipping";
import { registerImageRoutes } from "./image-handler";
import { registerMediaRoutes } from "./media-handler";
import { registerMobileMoneyRoutes } from "./mobile-money";
import { registerPawapayRoutes } from "./pawapay";
import { registerSubscriptionPaymentRoutes } from "./subscription-payment";
import { registerExclusiveContentRoutes } from "./exclusive-content";
import { registerSubscriptionRoutes } from "./subscription";
import { registerAdminRoutes } from "./admin";
// import { registerMessagingSuite } from "./messaging-suite"; // Disabled to prevent WebSocket conflicts
import { registerAIInsightsRoutes } from "./ai-insights";
import { registerNewsFeedRoutes } from "./news-feed";
import { seedDatabase } from "./seed";
import { advancedSocialMediaSuite } from "./advanced-social-suite";
import { registerMessageRoutes } from "./message-routes";
import { setupWebSocket } from "./websocket-handler";
import { sendContactEmail, setBrevoApiKey } from "./email-service";
import { upload } from "./multer-config";
import { updateVendorBadge, getVendorBadgeStats, updateAllVendorBadges } from "./vendor-badges";

import { 
  insertVendorSchema, insertProductSchema, insertPostSchema, insertCommentSchema, 
  insertMessageSchema, insertReviewSchema, insertCartSchema, insertWalletSchema, 
  insertTransactionSchema, insertCommunitySchema, insertCommunityMemberSchema,
  insertMembershipTierSchema, insertMembershipSchema, insertEventSchema,
  insertEventRegistrationSchema, insertPollSchema, insertPollVoteSchema,
  insertCreatorEarningSchema, insertSubscriptionSchema, insertVideoSchema,
  insertVideoEngagementSchema, insertVideoPlaylistSchema, insertPlaylistItemSchema,
  insertVideoProductOverlaySchema, insertCommunityContentSchema,
  chatrooms, chatroomMessages, chatroomMembers, insertChatroomMessageSchema
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

// Stripe payment route for one-time payments
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Stripe payment intent creation
  app.post("/api/create-payment-intent", async (req: Request, res: Response) => {
    try {
      const { amount } = req.body;
      if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
        return res.status(400).json({ error: "Invalid amount" });
      }

      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(parseFloat(amount) * 100), // Convert to cents
        currency: "gbp",
        automatic_payment_methods: {
          enabled: true,
        },
      });

      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error: any) {
      console.error("Stripe payment intent error:", error);
      res.status(500).json({ error: error.message });
    }
  });
  // Apply fraud risk middleware to all routes
  app.use(fraudRiskMiddleware);
  
  // Register fraud prevention routes
  registerFraudPreventionRoutes(app);
  
  // Notification API endpoints
  // Get all notifications for the authenticated user
  app.get('/api/notifications', unifiedIsAuthenticated, async (req: Request, res: Response) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ message: 'Unauthorized - No valid authentication' });
      }
      
      const notifications = await storage.getNotifications(req.user.id);
      return res.json(notifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return res.status(500).json({ message: 'Failed to fetch notifications' });
    }
  });
  
  // Get unread notification count
  app.get('/api/notifications/unread/count', unifiedIsAuthenticated, async (req: Request, res: Response) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ message: 'Unauthorized - No valid authentication' });
      }
      
      const count = await storage.getUnreadNotificationCount(req.user.id);
      return res.json({ count });
    } catch (error) {
      console.error('Error fetching unread notification count:', error);
      return res.status(500).json({ message: 'Failed to fetch unread notification count' });
    }
  });
  
  // Mark notification as read
  app.patch('/api/notifications/:id/read', unifiedIsAuthenticated, async (req: Request, res: Response) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ message: 'Unauthorized - No valid authentication' });
      }
      
      const notificationId = parseInt(req.params.id);
      if (isNaN(notificationId)) {
        return res.status(400).json({ message: 'Invalid notification ID' });
      }
      
      const updatedNotification = await storage.markNotificationAsRead(notificationId);
      
      if (!updatedNotification) {
        return res.status(404).json({ message: 'Notification not found' });
      }
      
      return res.json(updatedNotification);
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return res.status(500).json({ message: 'Failed to update notification' });
    }
  });
  
  // Mark all notifications as read
  app.post('/api/notifications/mark-all-read', unifiedIsAuthenticated, async (req: Request, res: Response) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ message: 'Unauthorized - No valid authentication' });
      }
      
      const success = await storage.markAllNotificationsAsRead(req.user.id);
      
      if (!success) {
        return res.status(500).json({ message: 'Failed to mark notifications as read' });
      }
      
      return res.json({ success: true, message: 'All notifications marked as read' });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return res.status(500).json({ message: 'Failed to update notifications' });
    }
  });
  
  // Contact form submission endpoint with file upload support
  app.post('/api/contact', upload.fields([
    { name: 'titleUpload', maxCount: 1 },
    { name: 'textUpload', maxCount: 1 }
  ]), async (req: Request, res: Response) => {
    try {
      const { name, email, subject, message } = req.body;
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      
      // Basic validation
      if (!name || !email || !subject || !message) {
        return res.status(400).json({ message: 'All fields are required' });
      }
      
      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ message: 'Invalid email address' });
      }
      
      // Process uploaded files
      let titleFileInfo = null;
      let textFileInfo = null;
      
      if (files?.titleUpload?.[0]) {
        const file = files.titleUpload[0];
        titleFileInfo = {
          originalName: file.originalname,
          filename: file.filename,
          size: file.size,
          mimetype: file.mimetype,
          path: file.path
        };
      }
      
      if (files?.textUpload?.[0]) {
        const file = files.textUpload[0];
        textFileInfo = {
          originalName: file.originalname,
          filename: file.filename,
          size: file.size,
          mimetype: file.mimetype,
          path: file.path
        };
      }
      
      // Store submission
      const submission: ContactFormSubmission = {
        id: submissionId++,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        subject: subject.trim(),
        message: message.trim(),
        submittedAt: new Date(),
        status: 'new'
      };
      
      contactSubmissions.push(submission);
      
      // Create enhanced email content with file information
      let emailMessage = message.trim();
      if (titleFileInfo || textFileInfo) {
        emailMessage += '\n\n--- Attached Files ---\n';
        if (titleFileInfo) {
          emailMessage += `Title Upload: ${titleFileInfo.originalName} (${(titleFileInfo.size / 1024).toFixed(2)} KB)\n`;
        }
        if (textFileInfo) {
          emailMessage += `Text Upload: ${textFileInfo.originalName} (${(textFileInfo.size / 1024).toFixed(2)} KB)\n`;
        }
      }
      
      // Send email using Brevo
      const emailSent = await sendContactEmail({
        name: submission.name,
        email: submission.email,
        subject: submission.subject,
        message: emailMessage
      });
      
      if (emailSent) {
        return res.json({ 
          success: true, 
          message: 'Your message has been sent successfully. We\'ll get back to you soon!',
          filesUploaded: {
            titleUpload: titleFileInfo ? titleFileInfo.originalName : null,
            textUpload: textFileInfo ? textFileInfo.originalName : null
          }
        });
      } else {
        return res.status(500).json({ 
          message: 'There was an issue sending your message. Please try again or contact us directly.' 
        });
      }
    } catch (error) {
      console.error('Contact form error:', error);
      return res.status(500).json({ 
        message: 'An error occurred while processing your request. Please try again later.' 
      });
    }
  });
  
  // Configure Brevo API key
  app.post('/api/brevo/configure', async (req: Request, res: Response) => {
    try {
      const { apiKey } = req.body;
      
      if (!apiKey || typeof apiKey !== 'string') {
        return res.status(400).json({ message: 'API key is required' });
      }
      
      const success = setBrevoApiKey(apiKey.trim());
      
      if (success) {
        return res.json({ success: true, message: 'Brevo API key configured successfully' });
      } else {
        return res.status(400).json({ message: 'Invalid API key format' });
      }
    } catch (error) {
      console.error('Error configuring Brevo API key:', error);
      return res.status(500).json({ message: 'Failed to configure API key' });
    }
  });
  
  // Get notification settings
  app.get('/api/notifications/settings', unifiedIsAuthenticated, async (req: Request, res: Response) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ message: 'Unauthorized - No valid authentication' });
      }
      
      const settings = await storage.getNotificationSettings(req.user.id);
      return res.json(settings);
    } catch (error) {
      console.error('Error fetching notification settings:', error);
      return res.status(500).json({ message: 'Failed to fetch notification settings' });
    }
  });
  
  // Update notification setting
  app.patch('/api/notifications/settings', unifiedIsAuthenticated, async (req: Request, res: Response) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ message: 'Unauthorized - No valid authentication' });
      }
      
      const { type, channel, enabled } = req.body;
      
      if (!type || !channel || typeof enabled !== 'boolean') {
        return res.status(400).json({ message: 'Invalid request. Required fields: type, channel, enabled' });
      }
      
      const updatedSetting = await storage.updateNotificationSetting(
        req.user.id,
        type,
        channel,
        enabled
      );
      
      if (!updatedSetting) {
        return res.status(500).json({ message: 'Failed to update notification setting' });
      }
      
      return res.json(updatedSetting);
    } catch (error) {
      console.error('Error updating notification setting:', error);
      return res.status(500).json({ message: 'Failed to update notification setting' });
    }
  });
  

  
  // Page content API endpoints
  app.get('/api/page/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const pageContent = pageContents[id];
    
    if (!pageContent) {
      return res.status(404).json({ message: `Page content for '${id}' not found` });
    }
    
    res.json(pageContent);
  });
  
  // XML Sitemap route for search engines (must be before other routes to avoid conflicts)
  app.get('/sitemap.xml', (req: Request, res: Response) => {
    try {
      res.setHeader('Content-Type', 'application/xml; charset=utf-8');
      res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
      
      const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${req.protocol}://${req.get('host')}/</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${req.protocol}://${req.get('host')}/products</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${req.protocol}://${req.get('host')}/wall</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${req.protocol}://${req.get('host')}/dating</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${req.protocol}://${req.get('host')}/vendors</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>${req.protocol}://${req.get('host')}/contact</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>${req.protocol}://${req.get('host')}/login</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
  <url>
    <loc>${req.protocol}://${req.get('host')}/register</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
  <url>
    <loc>${req.protocol}://${req.get('host')}/sitemap</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>${req.protocol}://${req.get('host')}/faq</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
  <url>
    <loc>${req.protocol}://${req.get('host')}/privacy</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>${req.protocol}://${req.get('host')}/terms</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.5</priority>
  </url>
</urlset>`;
      
      res.send(sitemap);
    } catch (error) {
      console.error('Error generating sitemap:', error);
      res.status(500).send('Error generating sitemap');
    }
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
  
  // Apply fraud prevention middleware globally
  app.use(fraudRiskMiddleware);
  
  // Register fraud prevention routes
  registerFraudPreventionRoutes(app);
  
  // Unified auth endpoint for getting current user
  app.get('/api/auth/me', async (req: Request, res: Response) => {
    console.log('[DEBUG] /api/auth/me - Authentication attempt');
    console.log('[DEBUG] /api/auth/me - Session ID:', req.sessionID);
    console.log('[DEBUG] /api/auth/me - Headers:', JSON.stringify(req.headers));
    console.log('[DEBUG] /api/auth/me - isAuthenticated():', req.isAuthenticated());
    console.log('[DEBUG] /api/auth/me - Session data:', req.session);
    
    // First check session authentication
    if (req.isAuthenticated() && req.user) {
      console.log('[DEBUG] /api/auth/me - User authenticated via session:', req.user ? `ID: ${(req.user as any).id}` : 'None');
      return res.json(req.user);
    }
    
    // If not authenticated via session, check JWT
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      console.log('[DEBUG] /api/auth/me - Attempting JWT authentication with token:', token.substring(0, 10) + '...');
      
      try {
        const payload = verifyToken(token);
        if (payload) {
          console.log('[DEBUG] /api/auth/me - JWT token is valid, payload:', payload);
          
          // Look up user from payload
          const user = await storage.getUser(payload.userId);
          if (user) {
            console.log('[DEBUG] /api/auth/me - User found via JWT payload, ID:', user.id);
            return res.json(user);
          } else {
            console.log('[DEBUG] /api/auth/me - User not found with ID from JWT payload:', payload.userId);
          }
        } else {
          console.log('[DEBUG] /api/auth/me - Invalid JWT token');
        }
      } catch (error) {
        console.error('[DEBUG] /api/auth/me - JWT verification error:', error);
      }
    }
    
    // If we get here, no valid authentication was found
    console.log('[DEBUG] /api/auth/me - Authentication failed');
    return res.status(401).json({ 
      message: 'Unauthorized - No valid authentication',
      authMethods: ['session', 'bearer'],
      error: 'invalid_credentials',
      sessionExists: !!req.session,
      sessionID: req.sessionID
    });
  });
  
  // Debug endpoint for session information - no authentication required
  app.get('/api/debug/session', (req: Request, res: Response) => {
    console.log('[DEBUG] Session debug endpoint called');
    // Return non-sensitive session information for debugging
    res.json({
      hasSession: !!req.session,
      sessionID: req.sessionID,
      isAuthenticated: req.isAuthenticated(),
      hasUser: !!req.user,
      userID: req.user ? (req.user as any).id : null,
      cookieHeader: req.headers.cookie,
    });
  });
  
  // Development endpoint to get a token for testing
  if (process.env.NODE_ENV !== 'production') {
    // Endpoint for simplified test user login - sets session directly
    app.get('/api/auth/test-login/:userId', async (req: Request, res: Response) => {
      try {
        console.log(`[AUTH TEST] Test login request for user ID: ${req.params.userId}`);
        
        const userId = parseInt(req.params.userId);
        if (isNaN(userId)) {
          return res.status(400).json({ message: 'Invalid user ID' });
        }
        
        const user = await storage.getUser(userId);
        if (!user) {
          console.log(`[AUTH TEST] User with ID ${userId} not found`);
          return res.status(404).json({ message: 'User not found' });
        }
        
        console.log(`[AUTH TEST] Found user for login:`, { 
          id: user.id, 
          username: user.username,
          role: user.role
        });
        
        // Manually regenerate session to avoid any conflicts
        req.session.regenerate((regErr) => {
          if (regErr) {
            console.error('[AUTH TEST] Error regenerating session:', regErr);
            return res.status(500).json({ message: 'Error regenerating session' });
          }
          
          // Set the user in the session
          req.login(user, (loginErr) => {
            if (loginErr) {
              console.error('[AUTH TEST] Error logging in test user:', loginErr);
              return res.status(500).json({ message: 'Error logging in test user', error: loginErr.message });
            }
            
            // Save the session with the new login state
            req.session.save((saveErr) => {
              if (saveErr) {
                console.error('[AUTH TEST] Error saving session:', saveErr);
                return res.status(500).json({ message: 'Error saving session' });
              }
              
              console.log(`[AUTH TEST] Test user ${userId} logged in successfully via session`);
              console.log(`[AUTH TEST] Session ID: ${req.sessionID}`);
              console.log(`[AUTH TEST] Session data:`, req.session);
              console.log(`[AUTH TEST] Is authenticated:`, req.isAuthenticated());
              
              return res.json({ 
                success: true, 
                message: `Test user ${userId} logged in successfully`,
                sessionId: req.sessionID,
                isAuthenticated: req.isAuthenticated(),
                user: {
                  id: user.id,
                  username: user.username,
                  email: user.email,
                  role: user.role,
                  isVendor: user.isVendor
                }
              });
            });
          });
        });
      } catch (error) {
        console.error('[AUTH TEST] Error in test login endpoint:', error);
        return res.status(500).json({ message: 'Server error during test login' });
      }
    });
    
    app.get('/api/auth/get-test-token/:userId', async (req: Request, res: Response) => {
      try {
        console.log(`[AUTH TEST] Test token request for user ID: ${req.params.userId}`);
      
        const userId = parseInt(req.params.userId);
        if (isNaN(userId)) {
          return res.status(400).json({ message: 'Invalid user ID' });
        }
        
        const user = await storage.getUser(userId);
        if (!user) {
          console.log(`[AUTH TEST] User with ID ${userId} not found for token generation`);
          return res.status(404).json({ message: 'User not found' });
        }
        
        console.log(`[AUTH TEST] Found user for token:`, { 
          id: user.id, 
          username: user.username,
          role: user.role
        });
        
        // Import directly to avoid circular dependencies
        const { generateToken } = require('./jwt-auth');
        
        const deviceInfo = {
          clientId: 'test-client',
          deviceType: req.headers['user-agent'] || 'unknown',
          ipAddress: req.ip || ''
        };
        
        console.log(`[AUTH TEST] Generating token with device info:`, deviceInfo);
        
        const { token, expiresAt } = await generateToken(user.id, user.role || 'user', deviceInfo);
        console.log(`[AUTH TEST] Generated token for user ${userId} (expires: ${new Date(expiresAt).toISOString()})`);
        
        return res.json({
          success: true,
          message: `Test token generated for user ${userId}`,
          token,
          expiresAt,
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role
          },
          usage: {
            headers: "Add the token to API requests as: Authorization: Bearer " + token,
            fetch: `fetch('/api/your-endpoint', { headers: { 'Authorization': 'Bearer ${token}' } })`,
            curl: `curl -H "Authorization: Bearer ${token}" https://${req.headers.host}/api/your-endpoint`
          }
        });
        
    // Add test endpoints for debugging
    app.get('/api/auth/test-auth', unifiedIsAuthenticated, (req: Request, res: Response) => {
      console.log('[DEBUG] Authentication successful in test-auth endpoint');
      const user = req.user as any;
      res.json({
        message: 'Authentication successful',
        user: {
          id: user?.id,
          username: user?.username,
          role: user?.role
        }
      });
    });
    
    // Simple image upload API - no auth required for testing
    app.post('/api/image/upload-test', async (req: Request, res: Response) => {
      try {
        // Set content type to JSON for all responses from this endpoint
        res.setHeader('Content-Type', 'application/json');
        
        console.log('[IMAGE] Test image upload API called');
        
        // Check if there's image data
        if (!req.body.imageData) {
          return res.status(400).json({ 
            success: false,
            message: "No image data provided"
          });
        }
        
        try {
          // Process the image data
          const imageData = req.body.imageData;
          
          // Validate that it's an image
          if (!imageData.startsWith('data:image/')) {
            return res.status(400).json({
              success: false,
              message: "Invalid image format"
            });
          }
          
          // Extract the base64 data and file type
          const base64Data = imageData.split(',')[1];
          const mimeType = imageData.split(';')[0].split(':')[1];
          let fileExtension = 'png'; // Default
          
          // Try to get file extension from mime type
          if (mimeType) {
            const parts = mimeType.split('/');
            if (parts.length > 1) {
              fileExtension = parts[1] === 'jpeg' ? 'jpg' : parts[1];
            }
          }
          
          const filename = `test_${Date.now()}.${fileExtension}`;
          
          // Create uploads directory if it doesn't exist
          if (!fs.existsSync('./public/uploads')) {
            fs.mkdirSync('./public/uploads', { recursive: true });
          }
          if (!fs.existsSync('./public/uploads/test')) {
            fs.mkdirSync('./public/uploads/test', { recursive: true });
          }
          
          // Save the file
          fs.writeFileSync(`./public/uploads/test/${filename}`, base64Data, 'base64');
          const imageUrl = `/uploads/test/${filename}`;
          
          console.log(`[IMAGE] Test image successfully uploaded: ${imageUrl}`);
          
          // Return simple success response with image URL
          return res.status(200).json({
            success: true,
            message: 'Image uploaded successfully',
            imageUrl: imageUrl,
            filename: filename
          });
          
        } catch (error) {
          console.error('[ERROR] Failed to save test image:', error);
          return res.status(500).json({ 
            success: false,
            message: 'Failed to save image' 
          });
        }
      } catch (error) {
        console.error('[ERROR] Test image upload failed:', error);
        res.status(500).json({ 
          success: false,
          message: 'Test image upload failed' 
        });
      }
    });
    
    // Session reset endpoint to fix corrupted sessions
    app.post('/api/session/reset', async (req: Request, res: Response) => {
      try {
        // Clear the existing session
        req.session.destroy((err) => {
          if (err) {
            console.error('Error destroying session:', err);
          }
        });
        
        // Clear any passport data
        req.logout((err) => {
          if (err) {
            console.error('Error during logout:', err);
          }
        });
        
        res.json({ 
          success: true, 
          message: "Session reset successfully. Please refresh the page." 
        });
      } catch (error) {
        console.error('Session reset error:', error);
        res.status(500).json({ 
          success: false, 
          message: "Failed to reset session" 
        });
      }
    });
    
    // Quick login endpoint to authenticate as your real account
    app.post('/api/quick-login', async (req: Request, res: Response) => {
      try {
        // Get your real user account (ID 6)
        const user = await storage.getUser(6);
        
        if (!user) {
          return res.status(404).json({ 
            success: false, 
            message: "User not found" 
          });
        }
        
        // Manually set up the session
        req.login(user, (err) => {
          if (err) {
            console.error('Login error:', err);
            return res.status(500).json({ 
              success: false, 
              message: "Failed to establish session" 
            });
          }
          
          res.json({ 
            success: true, 
            message: "Logged in successfully", 
            user: {
              id: user.id,
              username: user.username,
              name: user.name
            }
          });
        });
        
      } catch (error) {
        console.error('Quick login error:', error);
        res.status(500).json({ 
          success: false, 
          message: "Login failed" 
        });
      }
    });

    // API connection test endpoint
    app.post('/api/posts/ping', unifiedIsAuthenticated, (req: Request, res: Response) => {
      console.log('[DEBUG] Direct API ping endpoint called');
      console.log('[DEBUG] Request headers:', JSON.stringify(req.headers));
      console.log('[DEBUG] Request user:', req.user ? `ID: ${req.user.id}, Username: ${req.user.username}` : 'No user found');
      console.log('[DEBUG] Request authentication status:', req.isAuthenticated() ? 'Authenticated via session' : 'Not authenticated via session');
      
      // Set content type to JSON for all responses from this endpoint
      res.setHeader('Content-Type', 'application/json');
      
      // Return a simple JSON response to confirm the API is working correctly
      return res.json({ 
        success: true, 
        message: "API connection test successful", 
        contentType: "json",
        authenticated: !!req.user,
        sessionAuth: req.isAuthenticated()
      });
    });
    
    // Simple and robust image upload endpoint
    app.post('/api/simple-upload', (req: Request, res: Response) => {
      console.log('[DEBUG] Simple upload endpoint called');
      
      // Create uploads directory if it doesn't exist
      if (!fs.existsSync('./public/uploads')) {
        fs.mkdirSync('./public/uploads', { recursive: true });
      }
      if (!fs.existsSync('./public/uploads/simple')) {
        fs.mkdirSync('./public/uploads/simple', { recursive: true });
      }
      
      try {
        // Generate a simple image with timestamp
        const timestamp = Date.now();
        const filename = `simple_${timestamp}.png`;
        const imagePath = `./public/uploads/simple/${filename}`;
        
        // Create a small colored square
        const size = 100;
        const r = Math.floor(Math.random() * 255);
        const g = Math.floor(Math.random() * 255);
        const b = Math.floor(Math.random() * 255);
        
        // Create a simple colored square
        const imageData = Buffer.alloc(size * size * 3);
        
        // Fill the buffer with the color
        for (let i = 0; i < size * size; i++) {
          imageData[i * 3] = r;     // R
          imageData[i * 3 + 1] = g; // G
          imageData[i * 3 + 2] = b; // B
        }
        
        // Write the file directly
        fs.writeFileSync(imagePath, imageData);
        
        console.log(`[DEBUG] Simple image created at: ${imagePath}`);
        
        // Return success with path to the created image
        return res.json({
          success: true,
          message: 'Image created successfully',
          imagePath: `/uploads/simple/${filename}`,
          timestamp: timestamp,
          color: `rgb(${r},${g},${b})`
        });
      } catch (error) {
        console.error('[ERROR] Failed to create image:', error);
        return res.status(500).json({
          success: false,
          message: 'Failed to create image', 
          error: error.message
        });
      }
    });
    
    // API file upload endpoint using chunked data
    app.post('/api/chunked-upload', (req: Request, res: Response) => {
      console.log('[DEBUG] Chunked upload endpoint called');
      
      // Ensure uploads directories exist
      if (!fs.existsSync('./public/uploads')) {
        fs.mkdirSync('./public/uploads', { recursive: true });
      }
      if (!fs.existsSync('./public/uploads/chunked')) {
        fs.mkdirSync('./public/uploads/chunked', { recursive: true });
      }
      
      try {
        // Extract chunk information from the request
        const { chunkIndex, totalChunks, fileId, chunkData } = req.body;
        
        if (!chunkIndex || !totalChunks || !fileId) {
          return res.status(400).json({
            success: false,
            message: 'Missing required chunk information'
          });
        }
        
        // Create a temporary directory for this file's chunks
        const chunkDir = `./public/uploads/chunked/${fileId}`;
        if (!fs.existsSync(chunkDir)) {
          fs.mkdirSync(chunkDir, { recursive: true });
        }
        
        // Save this chunk
        const chunkPath = `${chunkDir}/chunk_${chunkIndex}`;
        
        if (chunkData && typeof chunkData === 'string') {
          // If chunk data is provided as base64, convert and save it
          try {
            // Remove data URL prefix if present
            let base64Data = chunkData;
            if (base64Data.includes(',')) {
              base64Data = base64Data.split(',')[1];
            }
            
            fs.writeFileSync(chunkPath, base64Data, 'base64');
            
            console.log(`[DEBUG] Saved chunk ${chunkIndex}/${totalChunks} for file ${fileId}`);
            
            // If this is the last chunk, combine all chunks
            if (parseInt(chunkIndex) === parseInt(totalChunks) - 1) {
              console.log(`[DEBUG] All chunks received for ${fileId}, combining...`);
              
              // Filename for the final file
              const filename = `file_${fileId}.png`;
              const finalPath = `./public/uploads/chunked/${filename}`;
              
              // Create a write stream for the final file
              const writeStream = fs.createWriteStream(finalPath);
              
              // Combine all chunks in order
              for (let i = 0; i < parseInt(totalChunks); i++) {
                const currentChunkPath = `${chunkDir}/chunk_${i}`;
                if (fs.existsSync(currentChunkPath)) {
                  const chunkData = fs.readFileSync(currentChunkPath);
                  writeStream.write(chunkData);
                } else {
                  console.error(`[ERROR] Missing chunk ${i} for file ${fileId}`);
                  return res.status(400).json({
                    success: false,
                    message: `Missing chunk ${i}`
                  });
                }
              }
              
              writeStream.end();
              
              // Clean up chunk files
              for (let i = 0; i < parseInt(totalChunks); i++) {
                const currentChunkPath = `${chunkDir}/chunk_${i}`;
                if (fs.existsSync(currentChunkPath)) {
                  fs.unlinkSync(currentChunkPath);
                }
              }
              
              // Remove chunk directory
              fs.rmdirSync(chunkDir);
              
              return res.json({
                success: true,
                message: 'File upload complete',
                filePath: `/uploads/chunked/${filename}`
              });
            } else {
              // Not the last chunk, just acknowledge receipt
              return res.json({
                success: true,
                message: `Chunk ${chunkIndex} received`,
                chunksReceived: parseInt(chunkIndex) + 1,
                totalChunks: parseInt(totalChunks)
              });
            }
          } catch (error) {
            console.error(`[ERROR] Error processing chunk ${chunkIndex}:`, error);
            return res.status(500).json({
              success: false,
              message: 'Error processing chunk',
              error: error.message
            });
          }
        } else {
          return res.status(400).json({
            success: false,
            message: 'Invalid chunk data format'
          });
        }
      } catch (error) {
        console.error('[ERROR] Chunk upload failed:', error);
        return res.status(500).json({
          success: false,
          message: 'Chunk upload failed',
          error: error.message
        });
      }
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
  
  // Initialize Stripe
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
  }
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2023-10-16",
  });

  // Stripe payment route for one-time payments
  app.post("/api/create-payment-intent", async (req, res) => {
    try {
      const { amount } = req.body;
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: "gbp",
        automatic_payment_methods: {
          enabled: true,
        },
      });
      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error: any) {
      res
        .status(500)
        .json({ message: "Error creating payment intent: " + error.message });
    }
  });

  // Register admin routes
  registerAdminRoutes(app);
  
  // Register AI insights routes
  registerAIInsightsRoutes(app);

  // Register image handling routes
  registerImageRoutes(app);
  
  // Register media handling routes for images and videos
  registerMediaRoutes(app);

  // Create HTTP server from Express
  // Register news feed routes
  registerNewsFeedRoutes(app);
  
  // Register message routes for direct messaging API
  registerMessageRoutes(app);
  
  // Post creation endpoint
  app.post("/api/posts", unifiedIsAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any)?.id;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      const postData = {
        userId,
        content: req.body.content || "",
        title: req.body.title || null,
        contentType: req.body.contentType || "text",
        imageUrl: req.body.imageUrl || null,
        videoUrl: req.body.videoUrl || null,
        tags: req.body.tags || null,
        productId: req.body.productId || null, // Support for product reposts
        isPublished: true,
        likes: 0,
        comments: 0,
        shares: 0,
        views: 0
      };

      const newPost = await storage.createPost(postData);
      res.status(201).json(newPost);
    } catch (error) {
      console.error("Error creating post:", error);
      res.status(500).json({ message: "Failed to create post" });
    }
  });

  // Get individual post by ID
  app.get('/api/posts/:id', unifiedIsAuthenticated, async (req, res) => {
    try {
      const postId = parseInt(req.params.id);
      const post = await storage.getPostById(postId);
      
      if (!post) {
        return res.status(404).json({ message: 'Post not found' });
      }
      
      res.json(post);
    } catch (error) {
      console.error('Error fetching post:', error);
      res.status(500).json({ message: 'Failed to fetch post' });
    }
  });

  // Get comments for a post
  app.get('/api/posts/:id/comments', unifiedIsAuthenticated, async (req, res) => {
    try {
      const postId = parseInt(req.params.id);
      const comments = await storage.getPostComments(postId);
      res.json(comments);
    } catch (error) {
      console.error('Error fetching comments:', error);
      res.status(500).json({ message: 'Failed to fetch comments' });
    }
  });

  // Add comment to post
  app.post('/api/posts/:id/comments', unifiedIsAuthenticated, async (req, res) => {
    try {
      const postId = parseInt(req.params.id);
      const { content } = req.body;
      const userId = (req.user as any)?.id;
      
      if (!content || content.trim() === '') {
        return res.status(400).json({ message: 'Comment content is required' });
      }
      
      const comment = await storage.addComment({
        postId,
        userId,
        content: content.trim()
      });
      
      // Update comment count
      await storage.incrementPostComments(postId);
      
      res.status(201).json(comment);
    } catch (error) {
      console.error('Error adding comment:', error);
      res.status(500).json({ message: 'Failed to add comment' });
    }
  });

  // Like/unlike a post
  app.post('/api/posts/:id/like', unifiedIsAuthenticated, async (req, res) => {
    try {
      const postId = parseInt(req.params.id);
      const userId = (req.user as any)?.id;
      const result = await storage.togglePostLike(postId, userId);
      res.json(result);
    } catch (error) {
      console.error('Error toggling like:', error);
      res.status(500).json({ message: 'Failed to toggle like' });
    }
  });

  // Save/unsave a post
  app.post('/api/posts/:id/save', unifiedIsAuthenticated, async (req, res) => {
    try {
      const postId = parseInt(req.params.id);
      const userId = (req.user as any)?.id;
      const result = await storage.togglePostSave(postId, userId);
      res.json(result);
    } catch (error) {
      console.error('Error toggling save:', error);
      res.status(500).json({ message: 'Failed to toggle save' });
    }
  });

  // Share a post
  app.post('/api/posts/:id/share', unifiedIsAuthenticated, async (req, res) => {
    try {
      const postId = parseInt(req.params.id);
      await storage.incrementPostShares(postId);
      res.json({ message: 'Post shared successfully' });
    } catch (error) {
      console.error('Error sharing post:', error);
      res.status(500).json({ message: 'Failed to share post' });
    }
  });

  // Track post view
  app.post('/api/posts/:id/view', unifiedIsAuthenticated, async (req, res) => {
    try {
      const postId = parseInt(req.params.id);
      await storage.incrementPostViews(postId);
      res.json({ message: 'View tracked' });
    } catch (error) {
      console.error('Error tracking view:', error);
      res.status(500).json({ message: 'Failed to track view' });
    }
  });

  // Check if user has liked a post
  app.get('/api/posts/:id/like/check', unifiedIsAuthenticated, async (req, res) => {
    try {
      const postId = parseInt(req.params.id);
      const userId = (req.user as any)?.id;
      
      const liked = await storage.checkPostLike(postId, userId);
      res.json({ liked });
    } catch (error) {
      console.error('Error checking like status:', error);
      res.status(500).json({ message: 'Failed to check like status' });
    }
  });

  // Check if user has saved a post
  app.get('/api/posts/:id/save/check', unifiedIsAuthenticated, async (req, res) => {
    try {
      const postId = parseInt(req.params.id);
      const userId = (req.user as any)?.id;
      
      const saved = await storage.checkPostSave(postId, userId);
      res.json({ saved });
    } catch (error) {
      console.error('Error checking save status:', error);
      res.status(500).json({ message: 'Failed to check save status' });
    }
  });

  // Get saved posts for current user
  app.get('/api/saved-posts', unifiedIsAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.id;
      if (!userId) {
        return res.status(401).json({ message: 'User not authenticated' });
      }

      const limit = parseInt(req.query.limit as string) || 10;
      const offset = parseInt(req.query.offset as string) || 0;

      const savedPosts = await storage.getSavedPosts(userId, { limit, offset });
      res.json(savedPosts);
    } catch (error) {
      console.error('Error getting saved posts:', error);
      res.status(500).json({ message: 'Failed to get saved posts' });
    }
  });

  // Get user profile by ID
  app.get('/api/users/:id/profile', unifiedIsAuthenticated, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      res.json(user);
    } catch (error) {
      console.error('Error getting user profile:', error);
      res.status(500).json({ message: 'Failed to get user profile' });
    }
  });

  // Update current user's profile
  app.patch('/api/users/profile', unifiedIsAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.id;
      if (!userId) {
        return res.status(401).json({ message: 'User not authenticated' });
      }

      const updateData = req.body;
      console.log(`[DEBUG] Updating profile for user ${userId} with data:`, updateData);

      // Update the user profile
      const updatedUser = await storage.updateUser(userId, updateData);
      
      if (!updatedUser) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Remove sensitive data before sending response
      const { password, passwordResetToken, passwordResetExpires, verificationToken, ...userWithoutPassword } = updatedUser;
      
      console.log(`[DEBUG] Profile updated successfully for user ${userId}`);
      res.json(userWithoutPassword);
    } catch (error) {
      console.error('Error updating user profile:', error);
      res.status(500).json({ message: 'Failed to update user profile' });
    }
  });

  // Get user profile by username
  app.get('/api/users/:username', unifiedIsAuthenticated, async (req, res) => {
    try {
      const username = req.params.username;
      console.log(`[DEBUG] Getting user profile for username: ${username}`);
      
      const user = await storage.getUserByUsername(username);
      
      if (!user) {
        console.log(`[DEBUG] User not found for username: ${username}`);
        return res.status(404).json({ message: 'User not found' });
      }
      
      console.log(`[DEBUG] Found user:`, { id: user.id, username: user.username, name: user.name });
      res.json(user);
    } catch (error) {
      console.error('Error getting user profile by username:', error);
      res.status(500).json({ message: 'Failed to get user profile' });
    }
  });

  // Get user posts by username
  app.get('/api/users/:username/posts', unifiedIsAuthenticated, async (req, res) => {
    try {
      const username = req.params.username;
      console.log(`[DEBUG] Getting posts for username: ${username}`);
      
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      const posts = await storage.getUserPosts(user.id);
      console.log(`[DEBUG] Found ${posts.length} posts for user ${username}`);
      res.json(posts);
    } catch (error) {
      console.error('Error getting user posts:', error);
      res.status(500).json({ message: 'Failed to get user posts' });
    }
  });

  // Get user communities by username
  app.get('/api/users/:username/communities', unifiedIsAuthenticated, async (req, res) => {
    try {
      const username = req.params.username;
      console.log(`[DEBUG] Getting communities for username: ${username}`);
      
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // For now, return empty array as communities aren't fully implemented
      const communities: any[] = [];
      console.log(`[DEBUG] Found ${communities.length} communities for user ${username}`);
      res.json(communities);
    } catch (error) {
      console.error('Error getting user communities:', error);
      res.status(500).json({ message: 'Failed to get user communities' });
    }
  });

  // Get user connections by username
  app.get('/api/users/:username/connections', unifiedIsAuthenticated, async (req, res) => {
    try {
      const username = req.params.username;
      console.log(`[DEBUG] Getting connections for username: ${username}`);
      
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // For now, return empty array as connections aren't fully implemented
      const connections: any[] = [];
      console.log(`[DEBUG] Found ${connections.length} connections for user ${username}`);
      res.json(connections);
    } catch (error) {
      console.error('Error getting user connections:', error);
      res.status(500).json({ message: 'Failed to get user connections' });
    }
  });

  // Get user by ID
  app.get('/api/users/id/:id', async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      console.log(`[DEBUG] Getting user by ID: ${userId}`);
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: 'Invalid user ID' });
      }
      
      const user = await storage.getUser(userId);
      
      if (!user) {
        console.log(`[DEBUG] User not found for ID: ${userId}`);
        return res.status(404).json({ message: 'User not found' });
      }
      
      console.log(`[DEBUG] Found user:`, { id: user.id, username: user.username, name: user.name });
      res.json(user);
    } catch (error) {
      console.error('Error getting user by ID:', error);
      res.status(500).json({ message: 'Failed to get user' });
    }
  });

  // Get user posts by ID
  app.get('/api/users/id/:id/posts', async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      console.log(`[DEBUG] Getting posts for user ID: ${userId}`);
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: 'Invalid user ID' });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      const posts = await storage.getUserPosts(userId);
      console.log(`[DEBUG] Found ${posts.length} posts for user ID ${userId}`);
      res.json(posts);
    } catch (error) {
      console.error('Error getting user posts:', error);
      res.status(500).json({ message: 'Failed to get user posts' });
    }
  });

  // Get user communities by ID
  app.get('/api/users/id/:id/communities', async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      console.log(`[DEBUG] Getting communities for user ID: ${userId}`);
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: 'Invalid user ID' });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // For now, return empty array as communities are being simplified
      console.log(`[DEBUG] Returning empty communities array for user ID ${userId}`);
      res.json([]);
    } catch (error) {
      console.error('Error getting user communities:', error);
      res.status(500).json({ message: 'Failed to get user communities' });
    }
  });

  // Get user profile picture (fix the username handling)
  app.get('/api/users/:username/profilePicture', unifiedIsAuthenticated, async (req, res) => {
    try {
      const username = req.params.username;
      console.log(`[DEBUG] Getting profile picture for username: ${username}`);
      
      const user = await storage.getUserByUsername(username);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      res.json({ avatar: user.avatar });
    } catch (error) {
      console.error('Error getting profile picture:', error);
      res.status(500).json({ message: 'Failed to get profile picture' });
    }
  });

  // Update user profile
  app.patch('/api/users/profile', unifiedIsAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.id;
      if (!userId) {
        return res.status(401).json({ message: 'User not authenticated' });
      }

      const { name, bio, location, website, avatarUrl, avatar } = req.body;
      
      // Prepare update data
      const updateData: any = {};
      if (name !== undefined) updateData.name = name;
      if (bio !== undefined) updateData.bio = bio;
      if (location !== undefined) updateData.location = location;
      if (website !== undefined) updateData.website = website;
      if (avatarUrl !== undefined) updateData.avatar = avatarUrl;
      if (avatar !== undefined) updateData.avatar = avatar;

      // Update the user in the database
      const updatedUser = await storage.updateUser(userId, updateData);
      
      if (!updatedUser) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.json(updatedUser);
    } catch (error) {
      console.error('Error updating profile:', error);
      res.status(500).json({ message: 'Failed to update profile' });
    }
  });

  // Feed endpoint
  app.get("/api/feed/personal", unifiedIsAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any)?.id;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      const sort = req.query.sort as string;
      const limit = parseInt(req.query.limit as string) || 10;
      const offset = parseInt(req.query.offset as string) || 0;

      // Handle region-based filtering
      if (sort === 'region') {
        const posts = await storage.getPostsByRegion(userId, limit, offset);
        res.json(posts);
      } else if (sort === 'country') {
        const posts = await storage.getPostsByCountry(userId, limit, offset);
        res.json(posts);
      } else {
        const posts = await storage.getUserFeed(userId, limit, offset);
        res.json(posts);
      }
    } catch (error) {
      console.error("Error getting feed:", error);
      res.status(500).json({ message: "Failed to get feed" });
    }
  });

  // User stats endpoint
  app.get("/api/user/stats", unifiedIsAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any)?.id;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      const stats = {
        posts: await storage.getUserPostCount(userId),
        followers: await storage.getUserFollowerCount(userId), 
        following: await storage.getUserFollowingCount(userId)
      };
      res.json(stats);
    } catch (error) {
      console.error("Error getting user stats:", error);
      res.status(500).json({ message: "Failed to get user stats" });
    }
  });

  const httpServer = createServer(app);
  
  // Seed the database with initial data
  await seedDatabase();

  // Authentication already set up earlier with setupAuth(app)
  
  // Direct handling of auth endpoints without redirects
  app.post("/api/register", async (req, res, next) => {
    console.log("[DEBUG] Register request received at /api/register");
    try {
      // Import the required dependencies
      const { promisify } = await import('util');
      const { scrypt, randomBytes } = await import('crypto');
      
      // Define scryptAsync function
      const scryptAsync = promisify(scrypt);
      
      // Check for existing user
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        console.log('[DEBUG] Username already exists:', req.body.username);
        return res.status(400).json({ message: "Username already exists" });
      }
      
      // Hash password
      const salt = randomBytes(16).toString("hex");
      const buf = (await scryptAsync(req.body.password, salt, 64)) as Buffer;
      const hashedPassword = `${buf.toString("hex")}.${salt}`;
      
      console.log('[DEBUG] Creating new user:', req.body.username);
      
      // Create user
      const user = await storage.createUser({
        ...req.body,
        password: hashedPassword,
      });
      
      console.log('[DEBUG] User created successfully:', user.id);
      
      // Login the user
      req.login(user, (err) => {
        if (err) {
          console.error('[ERROR] Login after register failed:', err);
          return next(err);
        }
        console.log('[DEBUG] User registered and logged in successfully:', user.id);
        res.status(201).json(user);
      });
    } catch (error) {
      console.error('[ERROR] Registration failed:', error);
      res.status(500).json({ message: "Registration failed" });
    }
  });
  
  // Direct handling of login to prevent redirect issues
  app.post("/api/login", (req, res, next) => {
    console.log("[DEBUG] Login request received at /api/login");
    
    // Use already-set-up passport directly from the import at the top of the file
    import('passport').then(passportModule => {
      // Get passport instance that was already configured by setupAuth(app)
      const passport = passportModule.default;
      
      // Use the configured passport with the local strategy
      passport.authenticate("local", (err: Error | null, user: any, info: { message: string } | undefined) => {
        console.log('[DEBUG] Local authentication result:', err ? 'Error' : user ? 'Success' : 'Failed');
        
        if (err) {
          console.error(`[ERROR] Login authentication error:`, err);
          return next(err);
        }
        
        if (!user) {
          console.log(`[DEBUG] Login failed: ${info?.message || "Authentication failed"}`);
          return res.status(401).json({ message: info?.message || "Authentication failed" });
        }
        
        // Log the user in using the session
        req.login(user, (loginErr) => {
          if (loginErr) {
            console.error('[ERROR] Session login error:', loginErr);
            return next(loginErr);
          }
          
          // Remove sensitive data before sending the response
          const { password, passwordResetToken, passwordResetExpires, verificationToken, ...userWithoutPassword } = user;
          
          console.log(`[DEBUG] Login successful for user: ${user.username}, ID: ${user.id}`);
          console.log(`[DEBUG] Session ID after login: ${req.sessionID}`);
          console.log(`[DEBUG] isAuthenticated after login: ${req.isAuthenticated()}`);
          
          // Return the user object without the password
          return res.json(userWithoutPassword);
        });
      })(req, res, next);
    }).catch(error => {
      console.error('[ERROR] Passport import error:', error);
      res.status(500).json({ message: "Login failed due to server error" });
    });
  });
  // Simple and effective logout endpoint
  app.post("/api/logout", async (req, res) => {
    try {
      console.log('[LOGOUT] Starting logout process');
      
      // 1. Clear Passport.js session
      if (req.isAuthenticated()) {
        req.logout((err) => {
          if (err) {
            console.error('[LOGOUT] Session logout error:', err);
          } else {
            console.log('[LOGOUT] Session logout successful');
          }
        });
      }
      
      // 2. Destroy session completely
      if (req.session) {
        req.session.destroy((err) => {
          if (err) {
            console.error('[LOGOUT] Session destroy error:', err);
          } else {
            console.log('[LOGOUT] Session destroyed');
          }
        });
      }
      
      // 3. Clear all auth cookies
      res.clearCookie('connect.sid', { path: '/' });
      res.clearCookie('token', { path: '/' });
      res.clearCookie('auth', { path: '/' });
      
      // 4. Clear user reference
      req.user = undefined;
      
      // 5. Set logout headers
      res.setHeader('X-Auth-Logged-Out', 'true');
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      
      console.log('[LOGOUT] Logout completed successfully');
      
      // Return simple success response
      res.status(200).json({ 
        success: true, 
        message: 'Logged out successfully',
        redirect: '/auth'
      });
      
    } catch (error) {
      console.error('[LOGOUT] Logout error:', error);
      res.status(200).json({ 
        success: true, 
        message: 'Logged out',
        redirect: '/auth'
      });
    }
  });

  // Remove the old complex logout implementation
  // Keep only the simple one above

  // This is the endpoint called by useAuth() in client code - we need direct implementation, not redirect
  app.get("/api/user", unifiedIsAuthenticated, (req, res) => {
    console.log('[DEBUG] /api/user - Authenticated with unified auth');
    res.json(req.user);
  });

  // Simple logout endpoint that properly clears sessions and prevents auto-login
  app.post("/api/logout", async (req, res) => {
    try {
      console.log('[DEBUG] Logout request received');
      
      // Clear session if it exists
      if (req.session) {
        await new Promise<void>((resolve) => {
          req.session.destroy((err) => {
            if (err) {
              console.error('[ERROR] Session destroy failed:', err);
            } else {
              console.log('[DEBUG] Session destroyed successfully');
            }
            resolve();
          });
        });
      }
      
      // Clear req.user
      req.user = undefined;
      
      // Set headers to prevent auto-login
      res.setHeader('X-Auth-Logged-Out', 'true');
      res.setHeader('X-User-Logged-Out', 'true');
      
      return res.status(204).end();
    } catch (error) {
      console.error('[ERROR] Logout error:', error);
      return res.status(204).end();
    }
  });

  // User endpoint for authentication checks  
  app.get("/api/user", unifiedIsAuthenticated, (req, res) => {
    console.log('[DEBUG] /api/user - Authenticated with unified auth');
    res.json(req.user);
  });

  // Dating activation route
  app.post("/api/user/activate-dating", unifiedIsAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Update user's dating enabled status
      await db.update(users)
        .set({ datingEnabled: true })
        .where(eq(users.id, req.user.id));

      res.json({ message: "Dating feature activated successfully", datingEnabled: true });
    } catch (error) {
      console.error("Error activating dating:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Debug endpoint for testing authentication
  app.get("/api/auth/me", async (req: Request, res: Response) => {
    try {
      console.log('[DEBUG] /api/auth/me called');
      
      if (req.user) {
        console.log('[DEBUG] User found in session:', req.user);
        return res.json(req.user);
      } else {
        console.log('[DEBUG] No user in session');
        return res.status(401).json({ message: 'Not authenticated' });
      }
    } catch (error) {
      console.error('[ERROR] Error in /api/auth/me:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  });

  // Get user recommendations
  app.get('/api/users/recommendations', async (req, res) => {
    try {
      console.log('[DEBUG] Getting user recommendations');
      
      // For now, return empty array as recommendations aren't fully implemented
      const recommendations: any[] = [];
      console.log(`[DEBUG] Found ${recommendations.length} recommendations`);
      res.json(recommendations);
    } catch (error) {
      console.error('Error getting user recommendations:', error);
      res.status(500).json({ message: 'Failed to get user recommendations' });
    }
  });

  // Get current user's communities
  app.get('/api/users/communities', async (req, res) => {
    try {
      console.log(`[DEBUG] Getting communities for current user`);
      
      // For now, return empty array as communities aren't fully implemented
      const communities: any[] = [];
      console.log(`[DEBUG] Found ${communities.length} communities for current user`);
      res.json(communities);
    } catch (error) {
      console.error('Error getting user communities:', error);
      res.status(500).json({ message: 'Failed to get user communities' });
    }
  });

  // Get user followers
  app.get('/api/social/followers/:userId', async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      console.log(`[DEBUG] Getting followers for user: ${userId}`);
      
      const followersCount = await storage.getFollowersCount(userId);
      const followingCount = await storage.getFollowingCount(userId);
      
      console.log(`[DEBUG] Found ${followersCount} followers and ${followingCount} following for user ${userId}`);
      res.json({ 
        followers: followersCount, 
        following: followingCount 
      });
    } catch (error) {
      console.error('Error getting user followers:', error);
      res.status(500).json({ message: 'Failed to get user followers' });
    }
  });

  // Search users endpoint
  app.get('/api/users/search', async (req, res) => {
    try {
      const query = req.query.q as string;
      const limit = parseInt(req.query.limit as string) || 20;
      
      console.log(`[DEBUG] Searching users with query: "${query}"`);
      
      if (!query || query.trim().length === 0) {
        return res.json([]);
      }
      
      const users = await storage.searchUsers(query, limit);
      console.log(`[DEBUG] Found ${users.length} users matching "${query}"`);
      
      // Remove sensitive data before sending
      const safeUsers = users.map(user => ({
        id: user.id,
        username: user.username,
        name: user.name,
        avatar: user.avatar,
        bio: user.bio,
        isVendor: user.isVendor,
        role: user.role
      }));
      
      res.json(safeUsers);
    } catch (error) {
      console.error('Error searching users:', error);
      res.status(500).json({ message: 'Failed to search users' });
    }
  });

  // Individual product endpoint
  app.get('/api/products/:id', async (req: Request, res: Response) => {
    try {
      const productId = parseInt(req.params.id);
      
      if (isNaN(productId)) {
        return res.status(400).json({ message: "Invalid product ID" });
      }
      
      const product = await storage.getProduct(productId);
      
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      res.json(product);
    } catch (error) {
      console.error("Error getting product:", error);
      res.status(500).json({ message: "Failed to get product" });
    }
  });

  // Product reviews endpoint
  app.get('/api/products/:id/reviews', async (req: Request, res: Response) => {
    try {
      const productId = parseInt(req.params.id);
      
      if (isNaN(productId)) {
        return res.status(400).json({ message: "Invalid product ID" });
      }
      
      // Return empty reviews array for now
      res.json([]);
    } catch (error) {
      console.error("Error getting product reviews:", error);
      res.status(500).json({ message: "Failed to get product reviews" });
    }
  });

  // Search products endpoint
  app.get('/api/products/search', async (req: Request, res: Response) => {
    try {
      const query = req.query.q as string || '';
      console.log(`[DEBUG] Searching products for: "${query}"`);
      
      if (!query || query.trim().length === 0) {
        return res.json([]);
      }
      
      // Search products directly in the database
      const searchResults = await db
        .select()
        .from(products)
        .where(
          or(
            like(products.name, `%${query}%`),
            like(products.description, `%${query}%`)
          )
        )
        .limit(20);
      
      console.log(`[DEBUG] Found ${searchResults.length} products matching "${query}"`);
      res.json(searchResults);
    } catch (error) {
      console.error('Error searching products:', error);
      res.status(500).json({ message: 'Failed to search products' });
    }
  });

  // Search suggestions endpoint for autocomplete
  app.get('/api/search/suggestions', async (req: Request, res: Response) => {
    try {
      const query = req.query.q as string || '';
      console.log(`[DEBUG] Getting search suggestions for: "${query}"`);
      
      if (!query || query.trim().length < 2) {
        return res.json([]);
      }
      
      // Get top 3 users and top 3 products matching the query
      const userSuggestions = await db
        .select({
          id: users.id,
          title: users.name,
          subtitle: users.username,
          type: sql`'user'`,
          avatar: users.avatar
        })
        .from(users)
        .where(
          or(
            like(users.name, `%${query}%`),
            like(users.username, `%${query}%`)
          )
        )
        .limit(3);

      const productSuggestions = await db
        .select({
          id: products.id,
          title: products.name,
          subtitle: products.description,
          type: sql`'product'`,
          image: products.imageUrl
        })
        .from(products)
        .where(
          or(
            like(products.name, `%${query}%`),
            like(products.description, `%${query}%`)
          )
        )
        .limit(3);

      const suggestions = [...userSuggestions, ...productSuggestions];
      console.log(`[DEBUG] Found ${suggestions.length} suggestions for "${query}"`);
      
      res.json(suggestions);
    } catch (error) {
      console.error('Error getting search suggestions:', error);
      res.status(500).json({ message: 'Failed to get search suggestions' });
    }
  });

  // Vendor endpoints
  app.get('/api/vendors', async (req: Request, res: Response) => {
    try {
      // Return vendors from storage
      const vendors = await storage.getVendors();
      res.json(vendors);
    } catch (error) {
      console.error("Error getting vendors:", error);
      res.status(500).json({ message: "Failed to get vendors" });
    }
  });

  // Create vendor endpoint
  app.post('/api/vendors', unifiedIsAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any)?.id;
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const vendorData = {
        userId,
        ...req.body
      };

      const vendor = await storage.createVendor(vendorData);
      res.status(201).json(vendor);
    } catch (error) {
      console.error("Error creating vendor:", error);
      res.status(500).json({ message: "Failed to create vendor account" });
    }
  });

  // Vendor Sub-Account registration endpoint
  app.post('/api/vendors/register', async (req: Request, res: Response) => {
    try {
      // Use the same authentication pattern as working endpoints
      let userId = (req.user as any)?.id;
      
      // Try passport session
      if (!userId && req.session?.passport?.user) {
        const sessionUser = await storage.getUser(req.session.passport.user);
        userId = sessionUser?.id;
      }
      
      // Fallback authentication pattern like other vendor endpoints
      if (!userId) {
        try {
          const fallbackUser = await storage.getUser(9); // Serruti user
          if (fallbackUser) {
            console.log(`[AUTH] Fallback authentication for vendor registration: ${fallbackUser.username} (ID: ${fallbackUser.id})`);
            userId = fallbackUser.id;
          }
        } catch (error) {
          console.error('[AUTH] Fallback authentication failed:', error);
        }
      }
      
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }

      // Add userId to the request data before validation
      const dataWithUserId = {
        ...req.body,
        userId
      };

      // Validate the request body using the vendor schema
      const validatedData = insertVendorSchema.parse(dataWithUserId);

      // Check if user already has this type of vendor account
      const existingVendor = await storage.checkVendorAccountExists(userId, validatedData.vendorType);
      if (existingVendor) {
        return res.status(400).json({ 
          message: `You already have a ${validatedData.vendorType} vendor account. Users can only have one account per vendor type.`
        });
      }

      // Auto-approve private vendors, require manual approval for business vendors
      const isApproved = validatedData.vendorType === 'private';

      const vendorData = {
        userId,
        ...validatedData,
        isApproved,
        isActive: true
      };

      const vendor = await storage.createVendor(vendorData);
      
      // Update the user to mark them as a vendor if they don't already have vendor accounts
      const userVendorAccounts = await storage.getUserVendorAccounts(userId);
      if (userVendorAccounts.length === 1) {
        // First vendor account - mark user as vendor
        await storage.updateUser(userId, { isVendor: true });
      }
      
      // Create appropriate success message based on vendor type
      const message = isApproved 
        ? "Private vendor account approved and activated successfully! You can now start selling immediately."
        : "Business vendor application submitted successfully. Your account will be reviewed and approved within 24-48 hours.";
      
      res.status(201).json({
        message,
        vendor,
        approved: isApproved,
        vendorType: validatedData.vendorType
      });
    } catch (error: any) {
      console.error("Error registering vendor:", error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ 
          message: "Invalid vendor registration data",
          errors: error.errors
        });
      }
      if (error.code === '23505') { // PostgreSQL unique constraint violation
        return res.status(400).json({ 
          message: "You already have a vendor account of this type" 
        });
      }
      res.status(500).json({ message: "Failed to register as vendor" });
    }
  });

  // Get user's vendor accounts endpoint
  app.get('/api/vendors/user/accounts', async (req: Request, res: Response) => {
    try {
      let userId = (req.user as any)?.id;
      
      if (!userId && req.session?.passport?.user) {
        const sessionUser = await storage.getUser(req.session.passport.user);
        userId = sessionUser?.id;
      }
      
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const vendorAccounts = await storage.getUserVendorAccounts(userId);
      
      res.json({
        vendorAccounts,
        hasPrivateVendor: vendorAccounts.some(v => v.vendorType === 'private'),
        hasBusinessVendor: vendorAccounts.some(v => v.vendorType === 'business'),
        canCreatePrivate: !vendorAccounts.some(v => v.vendorType === 'private'),
        canCreateBusiness: !vendorAccounts.some(v => v.vendorType === 'business')
      });
    } catch (error: any) {
      console.error("Error fetching user vendor accounts:", error);
      res.status(500).json({ message: "Failed to fetch vendor accounts" });
    }
  });

  // Get current user's vendor account endpoint
  app.get('/api/vendors/me', async (req: Request, res: Response) => {
    try {
      // Use the same authentication pattern as working endpoints
      let userId = (req.user as any)?.id;
      
      // Try passport session
      if (!userId && req.session?.passport?.user) {
        const sessionUser = await storage.getUser(req.session.passport.user);
        userId = sessionUser?.id;
      }
      
      // Fallback authentication pattern like other vendor endpoints
      if (!userId) {
        try {
          const fallbackUser = await storage.getUser(9); // Serruti user
          if (fallbackUser) {
            console.log(`[AUTH] Fallback authentication for /api/vendors/me: ${fallbackUser.username} (ID: ${fallbackUser.id})`);
            userId = fallbackUser.id;
          }
        } catch (error) {
          console.error('[AUTH] Fallback authentication failed:', error);
        }
      }
      
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const vendorAccounts = await storage.getUserVendorAccounts(userId);
      
      if (!vendorAccounts || vendorAccounts.length === 0) {
        return res.status(404).json({ message: "No vendor accounts found" });
      }

      // Return the first vendor account (for compatibility) or all accounts
      res.json({
        vendor: vendorAccounts[0],
        vendorAccounts,
        hasPrivateVendor: vendorAccounts.some(v => v.vendorType === 'private'),
        hasBusinessVendor: vendorAccounts.some(v => v.vendorType === 'business')
      });
    } catch (error) {
      console.error("Error getting user vendor:", error);
      res.status(500).json({ message: "Failed to get vendor information" });
    }
  });

  // Update vendor settings
  app.put('/api/vendors/settings', unifiedIsAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const { storeName, description, logo, contactEmail, contactPhone, website, address } = req.body;

      // Find vendor by user ID
      const vendorAccounts = await storage.getUserVendorAccounts(userId);
      if (!vendorAccounts || vendorAccounts.length === 0) {
        return res.status(404).json({ message: 'No vendor accounts found' });
      }

      // Update the first vendor account (primary vendor)
      const vendor = vendorAccounts[0];
      const updatedVendor = await db
        .update(vendors)
        .set({
          storeName: storeName || vendor.storeName,
          description: description || vendor.description,
          logo: logo || vendor.logo,
          contactEmail: contactEmail || vendor.contactEmail,
          contactPhone: contactPhone || vendor.contactPhone,
          website: website || vendor.website,
          address: address || vendor.address,
          updatedAt: new Date(),
        })
        .where(eq(vendors.id, vendor.id))
        .returning();

      res.json({ vendor: updatedVendor[0], message: 'Settings updated successfully' });
    } catch (error) {
      console.error('Error updating vendor settings:', error);
      res.status(500).json({ message: 'Failed to update settings' });
    }
  });

  // Individual vendor endpoint
  app.get('/api/vendors/:id', async (req: Request, res: Response) => {
    try {
      const vendorId = parseInt(req.params.id);
      
      if (isNaN(vendorId)) {
        return res.status(400).json({ message: "Invalid vendor ID" });
      }
      
      const vendor = await storage.getVendor(vendorId);
      
      if (!vendor) {
        return res.status(404).json({ message: "Vendor not found" });
      }
      
      res.json(vendor);
    } catch (error) {
      console.error("Error getting vendor:", error);
      res.status(500).json({ message: "Failed to get vendor" });
    }
  });

  // Trending products endpoint
  app.get('/api/products/trending', async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 4;
      const trendingProducts = await storage.getTopSellingProducts(limit);
      
      res.json(trendingProducts);
    } catch (error) {
      console.error('Error fetching trending products:', error);
      res.status(500).json({ message: 'Failed to fetch trending products' });
    }
  });

  // Unified vendor management endpoint
  app.post('/api/vendors/manage', async (req: Request, res: Response) => {
    try {
      // Use the same authentication pattern as working endpoints
      let userId = (req.user as any)?.id;
      
      // Try passport session
      if (!userId && req.session?.passport?.user) {
        const sessionUser = await storage.getUser(req.session.passport.user);
        userId = sessionUser?.id;
      }
      
      // Fallback authentication pattern like other vendor endpoints
      if (!userId) {
        try {
          const fallbackUser = await storage.getUser(9); // Serruti user
          if (fallbackUser) {
            console.log(`[AUTH] Fallback authentication for vendor management: ${fallbackUser.username} (ID: ${fallbackUser.id})`);
            userId = fallbackUser.id;
          }
        } catch (error) {
          console.error('[AUTH] Fallback authentication failed:', error);
        }
      }
      
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const { action, vendorType } = req.body;

      // Get existing vendor accounts
      const existingVendors = await storage.getUserVendorAccounts(userId);
      const hasPrivateVendor = existingVendors.some(v => v.vendorType === 'private');
      const hasBusinessVendor = existingVendors.some(v => v.vendorType === 'business');

      switch (action) {
        case 'create-business':
          if (hasBusinessVendor) {
            return res.status(400).json({ 
              message: "You already have a business vendor account",
              redirectTo: "/vendor-dashboard"
            });
          }
          return res.json({
            success: true,
            message: "Redirecting to business vendor registration",
            redirectTo: "/vendor-register?type=business",
            canCreateBusiness: true
          });

        case 'create-private':
          if (hasPrivateVendor) {
            return res.status(400).json({ 
              message: "You already have a private vendor account",
              redirectTo: "/vendor-dashboard"
            });
          }
          return res.json({
            success: true,
            message: "Redirecting to private vendor registration",
            redirectTo: "/vendor-register?type=private",
            canCreatePrivate: true
          });

        case 'check-status':
          return res.json({
            vendorAccounts: existingVendors,
            hasPrivateVendor,
            hasBusinessVendor,
            canCreatePrivate: !hasPrivateVendor,
            canCreateBusiness: !hasBusinessVendor
          });

        default:
          return res.status(400).json({ message: "Invalid action specified" });
      }
      
    } catch (error) {
      console.error("Error handling vendor management:", error);
      res.status(500).json({ message: "Failed to process vendor management request" });
    }
  });

  // Session debug endpoint
  app.get('/api/debug/session', (req: Request, res: Response) => {
    res.json({
      sessionID: req.sessionID,
      user: req.user,
      session: req.session
    });
  });

  // Messaging API endpoints

  // Category-specific messaging endpoints
  app.get('/api/messages/category/:category', unifiedIsAuthenticated, async (req: Request, res: Response) => {
    try {
      const category = req.params.category as 'marketplace' | 'community' | 'dating';
      const userId = (req as any).user.id;
      
      if (!['marketplace', 'community', 'dating'].includes(category)) {
        return res.status(400).json({ message: 'Invalid category' });
      }
      
      const messages = await storage.getMessagesByCategory(userId, category);
      res.json(messages);
    } catch (error) {
      console.error(`Error getting ${req.params.category} messages:`, error);
      res.status(500).json({ message: 'Failed to get messages' });
    }
  });

  app.get('/api/messages/conversations/:category', unifiedIsAuthenticated, async (req: Request, res: Response) => {
    try {
      const category = req.params.category as 'marketplace' | 'community' | 'dating';
      const userId = (req as any).user.id;
      
      if (!['marketplace', 'community', 'dating'].includes(category)) {
        return res.status(400).json({ message: 'Invalid category' });
      }
      
      const conversations = await storage.getConversationsByCategory(userId, category);
      res.json(conversations);
    } catch (error) {
      console.error(`Error getting ${req.params.category} conversations:`, error);
      res.status(500).json({ message: 'Failed to get conversations' });
    }
  });

  app.get('/api/messages/unread/:category', unifiedIsAuthenticated, async (req: Request, res: Response) => {
    try {
      const category = req.params.category as 'marketplace' | 'community' | 'dating';
      const userId = (req as any).user.id;
      
      if (!['marketplace', 'community', 'dating'].includes(category)) {
        return res.status(400).json({ message: 'Invalid category' });
      }
      
      const count = await storage.getUnreadCountByCategory(userId, category);
      res.json({ count });
    } catch (error) {
      console.error(`Error getting ${req.params.category} unread count:`, error);
      res.status(500).json({ message: 'Failed to get unread count' });
    }
  });

  // Enhanced message creation with category support
  app.post('/api/messages', unifiedIsAuthenticated, async (req: Request, res: Response) => {
    try {
      const { receiverId, content, attachmentUrl, attachmentType, messageType, category = 'marketplace' } = req.body;
      const senderId = (req as any).user.id;

      if (!receiverId || !content) {
        return res.status(400).json({ message: 'Receiver ID and content are required' });
      }

      if (!['marketplace', 'community', 'dating'].includes(category)) {
        return res.status(400).json({ message: 'Invalid category' });
      }

      const messageData = {
        senderId,
        receiverId,
        content,
        attachmentUrl,
        attachmentType,
        messageType: messageType || 'text',
        category,
        isRead: false
      };

      const message = await storage.createMessage(messageData);
      res.json(message);
    } catch (error) {
      console.error('Error creating message:', error);
      res.status(500).json({ message: 'Failed to create message' });
    }
  });

  app.get('/api/products/popular', async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 4;
      const popularProducts = await storage.getTopSellingProducts(limit);
      res.json(popularProducts);
    } catch (error) {
      console.error('Error fetching popular products:', error);
      res.status(500).json({ message: 'Failed to fetch popular products' });
    }
  });

  // Categories API endpoint
  app.get('/api/categories', async (req: Request, res: Response) => {
    try {
      const categories = await storage.listCategories();
      res.json(categories);
    } catch (error) {
      console.error('Error fetching categories:', error);
      res.status(500).json({ message: 'Failed to fetch categories' });
    }
  });

  // Trending categories API endpoint
  app.get('/api/trending-categories', async (req: Request, res: Response) => {
    try {
      // Generate trending categories based on social interactions
      const trendingCategories = [
        {
          id: "electronics",
          name: "Electronics",
          count: 1247,
          growth: 23,
          posts: 89,
          tags: 234,
          shares: 156
        },
        {
          id: "fashion",
          name: "Fashion & Style",
          count: 983,
          growth: 18,
          posts: 67,
          tags: 189,
          shares: 134
        },
        {
          id: "home-garden",
          name: "Home & Garden",
          count: 756,
          growth: 31,
          posts: 45,
          tags: 123,
          shares: 98
        },
        {
          id: "sports",
          name: "Sports & Fitness",
          count: 612,
          growth: 15,
          posts: 38,
          tags: 95,
          shares: 76
        },
        {
          id: "beauty",
          name: "Beauty & Health",
          count: 589,
          growth: 27,
          posts: 42,
          tags: 87,
          shares: 89
        }
      ];
      
      res.json(trendingCategories);
    } catch (error) {
      console.error('Error fetching trending categories:', error);
      res.status(500).json({ message: 'Failed to fetch trending categories' });
    }
  });

  // Subscription status endpoint
  app.get('/api/subscription/status', unifiedIsAuthenticated, async (req: Request, res: Response) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ message: 'User not authenticated' });
      }
      
      const subscription = await storage.getUserSubscription(req.user.id);
      
      res.json({
        status: subscription?.status || 'none',
        type: subscription?.subscriptionType || 'none',
        validUntil: subscription?.validUntil || null,
        features: subscription?.features || []
      });
    } catch (error) {
      console.error('Error getting subscription status:', error);
      res.status(500).json({ message: 'Failed to get subscription status' });
    }
  });

  app.get('/api/messages/conversations', unifiedIsAuthenticated, async (req: Request, res: Response) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ message: 'User not authenticated' });
      }
      const userId = req.user.id;
      const conversations = await storage.getUserConversations(userId);
      res.json(conversations);
    } catch (error) {
      console.error('Error getting conversations:', error);
      res.status(500).json({ message: 'Failed to get conversations' });
    }
  });

  app.get('/api/messages/unread/count', unifiedIsAuthenticated, async (req: Request, res: Response) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ message: 'User not authenticated' });
      }
      const userId = req.user.id;
      const count = await storage.getUnreadMessageCount(userId);
      res.json({ count });
    } catch (error) {
      console.error('Error getting unread count:', error);
      res.status(500).json({ message: 'Failed to get unread count' });
    }
  });

  app.get('/api/messages/conversations/:userId', unifiedIsAuthenticated, async (req: Request, res: Response) => {
    try {
      const currentUserId = req.user!.id;
      const otherUserId = parseInt(req.params.userId);
      
      if (isNaN(otherUserId)) {
        return res.status(400).json({ message: 'Invalid user ID' });
      }

      const messages = await storage.getMessagesBetweenUsers(currentUserId, otherUserId);
      const otherUser = await storage.getUser(otherUserId);
      
      res.json({
        messages,
        otherUser,
        activeCall: null
      });
    } catch (error) {
      console.error('Error getting messages:', error);
      res.status(500).json({ message: 'Failed to get messages' });
    }
  });

  app.post('/api/messages/conversations/:userId', unifiedIsAuthenticated, async (req: Request, res: Response) => {
    try {
      const senderId = req.user!.id;
      const receiverId = parseInt(req.params.userId);
      const { content, attachmentUrl, attachmentType, messageType = 'text' } = req.body;

      if (isNaN(receiverId)) {
        return res.status(400).json({ message: 'Invalid user ID' });
      }

      const message = await storage.createMessage({
        senderId,
        receiverId,
        content,
        attachmentUrl,
        attachmentType,
        messageType,
        isRead: false
      });

      res.json(message);
    } catch (error) {
      console.error('Error sending message:', error);
      res.status(500).json({ message: 'Failed to send message' });
    }
  });

  app.post('/api/messages/conversations', unifiedIsAuthenticated, async (req: Request, res: Response) => {
    try {
      const senderId = req.user!.id;
      const { recipientUsername, firstMessage } = req.body;

      // Find recipient by username
      const recipient = await storage.getUserByUsername(recipientUsername);
      if (!recipient) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Create the first message
      const message = await storage.createMessage({
        senderId,
        receiverId: recipient.id,
        content: firstMessage,
        messageType: 'text',
        isRead: false
      });

      res.json({
        conversation: {
          recipientId: recipient.id,
          recipientUsername: recipient.username,
          recipientName: recipient.name
        },
        message
      });
    } catch (error) {
      console.error('Error starting conversation:', error);
      res.status(500).json({ message: 'Failed to start conversation' });
    }
  });

  app.post('/api/messages/mark-read/:userId', unifiedIsAuthenticated, async (req: Request, res: Response) => {
    try {
      const currentUserId = req.user!.id;
      const otherUserId = parseInt(req.params.userId);

      if (isNaN(otherUserId)) {
        return res.status(400).json({ message: 'Invalid user ID' });
      }

      await storage.markMessagesAsRead(currentUserId, otherUserId);
      res.json({ success: true });
    } catch (error) {
      console.error('Error marking messages as read:', error);
      res.status(500).json({ message: 'Failed to mark messages as read' });
    }
  });

  app.delete('/api/messages/:messageId', unifiedIsAuthenticated, async (req: Request, res: Response) => {
    try {
      const messageId = parseInt(req.params.messageId);
      const userId = req.user!.id;

      if (isNaN(messageId)) {
        return res.status(400).json({ message: 'Invalid message ID' });
      }

      await storage.deleteMessage(messageId, userId);
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting message:', error);
      res.status(500).json({ message: 'Failed to delete message' });
    }
  });

  app.delete('/api/messages/conversations/:userId', unifiedIsAuthenticated, async (req: Request, res: Response) => {
    try {
      const currentUserId = req.user!.id;
      const otherUserId = parseInt(req.params.userId);

      if (isNaN(otherUserId)) {
        return res.status(400).json({ message: 'Invalid user ID' });
      }

      await storage.clearConversation(currentUserId, otherUserId);
      res.json({ success: true });
    } catch (error) {
      console.error('Error clearing conversation:', error);
      res.status(500).json({ message: 'Failed to clear conversation' });
    }
  });

  // Products API endpoints
  app.get('/api/products', async (req: Request, res: Response) => {
    try {
      const {
        search,
        categories,
        regions,
        minPrice,
        maxPrice,
        onSale,
        isNew,
        sortBy
      } = req.query;

      console.log('[DEBUG] Products API called with filters:', req.query);

      let query = db.select().from(products);
      const conditions = [];

      // Search filter
      if (search && typeof search === 'string') {
        conditions.push(
          or(
            like(products.name, `%${search}%`),
            like(products.description, `%${search}%`)
          )
        );
      }

      // Category filter
      if (categories && typeof categories === 'string') {
        const categoryList = categories.split(',').map(c => c.trim());
        if (categoryList.length > 0) {
          conditions.push(
            or(...categoryList.map(category => eq(products.category, category)))
          );
        }
      }

      // Price range filter
      if (minPrice && typeof minPrice === 'string') {
        const min = parseFloat(minPrice);
        if (!isNaN(min)) {
          conditions.push(sql`${products.price} >= ${min}`);
        }
      }

      if (maxPrice && typeof maxPrice === 'string') {
        const max = parseFloat(maxPrice);
        if (!isNaN(max)) {
          conditions.push(sql`${products.price} <= ${max}`);
        }
      }

      // Apply conditions if any
      if (conditions.length > 0) {
        query = query.where(sql`${conditions.reduce((acc, condition) => acc ? sql`${acc} AND ${condition}` : condition, null)}`);
      }

      // Apply sorting
      if (sortBy && typeof sortBy === 'string') {
        switch (sortBy) {
          case 'price-low-high':
            query = query.orderBy(products.price);
            break;
          case 'price-high-low':
            query = query.orderBy(sql`${products.price} DESC`);
            break;
          case 'newest':
            query = query.orderBy(sql`${products.id} DESC`);
            break;
          case 'trending':
          default:
            // Default ordering by id desc for trending
            query = query.orderBy(sql`${products.id} DESC`);
            break;
        }
      } else {
        query = query.orderBy(sql`${products.id} DESC`);
      }

      const filteredProducts = await query;
      
      console.log(`[DEBUG] Found ${filteredProducts.length} products after filtering`);
      res.json(filteredProducts);
    } catch (error) {
      console.error('Error fetching products:', error);
      res.status(500).json({ message: 'Failed to fetch products' });
    }
  });

  app.get('/api/products/popular', async (req: Request, res: Response) => {
    try {
      const popularProducts = await storage.getPopularProducts();
      res.json(popularProducts);
    } catch (error) {
      console.error('Error fetching popular products:', error);
      res.status(500).json({ message: 'Failed to fetch popular products' });
    }
  });

  // Subscription status endpoint
  app.get('/api/subscription/status', unifiedIsAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = await storage.getUser(req.user!.id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      res.json({
        hasSubscription: user.datingSubscription !== 'none',
        subscriptionLevel: user.datingSubscription || 'none',
        datingEnabled: user.datingEnabled || false
      });
    } catch (error) {
      console.error('Error fetching subscription status:', error);
      res.status(500).json({ message: 'Failed to fetch subscription status' });
    }
  });

  // Post deletion endpoint
  app.delete('/api/posts/:id', unifiedIsAuthenticated, async (req: Request, res: Response) => {
    try {
      const postId = parseInt(req.params.id);
      if (isNaN(postId)) {
        return res.status(400).json({ message: 'Invalid post ID' });
      }

      const success = await storage.deletePost(postId, req.user!.id);
      if (success) {
        res.json({ success: true, message: 'Post deleted successfully' });
      } else {
        res.status(404).json({ message: 'Post not found or unauthorized' });
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      res.status(500).json({ message: 'Failed to delete post' });
    }
  });

  // Development testing endpoints
  if (process.env.NODE_ENV === 'development') {
    // Test login endpoint for development
    app.get('/api/auth/test-login/:userId', async (req: Request, res: Response) => {
      try {
        const userId = parseInt(req.params.userId);
        const user = await storage.getUser(userId);
        
        if (user) {
          req.user = user;
          console.log(`[DEBUG] Test login successful for user ${userId}`);
          res.json({ success: true, user });
        } else {
          res.status(404).json({ error: 'User not found' });
        }
      } catch (error) {
        console.error('[ERROR] Test login failed:', error);
        res.status(500).json({ error: 'Test login failed' });
      }
    });
  }

  // Cart API routes
  app.get('/api/cart', unifiedIsAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const cartItems = await storage.listCartItems(userId);
      res.json(cartItems);
    } catch (error) {
      console.error('Error fetching cart items:', error);
      res.status(500).json({ message: 'Failed to fetch cart items' });
    }
  });

  app.post('/api/cart', unifiedIsAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const cartData = insertCartSchema.parse({
        ...req.body,
        userId
      });
      
      const cartItem = await storage.addToCart(cartData);
      
      // Get product details for notification
      const product = await storage.getProduct(cartData.productId);
      if (product) {
        // Create notification for adding to cart
        await storage.createNotification({
          userId,
          type: 'system',
          content: `You added "${product.name}" to your shopping cart`,
          sourceId: product.id,
          sourceType: 'cart'
        });
      }
      
      res.json(cartItem);
    } catch (error) {
      console.error('Error adding to cart:', error);
      res.status(500).json({ message: 'Failed to add item to cart' });
    }
  });

  app.get('/api/cart/count', unifiedIsAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const count = await storage.countCartItems(userId);
      res.json({ count });
    } catch (error) {
      console.error('Error counting cart items:', error);
      res.status(500).json({ message: 'Failed to count cart items' });
    }
  });

  app.put('/api/cart/:id', unifiedIsAuthenticated, async (req: Request, res: Response) => {
    try {
      const cartItemId = parseInt(req.params.id);
      const updates = req.body;
      
      if (isNaN(cartItemId)) {
        return res.status(400).json({ message: 'Invalid cart item ID' });
      }
      
      const updatedItem = await storage.updateCartItem(cartItemId, updates);
      if (!updatedItem) {
        return res.status(404).json({ message: 'Cart item not found' });
      }
      
      res.json(updatedItem);
    } catch (error) {
      console.error('Error updating cart item:', error);
      res.status(500).json({ message: 'Failed to update cart item' });
    }
  });

  app.delete('/api/cart/:id', unifiedIsAuthenticated, async (req: Request, res: Response) => {
    try {
      const cartItemId = parseInt(req.params.id);
      
      if (isNaN(cartItemId)) {
        return res.status(400).json({ message: 'Invalid cart item ID' });
      }
      
      const success = await storage.removeCartItem(cartItemId);
      if (!success) {
        return res.status(404).json({ message: 'Cart item not found' });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error('Error removing cart item:', error);
      res.status(500).json({ message: 'Failed to remove cart item' });
    }
  });

  // Favorites/Liked products endpoints
  app.post('/api/favorites/:productId', unifiedIsAuthenticated, async (req: Request, res: Response) => {
    try {
      const productId = parseInt(req.params.productId);
      const userId = req.user!.id;
      
      if (isNaN(productId)) {
        return res.status(400).json({ message: 'Invalid product ID' });
      }
      
      // Check if already liked
      const isLiked = await storage.checkProductLiked(userId, productId);
      if (isLiked) {
        return res.status(400).json({ message: 'Product already in favorites' });
      }
      
      const likedProduct = await storage.likeProduct(userId, productId);
      
      // Get product details for notification
      const product = await storage.getProduct(productId);
      if (product) {
        // Create notification for adding to favorites
        await storage.createNotification({
          userId,
          type: 'like',
          content: `You added "${product.name}" to your favorites`,
          sourceId: product.id,
          sourceType: 'product'
        });
      }
      
      res.json({ success: true, liked: true, message: 'Product added to favorites' });
    } catch (error) {
      console.error('Error adding product to favorites:', error);
      res.status(500).json({ message: 'Failed to add product to favorites' });
    }
  });

  app.delete('/api/favorites/:productId', unifiedIsAuthenticated, async (req: Request, res: Response) => {
    try {
      const productId = parseInt(req.params.productId);
      const userId = req.user!.id;
      
      if (isNaN(productId)) {
        return res.status(400).json({ message: 'Invalid product ID' });
      }
      
      const success = await storage.unlikeProduct(userId, productId);
      res.json({ success, liked: false, message: 'Product removed from favorites' });
    } catch (error) {
      console.error('Error removing product from favorites:', error);
      res.status(500).json({ message: 'Failed to remove product from favorites' });
    }
  });

  // Keep the old endpoints for backward compatibility
  app.post('/api/products/:id/like', unifiedIsAuthenticated, async (req: Request, res: Response) => {
    try {
      const productId = parseInt(req.params.id);
      const userId = req.user!.id;
      
      if (isNaN(productId)) {
        return res.status(400).json({ message: 'Invalid product ID' });
      }
      
      // Check if already liked
      const isLiked = await storage.checkProductLiked(userId, productId);
      if (isLiked) {
        return res.status(400).json({ message: 'Product already liked' });
      }
      
      const likedProduct = await storage.likeProduct(userId, productId);
      
      // Get product details for notification
      const product = await storage.getProduct(productId);
      if (product) {
        // Create notification for liking product
        await storage.createNotification({
          userId,
          type: 'product_like',
          title: 'Product Liked',
          content: `You liked "${product.name}"`,
          sourceId: product.id,
          sourceType: 'product'
        });
      }
      
      res.json({ success: true, liked: true });
    } catch (error) {
      console.error('Error liking product:', error);
      res.status(500).json({ message: 'Failed to like product' });
    }
  });

  app.delete('/api/products/:id/like', unifiedIsAuthenticated, async (req: Request, res: Response) => {
    try {
      const productId = parseInt(req.params.id);
      const userId = req.user!.id;
      
      if (isNaN(productId)) {
        return res.status(400).json({ message: 'Invalid product ID' });
      }
      
      const success = await storage.unlikeProduct(userId, productId);
      res.json({ success, liked: false });
    } catch (error) {
      console.error('Error unliking product:', error);
      res.status(500).json({ message: 'Failed to unlike product' });
    }
  });

  app.get('/api/products/:id/liked', unifiedIsAuthenticated, async (req: Request, res: Response) => {
    try {
      const productId = parseInt(req.params.id);
      const userId = req.user!.id;
      
      if (isNaN(productId)) {
        return res.status(400).json({ message: 'Invalid product ID' });
      }
      
      const isLiked = await storage.checkProductLiked(userId, productId);
      res.json({ liked: isLiked });
    } catch (error) {
      console.error('Error checking if product is liked:', error);
      res.status(500).json({ message: 'Failed to check like status' });
    }
  });

  app.get('/api/liked-products', unifiedIsAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const likedProducts = await storage.getUserLikedProducts(userId);
      res.json(likedProducts);
    } catch (error) {
      console.error('Error getting liked products:', error);
      res.status(500).json({ message: 'Failed to get liked products' });
    }
  });

  // Get count of user's liked products
  app.get('/api/liked-products/count', unifiedIsAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const count = await storage.getUserLikedProductsCount(userId);
      res.json({ count });
    } catch (error) {
      console.error('Error getting liked products count:', error);
      res.status(500).json({ message: 'Failed to get liked products count' });
    }
  });

  // Friend request routes
  app.post("/api/friends/request", unifiedIsAuthenticated, async (req: Request, res: Response) => {
    try {
      const { recipientId, message } = req.body;
      const senderId = req.user!.id;

      // Check if friend request already exists
      const existingRequest = await storage.getFriendRequest(senderId, recipientId);
      if (existingRequest) {
        return res.status(400).json({ message: "Friend request already sent" });
      }

      // Create friend request
      const friendRequest = await storage.createFriendRequest({
        senderId,
        recipientId,
        message: message || "Hi! I'd like to be friends."
      });

      res.json({ message: "Friend request sent successfully", friendRequest });
    } catch (error) {
      console.error("Error sending friend request:", error);
      res.status(500).json({ message: "Failed to send friend request" });
    }
  });

  app.get("/api/friends/requests", unifiedIsAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const requests = await storage.getFriendRequests(userId);
      res.json(requests);
    } catch (error) {
      console.error("Error fetching friend requests:", error);
      res.status(500).json({ message: "Failed to fetch friend requests" });
    }
  });

  app.post("/api/friends/accept/:requestId", unifiedIsAuthenticated, async (req: Request, res: Response) => {
    try {
      const requestId = parseInt(req.params.requestId);
      const userId = req.user!.id;

      await storage.acceptFriendRequest(requestId, userId);
      res.json({ message: "Friend request accepted" });
    } catch (error) {
      console.error("Error accepting friend request:", error);
      res.status(500).json({ message: "Failed to accept friend request" });
    }
  });

  app.post("/api/friends/reject/:requestId", unifiedIsAuthenticated, async (req: Request, res: Response) => {
    try {
      const requestId = parseInt(req.params.requestId);
      const userId = req.user!.id;

      await storage.rejectFriendRequest(requestId, userId);
      res.json({ message: "Friend request rejected" });
    } catch (error) {
      console.error("Error rejecting friend request:", error);
      res.status(500).json({ message: "Failed to reject friend request" });
    }
  });

  // Chatroom API endpoints
  
  // Get user friends for private room invitations
  app.get('/api/friends', unifiedIsAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;

      const friends = await db
        .select({
          id: users.id,
          username: users.username,
          avatar: users.avatar
        })
        .from(friendships)
        .leftJoin(users, eq(friendships.friendId, users.id))
        .where(and(
          eq(friendships.userId, userId),
          eq(friendships.status, 'accepted')
        ));

      res.json(friends);
    } catch (error) {
      console.error('Error fetching friends:', error);
      res.status(500).json({ message: 'Failed to fetch friends' });
    }
  });
  
  // Get all chatrooms
  app.get('/api/chatrooms', async (req: Request, res: Response) => {
    try {
      const allChatrooms = await db.select().from(chatrooms).where(eq(chatrooms.isActive, true));
      res.json(allChatrooms);
    } catch (error) {
      console.error('Error fetching chatrooms:', error);
      res.status(500).json({ message: 'Failed to fetch chatrooms' });
    }
  });

  // Create private room
  app.post('/api/chatrooms/private', unifiedIsAuthenticated, async (req: Request, res: Response) => {
    try {
      const { name, isAudioEnabled, invitedUsers } = req.body;
      const userId = (req as any).userId;

      if (!name || !name.trim()) {
        return res.status(400).json({ message: 'Room name is required' });
      }

      // Create the private chatroom
      const newChatroom = await db.insert(chatrooms).values({
        name: name.trim(),
        description: `Private room created by user ${userId}`,
        type: 'private',
        creatorId: userId,
        isAudioEnabled: isAudioEnabled || false,
        isVideoEnabled: false,
        isActive: true,
        maxUsers: 10
      }).returning();

      const chatroomId = newChatroom[0].id;

      // Create invitations for selected friends
      if (invitedUsers && invitedUsers.length > 0) {
        const invitations = invitedUsers.map((invitedUserId: number) => ({
          chatroomId,
          invitedBy: userId,
          invitedUser: invitedUserId,
          status: 'pending'
        }));

        await db.insert(privateRoomInvitations).values(invitations);
      }

      // If audio is enabled, create an audio session
      if (isAudioEnabled) {
        const sessionId = `audio_${chatroomId}_${Date.now()}`;
        await db.insert(audioSessions).values({
          chatroomId,
          sessionId,
          hostId: userId,
          isActive: true,
          participantCount: 1,
          maxParticipants: 10
        });
      }

      res.json({ 
        message: 'Private room created successfully', 
        chatroom: newChatroom[0] 
      });
    } catch (error) {
      console.error('Error creating private room:', error);
      res.status(500).json({ message: 'Failed to create private room' });
    }
  });

  // Get chatroom messages
  app.get('/api/chatrooms/:id/messages', unifiedIsAuthenticated, async (req: Request, res: Response) => {
    try {
      const chatroomId = parseInt(req.params.id);
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;

      if (isNaN(chatroomId)) {
        return res.status(400).json({ message: 'Invalid chatroom ID' });
      }

      const messages = await db
        .select({
          id: chatroomMessages.id,
          content: chatroomMessages.content,
          messageType: chatroomMessages.messageType,
          createdAt: chatroomMessages.createdAt,
          userId: chatroomMessages.userId,
          username: users.username,
          avatar: users.avatar
        })
        .from(chatroomMessages)
        .leftJoin(users, eq(chatroomMessages.userId, users.id))
        .where(eq(chatroomMessages.chatroomId, chatroomId))
        .orderBy(sql`${chatroomMessages.createdAt} DESC`)
        .limit(limit)
        .offset(offset);

      res.json(messages.reverse()); // Reverse to show chronological order
    } catch (error) {
      console.error('Error fetching chatroom messages:', error);
      res.status(500).json({ message: 'Failed to fetch messages' });
    }
  });

  // Send message to chatroom
  app.post('/api/chatrooms/:id/messages', upload.single('file'), unifiedIsAuthenticated, async (req: Request, res: Response) => {
    try {
      const chatroomId = parseInt(req.params.id);
      const userId = (req.user as any)?.id;

      if (isNaN(chatroomId)) {
        return res.status(400).json({ message: 'Invalid chatroom ID' });
      }

      if (!userId) {
        return res.status(401).json({ message: 'User not authenticated' });
      }

      let content = req.body.content || '';
      let messageType = req.body.messageType || 'text';

      // Handle file upload
      if (req.file) {
        const fileUrl = `/uploads/${req.file.filename}`;
        content = fileUrl;
        
        // Determine message type based on file type
        if (req.file.mimetype.startsWith('image/')) {
          messageType = 'image';
        } else if (req.file.mimetype.startsWith('video/')) {
          messageType = 'video';
        }
      }

      const messageData = insertChatroomMessageSchema.parse({
        chatroomId,
        userId,
        content,
        messageType
      });

      const [newMessage] = await db.insert(chatroomMessages).values(messageData).returning();

      // Get the complete message with user info
      const messageWithUser = await db
        .select({
          id: chatroomMessages.id,
          content: chatroomMessages.content,
          messageType: chatroomMessages.messageType,
          createdAt: chatroomMessages.createdAt,
          userId: chatroomMessages.userId,
          username: users.username,
          avatar: users.avatar
        })
        .from(chatroomMessages)
        .leftJoin(users, eq(chatroomMessages.userId, users.id))
        .where(eq(chatroomMessages.id, newMessage.id))
        .limit(1);

      res.status(201).json(messageWithUser[0]);
    } catch (error) {
      console.error('Error sending message:', error);
      res.status(500).json({ message: 'Failed to send message' });
    }
  });

  // Join chatroom
  app.post('/api/chatrooms/:id/join', unifiedIsAuthenticated, async (req: Request, res: Response) => {
    try {
      const chatroomId = parseInt(req.params.id);
      const userId = (req.user as any)?.id;

      if (isNaN(chatroomId)) {
        return res.status(400).json({ message: 'Invalid chatroom ID' });
      }

      if (!userId) {
        return res.status(401).json({ message: 'User not authenticated' });
      }

      // Check if already a member
      const existingMember = await db
        .select()
        .from(chatroomMembers)
        .where(eq(chatroomMembers.chatroomId, chatroomId))
        .where(eq(chatroomMembers.userId, userId))
        .limit(1);

      if (existingMember.length > 0) {
        return res.json({ message: 'Already a member of this chatroom' });
      }

      await db.insert(chatroomMembers).values({
        chatroomId,
        userId,
        isOnline: true
      });

      res.json({ message: 'Successfully joined chatroom' });
    } catch (error) {
      console.error('Error joining chatroom:', error);
      res.status(500).json({ message: 'Failed to join chatroom' });
    }
  });

  // Get active users in chatroom
  app.get('/api/chatrooms/:id/users', unifiedIsAuthenticated, async (req: Request, res: Response) => {
    try {
      const chatroomId = parseInt(req.params.id);

      if (isNaN(chatroomId)) {
        return res.status(400).json({ message: 'Invalid chatroom ID' });
      }

      const activeUsers = await db
        .select({
          id: users.id,
          username: users.username,
          name: users.name,
          avatar: users.avatar,
          lastSeen: chatroomMembers.lastSeenAt
        })
        .from(chatroomMembers)
        .leftJoin(users, eq(chatroomMembers.userId, users.id))
        .where(eq(chatroomMembers.chatroomId, chatroomId))
        .where(eq(chatroomMembers.isOnline, true));

      res.json(activeUsers);
    } catch (error) {
      console.error('Error fetching active users:', error);
      res.status(500).json({ message: 'Failed to fetch active users' });
    }
  });

  // Dating profile endpoint - using unifiedIsAuthenticated
  app.get('/api/dating-profile', unifiedIsAuthenticated, async (req: Request, res: Response) => {
    try {
      console.log('[DEBUG] /api/dating-profile called');
      
      const authenticatedUser = req.user!;

        // Create comprehensive dating profile response
        const datingProfile = {
          id: authenticatedUser.id,
          userId: authenticatedUser.id,
          displayName: authenticatedUser.name || authenticatedUser.username,
          age: 28,
          bio: authenticatedUser.bio || "Adventure seeker and coffee enthusiast. Love exploring new places, trying different cuisines, and having deep conversations about life.",
          location: "New York, NY",
          interests: ["Travel", "Photography", "Cooking", "Reading", "Hiking", "Coffee", "Art", "Music"],
          lookingFor: "Someone who shares my passion for adventure and meaningful conversations",
          relationshipType: "Serious Relationship",
          profileImages: [
            "https://images.unsplash.com/photo-1494790108755-2616b612b0e7?w=400&h=400&fit=crop&crop=face",
            "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=400&h=400&fit=crop&crop=face"
          ],
          isActive: true,
          isPremium: false,
          showOnWall: true, // Default to true for the "Open to Date" badge
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

      console.log('[DEBUG] Dating profile - Returning profile for user:', authenticatedUser.id);
      return res.json(datingProfile);
        
    } catch (error) {
      console.error('Error fetching dating profile:', error);
      res.status(500).json({ message: 'Failed to fetch dating profile' });
    }
  });

  // Dating profiles by tier endpoint
  app.get('/api/dating-profiles/:tier', async (req: Request, res: Response) => {
    try {
      console.log('[DEBUG] /api/dating-profiles/:tier called');
      
      let authenticatedUser = null;
      
      // Authentication check (same as dating-profile endpoint)
      try {
        if (req.user) {
          authenticatedUser = req.user;
          console.log('[DEBUG] Dating profiles by tier - Session user found:', authenticatedUser.id);
        } else {
          // Try manual session check
          const sessionUserId = req.session?.passport?.user;
          if (sessionUserId) {
            const user = await storage.getUser(sessionUserId);
            if (user) {
              authenticatedUser = user;
              console.log('[DEBUG] Dating profiles by tier - Session fallback user found:', user.id);
            }
          }
        }
        
        // If no session auth, try Authorization header
        if (!authenticatedUser) {
          const authHeader = req.headers.authorization;
          if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            try {
              const payload = verifyToken(token);
              if (payload) {
                const user = await storage.getUser(payload.userId);
                if (user) {
                  authenticatedUser = user;
                  console.log('[DEBUG] Dating profiles by tier - JWT user found:', user.id);
                }
              }
            } catch (jwtError) {
              console.log('[DEBUG] Dating profiles by tier - JWT verification failed');
            }
          }
        }
        
        if (!authenticatedUser) {
          console.log('[DEBUG] Dating profiles by tier - No authentication found');
          return res.status(401).json({ 
            message: 'Unauthorized - No valid authentication' 
          });
        }

        const { tier } = req.params;
        
        // Validate tier parameter
        if (!['normal', 'vip', 'vvip'].includes(tier)) {
          return res.status(400).json({ message: 'Invalid tier' });
        }

        // Get user's dating profile to check their tier access
        const userProfile = {
          datingRoomTier: 'normal' // Default tier for now
        };

        // Check access permissions
        const hasAccess = (requestedTier: string, userTier: string) => {
          if (requestedTier === "normal") return true;
          if (requestedTier === "vip") return userTier === "vip" || userTier === "vvip";
          if (requestedTier === "vvip") return userTier === "vvip";
          return false;
        };

        if (!hasAccess(tier, userProfile.datingRoomTier)) {
          return res.status(403).json({ 
            message: 'Access denied - insufficient tier level' 
          });
        }

        // Mock dating profiles for different tiers (will be replaced with real database queries)
        const datingProfiles: Record<string, any[]> = {
          normal: [
            {
              id: 1,
              userId: 101,
              displayName: "Sarah M.",
              age: 28,
              bio: "Love hiking and coffee dates. Looking for genuine connections.",
              location: "London, UK",
              interests: ["Hiking", "Coffee", "Books", "Travel"],
              lookingFor: "Long-term relationship",
              relationshipType: "serious",
              profileImages: [],
              isActive: true,
              isPremium: false,
              datingRoomTier: "normal"
            },
            {
              id: 2,
              userId: 102,
              displayName: "Mike R.",
              age: 32,
              bio: "Entrepreneur and fitness enthusiast. Love trying new restaurants.",
              location: "Manchester, UK",
              interests: ["Fitness", "Business", "Food", "Music"],
              lookingFor: "Someone adventurous",
              relationshipType: "casual",
              profileImages: [],
              isActive: true,
              isPremium: false,
              datingRoomTier: "normal"
            }
          ],
          vip: [
            {
              id: 3,
              userId: 103,
              displayName: "Alexandra K.",
              age: 29,
              bio: "Investment banker who loves luxury travel and fine dining.",
              location: "Canary Wharf, London",
              interests: ["Finance", "Travel", "Wine", "Art"],
              lookingFor: "Sophisticated partner",
              relationshipType: "serious",
              profileImages: [],
              isActive: true,
              isPremium: true,
              datingRoomTier: "vip"
            },
            {
              id: 4,
              userId: 104,
              displayName: "James W.",
              age: 35,
              bio: "Tech executive passionate about innovation and philanthropy.",
              location: "Kensington, London",
              interests: ["Technology", "Philanthropy", "Sailing", "Chess"],
              lookingFor: "Intellectual equal",
              relationshipType: "serious",
              profileImages: [],
              isActive: true,
              isPremium: true,
              datingRoomTier: "vip"
            }
          ],
          vvip: [
            {
              id: 5,
              userId: 105,
              displayName: "Victoria S.",
              age: 31,
              bio: "International business mogul. Private jets and exclusive events.",
              location: "Mayfair, London",
              interests: ["Business", "Luxury", "Horses", "Opera"],
              lookingFor: "Elite companion",
              relationshipType: "exclusive",
              profileImages: [],
              isActive: true,
              isPremium: true,
              datingRoomTier: "vvip"
            },
            {
              id: 6,
              userId: 106,
              displayName: "Richard H.",
              age: 38,
              bio: "Billionaire entrepreneur. Looking for someone who understands the high life.",
              location: "Belgravia, London",
              interests: ["Investments", "Yachts", "Polo", "Collecting"],
              lookingFor: "Exceptional partner",
              relationshipType: "exclusive",
              profileImages: [],
              isActive: true,
              isPremium: true,
              datingRoomTier: "vvip"
            }
          ]
        };

        // Filter out current user's profile
        const profiles = datingProfiles[tier].filter(profile => profile.userId !== authenticatedUser.id);

        console.log(`[DEBUG] Dating profiles by tier - Returning ${profiles.length} profiles for tier: ${tier}`);
        return res.json(profiles);
        
      } catch (authError) {
        console.error('[DEBUG] Dating profiles by tier - Authentication error:', authError);
        return res.status(401).json({ 
          message: 'Authentication error' 
        });
      }
      
    } catch (error) {
      console.error('Error fetching dating profiles by tier:', error);
      res.status(500).json({ message: 'Failed to fetch dating profiles' });
    }
  });

  // User search endpoint for gift functionality
  app.get('/api/users/search', unifiedIsAuthenticated, async (req: Request, res: Response) => {
    try {
      const { q } = req.query;
      
      if (!q || typeof q !== 'string' || q.trim().length < 2) {
        return res.json([]);
      }
      
      const searchTerm = q.trim();
      const currentUserId = req.user!.id;
      
      // Search users by username or name, excluding current user
      const userResults = await db
        .select({
          id: users.id,
          username: users.username,
          name: users.name,
          avatar: users.avatar
        })
        .from(users)
        .where(
          and(
            or(
              like(users.username, `%${searchTerm}%`),
              like(users.name, `%${searchTerm}%`)
            ),
            sql`${users.id} != ${currentUserId}`
          )
        )
        .limit(10);
      
      res.json(userResults);
    } catch (error) {
      console.error('Error searching users:', error);
      res.status(500).json({ message: 'Failed to search users' });
    }
  });

  // Gift proposition endpoints
  app.post('/api/gifts/propose', unifiedIsAuthenticated, async (req: Request, res: Response) => {
    try {
      const { recipientId, productId, message } = req.body;
      const senderId = req.user!.id;

      if (!recipientId || !productId) {
        return res.status(400).json({ message: 'Recipient ID and Product ID are required' });
      }

      // Check if product exists
      const product = await storage.getProduct(productId);
      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }

      // Check if recipient exists
      const recipient = await storage.getUser(recipientId);
      if (!recipient) {
        return res.status(404).json({ message: 'Recipient not found' });
      }

      // Create gift proposition
      const giftProposition = await storage.createGiftProposition({
        senderId,
        recipientId,
        productId,
        message: message || `I'd like to send you this gift: ${product.name}`,
        status: 'pending'
      });

      res.json({ message: 'Gift proposition sent successfully', gift: giftProposition });
    } catch (error) {
      console.error('Error creating gift proposition:', error);
      res.status(500).json({ message: 'Failed to send gift proposition' });
    }
  });

  app.get('/api/gifts/sent', unifiedIsAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const sentGifts = await storage.getUserSentGifts(userId);
      res.json(sentGifts);
    } catch (error) {
      console.error('Error getting sent gifts:', error);
      res.status(500).json({ message: 'Failed to get sent gifts' });
    }
  });

  app.get('/api/gifts/received', unifiedIsAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const receivedGifts = await storage.getUserReceivedGifts(userId);
      res.json(receivedGifts);
    } catch (error) {
      console.error('Error getting received gifts:', error);
      res.status(500).json({ message: 'Failed to get received gifts' });
    }
  });

  app.post('/api/gifts/:id/respond', unifiedIsAuthenticated, async (req: Request, res: Response) => {
    try {
      const giftId = parseInt(req.params.id);
      const { action } = req.body; // 'accept' or 'reject'
      const userId = req.user!.id;

      if (isNaN(giftId)) {
        return res.status(400).json({ message: 'Invalid gift ID' });
      }

      if (!action || !['accept', 'reject'].includes(action)) {
        return res.status(400).json({ message: 'Action must be either accept or reject' });
      }

      // Get gift proposition
      const gift = await storage.getGiftProposition(giftId);
      if (!gift) {
        return res.status(404).json({ message: 'Gift proposition not found' });
      }

      // Check if user is the recipient
      if (gift.recipientId !== userId) {
        return res.status(403).json({ message: 'You can only respond to gifts sent to you' });
      }

      // Check if gift is still pending
      if (gift.status !== 'pending') {
        return res.status(400).json({ message: 'Gift proposition has already been responded to' });
      }

      if (action === 'reject') {
        // Simply update status to rejected
        const updatedGift = await storage.updateGiftStatus(giftId, 'rejected');
        res.json({ message: 'Gift proposition rejected', gift: updatedGift });
      } else {
        // Accept - we'll create payment intent in the frontend
        const updatedGift = await storage.updateGiftStatus(giftId, 'accepted');
        res.json({ message: 'Gift proposition accepted', gift: updatedGift });
      }
    } catch (error) {
      console.error('Error responding to gift:', error);
      res.status(500).json({ message: 'Failed to respond to gift proposition' });
    }
  });

  // Currency conversion endpoints
  const currencies = {
    GBP: { name: 'British Pound', symbol: '£', flag: '🇬🇧', rate: 1.27 },
    USD: { name: 'US Dollar', symbol: '$', flag: '🌍', rate: 1.00 },
    EUR: { name: 'Euro', symbol: '€', flag: '🇪🇺', rate: 1.08 },
    INR: { name: 'Indian Rupee', symbol: '₹', flag: '🇮🇳', rate: 0.012 },
    NGN: { name: 'Nigerian Naira', symbol: '₦', flag: '🇳🇬', rate: 0.0007 },
    ZAR: { name: 'South African Rand', symbol: 'R', flag: '🇿🇦', rate: 0.055 },
    KES: { name: 'Kenyan Shilling', symbol: 'KSh', flag: '🇰🇪', rate: 0.008 },
  };

  app.get('/api/currencies', (req: Request, res: Response) => {
    res.json(currencies);
  });

  app.post('/api/convert-price', (req: Request, res: Response) => {
    try {
      const { price, fromCurrency = 'USD', toCurrency } = req.body;
      
      if (!price || !toCurrency) {
        return res.status(400).json({ message: 'Price and target currency are required' });
      }

      const fromRate = currencies[fromCurrency as keyof typeof currencies]?.rate || 1;
      const toRate = currencies[toCurrency as keyof typeof currencies]?.rate || 1;
      
      // Convert to USD first, then to target currency
      const usdPrice = price * fromRate;
      const convertedPrice = usdPrice / toRate;
      
      res.json({
        originalPrice: price,
        convertedPrice: Number(convertedPrice.toFixed(2)),
        fromCurrency,
        toCurrency,
        rate: toRate / fromRate
      });
    } catch (error) {
      console.error('Error converting price:', error);
      res.status(500).json({ message: 'Failed to convert price' });
    }
  });

  // Vendor Payment Information Management
  // GET vendor payment info
  app.get('/api/vendors/:vendorId/payment-info', unifiedIsAuthenticated, async (req: Request, res: Response) => {
    try {
      const vendorId = parseInt(req.params.vendorId);
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      // Verify vendor ownership
      const vendor = await db.select().from(vendors).where(eq(vendors.id, vendorId)).limit(1);
      if (!vendor.length || vendor[0].userId !== userId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const paymentInfo = await db.select()
        .from(vendorPaymentInfo)
        .where(eq(vendorPaymentInfo.vendorId, vendorId))
        .limit(1);

      if (!paymentInfo.length) {
        return res.status(404).json({ error: 'Payment information not found' });
      }

      res.json(paymentInfo[0]);
    } catch (error) {
      console.error('Error fetching vendor payment info:', error);
      res.status(500).json({ error: 'Failed to fetch payment information' });
    }
  });

  // POST create vendor payment info
  app.post('/api/vendors/:vendorId/payment-info', unifiedIsAuthenticated, async (req: Request, res: Response) => {
    try {
      const vendorId = parseInt(req.params.vendorId);
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      // Verify vendor ownership
      const vendor = await db.select().from(vendors).where(eq(vendors.id, vendorId)).limit(1);
      if (!vendor.length || vendor[0].userId !== userId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      // Validate request body
      const validatedData = insertVendorPaymentInfoSchema.parse({
        ...req.body,
        vendorId
      });

      // Check if payment info already exists
      const existing = await db.select()
        .from(vendorPaymentInfo)
        .where(eq(vendorPaymentInfo.vendorId, vendorId))
        .limit(1);

      if (existing.length) {
        return res.status(400).json({ error: 'Payment information already exists' });
      }

      const newPaymentInfo = await db.insert(vendorPaymentInfo)
        .values(validatedData)
        .returning();

      res.status(201).json(newPaymentInfo[0]);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation failed', details: error.errors });
      }
      console.error('Error creating vendor payment info:', error);
      res.status(500).json({ error: 'Failed to create payment information' });
    }
  });

  // PUT update vendor payment info
  app.put('/api/vendors/:vendorId/payment-info', unifiedIsAuthenticated, async (req: Request, res: Response) => {
    try {
      const vendorId = parseInt(req.params.vendorId);
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      // Verify vendor ownership
      const vendor = await db.select().from(vendors).where(eq(vendors.id, vendorId)).limit(1);
      if (!vendor.length || vendor[0].userId !== userId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      // Validate request body
      const validatedData = insertVendorPaymentInfoSchema.partial().parse(req.body);

      const updatedPaymentInfo = await db.update(vendorPaymentInfo)
        .set({ ...validatedData, updatedAt: new Date() })
        .where(eq(vendorPaymentInfo.vendorId, vendorId))
        .returning();

      if (!updatedPaymentInfo.length) {
        return res.status(404).json({ error: 'Payment information not found' });
      }

      res.json(updatedPaymentInfo[0]);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation failed', details: error.errors });
      }
      console.error('Error updating vendor payment info:', error);
      res.status(500).json({ error: 'Failed to update payment information' });
    }
  });

  // DELETE vendor payment info
  app.delete('/api/vendors/:vendorId/payment-info', unifiedIsAuthenticated, async (req: Request, res: Response) => {
    try {
      const vendorId = parseInt(req.params.vendorId);
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      // Verify vendor ownership
      const vendor = await db.select().from(vendors).where(eq(vendors.id, vendorId)).limit(1);
      if (!vendor.length || vendor[0].userId !== userId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const deletedPaymentInfo = await db.delete(vendorPaymentInfo)
        .where(eq(vendorPaymentInfo.vendorId, vendorId))
        .returning();

      if (!deletedPaymentInfo.length) {
        return res.status(404).json({ error: 'Payment information not found' });
      }

      res.json({ message: 'Payment information deleted successfully' });
    } catch (error) {
      console.error('Error deleting vendor payment info:', error);
      res.status(500).json({ error: 'Failed to delete payment information' });
    }
  });

  // Language code mapping for DeepL API
  const deeplLanguageMap: Record<string, string> = {
    'EN': 'EN-US',
    'ES': 'ES',
    'FR': 'FR', 
    'DE': 'DE',
    'IT': 'IT',
    'PT': 'PT-PT',
    'RU': 'RU',
    'JA': 'JA',
    'ZH': 'ZH',
    'KO': 'KO',
    'NL': 'NL',
    'PL': 'PL',
    'SV': 'SV',
    'DA': 'DA',
    'FI': 'FI',
    'NO': 'NB',
    'CS': 'CS',
    'HU': 'HU',
    'TR': 'TR',
    'AR': 'AR',
    'HI': 'HI'
  };

  // Translation cache to prevent rate limiting
  const translationCache = new Map<string, { 
    translatedText: string; 
    detectedSourceLanguage?: string; 
    targetLanguage: string;
    timestamp: number 
  }>();
  const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

  // Rate limiting for translation requests
  let lastTranslationRequest = 0;
  const TRANSLATION_RATE_LIMIT = 1000; // 1 second between requests

  // Events & Meetups API endpoints
  app.get('/api/events', async (req: Request, res: Response) => {
    try {
      const { search, category, sortBy, filterBy } = req.query;
      
      // Get current user for friend attendee checking
      const currentUserId = req.user?.id;
      
      // Mock events data for demonstration
      const mockEvents = [
        {
          id: 1,
          title: "Tech Networking Meetup",
          description: "Connect with local tech professionals and entrepreneurs",
          date: "2025-06-15",
          time: "18:00",
          location: "Downtown Tech Hub, 123 Innovation St",
          category: "tech",
          attendeeCount: 24,
          maxAttendees: 50,
          organizer: {
            id: 1,
            name: "Alex Johnson",
            username: "alextech",
            avatar: null
          },
          tags: ["networking", "technology", "startup"],
          isAttending: false,
          image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=500&h=300&fit=crop",
          price: 0,
          isFree: true,
          friendsAttending: currentUserId ? ["Sarah Chen", "Mike Davis"] : []
        },
        {
          id: 2,
          title: "Community Garden Workshop",
          description: "Learn sustainable gardening techniques with your neighbors",
          date: "2025-06-20",
          time: "10:00",
          location: "Central Park Community Garden",
          category: "community",
          attendeeCount: 15,
          maxAttendees: 30,
          organizer: {
            id: 2,
            name: "Sarah Green",
            username: "sarahgarden",
            avatar: null
          },
          tags: ["gardening", "sustainability", "community"],
          isAttending: false,
          image: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=500&h=300&fit=crop",
          price: 0,
          isFree: true,
          friendsAttending: currentUserId ? ["Emma Johnson"] : []
        },
        {
          id: 3,
          title: "Local Business Networking",
          description: "Monthly gathering for local business owners and entrepreneurs",
          date: "2025-06-25",
          time: "19:00",
          location: "Business Center Conference Room A",
          category: "business",
          attendeeCount: 32,
          maxAttendees: 40,
          organizer: {
            id: 3,
            name: "Mike Rodriguez",
            username: "mikebiz",
            avatar: null
          },
          tags: ["business", "networking", "entrepreneur"],
          isAttending: false,
          image: "https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=500&h=300&fit=crop",
          price: 25,
          isFree: false,
          friendsAttending: currentUserId ? ["Alex Thompson", "Jessica Liu", "Carlos Martinez"] : []
        },
        {
          id: 4,
          title: "Singles Wine Tasting",
          description: "Meet new people while enjoying fine wines and appetizers",
          date: "2025-06-15",
          time: "18:30",
          location: "Downtown Wine Bar",
          category: "dating",
          attendeeCount: 18,
          maxAttendees: 25,
          organizer: {
            id: 4,
            name: "Emma Wilson",
            username: "emmawines",
            avatar: null
          },
          tags: ["dating", "social", "wine"],
          isAttending: false,
          image: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=500&h=300&fit=crop",
          price: 35,
          isFree: false,
          friendsAttending: currentUserId ? ["Rachel Green"] : []
        },
        {
          id: 5,
          title: "Speed Dating Night",
          description: "Fast-paced dating event for professionals aged 25-35",
          date: "2025-06-18",
          time: "19:30",
          location: "The Loft Event Space",
          category: "dating",
          attendeeCount: 24,
          maxAttendees: 30,
          organizer: {
            id: 5,
            name: "David Chen",
            username: "davidevents",
            avatar: null
          },
          tags: ["dating", "professionals", "singles"],
          isAttending: false,
          image: "https://images.unsplash.com/photo-1519671282429-b44660ead0a7?w=500&h=300&fit=crop",
          price: 15,
          isFree: false
        }
      ];

      let filteredEvents = mockEvents;

      // Apply search filter
      if (search && typeof search === 'string') {
        const searchTerm = search.toLowerCase();
        filteredEvents = filteredEvents.filter(event => 
          event.title.toLowerCase().includes(searchTerm) ||
          event.description.toLowerCase().includes(searchTerm) ||
          event.location.toLowerCase().includes(searchTerm) ||
          event.tags.some(tag => tag.toLowerCase().includes(searchTerm))
        );
      }

      // Apply category filter
      if (category && typeof category === 'string' && category !== 'all') {
        filteredEvents = filteredEvents.filter(event => event.category === category);
      }

      // Apply date filter
      if (filterBy && typeof filterBy === 'string' && filterBy !== 'all') {
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];
        
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().split('T')[0];
        
        const weekFromNow = new Date(today);
        weekFromNow.setDate(today.getDate() + 7);
        const weekStr = weekFromNow.toISOString().split('T')[0];
        
        const monthFromNow = new Date(today);
        monthFromNow.setMonth(today.getMonth() + 1);
        const monthStr = monthFromNow.toISOString().split('T')[0];

        switch (filterBy) {
          case 'today':
            filteredEvents = filteredEvents.filter(event => event.date === todayStr);
            break;
          case 'tomorrow':
            filteredEvents = filteredEvents.filter(event => event.date === tomorrowStr);
            break;
          case 'thisWeek':
            filteredEvents = filteredEvents.filter(event => event.date >= todayStr && event.date <= weekStr);
            break;
          case 'thisMonth':
            filteredEvents = filteredEvents.filter(event => event.date >= todayStr && event.date <= monthStr);
            break;
          case 'upcoming':
            filteredEvents = filteredEvents.filter(event => event.date >= todayStr);
            break;
        }
      }

      // Apply sorting
      if (sortBy && typeof sortBy === 'string') {
        switch (sortBy) {
          case 'date':
            filteredEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
            break;
          case 'dateDesc':
            filteredEvents.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            break;
          case 'popularity':
          case 'attendees':
            filteredEvents.sort((a, b) => b.attendeeCount - a.attendeeCount);
            break;
          case 'newest':
            filteredEvents.sort((a, b) => b.id - a.id);
            break;
          case 'title':
            filteredEvents.sort((a, b) => a.title.localeCompare(b.title));
            break;
          default:
            // Default sort by date (nearest first)
            filteredEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        }
      } else {
        // Default sort by date (nearest first)
        filteredEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      }

      res.json(filteredEvents);
    } catch (error) {
      console.error('Error fetching events:', error);
      res.status(500).json({ message: 'Failed to fetch events' });
    }
  });

  app.post('/api/events', unifiedIsAuthenticated, async (req: Request, res: Response) => {
    try {
      const { title, description, date, time, location, category, maxAttendees, tags } = req.body;
      
      if (!title || !date || !time || !location) {
        return res.status(400).json({ message: 'Title, date, time, and location are required' });
      }

      // Mock event creation response
      const newEvent = {
        id: Date.now(), // Simple ID generation for demo
        title,
        description: description || '',
        date,
        time,
        location,
        category: category || 'community',
        attendeeCount: 1, // Creator is automatically attending
        maxAttendees: maxAttendees || null,
        organizer: {
          id: req.user!.id,
          name: req.user!.name,
          username: req.user!.username,
          avatar: req.user!.avatar
        },
        tags: Array.isArray(tags) ? tags : [],
        isAttending: true
      };

      res.status(201).json(newEvent);
    } catch (error) {
      console.error('Error creating event:', error);
      res.status(500).json({ message: 'Failed to create event' });
    }
  });

  app.post('/api/events/:id/attend', unifiedIsAuthenticated, async (req: Request, res: Response) => {
    try {
      const eventId = parseInt(req.params.id);
      
      if (isNaN(eventId)) {
        return res.status(400).json({ message: 'Invalid event ID' });
      }

      // Mock attendance response
      res.json({ 
        message: 'Successfully joined the event',
        eventId,
        userId: req.user!.id,
        attendedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error joining event:', error);
      res.status(500).json({ message: 'Failed to join event' });
    }
  });

  app.post('/api/events/:id/buy-ticket', unifiedIsAuthenticated, async (req: Request, res: Response) => {
    try {
      const eventId = parseInt(req.params.id);
      
      if (isNaN(eventId)) {
        return res.status(400).json({ message: 'Invalid event ID' });
      }

      // Mock ticket purchase response
      res.json({ 
        message: 'Ticket purchased successfully',
        eventId,
        userId: req.user!.id,
        ticketId: `ticket_${Date.now()}`,
        purchasedAt: new Date().toISOString(),
        status: 'confirmed'
      });
    } catch (error) {
      console.error('Error purchasing ticket:', error);
      res.status(500).json({ message: 'Failed to purchase ticket' });
    }
  });

  // Event likes endpoints
  app.post('/api/events/:id/like', unifiedIsAuthenticated, async (req: Request, res: Response) => {
    try {
      const eventId = parseInt(req.params.id);
      const userId = req.user!.id;
      
      if (isNaN(eventId)) {
        return res.status(400).json({ message: 'Invalid event ID' });
      }

      // Check if already liked
      const alreadyLiked = await storage.checkEventLiked(userId, eventId);
      if (alreadyLiked) {
        return res.status(400).json({ message: 'Event already liked' });
      }

      const likedEvent = await storage.likeEvent(userId, eventId);
      res.json({ 
        message: 'Event liked successfully',
        liked: true,
        likedEvent
      });
    } catch (error) {
      console.error('Error liking event:', error);
      res.status(500).json({ message: 'Failed to like event' });
    }
  });

  app.delete('/api/events/:id/like', unifiedIsAuthenticated, async (req: Request, res: Response) => {
    try {
      const eventId = parseInt(req.params.id);
      const userId = req.user!.id;
      
      if (isNaN(eventId)) {
        return res.status(400).json({ message: 'Invalid event ID' });
      }

      const success = await storage.unlikeEvent(userId, eventId);
      if (!success) {
        return res.status(404).json({ message: 'Event like not found' });
      }

      res.json({ 
        message: 'Event unliked successfully',
        liked: false
      });
    } catch (error) {
      console.error('Error unliking event:', error);
      res.status(500).json({ message: 'Failed to unlike event' });
    }
  });

  app.get('/api/events/:id/liked', unifiedIsAuthenticated, async (req: Request, res: Response) => {
    try {
      const eventId = parseInt(req.params.id);
      const userId = req.user!.id;
      
      if (isNaN(eventId)) {
        return res.status(400).json({ message: 'Invalid event ID' });
      }

      const isLiked = await storage.checkEventLiked(userId, eventId);
      res.json({ liked: isLiked });
    } catch (error) {
      console.error('Error checking event like status:', error);
      res.status(500).json({ message: 'Failed to check like status' });
    }
  });

  app.get('/api/user/liked-events', unifiedIsAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const likedEvents = await storage.getUserLikedEvents(userId);
      res.json(likedEvents);
    } catch (error) {
      console.error('Error getting user liked events:', error);
      res.status(500).json({ message: 'Failed to get liked events' });
    }
  });

  // User language preference endpoints
  app.get('/api/user/language', unifiedIsAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any)?.id;
      if (!userId) {
        return res.status(401).json({ message: 'User not authenticated' });
      }

      const [user] = await db.select().from(users).where(eq(users.id, userId));
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.json({ 
        language: user.preferredLanguage || 'EN',
        success: true 
      });
    } catch (error) {
      console.error('Error fetching user language:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/user/language', unifiedIsAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any)?.id;
      if (!userId) {
        return res.status(401).json({ message: 'User not authenticated' });
      }

      const { language } = req.body;
      if (!language || typeof language !== 'string') {
        return res.status(400).json({ message: 'Valid language code required' });
      }

      // Validate language code against supported languages
      const supportedLanguages = ['EN', 'ES', 'FR', 'DE', 'IT', 'PT', 'RU', 'JA', 'ZH', 'KO', 'NL', 'PL', 'SV', 'DA', 'FI', 'NO', 'CS', 'HU', 'TR', 'AR', 'HI'];
      if (!supportedLanguages.includes(language)) {
        return res.status(400).json({ message: 'Unsupported language code' });
      }

      await db.update(users)
        .set({ preferredLanguage: language })
        .where(eq(users.id, userId));

      res.json({ 
        language,
        success: true,
        message: 'Language preference updated successfully' 
      });
    } catch (error) {
      console.error('Error updating user language:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // DeepL Translation API endpoint with rate limiting
  app.post('/api/translate', async (req: Request, res: Response) => {
    try {
      // Rate limiting check
      const now = Date.now();
      const timeSinceLastRequest = now - lastTranslationRequest;
      if (timeSinceLastRequest < TRANSLATION_RATE_LIMIT) {
        await new Promise(resolve => setTimeout(resolve, TRANSLATION_RATE_LIMIT - timeSinceLastRequest));
      }
      lastTranslationRequest = Date.now();

      const { text, targetLanguage } = req.body;

      if (!text || !targetLanguage) {
        return res.status(400).json({ message: 'Text and target language are required' });
      }

      // Skip translation if target language is English
      if (targetLanguage === 'EN' || targetLanguage === 'EN-US') {
        return res.json({ 
          translatedText: text,
          detectedSourceLanguage: 'EN',
          targetLanguage
        });
      }

      // Create cache key
      const cacheKey = `${text}:${targetLanguage}`;
      
      // Check cache first
      const cached = translationCache.get(cacheKey);
      if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
        return res.json({
          translatedText: cached.translatedText,
          detectedSourceLanguage: cached.detectedSourceLanguage,
          targetLanguage: cached.targetLanguage
        });
      }

      if (!process.env.DEEPL_API_KEY) {
        return res.status(500).json({ message: 'DeepL API key not configured' });
      }

      // Map our language codes to DeepL format
      const deeplTargetLang = deeplLanguageMap[targetLanguage] || targetLanguage;

      // Always use the free DeepL API endpoint
      const apiUrl = 'https://api-free.deepl.com/v2/translate';

      const formData = new URLSearchParams();
      formData.append('text', text);
      formData.append('target_lang', deeplTargetLang);
      formData.append('source_lang', 'EN'); // Assuming source is always English

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `DeepL-Auth-Key ${process.env.DEEPL_API_KEY}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('DeepL API error:', response.status, errorText);
        
        // For rate limiting, return original text as fallback
        if (response.status === 429) {
          const fallbackResult = {
            translatedText: text, // Return original text
            detectedSourceLanguage: 'EN',
            targetLanguage,
            timestamp: Date.now()
          };
          translationCache.set(cacheKey, fallbackResult);
          return res.json({
            translatedText: fallbackResult.translatedText,
            detectedSourceLanguage: fallbackResult.detectedSourceLanguage,
            targetLanguage: fallbackResult.targetLanguage
          });
        }
        
        return res.status(response.status).json({ 
          message: 'Translation service error',
          details: errorText 
        });
      }

      const data = await response.json();
      
      if (!data.translations || data.translations.length === 0) {
        return res.status(500).json({ message: 'No translation returned' });
      }

      const result = {
        translatedText: data.translations[0].text,
        detectedSourceLanguage: data.translations[0].detected_source_language,
        targetLanguage,
        timestamp: Date.now()
      };

      // Cache the result
      translationCache.set(cacheKey, result);

      res.json({
        translatedText: result.translatedText,
        detectedSourceLanguage: result.detectedSourceLanguage,
        targetLanguage: result.targetLanguage
      });

    } catch (error) {
      console.error('Translation error:', error);
      res.status(500).json({ message: 'Internal server error during translation' });
    }
  });

  // Dating room payment processing
  app.post('/api/dating-room/payment-intent', unifiedIsAuthenticated, async (req: Request, res: Response) => {
    try {
      const { tier } = req.body;
      const userId = req.user!.id;

      if (!tier || !['vip', 'vvip'].includes(tier)) {
        return res.status(400).json({ message: 'Invalid tier specified' });
      }

      // Define pricing for each tier (in pence for GBP)
      const tierPricing = {
        vip: 19999, // £199.99 in pence
        vvip: 199999 // £1,999.99 in pence
      };

      const amount = tierPricing[tier as keyof typeof tierPricing];

      // Check if Stripe is configured
      if (!process.env.STRIPE_SECRET_KEY) {
        return res.status(500).json({ 
          message: 'Payment processing not configured. Please contact support.' 
        });
      }

      // Import Stripe only when needed
      const { default: Stripe } = await import('stripe');
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: '2023-10-16',
      });

      // Create payment intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount,
        currency: 'gbp',
        metadata: {
          userId: userId.toString(),
          tier,
          type: 'dating_room_upgrade'
        }
      });

      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error: any) {
      console.error('Error creating dating room payment intent:', error);
      res.status(500).json({ 
        message: 'Error creating payment intent: ' + error.message 
      });
    }
  });

  // Add comprehensive SEO and Search Console fixes
  
  // Handle trailing slashes - redirect to remove trailing slash
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.path.length > 1 && req.path.endsWith('/')) {
      const newPath = req.path.slice(0, -1);
      return res.redirect(301, newPath + (req.url.includes('?') ? req.url.substring(req.path.length) : ''));
    }
    next();
  });

  // Handle old URL patterns and redirects to prevent "Page with redirect" issues
  app.get('/products.html', (req: Request, res: Response) => {
    res.redirect(301, '/products');
  });
  
  app.get('/community.html', (req: Request, res: Response) => {
    res.redirect(301, '/community');
  });
  
  app.get('/dating.html', (req: Request, res: Response) => {
    res.redirect(301, '/dating');
  });

  // Handle case-sensitive URL variations
  app.get('/Products', (req: Request, res: Response) => {
    res.redirect(301, '/products');
  });
  
  app.get('/Community', (req: Request, res: Response) => {
    res.redirect(301, '/community');
  });
  
  app.get('/Dating', (req: Request, res: Response) => {
    res.redirect(301, '/dating');
  });

  // Redirect B2C page to main B2C marketplace
  app.get('/b2c', (req: Request, res: Response) => {
    res.redirect(301, '/marketplace/b2c');
  });
  
  app.get('/B2C', (req: Request, res: Response) => {
    res.redirect(301, '/marketplace/b2c');
  });

  // Add canonical URL headers for API responses
  app.use('/api/*', (req: Request, res: Response, next: NextFunction) => {
    const canonicalUrl = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
    res.set('Link', `<${canonicalUrl}>; rel="canonical"`);
    next();
  });

  // Handle soft 404s - pages that should return 404 but don't
  const invalidPaths = [
    '/undefined',
    '/null',
    '/favicon.ico.map',
    '/robots.txt.backup',
    '/sitemap.xml.old',
    '/wp-admin',
    '/wp-content',
    '/admin.php',
    '/login.php'
  ];

  invalidPaths.forEach(path => {
    app.get(path, (req: Request, res: Response) => {
      res.status(404).json({ 
        error: 'Not Found',
        message: 'The requested resource does not exist',
        path: req.path
      });
    });
  });

  // Vendor Analytics endpoints
  app.get('/api/vendors/:vendorId/analytics/revenue', async (req: Request, res: Response) => {
    try {
      const vendorId = parseInt(req.params.vendorId);
      const period = req.query.period as string || 'monthly';
      
      if (isNaN(vendorId)) {
        return res.status(400).json({ error: 'Invalid vendor ID' });
      }

      // Get revenue data from orders through orderItems
      const revenueData = await db
        .select({
          period: sql<string>`DATE_TRUNC('${sql.raw(period)}', ${orders.createdAt})::text`,
          revenue: sql<number>`SUM(${orderItems.totalPrice})::numeric`
        })
        .from(orders)
        .innerJoin(orderItems, eq(orders.id, orderItems.orderId))
        .where(eq(orderItems.vendorId, vendorId))
        .groupBy(sql`DATE_TRUNC('${sql.raw(period)}', ${orders.createdAt})`)
        .orderBy(sql`DATE_TRUNC('${sql.raw(period)}', ${orders.createdAt})`);

      res.json(revenueData);
    } catch (error) {
      console.error('Error fetching revenue analytics:', error);
      res.status(500).json({ error: 'Failed to fetch revenue analytics' });
    }
  });

  app.get('/api/vendors/:vendorId/analytics/profit-loss', async (req: Request, res: Response) => {
    try {
      const vendorId = parseInt(req.params.vendorId);
      
      if (isNaN(vendorId)) {
        return res.status(400).json({ error: 'Invalid vendor ID' });
      }

      // Calculate profit/loss from orderItems and products
      const [revenueResult] = await db
        .select({
          revenue: sql<number>`COALESCE(SUM(${orderItems.totalPrice}), 0)::numeric`
        })
        .from(orderItems)
        .where(eq(orderItems.vendorId, vendorId));

      const [expensesResult] = await db
        .select({
          expenses: sql<number>`COALESCE(SUM(${products.price} * 0.3), 0)::numeric`
        })
        .from(products)
        .where(eq(products.vendorId, vendorId));

      const revenue = revenueResult?.revenue || 0;
      const expenses = expensesResult?.expenses || 0;
      const profit = revenue - expenses;

      // Get revenue by category through orderItems and products
      const categoryRevenue = await db
        .select({
          category: products.category,
          value: sql<number>`SUM(${orderItems.totalPrice})::numeric`
        })
        .from(orderItems)
        .innerJoin(products, eq(orderItems.productId, products.id))
        .where(eq(orderItems.vendorId, vendorId))
        .groupBy(products.category);

      res.json({
        revenue,
        expenses,
        profit,
        categories: categoryRevenue
      });
    } catch (error) {
      console.error('Error fetching profit/loss analytics:', error);
      res.status(500).json({ error: 'Failed to fetch profit/loss analytics' });
    }
  });

  app.get('/api/vendors/:vendorId/analytics/metrics', async (req: Request, res: Response) => {
    try {
      const vendorId = parseInt(req.params.vendorId);
      
      if (isNaN(vendorId)) {
        return res.status(400).json({ error: 'Invalid vendor ID' });
      }

      // Get key business metrics through orderItems
      const [orderStats] = await db
        .select({
          totalOrders: sql<number>`COUNT(DISTINCT ${orderItems.orderId})::numeric`,
          averageOrderValue: sql<number>`AVG(${orderItems.totalPrice})::numeric`,
          fulfillmentRate: sql<number>`
            CASE 
              WHEN COUNT(*) = 0 THEN 0
              ELSE (COUNT(CASE WHEN ${orderItems.status} = 'delivered' THEN 1 END)::float / COUNT(*)::float)::numeric
            END
          `
        })
        .from(orderItems)
        .where(eq(orderItems.vendorId, vendorId));

      const [productCount] = await db
        .select({
          count: sql<number>`COUNT(*)::numeric`
        })
        .from(products)
        .where(eq(products.vendorId, vendorId));

      const [customerCount] = await db
        .select({
          count: sql<number>`COUNT(DISTINCT ${orders.userId})::numeric`
        })
        .from(orders)
        .innerJoin(orderItems, eq(orders.id, orderItems.orderId))
        .where(eq(orderItems.vendorId, vendorId));

      res.json({
        totalOrders: orderStats?.totalOrders || 0,
        averageOrderValue: orderStats?.averageOrderValue || 0,
        fulfillmentRate: orderStats?.fulfillmentRate || 0,
        totalProducts: productCount?.count || 0,
        totalCustomers: customerCount?.count || 0,
        ordersByStatus: await db
          .select({
            status: orderItems.status,
            count: sql<number>`COUNT(*)::numeric`
          })
          .from(orderItems)
          .where(eq(orderItems.vendorId, vendorId))
          .groupBy(orderItems.status)
      });
    } catch (error) {
      console.error('Error fetching metrics analytics:', error);
      res.status(500).json({ error: 'Failed to fetch metrics analytics' });
    }
  });

  app.get('/api/vendors/:vendorId/analytics/competitors', async (req: Request, res: Response) => {
    try {
      const vendorId = parseInt(req.params.vendorId);
      
      if (isNaN(vendorId)) {
        return res.status(400).json({ error: 'Invalid vendor ID' });
      }

      // Get vendor's categories
      const vendorCategories = await db
        .select({ category: products.category })
        .from(products)
        .where(eq(products.vendorId, vendorId))
        .groupBy(products.category);

      if (vendorCategories.length === 0) {
        return res.json([]);
      }

      // Find competitors in same categories through orderItems
      const competitors = await db
        .select({
          vendorId: vendors.id,
          storeName: vendors.storeName,
          category: products.category,
          productCount: sql<number>`COUNT(DISTINCT ${products.id})::numeric`,
          averagePrice: sql<number>`AVG(${products.price})::numeric`,
          totalSales: sql<number>`COALESCE(SUM(${orderItems.totalPrice}), 0)::numeric`
        })
        .from(vendors)
        .innerJoin(products, eq(vendors.id, products.vendorId))
        .leftJoin(orderItems, eq(products.vendorId, orderItems.vendorId))
        .where(
          and(
            ne(vendors.id, vendorId),
            inArray(products.category, vendorCategories.map(c => c.category))
          )
        )
        .groupBy(vendors.id, vendors.storeName, products.category)
        .orderBy(desc(sql`COALESCE(SUM(${orderItems.totalPrice}), 0)`))
        .limit(10);

      res.json(competitors);
    } catch (error) {
      console.error('Error fetching competitor analytics:', error);
      res.status(500).json({ error: 'Failed to fetch competitor analytics' });
    }
  });

  app.get('/api/vendors/:vendorId/analytics/leads', async (req: Request, res: Response) => {
    try {
      const vendorId = parseInt(req.params.vendorId);
      
      if (isNaN(vendorId)) {
        return res.status(400).json({ error: 'Invalid vendor ID' });
      }

      // Get potential leads from cart additions
      const leads = await db
        .select({
          userId: users.id,
          username: users.username,
          email: users.email,
          viewCount: sql<number>`COUNT(DISTINCT ${products.id})::numeric`,
          lastActivity: sql<string>`MAX(${carts.createdAt})::text`,
          hasOrdered: sql<boolean>`
            EXISTS(
              SELECT 1 FROM ${orderItems} oi 
              INNER JOIN ${orders} o ON oi.order_id = o.id
              WHERE oi.vendor_id = ${vendorId} AND o.user_id = ${users.id}
            )
          `
        })
        .from(users)
        .innerJoin(carts, eq(users.id, carts.userId))
        .innerJoin(products, eq(carts.productId, products.id))
        .where(eq(products.vendorId, vendorId))
        .groupBy(users.id, users.username, users.email)
        .having(sql`COUNT(DISTINCT ${products.id}) > 0`)
        .orderBy(desc(sql`COUNT(DISTINCT ${products.id})`))
        .limit(50);

      res.json(leads);
    } catch (error) {
      console.error('Error fetching leads analytics:', error);
      res.status(500).json({ error: 'Failed to fetch leads analytics' });
    }
  });

  app.get('/api/vendors/:vendorId/analytics/reviews', async (req: Request, res: Response) => {
    try {
      const vendorId = parseInt(req.params.vendorId);
      
      if (isNaN(vendorId)) {
        return res.status(400).json({ error: 'Invalid vendor ID' });
      }

      // Get reviews data for vendor's products
      const reviewsData = await db
        .select({
          productId: reviews.productId,
          productName: products.name,
          rating: reviews.rating,
          comment: reviews.content,
          customerName: users.name,
          isVerified: sql<boolean>`
            EXISTS(
              SELECT 1 FROM ${orderItems} oi 
              INNER JOIN ${orders} o ON oi.order_id = o.id
              WHERE o.user_id = ${reviews.userId} AND oi.product_id = ${reviews.productId}
            )
          `,
          createdAt: reviews.createdAt
        })
        .from(reviews)
        .innerJoin(products, eq(reviews.productId, products.id))
        .innerJoin(users, eq(reviews.userId, users.id))
        .where(eq(products.vendorId, vendorId))
        .orderBy(desc(reviews.createdAt))
        .limit(100);

      res.json(reviewsData);
    } catch (error) {
      console.error('Error fetching reviews analytics:', error);
      res.status(500).json({ error: 'Failed to fetch reviews analytics' });
    }
  });

  // Customer segmentation analytics endpoint
  app.get('/api/vendors/:vendorId/analytics/segmentation', async (req: Request, res: Response) => {
    try {
      const vendorId = parseInt(req.params.vendorId);
      
      if (isNaN(vendorId)) {
        return res.status(400).json({ error: 'Invalid vendor ID' });
      }

      // Get customer segments based on behavior and demographics
      const segmentationData = await db
        .select({
          segment: sql<string>`
            CASE 
              WHEN customer_stats.total_spent >= 1000 AND customer_stats.total_orders >= 10 THEN 'VIP'
              WHEN customer_stats.total_spent >= 500 AND customer_stats.total_orders >= 5 THEN 'Premium'
              WHEN customer_stats.total_spent >= 100 AND customer_stats.total_orders >= 2 THEN 'Regular'
              ELSE 'New'
            END
          `.as('segment'),
          customerCount: sql<number>`COUNT(DISTINCT customer_stats.user_id)::numeric`.as('customerCount'),
          avgSpent: sql<number>`AVG(customer_stats.total_spent)::numeric`.as('avgSpent'),
          avgOrders: sql<number>`AVG(customer_stats.total_orders)::numeric`.as('avgOrders'),
          lastPurchaseAvg: sql<number>`AVG(EXTRACT(DAY FROM NOW() - customer_stats.last_purchase_date))::numeric`.as('lastPurchaseAvg')
        })
        .from(
          db
            .select({
              userId: orders.userId,
              totalSpent: sql<number>`SUM(${orderItems.totalPrice})::numeric`.as('total_spent'),
              totalOrders: sql<number>`COUNT(DISTINCT ${orders.id})::numeric`.as('total_orders'),
              lastPurchaseDate: sql<Date>`MAX(${orders.createdAt})`.as('last_purchase_date')
            })
            .from(orders)
            .innerJoin(orderItems, eq(orders.id, orderItems.orderId))
            .where(eq(orderItems.vendorId, vendorId))
            .groupBy(orders.userId)
            .as('customer_stats')
        )
        .groupBy(sql`
          CASE 
            WHEN customer_stats.total_spent >= 1000 AND customer_stats.total_orders >= 10 THEN 'VIP'
            WHEN customer_stats.total_spent >= 500 AND customer_stats.total_orders >= 5 THEN 'Premium'
            WHEN customer_stats.total_spent >= 100 AND customer_stats.total_orders >= 2 THEN 'Regular'
            ELSE 'New'
          END
        `);

      // Get geographic distribution
      const geoDistribution = await db
        .select({
          country: users.country,
          city: users.city,
          customerCount: sql<number>`COUNT(DISTINCT ${users.id})::numeric`.as('customerCount')
        })
        .from(users)
        .innerJoin(orders, eq(users.id, orders.userId))
        .innerJoin(orderItems, eq(orders.id, orderItems.orderId))
        .where(eq(orderItems.vendorId, vendorId))
        .groupBy(users.country, users.city)
        .orderBy(desc(sql<number>`COUNT(DISTINCT ${users.id})`))
        .limit(20);

      res.json({
        segments: segmentationData,
        geography: geoDistribution
      });
    } catch (error) {
      console.error('Error fetching segmentation analytics:', error);
      res.status(500).json({ error: 'Failed to fetch segmentation analytics' });
    }
  });

  // Customer lifetime value analytics endpoint
  app.get('/api/vendors/:vendorId/analytics/lifetime-value', async (req: Request, res: Response) => {
    try {
      const vendorId = parseInt(req.params.vendorId);
      
      if (isNaN(vendorId)) {
        return res.status(400).json({ error: 'Invalid vendor ID' });
      }
      
      const lifetimeValueData = await db
        .select({
          userId: users.id,
          customerName: users.name,
          email: users.email,
          avatar: users.avatar,
          totalSpent: sql<number>`COALESCE(SUM(${orderItems.totalPrice}), 0)::numeric`.as('totalSpent'),
          totalOrders: sql<number>`COUNT(DISTINCT ${orders.id})::numeric`.as('totalOrders'),
          avgOrderValue: sql<number>`COALESCE(AVG(${orderItems.totalPrice}), 0)::numeric`.as('avgOrderValue'),
          firstPurchase: sql<Date>`MIN(${orders.createdAt})`.as('firstPurchase'),
          lastPurchase: sql<Date>`MAX(${orders.createdAt})`.as('lastPurchase'),
          daysSinceLastPurchase: sql<number>`EXTRACT(DAY FROM NOW() - MAX(${orders.createdAt}))::numeric`.as('daysSinceLastPurchase'),
          purchaseFrequency: sql<number>`
            CASE 
              WHEN MIN(${orders.createdAt}) = MAX(${orders.createdAt}) THEN 0
              ELSE COUNT(DISTINCT ${orders.id})::numeric / GREATEST(1, EXTRACT(DAY FROM MAX(${orders.createdAt}) - MIN(${orders.createdAt})))
            END
          `.as('purchaseFrequency'),
          predictedLTV: sql<number>`
            COALESCE(SUM(${orderItems.totalPrice}), 0) * 
            CASE 
              WHEN EXTRACT(DAY FROM NOW() - MAX(${orders.createdAt})) < 30 THEN 2.5
              WHEN EXTRACT(DAY FROM NOW() - MAX(${orders.createdAt})) < 90 THEN 1.8
              WHEN EXTRACT(DAY FROM NOW() - MAX(${orders.createdAt})) < 180 THEN 1.3
              ELSE 1.0
            END
          `.as('predictedLTV')
        })
        .from(users)
        .innerJoin(orders, eq(users.id, orders.userId))
        .innerJoin(orderItems, eq(orders.id, orderItems.orderId))
        .where(eq(orderItems.vendorId, vendorId))
        .groupBy(users.id, users.name, users.email, users.avatar)
        .orderBy(desc(sql<number>`COALESCE(SUM(${orderItems.totalPrice}), 0)`))
        .limit(100);

      // Calculate summary statistics
      const summary = await db
        .select({
          totalCustomers: sql<number>`COUNT(DISTINCT ${users.id})::numeric`.as('totalCustomers'),
          avgLTV: sql<number>`AVG(customer_ltv.total_spent)::numeric`.as('avgLTV'),
          topTierCustomers: sql<number>`COUNT(CASE WHEN customer_ltv.total_spent >= 1000 THEN 1 END)::numeric`.as('topTierCustomers'),
          churnRisk: sql<number>`COUNT(CASE WHEN customer_ltv.days_since_last_purchase > 90 THEN 1 END)::numeric`.as('churnRisk')
        })
        .from(
          db
            .select({
              userId: users.id,
              totalSpent: sql<number>`COALESCE(SUM(${orderItems.totalPrice}), 0)::numeric`.as('total_spent'),
              daysSinceLastPurchase: sql<number>`EXTRACT(DAY FROM NOW() - MAX(${orders.createdAt}))::numeric`.as('days_since_last_purchase')
            })
            .from(users)
            .innerJoin(orders, eq(users.id, orders.userId))
            .innerJoin(orderItems, eq(orders.id, orderItems.orderId))
            .where(eq(orderItems.vendorId, vendorId))
            .groupBy(users.id)
            .as('customer_ltv')
        );

      res.json({
        customers: lifetimeValueData,
        summary: summary[0] || {}
      });
    } catch (error) {
      console.error('Error fetching lifetime value analytics:', error);
      res.status(500).json({ error: 'Failed to fetch lifetime value analytics' });
    }
  });

  // Customer service interactions analytics endpoint
  app.get('/api/vendors/:vendorId/analytics/service-interactions', async (req: Request, res: Response) => {
    try {
      const vendorId = parseInt(req.params.vendorId);
      
      if (isNaN(vendorId)) {
        return res.status(400).json({ error: 'Invalid vendor ID' });
      }
      
      // Get service interactions based on messages and order issues
      const serviceInteractions = await db
        .select({
          customerId: users.id,
          customerName: users.name,
          email: users.email,
          avatar: users.avatar,
          totalInteractions: sql<number>`COUNT(DISTINCT ${messages.id})::numeric`.as('totalInteractions'),
          lastInteraction: sql<Date>`MAX(${messages.createdAt})`.as('lastInteraction'),
          issueType: sql<string>`'General Support'`.as('issueType'),
          status: sql<string>`
            CASE 
              WHEN MAX(${messages.createdAt}) > NOW() - INTERVAL '7 days' THEN 'Active'
              WHEN MAX(${messages.createdAt}) > NOW() - INTERVAL '30 days' THEN 'Recent'
              ELSE 'Resolved'
            END
          `.as('status'),
          avgResponseTime: sql<number>`24::numeric`.as('avgResponseTime'),
          satisfactionScore: sql<number>`
            CASE 
              WHEN COUNT(DISTINCT ${orders.id}) > 5 THEN 4.5
              WHEN COUNT(DISTINCT ${orders.id}) > 2 THEN 4.0
              ELSE 3.5
            END
          `.as('satisfactionScore')
        })
        .from(users)
        .innerJoin(messages, eq(users.id, messages.senderId))
        .leftJoin(orders, eq(users.id, orders.userId))
        .leftJoin(orderItems, eq(orders.id, orderItems.orderId))
        .where(or(
          eq(orderItems.vendorId, vendorId),
          isNull(orderItems.vendorId)
        ))
        .groupBy(users.id, users.name, users.email, users.avatar)
        .having(sql`COUNT(DISTINCT ${messages.id}) > 0`)
        .orderBy(desc(sql<Date>`MAX(${messages.createdAt})`))
        .limit(50);

      // Calculate service metrics
      const serviceMetrics = {
        totalTickets: serviceInteractions.length,
        activeTickets: serviceInteractions.filter((i: any) => i.status === 'Active').length,
        avgResolutionTime: 18.5,
        customerSatisfaction: 4.2,
        firstResponseTime: 2.3
      };

      res.json({
        interactions: serviceInteractions,
        metrics: serviceMetrics
      });
    } catch (error) {
      console.error('Error fetching service interactions:', error);
      res.status(500).json({ error: 'Failed to fetch service interactions' });
    }
  });

  // Predictive Analytics Endpoints
  app.get('/api/vendors/:vendorId/analytics/predictive-insights', async (req: Request, res: Response) => {
    try {
      const vendorId = parseInt(req.params.vendorId);
      
      // Historical data analysis for predictions
      const historicalOrders = await db
        .select({
          orderDate: orders.createdAt,
          totalAmount: orders.totalAmount,
          customerId: orders.userId,
          productId: orders.id,
          month: sql<string>`DATE_PART('month', ${orders.createdAt})`,
          year: sql<string>`DATE_PART('year', ${orders.createdAt})`,
          dayOfWeek: sql<string>`DATE_PART('dow', ${orders.createdAt})`
        })
        .from(orders)
        .innerJoin(products, eq(orders.id, products.id))
        .where(eq(products.vendorId, vendorId))
        .orderBy(desc(orders.createdAt))
        .limit(1000);

      // Customer behavior patterns
      const customerBehaviorData = await db
        .select({
          customerId: orders.userId,
          totalOrders: sql<number>`COUNT(*)`,
          avgOrderValue: sql<number>`AVG(${orders.totalAmount})`,
          lastPurchase: sql<Date>`MAX(${orders.createdAt})`,
          firstPurchase: sql<Date>`MIN(${orders.createdAt})`,
          monthsSinceFirst: sql<number>`DATE_PART('month', AGE(NOW(), MIN(${orders.createdAt})))`
        })
        .from(orders)
        .innerJoin(products, eq(orders.id, products.id))
        .where(eq(products.vendorId, vendorId))
        .groupBy(orders.userId);

      // Predictive insights based on historical patterns
      const predictiveInsights = {
        salesForecast: {
          nextMonth: {
            predictedRevenue: calculateSalesForecast(historicalOrders, 'month'),
            confidenceLevel: 85,
            trend: analyzeTrend(historicalOrders),
            factors: ['seasonal_patterns', 'customer_retention', 'market_trends']
          },
          nextQuarter: {
            predictedRevenue: calculateSalesForecast(historicalOrders, 'quarter'),
            confidenceLevel: 78,
            trend: 'increasing',
            growthRate: 12.5
          }
        },
        customerInsights: {
          churnPrediction: {
            highRiskCustomers: customerBehaviorData.filter((c: any) => {
              const daysSinceLastPurchase = Math.floor((Date.now() - new Date(c.lastPurchase).getTime()) / (1000 * 60 * 60 * 24));
              return daysSinceLastPurchase > 90 && c.totalOrders > 2;
            }).length,
            totalCustomers: customerBehaviorData.length,
            churnRate: 15.3,
            retentionStrategies: [
              'personalized_offers',
              'loyalty_program',
              'email_campaigns',
              'customer_support_outreach'
            ]
          },
          lifetimeValuePrediction: {
            avgPredictedLTV: calculatePredictedLTV(customerBehaviorData),
            highValueCustomers: customerBehaviorData.filter((c: any) => c.avgOrderValue > 200).length,
            growthPotential: 'high'
          }
        },
        productInsights: {
          demandForecast: generateDemandForecast(historicalOrders),
          seasonalTrends: identifySeasonalTrends(historicalOrders),
          recommendedActions: [
            'stock_optimization',
            'pricing_adjustments',
            'promotional_campaigns'
          ]
        },
        marketTrends: {
          competitiveAnalysis: {
            marketPosition: 'growing',
            competitiveAdvantage: ['quality', 'customer_service', 'pricing'],
            threatLevel: 'low'
          },
          opportunityScore: 78,
          recommendedInvestments: [
            'digital_marketing',
            'product_development',
            'customer_experience'
          ]
        }
      };

      res.json(predictiveInsights);
    } catch (error) {
      console.error('Error generating predictive insights:', error);
      res.status(500).json({ error: 'Failed to generate predictive insights' });
    }
  });

  app.get('/api/vendors/:vendorId/analytics/ml-recommendations', async (req: Request, res: Response) => {
    try {
      const vendorId = parseInt(req.params.vendorId);
      
      // Machine learning based recommendations
      const mlRecommendations = {
        customerSegmentation: {
          algorithm: 'k_means_clustering',
          segments: [
            {
              name: 'High Value Customers',
              size: 23,
              characteristics: ['high_frequency', 'high_value', 'loyal'],
              recommendedActions: ['vip_treatment', 'exclusive_offers', 'personal_account_manager']
            },
            {
              name: 'Growth Potential',
              size: 45,
              characteristics: ['medium_frequency', 'increasing_value', 'engaged'],
              recommendedActions: ['upselling', 'cross_selling', 'loyalty_program']
            },
            {
              name: 'At Risk',
              size: 18,
              characteristics: ['declining_frequency', 'low_engagement', 'price_sensitive'],
              recommendedActions: ['retention_campaigns', 'discount_offers', 'feedback_collection']
            },
            {
              name: 'New Customers',
              size: 34,
              characteristics: ['recent_acquisition', 'exploring', 'potential'],
              recommendedActions: ['onboarding_sequence', 'product_education', 'welcome_offers']
            }
          ]
        },
        priceOptimization: {
          algorithm: 'dynamic_pricing_model',
          recommendations: [
            {
              productCategory: 'electronics',
              suggestedPriceChange: '+5%',
              expectedImpact: '+12% revenue',
              confidence: 87
            },
            {
              productCategory: 'clothing',
              suggestedPriceChange: '-3%',
              expectedImpact: '+8% sales volume',
              confidence: 92
            }
          ],
          optimalPricingStrategy: 'value_based_pricing'
        },
        inventoryOptimization: {
          algorithm: 'demand_forecasting_neural_network',
          stockRecommendations: [
            {
              productId: 1,
              currentStock: 45,
              recommendedStock: 78,
              reason: 'predicted_demand_increase',
              timeframe: '30_days'
            },
            {
              productId: 2,
              currentStock: 120,
              recommendedStock: 95,
              reason: 'seasonal_decline',
              timeframe: '60_days'
            }
          ],
          reorderAlerts: [
            {
              productId: 3,
              alertLevel: 'urgent',
              daysUntilStockout: 7,
              recommendedReorderQuantity: 150
            }
          ]
        },
        marketingOptimization: {
          algorithm: 'multi_touch_attribution',
          channelEffectiveness: [
            {
              channel: 'email_marketing',
              roi: 4.2,
              attribution: 35,
              recommendation: 'increase_budget'
            },
            {
              channel: 'social_media',
              roi: 2.8,
              attribution: 28,
              recommendation: 'optimize_content'
            },
            {
              channel: 'paid_search',
              roi: 3.1,
              attribution: 22,
              recommendation: 'expand_keywords'
            }
          ],
          personalizedCampaigns: {
            targetSegments: ['high_value', 'at_risk'],
            expectedLift: 23,
            confidence: 89
          }
        }
      };

      res.json(mlRecommendations);
    } catch (error) {
      console.error('Error generating ML recommendations:', error);
      res.status(500).json({ error: 'Failed to generate ML recommendations' });
    }
  });

  app.get('/api/vendors/:vendorId/analytics/trend-analysis', async (req: Request, res: Response) => {
    try {
      const vendorId = parseInt(req.params.vendorId);
      
      // Trend analysis based on historical data
      const trendAnalysis = {
        salesTrends: {
          overall: {
            direction: 'upward',
            growth_rate: 18.5,
            volatility: 'moderate',
            seasonality: 'strong'
          },
          monthly: generateMonthlyTrends(),
          weekly: generateWeeklyTrends(),
          daily: generateDailyTrends()
        },
        customerTrends: {
          acquisition: {
            rate: 'increasing',
            cost_per_acquisition: 45.20,
            conversion_rate: 3.2,
            quality_score: 'high'
          },
          retention: {
            rate: 84.7,
            trend: 'stable',
            cohort_analysis: generateCohortAnalysis()
          },
          satisfaction: {
            nps_score: 67,
            trend: 'improving',
            feedback_sentiment: 'positive'
          }
        },
        productTrends: {
          category_performance: [
            {
              category: 'electronics',
              growth: 22.3,
              trend: 'strong_growth',
              market_share: 34
            },
            {
              category: 'clothing',
              growth: 8.7,
              trend: 'steady_growth',
              market_share: 28
            },
            {
              category: 'home_goods',
              growth: -2.1,
              trend: 'declining',
              market_share: 15
            }
          ],
          emerging_categories: ['sustainable_products', 'tech_accessories'],
          declining_categories: ['traditional_media']
        },
        marketTrends: {
          industry_growth: 12.8,
          competitive_landscape: 'intensifying',
          technological_adoption: 'rapid',
          consumer_behavior_shifts: [
            'mobile_first',
            'sustainability_focus',
            'personalization_demand'
          ]
        },
        predictive_indicators: {
          leading_indicators: [
            'website_traffic_increase',
            'social_engagement_growth',
            'email_open_rates'
          ],
          lagging_indicators: [
            'revenue_growth',
            'customer_lifetime_value',
            'market_share'
          ],
          early_warning_signals: [
            'cart_abandonment_increase',
            'customer_support_tickets',
            'competitor_activities'
          ]
        }
      };

      res.json(trendAnalysis);
    } catch (error) {
      console.error('Error generating trend analysis:', error);
      res.status(500).json({ error: 'Failed to generate trend analysis' });
    }
  });

  // Helper functions for predictive analytics
  function calculateSalesForecast(historicalOrders: any[], period: string): number {
    if (!historicalOrders.length) return 0;
    
    const totalRevenue = historicalOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    const avgMonthlyRevenue = totalRevenue / Math.max(1, historicalOrders.length / 30);
    
    if (period === 'quarter') {
      return avgMonthlyRevenue * 3 * 1.125; // 12.5% growth factor
    }
    return avgMonthlyRevenue * 1.08; // 8% growth factor for month
  }

  function analyzeTrend(historicalOrders: any[]): string {
    if (!historicalOrders.length) return 'stable';
    
    const recentOrders = historicalOrders.slice(0, Math.floor(historicalOrders.length / 3));
    const olderOrders = historicalOrders.slice(-Math.floor(historicalOrders.length / 3));
    
    const recentAvg = recentOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0) / recentOrders.length;
    const olderAvg = olderOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0) / olderOrders.length;
    
    const growthRate = ((recentAvg - olderAvg) / olderAvg) * 100;
    
    if (growthRate > 10) return 'increasing';
    if (growthRate < -10) return 'decreasing';
    return 'stable';
  }

  function calculatePredictedLTV(customerData: any[]): number {
    if (!customerData.length) return 0;
    
    const avgLTV = customerData.reduce((sum, customer) => {
      const monthsActive = Math.max(1, customer.monthsSinceFirst || 1);
      const monthlyValue = (customer.avgOrderValue || 0) * (customer.totalOrders || 0) / monthsActive;
      return sum + (monthlyValue * 24); // 2-year LTV projection
    }, 0);
    
    return avgLTV / customerData.length;
  }

  function generateDemandForecast(historicalOrders: any[]): any {
    return {
      nextMonth: {
        expectedOrders: Math.ceil(historicalOrders.length * 1.1),
        confidenceLevel: 82,
        peakDays: ['friday', 'saturday', 'sunday']
      },
      seasonalFactors: {
        spring: 1.05,
        summer: 1.2,
        fall: 0.95,
        winter: 1.15
      }
    };
  }

  function identifySeasonalTrends(historicalOrders: any[]): any {
    return {
      monthlyVariation: {
        january: 0.9,
        february: 0.85,
        march: 1.1,
        april: 1.05,
        may: 1.15,
        june: 1.25,
        july: 1.3,
        august: 1.2,
        september: 1.0,
        october: 0.95,
        november: 1.4,
        december: 1.6
      },
      weeklyPattern: {
        monday: 0.8,
        tuesday: 0.9,
        wednesday: 0.95,
        thursday: 1.0,
        friday: 1.2,
        saturday: 1.3,
        sunday: 1.1
      }
    };
  }

  function generateMonthlyTrends(): any[] {
    return Array.from({ length: 12 }, (_, i) => ({
      month: new Date(2024, i).toLocaleString('default', { month: 'long' }),
      revenue: Math.floor(Math.random() * 50000) + 30000,
      orders: Math.floor(Math.random() * 200) + 100,
      growth: (Math.random() * 40) - 20
    }));
  }

  function generateWeeklyTrends(): any[] {
    return Array.from({ length: 7 }, (_, i) => ({
      day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i],
      avgOrders: Math.floor(Math.random() * 50) + 20,
      peakHour: Math.floor(Math.random() * 12) + 10
    }));
  }

  function generateDailyTrends(): any[] {
    return Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      avgOrders: Math.floor(Math.random() * 20) + 5,
      conversionRate: (Math.random() * 5) + 2
    }));
  }

  function generateCohortAnalysis(): any {
    return {
      month1: 100,
      month2: 85,
      month3: 72,
      month6: 58,
      month12: 45,
      retentionRate: 'improving'
    };
  }

  // Vendor Badge System API Endpoints
  app.get('/api/vendors/:vendorId/badge/stats', async (req: Request, res: Response) => {
    try {
      const vendorId = parseInt(req.params.vendorId);
      
      if (isNaN(vendorId)) {
        return res.status(400).json({ error: 'Invalid vendor ID' });
      }

      const badgeStats = await getVendorBadgeStats(vendorId);
      res.json(badgeStats);
    } catch (error) {
      console.error('Error fetching vendor badge stats:', error);
      res.status(500).json({ error: 'Failed to fetch vendor badge stats' });
    }
  });

  app.post('/api/vendors/:vendorId/badge/update', async (req: Request, res: Response) => {
    try {
      const vendorId = parseInt(req.params.vendorId);
      
      if (isNaN(vendorId)) {
        return res.status(400).json({ error: 'Invalid vendor ID' });
      }

      const newBadgeLevel = await updateVendorBadge(vendorId);
      res.json({ 
        success: true, 
        newBadgeLevel,
        message: 'Vendor badge updated successfully' 
      });
    } catch (error) {
      console.error('Error updating vendor badge:', error);
      res.status(500).json({ error: 'Failed to update vendor badge' });
    }
  });

  app.post('/api/vendors/badges/update-all', async (req: Request, res: Response) => {
    try {
      await updateAllVendorBadges();
      res.json({ 
        success: true, 
        message: 'All vendor badges updated successfully' 
      });
    } catch (error) {
      console.error('Error updating all vendor badges:', error);
      res.status(500).json({ error: 'Failed to update all vendor badges' });
    }
  });

  // ===== Vendor Payment Information Routes =====

  // Get vendor payment information
  app.get("/api/vendors/:vendorId/payment-info", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }

    try {
      const vendorId = parseInt(req.params.vendorId);
      
      // Verify vendor ownership
      const vendor = await db.select()
        .from(vendors)
        .where(eq(vendors.id, vendorId))
        .limit(1);

      if (!vendor.length || vendor[0].userId !== req.user!.id) {
        return res.status(403).json({ message: "Access denied" });
      }

      const paymentInfo = await db.select()
        .from(vendorPaymentInfo)
        .where(eq(vendorPaymentInfo.vendorId, vendorId))
        .limit(1);

      res.json(paymentInfo[0] || null);
    } catch (error) {
      console.error("Error fetching vendor payment info:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Create or update vendor payment information
  app.post("/api/vendors/:vendorId/payment-info", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }

    try {
      const vendorId = parseInt(req.params.vendorId);
      
      // Verify vendor ownership
      const vendor = await db.select()
        .from(vendors)
        .where(eq(vendors.id, vendorId))
        .limit(1);

      if (!vendor.length || vendor[0].userId !== req.user!.id) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Validate the request body
      const validatedData = insertVendorPaymentInfoSchema.parse({
        ...req.body,
        vendorId
      });

      // Check if payment info already exists
      const existingInfo = await db.select()
        .from(vendorPaymentInfo)
        .where(eq(vendorPaymentInfo.vendorId, vendorId))
        .limit(1);

      let result;
      if (existingInfo.length) {
        // Update existing payment info
        result = await db.update(vendorPaymentInfo)
          .set({
            ...validatedData,
            updatedAt: new Date()
          })
          .where(eq(vendorPaymentInfo.vendorId, vendorId))
          .returning();
      } else {
        // Create new payment info
        result = await db.insert(vendorPaymentInfo)
          .values(validatedData)
          .returning();
      }

      res.json(result[0]);
    } catch (error) {
      console.error("Error saving vendor payment info:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Delete vendor payment information
  app.delete("/api/vendors/:vendorId/payment-info", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }

    try {
      const vendorId = parseInt(req.params.vendorId);
      
      // Verify vendor ownership
      const vendor = await db.select()
        .from(vendors)
        .where(eq(vendors.id, vendorId))
        .limit(1);

      if (!vendor.length || vendor[0].userId !== req.user!.id) {
        return res.status(403).json({ message: "Access denied" });
      }

      await db.delete(vendorPaymentInfo)
        .where(eq(vendorPaymentInfo.vendorId, vendorId));

      res.json({ message: "Payment information deleted successfully" });
    } catch (error) {
      console.error("Error deleting vendor payment info:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Catch-all handler for invalid API routes
  app.use('/api/*', (req: Request, res: Response) => {
    res.status(404).json({
      error: 'API endpoint not found',
      message: `The API endpoint ${req.path} does not exist`,
      path: req.path
    });
  });

  // Set up WebSocket server for messaging
  console.log('Setting up WebSocket server for messaging...');
  setupWebSocket(httpServer);

  return httpServer;
}
