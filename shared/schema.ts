import { pgTable, text, serial, integer, boolean, timestamp, doublePrecision, varchar, json, unique, primaryKey, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const communityVisibilityEnum = pgEnum('community_visibility', ['public', 'private', 'secret']);
export const membershipTierTypeEnum = pgEnum('membership_tier_type', ['free', 'paid', 'premium']);
export const eventTypeEnum = pgEnum('event_type', ['live_stream', 'course', 'workshop', 'meetup', 'qa_session']);
export const subscriptionIntervalEnum = pgEnum('subscription_interval', ['daily', 'weekly', 'monthly', 'yearly', 'one_time']);

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
  createdAt: timestamp("created_at").defaultNow(),
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
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Notification model
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  type: text("type").notNull(), // like, comment, follow, message
  content: text("content").notNull(),
  isRead: boolean("is_read").default(false),
  sourceId: integer("source_id"), // postId, messageId, etc.
  sourceType: text("source_type"), // post, message, etc.
  createdAt: timestamp("created_at").defaultNow(),
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

// Follows model
export const follows = pgTable("follows", {
  id: serial("id").primaryKey(),
  followerId: integer("follower_id").notNull().references(() => users.id),
  followingId: integer("following_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
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
  creatorId: integer("creator_id").notNull().references(() => users.id),
  planName: varchar("plan_name", { length: 50 }).notNull(),
  amount: doublePrecision("amount").notNull(),
  currency: varchar("currency", { length: 3 }).notNull().default("USD"),
  interval: subscriptionIntervalEnum("interval").notNull(),
  status: varchar("status", { length: 20 }).notNull().default("active"), // active, canceled, paused, failed
  currentPeriodStart: timestamp("current_period_start").notNull(),
  currentPeriodEnd: timestamp("current_period_end").notNull(),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false),
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
