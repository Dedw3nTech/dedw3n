import { pgTable, text, serial, integer, boolean, timestamp, doublePrecision, varchar, json, unique, primaryKey, pgEnum, index, date, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// Admin-specific types for unified admin dashboard
export interface AdminUser {
  id: number;
  username: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  isLocked: boolean;
  lastLogin?: Date;
  createdAt: Date;
}

export interface AdminReport {
  id: number;
  type: string;
  contentId: number;
  reporterId: number;
  reason: string;
  status: string;
  createdAt: Date;
  reporter: {
    username: string;
    name: string;
  };
  content: {
    title: string;
    excerpt: string;
  };
}

export interface AdminVendorRequest {
  id: number;
  userId: number;
  vendorType: string;
  businessName: string;
  businessAddress: string;
  businessPhone: string;
  businessEmail: string;
  description: string;
  status: string;
  createdAt: Date;
  user: {
    name: string;
    username: string;
    email: string;
    avatar?: string;
  };
}

export interface AdminAffiliatePartner {
  id: number;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  website?: string;
  partnerCode: string;
  description?: string;
  specialization?: string;
  region?: string;
  languages?: string[];
  status: string;
  isVerified: boolean;
  verificationDate?: Date;
  commissionRate: string;
  totalReferrals: number;
  totalCommissionEarned: string;
  assignedVendors?: number[];
  createdAt: Date;
  updatedAt: Date;
  user?: {
    id: number;
    username: string;
    name: string;
    email: string;
    avatar?: string;
  };
}

export interface AdminStats {
  totalUsers: number;
  totalVendors: number;
  totalProducts: number;
  totalOrders: number;
  pendingReports: number;
  pendingVendorRequests: number;
  pendingAffiliateRequests: number;
  activeUsers24h: number;
  totalRevenue: number;
  userCount?: number;
  productCount?: number;
  orderCount?: number;
  communityCount?: number;
  totalDatingProfiles: number;
  activeDatingProfiles: number;
  activeVendors: number;
  totalAmountSold: number;
  totalTransactions: number;
  totalAmountShipped: number;
  shippedOrders: number;
}

// Cities table for comprehensive global city database
export const cities = pgTable("cities", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  country: text("country").notNull(),
  region: text("region").notNull(),
  population: integer("population"),
  latitude: doublePrecision("latitude"),
  longitude: doublePrecision("longitude"),
  timezone: text("timezone"),
  isCapital: boolean("is_capital").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
}, (table) => ({
  countryIdx: index("country_idx").on(table.country),
  regionIdx: index("region_idx").on(table.region),
  nameIdx: index("name_idx").on(table.name),
  populationIdx: index("population_idx").on(table.population)
}));

export const insertCitySchema = createInsertSchema(cities);
export const selectCitySchema = createSelectSchema(cities);
export type InsertCity = z.infer<typeof insertCitySchema>;
export type City = z.infer<typeof selectCitySchema>;

export interface AdminVendorCommission {
  vendor: {
    id: number;
    storeName: string;
    businessName: string;
    accountStatus: string;
    isActive: boolean;
    totalSalesAmount: number;
    totalTransactions: number;
    user: {
      id: number;
      name: string;
      email: string;
    };
  };
  commission: {
    totalCommissionOwed: number;
    totalCommissionPaid: number;
    pendingPayments: number;
    commissionPeriods: any[];
    recentPayments: any[];
  };
}

export interface AdminCommissionSummary {
  vendors: Array<{
    vendorId: number;
    storeName: string;
    businessName: string;
    accountStatus: string;
    isActive: boolean;
    userId: number;
    userName: string;
    userEmail: string;
    totalSalesAmount: number;
    totalTransactions: number;
    commission: {
      totalOwed: number;
      totalPaid: number;
      pendingCount: number;
      totalPeriods: number;
    };
  }>;
  totals: {
    totalCommissionOwed: number;
    totalCommissionPaid: number;
    totalPendingPayments: number;
    totalVendorsWithCommission: number;
  };
}

// Enums
export const communityVisibilityEnum = pgEnum('community_visibility', ['public', 'private', 'secret']);
export const membershipTierTypeEnum = pgEnum('membership_tier_type', ['free', 'paid', 'premium']);
export const eventTypeEnum = pgEnum('event_type', ['live_stream', 'course', 'workshop', 'meetup', 'qa_session']);
export const subscriptionIntervalEnum = pgEnum('subscription_interval', ['daily', 'weekly', 'monthly', 'yearly', 'one_time']);
export const videoTypeEnum = pgEnum('video_type', ['short_form', 'story', 'live_stream', 'live_commerce', 'recorded']);
export const videoVisibilityEnum = pgEnum('video_visibility', ['public', 'followers', 'private']);
export const videoMonetizationEnum = pgEnum('video_monetization', ['free', 'ppv', 'subscription']);
export const moderationMatchTypeEnum = pgEnum('moderation_match_type', ['exact', 'partial', 'regex']);
export const moderationSeverityEnum = pgEnum('moderation_severity', ['low', 'medium', 'high']);
export const flaggedContentTypeEnum = pgEnum('flagged_content_type', ['post', 'comment', 'message', 'product', 'profile', 'community']);
export const flaggedContentStatusEnum = pgEnum('flagged_content_status', ['pending', 'approved', 'rejected']);
export const productReportReasonEnum = pgEnum('product_report_reason', ['counterfeit', 'fraud', 'prohibited', 'misinformation', 'harassment', 'spam', 'copyright', 'other']);
export const productReportStatusEnum = pgEnum('product_report_status', ['pending', 'reviewed', 'dismissed', 'action_taken']);
export const notificationTypeEnum = pgEnum('notification_type', ['like', 'comment', 'follow', 'mention', 'message', 'order', 'payment', 'system', 'gift_received', 'gift_accepted', 'gift_declined', 'finance', 'government', 'lifestyle', 'marketplace', 'community']);
export const notificationChannelEnum = pgEnum('notification_channel', ['app', 'email', 'push', 'sms']);

// Fraud prevention enums
export const riskLevelEnum = pgEnum('risk_level', ['low', 'medium', 'high', 'critical']);

// Define user roles enum
export const userRoleEnum = pgEnum('user_role', ['user', 'admin', 'moderator', 'vendor', 'business']);

// Define dating subscription levels enum
export const datingSubscriptionEnum = pgEnum('dating_subscription', ['normal', 'vip', 'vvip']);

// Define message category enum for different message sections
export const messageCategoryEnum = pgEnum('message_category', ['marketplace', 'community', 'dating']);

// Define interaction type enum for AI personalization
export const interactionTypeEnum = pgEnum('interaction_type', ['view', 'search', 'purchase', 'like', 'cart', 'share', 'compare']);

// Define regions enum
export const regionEnum = pgEnum('region', [
  'Africa', 
  'South Asia', 
  'East Asia', 
  'Oceania', 
  'North America', 
  'Central America', 
  'South America', 
  'Middle East', 
  'Europe', 
  'Central Asia'
]);

// Define product type enum
export const productTypeEnum = pgEnum('product_type', ['product', 'service', 'vehicle', 'real_estate']);

// Define product status enum
export const productStatusEnum = pgEnum('product_status', ['active', 'draft', 'archived']);

// Define marketplace type enum
export const marketplaceTypeEnum = pgEnum('marketplace_type', ['c2c', 'b2c', 'b2b', 'raw', 'rqst', 'government-dr-congo']);

// Define vendor badge level enum
export const vendorBadgeLevelEnum = pgEnum('vendor_badge_level', ['new_vendor', 'level_2_vendor', 'top_vendor', 'infinity_vendor', 'elite_vendor']);

// Define discount type enum
export const discountTypeEnum = pgEnum('discount_type', ['percentage', 'fixed_amount', 'buy_x_get_y', 'free_shipping']);

// Define discount status enum
export const discountStatusEnum = pgEnum('discount_status', ['active', 'inactive', 'expired', 'scheduled']);

// Define discount application enum
export const discountApplicationEnum = pgEnum('discount_application', ['automatic', 'code_required']);

// Define promotion target enum
export const promotionTargetEnum = pgEnum('promotion_target', ['all_products', 'specific_products', 'category', 'minimum_order']);

// Define commission status enum
export const commissionStatusEnum = pgEnum('commission_status', ['pending', 'sent', 'paid', 'overdue', 'failed']);

// Define payment status enum
export const paymentStatusEnum = pgEnum('payment_status', ['pending', 'processing', 'completed', 'failed', 'cancelled']);

// Define cryptocurrency payment status enum
export const cryptoPaymentStatusEnum = pgEnum('crypto_payment_status', ['pending', 'confirmed', 'failed', 'expired', 'cancelled']);

// Define vendor account status enum
export const vendorAccountStatusEnum = pgEnum('vendor_account_status', ['active', 'on_hold', 'suspended', 'permanently_suspended']);

// Define commission tier enum
export const commissionTierEnum = pgEnum('commission_tier', ['standard', 'premium', 'enterprise']);

// Define event category enum
export const eventCategoryEnum = pgEnum('event_category', ['networking', 'social', 'business', 'tech', 'sports', 'arts', 'education', 'health', 'food', 'community']);

// Define gender enum
export const genderEnum = pgEnum('gender', ['male', 'female', 'other']);

// Define analytics period enum
export const analyticsPeriodEnum = pgEnum('analytics_period', ['daily', 'weekly', 'monthly', 'quarterly', 'yearly']);

// Define device type enum
export const deviceTypeEnum = pgEnum('device_type', ['desktop', 'mobile', 'tablet']);

// Define traffic source enum
export const trafficSourceEnum = pgEnum('traffic_source', ['direct', 'search', 'social', 'email', 'referral', 'paid']);

// Define conversion type enum
export const conversionTypeEnum = pgEnum('conversion_type', ['view', 'add_to_cart', 'checkout', 'purchase', 'search']);

// Define demographic enum
export const demographicTypeEnum = pgEnum('demographic_type', ['age_group', 'gender', 'location', 'income_level']);

// Define return status enum
export const returnStatusEnum = pgEnum('return_status', ['requested', 'approved', 'rejected', 'processing', 'shipped', 'completed', 'cancelled']);

// Define return reason enum
export const returnReasonEnum = pgEnum('return_reason', ['defective', 'wrong_item', 'not_as_described', 'changed_mind', 'damaged_in_shipping', 'other']);

// Define store user role enum
export const storeUserRoleEnum = pgEnum('store_user_role', ['marketer', 'merchandiser', 'manager']);

// Define affiliate partnership status enum
export const affiliateStatusEnum = pgEnum('affiliate_status', ['active', 'pending', 'suspended', 'terminated']);

// Define affiliate tier enum  
export const affiliateTierEnum = pgEnum('affiliate_tier', ['bronze', 'silver', 'gold', 'platinum', 'diamond']);

// Define KYC document type enum
export const kycDocumentTypeEnum = pgEnum('kyc_document_type', ['passport', 'national_id', 'drivers_license']);

// Define KYC status enum
export const kycStatusEnum = pgEnum('kyc_status', ['pending', 'verified', 'rejected', 'not_submitted']);

// Define ticket department enum
export const ticketDepartmentEnum = pgEnum('ticket_department', ['operations', 'tech', 'legal', 'marketing', 'sales', 'finance', 'hr']);

// Define ticket status enum
export const ticketStatusEnum = pgEnum('ticket_status', ['open', 'in_progress', 'waiting_customer', 'resolved', 'closed']);

// Define ticket priority enum
export const ticketPriorityEnum = pgEnum('ticket_priority', ['low', 'medium', 'high', 'urgent']);

// Define user account type enum
export const userAccountTypeEnum = pgEnum('user_account_type', ['personal', 'business']);

// User model
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  affiliatePartner: text("affiliate_partner"),
  name: text("name").notNull(),
  firstName: text("first_name"),
  surname: text("surname"),
  lastUsernameChange: timestamp("last_username_change"),
  usernameChangeCount: integer("username_change_count").default(0),
  email: text("email").notNull().unique(),
  bio: text("bio"),
  avatar: text("avatar"),
  avatarUpdatedAt: timestamp("avatar_updated_at"),
  isVendor: boolean("is_vendor").default(false),
  role: userRoleEnum("role").default('user').notNull(),
  accountType: userAccountTypeEnum("account_type").default('personal'),
  lastLogin: timestamp("last_login"),
  failedLoginAttempts: integer("failed_login_attempts").default(0),
  isLocked: boolean("is_locked").default(false),
  passwordResetToken: text("password_reset_token"),
  passwordResetExpires: timestamp("password_reset_expires"),
  emailVerified: boolean("email_verified").default(false),
  verificationToken: text("verification_token"),
  verificationTokenExpires: timestamp("verification_token_expires"),
  emailChangeToken: text("email_change_token"),
  emailChangeTokenExpires: timestamp("email_change_token_expires"),
  pendingEmail: text("pending_email"),
  twoFactorEnabled: boolean("two_factor_enabled").default(false),
  twoFactorSecret: text("two_factor_secret"),
  twoFactorCode: text("two_factor_code"),
  twoFactorCodeExpires: timestamp("two_factor_code_expires"),
  twoFactorMethod: text("two_factor_method"), // 'email' or 'whatsapp'
  datingSubscription: datingSubscriptionEnum("dating_subscription").default('normal'),
  datingEnabled: boolean("dating_enabled").default(false),
  region: regionEnum("region"),
  country: text("country"),
  city: text("city"),
  dateOfBirth: date("date_of_birth"),
  gender: genderEnum("gender"),
  // Shipping Information
  shippingFirstName: text("shipping_first_name"),
  shippingLastName: text("shipping_last_name"),
  shippingPhone: text("shipping_phone"),
  shippingAddress: text("shipping_address"),
  shippingHouseNumber: text("shipping_house_number"),
  shippingCity: text("shipping_city"),
  shippingState: text("shipping_state"),
  shippingZipCode: text("shipping_zip_code"),
  shippingCountry: text("shipping_country"),
  shippingSpecialInstructions: text("shipping_special_instructions"),
  shippingExtraGuidelines: text("shipping_extra_guidelines"),
  // Billing Information
  billingFirstName: text("billing_first_name"),
  billingLastName: text("billing_last_name"),
  billingPhone: text("billing_phone"),
  billingAddress: text("billing_address"),
  billingHouseNumber: text("billing_house_number"),
  billingCity: text("billing_city"),
  billingState: text("billing_state"),
  billingZipCode: text("billing_zip_code"),
  billingCountry: text("billing_country"),
  billingSpecialInstructions: text("billing_special_instructions"),
  billingExtraGuidelines: text("billing_extra_guidelines"),
  // Profile preferences
  useShippingAsBilling: boolean("use_shipping_as_billing").default(true),
  preferredLanguage: text("preferred_language").default('EN'),
  phone: text("phone"), // Personal contact phone number
  // Email notification preferences
  emailOnNewNotification: boolean("email_on_new_notification").default(true),
  emailOnNewMessage: boolean("email_on_new_message").default(true),
  emailOnNewOrder: boolean("email_on_new_order").default(true),
  // Privacy preferences
  aiTrainingConsent: boolean("ai_training_consent").default(false),
  // Account suspension
  accountSuspended: boolean("account_suspended").default(false),
  accountSuspendedAt: timestamp("account_suspended_at"),
  // Account deletion (soft delete - data retained)
  accountDeleted: boolean("account_deleted").default(false),
  accountDeletedAt: timestamp("account_deleted_at"),
  originalUsername: text("original_username"), // Store original username before release
  // Professional profile fields
  currentPosition: text("current_position"),
  industry: text("industry"),
  education: text("education"),
  website: text("website"),
  salaryRange: text("salary_range"),
  // KYC/AML Compliance fields
  idDocumentType: kycDocumentTypeEnum("id_document_type"),
  idDocumentNumber: text("id_document_number"),
  idDocumentExpiryDate: date("id_document_expiry_date"),
  idDocumentIssueCountry: text("id_document_issue_country"),
  occupation: text("occupation"),
  isPoliticallyExposed: boolean("is_politically_exposed").default(false),
  politicalExposureDetails: text("political_exposure_details"),
  proofOfAddressUrl: text("proof_of_address_url"),
  sourceOfIncomeDocumentUrl: text("source_of_income_document_url"),
  idDocumentFrontUrl: text("id_document_front_url"),
  idDocumentBackUrl: text("id_document_back_url"),
  idSelfieUrl: text("id_selfie_url"),
  kycStatus: kycStatusEnum("kyc_status").default('not_submitted'),
  kycVerifiedAt: timestamp("kyc_verified_at"),
  amlRiskLevel: riskLevelEnum("aml_risk_level").default('low'),
  amlCheckedAt: timestamp("aml_checked_at"),
  // Financial Information
  bankName: text("bank_name"),
  bankAccountHolderName: text("bank_account_holder_name"),
  bankAccountNumber: text("bank_account_number"),
  bankRoutingNumber: text("bank_routing_number"),
  paypalEmail: text("paypal_email"),
  cardProofUrl: text("card_proof_url"),
  cardLast4Digits: text("card_last_4_digits"),
  cardHolderName: text("card_holder_name"),
  bankStatementUrl: text("bank_statement_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Vendor Sub-Account model - Users can have separate private and business vendor accounts
export const vendors = pgTable("vendors", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  vendorType: text("vendor_type", { enum: ["private", "business"] }).notNull(),
  storeName: text("store_name").notNull(),
  businessName: text("business_name").notNull(),
  description: text("description"),
  businessType: text("business_type").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  contactEmail: text("contact_email"), // Backward compatibility field
  contactPhone: text("contact_phone"), // Backward compatibility field
  address: text("address").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  zipCode: text("zip_code").notNull(),
  country: text("country").notNull(),
  taxId: text("tax_id"),
  website: text("website"),
  logo: text("logo"),
  banner: text("banner"),
  rating: doublePrecision("rating").default(0),
  ratingCount: integer("rating_count").default(0),
  // Badge system fields
  badgeLevel: vendorBadgeLevelEnum("badge_level").default("new_vendor"),
  totalSalesAmount: doublePrecision("total_sales_amount").default(0), // Total sales in GBP
  totalTransactions: integer("total_transactions").default(0), // Total number of transactions
  verificationStatus: text("verification_status").default('pending'), // pending, verified, rejected
  lastBadgeUpdate: timestamp("last_badge_update").defaultNow(),
  isApproved: boolean("is_approved").default(false),
  isActive: boolean("is_active").default(true), // Allow users to activate/deactivate vendor accounts
  accountStatus: vendorAccountStatusEnum("account_status").default("active"),
  accountSuspendedAt: timestamp("account_suspended_at"),
  accountSuspensionReason: text("account_suspension_reason"),
  paymentIssueNotifiedAt: timestamp("payment_issue_notified_at"),
  paymentFailureCount: integer("payment_failure_count").default(0),
  // Sales Manager fields
  hasSalesManager: boolean("has_sales_manager").default(false),
  salesManagerName: text("sales_manager_name"),
  salesManagerId: text("sales_manager_id"),
  // System Settings fields
  unitSystem: text("unit_system").default("metric"), // metric, imperial
  weightSystem: text("weight_system").default("kg"), // kg, lbs, g, oz
  timezone: text("timezone").default("Europe/London"),
  billingCycle: text("billing_cycle").default("monthly"), // monthly, quarterly, yearly
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  // Ensure user can only have one vendor account per type
  uniqueUserVendorType: unique("unique_user_vendor_type").on(table.userId, table.vendorType),
}));

// Store Users model - Users assigned to vendor stores with specific roles
export const storeUsers = pgTable("store_users", {
  id: serial("id").primaryKey(),
  vendorId: integer("vendor_id").notNull().references(() => vendors.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  role: storeUserRoleEnum("role").notNull(),
  assignedBy: integer("assigned_by").notNull().references(() => users.id),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  // Ensure a user can only have one role per store
  uniqueUserStore: unique("unique_user_store").on(table.vendorId, table.userId),
  vendorIdIdx: index("store_users_vendor_id_idx").on(table.vendorId),
  userIdIdx: index("store_users_user_id_idx").on(table.userId),
}));

// Product model
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  vendorId: integer("vendor_id").notNull().references(() => vendors.id),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description").notNull(),
  price: doublePrecision("price").notNull(),
  currency: text("currency").default('GBP').notNull(), // Currency code
  discountPrice: doublePrecision("discount_price"),
  category: text("category").notNull(),
  subcategory: text("subcategory"), // Product subcategory
  condition: text("condition").default('new'), // new, used, refurbished
  imageUrl: text("image_url").notNull(),
  thumbnail: text("thumbnail"), // Product thumbnail
  images: text("images").array(), // Additional product images
  inventory: integer("inventory").default(1),
  isNew: boolean("is_new").default(false),
  isOnSale: boolean("is_on_sale").default(false),
  productType: productTypeEnum("product_type").default('product').notNull(),
  offeringType: text("offering_type").default('product'),
  // New Shopify-style fields
  status: productStatusEnum("status").default('active').notNull(),
  publishedOnOnlineStore: boolean("published_on_online_store").default(true),
  publishedOnPointOfSale: boolean("published_on_point_of_sale").default(false),
  publishedOnShop: boolean("published_on_shop").default(true),
  vendor: text("vendor"), // Custom vendor field separate from vendorId
  collections: text("collections").array().default([]),
  tags: text("tags").array().default([]),
  weight: doublePrecision("weight"), // Product weight
  weightUnit: text("weight_unit").default('kg'), // kg, lb, oz, g
  dimensions: text("dimensions"), // Format: "L x W x H"
  dimensionUnit: text("dimension_unit").default('cm'), // cm, inches
  sku: text("sku"), // Stock Keeping Unit
  barcode: text("barcode"),
  trackQuantity: boolean("track_quantity").default(true),
  continueSellingWhenOutOfStock: boolean("continue_selling_when_out_of_stock").default(false),
  requiresShipping: boolean("requires_shipping").default(true),
  shippingCarrier: text("shipping_carrier"), // Shipping carrier selection
  shippingPrice: doublePrecision("shipping_price"), // Fixed shipping price
  variableShippingPrice: doublePrecision("variable_shipping_price"), // Variable shipping price
  shippingIncluded: boolean("shipping_included").default(false), // Whether shipping cost is included in price
  vatIncluded: boolean("vat_included").default(false), // Whether VAT is included in price
  vatRate: doublePrecision("vat_rate"), // VAT rate percentage (0-100)
  marketplace: marketplaceTypeEnum("marketplace").notNull(), // C2C, B2C, or B2B marketplace
  seoTitle: text("seo_title"),
  seoDescription: text("seo_description"),
  productCode: varchar("product_code", { length: 50 }).unique(),
  createdAt: timestamp("created_at").defaultNow(),
});



// Liked products model
export const likedProducts = pgTable("liked_products", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  productId: integer("product_id").notNull().references(() => products.id),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  // Ensure a user can only like a product once
  uniqueUserProduct: unique().on(table.userId, table.productId),
}));

// Category model
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
});

// Post model (for social features)
// Define post review status enum
export const postReviewStatusEnum = pgEnum('post_review_status', ['pending', 'approved', 'rejected']);

// Modern CMS publishing workflow status
export const publishStatusEnum = pgEnum('publish_status', ['draft', 'scheduled', 'published', 'archived']);

export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  title: text("title"),
  contentType: varchar("content_type", { length: 20 }).notNull().default("text"), // text, image, video, article, advertisement
  imageUrl: text("image_url"),
  videoUrl: text("video_url"),
  productId: integer("product_id").references(() => products.id),
  eventId: integer("event_id").references(() => events.id), // Reference to shared events
  likes: integer("likes").default(0),
  comments: integer("comments").default(0),
  shares: integer("shares").default(0),
  views: integer("views").default(0),
  tags: text("tags").array(), // Array of tags for better content discovery
  isPromoted: boolean("is_promoted").default(false), // For advertisements
  promotionEndDate: timestamp("promotion_end_date"), // For advertisements
  isPublished: boolean("is_published").default(true), // Legacy field - use publishStatus instead
  // Modern CMS Publishing Workflow
  publishStatus: publishStatusEnum("publish_status").default('published'), // draft, scheduled, published, archived
  publishAt: timestamp("publish_at"), // Scheduled publish time
  contentJson: json("content_json"), // Lexical editor state for rich text content
  contentVersion: integer("content_version").default(1), // Track content versions
  // Moderation fields
  isFlagged: boolean("is_flagged").default(false),
  flagReason: text("flag_reason"),
  reviewStatus: postReviewStatusEnum("review_status").default('pending'),
  reviewedAt: timestamp("reviewed_at"),
  reviewedBy: integer("reviewed_by").references(() => users.id),
  moderationNote: text("moderation_note"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Comment model
export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").notNull().references(() => posts.id),
  userId: integer("user_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Like model
export const likes = pgTable("likes", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").notNull().references(() => posts.id),
  userId: integer("user_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Message model
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  senderId: integer("sender_id").notNull().references(() => users.id),
  receiverId: integer("receiver_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  attachmentUrl: text("attachment_url"),
  attachmentType: text("attachment_type"),
  isRead: boolean("is_read").default(false),
  messageType: text("message_type").default("text"), // text, image, video, audio, file, call_request, call_missed, call_ended
  category: messageCategoryEnum("category").default("marketplace"), // marketplace, community, dating
  createdAt: timestamp("created_at").defaultNow(),
});

// Call sessions for audio/video calls
export const callSessions = pgTable("call_sessions", {
  id: serial("id").primaryKey(),
  callId: text("call_id").notNull(), // Unique identifier for the call session
  initiatorId: integer("initiator_id").notNull().references(() => users.id),
  receiverId: integer("receiver_id").notNull().references(() => users.id),
  callType: text("call_type").notNull(), // audio, video
  status: text("status").notNull(), // requested, ongoing, declined, ended, missed
  startedAt: timestamp("started_at").defaultNow(),
  endedAt: timestamp("ended_at"),
  duration: integer("duration").default(0), // in seconds
  quality: text("quality"),
});

// Call metadata for analytics
export const callMetadata = pgTable("call_metadata", {
  id: serial("id").primaryKey(),
  callSessionId: integer("call_session_id").notNull().references(() => callSessions.id),
  metadata: json("metadata"), // Additional metadata like network stats, quality metrics
  createdAt: timestamp("created_at").defaultNow(),
});

// Notification model
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  type: notificationTypeEnum("type").notNull(),
  title: text("title"), // Title of the notification
  content: text("content").notNull(),
  isRead: boolean("is_read").default(false),
  sourceId: integer("source_id"), // ID of the related item (post, comment, etc.)
  sourceType: text("source_type"), // Type of the related item
  actorId: integer("actor_id").references(() => users.id), // User who triggered the notification
  createdAt: timestamp("created_at").defaultNow(),
});

// Notification settings model
export const notificationSettings = pgTable("notification_settings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  type: notificationTypeEnum("type").notNull(),
  channel: notificationChannelEnum("channel").notNull(),
  enabled: boolean("enabled").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => {
  return {
    userTypeChannelKey: unique().on(table.userId, table.type, table.channel),
  }
});

// Review model
export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  productId: integer("product_id").notNull().references(() => products.id),
  vendorId: integer("vendor_id").notNull().references(() => vendors.id),
  rating: integer("rating").notNull(),
  content: text("content"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Friend requests model
export const friendRequests = pgTable("friend_requests", {
  id: serial("id").primaryKey(),
  senderId: integer("sender_id").notNull().references(() => users.id),
  recipientId: integer("recipient_id").notNull().references(() => users.id),
  message: text("message"),
  status: varchar("status", { length: 20 }).notNull().default("pending"), // pending, accepted, rejected
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => {
  return {
    uniqueFriendRequest: unique().on(table.senderId, table.recipientId),
  };
});

// User connections model
export const connections = pgTable("connections", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  connectedUserId: integer("connected_user_id").notNull().references(() => users.id),
  status: varchar("status", { length: 20 }).notNull().default("connected"), // pending, connected, rejected, blocked
  initiatedBy: integer("initiated_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => {
  return {
    uniqueConnection: unique().on(table.userId, table.connectedUserId),
  };
});

// Friendships model - for accepted friend connections
export const friendships = pgTable("friendships", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  friendId: integer("friend_id").notNull().references(() => users.id),
  status: varchar("status", { length: 20 }).notNull().default("accepted"), // accepted, blocked
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => {
  return {
    uniqueFriendship: unique().on(table.userId, table.friendId),
    userIdIdx: index("friendships_user_id_idx").on(table.userId),
    friendIdIdx: index("friendships_friend_id_idx").on(table.friendId),
  };
});

// User sessions for tracking user activity
export const userSessions = pgTable("user_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  sessionId: text("session_id").notNull(),
  userAgent: text("user_agent"),
  ipAddress: varchar("ip_address", { length: 45 }),
  deviceType: varchar("device_type", { length: 20 }),
  browser: varchar("browser", { length: 50 }),
  operatingSystem: varchar("operating_system", { length: 50 }),
  lastActiveAt: timestamp("last_active_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  expiresAt: timestamp("expires_at"),
});

// Traffic analytics for tracking website traffic sources
export const trafficAnalytics = pgTable("traffic_analytics", {
  id: serial("id").primaryKey(),
  date: date("date").notNull(),
  source: varchar("source", { length: 50 }).notNull(), // direct, social, search, referral
  campaign: varchar("campaign", { length: 100 }),
  medium: varchar("medium", { length: 50 }),
  referrer: text("referrer"),
  landingPage: text("landing_page"),
  exitPage: text("exit_page"),
  deviceType: varchar("device_type", { length: 20 }),
  sessions: integer("sessions").notNull().default(0),
  users: integer("users").notNull().default(0),
  pageviews: integer("pageviews").notNull().default(0),
  bounceRate: doublePrecision("bounce_rate").default(0),
  avgSessionDuration: doublePrecision("avg_session_duration").default(0),
  conversions: integer("conversions").default(0),
  revenue: doublePrecision("revenue").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Social media follows
export const follows = pgTable("follows", {
  id: serial("id").primaryKey(),
  followerId: integer("follower_id").notNull().references(() => users.id),
  followingId: integer("following_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => {
  return {
    uniqueFollow: unique().on(table.followerId, table.followingId),
  };
});

// Saved posts (bookmarks)
export const savedPosts = pgTable("saved_posts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  postId: integer("post_id").notNull().references(() => posts.id),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => {
  return {
    uniqueSavedPost: unique().on(table.userId, table.postId),
  };
});

// Cart model
export const carts = pgTable("carts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  productId: integer("product_id").notNull().references(() => products.id),
  quantity: integer("quantity").notNull().default(1),
  createdAt: timestamp("created_at").defaultNow(),
});

// Wallet model
export const wallets = pgTable("wallets", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id).unique(),
  balance: doublePrecision("balance").notNull().default(0),
  currency: varchar("currency", { length: 3 }).notNull().default("USD"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Transaction model
export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  walletId: integer("wallet_id").notNull().references(() => wallets.id),
  amount: doublePrecision("amount").notNull(),
  type: varchar("type", { length: 20 }).notNull(), // deposit, withdrawal, payment, refund, transfer
  category: varchar("category", { length: 30 }).notNull(), // shopping, bills, groceries, entertainment, transport, health, education, income, investment, etc.
  paymentMethod: varchar("payment_method", { length: 30 }), // wallet, card, mobile_money, paypal, bank_transfer, cash
  status: varchar("status", { length: 20 }).notNull().default("completed"), // pending, completed, failed, reversed
  description: text("description"),
  metadata: text("metadata"), // JSON string for additional info
  referenceId: varchar("reference_id", { length: 100 }), // Order ID, Payment ID, etc.
  relatedUserId: integer("related_user_id").references(() => users.id), // For transfers: the user on the other end of the transaction
  createdAt: timestamp("created_at").defaultNow(),
});

// Orders model
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  totalAmount: doublePrecision("total_amount").notNull(),
  status: varchar("status", { length: 20 }).notNull().default("pending"), // pending, processing, shipped, delivered, canceled
  shippingAddress: text("shipping_address").notNull(),
  shippingCost: doublePrecision("shipping_cost").notNull().default(0),
  paymentMethod: varchar("payment_method", { length: 30 }).notNull(), // wallet, card, mobile_money, paypal, bank_transfer
  paymentStatus: varchar("payment_status", { length: 20 }).notNull().default("pending"), // pending, completed, failed, refunded
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// OrderItems model
export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => orders.id),
  productId: integer("product_id").notNull().references(() => products.id),
  vendorId: integer("vendor_id").notNull().references(() => vendors.id),
  quantity: integer("quantity").notNull(),
  unitPrice: doublePrecision("unit_price").notNull(),
  discount: doublePrecision("discount").default(0),
  totalPrice: doublePrecision("total_price").notNull(),
  status: varchar("status", { length: 20 }).notNull().default("pending"), // pending, shipped, delivered, returned
  createdAt: timestamp("created_at").defaultNow(),
});

// Cryptocurrency payments model
export const cryptoPayments = pgTable("crypto_payments", {
  id: serial("id").primaryKey(),
  paymentId: varchar("payment_id", { length: 100 }).notNull().unique(), // Unique payment identifier
  orderId: integer("order_id").references(() => orders.id),
  userId: integer("user_id").references(() => users.id),
  amount: doublePrecision("amount").notNull(), // Amount in USD
  currency: varchar("currency", { length: 10 }).notNull(), // BTC, ETH, etc.
  exchangeRate: doublePrecision("exchange_rate").notNull(), // USD per crypto unit at time of payment
  amountInCrypto: doublePrecision("amount_in_crypto").notNull(), // Amount in cryptocurrency
  walletAddress: varchar("wallet_address", { length: 255 }).notNull(), // Payment wallet address
  status: cryptoPaymentStatusEnum("status").notNull().default("pending"),
  transactionHash: varchar("transaction_hash", { length: 255 }), // Blockchain transaction hash
  confirmations: integer("confirmations").default(0), // Number of blockchain confirmations
  requiredConfirmations: integer("required_confirmations").default(3), // Required confirmations for completion
  expiresAt: timestamp("expires_at").notNull(), // Payment expiration time
  confirmedAt: timestamp("confirmed_at"), // When payment was confirmed
  metadata: json("metadata"), // Additional payment metadata
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Returns model for handling product returns
export const returns = pgTable("returns", {
  id: serial("id").primaryKey(),
  orderItemId: integer("order_item_id").notNull().references(() => orderItems.id),
  userId: integer("user_id").notNull().references(() => users.id),
  vendorId: integer("vendor_id").notNull().references(() => vendors.id),
  reason: returnReasonEnum("reason").notNull(),
  description: text("description"),
  status: returnStatusEnum("status").notNull().default("requested"),
  requestedQuantity: integer("requested_quantity").notNull(),
  approvedQuantity: integer("approved_quantity").default(0),
  refundAmount: doublePrecision("refund_amount").default(0),
  returnShippingCost: doublePrecision("return_shipping_cost").default(0),
  vendorNotes: text("vendor_notes"),
  customerNotes: text("customer_notes"),
  returnShippingAddress: text("return_shipping_address"),
  returnTrackingNumber: varchar("return_tracking_number", { length: 100 }),
  images: text("images").array().default([]),
  processedAt: timestamp("processed_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Regional shipping model for product-specific regional pricing
export const regionalShipping = pgTable("regional_shipping", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  region: regionEnum("region").notNull(),
  shippingPrice: doublePrecision("shipping_price").notNull(),
  isEnabled: boolean("is_enabled").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  // Ensure one shipping price per product per region
  uniqueProductRegion: unique().on(table.productId, table.region),
}));

// Community model for public, private, and secret communities
export const communities = pgTable("communities", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  ownerId: integer("owner_id").notNull().references(() => users.id),
  logo: text("logo"),
  bannerImage: text("banner_image"),
  visibility: communityVisibilityEnum("visibility").notNull().default("public"),
  rules: text("rules"),
  topics: text("topics").array(),
  memberCount: integer("member_count").default(0),
  isVerified: boolean("is_verified").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Community members model
export const communityMembers = pgTable("community_members", {
  id: serial("id").primaryKey(),
  communityId: integer("community_id").notNull().references(() => communities.id),
  userId: integer("user_id").notNull().references(() => users.id),
  role: varchar("role", { length: 20 }).notNull().default("member"), // owner, admin, moderator, member
  joinedAt: timestamp("joined_at").defaultNow(),
}, (table) => {
  return {
    uniqueMember: unique().on(table.communityId, table.userId),
  };
});

// Membership tiers for monetizing communities and content
export const membershipTiers = pgTable("membership_tiers", {
  id: serial("id").primaryKey(),
  communityId: integer("community_id").notNull().references(() => communities.id),
  name: text("name").notNull(),
  description: text("description").notNull(),
  price: doublePrecision("price").notNull(),
  currency: varchar("currency", { length: 3 }).notNull().default("USD"),
  tierType: membershipTierTypeEnum("tier_type").notNull(),
  benefits: text("benefits").array(),
  durationDays: integer("duration_days").notNull(), // 30, 90, 365 days etc
  isActive: boolean("is_active").default(true),
  maxMembers: integer("max_members"), // optional limit for exclusive tiers
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User membership subscriptions
export const memberships = pgTable("memberships", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  tierId: integer("tier_id").notNull().references(() => membershipTiers.id),
  communityId: integer("community_id").notNull().references(() => communities.id),
  status: varchar("status", { length: 20 }).notNull().default("active"), // active, canceled, expired
  paymentStatus: varchar("payment_status", { length: 20 }).notNull(), // paid, trial, pending, failed
  startDate: timestamp("start_date").notNull().defaultNow(),
  endDate: timestamp("end_date").notNull(),
  autoRenew: boolean("auto_renew").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => {
  return {
    uniqueMembership: unique().on(table.userId, table.tierId),
  };
});

// Community events (live streams, courses, workshops)
export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  communityId: integer("community_id").notNull().references(() => communities.id),
  hostId: integer("host_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  eventType: eventTypeEnum("event_type").notNull(),
  coverImage: text("cover_image"),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  timezone: varchar("timezone", { length: 50 }).notNull().default("UTC"),
  location: text("location"), // URL for virtual events or physical address
  price: doublePrecision("price").default(0), // 0 for free events
  currency: varchar("currency", { length: 3 }).notNull().default("USD"),
  maxAttendees: integer("max_attendees"),
  isPublished: boolean("is_published").default(false),
  requiredTierId: integer("required_tier_id").references(() => membershipTiers.id), // Optional tier restriction
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Event registrations
export const eventRegistrations = pgTable("event_registrations", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").notNull().references(() => events.id),
  userId: integer("user_id").notNull().references(() => users.id),
  status: varchar("status", { length: 20 }).notNull().default("registered"), // registered, attended, canceled, no_show
  registeredAt: timestamp("registered_at").defaultNow(),
  checkedInAt: timestamp("checked_in_at"),
}, (table) => {
  return {
    uniqueRegistration: unique().on(table.eventId, table.userId),
  };
});

// Polls for interactive community engagement
export const polls = pgTable("polls", {
  id: serial("id").primaryKey(),
  communityId: integer("community_id").notNull().references(() => communities.id),
  creatorId: integer("creator_id").notNull().references(() => users.id),
  question: text("question").notNull(),
  options: json("options").notNull(), // JSON array of option strings
  allowMultipleAnswers: boolean("allow_multiple_answers").default(false),
  startsAt: timestamp("starts_at").defaultNow(),
  endsAt: timestamp("ends_at"),
  isAnonymous: boolean("is_anonymous").default(false),
  isActive: boolean("is_active").default(true),
  totalVotes: integer("total_votes").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Poll votes
export const pollVotes = pgTable("poll_votes", {
  id: serial("id").primaryKey(),
  pollId: integer("poll_id").notNull().references(() => polls.id),
  userId: integer("user_id").notNull().references(() => users.id),
  selectedOptions: integer("selected_options").array().notNull(), // Array of option indices
  votedAt: timestamp("voted_at").defaultNow(),
}, (table) => {
  return {
    uniqueVote: unique().on(table.pollId, table.userId),
  };
});

// Creator earnings from monetization
export const creatorEarnings = pgTable("creator_earnings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  communityId: integer("community_id").references(() => communities.id),
  amount: doublePrecision("amount").notNull(),
  currency: varchar("currency", { length: 3 }).notNull().default("USD"),
  source: varchar("source", { length: 30 }).notNull(), // membership, event, donation, tips, ads
  sourceId: integer("source_id"), // Membership ID, Event ID, etc.
  status: varchar("status", { length: 20 }).notNull().default("pending"), // pending, paid, failed
  paymentDate: timestamp("payment_date"),
  platformFee: doublePrecision("platform_fee").notNull().default(0),
  taxWithheld: doublePrecision("tax_withheld").default(0),
  netAmount: doublePrecision("net_amount").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Subscriptions for recurring payments and monetization
export const subscriptions = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  creatorId: integer("creator_id").references(() => users.id),
  planName: varchar("plan_name", { length: 50 }).default("premium"),
  // Removed 'plan' field since it doesn't exist in the actual database
  amount: doublePrecision("amount").default(20),
  currency: varchar("currency", { length: 3 }).default("GBP"),
  interval: subscriptionIntervalEnum("interval").default("monthly"),
  status: varchar("status", { length: 20 }).notNull().default("active"), // active, trial, canceled, paused, expired
  currentPeriodStart: timestamp("current_period_start"),
  currentPeriodEnd: timestamp("current_period_end"),
  expiresAt: timestamp("expires_at"), // When the subscription ends (for trials or fixed terms)
  cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false),
  tier: varchar("tier", { length: 50 }), // Tier level (basic, premium, etc.)
  stripeCustomerId: varchar("stripe_customer_id", { length: 100 }),
  stripeSubscriptionId: varchar("stripe_subscription_id", { length: 100 }),
  paypalSubscriptionId: varchar("paypal_subscription_id", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Liked events for user favorites
export const likedEvents = pgTable("liked_events", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  eventId: integer("event_id").notNull().references(() => events.id),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => {
  return {
    uniqueLikedEvent: unique().on(table.userId, table.eventId),
  };
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users)
  .omit({ id: true, createdAt: true });

export const insertVendorSchema = createInsertSchema(vendors)
  .omit({ id: true, rating: true, ratingCount: true, isApproved: true, createdAt: true, updatedAt: true })
  .extend({
    // Make fields optional that are not collected in simplified forms
    businessName: z.string().optional(),
    businessType: z.string().optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zipCode: z.string().optional(),
    country: z.string().optional(),
  });

// Store Users schemas
export const insertStoreUserSchema = createInsertSchema(storeUsers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertStoreUser = z.infer<typeof insertStoreUserSchema>;
export type StoreUser = typeof storeUsers.$inferSelect;
  
export const vendorUpdateSchema = z.object({
  storeName: z.string().min(3).max(100).optional(),
  description: z.string().max(1000).nullable().optional(),
  logo: z.string().url().nullable().optional(),
});

export const insertProductSchema = createInsertSchema(products)
  .omit({ id: true, createdAt: true });

export const insertRegionalShippingSchema = createInsertSchema(regionalShipping)
  .omit({ id: true, createdAt: true, updatedAt: true });

export type InsertRegionalShipping = z.infer<typeof insertRegionalShippingSchema>;
export type RegionalShipping = typeof regionalShipping.$inferSelect;

export const insertPostSchema = createInsertSchema(posts)
  .omit({ 
    id: true, 
    likes: true, 
    comments: true, 
    shares: true, 
    views: true, 
    createdAt: true, 
    updatedAt: true 
  });

export const insertCommentSchema = createInsertSchema(comments)
  .omit({ id: true, createdAt: true });

export const insertMessageSchema = createInsertSchema(messages)
  .omit({ id: true, isRead: true, createdAt: true });

export const insertCallSessionSchema = createInsertSchema(callSessions)
  .omit({ id: true, startedAt: true, endedAt: true });

export const selectCallSessionSchema = createSelectSchema(callSessions);

export type CallSession = typeof callSessions.$inferSelect;
export type InsertCallSession = z.infer<typeof insertCallSessionSchema>;

export const insertReviewSchema = createInsertSchema(reviews)
  .omit({ id: true, createdAt: true });

export const insertCategorySchema = createInsertSchema(categories)
  .omit({ id: true });

export const insertCartSchema = createInsertSchema(carts)
  .omit({ id: true, createdAt: true });

export const insertWalletSchema = createInsertSchema(wallets)
  .omit({ id: true, createdAt: true, updatedAt: true });

export const insertTransactionSchema = createInsertSchema(transactions)
  .omit({ id: true, createdAt: true });

export const insertOrderSchema = createInsertSchema(orders)
  .omit({ id: true, createdAt: true, updatedAt: true });

export const insertOrderItemSchema = createInsertSchema(orderItems)
  .omit({ id: true, createdAt: true });

export const insertCryptoPaymentSchema = createInsertSchema(cryptoPayments)
  .omit({ id: true, createdAt: true, updatedAt: true });

// Community and Monetization Schemas
export const insertCommunitySchema = createInsertSchema(communities)
  .omit({ id: true, memberCount: true, isVerified: true, createdAt: true, updatedAt: true });

export const insertCommunityMemberSchema = createInsertSchema(communityMembers)
  .omit({ id: true, joinedAt: true });

export const insertMembershipTierSchema = createInsertSchema(membershipTiers)
  .omit({ id: true, createdAt: true, updatedAt: true });

export const insertMembershipSchema = createInsertSchema(memberships)
  .omit({ id: true, createdAt: true, updatedAt: true });

export const insertEventSchema = createInsertSchema(events)
  .omit({ id: true, createdAt: true, updatedAt: true });

export const insertEventRegistrationSchema = createInsertSchema(eventRegistrations)
  .omit({ id: true, registeredAt: true, checkedInAt: true });

export const insertPollSchema = createInsertSchema(polls)
  .omit({ id: true, totalVotes: true, createdAt: true, updatedAt: true });

export const insertPollVoteSchema = createInsertSchema(pollVotes)
  .omit({ id: true, votedAt: true });

export const insertCreatorEarningSchema = createInsertSchema(creatorEarnings)
  .omit({ id: true, createdAt: true, updatedAt: true });

export const insertSubscriptionSchema = createInsertSchema(subscriptions)
  .omit({ id: true, createdAt: true, updatedAt: true });


  
export const insertFriendRequestSchema = createInsertSchema(friendRequests)
  .omit({ id: true, status: true, createdAt: true, updatedAt: true });

export const insertConnectionSchema = createInsertSchema(connections)
  .omit({ id: true, status: true, createdAt: true, updatedAt: true });

export const insertFriendshipSchema = createInsertSchema(friendships)
  .omit({ id: true, status: true, createdAt: true, updatedAt: true });
  
export const insertLikeSchema = createInsertSchema(likes)
  .omit({ id: true, createdAt: true });
  
export const insertFollowSchema = createInsertSchema(follows)
  .omit({ id: true, createdAt: true });

export const insertLikedEventSchema = createInsertSchema(likedEvents)
  .omit({ id: true, createdAt: true });

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Vendor = typeof vendors.$inferSelect;
export type InsertVendor = z.infer<typeof insertVendorSchema>;

export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;

export type Post = typeof posts.$inferSelect;
export type InsertPost = z.infer<typeof insertPostSchema>;

export type Comment = typeof comments.$inferSelect;
export type InsertComment = z.infer<typeof insertCommentSchema>;

export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;

export type Review = typeof reviews.$inferSelect;
export type InsertReview = z.infer<typeof insertReviewSchema>;

export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;

export type Cart = typeof carts.$inferSelect;
export type InsertCart = z.infer<typeof insertCartSchema>;

export type Wallet = typeof wallets.$inferSelect;
export type InsertWallet = z.infer<typeof insertWalletSchema>;

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;

export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;

export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;

export type CryptoPayment = typeof cryptoPayments.$inferSelect;
export type InsertCryptoPayment = z.infer<typeof insertCryptoPaymentSchema>;

// Community and Monetization Types
export type Community = typeof communities.$inferSelect;
export type InsertCommunity = z.infer<typeof insertCommunitySchema>;

export type CommunityMember = typeof communityMembers.$inferSelect;
export type InsertCommunityMember = z.infer<typeof insertCommunityMemberSchema>;

export type MembershipTier = typeof membershipTiers.$inferSelect;
export type InsertMembershipTier = z.infer<typeof insertMembershipTierSchema>;

export type Membership = typeof memberships.$inferSelect;
export type InsertMembership = z.infer<typeof insertMembershipSchema>;

export type Event = typeof events.$inferSelect;
export type InsertEvent = z.infer<typeof insertEventSchema>;

export type EventRegistration = typeof eventRegistrations.$inferSelect;
export type InsertEventRegistration = z.infer<typeof insertEventRegistrationSchema>;

export type Poll = typeof polls.$inferSelect;
export type InsertPoll = z.infer<typeof insertPollSchema>;

export type PollVote = typeof pollVotes.$inferSelect;
export type InsertPollVote = z.infer<typeof insertPollVoteSchema>;

export type CreatorEarning = typeof creatorEarnings.$inferSelect;
export type InsertCreatorEarning = z.infer<typeof insertCreatorEarningSchema>;

export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;

export type FriendRequest = typeof friendRequests.$inferSelect;
export type InsertFriendRequest = z.infer<typeof insertFriendRequestSchema>;

export type Connection = typeof connections.$inferSelect;
export type InsertConnection = z.infer<typeof insertConnectionSchema>;

export type Friendship = typeof friendships.$inferSelect;
export type InsertFriendship = z.infer<typeof insertFriendshipSchema>;

export type Like = typeof likes.$inferSelect;
export type InsertLike = z.infer<typeof insertLikeSchema>;

export type Follow = typeof follows.$inferSelect;
export type InsertFollow = z.infer<typeof insertFollowSchema>;

export type LikedEvent = typeof likedEvents.$inferSelect;
export type InsertLikedEvent = z.infer<typeof insertLikedEventSchema>;

// Dating likes system
export const datingLikes = pgTable("dating_likes", {
  id: serial("id").primaryKey(),
  likerId: integer("liker_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  likedId: integer("liked_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  isLike: boolean("is_like").notNull().default(true), // true for like, false for pass
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => {
  return {
    likerLikedIdx: unique().on(table.likerId, table.likedId), // Prevent duplicate likes
    likerIdx: index("dating_likes_liker_idx").on(table.likerId),
    likedIdx: index("dating_likes_liked_idx").on(table.likedId),
  };
});

export const insertDatingLikeSchema = createInsertSchema(datingLikes)
  .omit({ id: true, createdAt: true });

export type DatingLike = typeof datingLikes.$inferSelect;
export type InsertDatingLike = z.infer<typeof insertDatingLikeSchema>;

// Dating matches (when two users like each other)
export const datingMatches = pgTable("dating_matches", {
  id: serial("id").primaryKey(),
  user1Id: integer("user1_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  user2Id: integer("user2_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  matchedAt: timestamp("matched_at").defaultNow(),
  isActive: boolean("is_active").default(true), // Can be deactivated if one user blocks/reports
  lastMessageAt: timestamp("last_message_at"),
}, (table) => {
  return {
    user1User2Idx: unique().on(table.user1Id, table.user2Id), // Prevent duplicate matches
    user1Idx: index("dating_matches_user1_idx").on(table.user1Id),
    user2Idx: index("dating_matches_user2_idx").on(table.user2Id),
  };
});

export const insertDatingMatchSchema = createInsertSchema(datingMatches)
  .omit({ id: true, matchedAt: true });

export type DatingMatch = typeof datingMatches.$inferSelect;
export type InsertDatingMatch = z.infer<typeof insertDatingMatchSchema>;

// Dating profile model
export const datingProfiles = pgTable("dating_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  displayName: text("display_name").notNull(),
  age: integer("age").notNull(),
  gender: text("gender"),
  sexualOrientation: text("sexual_orientation"),
  height: text("height"),
  incomeRange: text("income_range"),
  bio: text("bio"),
  location: text("location"),
  interests: text("interests").array(),
  lookingFor: text("looking_for"),
  relationshipType: text("relationship_type"),
  profileImages: text("profile_images").array(),
  isActive: boolean("is_active").default(false),
  isPremium: boolean("is_premium").default(false),
  datingRoomTier: text("dating_room_tier").default("normal"),
  // Geographic Information
  country: text("country"),
  region: text("region"),
  city: text("city"),
  // Demographic Information
  tribe: text("tribe"),
  language: text("language"),
  secondaryLanguage: text("secondary_language"),
  income: text("income"),
  education: text("education"),
  roots: text("roots"),
  // Selected gifts for profile showcase
  selectedGifts: integer("selected_gifts").array().default([]),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => {
  return {
    uniqueUserProfile: unique().on(table.userId),
  };
});

export const insertDatingProfileSchema = createInsertSchema(datingProfiles)
  .omit({ id: true, createdAt: true, updatedAt: true });

export type DatingProfile = typeof datingProfiles.$inferSelect;
export type InsertDatingProfile = z.infer<typeof insertDatingProfileSchema>;

// Video model for short-form, stories, live streams, and recorded videos
export const videos = pgTable("videos", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  description: text("description"),
  videoUrl: text("video_url").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  duration: integer("duration"), // in seconds
  videoType: videoTypeEnum("video_type").notNull(), // short_form, story, live_stream, live_commerce, recorded
  visibility: videoVisibilityEnum("visibility").default("public"),
  views: integer("views").default(0),
  likes: integer("likes").default(0),
  shares: integer("shares").default(0),
  isLive: boolean("is_live").default(false),
  isProcessed: boolean("is_processed").default(true), // Indicates if video has finished processing
  productId: integer("product_id").references(() => products.id), // For live commerce
  communityId: integer("community_id").references(() => communities.id), // For community-specific videos
  expiresAt: timestamp("expires_at"), // For stories that expire
  tags: text("tags").array(),
  isPremium: boolean("is_premium").default(false), // Whether this is a premium video requiring payment
  price: doublePrecision("price"), // Price for accessing premium content, null for free content
  currency: varchar("currency", { length: 3 }).default("GBP"), // Currency for pricing
  monetizationType: videoMonetizationEnum("monetization_type").default("free"), // free, ppv, subscription
  stripeProductId: varchar("stripe_product_id", { length: 100 }), // Stripe product ID for monetization
  stripePriceId: varchar("stripe_price_id", { length: 100 }), // Stripe price ID for monetization
  storageKey: varchar("storage_key", { length: 255 }), // Object storage key for protected content
  previewUrl: text("preview_url"), // Preview video URL for subscription content
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Video engagements model (comments, reactions)
export const videoEngagements = pgTable("video_engagements", {
  id: serial("id").primaryKey(),
  videoId: integer("video_id").notNull().references(() => videos.id),
  userId: integer("user_id").notNull().references(() => users.id),
  type: varchar("type", { length: 20 }).notNull(), // comment, reaction, share
  content: text("content"), // For comments
  reactionType: varchar("reaction_type", { length: 20 }), // like, love, laugh, etc.
  timestamp: integer("timestamp"), // Timestamp in the video (in seconds) for timed comments
  createdAt: timestamp("created_at").defaultNow(),
});

// Video product overlays for live commerce
export const videoProductOverlays = pgTable("video_product_overlays", {
  id: serial("id").primaryKey(),
  videoId: integer("video_id").notNull().references(() => videos.id),
  productId: integer("product_id").notNull().references(() => products.id),
  positionX: integer("position_x").notNull().default(50), // X position in percentage (0-100)
  positionY: integer("position_y").notNull().default(50), // Y position in percentage (0-100)
  size: integer("size").notNull().default(20), // Size in percentage (10-50)
  startTime: integer("start_time"), // When to show the overlay (seconds from video start)
  endTime: integer("end_time"), // When to hide the overlay (seconds from video start)
  displayOrder: integer("display_order").default(0), // Order when multiple products are displayed
  isActive: boolean("is_active").default(true),
  clickCount: integer("click_count").default(0), // How many times the overlay was clicked
  conversionCount: integer("conversion_count").default(0), // How many purchases resulted
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Video analytics model
export const videoAnalytics = pgTable("video_analytics", {
  id: serial("id").primaryKey(),
  videoId: integer("video_id").notNull().references(() => videos.id),
  totalViews: integer("total_views").default(0),
  uniqueViewers: integer("unique_viewers").default(0),
  averageWatchTime: integer("average_watch_time").default(0), // in seconds
  completionRate: doublePrecision("completion_rate").default(0), // percentage of viewers who watched to the end
  engagementRate: doublePrecision("engagement_rate").default(0), // likes + comments + shares / views
  demographics: json("demographics"), // JSON data for viewer demographics
  viewsByCountry: json("views_by_country"), // JSON data for geographic distribution
  productClickRate: doublePrecision("product_click_rate").default(0), // Percentage of viewers who clicked on products
  productConversionRate: doublePrecision("product_conversion_rate").default(0), // Percentage of clicks that led to purchase
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Video playlist model 
export const videoPlaylists = pgTable("video_playlists", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  description: text("description"),
  isPublic: boolean("is_public").default(true),
  thumbnailUrl: text("thumbnail_url"),
  videoCount: integer("video_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Video playlist items model
export const playlistItems = pgTable("playlist_items", {
  id: serial("id").primaryKey(),
  playlistId: integer("playlist_id").notNull().references(() => videoPlaylists.id),
  videoId: integer("video_id").notNull().references(() => videos.id),
  position: integer("position").notNull(), // Order in the playlist
  addedAt: timestamp("added_at").defaultNow(),
}, (table) => {
  return {
    uniquePlaylistItem: unique().on(table.playlistId, table.videoId),
  };
});

// Video schemas
// Video purchases for premium content access
export const videoPurchases = pgTable("video_purchases", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  videoId: integer("video_id").notNull().references(() => videos.id),
  amount: doublePrecision("amount").notNull(), // Amount paid
  currency: varchar("currency", { length: 3 }).notNull().default("GBP"),
  paymentMethod: varchar("payment_method", { length: 20 }).notNull(), // stripe, paypal, wallet, etc.
  transactionId: varchar("transaction_id", { length: 100 }), // Reference to payment provider transaction
  status: varchar("status", { length: 20 }).notNull().default("completed"), // pending, completed, failed, refunded
  expiresAt: timestamp("expires_at"), // For time-limited access (null for permanent)
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => {
  return {
    // Each user can only have one active purchase per video
    uniqueUserVideo: unique().on(table.userId, table.videoId),
  };
});

export const insertVideoSchema = createInsertSchema(videos)
  .omit({ id: true, views: true, likes: true, shares: true, createdAt: true, updatedAt: true });
export const insertVideoEngagementSchema = createInsertSchema(videoEngagements);
export const insertVideoProductOverlaySchema = createInsertSchema(videoProductOverlays)
  .omit({ id: true, clickCount: true, conversionCount: true, createdAt: true, updatedAt: true });
export const insertVideoAnalyticsSchema = createInsertSchema(videoAnalytics);
export const insertVideoPlaylistSchema = createInsertSchema(videoPlaylists);
export const insertPlaylistItemSchema = createInsertSchema(playlistItems);
export const insertVideoPurchaseSchema = createInsertSchema(videoPurchases)
  .omit({ id: true, createdAt: true, updatedAt: true });

// Video types
export type Video = typeof videos.$inferSelect;
export type InsertVideo = z.infer<typeof insertVideoSchema>;

// Advertisement management system
export const advertisementStatusEnum = pgEnum('advertisement_status', ['active', 'paused', 'expired', 'pending', 'rejected']);
export const advertisementPlacementEnum = pgEnum('advertisement_placement', ['marketplace', 'community', 'dating', 'all']);
export const advertisementTypeEnum = pgEnum('advertisement_type', ['banner', 'sidebar', 'popup', 'native', 'video']);

// Advertisements table
export const advertisements = pgTable('advertisements', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  imageUrl: text('image_url'),
  videoUrl: text('video_url'),
  linkUrl: text('link_url').notNull(),
  placement: advertisementPlacementEnum('placement').notNull(),
  type: advertisementTypeEnum('type').notNull(),
  status: advertisementStatusEnum('status').default('pending'),
  
  // Advertiser information
  advertiserName: varchar('advertiser_name', { length: 255 }).notNull(),
  advertiserEmail: varchar('advertiser_email', { length: 255 }).notNull(),
  advertiserPhone: varchar('advertiser_phone', { length: 50 }),
  advertiserCompany: varchar('advertiser_company', { length: 255 }),
  advertiserAddress: text('advertiser_address'),
  
  // Payment information
  budget: decimal('budget', { precision: 10, scale: 2 }).notNull(),
  spentAmount: decimal('spent_amount', { precision: 10, scale: 2 }).default('0'),
  costPerClick: decimal('cost_per_click', { precision: 10, scale: 4 }),
  costPerImpression: decimal('cost_per_impression', { precision: 10, scale: 4 }),
  
  // Campaign details
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date').notNull(),
  targetAudience: json('target_audience'),
  keywords: json('keywords'),
  
  // Analytics
  impressions: integer('impressions').default(0),
  clicks: integer('clicks').default(0),
  conversions: integer('conversions').default(0),
  
  // System fields
  createdBy: integer('created_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Advertisement clicks tracking
export const advertisementClicks = pgTable('advertisement_clicks', {
  id: serial('id').primaryKey(),
  advertisementId: integer('advertisement_id').references(() => advertisements.id).notNull(),
  userId: integer('user_id').references(() => users.id),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  referer: text('referer'),
  clickedAt: timestamp('clicked_at').defaultNow(),
});

// Advertisement impressions tracking
export const advertisementImpressions = pgTable('advertisement_impressions', {
  id: serial('id').primaryKey(),
  advertisementId: integer('advertisement_id').references(() => advertisements.id).notNull(),
  userId: integer('user_id').references(() => users.id),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  page: varchar('page', { length: 255 }),
  viewedAt: timestamp('viewed_at').defaultNow(),
});

// Advertisement schemas
export const insertAdvertisementSchema = createInsertSchema(advertisements).omit({
  id: true,
  impressions: true,
  clicks: true,
  conversions: true,
  spentAmount: true,
  createdAt: true,
  updatedAt: true,
});

export const selectAdvertisementSchema = createSelectSchema(advertisements);
export type InsertAdvertisement = z.infer<typeof insertAdvertisementSchema>;
export type Advertisement = z.infer<typeof selectAdvertisementSchema>;

export type VideoEngagement = typeof videoEngagements.$inferSelect;
export type InsertVideoEngagement = z.infer<typeof insertVideoEngagementSchema>;

export type VideoProductOverlay = typeof videoProductOverlays.$inferSelect;
export type InsertVideoProductOverlay = z.infer<typeof insertVideoProductOverlaySchema>;

export type VideoAnalytics = typeof videoAnalytics.$inferSelect;
export type InsertVideoAnalytics = z.infer<typeof insertVideoAnalyticsSchema>;

export type VideoPlaylist = typeof videoPlaylists.$inferSelect;
export type InsertVideoPlaylist = z.infer<typeof insertVideoPlaylistSchema>;

export type PlaylistItem = typeof playlistItems.$inferSelect;
export type InsertPlaylistItem = z.infer<typeof insertPlaylistItemSchema>;

export type VideoPurchase = typeof videoPurchases.$inferSelect;
export type InsertVideoPurchase = z.infer<typeof insertVideoPurchaseSchema>;

// Community content for exclusive/premium content
export const contentTypeEnum = pgEnum('content_type', ['video', 'article', 'image', 'audio']);

export const communityContents = pgTable("community_contents", {
  id: serial("id").primaryKey(),
  communityId: integer("community_id").notNull().references(() => communities.id),
  creatorId: integer("creator_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  content: text("content"), // Main content text (for articles)
  contentType: contentTypeEnum("content_type").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  videoUrl: text("video_url"), // For video content
  audioUrl: text("audio_url"), // For audio content
  imageUrl: text("image_url"), // For image content
  tierId: integer("tier_id").notNull().references(() => membershipTiers.id), // Required tier to access
  isFeatured: boolean("is_featured").default(false),
  viewCount: integer("view_count").default(0),
  likeCount: integer("like_count").default(0),
  commentCount: integer("comment_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertCommunityContentSchema = createInsertSchema(communityContents)
  .omit({ id: true, viewCount: true, likeCount: true, commentCount: true, createdAt: true, updatedAt: true });

export type CommunityContent = typeof communityContents.$inferSelect;
export type InsertCommunityContent = z.infer<typeof insertCommunityContentSchema>;

// Community content likes
export const communityContentLikes = pgTable("community_content_likes", {
  id: serial("id").primaryKey(),
  contentId: integer("content_id").notNull().references(() => communityContents.id, { onDelete: 'cascade' }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => {
  return {
    uniqueLike: unique().on(table.contentId, table.userId),
  };
});

export const insertCommunityContentLikeSchema = createInsertSchema(communityContentLikes)
  .omit({ id: true, createdAt: true });

export type CommunityContentLike = typeof communityContentLikes.$inferSelect;
export type InsertCommunityContentLike = z.infer<typeof insertCommunityContentLikeSchema>;

// Auth tokens for token-based authentication (multi-device support)
export const authTokens = pgTable("auth_tokens", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  token: varchar("token", { length: 512 }).notNull().unique(), // Increased to 512 to accommodate JWT tokens
  clientId: varchar("client_id", { length: 100 }), // Client identifier
  deviceType: varchar("device_type", { length: 50 }), // mobile, tablet, desktop, etc.
  deviceInfo: varchar("device_info", { length: 512 }), // Browser/device details for security
  ipAddress: varchar("ip_address", { length: 50 }), // IP address for security logging
  lastActiveAt: timestamp("last_active_at").defaultNow(),
  expiresAt: timestamp("expires_at").notNull(),
  isRevoked: boolean("is_revoked").default(false),
  revokedReason: varchar("revoked_reason", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => {
  return {
    userIdIdx: index("auth_tokens_user_id_idx").on(table.userId),
    tokenIdx: index("auth_tokens_token_idx").on(table.token),
  };
});

export const insertAuthTokenSchema = createInsertSchema(authTokens)
  .omit({ id: true, createdAt: true });

export type AuthToken = typeof authTokens.$inferSelect;
export type InsertAuthToken = z.infer<typeof insertAuthTokenSchema>;

// Content Moderation Tables
export const allowList = pgTable("allow_list", {
  id: serial("id").primaryKey(),
  term: text("term").notNull().unique(),
  category: text("category").notNull().default("general"),
  description: text("description"),
  addedBy: integer("added_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const blockList = pgTable("block_list", {
  id: serial("id").primaryKey(),
  term: text("term").notNull().unique(),
  category: text("category").notNull().default("general"),
  matchType: moderationMatchTypeEnum("match_type").notNull().default("exact"),
  severity: moderationSeverityEnum("severity").notNull().default("medium"),
  description: text("description"),
  addedBy: integer("added_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const flaggedContent = pgTable("flagged_content", {
  id: serial("id").primaryKey(),
  contentType: flaggedContentTypeEnum("content_type").notNull(),
  contentId: integer("content_id").notNull(),
  reason: text("reason").notNull(),
  status: flaggedContentStatusEnum("status").notNull().default("pending"),
  reportedBy: integer("reported_by").references(() => users.id),
  reviewedBy: integer("reviewed_by").references(() => users.id),
  reviewedAt: timestamp("reviewed_at"),
  moderationNote: text("moderation_note"),
  content: text("content"), // Excerpt of the content being flagged
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const flaggedImages = pgTable("flagged_images", {
  id: serial("id").primaryKey(),
  imageUrl: text("image_url").notNull(),
  contentType: flaggedContentTypeEnum("content_type").notNull(),
  contentId: integer("content_id").notNull(),
  reason: text("reason").notNull(),
  status: flaggedContentStatusEnum("status").notNull().default("pending"),
  reportedBy: integer("reported_by").references(() => users.id),
  reviewedBy: integer("reviewed_by").references(() => users.id),
  reviewedAt: timestamp("reviewed_at"),
  moderationNote: text("moderation_note"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const moderationReports = pgTable("moderation_reports", {
  id: serial("id").primaryKey(),
  reportType: text("report_type").notNull(), // user, post, comment, product, etc.
  reporterId: integer("reporter_id").references(() => users.id).notNull(),
  subjectId: integer("subject_id").notNull(), // User ID, Post ID, etc.
  subjectType: text("subject_type").notNull(), // user, post, comment, etc.
  reason: text("reason").notNull(),
  description: text("description"),
  status: text("status").notNull().default("pending"), // pending, reviewed, dismissed
  reviewedById: integer("reviewed_by_id").references(() => users.id),
  reviewedAt: timestamp("reviewed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const productReports = pgTable("product_reports", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  reporterId: integer("reporter_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  reason: productReportReasonEnum("reason").notNull(),
  customMessage: text("custom_message"),
  status: productReportStatusEnum("status").notNull().default("pending"),
  reviewedById: integer("reviewed_by_id").references(() => users.id),
  reviewedAt: timestamp("reviewed_at"),
  adminNotes: text("admin_notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  productIdIdx: index("product_reports_product_id_idx").on(table.productId),
  reporterIdIdx: index("product_reports_reporter_id_idx").on(table.reporterId),
  statusIdx: index("product_reports_status_idx").on(table.status),
  createdAtIdx: index("product_reports_created_at_idx").on(table.createdAt),
}));

export const userBlocks = pgTable("user_blocks", {
  id: serial("id").primaryKey(),
  blockerId: integer("blocker_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  blockedId: integer("blocked_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  reason: text("reason"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => {
  return {
    uniqueBlock: unique().on(table.blockerId, table.blockedId),
    blockerIdIdx: index("user_blocks_blocker_id_idx").on(table.blockerId),
    blockedIdIdx: index("user_blocks_blocked_id_idx").on(table.blockedId),
  };
});

export const toastReports = pgTable("toast_reports", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
  errorType: text("error_type").notNull(),
  errorMessage: text("error_message").notNull(),
  toastTitle: text("toast_title"),
  toastDescription: text("toast_description"),
  url: text("url").notNull(),
  userAgent: text("user_agent"),
  status: text("status").notNull().default("pending"),
  reviewedById: integer("reviewed_by_id").references(() => users.id),
  reviewedAt: timestamp("reviewed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => {
  return {
    userIdIdx: index("toast_reports_user_id_idx").on(table.userId),
    statusIdx: index("toast_reports_status_idx").on(table.status),
    createdAtIdx: index("toast_reports_created_at_idx").on(table.createdAt),
  };
});

// Schemas
export const insertAllowListSchema = createInsertSchema(allowList).omit({ id: true, createdAt: true, updatedAt: true });
export const insertBlockListSchema = createInsertSchema(blockList).omit({ id: true, createdAt: true, updatedAt: true });
export const insertFlaggedContentSchema = createInsertSchema(flaggedContent).omit({ id: true, reviewedAt: true, createdAt: true, updatedAt: true });
export const insertFlaggedImageSchema = createInsertSchema(flaggedImages).omit({ id: true, reviewedAt: true, createdAt: true, updatedAt: true });
export const insertModerationReportSchema = createInsertSchema(moderationReports).omit({ id: true, reviewedAt: true, createdAt: true, updatedAt: true });
export const insertProductReportSchema = createInsertSchema(productReports).omit({ id: true, reviewedAt: true, createdAt: true, updatedAt: true });
export const insertUserBlockSchema = createInsertSchema(userBlocks).omit({ id: true, createdAt: true });
export const insertToastReportSchema = createInsertSchema(toastReports).omit({ id: true, reviewedAt: true, createdAt: true, updatedAt: true });

// Types
export type AllowListItem = typeof allowList.$inferSelect;
export type InsertAllowListItem = z.infer<typeof insertAllowListSchema>;

export type BlockListItem = typeof blockList.$inferSelect;
export type InsertBlockListItem = z.infer<typeof insertBlockListSchema>;

export type FlaggedContentItem = typeof flaggedContent.$inferSelect;
export type InsertFlaggedContentItem = z.infer<typeof insertFlaggedContentSchema>;

export type FlaggedImage = typeof flaggedImages.$inferSelect;
export type InsertFlaggedImage = z.infer<typeof insertFlaggedImageSchema>;

export type ModerationReport = typeof moderationReports.$inferSelect;
export type InsertModerationReport = z.infer<typeof insertModerationReportSchema>;

export type ProductReport = typeof productReports.$inferSelect;
export type InsertProductReport = z.infer<typeof insertProductReportSchema>;

export type UserBlock = typeof userBlocks.$inferSelect;
export type InsertUserBlock = z.infer<typeof insertUserBlockSchema>;

export type ToastReport = typeof toastReports.$inferSelect;
export type InsertToastReport = z.infer<typeof insertToastReportSchema>;

// Vendor Analytics Tables

// Product Views Analytics
export const productViews = pgTable("product_views", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  vendorId: integer("vendor_id").notNull().references(() => vendors.id, { onDelete: "cascade" }),
  userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
  sessionId: text("session_id"),
  deviceType: deviceTypeEnum("device_type").notNull(),
  trafficSource: trafficSourceEnum("traffic_source").notNull(),
  country: text("country"),
  region: text("region"),
  city: text("city"),
  userAgent: text("user_agent"),
  ipAddress: text("ip_address"),
  duration: integer("duration").default(0), // in seconds
  bounceRate: boolean("bounce_rate").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Conversion Tracking
export const conversionEvents = pgTable("conversion_events", {
  id: serial("id").primaryKey(),
  vendorId: integer("vendor_id").notNull().references(() => vendors.id, { onDelete: "cascade" }),
  productId: integer("product_id").references(() => products.id, { onDelete: "cascade" }),
  userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
  sessionId: text("session_id"),
  conversionType: conversionTypeEnum("conversion_type").notNull(),
  value: doublePrecision("value").default(0),
  currency: text("currency").default("GBP"),
  deviceType: deviceTypeEnum("device_type").notNull(),
  trafficSource: trafficSourceEnum("traffic_source").notNull(),
  conversionPath: json("conversion_path").$type<string[]>(),
  timeToConversion: integer("time_to_conversion"), // in seconds
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Search Analytics
export const searchAnalytics = pgTable("search_analytics", {
  id: serial("id").primaryKey(),
  vendorId: integer("vendor_id").notNull().references(() => vendors.id, { onDelete: "cascade" }),
  searchQuery: text("search_query").notNull(),
  userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
  sessionId: text("session_id"),
  resultsFound: integer("results_found").default(0),
  clickedProductId: integer("clicked_product_id").references(() => products.id, { onDelete: "set null" }),
  clickPosition: integer("click_position"),
  deviceType: deviceTypeEnum("device_type").notNull(),
  converted: boolean("converted").default(false),
  conversionValue: doublePrecision("conversion_value").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Session Analytics
export const sessionAnalytics = pgTable("session_analytics", {
  id: serial("id").primaryKey(),
  vendorId: integer("vendor_id").notNull().references(() => vendors.id, { onDelete: "cascade" }),
  sessionId: text("session_id").notNull(),
  userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
  deviceType: deviceTypeEnum("device_type").notNull(),
  trafficSource: trafficSourceEnum("traffic_source").notNull(),
  country: text("country"),
  ageGroup: text("age_group"),
  gender: genderEnum("gender"),
  pageViews: integer("page_views").default(1),
  sessionDuration: integer("session_duration").default(0), // in seconds
  bounced: boolean("bounced").default(false),
  converted: boolean("converted").default(false),
  conversionValue: doublePrecision("conversion_value").default(0),
  productsViewed: json("products_viewed").$type<number[]>(),
  cartValue: doublePrecision("cart_value").default(0),
  startedAt: timestamp("started_at").defaultNow().notNull(),
  endedAt: timestamp("ended_at"),
});

// Competitor Analysis
export const competitorAnalytics = pgTable("competitor_analytics", {
  id: serial("id").primaryKey(),
  vendorId: integer("vendor_id").notNull().references(() => vendors.id, { onDelete: "cascade" }),
  competitorVendorId: integer("competitor_vendor_id").notNull().references(() => vendors.id, { onDelete: "cascade" }),
  category: text("category").notNull(),
  averagePrice: doublePrecision("average_price").default(0),
  totalProducts: integer("total_products").default(0),
  monthlyRevenue: doublePrecision("monthly_revenue").default(0),
  marketShare: doublePrecision("market_share").default(0),
  rating: doublePrecision("rating").default(0),
  reviewCount: integer("review_count").default(0),
  analyzedAt: timestamp("analyzed_at").defaultNow().notNull(),
});

// Financial Analytics
export const financialAnalytics = pgTable("financial_analytics", {
  id: serial("id").primaryKey(),
  vendorId: integer("vendor_id").notNull().references(() => vendors.id, { onDelete: "cascade" }),
  period: analyticsPeriodEnum("period").notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  grossRevenue: doublePrecision("gross_revenue").default(0),
  netRevenue: doublePrecision("net_revenue").default(0),
  totalCosts: doublePrecision("total_costs").default(0),
  platformFees: doublePrecision("platform_fees").default(0),
  shippingCosts: doublePrecision("shipping_costs").default(0),
  marketingCosts: doublePrecision("marketing_costs").default(0),
  grossProfit: doublePrecision("gross_profit").default(0),
  netProfit: doublePrecision("net_profit").default(0),
  profitMargin: doublePrecision("profit_margin").default(0),
  averageOrderValue: doublePrecision("average_order_value").default(0),
  totalOrders: integer("total_orders").default(0),
  totalRefunds: doublePrecision("total_refunds").default(0),
  refundRate: doublePrecision("refund_rate").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Product Performance Analytics
export const productAnalytics = pgTable("product_analytics", {
  id: serial("id").primaryKey(),
  vendorId: integer("vendor_id").notNull().references(() => vendors.id, { onDelete: "cascade" }),
  productId: integer("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  period: analyticsPeriodEnum("period").notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  views: integer("views").default(0),
  uniqueViews: integer("unique_views").default(0),
  cartAdds: integer("cart_adds").default(0),
  purchases: integer("purchases").default(0),
  revenue: doublePrecision("revenue").default(0),
  conversionRate: doublePrecision("conversion_rate").default(0),
  averageTimeOnPage: integer("average_time_on_page").default(0),
  bounceRate: doublePrecision("bounce_rate").default(0),
  inventorySold: integer("inventory_sold").default(0),
  inventoryRemaining: integer("inventory_remaining").default(0),
  averageRating: doublePrecision("average_rating").default(0),
  reviewCount: integer("review_count").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Market Trends Analytics
export const marketTrends = pgTable("market_trends", {
  id: serial("id").primaryKey(),
  vendorId: integer("vendor_id").notNull().references(() => vendors.id, { onDelete: "cascade" }),
  category: text("category").notNull(),
  period: analyticsPeriodEnum("period").notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  trendDirection: text("trend_direction").notNull(), // 'up', 'down', 'stable'
  growthRate: doublePrecision("growth_rate").default(0),
  marketDemand: doublePrecision("market_demand").default(0),
  seasonalityFactor: doublePrecision("seasonality_factor").default(1),
  competitorCount: integer("competitor_count").default(0),
  averagePrice: doublePrecision("average_price").default(0),
  priceVolatility: doublePrecision("price_volatility").default(0),
  searchVolume: integer("search_volume").default(0),
  recommendedActions: json("recommended_actions").$type<string[]>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Product Forecasting
export const productForecasts = pgTable("product_forecasts", {
  id: serial("id").primaryKey(),
  vendorId: integer("vendor_id").notNull().references(() => vendors.id, { onDelete: "cascade" }),
  productId: integer("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  forecastPeriod: analyticsPeriodEnum("forecast_period").notNull(),
  forecastDate: date("forecast_date").notNull(),
  predictedSales: integer("predicted_sales").default(0),
  predictedRevenue: doublePrecision("predicted_revenue").default(0),
  confidenceLevel: doublePrecision("confidence_level").default(0),
  seasonalAdjustment: doublePrecision("seasonal_adjustment").default(1),
  trendAdjustment: doublePrecision("trend_adjustment").default(1),
  historicalAccuracy: doublePrecision("historical_accuracy").default(0),
  recommendedInventory: integer("recommended_inventory").default(0),
  recommendedPrice: doublePrecision("recommended_price").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Demographic Analytics
export const demographicAnalytics = pgTable("demographic_analytics", {
  id: serial("id").primaryKey(),
  vendorId: integer("vendor_id").notNull().references(() => vendors.id, { onDelete: "cascade" }),
  period: analyticsPeriodEnum("period").notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  ageGroup: text("age_group").notNull(),
  gender: genderEnum("gender"),
  country: text("country"),
  region: text("region"),
  incomeLevel: text("income_level"),
  totalUsers: integer("total_users").default(0),
  totalOrders: integer("total_orders").default(0),
  totalRevenue: doublePrecision("total_revenue").default(0),
  averageOrderValue: doublePrecision("average_order_value").default(0),
  conversionRate: doublePrecision("conversion_rate").default(0),
  returnRate: doublePrecision("return_rate").default(0),
  lifetimeValue: doublePrecision("lifetime_value").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Add schemas for new tables
export const insertUserSessionSchema = createInsertSchema(userSessions).omit({ id: true, createdAt: true });
export const insertTrafficAnalyticsSchema = createInsertSchema(trafficAnalytics).omit({ id: true, createdAt: true });
export const insertProductViewSchema = createInsertSchema(productViews).omit({ id: true, createdAt: true });
export const insertConversionEventSchema = createInsertSchema(conversionEvents).omit({ id: true, createdAt: true });
export const insertSearchAnalyticsSchema = createInsertSchema(searchAnalytics).omit({ id: true, createdAt: true });
export const insertSessionAnalyticsSchema = createInsertSchema(sessionAnalytics).omit({ id: true, startedAt: true });
export const insertCompetitorAnalyticsSchema = createInsertSchema(competitorAnalytics).omit({ id: true, analyzedAt: true });
export const insertFinancialAnalyticsSchema = createInsertSchema(financialAnalytics).omit({ id: true, createdAt: true });
export const insertProductAnalyticsSchema = createInsertSchema(productAnalytics).omit({ id: true, createdAt: true });
export const insertMarketTrendsSchema = createInsertSchema(marketTrends).omit({ id: true, createdAt: true });
export const insertProductForecastSchema = createInsertSchema(productForecasts).omit({ id: true, createdAt: true });
export const insertDemographicAnalyticsSchema = createInsertSchema(demographicAnalytics).omit({ id: true, createdAt: true });

// Add types for new tables
export type UserSession = typeof userSessions.$inferSelect;
export type InsertUserSession = z.infer<typeof insertUserSessionSchema>;

export type TrafficAnalytic = typeof trafficAnalytics.$inferSelect;
export type InsertTrafficAnalytic = z.infer<typeof insertTrafficAnalyticsSchema>;

export type ProductView = typeof productViews.$inferSelect;
export type InsertProductView = z.infer<typeof insertProductViewSchema>;

export type ConversionEvent = typeof conversionEvents.$inferSelect;
export type InsertConversionEvent = z.infer<typeof insertConversionEventSchema>;

export type SearchAnalytics = typeof searchAnalytics.$inferSelect;
export type InsertSearchAnalytics = z.infer<typeof insertSearchAnalyticsSchema>;

export type SessionAnalytics = typeof sessionAnalytics.$inferSelect;
export type InsertSessionAnalytics = z.infer<typeof insertSessionAnalyticsSchema>;

export type CompetitorAnalytics = typeof competitorAnalytics.$inferSelect;
export type InsertCompetitorAnalytics = z.infer<typeof insertCompetitorAnalyticsSchema>;

export type FinancialAnalytics = typeof financialAnalytics.$inferSelect;
export type InsertFinancialAnalytics = z.infer<typeof insertFinancialAnalyticsSchema>;

export type ProductAnalytics = typeof productAnalytics.$inferSelect;
export type InsertProductAnalytics = z.infer<typeof insertProductAnalyticsSchema>;

export type MarketTrends = typeof marketTrends.$inferSelect;
export type InsertMarketTrends = z.infer<typeof insertMarketTrendsSchema>;

export type ProductForecast = typeof productForecasts.$inferSelect;
export type InsertProductForecast = z.infer<typeof insertProductForecastSchema>;

export type DemographicAnalytics = typeof demographicAnalytics.$inferSelect;
export type InsertDemographicAnalytics = z.infer<typeof insertDemographicAnalyticsSchema>;

// Saved posts schema and types
export const insertSavedPostSchema = createInsertSchema(savedPosts).omit({ id: true, createdAt: true });
export type SavedPost = typeof savedPosts.$inferSelect;
export type InsertSavedPost = z.infer<typeof insertSavedPostSchema>;

// Notification schemas and types
export const insertNotificationSchema = createInsertSchema(notifications).omit({ id: true, createdAt: true });
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;

// Notification Settings schemas and types
export const insertNotificationSettingsSchema = createInsertSchema(notificationSettings).omit({ id: true, createdAt: true, updatedAt: true });
export type NotificationSettings = typeof notificationSettings.$inferSelect;
export type InsertNotificationSettings = z.infer<typeof insertNotificationSettingsSchema>;

// =====================================
// Marketing Campaign Schema
// =====================================

// Campaign status enum
export const campaignStatusEnum = pgEnum("campaign_status", ["draft", "active", "paused", "completed", "cancelled"]);

// Campaign type enum
export const campaignTypeEnum = pgEnum("campaign_type", ["awareness", "conversion", "retention", "engagement", "lead_generation"]);

// Marketing channel enum
export const marketingChannelEnum = pgEnum("marketing_channel", [
  "social_media", "email", "sms", "google_ads", "facebook_ads", "instagram_ads", 
  "youtube_ads", "linkedin_ads", "twitter_ads", "tiktok_ads", "snapchat_ads",
  "display_ads", "search_ads", "influencer", "affiliate", "content_marketing",
  "direct_mail", "print_ads", "radio", "tv", "podcast", "webinar", "event",
  "referral", "organic_search", "word_of_mouth", "other"
]);

// Budget type enum
export const budgetTypeEnum = pgEnum("budget_type", ["daily", "total", "monthly"]);

// Marketing campaigns table
export const marketingCampaigns = pgTable("marketing_campaigns", {
  id: serial("id").primaryKey(),
  vendorId: integer("vendor_id").notNull().references(() => vendors.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  type: campaignTypeEnum("type").notNull(),
  status: campaignStatusEnum("status").notNull().default("draft"),
  
  // Budget and goals
  budgetAmount: decimal("budget_amount", { precision: 10, scale: 2 }),
  budgetType: budgetTypeEnum("budget_type"),
  targetAudience: text("target_audience"),
  primaryGoal: varchar("primary_goal", { length: 100 }),
  secondaryGoals: json("secondary_goals").$type<string[]>(),
  
  // Targeting
  ageRangeMin: integer("age_range_min"),
  ageRangeMax: integer("age_range_max"),
  genderTarget: varchar("gender_target", { length: 20 }),
  locationTargets: json("location_targets").$type<string[]>(),
  interestTargets: json("interest_targets").$type<string[]>(),
  behaviorTargets: json("behavior_targets").$type<string[]>(),
  
  // Timeline
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  
  // Performance tracking
  impressions: integer("impressions").default(0),
  clicks: integer("clicks").default(0),
  conversions: integer("conversions").default(0),
  revenue: decimal("revenue", { precision: 10, scale: 2 }).default("0"),
  cost: decimal("cost", { precision: 10, scale: 2 }).default("0"),
  
  // Metadata
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => {
  return {
    vendorIdIdx: index('idx_campaigns_vendor_id').on(table.vendorId),
    statusIdx: index('idx_campaigns_status').on(table.status),
    typeIdx: index('idx_campaigns_type').on(table.type),
    startDateIdx: index('idx_campaigns_start_date').on(table.startDate),
    endDateIdx: index('idx_campaigns_end_date').on(table.endDate),
    activeIdx: index('idx_campaigns_active').on(table.isActive),
  };
});

// Campaign activities (individual marketing initiatives within a campaign)
export const campaignActivities = pgTable("campaign_activities", {
  id: serial("id").primaryKey(),
  campaignId: integer("campaign_id").notNull().references(() => marketingCampaigns.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  channel: marketingChannelEnum("channel").notNull(),
  
  // Activity details
  content: text("content"),
  mediaUrls: json("media_urls").$type<string[]>(),
  targetUrl: varchar("target_url", { length: 500 }),
  callToAction: varchar("call_to_action", { length: 100 }),
  
  // Budget allocation
  budgetAllocated: decimal("budget_allocated", { precision: 10, scale: 2 }),
  actualSpend: decimal("actual_spend", { precision: 10, scale: 2 }).default("0"),
  
  // Scheduling
  scheduledDate: timestamp("scheduled_date"),
  publishedDate: timestamp("published_date"),
  
  // Performance tracking
  impressions: integer("impressions").default(0),
  clicks: integer("clicks").default(0),
  engagements: integer("engagements").default(0),
  conversions: integer("conversions").default(0),
  revenue: decimal("revenue", { precision: 10, scale: 2 }).default("0"),
  
  // Metrics
  clickThroughRate: decimal("click_through_rate", { precision: 5, scale: 4 }),
  conversionRate: decimal("conversion_rate", { precision: 5, scale: 4 }),
  costPerClick: decimal("cost_per_click", { precision: 10, scale: 2 }),
  costPerConversion: decimal("cost_per_conversion", { precision: 10, scale: 2 }),
  returnOnAdSpend: decimal("return_on_ad_spend", { precision: 5, scale: 2 }),
  
  // Status
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => {
  return {
    campaignIdIdx: index('idx_activities_campaign_id').on(table.campaignId),
    channelIdx: index('idx_activities_channel').on(table.channel),
    scheduledDateIdx: index('idx_activities_scheduled_date').on(table.scheduledDate),
    publishedDateIdx: index('idx_activities_published_date').on(table.publishedDate),
    activeIdx: index('idx_activities_active').on(table.isActive),
  };
});

// Campaign touchpoints (tracking customer interactions)
export const campaignTouchpoints = pgTable("campaign_touchpoints", {
  id: serial("id").primaryKey(),
  campaignId: integer("campaign_id").notNull().references(() => marketingCampaigns.id, { onDelete: "cascade" }),
  activityId: integer("activity_id").references(() => campaignActivities.id, { onDelete: "set null" }),
  userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
  
  // Touchpoint details
  touchpointType: varchar("touchpoint_type", { length: 50 }).notNull(), // impression, click, engagement, conversion
  channel: marketingChannelEnum("channel").notNull(),
  source: varchar("source", { length: 100 }),
  medium: varchar("medium", { length: 100 }),
  
  // Attribution
  isFirstTouch: boolean("is_first_touch").default(false),
  isLastTouch: boolean("is_last_touch").default(false),
  attributionWeight: decimal("attribution_weight", { precision: 3, scale: 2 }).default("1.00"),
  
  // Conversion tracking
  conversionValue: decimal("conversion_value", { precision: 10, scale: 2 }),
  productId: integer("product_id").references(() => products.id, { onDelete: "set null" }),
  
  // Technical data
  sessionId: varchar("session_id", { length: 100 }),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  referrerUrl: text("referrer_url"),
  landingPageUrl: text("landing_page_url"),
  
  // Metadata
  metadata: json("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => {
  return {
    campaignIdIdx: index('idx_touchpoints_campaign_id').on(table.campaignId),
    activityIdIdx: index('idx_touchpoints_activity_id').on(table.activityId),
    userIdIdx: index('idx_touchpoints_user_id').on(table.userId),
    touchpointTypeIdx: index('idx_touchpoints_type').on(table.touchpointType),
    channelIdx: index('idx_touchpoints_channel').on(table.channel),
    createdAtIdx: index('idx_touchpoints_created_at').on(table.createdAt),
  };
});

// Campaign products (products being promoted in campaigns)
export const campaignProducts = pgTable("campaign_products", {
  id: serial("id").primaryKey(),
  campaignId: integer("campaign_id").notNull().references(() => marketingCampaigns.id, { onDelete: "cascade" }),
  productId: integer("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  
  // Product-specific campaign settings
  featured: boolean("featured").default(false),
  discountOffered: decimal("discount_offered", { precision: 5, scale: 2 }),
  promotionalPrice: decimal("promotional_price", { precision: 10, scale: 2 }),
  
  // Performance tracking for this product in the campaign
  impressions: integer("impressions").default(0),
  clicks: integer("clicks").default(0),
  views: integer("views").default(0),
  conversions: integer("conversions").default(0),
  revenue: decimal("revenue", { precision: 10, scale: 2 }).default("0"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => {
  return {
    campaignProductIdx: index('idx_campaign_products_campaign_product').on(table.campaignId, table.productId),
    campaignIdIdx: index('idx_campaign_products_campaign_id').on(table.campaignId),
    productIdIdx: index('idx_campaign_products_product_id').on(table.productId),
    featuredIdx: index('idx_campaign_products_featured').on(table.featured),
  };
});

// Campaign analytics snapshots (daily/weekly/monthly rollups)
export const campaignAnalytics = pgTable("campaign_analytics", {
  id: serial("id").primaryKey(),
  campaignId: integer("campaign_id").notNull().references(() => marketingCampaigns.id, { onDelete: "cascade" }),
  date: date("date").notNull(),
  period: varchar("period", { length: 20 }).notNull(), // daily, weekly, monthly
  
  // Performance metrics
  impressions: integer("impressions").default(0),
  clicks: integer("clicks").default(0),
  engagements: integer("engagements").default(0),
  conversions: integer("conversions").default(0),
  revenue: decimal("revenue", { precision: 10, scale: 2 }).default("0"),
  cost: decimal("cost", { precision: 10, scale: 2 }).default("0"),
  
  // Calculated metrics
  clickThroughRate: decimal("click_through_rate", { precision: 5, scale: 4 }),
  conversionRate: decimal("conversion_rate", { precision: 5, scale: 4 }),
  costPerClick: decimal("cost_per_click", { precision: 10, scale: 2 }),
  costPerConversion: decimal("cost_per_conversion", { precision: 10, scale: 2 }),
  returnOnAdSpend: decimal("return_on_ad_spend", { precision: 5, scale: 2 }),
  
  // Audience metrics
  reach: integer("reach").default(0),
  frequency: decimal("frequency", { precision: 3, scale: 2 }),
  newVisitors: integer("new_visitors").default(0),
  returningVisitors: integer("returning_visitors").default(0),
  
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => {
  return {
    campaignDateIdx: index('idx_analytics_campaign_date').on(table.campaignId, table.date),
    campaignIdIdx: index('idx_analytics_campaign_id').on(table.campaignId),
    dateIdx: index('idx_analytics_date').on(table.date),
    periodIdx: index('idx_analytics_period').on(table.period),
  };
});

// =====================================
// Fraud Prevention Schema
// =====================================

// Store risk assessments made for fraud detection
export const fraudRiskAssessments = pgTable("fraud_risk_assessments", {
  id: serial("id").primaryKey(),
  requestId: varchar("request_id", { length: 50 }).notNull().unique(),
  userId: varchar("user_id", { length: 50 }),
  ipAddress: varchar("ip_address", { length: 45 }).notNull(),
  userAgent: text("user_agent").notNull(),
  riskScore: integer("risk_score").notNull(),
  riskLevel: riskLevelEnum("risk_level").notNull(),
  requestPath: text("request_path").notNull(),
  requestMethod: varchar("request_method", { length: 10 }).notNull(),
  anonymousFingerprint: text("anonymous_fingerprint"),
  assessmentData: json("assessment_data").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => {
  return {
    ipAddressIdx: index('idx_fraud_ip_address').on(table.ipAddress),
    userIdIdx: index('idx_fraud_user_id').on(table.userId),
    riskLevelIdx: index('idx_fraud_risk_level').on(table.riskLevel),
    createdAtIdx: index('idx_fraud_created_at').on(table.createdAt),
  };
});

// Store email/phone/identity verification status
export const identityVerifications = pgTable("identity_verifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  verificationType: varchar("verification_type", { length: 20 }).notNull(), // email, phone, government_id, address
  isVerified: boolean("is_verified").notNull().default(false),
  verificationData: json("verification_data"), // Contains verification-specific data
  verifiedAt: timestamp("verified_at"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => {
  return {
    uniqueUserVerification: unique().on(table.userId, table.verificationType),
  };
});

// Store known suspicious devices for fraud detection
export const suspiciousDevices = pgTable("suspicious_devices", {
  id: serial("id").primaryKey(),
  fingerprint: text("fingerprint").notNull().unique(),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  deviceInfo: json("device_info"),
  riskLevel: riskLevelEnum("risk_level").notNull(),
  reason: text("reason").notNull(),
  firstDetectedAt: timestamp("first_detected_at").defaultNow(),
  lastDetectedAt: timestamp("last_detected_at").defaultNow(),
  associatedUserIds: integer("associated_user_ids").array(),
  isBlocked: boolean("is_blocked").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Store user's trusted devices
export const trustedDevices = pgTable("trusted_devices", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  deviceName: varchar("device_name", { length: 100 }),
  fingerprint: text("fingerprint").notNull(),
  userAgent: text("user_agent"),
  lastIp: varchar("last_ip", { length: 45 }),
  lastUsedAt: timestamp("last_used_at").defaultNow(),
  expiresAt: timestamp("expires_at"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => {
  return {
    uniqueUserDevice: unique().on(table.userId, table.fingerprint),
    userIdIdx: index('idx_trusted_device_user_id').on(table.userId),
  };
});

// Schemas for insertions
export const insertFraudRiskAssessmentSchema = createInsertSchema(fraudRiskAssessments).omit({ id: true, createdAt: true });
export const insertIdentityVerificationSchema = createInsertSchema(identityVerifications).omit({ id: true, createdAt: true, updatedAt: true });
export const insertSuspiciousDeviceSchema = createInsertSchema(suspiciousDevices).omit({ id: true, createdAt: true, updatedAt: true });
export const insertTrustedDeviceSchema = createInsertSchema(trustedDevices).omit({ id: true, createdAt: true });

// Types
export type FraudRiskAssessment = typeof fraudRiskAssessments.$inferSelect;
export type InsertFraudRiskAssessment = z.infer<typeof insertFraudRiskAssessmentSchema>;

export type IdentityVerification = typeof identityVerifications.$inferSelect;
export type InsertIdentityVerification = z.infer<typeof insertIdentityVerificationSchema>;

export type SuspiciousDevice = typeof suspiciousDevices.$inferSelect;
export type InsertSuspiciousDevice = z.infer<typeof insertSuspiciousDeviceSchema>;

export type TrustedDevice = typeof trustedDevices.$inferSelect;
export type InsertTrustedDevice = z.infer<typeof insertTrustedDeviceSchema>;

// =====================================
// Affiliate Partner System Schema
// =====================================

// Affiliate partners table
export const affiliatePartners = pgTable("affiliate_partners", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  phone: varchar("phone", { length: 50 }),
  company: varchar("company", { length: 255 }),
  website: varchar("website", { length: 500 }),
  partnerCode: varchar("partner_code", { length: 50 }).notNull().unique(),
  
  // Partner details
  description: text("description"),
  specialization: varchar("specialization", { length: 100 }), // "marketing", "technology", "logistics", etc.
  region: varchar("region", { length: 100 }),
  languages: json("languages").$type<string[]>().default([]),
  
  // Status and performance
  status: varchar("status", { length: 20 }).notNull().default("active"), // active, inactive, suspended
  isVerified: boolean("is_verified").default(false),
  verificationDate: timestamp("verification_date"),
  
  // Commission and referral tracking
  commissionRate: decimal("commission_rate", { precision: 5, scale: 4 }).default("0.30"), // 30% default
  totalReferrals: integer("total_referrals").default(0),
  totalCommissionEarned: decimal("total_commission_earned", { precision: 10, scale: 2 }).default("0"),
  
  // Relationship tracking
  assignedVendors: integer("assigned_vendors").array().default([]),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => {
  return {
    partnerCodeIdx: index('idx_affiliate_partner_code').on(table.partnerCode),
    statusIdx: index('idx_affiliate_status').on(table.status),
    emailIdx: index('idx_affiliate_email').on(table.email),
  };
});

// Vendor-Affiliate partner relationships
export const vendorAffiliatePartners = pgTable("vendor_affiliate_partners", {
  id: serial("id").primaryKey(),
  vendorId: integer("vendor_id").notNull().references(() => vendors.id, { onDelete: "cascade" }),
  affiliatePartnerId: integer("affiliate_partner_id").notNull().references(() => affiliatePartners.id, { onDelete: "cascade" }),
  assignedBy: integer("assigned_by").notNull().references(() => users.id), // Admin who made the assignment
  assignedAt: timestamp("assigned_at").defaultNow(),
  status: varchar("status", { length: 20 }).notNull().default("active"), // active, inactive
  notes: text("notes"),
}, (table) => {
  return {
    uniqueVendorAffiliate: unique().on(table.vendorId, table.affiliatePartnerId),
    vendorIdIdx: index('idx_vendor_affiliate_vendor').on(table.vendorId),
    affiliateIdIdx: index('idx_vendor_affiliate_partner').on(table.affiliatePartnerId),
  };
});

// =====================================
// Vendor Commission System Schema
// =====================================

// Vendor commission periods - tracks monthly commission calculations
export const vendorCommissionPeriods = pgTable("vendor_commission_periods", {
  id: serial("id").primaryKey(),
  vendorId: integer("vendor_id").notNull().references(() => vendors.id, { onDelete: "cascade" }),
  month: integer("month").notNull(), // 1-12
  year: integer("year").notNull(),
  
  // Sales data for the period
  totalSales: decimal("total_sales", { precision: 10, scale: 2 }).notNull().default("0"),
  totalTransactions: integer("total_transactions").notNull().default(0),
  
  // Commission calculation
  commissionTier: commissionTierEnum("commission_tier").notNull().default("standard"),
  commissionRate: decimal("commission_rate", { precision: 5, scale: 4 }).notNull().default("0.15"), // 15%
  commissionAmount: decimal("commission_amount", { precision: 10, scale: 2 }).notNull().default("0"),
  
  // Payment tracking
  status: commissionStatusEnum("status").notNull().default("pending"),
  dueDate: timestamp("due_date").notNull(),
  paidDate: timestamp("paid_date"),
  paymentMethod: text("payment_method"), // "stripe", "bank_transfer", "mobile_money", etc.
  paymentReference: text("payment_reference"),
  
  // Notifications and warnings
  firstNotificationSent: timestamp("first_notification_sent"),
  secondNotificationSent: timestamp("second_notification_sent"),
  finalWarningNotificationSent: timestamp("final_warning_notification_sent"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => {
  return {
    vendorPeriodIdx: index('idx_commission_vendor_period').on(table.vendorId, table.year, table.month),
    statusIdx: index('idx_commission_status').on(table.status),
    dueDateIdx: index('idx_commission_due_date').on(table.dueDate),
    uniqueVendorPeriod: unique().on(table.vendorId, table.year, table.month),
  };
});

// Vendor commission payments - tracks individual payment attempts
export const vendorCommissionPayments = pgTable("vendor_commission_payments", {
  id: serial("id").primaryKey(),
  commissionPeriodId: integer("commission_period_id").notNull().references(() => vendorCommissionPeriods.id, { onDelete: "cascade" }),
  vendorId: integer("vendor_id").notNull().references(() => vendors.id, { onDelete: "cascade" }),
  
  // Payment details
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).notNull().default("GBP"),
  paymentMethod: text("payment_method").notNull(),
  
  // Payment provider details
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  bankTransferReference: text("bank_transfer_reference"),
  mobileMoneyReference: text("mobile_money_reference"),
  
  // Status tracking
  status: paymentStatusEnum("status").notNull().default("pending"),
  failureReason: text("failure_reason"),
  attemptCount: integer("attempt_count").notNull().default(1),
  maxAttempts: integer("max_attempts").notNull().default(3),
  
  // Timestamps
  initiatedAt: timestamp("initiated_at").defaultNow(),
  completedAt: timestamp("completed_at"),
  failedAt: timestamp("failed_at"),
  nextRetryAt: timestamp("next_retry_at"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => {
  return {
    commissionPeriodIdx: index('idx_payment_commission_period').on(table.commissionPeriodId),
    vendorIdx: index('idx_payment_vendor').on(table.vendorId),
    statusIdx: index('idx_payment_status').on(table.status),
    nextRetryIdx: index('idx_payment_next_retry').on(table.nextRetryAt),
  };
});

// Vendor payment methods - stores vendor's preferred payment methods
export const vendorPaymentMethods = pgTable("vendor_payment_methods", {
  id: serial("id").primaryKey(),
  vendorId: integer("vendor_id").notNull().references(() => vendors.id, { onDelete: "cascade" }),
  
  // Payment method type
  paymentType: varchar("payment_type", { length: 50 }).notNull(), // "bank_transfer", "mobile_money", "paypal", "stripe"
  isPrimary: boolean("is_primary").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  
  // Bank transfer details
  bankName: text("bank_name"),
  accountNumber: text("account_number"),
  accountHolderName: text("account_holder_name"),
  sortCode: text("sort_code"),
  iban: text("iban"),
  swiftCode: text("swift_code"),
  
  // Mobile money details
  mobileMoneyProvider: text("mobile_money_provider"), // "MTN", "Airtel", "Vodafone", etc.
  mobileMoneyNumber: text("mobile_money_number"),
  mobileMoneyName: text("mobile_money_name"),
  
  // PayPal details
  paypalEmail: text("paypal_email"),
  
  // Stripe details
  stripeAccountId: text("stripe_account_id"),
  
  // Metadata
  minimumPayoutAmount: decimal("minimum_payout_amount", { precision: 10, scale: 2 }).default("10.00"),
  paymentSchedule: varchar("payment_schedule", { length: 20 }).default("monthly"), // "weekly", "monthly", "quarterly"
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => {
  return {
    vendorIdx: index('idx_payment_method_vendor').on(table.vendorId),
    primaryIdx: index('idx_payment_method_primary').on(table.vendorId, table.isPrimary),
    typeIdx: index('idx_payment_method_type').on(table.paymentType),
  };
});

// Vendor account actions - tracks account suspension/reactivation history
export const vendorAccountActions = pgTable("vendor_account_actions", {
  id: serial("id").primaryKey(),
  vendorId: integer("vendor_id").notNull().references(() => vendors.id, { onDelete: "cascade" }),
  
  // Action details
  actionType: varchar("action_type", { length: 50 }).notNull(), // "suspended", "reactivated", "warning_sent", "payment_reminder"
  reason: text("reason").notNull(),
  description: text("description"),
  
  // Related commission period if applicable
  commissionPeriodId: integer("commission_period_id").references(() => vendorCommissionPeriods.id, { onDelete: "set null" }),
  
  // Action metadata
  performedBy: varchar("performed_by", { length: 20 }).notNull().default("system"), // "system", "admin", "vendor"
  reversible: boolean("reversible").notNull().default(true),
  reversedAt: timestamp("reversed_at"),
  reversedBy: varchar("reversed_by", { length: 20 }),
  
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => {
  return {
    vendorIdx: index('idx_account_action_vendor').on(table.vendorId),
    actionTypeIdx: index('idx_account_action_type').on(table.actionType),
    createdAtIdx: index('idx_account_action_created').on(table.createdAt),
  };
});

// Commission tracking schemas
export const insertVendorCommissionPeriodSchema = createInsertSchema(vendorCommissionPeriods)
  .omit({ id: true, createdAt: true, updatedAt: true });

export const insertVendorCommissionPaymentSchema = createInsertSchema(vendorCommissionPayments)
  .omit({ id: true, createdAt: true, updatedAt: true });

export const insertVendorPaymentMethodSchema = createInsertSchema(vendorPaymentMethods)
  .omit({ id: true, createdAt: true, updatedAt: true });

export const insertVendorAccountActionSchema = createInsertSchema(vendorAccountActions)
  .omit({ id: true, createdAt: true });

// Affiliate partner schemas
export const insertAffiliatePartnerSchema = createInsertSchema(affiliatePartners)
  .omit({ id: true, createdAt: true, updatedAt: true });

export const insertVendorAffiliatePartnerSchema = createInsertSchema(vendorAffiliatePartners)
  .omit({ id: true, assignedAt: true });

// Affiliate partner types
export type AffiliatePartner = typeof affiliatePartners.$inferSelect;
export type InsertAffiliatePartner = z.infer<typeof insertAffiliatePartnerSchema>;

export type VendorAffiliatePartner = typeof vendorAffiliatePartners.$inferSelect;
export type InsertVendorAffiliatePartner = z.infer<typeof insertVendorAffiliatePartnerSchema>;

// AI Personalization Tables

// User interactions tracking for AI learning
export const userInteractions = pgTable("user_interactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  productId: integer("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  
  // Interaction details
  interactionType: interactionTypeEnum("interaction_type").notNull(),
  metadata: json("metadata"), // Store additional data like search terms, time spent, etc.
  
  // Contextual information
  sessionId: varchar("session_id", { length: 255 }),
  userAgent: text("user_agent"),
  referrer: text("referrer"),
  
  timestamp: timestamp("timestamp").notNull().defaultNow(),
}, (table) => {
  return {
    userIdx: index('idx_interactions_user').on(table.userId),
    productIdx: index('idx_interactions_product').on(table.productId),
    typeIdx: index('idx_interactions_type').on(table.interactionType),
    timestampIdx: index('idx_interactions_timestamp').on(table.timestamp),
    userProductIdx: index('idx_interactions_user_product').on(table.userId, table.productId),
  };
});

// User preferences learned from AI analysis
export const userPreferences = pgTable("user_preferences", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
  
  // Category preferences (JSON array of category IDs with weights)
  preferredCategories: json("preferred_categories").default([]),
  
  // Price preferences
  priceRangeMin: decimal("price_range_min", { precision: 10, scale: 2 }).default("0"),
  priceRangeMax: decimal("price_range_max", { precision: 10, scale: 2 }).default("1000"),
  
  // Brand preferences (JSON array of brand names)
  preferredBrands: json("preferred_brands").default([]),
  
  // Behavioral patterns
  preferredTimeOfDay: varchar("preferred_time_of_day", { length: 20 }), // "morning", "afternoon", "evening", "night"
  shoppingFrequency: varchar("shopping_frequency", { length: 20 }), // "daily", "weekly", "monthly", "occasional"
  
  // AI-computed preference scores
  noveltySeeker: doublePrecision("novelty_seeker").default(0.5), // 0-1 scale
  brandLoyal: doublePrecision("brand_loyal").default(0.5),
  priceConsciousness: doublePrecision("price_consciousness").default(0.5),
  qualityFocused: doublePrecision("quality_focused").default(0.5),
  
  // Seasonal patterns (JSON object)
  seasonalPatterns: json("seasonal_patterns").default({}),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => {
  return {
    userIdx: unique('unique_user_preferences').on(table.userId),
  };
});

// Product similarity matrix for content-based filtering
export const productSimilarity = pgTable("product_similarity", {
  id: serial("id").primaryKey(),
  productId1: integer("product_id_1").notNull().references(() => products.id, { onDelete: "cascade" }),
  productId2: integer("product_id_2").notNull().references(() => products.id, { onDelete: "cascade" }),
  
  // Similarity scores
  categorySimilarity: doublePrecision("category_similarity").default(0),
  priceSimilarity: doublePrecision("price_similarity").default(0),
  brandSimilarity: doublePrecision("brand_similarity").default(0),
  overallSimilarity: doublePrecision("overall_similarity").notNull(),
  
  // Metadata
  computedAt: timestamp("computed_at").notNull().defaultNow(),
}, (table) => {
  return {
    product1Idx: index('idx_similarity_product1').on(table.productId1),
    product2Idx: index('idx_similarity_product2').on(table.productId2),
    overallSimilarityIdx: index('idx_similarity_overall').on(table.overallSimilarity),
    uniquePair: unique('unique_product_pair').on(table.productId1, table.productId2),
  };
});

// User similarity matrix for collaborative filtering
export const userSimilarity = pgTable("user_similarity", {
  id: serial("id").primaryKey(),
  userId1: integer("user_id_1").notNull().references(() => users.id, { onDelete: "cascade" }),
  userId2: integer("user_id_2").notNull().references(() => users.id, { onDelete: "cascade" }),
  
  // Similarity metrics
  behavioralSimilarity: doublePrecision("behavioral_similarity").default(0),
  preferenceSimilarity: doublePrecision("preference_similarity").default(0),
  overallSimilarity: doublePrecision("overall_similarity").notNull(),
  
  // Confidence and metadata
  confidence: doublePrecision("confidence").default(0.5),
  computedAt: timestamp("computed_at").notNull().defaultNow(),
}, (table) => {
  return {
    user1Idx: index('idx_user_similarity_user1').on(table.userId1),
    user2Idx: index('idx_user_similarity_user2').on(table.userId2),
    overallSimilarityIdx: index('idx_user_similarity_overall').on(table.overallSimilarity),
    uniqueUserPair: unique('unique_user_pair').on(table.userId1, table.userId2),
  };
});

// Recommendation cache to improve performance
export const recommendationCache = pgTable("recommendation_cache", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  
  // Cached recommendations (JSON array of product IDs with scores)
  recommendations: json("recommendations").notNull(),
  
  // Cache metadata
  algorithm: varchar("algorithm", { length: 50 }).notNull(), // "collaborative", "content", "hybrid", "popular"
  expiresAt: timestamp("expires_at").notNull(),
  
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => {
  return {
    userIdx: index('idx_recommendation_cache_user').on(table.userId),
    expiresIdx: index('idx_recommendation_cache_expires').on(table.expiresAt),
    algorithmIdx: index('idx_recommendation_cache_algorithm').on(table.algorithm),
  };
});

// A/B testing for recommendation algorithms
export const recommendationExperiments = pgTable("recommendation_experiments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  
  // Experiment details
  experimentName: varchar("experiment_name", { length: 100 }).notNull(),
  algorithmVariant: varchar("algorithm_variant", { length: 50 }).notNull(),
  
  // Performance metrics
  clickThroughRate: doublePrecision("click_through_rate").default(0),
  conversionRate: doublePrecision("conversion_rate").default(0),
  engagementScore: doublePrecision("engagement_score").default(0),
  
  // Experiment period
  startedAt: timestamp("started_at").notNull().defaultNow(),
  endedAt: timestamp("ended_at"),
  
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => {
  return {
    userIdx: index('idx_experiment_user').on(table.userId),
    experimentIdx: index('idx_experiment_name').on(table.experimentName),
    variantIdx: index('idx_experiment_variant').on(table.algorithmVariant),
  };
});

// AI Personalization Schemas
export const insertUserInteractionSchema = createInsertSchema(userInteractions)
  .omit({ id: true, timestamp: true });

export const insertUserPreferencesSchema = createInsertSchema(userPreferences)
  .omit({ id: true, createdAt: true, updatedAt: true });

export const insertProductSimilaritySchema = createInsertSchema(productSimilarity)
  .omit({ id: true, computedAt: true });

export const insertUserSimilaritySchema = createInsertSchema(userSimilarity)
  .omit({ id: true, computedAt: true });

export const insertRecommendationCacheSchema = createInsertSchema(recommendationCache)
  .omit({ id: true, createdAt: true });

export const insertRecommendationExperimentSchema = createInsertSchema(recommendationExperiments)
  .omit({ id: true, createdAt: true });

// Type exports
export type UserInteraction = typeof userInteractions.$inferSelect;
export type InsertUserInteraction = z.infer<typeof insertUserInteractionSchema>;
export type UserPreferences = typeof userPreferences.$inferSelect;
export type InsertUserPreferences = z.infer<typeof insertUserPreferencesSchema>;
export type ProductSimilarity = typeof productSimilarity.$inferSelect;
export type UserSimilarity = typeof userSimilarity.$inferSelect;
export type RecommendationCache = typeof recommendationCache.$inferSelect;
export type RecommendationExperiment = typeof recommendationExperiments.$inferSelect;

// Commission tracking types
export type VendorCommissionPeriod = typeof vendorCommissionPeriods.$inferSelect;
export type InsertVendorCommissionPeriod = z.infer<typeof insertVendorCommissionPeriodSchema>;

export type VendorCommissionPayment = typeof vendorCommissionPayments.$inferSelect;
export type InsertVendorCommissionPayment = z.infer<typeof insertVendorCommissionPaymentSchema>;

export type VendorPaymentMethod = typeof vendorPaymentMethods.$inferSelect;
export type InsertVendorPaymentMethod = z.infer<typeof insertVendorPaymentMethodSchema>;

export type VendorAccountAction = typeof vendorAccountActions.$inferSelect;
export type InsertVendorAccountAction = z.infer<typeof insertVendorAccountActionSchema>;

// Community meetups table for local events
export const communityEvents = pgTable("community_events", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  date: date("date").notNull(),
  time: text("time").notNull(),
  location: text("location").notNull(),
  category: eventCategoryEnum("category"),
  maxAttendees: integer("max_attendees"),
  organizerId: integer("organizer_id").notNull().references(() => users.id),
  tags: text("tags").array(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Event attendees table for tracking who's attending community events
export const communityEventAttendees = pgTable("community_event_attendees", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").notNull().references(() => communityEvents.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  attendedAt: timestamp("attended_at").defaultNow(),
}, (table) => {
  return {
    uniqueEventUser: unique().on(table.eventId, table.userId),
  };
});

// Liked products schemas
export const insertLikedProductSchema = createInsertSchema(likedProducts).omit({ id: true, createdAt: true });
export type LikedProduct = typeof likedProducts.$inferSelect;
export type InsertLikedProduct = z.infer<typeof insertLikedProductSchema>;

// Community events schemas
export const insertCommunityEventSchema = createInsertSchema(communityEvents).omit({ id: true, createdAt: true, updatedAt: true });
export const insertCommunityEventAttendeeSchema = createInsertSchema(communityEventAttendees).omit({ id: true, attendedAt: true });

// Community events types
export type CommunityEvent = typeof communityEvents.$inferSelect;
export type InsertCommunityEvent = z.infer<typeof insertCommunityEventSchema>;
export type CommunityEventAttendee = typeof communityEventAttendees.$inferSelect;
export type InsertCommunityEventAttendee = z.infer<typeof insertCommunityEventAttendeeSchema>;

// =====================================
// Vendor Payment Information Schema
// =====================================

// Payment method enum
export const paymentMethodEnum = pgEnum('payment_method', ['bank', 'mobile_money', 'paypal']);

// Account type enum
export const accountTypeEnum = pgEnum('account_type', ['checking', 'savings']);

// Business type enum
export const businessTypeEnum = pgEnum('business_type', ['individual', 'business', 'corporation']);

// Payment schedule enum
export const paymentScheduleEnum = pgEnum('payment_schedule', ['daily', 'weekly', 'monthly']);

// Vendor payment information table
export const vendorPaymentInfo = pgTable("vendor_payment_info", {
  id: serial("id").primaryKey(),
  vendorId: integer("vendor_id").notNull().references(() => vendors.id, { onDelete: "cascade" }),
  
  // Bank Account Information
  bankName: text("bank_name"),
  accountNumber: text("account_number"),
  routingNumber: text("routing_number"),
  accountHolderName: text("account_holder_name"),
  accountType: accountTypeEnum("account_type"),
  
  // Mobile Money Information
  mobileMoneyProvider: text("mobile_money_provider"),
  mobileMoneyNumber: text("mobile_money_number"),
  
  // PayPal Information
  paypalEmail: text("paypal_email"),
  
  // Tax Information
  taxId: text("tax_id"),
  businessType: businessTypeEnum("business_type"),
  
  // Payment Settings
  preferredPaymentMethod: paymentMethodEnum("preferred_payment_method").notNull(),
  paymentSchedule: paymentScheduleEnum("payment_schedule").notNull().default('weekly'),
  minimumPayoutAmount: doublePrecision("minimum_payout_amount").notNull().default(10.00),
  
  // Status and Timestamps
  isVerified: boolean("is_verified").notNull().default(false),
  verifiedAt: timestamp("verified_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => {
  return {
    uniqueVendor: unique().on(table.vendorId),
    vendorIdIdx: index('idx_vendor_payment_vendor_id').on(table.vendorId),
  };
});

// Vendor payment information schemas
export const insertVendorPaymentInfoSchema = createInsertSchema(vendorPaymentInfo).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true,
  isVerified: true,
  verifiedAt: true 
});

// Vendor payment information types
export type VendorPaymentInfo = typeof vendorPaymentInfo.$inferSelect;
export type InsertVendorPaymentInfo = z.infer<typeof insertVendorPaymentInfoSchema>;

// Marketing campaign schemas and types
export const insertMarketingCampaignSchema = createInsertSchema(marketingCampaigns).omit({ id: true, createdAt: true, updatedAt: true });
export type MarketingCampaign = typeof marketingCampaigns.$inferSelect;
export type InsertMarketingCampaign = z.infer<typeof insertMarketingCampaignSchema>;

export const insertCampaignActivitySchema = createInsertSchema(campaignActivities).omit({ id: true, createdAt: true, updatedAt: true });
export type CampaignActivity = typeof campaignActivities.$inferSelect;
export type InsertCampaignActivity = z.infer<typeof insertCampaignActivitySchema>;

export const insertCampaignTouchpointSchema = createInsertSchema(campaignTouchpoints).omit({ id: true, createdAt: true });
export type CampaignTouchpoint = typeof campaignTouchpoints.$inferSelect;
export type InsertCampaignTouchpoint = z.infer<typeof insertCampaignTouchpointSchema>;

export const insertCampaignProductSchema = createInsertSchema(campaignProducts).omit({ id: true, createdAt: true, updatedAt: true });
export type CampaignProduct = typeof campaignProducts.$inferSelect;
export type InsertCampaignProduct = z.infer<typeof insertCampaignProductSchema>;

export const insertCampaignAnalyticsSchema = createInsertSchema(campaignAnalytics).omit({ id: true, createdAt: true });
export type CampaignAnalytics = typeof campaignAnalytics.$inferSelect;
export type InsertCampaignAnalytics = z.infer<typeof insertCampaignAnalyticsSchema>;

// Chatroom type enum
export const chatroomTypeEnum = pgEnum('chatroom_type', ['global', 'regional', 'country', 'private']);

// Chatrooms table
export const chatrooms = pgTable("chatrooms", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  type: chatroomTypeEnum("type").notNull(),
  region: text("region"), // For regional chatrooms
  country: text("country"), // For country chatrooms
  creatorId: integer("creator_id").references(() => users.id), // For private rooms
  isActive: boolean("is_active").default(true),
  maxUsers: integer("max_users").default(1000),
  isAudioEnabled: boolean("is_audio_enabled").default(false), // For audio conferencing
  isVideoEnabled: boolean("is_video_enabled").default(false), // For video conferencing
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Chatroom messages table
export const chatroomMessages = pgTable("chatroom_messages", {
  id: serial("id").primaryKey(),
  chatroomId: integer("chatroom_id").notNull().references(() => chatrooms.id),
  userId: integer("user_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  messageType: text("message_type").default("text"), // text, image, file, etc.
  isDeleted: boolean("is_deleted").default(false),
  editedAt: timestamp("edited_at"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => {
  return {
    chatroomIdx: index('idx_chatroom_messages_chatroom').on(table.chatroomId),
    userIdx: index('idx_chatroom_messages_user').on(table.userId),
    createdAtIdx: index('idx_chatroom_messages_created').on(table.createdAt),
  };
});

// Chatroom members table (for tracking who's in which chatroom)
export const chatroomMembers = pgTable("chatroom_members", {
  id: serial("id").primaryKey(),
  chatroomId: integer("chatroom_id").notNull().references(() => chatrooms.id),
  userId: integer("user_id").notNull().references(() => users.id),
  joinedAt: timestamp("joined_at").defaultNow(),
  lastSeenAt: timestamp("last_seen_at").defaultNow(),
  isModerator: boolean("is_moderator").default(false),
  isOnline: boolean("is_online").default(false),
}, (table) => {
  return {
    uniqueMember: unique().on(table.chatroomId, table.userId),
    chatroomIdx: index('idx_chatroom_members_chatroom').on(table.chatroomId),
    userIdx: index('idx_chatroom_members_user').on(table.userId),
  };
});

// Chatroom schemas
export const insertChatroomSchema = createInsertSchema(chatrooms).omit({ id: true, createdAt: true, updatedAt: true });
export const insertChatroomMessageSchema = createInsertSchema(chatroomMessages).omit({ id: true, createdAt: true });
export const insertChatroomMemberSchema = createInsertSchema(chatroomMembers).omit({ id: true, joinedAt: true });

// Private room invitations table
export const privateRoomInvitations = pgTable("private_room_invitations", {
  id: serial("id").primaryKey(),
  chatroomId: integer("chatroom_id").notNull().references(() => chatrooms.id),
  invitedBy: integer("invited_by").notNull().references(() => users.id),
  invitedUser: integer("invited_user").notNull().references(() => users.id),
  status: varchar("status", { length: 20 }).notNull().default("pending"), // pending, accepted, declined
  invitedAt: timestamp("invited_at").defaultNow(),
  respondedAt: timestamp("responded_at"),
}, (table) => {
  return {
    uniqueInvitation: unique().on(table.chatroomId, table.invitedUser),
  };
});

// Audio session management for private rooms
export const audioSessions = pgTable("audio_sessions", {
  id: serial("id").primaryKey(),
  chatroomId: integer("chatroom_id").notNull().references(() => chatrooms.id),
  sessionId: text("session_id").notNull().unique(), // WebRTC session identifier
  hostId: integer("host_id").notNull().references(() => users.id),
  isActive: boolean("is_active").default(true),
  participantCount: integer("participant_count").default(0),
  maxParticipants: integer("max_participants").default(10),
  startedAt: timestamp("started_at").defaultNow(),
  endedAt: timestamp("ended_at"),
});

// Audio session participants
export const audioSessionParticipants = pgTable("audio_session_participants", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull().references(() => audioSessions.id),
  userId: integer("user_id").notNull().references(() => users.id),
  isMuted: boolean("is_muted").default(false),
  isDeafened: boolean("is_deafened").default(false),
  joinedAt: timestamp("joined_at").defaultNow(),
  leftAt: timestamp("left_at"),
}, (table) => {
  return {
    uniqueParticipant: unique().on(table.sessionId, table.userId),
  };
});

// Chatroom schemas
export const insertPrivateRoomInvitationSchema = createInsertSchema(privateRoomInvitations).omit({ id: true, invitedAt: true });
export const insertAudioSessionSchema = createInsertSchema(audioSessions).omit({ id: true, startedAt: true });
export const insertAudioSessionParticipantSchema = createInsertSchema(audioSessionParticipants).omit({ id: true, joinedAt: true });

// Chatroom types
export type Chatroom = typeof chatrooms.$inferSelect;
export type InsertChatroom = z.infer<typeof insertChatroomSchema>;

export type ChatroomMessage = typeof chatroomMessages.$inferSelect;
export type InsertChatroomMessage = z.infer<typeof insertChatroomMessageSchema>;

export type ChatroomMember = typeof chatroomMembers.$inferSelect;
export type InsertChatroomMember = z.infer<typeof insertChatroomMemberSchema>;

export type PrivateRoomInvitation = typeof privateRoomInvitations.$inferSelect;
export type InsertPrivateRoomInvitation = z.infer<typeof insertPrivateRoomInvitationSchema>;

export type AudioSession = typeof audioSessions.$inferSelect;
export type InsertAudioSession = z.infer<typeof insertAudioSessionSchema>;

export type AudioSessionParticipant = typeof audioSessionParticipants.$inferSelect;
export type InsertAudioSessionParticipant = z.infer<typeof insertAudioSessionParticipantSchema>;

// Gift status enum
export const giftStatusEnum = pgEnum('gift_status', ['pending', 'accepted', 'rejected', 'paid']);

// Gift propositions table
export const giftPropositions = pgTable("gift_propositions", {
  id: serial("id").primaryKey(),
  senderId: integer("sender_id").notNull().references(() => users.id),
  recipientId: integer("recipient_id").notNull().references(() => users.id),
  productId: integer("product_id").notNull().references(() => products.id),
  message: text("message"), // Optional message from sender
  status: giftStatusEnum("status").notNull().default("pending"),
  amount: doublePrecision("amount").notNull(), // Gift amount
  currency: text("currency").notNull().default("GBP"),
  paymentIntentId: text("payment_intent_id"), // Stripe payment intent ID
  respondedAt: timestamp("responded_at"),
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => {
  return {
    senderIdx: index('idx_gift_propositions_sender').on(table.senderId),
    recipientIdx: index('idx_gift_propositions_recipient').on(table.recipientId),
    productIdx: index('idx_gift_propositions_product').on(table.productId),
    statusIdx: index('idx_gift_propositions_status').on(table.status),
  };
});

// Gift proposition schema
export const insertGiftPropositionSchema = createInsertSchema(giftPropositions).omit({ 
  id: true, 
  paymentIntentId: true,
  respondedAt: true, 
  paidAt: true,
  createdAt: true, 
  updatedAt: true 
});

// Gift proposition types
export type GiftProposition = typeof giftPropositions.$inferSelect;
export type InsertGiftProposition = z.infer<typeof insertGiftPropositionSchema>;

// Vendor Discounts and Promotions
export const vendorDiscounts = pgTable("vendor_discounts", {
  id: serial("id").primaryKey(),
  vendorId: integer("vendor_id").notNull().references(() => vendors.id, { onDelete: 'cascade' }),
  
  // Basic discount information
  name: text("name").notNull(),
  description: text("description"),
  code: text("code"), // Optional discount code (null for automatic discounts)
  
  // Discount type and value
  discountType: discountTypeEnum("discount_type").notNull(),
  discountValue: doublePrecision("discount_value").notNull(), // Percentage (0-100) or fixed amount
  maxDiscountAmount: doublePrecision("max_discount_amount"), // Maximum discount for percentage types
  
  // Application rules
  application: discountApplicationEnum("application").notNull().default('code_required'),
  minimumOrderValue: doublePrecision("minimum_order_value").default(0),
  usageLimit: integer("usage_limit"), // null = unlimited
  usageCount: integer("usage_count").default(0),
  usageLimitPerCustomer: integer("usage_limit_per_customer"), // null = unlimited per customer
  
  // Target rules
  target: promotionTargetEnum("target").notNull().default('all_products'),
  targetProductIds: json("target_product_ids").$type<number[]>().default([]),
  targetCategories: json("target_categories").$type<string[]>().default([]),
  
  // Buy X Get Y rules (for buy_x_get_y type)
  buyQuantity: integer("buy_quantity"),
  getQuantity: integer("get_quantity"),
  getDiscountPercent: doublePrecision("get_discount_percent"),
  
  // Scheduling
  status: discountStatusEnum("status").notNull().default('active'),
  startsAt: timestamp("starts_at"),
  endsAt: timestamp("ends_at"),
  
  // Metadata
  isPublic: boolean("is_public").default(true), // Whether to show in public promotions
  priority: integer("priority").default(0), // Higher priority discounts apply first
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => {
  return {
    vendorIdIdx: index("vendor_discounts_vendor_id_idx").on(table.vendorId),
    codeIdx: index("vendor_discounts_code_idx").on(table.code),
    statusIdx: index("vendor_discounts_status_idx").on(table.status),
    uniqueVendorCode: unique("unique_vendor_discount_code").on(table.vendorId, table.code),
  };
});

export const insertVendorDiscountSchema = createInsertSchema(vendorDiscounts).omit({
  id: true,
  usageCount: true,
  createdAt: true,
  updatedAt: true
});

export type VendorDiscount = typeof vendorDiscounts.$inferSelect;
export type InsertVendorDiscount = z.infer<typeof insertVendorDiscountSchema>;

// Discount Usage Tracking
export const discountUsages = pgTable("discount_usages", {
  id: serial("id").primaryKey(),
  discountId: integer("discount_id").notNull().references(() => vendorDiscounts.id, { onDelete: 'cascade' }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  orderId: integer("order_id").references(() => orders.id, { onDelete: 'set null' }),
  
  discountAmount: doublePrecision("discount_amount").notNull(),
  originalAmount: doublePrecision("original_amount").notNull(),
  finalAmount: doublePrecision("final_amount").notNull(),
  
  usedAt: timestamp("used_at").defaultNow(),
}, (table) => {
  return {
    discountIdIdx: index("discount_usages_discount_id_idx").on(table.discountId),
    userIdIdx: index("discount_usages_user_id_idx").on(table.userId),
    orderIdIdx: index("discount_usages_order_id_idx").on(table.orderId),
  };
});

export const insertDiscountUsageSchema = createInsertSchema(discountUsages).omit({
  id: true,
  usedAt: true
});

export type DiscountUsage = typeof discountUsages.$inferSelect;
export type InsertDiscountUsage = z.infer<typeof insertDiscountUsageSchema>;

// Promotional Campaigns
export const promotionalCampaigns = pgTable("promotional_campaigns", {
  id: serial("id").primaryKey(),
  vendorId: integer("vendor_id").notNull().references(() => vendors.id, { onDelete: 'cascade' }),
  
  name: text("name").notNull(),
  description: text("description"),
  bannerImageUrl: text("banner_image_url"),
  
  // Campaign settings
  isActive: boolean("is_active").default(true),
  priority: integer("priority").default(0),
  
  // Associated discounts
  discountIds: json("discount_ids").$type<number[]>().default([]),
  
  // Display settings
  showOnStorefront: boolean("show_on_storefront").default(true),
  showInEmails: boolean("show_in_emails").default(false),
  
  // Scheduling
  startsAt: timestamp("starts_at"),
  endsAt: timestamp("ends_at"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => {
  return {
    vendorIdIdx: index("promotional_campaigns_vendor_id_idx").on(table.vendorId),
    activeIdx: index("promotional_campaigns_active_idx").on(table.isActive),
  };
});

export const insertPromotionalCampaignSchema = createInsertSchema(promotionalCampaigns).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export type PromotionalCampaign = typeof promotionalCampaigns.$inferSelect;
export type InsertPromotionalCampaign = z.infer<typeof insertPromotionalCampaignSchema>;

// Returns schema types
export const insertReturnSchema = createInsertSchema(returns).omit({
  id: true,
  processedAt: true,
  completedAt: true,
  createdAt: true,
  updatedAt: true
});

export type Return = typeof returns.$inferSelect;
export type InsertReturn = z.infer<typeof insertReturnSchema>;

// Gift Card System Enums
export const giftCardStatusEnum = pgEnum('gift_card_status', ['active', 'redeemed', 'expired', 'cancelled']);
export const giftCardDesignEnum = pgEnum('gift_card_design', ['classic_blue', 'elegant_gold', 'festive_red', 'modern_purple', 'nature_green', 'luxury_black', 'premium_silver', 'exclusive_diamond']);
export const giftCardTransactionTypeEnum = pgEnum('gift_card_transaction_type', ['purchase', 'redemption', 'refund']);

// Gift Cards table
export const giftCards = pgTable("gift_cards", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(), // Unique gift card code
  cardNumber: text("card_number").notNull().unique(), // 16-digit card number for balance checking
  pin: text("pin").notNull(), // 4-digit PIN for security
  amount: doublePrecision("amount").notNull(), // Gift card value in GBP
  currency: text("currency").default('GBP').notNull(),
  design: giftCardDesignEnum("design").notNull(),
  status: giftCardStatusEnum("status").default('active').notNull(),
  
  // Purchase information
  purchasedBy: integer("purchased_by").references(() => users.id, { onDelete: 'set null' }),
  purchaseOrderId: integer("purchase_order_id").references(() => orders.id, { onDelete: 'set null' }),
  
  // Redemption information
  redeemedBy: integer("redeemed_by").references(() => users.id, { onDelete: 'set null' }),
  redeemedAt: timestamp("redeemed_at"),
  redeemedAmount: doublePrecision("redeemed_amount").default(0), // Track partial redemptions
  
  // Recipient information (optional for gifting)
  recipientEmail: text("recipient_email"),
  recipientName: text("recipient_name"),
  giftMessage: text("gift_message"),
  
  // Expiry information
  expiresAt: timestamp("expires_at"), // Gift card expiry date
  
  // Metadata
  stripePaymentIntentId: text("stripe_payment_intent_id"), // Link to Stripe payment
  notes: text("notes"), // Admin notes
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  codeIdx: index("gift_cards_code_idx").on(table.code),
  cardNumberIdx: index("gift_cards_card_number_idx").on(table.cardNumber),
  statusIdx: index("gift_cards_status_idx").on(table.status),
  purchasedByIdx: index("gift_cards_purchased_by_idx").on(table.purchasedBy),
  redeemedByIdx: index("gift_cards_redeemed_by_idx").on(table.redeemedBy),
  expiresAtIdx: index("gift_cards_expires_at_idx").on(table.expiresAt),
}));

// Gift Card Transactions table - track all gift card related transactions
export const giftCardTransactions = pgTable("gift_card_transactions", {
  id: serial("id").primaryKey(),
  giftCardId: integer("gift_card_id").notNull().references(() => giftCards.id, { onDelete: 'cascade' }),
  type: giftCardTransactionTypeEnum("type").notNull(),
  
  // Transaction details
  amount: doublePrecision("amount").notNull(),
  currency: text("currency").default('GBP').notNull(),
  
  // User information
  userId: integer("user_id").references(() => users.id, { onDelete: 'set null' }),
  
  // Order/payment information
  orderId: integer("order_id").references(() => orders.id, { onDelete: 'set null' }),
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  
  // Transaction metadata
  description: text("description"),
  metadata: json("metadata"), // Store additional transaction data
  
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  giftCardIdIdx: index("gift_card_transactions_gift_card_id_idx").on(table.giftCardId),
  typeIdx: index("gift_card_transactions_type_idx").on(table.type),
  userIdIdx: index("gift_card_transactions_user_id_idx").on(table.userId),
  createdAtIdx: index("gift_card_transactions_created_at_idx").on(table.createdAt),
}));

// Gift Card Redemptions table - detailed redemption tracking
export const giftCardRedemptions = pgTable("gift_card_redemptions", {
  id: serial("id").primaryKey(),
  giftCardId: integer("gift_card_id").notNull().references(() => giftCards.id, { onDelete: 'cascade' }),
  orderId: integer("order_id").notNull().references(() => orders.id, { onDelete: 'cascade' }),
  
  // Redemption details
  redeemedAmount: doublePrecision("redeemed_amount").notNull(), // Amount used in this redemption
  remainingBalance: doublePrecision("remaining_balance").notNull(), // Balance left after redemption
  
  // User information
  redeemedBy: integer("redeemed_by").notNull().references(() => users.id, { onDelete: 'cascade' }),
  
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  giftCardIdIdx: index("gift_card_redemptions_gift_card_id_idx").on(table.giftCardId),
  orderIdIdx: index("gift_card_redemptions_order_id_idx").on(table.orderId),
  redeemedByIdx: index("gift_card_redemptions_redeemed_by_idx").on(table.redeemedBy),
}));

// Create insert and select schemas for gift cards
export const insertGiftCardSchema = createInsertSchema(giftCards).omit({
  id: true,
  code: true, // Generated automatically
  cardNumber: true, // Generated automatically
  pin: true, // Generated automatically
  redeemedBy: true,
  redeemedAt: true,
  redeemedAmount: true,
  createdAt: true,
  updatedAt: true
});

export const selectGiftCardSchema = createSelectSchema(giftCards);

export const insertGiftCardTransactionSchema = createInsertSchema(giftCardTransactions).omit({
  id: true,
  createdAt: true
});

export const insertGiftCardRedemptionSchema = createInsertSchema(giftCardRedemptions).omit({
  id: true,
  createdAt: true
});

// Export types
export type GiftCard = typeof giftCards.$inferSelect;
export type InsertGiftCard = z.infer<typeof insertGiftCardSchema>;
export type GiftCardTransaction = typeof giftCardTransactions.$inferSelect;
export type InsertGiftCardTransaction = z.infer<typeof insertGiftCardTransactionSchema>;
export type GiftCardRedemption = typeof giftCardRedemptions.$inferSelect;
export type InsertGiftCardRedemption = z.infer<typeof insertGiftCardRedemptionSchema>;

// Gift Card Design Configurations
export const GIFT_CARD_DESIGNS = {
  classic_blue: {
    name: 'Classic Blue',
    description: 'Timeless blue design with elegant styling',
    backgroundColor: '#1e40af',
    textColor: '#ffffff',
    accentColor: '#3b82f6'
  },
  elegant_gold: {
    name: 'Elegant Gold',
    description: 'Luxurious gold design for special occasions',
    backgroundColor: '#d97706',
    textColor: '#ffffff',
    accentColor: '#f59e0b'
  },
  festive_red: {
    name: 'Festive Red',
    description: 'Vibrant red design perfect for celebrations',
    backgroundColor: '#dc2626',
    textColor: '#ffffff',
    accentColor: '#ef4444'
  },
  modern_purple: {
    name: 'Modern Purple',
    description: 'Contemporary purple design with modern flair',
    backgroundColor: '#7c3aed',
    textColor: '#ffffff',
    accentColor: '#8b5cf6'
  },
  nature_green: {
    name: 'Nature Green',
    description: 'Fresh green design inspired by nature',
    backgroundColor: '#059669',
    textColor: '#ffffff',
    accentColor: '#10b981'
  },
  luxury_black: {
    name: 'Luxury Black',
    description: 'Premium black design for exclusive occasions',
    backgroundColor: '#111827',
    textColor: '#ffffff',
    accentColor: '#374151'
  },
  premium_silver: {
    name: 'Premium Silver',
    description: 'Sophisticated silver design with metallic finish',
    backgroundColor: '#6b7280',
    textColor: '#ffffff',
    accentColor: '#9ca3af'
  },
  exclusive_diamond: {
    name: 'Exclusive Diamond',
    description: 'Ultra-premium diamond design for high-value cards',
    backgroundColor: '#1f2937',
    textColor: '#ffffff',
    accentColor: '#f3f4f6'
  }
} as const;

// Gift Card Denominations
export const GIFT_CARD_DENOMINATIONS = [5, 10, 25, 50, 100, 500, 1000, 2500] as const;

// Proxy Accounts - KYC/BYC/AML Compliant Account Management
export const proxyAccountTypeEnum = pgEnum('proxy_account_type', ['kids', 'organization', 'company']);
export const proxyAccountStatusEnum = pgEnum('proxy_account_status', ['pending', 'under_review', 'verified', 'rejected', 'suspended']);
export const kycVerificationStatusEnum = pgEnum('kyc_verification_status', ['not_started', 'pending', 'approved', 'rejected']);
export const documentTypeEnum = pgEnum('document_type', ['passport', 'drivers_license', 'national_id', 'proof_of_address', 'business_registration', 'tax_certificate', 'bank_statement', 'articles_of_incorporation', 'beneficial_ownership']);

export const proxyAccounts = pgTable("proxy_accounts", {
  id: serial("id").primaryKey(),
  parentUserId: integer("parent_user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  accountType: proxyAccountTypeEnum("account_type").notNull(),
  status: proxyAccountStatusEnum("status").default('pending').notNull(),
  
  // Basic Account Information
  accountName: text("account_name").notNull(),
  email: text("email"),
  phoneNumber: text("phone_number"),
  dateOfBirth: date("date_of_birth"),
  nationality: text("nationality"),
  
  // Kids Account Specific Fields
  childFirstName: text("child_first_name"),
  childLastName: text("child_last_name"),
  kidsUsername: text("kids_username"),
  kidsEmail: text("kids_email"),
  kidsUserId: integer("kids_user_id").references(() => users.id, { onDelete: 'set null' }),
  guardianFullName: text("guardian_full_name"),
  guardianRelationship: text("guardian_relationship"),
  guardianIdNumber: text("guardian_id_number"),
  guardianEmail: text("guardian_email"),
  guardianPhone: text("guardian_phone"),
  childAge: integer("child_age"),
  kidsVerificationDocumentUrl: text("kids_verification_document_url"),
  
  // Organization/Company Specific Fields
  legalEntityName: text("legal_entity_name"),
  businessRegistrationNumber: text("business_registration_number"),
  taxIdNumber: text("tax_id_number"),
  vatNumber: text("vat_number"),
  incorporationDate: date("incorporation_date"),
  businessType: text("business_type"),
  industryType: text("industry_type"),
  numberOfEmployees: text("number_of_employees"),
  annualRevenue: text("annual_revenue"),
  
  // Company Account Credentials
  companyUsername: text("company_username"),
  companyEmail: text("company_email"),
  companyPassword: text("company_password"),
  
  // Registered Address
  registeredAddress: text("registered_address"),
  registeredHouseNumber: text("registered_house_number"),
  registeredCity: text("registered_city"),
  registeredState: text("registered_state"),
  registeredCountry: text("registered_country"),
  registeredPostalCode: text("registered_postal_code"),
  
  // Operating Address (if different)
  operatingAddress: text("operating_address"),
  operatingCity: text("operating_city"),
  operatingState: text("operating_state"),
  operatingCountry: text("operating_country"),
  operatingPostalCode: text("operating_postal_code"),
  
  // Directors/Officers Information (JSON array for multiple)
  directors: json("directors"), // [{name, dob, nationality, idNumber, address}]
  beneficialOwners: json("beneficial_owners"), // [{name, ownershipPercentage, nationality, idNumber}]
  authorizedSignatories: json("authorized_signatories"), // [{name, position, idNumber}]
  
  // KYC/AML Compliance Fields
  kycStatus: kycVerificationStatusEnum("kyc_status").default('not_started').notNull(),
  kycVerifiedAt: timestamp("kyc_verified_at"),
  kycVerifiedBy: integer("kyc_verified_by").references(() => users.id),
  identityVerified: boolean("identity_verified").default(false),
  addressVerified: boolean("address_verified").default(false),
  
  // AML Fields
  purposeOfAccount: text("purpose_of_account"),
  expectedTransactionVolume: text("expected_transaction_volume"),
  isPoliticallyExposed: boolean("is_politically_exposed").default(false),
  politicalExposureDetails: text("political_exposure_details"),
  
  // Risk Assessment
  riskLevel: riskLevelEnum("risk_level").default('low'),
  riskAssessmentDate: timestamp("risk_assessment_date"),
  riskAssessmentNotes: text("risk_assessment_notes"),
  
  // Compliance Documents
  documentsUploaded: json("documents_uploaded"), // [{type, url, uploadedAt, verified}]
  
  // Banking Information
  bankName: text("bank_name"),
  bankAccountNumber: text("bank_account_number"),
  bankSwiftCode: text("bank_swift_code"),
  bankIban: text("bank_iban"),
  
  // Account Settings
  isActive: boolean("is_active").default(true),
  suspensionReason: text("suspension_reason"),
  suspendedAt: timestamp("suspended_at"),
  
  // Verification Notes
  verificationNotes: text("verification_notes"),
  rejectionReason: text("rejection_reason"),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  verifiedAt: timestamp("verified_at"),
}, (table) => ({
  parentUserIdIdx: index("proxy_accounts_parent_user_id_idx").on(table.parentUserId),
  accountTypeIdx: index("proxy_accounts_account_type_idx").on(table.accountType),
  statusIdx: index("proxy_accounts_status_idx").on(table.status),
  kycStatusIdx: index("proxy_accounts_kyc_status_idx").on(table.kycStatus),
}));

// Create insert and select schemas for proxy accounts
export const insertProxyAccountSchema = createInsertSchema(proxyAccounts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  verifiedAt: true,
  kycVerifiedAt: true,
  suspendedAt: true,
});

export const selectProxyAccountSchema = createSelectSchema(proxyAccounts);

// Export types
export type ProxyAccount = typeof proxyAccounts.$inferSelect;
export type InsertProxyAccount = z.infer<typeof insertProxyAccountSchema>;

// Financial Services Table
export const financialServices = pgTable("financial_services", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  serviceType: text("service_type").notNull(), // banking, insurance, loans, investing, crypto, remittance
  serviceName: text("service_name").notNull(),
  status: text("status").default('interested').notNull(), // interested, applied, approved, rejected, active, closed
  applicationData: json("application_data"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  approvedAt: timestamp("approved_at"),
  rejectedAt: timestamp("rejected_at"),
}, (table) => ({
  userIdIdx: index("financial_services_user_id_idx").on(table.userId),
  serviceTypeIdx: index("financial_services_service_type_idx").on(table.serviceType),
  statusIdx: index("financial_services_status_idx").on(table.status),
}));

export const insertFinancialServiceSchema = createInsertSchema(financialServices).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  approvedAt: true,
  rejectedAt: true,
});

export const selectFinancialServiceSchema = createSelectSchema(financialServices);

export type FinancialService = typeof financialServices.$inferSelect;
export type InsertFinancialService = z.infer<typeof insertFinancialServiceSchema>;

// Government Services Table
export const governmentServices = pgTable("government_services", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  serviceType: text("service_type").notNull(), // documents, public_services, youth_centres
  serviceName: text("service_name").notNull(),
  status: text("status").default('pending').notNull(), // pending, in_progress, completed, rejected
  requestData: json("request_data"),
  documentType: text("document_type"), // for documents: passport, id_card, drivers_license, etc
  appointmentDate: timestamp("appointment_date"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  completedAt: timestamp("completed_at"),
  rejectedAt: timestamp("rejected_at"),
}, (table) => ({
  userIdIdx: index("government_services_user_id_idx").on(table.userId),
  serviceTypeIdx: index("government_services_service_type_idx").on(table.serviceType),
  statusIdx: index("government_services_status_idx").on(table.status),
}));

export const insertGovernmentServiceSchema = createInsertSchema(governmentServices).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  completedAt: true,
  rejectedAt: true,
});

export const selectGovernmentServiceSchema = createSelectSchema(governmentServices);

export type GovernmentService = typeof governmentServices.$inferSelect;
export type InsertGovernmentService = z.infer<typeof insertGovernmentServiceSchema>;

// Calendar event category enum
export const calendarEventCategoryEnum = pgEnum('calendar_event_category', [
  'dating',
  'marketplace',
  'community',
  'finance',
  'government',
  'lifestyle',
  'services',
  'appointment',
  'personal',
  'work',
  'social',
  'delivery',
  'payment',
  'meeting'
]);

// Calendar event priority enum
export const calendarEventPriorityEnum = pgEnum('calendar_event_priority', ['low', 'medium', 'high', 'urgent']);

// Calendar events table - unified calendar for all app functionalities
export const calendarEvents = pgTable("calendar_events", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  category: calendarEventCategoryEnum("category").notNull(),
  priority: calendarEventPriorityEnum("priority").default('medium'),
  
  // Date and time
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  isAllDay: boolean("is_all_day").default(false),
  timezone: text("timezone").default('UTC'),
  
  // Location
  location: text("location"),
  people: text("people"),
  isOnline: boolean("is_online").default(false),
  meetingLink: text("meeting_link"),
  
  // Related entities
  relatedType: text("related_type"), // 'order', 'product', 'community', 'date', 'service', etc.
  relatedId: integer("related_id"), // ID of the related entity
  
  // Participants
  participants: json("participants"), // Array of user IDs
  
  // Recurrence
  isRecurring: boolean("is_recurring").default(false),
  recurrenceRule: text("recurrence_rule"), // RRULE format for recurring events
  parentEventId: integer("parent_event_id"), // Reference to parent event for recurring instances
  
  // Reminder and notifications
  reminderMinutes: integer("reminder_minutes").default(30), // Minutes before event
  hasNotified: boolean("has_notified").default(false),
  
  // Status
  status: text("status").default('scheduled').notNull(), // scheduled, completed, cancelled, in_progress
  isCancelled: boolean("is_cancelled").default(false),
  
  // Additional metadata
  color: text("color"), // For calendar UI customization
  notes: text("notes"),
  attachments: json("attachments"), // Array of attachment metadata objects: {id, name, mimeType, size, storagePath, checksum, uploadedBy, uploadedAt}
  shareWithParticipants: boolean("share_with_participants").default(false), // Enable file sharing with event participants
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  userIdIdx: index("calendar_events_user_id_idx").on(table.userId),
  categoryIdx: index("calendar_events_category_idx").on(table.category),
  startDateIdx: index("calendar_events_start_date_idx").on(table.startDate),
  statusIdx: index("calendar_events_status_idx").on(table.status),
  relatedTypeIdx: index("calendar_events_related_type_idx").on(table.relatedType),
}));

// Calendar event participants table
export const calendarEventParticipants = pgTable("calendar_event_participants", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").references(() => calendarEvents.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  status: text("status").default('pending').notNull(), // pending, accepted, declined, maybe
  role: text("role").default('attendee'), // organizer, attendee, optional
  responseAt: timestamp("response_at"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  uniqueParticipant: unique().on(table.eventId, table.userId),
  eventIdIdx: index("calendar_event_participants_event_id_idx").on(table.eventId),
  userIdIdx: index("calendar_event_participants_user_id_idx").on(table.userId),
}));

// Calendar event reminders table
export const calendarEventReminders = pgTable("calendar_event_reminders", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").references(() => calendarEvents.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  reminderTime: timestamp("reminder_time").notNull(),
  reminderType: text("reminder_type").default('notification'), // notification, email, sms
  isSent: boolean("is_sent").default(false),
  sentAt: timestamp("sent_at"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  eventIdIdx: index("calendar_event_reminders_event_id_idx").on(table.eventId),
  userIdIdx: index("calendar_event_reminders_user_id_idx").on(table.userId),
  reminderTimeIdx: index("calendar_event_reminders_time_idx").on(table.reminderTime),
}));

// Insert and select schemas for calendar events
export const insertCalendarEventSchema = createInsertSchema(calendarEvents).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const selectCalendarEventSchema = createSelectSchema(calendarEvents);

export type CalendarEvent = typeof calendarEvents.$inferSelect;
export type InsertCalendarEvent = z.infer<typeof insertCalendarEventSchema>;

// Calendar event attachment metadata interface
export interface CalendarEventAttachment {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  storagePath: string;
  checksum?: string;
  uploadedBy: number;
  uploadedAt: string;
}

// Insert and select schemas for calendar event participants
export const insertCalendarEventParticipantSchema = createInsertSchema(calendarEventParticipants).omit({
  id: true,
  createdAt: true,
});

export const selectCalendarEventParticipantSchema = createSelectSchema(calendarEventParticipants);

export type CalendarEventParticipant = typeof calendarEventParticipants.$inferSelect;
export type InsertCalendarEventParticipant = z.infer<typeof insertCalendarEventParticipantSchema>;

// Insert and select schemas for calendar event reminders
export const insertCalendarEventReminderSchema = createInsertSchema(calendarEventReminders).omit({
  id: true,
  createdAt: true,
  sentAt: true,
});

export const selectCalendarEventReminderSchema = createSelectSchema(calendarEventReminders);

export type CalendarEventReminder = typeof calendarEventReminders.$inferSelect;
export type InsertCalendarEventReminder = z.infer<typeof insertCalendarEventReminderSchema>;

// Schema for updating participant status
export const updateCalendarEventParticipantStatusSchema = z.object({
  status: z.enum(['pending', 'accepted', 'declined', 'tentative']),
});

// Global holidays table - stores worldwide public holidays
export const globalHolidays = pgTable("global_holidays", {
  id: serial("id").primaryKey(),
  date: date("date").notNull(),
  name: text("name").notNull(),
  localName: text("local_name"),
  countryCode: text("country_code").notNull(),
  fixed: boolean("fixed").default(false),
  global: boolean("global").default(false),
  counties: text("counties").array(),
  launchYear: integer("launch_year"),
  types: text("types").array(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  dateIdx: index("global_holidays_date_idx").on(table.date),
  countryCodeIdx: index("global_holidays_country_code_idx").on(table.countryCode),
  uniqueHoliday: unique().on(table.date, table.countryCode, table.name),
}));

export const insertGlobalHolidaySchema = createInsertSchema(globalHolidays).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const selectGlobalHolidaySchema = createSelectSchema(globalHolidays);

export type GlobalHoliday = typeof globalHolidays.$inferSelect;
export type InsertGlobalHoliday = z.infer<typeof insertGlobalHolidaySchema>;

// Lifestyle Services Schema
export const lifestyleServices = pgTable("lifestyle_services", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  category: text("category").notNull(), // restaurant, ride_sharing, flights, public_transportation, free_time, hotels, house_sharing, activities, food_delivery
  title: text("title").notNull(),
  description: text("description"),
  location: text("location"),
  city: text("city"),
  country: text("country"),
  address: text("address"),
  latitude: text("latitude"),
  longitude: text("longitude"),
  price: text("price"),
  currency: text("currency").default("USD"),
  priceType: text("price_type"), // per_hour, per_day, per_night, per_person, fixed
  images: text("images").array(),
  contactName: text("contact_name"),
  contactPhone: text("contact_phone"),
  contactEmail: text("contact_email"),
  website: text("website"),
  operatingHours: text("operating_hours"),
  amenities: text("amenities").array(),
  rating: text("rating"),
  reviewCount: integer("review_count").default(0),
  isActive: boolean("is_active").default(true),
  isFeatured: boolean("is_featured").default(false),
  isVerified: boolean("is_verified").default(false),
  metadata: json("metadata"), // Additional category-specific data
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertLifestyleServiceSchema = createInsertSchema(lifestyleServices).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  reviewCount: true,
});

export const selectLifestyleServiceSchema = createSelectSchema(lifestyleServices);

export type LifestyleService = typeof lifestyleServices.$inferSelect;
export type InsertLifestyleService = z.infer<typeof insertLifestyleServiceSchema>;

export const services = pgTable("services", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  category: text("category").notNull(), // health, education, utilities, jobs, freelance, courier_freight, charities_ngos
  title: text("title").notNull(),
  description: text("description"),
  location: text("location"),
  city: text("city"),
  country: text("country"),
  address: text("address"),
  latitude: text("latitude"),
  longitude: text("longitude"),
  price: text("price"),
  currency: text("currency").default("USD"),
  priceType: text("price_type"), // per_hour, per_day, per_project, fixed
  images: text("images").array(),
  contactName: text("contact_name"),
  contactPhone: text("contact_phone"),
  contactEmail: text("contact_email"),
  website: text("website"),
  operatingHours: text("operating_hours"),
  skills: text("skills").array(),
  certifications: text("certifications").array(),
  rating: text("rating"),
  reviewCount: integer("review_count").default(0),
  isActive: boolean("is_active").default(true),
  isFeatured: boolean("is_featured").default(false),
  isVerified: boolean("is_verified").default(false),
  metadata: json("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertServiceSchema = createInsertSchema(services).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  reviewCount: true,
});

export const selectServiceSchema = createSelectSchema(services);

export type Service = typeof services.$inferSelect;
export type InsertService = z.infer<typeof insertServiceSchema>;

// Admin Operations: Admin Notes
export const adminNotes = pgTable("admin_notes", {
  id: serial("id").primaryKey(),
  adminId: integer("admin_id").notNull().references(() => users.id),
  relatedType: text("related_type").notNull(), // user, order, product, vendor, fraud_case, credit_case, etc.
  relatedId: integer("related_id").notNull(),
  note: text("note").notNull(),
  priority: text("priority").default('normal'), // low, normal, high, critical
  isInternal: boolean("is_internal").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  relatedTypeIdx: index("admin_notes_related_type_idx").on(table.relatedType),
  relatedIdIdx: index("admin_notes_related_id_idx").on(table.relatedId),
  adminIdIdx: index("admin_notes_admin_id_idx").on(table.adminId),
}));

export const insertAdminNoteSchema = createInsertSchema(adminNotes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const selectAdminNoteSchema = createSelectSchema(adminNotes);

export type AdminNote = typeof adminNotes.$inferSelect;
export type InsertAdminNote = z.infer<typeof insertAdminNoteSchema>;

// Admin Operations: Credit & Collection
export const creditCollections = pgTable("credit_collections", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  orderId: integer("order_id").references(() => orders.id),
  amountDue: text("amount_due").notNull(),
  currency: text("currency").default('USD').notNull(),
  dueDate: timestamp("due_date").notNull(),
  status: text("status").default('pending').notNull(), // pending, overdue, partial, paid, written_off
  paymentPlanActive: boolean("payment_plan_active").default(false),
  paymentPlanTerms: json("payment_plan_terms"), // {installments, frequency, amount}
  lastContactDate: timestamp("last_contact_date"),
  nextFollowUpDate: timestamp("next_follow_up_date"),
  assignedTo: integer("assigned_to").references(() => users.id),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("credit_collections_user_id_idx").on(table.userId),
  statusIdx: index("credit_collections_status_idx").on(table.status),
  dueDateIdx: index("credit_collections_due_date_idx").on(table.dueDate),
  assignedToIdx: index("credit_collections_assigned_to_idx").on(table.assignedTo),
}));

export const insertCreditCollectionSchema = createInsertSchema(creditCollections).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const selectCreditCollectionSchema = createSelectSchema(creditCollections);

export type CreditCollection = typeof creditCollections.$inferSelect;
export type InsertCreditCollection = z.infer<typeof insertCreditCollectionSchema>;

// Admin Operations: Fraud Cases
export const fraudCases = pgTable("fraud_cases", {
  id: serial("id").primaryKey(),
  caseNumber: text("case_number").notNull().unique(),
  userId: integer("user_id").references(() => users.id),
  orderId: integer("order_id").references(() => orders.id),
  type: text("type").notNull(), // payment_fraud, account_fraud, chargeback, identity_theft, suspicious_activity
  riskLevel: text("risk_level").default('medium').notNull(), // low, medium, high, critical
  status: text("status").default('open').notNull(), // open, investigating, resolved, false_positive, confirmed_fraud
  description: text("description").notNull(),
  evidence: json("evidence"), // {type, details, timestamp}[]
  assignedTo: integer("assigned_to").references(() => users.id),
  resolvedAt: timestamp("resolved_at"),
  resolution: text("resolution"),
  actionsTaken: text("actions_taken").array(),
  flaggedBy: text("flagged_by").default('system'), // system, admin, user_report
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  caseNumberIdx: index("fraud_cases_case_number_idx").on(table.caseNumber),
  userIdIdx: index("fraud_cases_user_id_idx").on(table.userId),
  statusIdx: index("fraud_cases_status_idx").on(table.status),
  riskLevelIdx: index("fraud_cases_risk_level_idx").on(table.riskLevel),
  assignedToIdx: index("fraud_cases_assigned_to_idx").on(table.assignedTo),
}));

export const insertFraudCaseSchema = createInsertSchema(fraudCases).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const selectFraudCaseSchema = createSelectSchema(fraudCases);

export type FraudCase = typeof fraudCases.$inferSelect;
export type InsertFraudCase = z.infer<typeof insertFraudCaseSchema>;

// Admin Operations: Shipping & Returns
export const shippingReturns = pgTable("shipping_returns", {
  id: serial("id").primaryKey(),
  returnNumber: text("return_number").notNull().unique(),
  orderId: integer("order_id").notNull().references(() => orders.id),
  userId: integer("user_id").notNull().references(() => users.id),
  reason: text("reason").notNull(), // defective, wrong_item, not_as_described, changed_mind, other
  status: text("status").default('requested').notNull(), // requested, approved, rejected, in_transit, received, refunded, completed
  itemsReturned: json("items_returned").notNull(), // [{productId, quantity, condition}]
  refundAmount: text("refund_amount"),
  currency: text("currency").default('USD'),
  refundMethod: text("refund_method"), // original_payment, store_credit, replacement
  trackingNumber: text("tracking_number"),
  carrier: text("carrier"),
  shippingLabel: text("shipping_label"),
  receivedAt: timestamp("received_at"),
  inspectionNotes: text("inspection_notes"),
  approvedBy: integer("approved_by").references(() => users.id),
  processedBy: integer("processed_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  returnNumberIdx: index("shipping_returns_return_number_idx").on(table.returnNumber),
  orderIdIdx: index("shipping_returns_order_id_idx").on(table.orderId),
  userIdIdx: index("shipping_returns_user_id_idx").on(table.userId),
  statusIdx: index("shipping_returns_status_idx").on(table.status),
}));

export const insertShippingReturnSchema = createInsertSchema(shippingReturns).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const selectShippingReturnSchema = createSelectSchema(shippingReturns);

export type ShippingReturn = typeof shippingReturns.$inferSelect;
export type InsertShippingReturn = z.infer<typeof insertShippingReturnSchema>;

// Admin Operations: Finance Payouts
export const financePayouts = pgTable("finance_payouts", {
  id: serial("id").primaryKey(),
  payoutNumber: text("payout_number").notNull().unique(),
  vendorId: integer("vendor_id").references(() => users.id),
  amount: text("amount").notNull(),
  currency: text("currency").default('USD').notNull(),
  period: text("period").notNull(), // YYYY-MM format
  status: text("status").default('pending').notNull(), // pending, processing, completed, failed, cancelled
  paymentMethod: text("payment_method"), // bank_transfer, paypal, stripe, check
  orderIds: integer("order_ids").array(),
  commission: text("commission"),
  fees: text("fees"),
  netAmount: text("net_amount"),
  transactionId: text("transaction_id"),
  processedAt: timestamp("processed_at"),
  processedBy: integer("processed_by").references(() => users.id),
  failureReason: text("failure_reason"),
  notes: text("notes"),
  reconciliationData: json("reconciliation_data"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  payoutNumberIdx: index("finance_payouts_payout_number_idx").on(table.payoutNumber),
  vendorIdIdx: index("finance_payouts_vendor_id_idx").on(table.vendorId),
  statusIdx: index("finance_payouts_status_idx").on(table.status),
  periodIdx: index("finance_payouts_period_idx").on(table.period),
}));

export const insertFinancePayoutSchema = createInsertSchema(financePayouts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const selectFinancePayoutSchema = createSelectSchema(financePayouts);

export type FinancePayout = typeof financePayouts.$inferSelect;
export type InsertFinancePayout = z.infer<typeof insertFinancePayoutSchema>;

// Ticketing System
export const tickets = pgTable("tickets", {
  id: serial("id").primaryKey(),
  ticketNumber: text("ticket_number").notNull().unique(),
  subject: text("subject").notNull(),
  description: text("description").notNull(),
  status: ticketStatusEnum("status").default('open').notNull(),
  priority: ticketPriorityEnum("priority").default('medium').notNull(),
  department: ticketDepartmentEnum("department").notNull(),
  assignedTo: integer("assigned_to").references(() => users.id),
  userId: integer("user_id").references(() => users.id),
  email: text("email").notNull(),
  senderName: text("sender_name"),
  emailMessageId: text("email_message_id"),
  tags: text("tags").array(),
  resolvedAt: timestamp("resolved_at"),
  resolvedBy: integer("resolved_by").references(() => users.id),
  closedAt: timestamp("closed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  ticketNumberIdx: index("tickets_ticket_number_idx").on(table.ticketNumber),
  statusIdx: index("tickets_status_idx").on(table.status),
  departmentIdx: index("tickets_department_idx").on(table.department),
  assignedToIdx: index("tickets_assigned_to_idx").on(table.assignedTo),
  userIdIdx: index("tickets_user_id_idx").on(table.userId),
  emailIdx: index("tickets_email_idx").on(table.email),
}));

export const insertTicketSchema = createInsertSchema(tickets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const selectTicketSchema = createSelectSchema(tickets);

export type Ticket = typeof tickets.$inferSelect;
export type InsertTicket = z.infer<typeof insertTicketSchema>;

export const ticketMessages = pgTable("ticket_messages", {
  id: serial("id").primaryKey(),
  ticketId: integer("ticket_id").notNull().references(() => tickets.id, { onDelete: 'cascade' }),
  userId: integer("user_id").references(() => users.id),
  message: text("message").notNull(),
  isInternal: boolean("is_internal").default(false).notNull(),
  isEmailReply: boolean("is_email_reply").default(false).notNull(),
  senderEmail: text("sender_email"),
  senderName: text("sender_name"),
  emailMessageId: text("email_message_id"),
  attachments: json("attachments"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  ticketIdIdx: index("ticket_messages_ticket_id_idx").on(table.ticketId),
  userIdIdx: index("ticket_messages_user_id_idx").on(table.userId),
}));

export const insertTicketMessageSchema = createInsertSchema(ticketMessages).omit({
  id: true,
  createdAt: true,
});

export const selectTicketMessageSchema = createSelectSchema(ticketMessages);

export type TicketMessage = typeof ticketMessages.$inferSelect;
export type InsertTicketMessage = z.infer<typeof insertTicketMessageSchema>;

// =====================================
// Dr Congo Services
// =====================================

export const drCongoServiceTypeEnum = pgEnum('dr_congo_service_type', ['certificate', 'passport', 'supplementary_judgment']);

export const drCongoServices = pgTable("dr_congo_services", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  serviceType: drCongoServiceTypeEnum("service_type").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default('USD').notNull(),
  images: text("images").array(),
  status: varchar("status", { length: 20 }).default('active').notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("dr_congo_services_user_id_idx").on(table.userId),
  serviceTypeIdx: index("dr_congo_services_service_type_idx").on(table.serviceType),
  statusIdx: index("dr_congo_services_status_idx").on(table.status),
}));

export const insertDrCongoServiceSchema = createInsertSchema(drCongoServices).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const selectDrCongoServiceSchema = createSelectSchema(drCongoServices);

export type DrCongoService = typeof drCongoServices.$inferSelect;
export type InsertDrCongoService = z.infer<typeof insertDrCongoServiceSchema>;

// =====================================
// User Analytics Tracking
// =====================================

export const profileViews = pgTable("profile_views", {
  id: serial("id").primaryKey(),
  profileUserId: integer("profile_user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  viewerUserId: integer("viewer_user_id").references(() => users.id, { onDelete: 'cascade' }),
  viewerIp: varchar("viewer_ip", { length: 45 }),
  viewerUserAgent: text("viewer_user_agent"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  profileUserIdx: index("profile_views_profile_user_idx").on(table.profileUserId),
  viewerUserIdx: index("profile_views_viewer_user_idx").on(table.viewerUserId),
  createdAtIdx: index("profile_views_created_at_idx").on(table.createdAt),
}));

export const postImpressions = pgTable("post_impressions", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").notNull().references(() => posts.id, { onDelete: 'cascade' }),
  userId: integer("user_id").references(() => users.id, { onDelete: 'cascade' }),
  impressionType: varchar("impression_type", { length: 20 }).notNull().default('view'),
  userIp: varchar("user_ip", { length: 45 }),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  postIdIdx: index("post_impressions_post_id_idx").on(table.postId),
  userIdIdx: index("post_impressions_user_id_idx").on(table.userId),
  createdAtIdx: index("post_impressions_created_at_idx").on(table.createdAt),
}));

export const searchAppearances = pgTable("search_appearances", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  searchQuery: text("search_query").notNull(),
  searchType: varchar("search_type", { length: 50 }).notNull(),
  position: integer("position"),
  searcherUserId: integer("searcher_user_id").references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("search_appearances_user_id_idx").on(table.userId),
  searcherUserIdx: index("search_appearances_searcher_user_idx").on(table.searcherUserId),
  createdAtIdx: index("search_appearances_created_at_idx").on(table.createdAt),
}));

export const insertProfileViewSchema = createInsertSchema(profileViews).omit({ 
  id: true, 
  createdAt: true 
});

export const insertPostImpressionSchema = createInsertSchema(postImpressions).omit({ 
  id: true, 
  createdAt: true 
});

export const insertSearchAppearanceSchema = createInsertSchema(searchAppearances).omit({ 
  id: true, 
  createdAt: true 
});

export type ProfileView = typeof profileViews.$inferSelect;
export type InsertProfileView = z.infer<typeof insertProfileViewSchema>;

export type PostImpression = typeof postImpressions.$inferSelect;
export type InsertPostImpression = z.infer<typeof insertPostImpressionSchema>;

export type SearchAppearance = typeof searchAppearances.$inferSelect;
export type InsertSearchAppearance = z.infer<typeof insertSearchAppearanceSchema>;
