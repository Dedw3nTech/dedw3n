import { pgTable, text, serial, integer, boolean, timestamp, doublePrecision, varchar, json, unique, primaryKey, pgEnum, index, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const communityVisibilityEnum = pgEnum('community_visibility', ['public', 'private', 'secret']);
export const membershipTierTypeEnum = pgEnum('membership_tier_type', ['free', 'paid', 'premium']);
export const eventTypeEnum = pgEnum('event_type', ['live_stream', 'course', 'workshop', 'meetup', 'qa_session']);
export const subscriptionIntervalEnum = pgEnum('subscription_interval', ['daily', 'weekly', 'monthly', 'yearly', 'one_time']);
export const videoTypeEnum = pgEnum('video_type', ['short_form', 'story', 'live_stream', 'live_commerce', 'recorded']);
export const videoVisibilityEnum = pgEnum('video_visibility', ['public', 'followers', 'private']);
export const moderationMatchTypeEnum = pgEnum('moderation_match_type', ['exact', 'partial', 'regex']);
export const moderationSeverityEnum = pgEnum('moderation_severity', ['low', 'medium', 'high']);
export const flaggedContentTypeEnum = pgEnum('flagged_content_type', ['post', 'comment', 'message', 'product', 'profile', 'community']);
export const flaggedContentStatusEnum = pgEnum('flagged_content_status', ['pending', 'approved', 'rejected']);
export const notificationTypeEnum = pgEnum('notification_type', ['like', 'comment', 'follow', 'mention', 'message', 'order', 'payment', 'system']);
export const notificationChannelEnum = pgEnum('notification_channel', ['app', 'email', 'push', 'sms']);

// Fraud prevention enums
export const riskLevelEnum = pgEnum('risk_level', ['low', 'medium', 'high', 'critical']);

// Define user roles enum
export const userRoleEnum = pgEnum('user_role', ['user', 'admin', 'moderator', 'vendor', 'business']);

// Define dating subscription levels enum
export const datingSubscriptionEnum = pgEnum('dating_subscription', ['normal', 'vip', 'vvip']);

// User model
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  bio: text("bio"),
  avatar: text("avatar"),
  isVendor: boolean("is_vendor").default(false),
  role: userRoleEnum("role").default('user').notNull(),
  lastLogin: timestamp("last_login"),
  failedLoginAttempts: integer("failed_login_attempts").default(0),
  isLocked: boolean("is_locked").default(false),
  passwordResetToken: text("password_reset_token"),
  passwordResetExpires: timestamp("password_reset_expires"),
  emailVerified: boolean("email_verified").default(false),
  verificationToken: text("verification_token"),
  twoFactorEnabled: boolean("two_factor_enabled").default(false),
  twoFactorSecret: text("two_factor_secret"),
  datingSubscription: datingSubscriptionEnum("dating_subscription").default('normal'),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Vendor model
export const vendors = pgTable("vendors", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  storeName: text("store_name").notNull(),
  description: text("description"),
  logo: text("logo"),
  rating: doublePrecision("rating").default(0),
  ratingCount: integer("rating_count").default(0),
});

// Product model
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  vendorId: integer("vendor_id").notNull().references(() => vendors.id),
  name: text("name").notNull(),
  description: text("description").notNull(),
  price: doublePrecision("price").notNull(),
  discountPrice: doublePrecision("discount_price"),
  category: text("category").notNull(),
  imageUrl: text("image_url").notNull(),
  inventory: integer("inventory").default(1),
  isNew: boolean("is_new").default(false),
  isOnSale: boolean("is_on_sale").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Category model
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
});

// Post model (for social features)
// Define post review status enum
export const postReviewStatusEnum = pgEnum('post_review_status', ['pending', 'approved', 'rejected']);

export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  title: text("title"),
  contentType: varchar("content_type", { length: 20 }).notNull().default("text"), // text, image, video, article, advertisement
  imageUrl: text("image_url"),
  videoUrl: text("video_url"),
  productId: integer("product_id").references(() => products.id),
  likes: integer("likes").default(0),
  comments: integer("comments").default(0),
  shares: integer("shares").default(0),
  views: integer("views").default(0),
  tags: text("tags").array(), // Array of tags for better content discovery
  isPromoted: boolean("is_promoted").default(false), // For advertisements
  promotionEndDate: timestamp("promotion_end_date"), // For advertisements
  isPublished: boolean("is_published").default(true),
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
  content: text("content").notNull(),
  isRead: boolean("is_read").default(false),
  sourceId: integer("source_id"), // ID of the related item (post, comment, etc.)
  sourceType: text("source_type"), // Type of the related item
  actorId: integer("actor_id").references(() => users.id), // User who triggered the notification
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
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

// Insert schemas
export const insertUserSchema = createInsertSchema(users)
  .omit({ id: true, createdAt: true });

export const insertVendorSchema = createInsertSchema(vendors)
  .omit({ id: true, rating: true, ratingCount: true });
  
export const vendorUpdateSchema = z.object({
  storeName: z.string().min(3).max(100).optional(),
  description: z.string().max(1000).nullable().optional(),
  logo: z.string().url().nullable().optional(),
});

export const insertProductSchema = createInsertSchema(products)
  .omit({ id: true, createdAt: true });

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
  
export const insertConnectionSchema = createInsertSchema(connections)
  .omit({ id: true, status: true, createdAt: true, updatedAt: true });
  
export const insertLikeSchema = createInsertSchema(likes)
  .omit({ id: true, createdAt: true });
  
export const insertFollowSchema = createInsertSchema(follows)
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

export type Connection = typeof connections.$inferSelect;
export type InsertConnection = z.infer<typeof insertConnectionSchema>;

export type Like = typeof likes.$inferSelect;
export type InsertLike = z.infer<typeof insertLikeSchema>;

export type Follow = typeof follows.$inferSelect;
export type InsertFollow = z.infer<typeof insertFollowSchema>;

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

export const insertVideoSchema = createInsertSchema(videos);
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

// Auth tokens for token-based authentication (multi-device support)
export const authTokens = pgTable("auth_tokens", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  token: varchar("token", { length: 128 }).notNull().unique(),
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

// Schemas
export const insertAllowListSchema = createInsertSchema(allowList).omit({ id: true, createdAt: true, updatedAt: true });
export const insertBlockListSchema = createInsertSchema(blockList).omit({ id: true, createdAt: true, updatedAt: true });
export const insertFlaggedContentSchema = createInsertSchema(flaggedContent).omit({ id: true, reviewedAt: true, createdAt: true, updatedAt: true });
export const insertFlaggedImageSchema = createInsertSchema(flaggedImages).omit({ id: true, reviewedAt: true, createdAt: true, updatedAt: true });
export const insertModerationReportSchema = createInsertSchema(moderationReports).omit({ id: true, reviewedAt: true, createdAt: true, updatedAt: true });

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

// Add schemas for new tables
export const insertUserSessionSchema = createInsertSchema(userSessions).omit({ id: true, createdAt: true });
export const insertTrafficAnalyticsSchema = createInsertSchema(trafficAnalytics).omit({ id: true, createdAt: true });

// Add types for new tables
export type UserSession = typeof userSessions.$inferSelect;
export type InsertUserSession = z.infer<typeof insertUserSessionSchema>;

export type TrafficAnalytic = typeof trafficAnalytics.$inferSelect;
export type InsertTrafficAnalytic = z.infer<typeof insertTrafficAnalyticsSchema>;

// Saved posts schema and types
export const insertSavedPostSchema = createInsertSchema(savedPosts).omit({ id: true, createdAt: true });
export type SavedPost = typeof savedPosts.$inferSelect;
export type InsertSavedPost = z.infer<typeof insertSavedPostSchema>;

// Notification schemas and types
export const insertNotificationSchema = createInsertSchema(notifications).omit({ id: true, createdAt: true, updatedAt: true });
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;

// Notification Settings schemas and types
export const insertNotificationSettingsSchema = createInsertSchema(notificationSettings).omit({ id: true, createdAt: true, updatedAt: true });
export type NotificationSettings = typeof notificationSettings.$inferSelect;
export type InsertNotificationSettings = z.infer<typeof insertNotificationSettingsSchema>;

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
