import session from "express-session";
import createMemoryStore from "memorystore";
import { hashPassword } from "./auth";
import connectPg from "connect-pg-simple";
import { Pool } from "pg";
import { db } from "./db";
import { eq, like, ilike, and, or, desc, asc, sql, count, inArray, lte, gte, ne } from "drizzle-orm";
import { generateProductCode } from "./product-code-generator";

import {
  users, vendors, products, categories, posts, comments,
  likes, messages, notifications, notificationSettings, reviews, carts,
  wallets, transactions, orders, orderItems, communities,
  communityMembers, membershipTiers, memberships, events as eventsTable,
  eventRegistrations, polls, pollVotes, creatorEarnings, subscriptions,
  videos, videoEngagements, videoAnalytics, videoPlaylists, playlistItems,
  videoPurchases, videoProductOverlays, communityContents, communityContentLikes, authTokens, follows,
  allowList, blockList, flaggedContent, flaggedImages, moderationReports, userBlocks,
  callSessions, callMetadata, connections, userSessions, trafficAnalytics, savedPosts,
  likedProducts, friendRequests, giftPropositions, likedEvents,
  chatrooms, chatroomMessages, chatroomMembers, privateRoomInvitations, audioSessions, audioSessionParticipants,
  datingProfiles, datingLikes, datingMatches, storeUsers, affiliatePartners, vendorAffiliatePartners,
  giftCards, giftCardTransactions, giftCardRedemptions, cryptoPayments, proxyAccounts, financialServices, governmentServices,
  calendarEvents, calendarEventParticipants, calendarEventReminders, lifestyleServices, services,
  tickets, ticketMessages, profileViews, postImpressions, searchAppearances,
  type User, type InsertUser, type Vendor, type InsertVendor,
  type Product, type InsertProduct, type Category, type InsertCategory,
  type Post, type InsertPost, type Comment, type InsertComment,
  type Message, type InsertMessage, type Review, type InsertReview,
  type Cart, type InsertCart, type Wallet, type InsertWallet,
  type Transaction, type InsertTransaction, type Order, type InsertOrder,
  type OrderItem, type InsertOrderItem, type Community, type InsertCommunity,
  type Connection, type InsertConnection, type Notification, type InsertNotification,
  type NotificationSettings, type InsertNotificationSettings,
  type LikedProduct, type InsertLikedProduct,
  type GiftProposition, type InsertGiftProposition,
  type Event, type InsertEvent, type LikedEvent, type InsertLikedEvent,
  type Chatroom, type InsertChatroom, type PrivateRoomInvitation, type InsertPrivateRoomInvitation,
  type AudioSession, type InsertAudioSession, type AudioSessionParticipant, type InsertAudioSessionParticipant,
  type DatingProfile, type InsertDatingProfile, type DatingLike, type InsertDatingLike, type DatingMatch, type InsertDatingMatch, type StoreUser, type InsertStoreUser,
  type AffiliatePartner, type InsertAffiliatePartner, type VendorAffiliatePartner, type InsertVendorAffiliatePartner,
  type GiftCard, type InsertGiftCard, type GiftCardTransaction, type InsertGiftCardTransaction, type GiftCardRedemption, type InsertGiftCardRedemption,
  type CryptoPayment, type InsertCryptoPayment, type ProxyAccount, type InsertProxyAccount,
  type UserBlock, type InsertUserBlock, type ModerationReport, type InsertModerationReport,
  type CalendarEvent, type InsertCalendarEvent, type CalendarEventParticipant, type InsertCalendarEventParticipant,
  type CalendarEventReminder, type InsertCalendarEventReminder,
  type CalendarEventAttachment,
  type LifestyleService, type InsertLifestyleService,
  type Service, type InsertService,
  type Ticket, type InsertTicket, type TicketMessage, type InsertTicketMessage,
  type CommunityContent, type InsertCommunityContent,
  type CommunityContentLike, type InsertCommunityContentLike,
  type MembershipTier, type Membership
} from "@shared/schema";

// Import the messages helpers from our separate module
import * as messageHelpers from './messages';
import { logger } from "./logger";

// Interface for all storage operations
export interface IStorage {
  // Message operations
  getMessage(id: number): Promise<Message | undefined>;
  getUserMessages(userId: number): Promise<Message[]>;
  getMessagesBetweenUsers(userId1: number, userId2: number): Promise<Message[]>;
  getConversationMessages(userId1: number, userId2: number): Promise<Message[]>;
  getUserConversations(userId: number): Promise<any[]>;
  getConversations(userId: number): Promise<any[]>;
  getUnreadMessageCount(userId: number): Promise<number>;
  createMessage(message: InsertMessage): Promise<Message>;
  markMessageAsRead(id: number): Promise<Message | undefined>;
  markMessagesAsRead(currentUserId: number, otherUserId: number): Promise<void>;
  updateMessageContent(id: number, newContent: string): Promise<Message | undefined>;
  searchUserMessages(userId: number, query: string): Promise<any[]>;
  clearConversation(userId1: number, userId2: number): Promise<boolean>;
  getUserMessagingStats(userId: number): Promise<any>;
  deleteMessage(id: number, userId?: number): Promise<boolean>;
  
  // Category-specific message operations
  getMessagesByCategory(userId: number, category: 'marketplace' | 'community' | 'dating'): Promise<any[]>;
  getConversationsByCategory(userId: number, category: 'marketplace' | 'community' | 'dating'): Promise<any[]>;
  getUnreadCountByCategory(userId: number, category: 'marketplace' | 'community' | 'dating'): Promise<number>;
  
  // Call operations
  createCallSession(callData: any): Promise<any>;
  updateCallSession(id: number, updateData: any): Promise<any>;
  getUserCallHistory(userId: number, limit?: number): Promise<any[]>;
  getUserCallStats(userId: number): Promise<any>;
  
  // Subscription operations
  getUserSubscription(userId: number): Promise<any | null>;
  createOrUpdateSubscription(subscriptionData: any): Promise<any>;
  
  // Notification operations
  createNotification(notificationData: InsertNotification): Promise<Notification>;
  getNotifications(userId: number, limit?: number): Promise<Notification[]>;
  getUnreadNotificationCount(userId: number): Promise<number>;
  getUnreadNotificationCountByType(userId: number, notificationType: string): Promise<number>;
  markNotificationAsRead(id: number): Promise<Notification | undefined>;
  markAllNotificationsAsRead(userId: number): Promise<boolean>;
  getNotificationSettings(userId: number): Promise<NotificationSettings[]>;
  updateNotificationSetting(userId: number, type: string, channel: string, enabled: boolean): Promise<NotificationSettings | undefined>;
  
  // Calendar notification operations
  getCalendarNotificationCount(userId: number): Promise<number>;
  
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByVerificationToken(token: string): Promise<User | undefined>;
  getUserByResetToken(token: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, userData: Partial<User>): Promise<User | undefined>;
  
  // User connection operations
  connectUsers(userId1: number, userId2: number): Promise<boolean>;
  disconnectUsers(userId1: number, userId2: number): Promise<boolean>;
  checkConnection(userId1: number, userId2: number): Promise<boolean>;
  listUsers(): Promise<User[]>;
  searchUsers(query: string, limit?: number): Promise<User[]>;
  getUsersForMessaging(currentUserId: number): Promise<Array<{id: number, username: string, name: string, avatar: string | null}>>
  
  // Follow operations
  followUser(followerId: number, followingId: number): Promise<boolean>;
  unfollowUser(followerId: number, followingId: number): Promise<boolean>;
  checkIfUserFollows(followerId: number, followingId: number): Promise<boolean>;
  
  // User social stats
  getUserPostCount(userId: number): Promise<number>;
  getFollowersCount(userId: number): Promise<number>;
  getFollowingCount(userId: number): Promise<number>;
  getUserPosts(userId: number, limit?: number, offset?: number): Promise<Post[]>;
  getUserDraftPosts(userId: number, limit?: number, offset?: number): Promise<Post[]>;
  getFollowers(userId: number, limit?: number, offset?: number): Promise<User[]>;
  getFollowing(userId: number, limit?: number, offset?: number): Promise<User[]>;
  getUserStats(userId: number): Promise<{ postCount: number, followerCount: number, followingCount: number }>;
  
  // Category operations
  getCategoryByName(name: string): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  listCategories(): Promise<Category[]>;
  
  // Vendor Sub-Account operations
  getVendorByUserId(userId: number): Promise<Vendor | undefined>; // Legacy method - gets first vendor
  getVendorByUserIdAndType(userId: number, vendorType: 'private' | 'business'): Promise<Vendor | undefined>;
  getUserVendorAccounts(userId: number): Promise<Vendor[]>; // Gets all vendor accounts for a user
  getVendor(id: number): Promise<Vendor | undefined>;
  getVendors(limit?: number): Promise<Vendor[]>;
  createVendor(vendor: InsertVendor): Promise<Vendor>;
  updateVendorStatus(id: number, isActive: boolean): Promise<Vendor | undefined>;
  checkVendorAccountExists(userId: number, vendorType: 'private' | 'business'): Promise<boolean>;
  
  // Product operations
  listProducts(): Promise<Product[]>;
  getProducts(): Promise<Product[]>;
  getPopularProducts(): Promise<Product[]>;
  createProduct(product: InsertProduct): Promise<Product>;
  getProduct(id: number): Promise<Product | undefined>;
  getProductBySlug(slug: string): Promise<Product | undefined>;
  updateProduct(id: number, updates: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: number): Promise<boolean>;
  getTopSellingProducts(limit: number): Promise<any[]>;
  
  // Cart operations
  countCartItems(userId: number): Promise<number>;
  addToCart(cartItem: InsertCart): Promise<Cart>;
  listCartItems(userId: number): Promise<(Cart & { product: Product })[]>;
  getCartItem(id: number): Promise<(Cart & { product: Product }) | undefined>;
  updateCartItem(id: number, update: Partial<Cart>): Promise<(Cart & { product: Product }) | undefined>;
  removeCartItem(id: number): Promise<boolean>;

  // Cryptocurrency payment operations
  createCryptoPayment(payment: InsertCryptoPayment): Promise<CryptoPayment>;
  getCryptoPayment(paymentId: string): Promise<CryptoPayment | undefined>;
  updateCryptoPaymentStatus(paymentId: string, updates: Partial<CryptoPayment>): Promise<CryptoPayment | undefined>;
  getCryptoPaymentsByOrder(orderId: number): Promise<CryptoPayment[]>;
  getCryptoPaymentsByUser(userId: number): Promise<CryptoPayment[]>;
  
  // Post operations
  getPost(id: number): Promise<Post | undefined>;
  incrementPostView(id: number): Promise<boolean>;
  createPost(post: InsertPost): Promise<Post>;
  updatePost(id: number, postData: Partial<Post>): Promise<Post | undefined>;
  deletePost(id: number): Promise<boolean>;
  getFeedPosts(userId?: number, sortBy?: string, limit?: number, offset?: number): Promise<Post[]>;
  getTrendingPosts(limit?: number): Promise<Post[]>;
  getPopularTags(limit?: number): Promise<{ tag: string, count: number }[]>;
  getSuggestedUsers(limit?: number, currentUserId?: number): Promise<User[]>;
  getAllPostsPaginated(limit: number, offset: number, currentUserId?: number): Promise<(Post & { user: { id: number; username: string; name: string; avatar: string | null }; _count: { likes: number; comments: number; shares: number }; isLiked: boolean; isShared: boolean })[]>;
  getTotalPostsCount(): Promise<number>;
  getPostsByRegion(userId: number, limit: number, offset: number): Promise<Post[]>;
  getPostsByCountry(userId: number, limit: number, offset: number): Promise<Post[]>;
  
  // Like operations
  likePost(postId: number, userId: number): Promise<boolean>;
  unlikePost(postId: number, userId: number): Promise<boolean>;
  checkIfUserLikedPost(postId: number, userId: number): Promise<boolean>;
  getPostLikes(postId: number): Promise<any[]>;
  getPostLike(postId: number, userId: number): Promise<any | undefined>;
  
  // Saved posts operations
  savePost(postId: number, userId: number): Promise<void>;
  unsavePost(postId: number, userId: number): Promise<boolean>;
  checkSavedPost(postId: number, userId: number): Promise<boolean>;
  getSavedPosts(userId: number, options: { limit: number, offset: number }): Promise<Post[]>;
  
  // Liked products operations
  likeProduct(userId: number, productId: number): Promise<LikedProduct>;
  unlikeProduct(userId: number, productId: number): Promise<boolean>;
  checkProductLiked(userId: number, productId: number): Promise<boolean>;
  getUserLikedProducts(userId: number): Promise<Product[]>;
  
  // Liked events operations
  likeEvent(userId: number, eventId: number): Promise<LikedEvent>;
  unlikeEvent(userId: number, eventId: number): Promise<boolean>;
  checkEventLiked(userId: number, eventId: number): Promise<boolean>;
  getUserLikedEvents(userId: number): Promise<Event[]>;
  
  // Friend request operations
  createFriendRequest(request: { senderId: number, recipientId: number, message: string }): Promise<any>;
  getFriendRequest(senderId: number, recipientId: number): Promise<any>;
  getFriendRequests(userId: number): Promise<any[]>;
  acceptFriendRequest(requestId: number, userId: number): Promise<void>;
  rejectFriendRequest(requestId: number, userId: number): Promise<void>;
  
  // Comment operations
  createComment(comment: InsertComment): Promise<Comment>;
  getPostComments(postId: number, limit?: number, offset?: number): Promise<Comment[]>;
  deleteComment(id: number): Promise<boolean>;
  getComment(id: number): Promise<Comment | undefined>;
  updateComment(id: number, content: string): Promise<Comment | undefined>;
  
  // Post promotion operations
  promotePost(postId: number, endDate: Date): Promise<Post | undefined>;
  unpromotePost(postId: number): Promise<Post | undefined>;
  
  // Admin analytics operations
  getUserCount(): Promise<number>;
  getProductCount(): Promise<number>;
  getOrderCount(): Promise<number>;
  getCommunityCount(): Promise<number>;
  getUserCommunities(userId: number): Promise<any[]>;
  countPosts(options: any): Promise<number>;
  
  // Exclusive content operations
  getCommunityContent(contentId: number): Promise<any | undefined>;
  canUserAccessContent(userId: number, contentId: number): Promise<boolean>;
  listCommunityContent(communityId: number): Promise<any[]>;
  getMembershipTier(tierId: number, communityId?: number): Promise<any | undefined>;
  getAccessibleCommunityContent(communityId: number, userId: number): Promise<any[]>;
  isUserCommunityAdminOrOwner(userId: number, communityId: number): Promise<boolean>;
  createCommunityContent(contentData: any): Promise<any>;
  updateCommunityContent(contentId: number, updates: any): Promise<any | undefined>;
  deleteCommunityContent(contentId: number): Promise<boolean>;
  incrementContentViewCount(contentId: number): Promise<boolean>;
  likeContent(userId: number, contentId: number): Promise<any>;
  unlikeContent(userId: number, contentId: number): Promise<boolean>;
  getCommunityContentByTier(communityId: number, tier: number): Promise<any[]>;
  getCommunityContentByType(communityId: number, contentType: string): Promise<any[]>;
  getFeaturedCommunityContent(communityId: number): Promise<any[]>;
  
  // Order analytics
  countOrders(options: any): Promise<number>;
  calculateTotalRevenue(): Promise<number>;
  calculateAverageOrderValue(): Promise<number>;
  
  // Product analytics
  getTopSellingProducts(limit: number): Promise<any[]>;
  getProductPerformanceMetrics(timeRange: string): Promise<any>;
  getCategoryTrendsData(): Promise<any>;
  getRevenueByCategory(timeRange: string): Promise<any>;
  getInventoryAlerts(): Promise<any[]>;
  
  // Admin analytics
  getUserRegistrationTrends(timeRange: string): Promise<any>;
  getActiveUserStats(timeRange: string): Promise<any>;
  getSalesData(timeRange: string): Promise<any>;
  getProductCategoryDistribution(): Promise<any>;
  getTrafficSourcesData(timeRange: string): Promise<any>;
  
  // Order operations
  getOrder(id: number): Promise<any>;
  updateOrder(id: number, updates: any): Promise<any>;
  updateOrderItemsStatus(orderId: number, status: string): Promise<boolean>;
  deleteUser(userId: number): Promise<boolean>;
  resetUserPassword(userId: number, newPassword: string): Promise<boolean>;
  listPosts(options: any): Promise<any[]>;
  
  // Auth token operations
  getAuthToken(token: string): Promise<any | undefined>;
  createAuthToken(tokenData: any): Promise<any>;
  revokeAuthToken(id: number, reason?: string): Promise<boolean>;
  updateTokenLastActive(id: number): Promise<boolean>;
  revokeAllUserTokens(userId: number, reason?: string): Promise<boolean>;
  revokeAllUserTokensExcept(userId: number, tokenId: number): Promise<boolean>;
  revokeSpecificToken(userId: number, tokenId: number): Promise<boolean>;
  cleanupExpiredTokens(): Promise<void>;
  incrementLoginAttempts(userId: number): Promise<void>;
  resetLoginAttempts(userId: number): Promise<void>;
  lockUserAccount(userId: number, lock: boolean): Promise<void>;

  // Gift operations
  createGiftProposition(giftData: InsertGiftProposition): Promise<GiftProposition>;
  getGiftProposition(id: number): Promise<GiftProposition | undefined>;
  getUserSentGifts(userId: number): Promise<GiftProposition[]>;
  getUserReceivedGifts(userId: number): Promise<GiftProposition[]>;
  updateGiftStatus(id: number, status: string, paymentIntentId?: string): Promise<GiftProposition | undefined>;

  // Calendar operations
  createCalendarEvent(eventData: InsertCalendarEvent): Promise<CalendarEvent>;
  getCalendarEvent(id: number): Promise<CalendarEvent | undefined>;
  getUserCalendarEvents(userId: number, startDate?: Date, endDate?: Date): Promise<CalendarEvent[]>;
  getEventsByCategory(userId: number, category: string): Promise<CalendarEvent[]>;
  updateCalendarEvent(id: number, userId: number, updates: Partial<CalendarEvent>): Promise<CalendarEvent | undefined>;
  deleteCalendarEvent(id: number, userId: number): Promise<boolean>;
  getUpcomingEvents(userId: number, limit?: number): Promise<CalendarEvent[]>;
  getEventReminders(userId: number): Promise<CalendarEventReminder[]>;
  createEventReminder(reminderData: InsertCalendarEventReminder): Promise<CalendarEventReminder>;
  updateEventReminder(id: number, updates: Partial<CalendarEventReminder>): Promise<CalendarEventReminder | undefined>;
  getEventParticipants(eventId: number): Promise<Array<{ participant: CalendarEventParticipant; user: { id: number; username: string; name: string | null; avatar: string | null } }>>;
  addEventParticipant(participantData: InsertCalendarEventParticipant): Promise<CalendarEventParticipant>;
  updateParticipantStatus(eventId: number, userId: number, status: string): Promise<CalendarEventParticipant | undefined>;
  searchCalendarEvents(userId: number, query: string): Promise<CalendarEvent[]>;
  
  // Calendar event file operations
  addCalendarEventAttachment(eventId: number, userId: number, attachment: CalendarEventAttachment): Promise<CalendarEvent | undefined>;
  getCalendarEventAttachments(eventId: number): Promise<CalendarEventAttachment[]>;
  deleteCalendarEventAttachment(eventId: number, userId: number, attachmentId: string): Promise<CalendarEvent | undefined>;
  checkEventParticipantAccess(eventId: number, userId: number): Promise<boolean>;
  
  // Lifestyle service operations
  createLifestyleService(serviceData: InsertLifestyleService): Promise<LifestyleService>;
  getLifestyleService(id: number): Promise<LifestyleService | undefined>;
  getAllLifestyleServices(category?: string): Promise<LifestyleService[]>;
  getUserLifestyleServices(userId: number, category?: string): Promise<LifestyleService[]>;
  updateLifestyleService(id: number, userId: number, updates: Partial<LifestyleService>): Promise<LifestyleService | undefined>;
  deleteLifestyleService(id: number, userId: number): Promise<boolean>;
  searchLifestyleServices(query: string, category?: string): Promise<LifestyleService[]>;
  getFeaturedLifestyleServices(category?: string, limit?: number): Promise<LifestyleService[]>;
  
  // Service operations
  createService(serviceData: InsertService): Promise<Service>;
  getService(id: number): Promise<Service | undefined>;
  getAllServices(category?: string): Promise<Service[]>;
  getUserServices(userId: number, category?: string): Promise<Service[]>;
  updateService(id: number, userId: number, updates: Partial<Service>): Promise<Service | undefined>;
  deleteService(id: number, userId: number): Promise<boolean>;
  searchServices(query: string, category?: string): Promise<Service[]>;
  getFeaturedServices(category?: string, limit?: number): Promise<Service[]>;
  
  // Platform users and gift system
  getPlatformUsers(excludeUserId: number): Promise<User[]>;
  createGift(giftData: any): Promise<any>;

  // Store user management operations
  searchUsersForStore(query: string): Promise<User[]>;
  getStoreUsers(vendorId: number): Promise<any[]>;
  assignUserToStore(storeUserData: any): Promise<any>;
  updateStoreUser(id: number, vendorId: number, updates: any): Promise<any>;
  removeUserFromStore(id: number, vendorId: number): Promise<boolean>;

  // Comprehensive search operations for community
  searchPosts(query: string, limit?: number): Promise<any[]>;
  searchMembers(query: string, limit?: number): Promise<any[]>;
  searchDatingProfiles(query: string, currentUserId?: number, limit?: number): Promise<any[]>;
  comprehensiveSearch(query: string, currentUserId?: number): Promise<{
    posts: any[];
    members: any[];
    events: any[];
    datingProfiles: any[];
  }>;

  // Dating profile operations
  getDatingProfile(userId: number): Promise<DatingProfile | undefined>;
  createDatingProfile(profileData: InsertDatingProfile): Promise<DatingProfile>;
  updateDatingProfile(userId: number, updates: Partial<DatingProfile>): Promise<DatingProfile | undefined>;
  addGiftToDatingProfile(userId: number, productId: number): Promise<boolean>;
  removeGiftFromDatingProfile(userId: number, productId: number): Promise<boolean>;
  getDatingProfileGifts(userId: number): Promise<Product[]>;

  // Dating likes and matches operations
  likeDatingProfile(likerId: number, likedId: number): Promise<{ liked: boolean; matched: boolean }>;
  passDatingProfile(userId: number, passedId: number): Promise<boolean>;
  getUserMatches(userId: number): Promise<any[]>;
  checkExistingLike(likerId: number, likedId: number): Promise<DatingLike | undefined>;
  createMatch(user1Id: number, user2Id: number): Promise<DatingMatch>;

  // Affiliate partnership operations
  getAffiliatePartnerByUserId(userId: number): Promise<any | undefined>;
  createAffiliatePartner(partnerData: any): Promise<any>;
  updateAffiliatePartner(id: number, updates: any): Promise<any | undefined>;
  getAffiliateReferrals(affiliateId: number): Promise<any[]>;
  getAffiliateEarnings(affiliateId: number): Promise<any[]>;
  generateReferralLink(affiliateId: number): Promise<string>;

  // Gift card operations
  createGiftCard(giftCardData: InsertGiftCard): Promise<GiftCard>;
  getGiftCard(id: number): Promise<GiftCard | undefined>;
  getGiftCardByCode(code: string): Promise<GiftCard | undefined>;
  getGiftCardByCardNumber(cardNumber: string): Promise<GiftCard | undefined>;
  updateGiftCard(id: number, updates: Partial<GiftCard>): Promise<GiftCard | undefined>;
  getUserGiftCards(userId: number): Promise<GiftCard[]>;
  redeemGiftCard(code: string, userId: number, orderId: number, amount: number): Promise<{ success: boolean; remainingBalance: number; message: string }>;
  createGiftCardTransaction(transactionData: InsertGiftCardTransaction): Promise<GiftCardTransaction>;
  getGiftCardTransactions(giftCardId: number): Promise<GiftCardTransaction[]>;
  createGiftCardRedemption(redemptionData: InsertGiftCardRedemption): Promise<GiftCardRedemption>;
  getGiftCardBalance(code: string): Promise<{ balance: number; status: string } | null>;
  getGiftCardBalanceByCardNumber(cardNumber: string, pin: string): Promise<{ balance: number; status: string; cardNumber: string } | null>;
  generateGiftCardCode(): Promise<string>;
  generateGiftCardNumber(): Promise<string>;
  generateGiftCardPin(): Promise<{ plainPin: string; hashedPin: string }>;
  sendGiftCardEmail(giftCard: GiftCard, recipientEmail: string): Promise<void>;
  
  // Proxy Accounts operations
  createProxyAccount(accountData: InsertProxyAccount): Promise<ProxyAccount>;
  getProxyAccount(id: number): Promise<ProxyAccount | undefined>;
  getUserProxyAccounts(parentUserId: number): Promise<ProxyAccount[]>;
  updateProxyAccount(id: number, updates: Partial<ProxyAccount>): Promise<ProxyAccount | undefined>;
  deleteProxyAccount(id: number): Promise<boolean>;
  updateProxyAccountStatus(id: number, status: string, notes?: string): Promise<ProxyAccount | undefined>;
  updateProxyAccountKYCStatus(id: number, kycStatus: string, verifiedBy?: number): Promise<ProxyAccount | undefined>;

  // User block operations
  blockUser(blockerId: number, blockedId: number, reason?: string): Promise<boolean>;
  unblockUser(blockerId: number, blockedId: number): Promise<boolean>;
  checkUserBlocked(blockerId: number, blockedId: number): Promise<boolean>;
  getBlockedUsers(userId: number): Promise<User[]>;
  
  // Moderation report operations
  createModerationReport(reportData: { reporterId: number; subjectId: number; subjectType: string; reason: string; description?: string }): Promise<any>;
  getUserModerationReports(userId: number): Promise<any[]>;
  
  // Financial Services operations
  getFinancialServicesByUserId(userId: number): Promise<any[]>;
  createFinancialService(serviceData: any): Promise<any>;
  updateFinancialService(id: number, userId: number, updates: any): Promise<any | undefined>;
  deleteFinancialService(id: number, userId: number): Promise<boolean>;
  
  // Government Services operations
  getGovernmentServicesByUserId(userId: number): Promise<any[]>;
  createGovernmentService(serviceData: any): Promise<any>;
  updateGovernmentService(id: number, userId: number, updates: any): Promise<any | undefined>;
  deleteGovernmentService(id: number, userId: number): Promise<boolean>;
  
  // Ticket operations
  createTicket(ticketData: any): Promise<any>;
  getTicket(id: number): Promise<any | undefined>;
  getTickets(filters?: { status?: string; department?: string; assignedTo?: number; userId?: number; priority?: string }): Promise<any[]>;
  getTicketByNumber(ticketNumber: string): Promise<any | undefined>;
  getTicketsByUser(userId: number): Promise<any[]>;
  getTicketsByEmail(email: string): Promise<any[]>;
  getTicketsByDepartment(department: string): Promise<any[]>;
  updateTicket(id: number, updates: any): Promise<any | undefined>;
  assignTicket(id: number, assignedTo: number): Promise<any | undefined>;
  resolveTicket(id: number, resolvedBy: number): Promise<any | undefined>;
  closeTicket(id: number): Promise<any | undefined>;
  deleteTicket(id: number): Promise<boolean>;
  getTicketStats(): Promise<any>;
  
  // Ticket message operations
  createTicketMessage(messageData: any): Promise<any>;
  getTicketMessages(ticketId: number): Promise<any[]>;
  getTicketMessage(id: number): Promise<any | undefined>;
  
  // Analytics tracking operations
  trackProfileView(data: { profileUserId: number; viewerUserId: number | null; viewerIp: string | null; viewerUserAgent: string | null }): Promise<void>;
  trackPostImpression(data: { postId: number; userId: number | null; impressionType: string; userIp: string | null; userAgent: string | null }): Promise<void>;
  trackSearchAppearance(data: { userId: number; searchQuery: string; searchType: string; position: number | null; searcherUserId: number | null }): Promise<void>;
  getUserAnalyticsStats(userId: number): Promise<{ profileViews: number; postImpressions: number; searchAppearances: number }>;
}

// Optimized Database storage implementation
export class DatabaseStorage implements IStorage {
  // Session store for authentication
  sessionStore: any;
  
  constructor() {
    // Create DEDICATED PostgreSQL pool for session storage with extended timeouts
    // Separate pool prevents session operations from competing with main database queries
    const sessionPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      // Session store specific optimizations
      max: 5,                        // Lower max connections (session store doesn't need many)
      min: 1,                        // Keep 1 connection warm
      idleTimeoutMillis: 30000,      // Close idle connections after 30s (Neon charges for idle time)
      connectionTimeoutMillis: 20000, // EXTENDED timeout for session operations (20s instead of 5s)
      statement_timeout: 30000,      // 30s query timeout (prevents long-running queries)
      query_timeout: 30000,          // 30s query timeout
      maxUses: 7500,                 // Prevent memory leaks
      // Additional reliability settings
      keepAlive: true,
      keepAliveInitialDelayMillis: 10000,
    });
    
    // Production-optimized PostgreSQL session store with enhanced error logging
    // Using 'session_store' table to avoid conflict with 'user_sessions' analytics table
    const PostgresStore = connectPg(session);
    this.sessionStore = new PostgresStore({
      pool: sessionPool,
      tableName: 'session_store',
      createTableIfMissing: true,
      pruneSessionInterval: 6 * 60 * 60, // Prune every 6 hours instead of 1 hour (reduced DB load)
      ttl: 7 * 24 * 60 * 60,            // 7 days session TTL (in seconds)
      errorLog: (...args: any[]) => {
        logger.error('Session store error', { args }, 'server');
      }
    } as any);
    
    // Initialize session table with retry logic (prevents cold start failures)
    this.initializeSessionStoreWithRetry(sessionPool).catch(err => {
      logger.error('[SESSION-STORE] Failed to initialize after retries', undefined, err as Error, 'server');
      // Don't crash the app - session store will retry on first use
    });
    
    // Add graceful shutdown handler for connection cleanup
    const gracefulShutdown = async (signal: string) => {
      logger.lifecycle('Graceful shutdown initiated - closing pools', { signal }, 'server');
      try {
        // Close session pool
        await sessionPool.end();
        logger.debug('[SESSION-STORE] Session pool closed successfully', 'server');
        
        // Close session store
        this.sessionStore.close();
        logger.debug('[SESSION-STORE] Session store closed successfully', 'server');
        
        process.exit(0);
      } catch (error) {
        logger.error('[DATABASE] Error during shutdown', undefined, error as Error, 'server');
        process.exit(1);
      }
    };
    
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    
    // Track startup time to avoid false warnings during initialization
    const startupTime = Date.now();
    const STARTUP_GRACE_PERIOD = 60000; // 60 seconds
    
    // Add periodic health check with performance monitoring
    setInterval(async () => {
      try {
        const start = Date.now();
        await sessionPool.query('SELECT 1');
        const duration = Date.now() - start;
        
        // Log pool statistics for monitoring
        const poolStats = {
          total: sessionPool.totalCount,
          idle: sessionPool.idleCount,
          waiting: sessionPool.waitingCount,
        };
        
        // Log health check with pool statistics
        logger.debug('Periodic health check OK', { durationMs: duration }, 'server');
        
        // Warn if database response is slow (but skip during startup grace period)
        // Higher threshold (5s) to avoid false positives during background tasks
        const isStartupPeriod = (Date.now() - startupTime) < STARTUP_GRACE_PERIOD;
        if (duration > 5000 && !isStartupPeriod) {
          logger.warn('Slow health check detected', { 
            durationMs: duration,
            poolStats,
            note: 'Database may be under heavy load'
          }, 'server');
        }
        
        // Warn if connections are waiting
        if (poolStats.waiting > 0) {
          logger.warn('Connections waiting', { poolStats }, 'server');
        }
      } catch (error) {
        logger.error('[SESSION-POOL] Health check failed', undefined, error as Error, 'server');
      }
    }, 30000); // Every 30 seconds
  }
  
  /**
   * Initialize session store table with retry logic to prevent cold start failures
   * Uses exponential backoff to handle transient connection issues
   */
  private async initializeSessionStoreWithRetry(pool: Pool, maxRetries: number = 3): Promise<void> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        logger.debug('Initializing session table', { attempt, maxRetries }, 'server');
        
        // Create session_store table if it doesn't exist
        await pool.query(`
          CREATE TABLE IF NOT EXISTS session_store (
            sid VARCHAR NOT NULL COLLATE "default",
            sess JSON NOT NULL,
            expire TIMESTAMP(6) NOT NULL,
            CONSTRAINT "session_pkey" PRIMARY KEY ("sid")
          )
        `);
        
        // Create index for expiration cleanup
        await pool.query(`
          CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON session_store ("expire")
        `);
        
        logger.debug('[SESSION-STORE] Session table initialized successfully', 'server');
        return; // Success
        
      } catch (error: any) {
        logger.error('Session store initialization failed', { attempt, message: error.message }, error as Error, 'server');
        
        if (attempt === maxRetries) {
          throw new Error(`Failed to initialize session store after ${maxRetries} attempts: ${error.message}`);
        }
        
        // Exponential backoff: 1s, 2s, 4s
        const delay = Math.pow(2, attempt - 1) * 1000;
        logger.debug('Retrying session store initialization', { delayMs: delay }, 'server');
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  // Message methods - using our message helpers module
  async getMessage(id: number): Promise<Message | undefined> {
    return messageHelpers.getMessage(id);
  }
  
  async getUserMessages(userId: number): Promise<Message[]> {
    return messageHelpers.getUserMessages(userId);
  }
  
  async getMessagesBetweenUsers(userId1: number, userId2: number): Promise<Message[]> {
    return messageHelpers.getConversationMessages(userId1, userId2);
  }

  async getConversationMessages(userId1: number, userId2: number): Promise<Message[]> {
    return messageHelpers.getConversationMessages(userId1, userId2);
  }
  
  async getUserConversations(userId: number): Promise<any[]> {
    return messageHelpers.getUserConversations(userId);
  }
  
  async createMessage(message: InsertMessage): Promise<Message> {
    return messageHelpers.createMessage(message);
  }
  
  async markMessageAsRead(id: number): Promise<Message | undefined> {
    return messageHelpers.markMessageAsRead(id);
  }
  
  async getUnreadMessageCount(userId: number): Promise<number> {
    return messageHelpers.getUnreadMessagesCount(userId);
  }
  

  
  // Call operations implementation
  async createCallSession(callData: any): Promise<any> {
    try {
      const [newCallSession] = await db.insert(callSessions).values(callData).returning();
      return newCallSession;
    } catch (error) {
      logger.error('Error creating call session', undefined, error as Error, 'server');
      throw new Error('Failed to create call session');
    }
  }
  
  async updateCallSession(id: number, updateData: any): Promise<any> {
    try {
      const [updatedCallSession] = await db
        .update(callSessions)
        .set(updateData)
        .where(eq(callSessions.id, id))
        .returning();
      return updatedCallSession;
    } catch (error) {
      logger.error('Error updating call session', undefined, error as Error, 'server');
      throw new Error('Failed to update call session');
    }
  }
  
  async getUserCallHistory(userId: number, limit: number = 20): Promise<any[]> {
    try {
      const calls = await db
        .select()
        .from(callSessions)
        .where(
          or(
            eq(callSessions.initiatorId, userId),
            eq(callSessions.receiverId, userId)
          )
        )
        .orderBy(desc(callSessions.startedAt))
        .limit(limit);
        
      // Fetch user details for each call
      const callsWithUsers = await Promise.all(calls.map(async (call) => {
        const otherUserId = call.initiatorId === userId ? call.receiverId : call.initiatorId;
        const otherUser = await this.getUser(otherUserId);
        
        return {
          ...call,
          otherUser: otherUser ? {
            id: otherUser.id,
            username: otherUser.username,
            name: otherUser.name,
            avatar: otherUser.avatar
          } : null,
          isOutgoing: call.initiatorId === userId
        };
      }));
      
      return callsWithUsers;
    } catch (error) {
      logger.error('Error getting user call history', undefined, error as Error, 'server');
      return [];
    }
  }
  
  async getUserCallStats(userId: number): Promise<any> {
    try {
      // Get total calls
      const [totalResult] = await db
        .select({ count: count() })
        .from(callSessions)
        .where(
          or(
            eq(callSessions.initiatorId, userId),
            eq(callSessions.receiverId, userId)
          )
        );
      
      // Get total duration
      const [durationResult] = await db
        .select({ totalDuration: sql`SUM(${callSessions.duration})` })
        .from(callSessions)
        .where(
          and(
            or(
              eq(callSessions.initiatorId, userId),
              eq(callSessions.receiverId, userId)
            ),
            eq(callSessions.status, 'ended')
          )
        );
      
      // Get outgoing calls
      const [outgoingResult] = await db
        .select({ count: count() })
        .from(callSessions)
        .where(eq(callSessions.initiatorId, userId));
      
      // Get incoming calls
      const [incomingResult] = await db
        .select({ count: count() })
        .from(callSessions)
        .where(eq(callSessions.receiverId, userId));
      
      // Get missed calls
      const [missedResult] = await db
        .select({ count: count() })
        .from(callSessions)
        .where(
          and(
            eq(callSessions.receiverId, userId),
            eq(callSessions.status, 'missed')
          )
        );
      
      // Get video calls
      const [videoResult] = await db
        .select({ count: count() })
        .from(callSessions)
        .where(
          and(
            or(
              eq(callSessions.initiatorId, userId),
              eq(callSessions.receiverId, userId)
            ),
            eq(callSessions.callType, 'video')
          )
        );
      
      // Get audio calls
      const [audioResult] = await db
        .select({ count: count() })
        .from(callSessions)
        .where(
          and(
            or(
              eq(callSessions.initiatorId, userId),
              eq(callSessions.receiverId, userId)
            ),
            eq(callSessions.callType, 'audio')
          )
        );
      
      return {
        totalCalls: totalResult.count || 0,
        totalDuration: durationResult.totalDuration || 0,
        outgoingCalls: outgoingResult.count || 0,
        incomingCalls: incomingResult.count || 0,
        missedCalls: missedResult.count || 0,
        videoCalls: videoResult.count || 0,
        audioCalls: audioResult.count || 0
      };
    } catch (error) {
      logger.error('Error getting user call stats', undefined, error as Error, 'server');
      return {
        totalCalls: 0,
        totalDuration: 0,
        outgoingCalls: 0,
        incomingCalls: 0,
        missedCalls: 0,
        videoCalls: 0,
        audioCalls: 0
      };
    }
  }
  
  // Notification operations
  async createNotification(notificationData: InsertNotification): Promise<Notification> {
    try {
      const [newNotification] = await db.insert(notifications).values(notificationData).returning();
      return newNotification;
    } catch (error) {
      logger.error('Error creating notification', undefined, error as Error, 'server');
      throw new Error('Failed to create notification');
    }
  }
  
  async getNotifications(userId: number, limit: number = 20): Promise<Notification[]> {
    try {
      const result = await db.execute(
        sql`SELECT 
              n.id, 
              n.user_id, 
              n.type, 
              n.title, 
              n.content, 
              n.is_read, 
              n.source_id, 
              n.source_type, 
              n.actor_id, 
              n.created_at,
              u.username as actor_username,
              u.name as actor_name,
              u.avatar as actor_avatar
            FROM notifications n
            LEFT JOIN users u ON n.actor_id = u.id
            WHERE n.user_id = ${userId} 
            ORDER BY n.created_at DESC 
            LIMIT ${limit}`
      );
      
      return result.rows.map(row => ({
        id: row.id as number,
        userId: row.user_id as number,
        type: row.type as any,
        title: row.title as string,
        content: row.content as string,
        isRead: row.is_read as boolean,
        read: row.is_read as boolean,
        sourceId: row.source_id as number,
        sourceType: row.source_type as string,
        actorId: row.actor_id as number,
        createdAt: row.created_at as Date,
        actor: row.actor_id ? {
          username: row.actor_username as string,
          name: row.actor_name as string,
          avatar: row.actor_avatar as string | null
        } : undefined
      } as any));
    } catch (error) {
      logger.error('Error getting notifications', undefined, error as Error, 'server');
      return [];
    }
  }
  
  async getUnreadNotificationCount(userId: number): Promise<number> {
    try {
      const [result] = await db
        .select({ count: count() })
        .from(notifications)
        .where(
          and(
            eq(notifications.userId, userId),
            eq(notifications.isRead, false)
          )
        );
      
      return result?.count || 0;
    } catch (error) {
      logger.error('Error getting unread notification count', undefined, error as Error, 'server');
      return 0;
    }
  }

  async getUnreadNotificationCountByType(userId: number, notificationType: string): Promise<number> {
    try {
      const [result] = await db
        .select({ count: count() })
        .from(notifications)
        .where(
          and(
            eq(notifications.userId, userId),
            eq(notifications.isRead, false),
            eq(notifications.type, notificationType as any)
          )
        );
      
      return result?.count || 0;
    } catch (error) {
      logger.error('Error getting unread notification count by type', undefined, error as Error, 'server');
      return 0;
    }
  }
  
  async markNotificationAsRead(id: number): Promise<Notification | undefined> {
    try {
      const [updatedNotification] = await db
        .update(notifications)
        .set({ isRead: true })
        .where(eq(notifications.id, id))
        .returning();
        
      return updatedNotification;
    } catch (error) {
      logger.error('Error marking notification as read', undefined, error as Error, 'server');
      return undefined;
    }
  }
  
  async markAllNotificationsAsRead(userId: number): Promise<boolean> {
    try {
      await db
        .update(notifications)
        .set({ isRead: true })
        .where(
          and(
            eq(notifications.userId, userId),
            eq(notifications.isRead, false)
          )
        );
        
      return true;
    } catch (error) {
      logger.error('Error marking all notifications as read', undefined, error as Error, 'server');
      return false;
    }
  }
  
  async getCalendarNotificationCount(userId: number): Promise<number> {
    try {
      const now = new Date();
      const futureWindow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days ahead
      
      const [result] = await db
        .select({ count: count() })
        .from(calendarEventReminders)
        .where(
          and(
            eq(calendarEventReminders.userId, userId),
            eq(calendarEventReminders.isSent, false),
            gte(calendarEventReminders.reminderTime, now),
            lte(calendarEventReminders.reminderTime, futureWindow)
          )
        );
      
      return result?.count || 0;
    } catch (error: any) {
      // Gracefully handle database errors without breaking the application
      // Check for missing table (calendar feature not yet initialized)
      if (error?.message?.includes('calendar_event_reminders') && error?.message?.includes('does not exist')) {
        return 0;
      }
      
      // Check for other common database errors
      if (error?.code === '42P01' || error?.message?.includes('does not exist')) {
        // Table or relation doesn't exist - return 0 silently
        return 0;
      }
      
      // Log unexpected errors only
      logger.error('Error getting calendar notification count', undefined, error as Error, 'server');
      return 0;
    }
  }
  
  // Notification Settings operations
  async getNotificationSettings(userId: number): Promise<NotificationSettings[]> {
    try {
      const settings = await db
        .select()
        .from(notificationSettings)
        .where(eq(notificationSettings.userId, userId));
        
      return settings;
    } catch (error) {
      logger.error('Error getting notification settings', undefined, error as Error, 'server');
      return [];
    }
  }
  
  async updateNotificationSetting(
    userId: number, 
    type: string, 
    channel: string, 
    enabled: boolean
  ): Promise<NotificationSettings | undefined> {
    try {
      // Check if setting already exists
      const [existingSetting] = await db
        .select()
        .from(notificationSettings)
        .where(
          and(
            eq(notificationSettings.userId, userId),
            eq(notificationSettings.type, type as any),
            eq(notificationSettings.channel, channel as any)
          )
        );
      
      if (existingSetting) {
        // Update existing setting
        const [updated] = await db
          .update(notificationSettings)
          .set({ 
            enabled,
            updatedAt: new Date()
          })
          .where(eq(notificationSettings.id, existingSetting.id))
          .returning();
          
        return updated;
      } else {
        // Create new setting
        const [newSetting] = await db
          .insert(notificationSettings)
          .values({
            userId,
            type: type as any,
            channel: channel as any,
            enabled
          })
          .returning();
          
        return newSetting;
      }
    } catch (error) {
      logger.error('Error updating notification setting', undefined, error as Error, 'server');
      return undefined;
    }
  }
  
  async updateMessageContent(id: number, newContent: string): Promise<Message | undefined> {
    return messageHelpers.updateMessageContent(id, newContent);
  }
  
  async searchUserMessages(userId: number, query: string): Promise<any[]> {
    return messageHelpers.searchUserMessages(userId, query);
  }
  
  async clearConversation(userId1: number, userId2: number): Promise<boolean> {
    return messageHelpers.clearConversation(userId1, userId2);
  }
  
  async getUserMessagingStats(userId: number): Promise<any> {
    return messageHelpers.getUserMessagingStats(userId);
  }
  
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    // Trim whitespace and use SQL LOWER function for case-insensitive username lookup
    // This prevents login failures from trailing spaces (e.g., "admin " vs "admin")
    const trimmedUsername = username.trim();
    try {
      const [user] = await db.select().from(users).where(sql`LOWER(${users.username}) = LOWER(${trimmedUsername})`);
      logger.debug(`getUserByUsername for '${trimmedUsername}': ${user ? 'Found user' : 'User not found'}`, 'server');
      return user;
    } catch (error) {
      logger.error(`getUserByUsername error for '${trimmedUsername}':`, undefined, error as Error, 'server');
      return undefined;
    }
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    // Trim whitespace and use SQL LOWER function for case-insensitive email lookup
    const trimmedEmail = email.trim();
    try {
      const [user] = await db.select().from(users).where(sql`LOWER(${users.email}) = LOWER(${trimmedEmail})`);
      logger.debug(`getUserByEmail for '${trimmedEmail}': ${user ? 'Found user' : 'User not found'}`, 'server');
      return user;
    } catch (error) {
      logger.error(`getUserByEmail error for '${trimmedEmail}':`, undefined, error as Error, 'server');
      return undefined;
    }
  }

  async getUserByVerificationToken(token: string): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(users).where(eq(users.verificationToken, token));
      logger.debug(`getUserByVerificationToken: ${user ? 'Found user' : 'Token not found'}`, 'server');
      return user;
    } catch (error) {
      logger.error(`getUserByVerificationToken error:`, undefined, error as Error, 'server');
      return undefined;
    }
  }

  async getUserByResetToken(token: string): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(users).where(eq(users.passwordResetToken, token));
      logger.debug(`getUserByResetToken: ${user ? 'Found user' : 'Token not found'}`, 'server');
      return user;
    } catch (error) {
      logger.error(`getUserByResetToken error:`, undefined, error as Error, 'server');
      return undefined;
    }
  }
  
  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }
  
  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    try {
      const updateData: any = { ...userData, updatedAt: new Date() };

      if (userData.username) {
        const currentUser = await this.getUser(id);
        if (currentUser && currentUser.username !== userData.username) {
          const daysSinceLastChange = currentUser.lastUsernameChange
            ? Math.floor((Date.now() - new Date(currentUser.lastUsernameChange).getTime()) / (1000 * 60 * 60 * 24))
            : Infinity;

          if (daysSinceLastChange >= 14) {
            updateData.usernameChangeCount = 1;
            updateData.lastUsernameChange = new Date();
          } else {
            updateData.usernameChangeCount = (currentUser.usernameChangeCount || 0) + 1;
            updateData.lastUsernameChange = new Date();
          }
        }
      }

      if ('firstName' in userData && 'surname' in userData && userData.firstName && userData.surname) {
        updateData.name = `${userData.firstName} ${userData.surname}`;
      }

      const enumFields = ['idDocumentType'];
      for (const field of enumFields) {
        if (field in updateData && updateData[field] === '') {
          updateData[field] = null;
        }
      }

      const dateFields = ['dateOfBirth', 'idDocumentExpiryDate', 'passwordResetExpires'];
      for (const field of dateFields) {
        if (field in updateData && updateData[field] === '') {
          updateData[field] = null;
        }
      }

      const [updatedUser] = await db
        .update(users)
        .set(updateData)
        .where(eq(users.id, id))
        .returning();
      return updatedUser;
    } catch (error) {
      logger.error('Error updating user', undefined, error as Error, 'server');
      return undefined;
    }
  }
  
  async listUsers(): Promise<User[]> {
    return await db.select().from(users);
  }
  
  async searchUsers(query: string, limit: number = 10): Promise<User[]> {
    let searchUsers;
    
    if (!query || query.trim().length === 0) {
      // If no query, return recent users excluding current user
      searchUsers = await db.select()
        .from(users)
        .orderBy(desc(users.updatedAt))
        .limit(limit);
    } else {
      // Search with query
      searchUsers = await db.select()
        .from(users)
        .where(
          or(
            // Search in username
            sql`LOWER(${users.username}) LIKE ${`%${query.toLowerCase()}%`}`,
            // Search in name
            sql`LOWER(${users.name}) LIKE ${`%${query.toLowerCase()}%`}`
          )
        )
        .limit(limit);
    }
    
    // Remove sensitive information before returning
    return searchUsers.map(user => {
      const { password, ...userData } = user;
      return userData as User;
    });
  }

  async getUsersForMessaging(currentUserId: number): Promise<Array<{id: number, username: string, name: string, avatar: string | null}>> {
    try {
      const usersForMessaging = await db
        .select({
          id: users.id,
          username: users.username,
          name: users.name,
          avatar: users.avatar
        })
        .from(users)
        .where(
          and(
            // Exclude current user
            sql`${users.id} != ${currentUserId}`,
            // Only include active users (not necessarily filtering by role for now)
            or(
              eq(users.role, 'user'),
              eq(users.role, 'vendor'),
              eq(users.role, 'business')
            )
          )
        )
        .orderBy(users.name)
        .limit(50);
      
      return usersForMessaging;
    } catch (error) {
      logger.error('Error getting users for messaging', undefined, error as Error, 'server');
      return [];
    }
  }
  
  // Category methods
  async getCategoryByName(name: string): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.name, name));
    return category;
  }
  
  async createCategory(category: InsertCategory): Promise<Category> {
    const [newCategory] = await db.insert(categories).values(category).returning();
    return newCategory;
  }
  
  async listCategories(): Promise<Category[]> {
    return await db.select().from(categories);
  }
  
  // Vendor Sub-Account methods
  async getVendorByUserId(userId: number): Promise<Vendor | undefined> {
    // Legacy method - returns first vendor account found
    const [vendor] = await db.select().from(vendors).where(eq(vendors.userId, userId));
    return vendor;
  }

  async getVendorByUserIdAndType(userId: number, vendorType: 'private' | 'business'): Promise<Vendor | undefined> {
    const [vendor] = await db.select().from(vendors).where(
      and(eq(vendors.userId, userId), eq(vendors.vendorType, vendorType))
    );
    return vendor;
  }

  async getUserVendorAccounts(userId: number): Promise<Vendor[]> {
    return await db.select().from(vendors).where(eq(vendors.userId, userId));
  }

  async checkVendorAccountExists(userId: number, vendorType: 'private' | 'business'): Promise<boolean> {
    const vendor = await this.getVendorByUserIdAndType(userId, vendorType);
    return !!vendor;
  }

  async updateVendorStatus(id: number, isActive: boolean): Promise<Vendor | undefined> {
    try {
      const [updatedVendor] = await db
        .update(vendors)
        .set({
          isActive,
          updatedAt: new Date()
        })
        .where(eq(vendors.id, id))
        .returning();
      return updatedVendor;
    } catch (error) {
      logger.error('Error updating vendor status', undefined, error as Error, 'server');
      return undefined;
    }
  }
  
  async getVendors(limit: number = 50): Promise<Vendor[]> {
    try {
      // Get vendors with associated user information
      const vendorsList = await db
        .select({
          vendor: vendors,
          user: users
        })
        .from(vendors)
        .innerJoin(users, eq(vendors.userId, users.id))
        .limit(limit);
      
      // Format the result for client consumption, removing sensitive information
      return vendorsList.map(item => {
        const { password, ...safeUserData } = item.user;
        return {
          ...item.vendor,
          user: safeUserData
        } as Vendor;
      });
    } catch (error) {
      logger.error('Error fetching vendors', undefined, error as Error, 'server');
      return [];
    }
  }
  
  async createVendor(vendor: InsertVendor): Promise<Vendor> {
    const [newVendor] = await db.insert(vendors).values(vendor).returning();
    return newVendor;
  }

  async getVendor(id: number): Promise<Vendor | undefined> {
    try {
      const [vendor] = await db
        .select({
          vendor: vendors,
          user: users
        })
        .from(vendors)
        .innerJoin(users, eq(vendors.userId, users.id))
        .where(eq(vendors.id, id));
      
      if (!vendor) {
        return undefined;
      }
      
      const { password, ...safeUserData } = vendor.user;
      return {
        ...vendor.vendor,
        user: safeUserData
      } as Vendor;
    } catch (error) {
      logger.error('Error fetching vendor', undefined, error as Error, 'server');
      return undefined;
    }
  }
  
  // Cart operations
  async countCartItems(userId: number): Promise<number> {
    try {
      const [result] = await db
        .select({ count: count() })
        .from(carts)
        .where(eq(carts.userId, userId));
      
      return result?.count || 0;
    } catch (error) {
      logger.error('Error counting cart items', undefined, error as Error, 'server');
      return 0;
    }
  }
  
  async addToCart(cartItem: InsertCart): Promise<Cart> {
    try {
      // Check if product exists
      const [product] = await db
        .select()
        .from(products)
        .where(eq(products.id, cartItem.productId));
      
      if (!product) {
        throw new Error('Product not found');
      }
      
      // Check if item already exists in cart
      const [existingCartItem] = await db
        .select()
        .from(carts)
        .where(
          and(
            eq(carts.userId, cartItem.userId),
            eq(carts.productId, cartItem.productId)
          )
        );
      
      if (existingCartItem) {
        // Update quantity instead of creating a new item
        const newQuantity = existingCartItem.quantity + (cartItem.quantity || 1);
        const [updatedCartItem] = await db
          .update(carts)
          .set({ 
            quantity: newQuantity
          })
          .where(eq(carts.id, existingCartItem.id))
          .returning();
        
        return updatedCartItem;
      }
      
      // Create new cart item with default quantity if not provided
      const cartItemWithDefaults = {
        ...cartItem,
        quantity: cartItem.quantity || 1
      };
      
      const [newCartItem] = await db
        .insert(carts)
        .values(cartItemWithDefaults)
        .returning();
      
      return newCartItem;
    } catch (error) {
      logger.error('Error adding to cart', undefined, error as Error, 'server');
      throw new Error('Failed to add to cart');
    }
  }
  
  async listCartItems(userId: number): Promise<(Cart & { product: Product })[]> {
    try {
      const cartItemsWithProducts = await db
        .select({
          cart: carts,
          product: products
        })
        .from(carts)
        .innerJoin(products, eq(carts.productId, products.id))
        .where(eq(carts.userId, userId))
        .orderBy(desc(carts.createdAt));
      
      return cartItemsWithProducts.map(({ cart, product }) => ({
        ...cart,
        product
      }));
    } catch (error) {
      logger.error('Error listing cart items', undefined, error as Error, 'server');
      return [];
    }
  }
  
  async getCartItem(id: number): Promise<(Cart & { product: Product }) | undefined> {
    try {
      const [item] = await db
        .select({
          cart: carts,
          product: products
        })
        .from(carts)
        .innerJoin(products, eq(carts.productId, products.id))
        .where(eq(carts.id, id));
      
      if (!item) {
        return undefined;
      }
      
      return {
        ...item.cart,
        product: item.product
      };
    } catch (error) {
      logger.error('Error getting cart item', undefined, error as Error, 'server');
      return undefined;
    }
  }
  
  async updateCartItem(id: number, update: Partial<Cart>): Promise<(Cart & { product: Product }) | undefined> {
    try {
      const [updatedItem] = await db
        .update(carts)
        .set(update)
        .where(eq(carts.id, id))
        .returning();
      
      if (!updatedItem) {
        return undefined;
      }
      
      // Get the product details
      const [product] = await db
        .select()
        .from(products)
        .where(eq(products.id, updatedItem.productId));
      
      return {
        ...updatedItem,
        product
      };
    } catch (error) {
      logger.error('Error updating cart item', undefined, error as Error, 'server');
      return undefined;
    }
  }
  
  async removeCartItem(id: number): Promise<boolean> {
    try {
      await db
        .delete(carts)
        .where(eq(carts.id, id));
      
      return true;
    } catch (error) {
      logger.error('Error removing cart item', undefined, error as Error, 'server');
      return false;
    }
  }
  
  // User connection methods
  async connectUsers(userId1: number, userId2: number): Promise<boolean> {
    try {
      // Check if connection already exists
      const [existingConnection] = await db
        .select()
        .from(connections)
        .where(
          and(
            eq(connections.userId, userId1),
            eq(connections.connectedUserId, userId2)
          )
        );
      
      if (existingConnection) {
        // If connection exists but status is not 'connected', update it
        if (existingConnection.status !== 'connected') {
          await db
            .update(connections)
            .set({ 
              status: 'connected',
              updatedAt: new Date()
            })
            .where(eq(connections.id, existingConnection.id));
        }
        return true;
      }
      
      // Create a new connection
      await db.insert(connections).values({
        userId: userId1,
        connectedUserId: userId2,
        status: 'connected',
        initiatedBy: userId1
      });
      
      return true;
    } catch (error) {
      logger.error('Error connecting users', undefined, error as Error, 'server');
      return false;
    }
  }
  
  // User follow methods
  async followUser(followerId: number, followingId: number): Promise<boolean> {
    try {
      // Check if follow already exists
      const isAlreadyFollowing = await this.checkIfUserFollows(followerId, followingId);
      if (isAlreadyFollowing) {
        return true;
      }
      
      // Create a new follow relationship
      await db
        .insert(follows)
        .values({
          followerId,
          followingId, // Schema uses followingId
          createdAt: new Date()
        });
      
      // Create notification for the followed user
      await this.createNotification({
        userId: followingId,
        type: 'follow',
        content: 'started following you',
        actorId: followerId,
        isRead: false
      });
      
      return true;
    } catch (error) {
      logger.error('Error following user', undefined, error as Error, 'server');
      return false;
    }
  }
  
  async unfollowUser(followerId: number, followingId: number): Promise<boolean> {
    try {
      // Delete the follow relationship
      await db
        .delete(follows)
        .where(
          and(
            eq(follows.followerId, followerId),
            eq(follows.followingId, followingId)
          )
        );
      
      return true;
    } catch (error) {
      logger.error('Error unfollowing user', undefined, error as Error, 'server');
      return false;
    }
  }
  
  async checkIfUserFollows(followerId: number, followingId: number): Promise<boolean> {
    try {
      const [follow] = await db
        .select()
        .from(follows)
        .where(
          and(
            eq(follows.followerId, followerId),
            eq(follows.followingId, followingId)
          )
        );
      
      return !!follow;
    } catch (error) {
      logger.error('Error checking follow status', undefined, error as Error, 'server');
      return false;
    }
  }
  
  // User stats methods
  async getUserPostCount(userId: number): Promise<number> {
    try {
      const [result] = await db
        .select({ count: count() })
        .from(posts)
        .where(eq(posts.userId, userId));
      
      return result?.count || 0;
    } catch (error) {
      logger.error('Error getting user post count', undefined, error as Error, 'server');
      return 0;
    }
  }
  
  async getFollowersCount(userId: number): Promise<number> {
    try {
      const [result] = await db
        .select({ count: count() })
        .from(follows)
        .where(eq(follows.followingId, userId));
      
      return result?.count || 0;
    } catch (error) {
      logger.error('Error getting followers count', undefined, error as Error, 'server');
      return 0;
    }
  }
  
  async getFollowingCount(userId: number): Promise<number> {
    try {
      const [result] = await db
        .select({ count: count() })
        .from(follows)
        .where(eq(follows.followerId, userId));
      
      return result?.count || 0;
    } catch (error) {
      logger.error('Error getting following count', undefined, error as Error, 'server');
      return 0;
    }
  }
  
  async getUserPosts(userId: number, limit: number = 10, offset: number = 0): Promise<Post[]> {
    try {
      const userPosts = await db
        .select()
        .from(posts)
        .where(
          and(
            eq(posts.userId, userId),
            eq(posts.publishStatus, 'published') // Only show published posts in public profile
          )
        )
        .orderBy(desc(posts.createdAt))
        .limit(limit)
        .offset(offset);
      
      return userPosts;
    } catch (error) {
      logger.error('Error getting user posts', undefined, error as Error, 'server');
      return [];
    }
  }
  
  async getUserDraftPosts(userId: number, limit: number = 20, offset: number = 0): Promise<Post[]> {
    try {
      const draftPosts = await db
        .select()
        .from(posts)
        .where(and(
          eq(posts.userId, userId),
          eq(posts.publishStatus, 'draft')
        ))
        .orderBy(desc(posts.createdAt))
        .limit(limit)
        .offset(offset);
      
      return draftPosts;
    } catch (error) {
      logger.error('Error getting user draft posts', undefined, error as Error, 'server');
      return [];
    }
  }
  
  async getFollowers(userId: number, limit: number = 10, offset: number = 0): Promise<User[]> {
    try {
      const followers = await db
        .select({ 
          user: users
        })
        .from(follows)
        .innerJoin(users, eq(follows.followerId, users.id))
        .where(eq(follows.followingId, userId))
        .orderBy(desc(follows.createdAt))
        .limit(limit)
        .offset(offset);
      
      return followers.map(f => {
        const { password, ...userData } = f.user;
        return userData as User;
      });
    } catch (error) {
      logger.error('Error getting followers', undefined, error as Error, 'server');
      return [];
    }
  }
  
  async getFollowing(userId: number, limit: number = 10, offset: number = 0): Promise<User[]> {
    try {
      const following = await db
        .select({ 
          user: users
        })
        .from(follows)
        .innerJoin(users, eq(follows.followingId, users.id))
        .where(eq(follows.followerId, userId))
        .orderBy(desc(follows.createdAt))
        .limit(limit)
        .offset(offset);
      
      return following.map(f => {
        const { password, ...userData } = f.user;
        return userData as User;
      });
    } catch (error) {
      logger.error('Error getting following users', undefined, error as Error, 'server');
      return [];
    }
  }
  
  async getUserStats(userId: number): Promise<{ postCount: number, followerCount: number, followingCount: number }> {
    try {
      // Get post count
      const postCount = await this.getUserPostCount(userId);
      
      // Get followers count
      const followerCount = await this.getFollowersCount(userId);
      
      // Get following count
      const followingCount = await this.getFollowingCount(userId);
      
      return {
        postCount,
        followerCount,
        followingCount
      };
    } catch (error) {
      logger.error('Error getting user stats', undefined, error as Error, 'server');
      return {
        postCount: 0,
        followerCount: 0,
        followingCount: 0
      };
    }
  }

  async disconnectUsers(userId1: number, userId2: number): Promise<boolean> {
    try {
      // Delete the connection
      await db
        .delete(connections)
        .where(
          and(
            eq(connections.userId, userId1),
            eq(connections.connectedUserId, userId2)
          )
        );
      
      // Also delete the connection in the opposite direction if it exists
      await db
        .delete(connections)
        .where(
          and(
            eq(connections.userId, userId2),
            eq(connections.connectedUserId, userId1)
          )
        );
      
      return true;
    } catch (error) {
      logger.error('Error disconnecting users', undefined, error as Error, 'server');
      return false;
    }
  }

  async checkConnection(userId1: number, userId2: number): Promise<boolean> {
    try {
      // Check if connection exists in either direction
      const [connection] = await db
        .select()
        .from(connections)
        .where(
          or(
            and(
              eq(connections.userId, userId1),
              eq(connections.connectedUserId, userId2),
              eq(connections.status, 'connected')
            ),
            and(
              eq(connections.userId, userId2),
              eq(connections.connectedUserId, userId1),
              eq(connections.status, 'connected')
            )
          )
        );
      
      return !!connection;
    } catch (error) {
      logger.error('Error checking connection', undefined, error as Error, 'server');
      return false;
    }
  }
  
  // Subscription methods
  async getUserSubscription(userId: number): Promise<any | null> {
    try {
      // Get only fields that exist in the database schema
      const [subscription] = await db
        .select({
          id: subscriptions.id,
          userId: subscriptions.userId,
          creatorId: subscriptions.creatorId,
          planName: subscriptions.planName,
          amount: subscriptions.amount,
          currency: subscriptions.currency,
          interval: subscriptions.interval,
          status: subscriptions.status,
          currentPeriodStart: subscriptions.currentPeriodStart,
          currentPeriodEnd: subscriptions.currentPeriodEnd,
          expiresAt: subscriptions.expiresAt,
          cancelAtPeriodEnd: subscriptions.cancelAtPeriodEnd,
          tier: subscriptions.tier,
          stripeCustomerId: subscriptions.stripeCustomerId,
          stripeSubscriptionId: subscriptions.stripeSubscriptionId,
          paypalSubscriptionId: subscriptions.paypalSubscriptionId,
          createdAt: subscriptions.createdAt,
          updatedAt: subscriptions.updatedAt
        })
        .from(subscriptions)
        .where(eq(subscriptions.userId, userId));
      
      return subscription || null;
    } catch (error) {
      logger.error('Error getting user subscription', undefined, error as Error, 'server');
      return null;
    }
  }
  
  async createOrUpdateSubscription(subscriptionData: any): Promise<any> {
    try {
      // Make sure to rename "plan" to "planName" if it exists
      if (subscriptionData.plan && !subscriptionData.planName) {
        subscriptionData.planName = subscriptionData.plan;
        delete subscriptionData.plan; // Remove the plan field since it doesn't exist in the database
      }
      
      // Check if subscription exists
      const [existingSubscription] = await db
        .select({
          id: subscriptions.id,
          userId: subscriptions.userId
        })
        .from(subscriptions)
        .where(eq(subscriptions.userId, subscriptionData.userId));
      
      if (existingSubscription) {
        // Update existing subscription
        const [updatedSubscription] = await db
          .update(subscriptions)
          .set({
            ...subscriptionData,
            updatedAt: new Date()
          })
          .where(eq(subscriptions.id, existingSubscription.id))
          .returning();
        
        return updatedSubscription;
      } else {
        // Create new subscription
        const [newSubscription] = await db
          .insert(subscriptions)
          .values({
            ...subscriptionData,
            createdAt: new Date(),
            updatedAt: new Date()
          })
          .returning();
        
        return newSubscription;
      }
    } catch (error) {
      logger.error('Error creating/updating subscription', undefined, error as Error, 'server');
      throw new Error('Failed to create or update subscription');
    }
  }
  
  // Product methods
  async listProducts(): Promise<Product[]> {
    return await db.select().from(products);
  }
  
  async createProduct(product: InsertProduct): Promise<Product> {
    // Generate unique product code if the product is being published
    const productData = { ...product };
    
    // Check if the product is being published (status is 'active' and published on any channel)
    const isPublished = productData.status === 'active' && 
                       (productData.publishedOnOnlineStore || productData.publishedOnPointOfSale || productData.publishedOnShop);
    
    if (isPublished && !productData.productCode) {
      // Get vendor to extract user ID
      const vendor = await this.getVendor(productData.vendorId);
      if (vendor) {
        productData.productCode = await generateProductCode(vendor.userId, productData.vendorId);
      }
    }
    
    const [newProduct] = await db.insert(products).values(productData).returning();
    return newProduct;
  }
  
  async getProduct(id: number): Promise<Product | undefined> {
    try {
      const [product] = await db
        .select()
        .from(products)
        .where(eq(products.id, id))
        .limit(1);
      return product;
    } catch (error) {
      logger.error('Error fetching product', undefined, error as Error, 'server');
      return undefined;
    }
  }

  async getProductBySlug(slug: string): Promise<Product | undefined> {
    try {
      const [product] = await db
        .select()
        .from(products)
        .where(eq(products.slug, slug))
        .limit(1);
      return product;
    } catch (error) {
      logger.error('Error fetching product by slug', undefined, error as Error, 'server');
      return undefined;
    }
  }
  
  async updateProduct(id: number, updates: Partial<InsertProduct>): Promise<Product | undefined> {
    try {
      // Get the current product and vendor info
      const currentProduct = await this.getProduct(id);
      if (!currentProduct) {
        return undefined;
      }

      const updateData = { ...updates };
      
      // Check if the product is being published and doesn't have a product code
      const isBeingPublished = updateData.status === 'active' && 
                              (updateData.publishedOnOnlineStore || updateData.publishedOnPointOfSale || updateData.publishedOnShop);
      
      if (isBeingPublished && !currentProduct.productCode && !updateData.productCode) {
        // Get vendor to extract user ID
        const vendor = await this.getVendor(currentProduct.vendorId);
        if (vendor) {
          updateData.productCode = await generateProductCode(vendor.userId, currentProduct.vendorId);
        }
      }

      const [updatedProduct] = await db
        .update(products)
        .set(updateData)
        .where(eq(products.id, id))
        .returning();
      
      return updatedProduct;
    } catch (error) {
      logger.error('Error updating product', undefined, error as Error, 'server');
      return undefined;
    }
  }

  async deleteProduct(id: number): Promise<boolean> {
    try {
      // First delete all foreign key references to avoid constraint violations
      await db.delete(likedProducts).where(eq(likedProducts.productId, id));
      await db.delete(posts).where(eq(posts.productId, id));
      await db.delete(carts).where(eq(carts.productId, id));
      await db.delete(reviews).where(eq(reviews.productId, id));
      
      // Delete from gift_propositions if any exist
      try {
        await db.delete(giftPropositions).where(eq(giftPropositions.productId, id));
      } catch (error: any) {
        // Ignore if gift_propositions table doesn't exist or other issues
        logger.debug('Could not delete from gift_propositions', { error: error?.message || 'Unknown error' }, 'server');
      }
      
      // Now delete the product itself
      const result = await db.delete(products).where(eq(products.id, id));
      logger.debug(`Product ${id} deletion completed successfully`, 'server');
      return true;
    } catch (error) {
      logger.error('Error deleting product', undefined, error as Error, 'server');
      throw error; // Re-throw to let the API handle it properly
    }
  }

  // Post operations
  async getPost(id: number): Promise<Post | undefined> {
    try {
      // First get the post
      const [post] = await db.select().from(posts).where(eq(posts.id, id));
      
      if (!post) {
        return undefined;
      }
      
      // Then get the user
      const [user] = await db
        .select({
          id: users.id,
          username: users.username,
          name: users.name,
          avatar: users.avatar
        })
        .from(users)
        .where(eq(users.id, post.userId));
      
      // Get comment count
      const [commentCount] = await db
        .select({ count: count() })
        .from(comments)
        .where(eq(comments.postId, id));
      
      // Get like count
      const [likeCount] = await db
        .select({ count: count() })
        .from(likes)
        .where(eq(likes.postId, id));
      
      // Create a return object with the necessary fields
      const postData = {
        ...post,
        comments: commentCount.count || 0,
        likes: likeCount.count || 0
      };
      
      // Add user data as a separate property (returned as JSON to frontend)
      // @ts-ignore - user property will be handled by frontend types
      postData.user = user;
      
      return postData;
    } catch (error) {
      logger.error('Error getting post', undefined, error as Error, 'server');
      return undefined;
    }
  }
  
  async incrementPostView(id: number): Promise<boolean> {
    try {
      // Get current post
      const [post] = await db
        .select()
        .from(posts)
        .where(eq(posts.id, id));
      
      if (!post) {
        return false;
      }
      
      // Increment views
      const currentViews = post.views || 0;
      
      await db
        .update(posts)
        .set({ views: currentViews + 1 })
        .where(eq(posts.id, id));
      
      return true;
    } catch (error) {
      logger.error('Error incrementing post view', undefined, error as Error, 'server');
      return false;
    }
  }
  
  async createPost(post: InsertPost): Promise<Post> {
    try {
      logger.debug('Creating post with data', { post }, 'server');
      const [newPost] = await db.insert(posts).values(post).returning();
      return newPost;
    } catch (error) {
      logger.error('Error creating post', undefined, error as Error, 'server');
      throw new Error('Failed to create post');
    }
  }

  // Get individual post by ID with user details
  async getPostById(postId: number): Promise<any> {
    try {
      const [post] = await db
        .select({
          id: posts.id,
          userId: posts.userId,
          content: posts.content,
          title: posts.title,
          contentType: posts.contentType,
          imageUrl: posts.imageUrl,
          videoUrl: posts.videoUrl,
          productId: posts.productId,
          eventId: posts.eventId,
          likes: posts.likes,
          comments: posts.comments,
          shares: posts.shares,
          views: posts.views,
          tags: posts.tags,
          isPromoted: posts.isPromoted,
          promotionEndDate: posts.promotionEndDate,
          isPublished: posts.isPublished,
          publishStatus: posts.publishStatus,
          publishAt: posts.publishAt,
          isFlagged: posts.isFlagged,
          flagReason: posts.flagReason,
          reviewStatus: posts.reviewStatus,
          reviewedAt: posts.reviewedAt,
          reviewedBy: posts.reviewedBy,
          moderationNote: posts.moderationNote,
          createdAt: posts.createdAt,
          updatedAt: posts.updatedAt,
          user: {
            id: users.id,
            username: users.username,
            name: users.name,
            avatar: users.avatar
          },
          product: {
            id: products.id,
            name: products.name,
            description: products.description,
            price: products.price,
            discountPrice: products.discountPrice,
            imageUrl: products.imageUrl,
            category: products.category,
            stock: products.inventory,
            vendorId: products.vendorId
          },
          vendor: {
            id: vendors.id,
            storeName: vendors.storeName,
            businessName: vendors.businessName,
            rating: vendors.rating
          }
        })
        .from(posts)
        .leftJoin(users, eq(posts.userId, users.id))
        .leftJoin(products, eq(posts.productId, products.id))
        .leftJoin(vendors, eq(products.vendorId, vendors.id))
        .where(eq(posts.id, postId));

      if (!post) return null;

      return {
        ...post,
        product: post.product?.id ? {
          ...post.product,
          vendorName: post.vendor?.storeName || post.vendor?.businessName || 'Unknown Vendor'
        } : null
      };
    } catch (error) {
      logger.error('Error getting post by ID', undefined, error as Error, 'server');
      throw error;
    }
  }



  // Add a comment to a post
  async addComment(commentData: { postId: number; userId: number; content: string }): Promise<any> {
    try {
      const [comment] = await db
        .insert(comments)
        .values({
          postId: commentData.postId,
          userId: commentData.userId,
          content: commentData.content,
          createdAt: new Date()
        })
        .returning();

      // Get comment with user details
      const [commentWithUser] = await db
        .select({
          id: comments.id,
          userId: comments.userId,
          postId: comments.postId,
          content: comments.content,
          createdAt: comments.createdAt,
          user: {
            id: users.id,
            username: users.username,
            name: users.name,
            avatar: users.avatar
          }
        })
        .from(comments)
        .leftJoin(users, eq(comments.userId, users.id))
        .where(eq(comments.id, comment.id));

      return commentWithUser;
    } catch (error) {
      logger.error('Error adding comment', undefined, error as Error, 'server');
      throw error;
    }
  }

  // Increment post comment count
  async incrementPostComments(postId: number): Promise<void> {
    try {
      await db
        .update(posts)
        .set({ 
          comments: sql`${posts.comments} + 1`,
          updatedAt: new Date()
        })
        .where(eq(posts.id, postId));
    } catch (error) {
      logger.error('Error incrementing post comments', undefined, error as Error, 'server');
      throw error;
    }
  }

  // Toggle post like
  async togglePostLike(postId: number, userId: number): Promise<{ liked: boolean }> {
    try {
      // Check if already liked
      const [existingLike] = await db
        .select()
        .from(likes)
        .where(and(eq(likes.postId, postId), eq(likes.userId, userId)));

      if (existingLike) {
        // Unlike
        await db
          .delete(likes)
          .where(and(eq(likes.postId, postId), eq(likes.userId, userId)));
        
        await db
          .update(posts)
          .set({ 
            likes: sql`${posts.likes} - 1`,
            updatedAt: new Date()
          })
          .where(eq(posts.id, postId));

        return { liked: false };
      } else {
        // Like
        await db
          .insert(likes)
          .values({
            postId,
            userId,
            createdAt: new Date()
          });
        
        await db
          .update(posts)
          .set({ 
            likes: sql`${posts.likes} + 1`,
            updatedAt: new Date()
          })
          .where(eq(posts.id, postId));

        return { liked: true };
      }
    } catch (error) {
      logger.error('Error toggling post like', undefined, error as Error, 'server');
      throw error;
    }
  }

  // Toggle post save
  async togglePostSave(postId: number, userId: number): Promise<{ saved: boolean }> {
    try {
      // Check if already saved
      const [existingSave] = await db
        .select()
        .from(savedPosts)
        .where(and(eq(savedPosts.postId, postId), eq(savedPosts.userId, userId)));

      if (existingSave) {
        // Unsave
        await db
          .delete(savedPosts)
          .where(and(eq(savedPosts.postId, postId), eq(savedPosts.userId, userId)));

        return { saved: false };
      } else {
        // Save
        await db
          .insert(savedPosts)
          .values({
            postId,
            userId,
            createdAt: new Date()
          });

        return { saved: true };
      }
    } catch (error) {
      logger.error('Error toggling post save', undefined, error as Error, 'server');
      throw error;
    }
  }

  // Increment post shares
  async incrementPostShares(postId: number): Promise<void> {
    try {
      await db
        .update(posts)
        .set({ 
          shares: sql`${posts.shares} + 1`,
          updatedAt: new Date()
        })
        .where(eq(posts.id, postId));
    } catch (error) {
      logger.error('Error incrementing post shares', undefined, error as Error, 'server');
      throw error;
    }
  }

  // Increment post views
  async incrementPostViews(postId: number): Promise<void> {
    try {
      await db
        .update(posts)
        .set({ 
          views: sql`${posts.views} + 1`,
          updatedAt: new Date()
        })
        .where(eq(posts.id, postId));
    } catch (error) {
      logger.error('Error incrementing post views', undefined, error as Error, 'server');
      throw error;
    }
  }

  async getAllPosts(): Promise<(Post & { user: { id: number; username: string; name: string; avatar: string | null; city: string | null; country: string | null; region: string | null } })[]> {
    try {
      const postsWithUsers = await db
        .select({
          // Post fields
          id: posts.id,
          userId: posts.userId,
          content: posts.content,
          title: posts.title,
          contentType: posts.contentType,
          imageUrl: posts.imageUrl,
          videoUrl: posts.videoUrl,
          productId: posts.productId,
          eventId: posts.eventId,
          likes: posts.likes,
          comments: posts.comments,
          shares: posts.shares,
          views: posts.views,
          tags: posts.tags,
          isPromoted: posts.isPromoted,
          promotionEndDate: posts.promotionEndDate,
          isPublished: posts.isPublished,
          publishStatus: posts.publishStatus,
          publishAt: posts.publishAt,
          contentJson: posts.contentJson,
          contentVersion: posts.contentVersion,
          isFlagged: posts.isFlagged,
          flagReason: posts.flagReason,
          reviewStatus: posts.reviewStatus,
          reviewedAt: posts.reviewedAt,
          reviewedBy: posts.reviewedBy,
          moderationNote: posts.moderationNote,
          createdAt: posts.createdAt,
          updatedAt: posts.updatedAt,
          // User fields
          user_id: users.id,
          user_username: users.username,
          user_name: users.name,
          user_avatar: users.avatar,
          user_city: users.city,
          user_country: users.country,
          user_region: users.region,
          // Product fields
          product_id: products.id,
          product_name: products.name,
          product_description: products.description,
          product_price: products.price,
          product_discountPrice: products.discountPrice,
          product_imageUrl: products.imageUrl,
          product_category: products.category,
          product_stock: products.inventory,
          product_vendorId: products.vendorId,
          // Vendor fields
          vendor_id: vendors.id,
          vendor_storeName: vendors.storeName,
          vendor_businessName: vendors.businessName,
          vendor_rating: vendors.rating
        })
        .from(posts)
        .innerJoin(users, eq(posts.userId, users.id))
        .leftJoin(products, eq(posts.productId, products.id))
        .leftJoin(vendors, eq(products.vendorId, vendors.id))
        .where(eq(posts.isPublished, true))
        .orderBy(desc(posts.createdAt));

      return postsWithUsers.map((row) => ({
        id: row.id,
        userId: row.userId,
        content: row.content,
        title: row.title,
        contentType: row.contentType,
        imageUrl: row.imageUrl,
        videoUrl: row.videoUrl,
        productId: row.productId,
        eventId: row.eventId,
        likes: row.likes,
        comments: row.comments,
        shares: row.shares,
        views: row.views,
        tags: row.tags,
        isPromoted: row.isPromoted,
        promotionEndDate: row.promotionEndDate,
        isPublished: row.isPublished,
        publishStatus: row.publishStatus,
        publishAt: row.publishAt,
        contentJson: row.contentJson,
        contentVersion: row.contentVersion,
        isFlagged: row.isFlagged,
        flagReason: row.flagReason,
        reviewStatus: row.reviewStatus,
        reviewedAt: row.reviewedAt,
        reviewedBy: row.reviewedBy,
        moderationNote: row.moderationNote,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        user: {
          id: row.user_id,
          username: row.user_username,
          name: row.user_name,
          avatar: row.user_avatar,
          city: row.user_city,
          country: row.user_country,
          region: row.user_region
        },
        // Add complete product information if post has a productId
        product: row.product_id ? {
          id: row.product_id,
          name: row.product_name,
          description: row.product_description,
          price: row.product_price,
          discountPrice: row.product_discountPrice,
          imageUrl: row.product_imageUrl,
          category: row.product_category,
          stock: row.product_stock,
          vendorId: row.product_vendorId,
          vendorName: row.vendor_storeName || row.vendor_businessName || 'Unknown Vendor'
        } : null
      }));
    } catch (error) {
      logger.error('Error getting all posts', undefined, error as Error, 'server');
      return [];
    }
  }

  async getAllPostsPaginated(limit: number, offset: number, currentUserId?: number): Promise<(Post & { user: { id: number; username: string; name: string; avatar: string | null; city: string | null; country: string | null; region: string | null }; _count: { likes: number; comments: number; shares: number }; isLiked: boolean; isShared: boolean; isSaved: boolean })[]> {
    try {
      // First get posts with users
      const postsWithUsers = await db
        .select({
          post: posts,
          user: {
            id: users.id,
            username: users.username,
            name: users.name,
            avatar: users.avatar,
            city: users.city,
            country: users.country,
            region: users.region
          }
        })
        .from(posts)
        .innerJoin(users, eq(posts.userId, users.id))
        .where(
          and(
            eq(posts.isPublished, true),
            eq(posts.publishStatus, 'published') // Only show published posts
          )
        )
        .orderBy(desc(posts.createdAt))
        .limit(limit)
        .offset(offset);

      // Then get product information for posts that have productId
      const postsWithProductInfo = await Promise.all(
        postsWithUsers.map(async ({ post, user }) => {
          let product = null;
          
          if (post.productId) {
            try {
              // Simplified approach without joins to isolate the issue
              const productResult = await db.query.products.findFirst({
                where: eq(products.id, post.productId),
                columns: {
                  id: true,
                  name: true,
                  description: true,
                  price: true,
                  discountPrice: true,
                  imageUrl: true,
                  category: true,
                  inventory: true,
                  vendorId: true
                }
              });
              
              if (productResult) {
                // Get vendor name separately
                let vendorName = 'Unknown Vendor';
                try {
                  const vendorResult = await db.query.vendors.findFirst({
                    where: eq(vendors.id, productResult.vendorId),
                    columns: {
                      storeName: true,
                      businessName: true
                    }
                  });
                  
                  if (vendorResult) {
                    vendorName = vendorResult.storeName || vendorResult.businessName || 'Unknown Vendor';
                  }
                } catch (vendorError) {
                  logger.error('Error fetching vendor', undefined, vendorError as Error, 'server');
                }
                
                product = {
                  ...productResult,
                  stock: productResult.inventory, // Map inventory to stock for compatibility
                  vendorName
                };
              }

            } catch (error) {
              logger.error('Error fetching product', { productId: post.productId }, error as Error, 'server');
            }
          }
          
          return { post, user, product };
        })
      );

      // If currentUserId is provided, check which posts are liked and saved by this user
      const postIds = postsWithProductInfo.map(p => p.post.id);
      let likedPostIds: number[] = [];
      let savedPostIds: number[] = [];

      if (currentUserId && postIds.length > 0) {
        // Get liked posts
        const likedPosts = await db
          .select({ postId: likes.postId })
          .from(likes)
          .where(and(
            eq(likes.userId, currentUserId),
            sql`${likes.postId} = ANY(${postIds})`
          ));
        likedPostIds = likedPosts.map(l => l.postId);

        // Get saved posts
        const savedPostsData = await db
          .select({ postId: savedPosts.postId })
          .from(savedPosts)
          .where(and(
            eq(savedPosts.userId, currentUserId),
            sql`${savedPosts.postId} = ANY(${postIds})`
          ));
        savedPostIds = savedPostsData.map(s => s.postId);
      }

      return postsWithProductInfo.map(({ post, user, product }) => ({
        ...post,
        user,
        product,
        _count: {
          likes: post.likes || 0,
          comments: post.comments || 0,
          shares: post.shares || 0
        },
        isLiked: likedPostIds.includes(post.id),
        isShared: false,
        isSaved: savedPostIds.includes(post.id)
      }));
    } catch (error) {
      logger.error('Error getting paginated posts', undefined, error as Error, 'server');
      return [];
    }
  }

  async getTotalPostsCount(): Promise<number> {
    try {
      const result = await db
        .select({ count: count() })
        .from(posts)
        .where(eq(posts.isPublished, true));
      
      return result[0]?.count || 0;
    } catch (error) {
      logger.error('Error getting total posts count', undefined, error as Error, 'server');
      return 0;
    }
  }
  
  async updatePost(id: number, postData: Partial<Post>): Promise<Post | undefined> {
    try {
      const [updatedPost] = await db
        .update(posts)
        .set({
          ...postData,
          updatedAt: new Date()
        })
        .where(eq(posts.id, id))
        .returning();
      return updatedPost;
    } catch (error) {
      logger.error('Error updating post', undefined, error as Error, 'server');
      return undefined;
    }
  }
  

  
  async getFeedPosts(userId?: number, sortBy: string = 'recent', limit: number = 10, offset: number = 0): Promise<Post[]> {
    try {
      // Get user IDs to include if filtering by follows
      let userIdsToInclude: number[] | undefined;
      if (userId) {
        const followingUserIds = await db
          .select({ followingId: follows.followingId })
          .from(follows)
          .where(eq(follows.followerId, userId));
        
        if (followingUserIds.length > 0) {
          userIdsToInclude = [userId, ...followingUserIds.map(f => f.followingId)];
        }
      }
      
      // Build the base query with product and vendor joins
      let baseQuery = db
        .select({
          post: posts,
          user: {
            id: users.id,
            username: users.username,
            name: users.name,
            avatar: users.avatar
          },
          product: {
            id: products.id,
            name: products.name,
            description: products.description,
            price: products.price,
            discountPrice: products.discountPrice,
            imageUrl: products.imageUrl,
            category: products.category,
            stock: products.inventory,
            vendorId: products.vendorId
          },
          vendor: {
            id: vendors.id,
            storeName: vendors.storeName,
            businessName: vendors.businessName,
            rating: vendors.rating
          }
        })
        .from(posts)
        .innerJoin(users, eq(posts.userId, users.id))
        .leftJoin(products, eq(posts.productId, products.id))
        .leftJoin(vendors, eq(products.vendorId, vendors.id))
        .$dynamic();
      
      // Apply user filter if needed
      if (userIdsToInclude) {
        baseQuery = baseQuery.where(
          and(
            eq(posts.publishStatus, 'published'), // Only show published posts
            inArray(posts.userId, userIdsToInclude)
          )
        );
      } else {
        baseQuery = baseQuery.where(eq(posts.publishStatus, 'published')); // Only show published posts
      }
      
      // Apply sorting
      if (sortBy === 'recent') {
        baseQuery = baseQuery.orderBy(desc(posts.createdAt));
      } else if (sortBy === 'popular') {
        baseQuery = baseQuery.orderBy(desc(sql`${posts.likes} + ${posts.comments}`));
      } else if (sortBy === 'trending') {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        baseQuery = baseQuery
          .where(sql`${posts.createdAt} > ${oneWeekAgo}`)
          .orderBy(desc(sql`${posts.likes} + ${posts.comments} * 2`));
      }
      
      const results = await baseQuery.limit(limit).offset(offset);
      
      return results.map(({ post, user, product, vendor }) => ({
        ...post,
        user: {
          id: user.id,
          username: user.username,
          name: user.name,
          avatar: user.avatar
        },
        product: product && product.id ? {
          id: product.id,
          name: product.name,
          description: product.description,
          price: product.price,
          discountPrice: product.discountPrice,
          imageUrl: product.imageUrl,
          category: product.category,
          stock: product.stock,
          vendorId: product.vendorId,
          vendorName: vendor?.storeName || vendor?.businessName
        } : null
      })) as Post[];
    } catch (error) {
      logger.error('Error getting feed posts', undefined, error as Error, 'server');
      return [];
    }
  }
  
  async getTrendingPosts(limit: number = 10): Promise<Post[]> {
    try {
      // Get posts from the last 7 days with the most engagement
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      
      const trendingPosts = await db
        .select({
          post: posts,
          user: {
            id: users.id,
            username: users.username,
            name: users.name,
            avatar: users.avatar
          },
          product: {
            id: products.id,
            name: products.name,
            description: products.description,
            price: products.price,
            discountPrice: products.discountPrice,
            imageUrl: products.imageUrl,
            category: products.category,
            stock: products.inventory,
            vendorId: products.vendorId
          },
          vendor: {
            id: vendors.id,
            storeName: vendors.storeName,
            businessName: vendors.businessName,
            rating: vendors.rating
          }
        })
        .from(posts)
        .innerJoin(users, eq(posts.userId, users.id))
        .leftJoin(products, eq(posts.productId, products.id))
        .leftJoin(vendors, eq(products.vendorId, vendors.id))
        .where(
          and(
            eq(posts.publishStatus, 'published'), // Only show published posts
            sql`${posts.createdAt} > ${oneWeekAgo}`
          )
        )
        .orderBy(desc(sql`(${posts.likes} * 1.0) + (${posts.comments} * 2.0)`))
        .limit(limit);
      
      return trendingPosts.map(({ post, user, product, vendor }) => ({
        ...post,
        user: {
          id: user.id,
          username: user.username,
          name: user.name,
          avatar: user.avatar
        },
        product: product && product.id ? {
          id: product.id,
          name: product.name,
          description: product.description,
          price: product.price,
          discountPrice: product.discountPrice,
          imageUrl: product.imageUrl,
          category: product.category,
          stock: product.stock,
          vendorId: product.vendorId,
          vendorName: vendor?.storeName || vendor?.businessName
        } : null
      })) as Post[];
    } catch (error) {
      logger.error('Error getting trending posts', undefined, error as Error, 'server');
      return [];
    }
  }
  
  async getPopularTags(limit: number = 20): Promise<{ tag: string, count: number }[]> {
    try {
      // Get most used tags from posts
      // Note: This implementation assumes the tags are stored in a string array column
      // You might need to adjust based on your actual schema
      const tagCounts = await db
        .select({
          tag: sql<string>`unnest(${posts.tags})`,
          count: count()
        })
        .from(posts)
        .where(sql`${posts.tags} IS NOT NULL AND array_length(${posts.tags}, 1) > 0`)
        .groupBy(sql`unnest(${posts.tags})`)
        .orderBy(desc(count()))
        .limit(limit);
      
      return tagCounts.map(tc => ({
        tag: tc.tag,
        count: Number(tc.count)
      }));
    } catch (error) {
      logger.error('Error getting popular tags', undefined, error as Error, 'server');
      return [];
    }
  }
  
  async getSuggestedUsers(limit: number = 10, currentUserId?: number): Promise<User[]> {
    try {
      let query = db
        .select()
        .from(users)
        .where(
          // Exclude the current user
          currentUserId ? sql`${users.id} <> ${currentUserId}` : sql`1=1`
        )
        .orderBy(sql`RANDOM()`) // Simple random suggestion for now
        .limit(limit);
      
      const suggestedUsers = await query;
      
      // Remove sensitive information
      return suggestedUsers.map(user => {
        const { password, ...userData } = user;
        return userData as User;
      });
    } catch (error) {
      logger.error('Error getting suggested users', undefined, error as Error, 'server');
      return [];
    }
  }

  async getPostsByLocation(userId: number, locationType: 'city' | 'country' | 'region', limit: number = 10, offset: number = 0): Promise<(Post & { user: { id: number; username: string; name: string; avatar: string | null; city: string | null; country: string | null; region: string | null } })[]> {
    try {
      // First get the user's location information
      const [currentUser] = await db.select().from(users).where(eq(users.id, userId));
      if (!currentUser) {
        logger.debug('User not found for location filtering', 'server');
        return [];
      }

      let locationFilter;
      if (locationType === 'city' && currentUser.city) {
        locationFilter = eq(users.city, currentUser.city);
      } else if (locationType === 'country' && currentUser.country) {
        locationFilter = eq(users.country, currentUser.country);
      } else if (locationType === 'region' && currentUser.region) {
        locationFilter = eq(users.region, currentUser.region);
      } else {
        logger.debug(`No ${locationType} data available for filtering`, 'server');
        return [];
      }

      logger.debug(`Filtering posts by ${locationType}: ${locationType === 'city' ? currentUser.city : locationType === 'country' ? currentUser.country : currentUser.region}`, 'server');

      const postsWithUsers = await db
        .select({
          // Post fields
          id: posts.id,
          userId: posts.userId,
          content: posts.content,
          title: posts.title,
          contentType: posts.contentType,
          imageUrl: posts.imageUrl,
          videoUrl: posts.videoUrl,
          productId: posts.productId,
          eventId: posts.eventId,
          likes: posts.likes,
          comments: posts.comments,
          shares: posts.shares,
          views: posts.views,
          tags: posts.tags,
          isPromoted: posts.isPromoted,
          promotionEndDate: posts.promotionEndDate,
          isPublished: posts.isPublished,
          publishStatus: posts.publishStatus,
          publishAt: posts.publishAt,
          contentJson: posts.contentJson,
          contentVersion: posts.contentVersion,
          isFlagged: posts.isFlagged,
          flagReason: posts.flagReason,
          reviewStatus: posts.reviewStatus,
          reviewedAt: posts.reviewedAt,
          reviewedBy: posts.reviewedBy,
          moderationNote: posts.moderationNote,
          createdAt: posts.createdAt,
          updatedAt: posts.updatedAt,
          // User fields
          user_id: users.id,
          user_username: users.username,
          user_name: users.name,
          user_avatar: users.avatar,
          user_city: users.city,
          user_country: users.country,
          user_region: users.region
        })
        .from(posts)
        .innerJoin(users, eq(posts.userId, users.id))
        .where(and(
          eq(posts.isPublished, true),
          locationFilter
        ))
        .orderBy(desc(posts.createdAt))
        .limit(limit)
        .offset(offset);

      return postsWithUsers.map((row) => ({
        id: row.id,
        userId: row.userId,
        content: row.content,
        title: row.title,
        contentType: row.contentType,
        imageUrl: row.imageUrl,
        videoUrl: row.videoUrl,
        productId: row.productId,
        eventId: row.eventId,
        likes: row.likes,
        comments: row.comments,
        shares: row.shares,
        views: row.views,
        tags: row.tags,
        isPromoted: row.isPromoted,
        promotionEndDate: row.promotionEndDate,
        isPublished: row.isPublished,
        publishStatus: row.publishStatus,
        publishAt: row.publishAt,
        contentJson: row.contentJson,
        contentVersion: row.contentVersion,
        isFlagged: row.isFlagged,
        flagReason: row.flagReason,
        reviewStatus: row.reviewStatus,
        reviewedAt: row.reviewedAt,
        reviewedBy: row.reviewedBy,
        moderationNote: row.moderationNote,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        user: {
          id: row.user_id,
          username: row.user_username,
          name: row.user_name,
          avatar: row.user_avatar,
          city: row.user_city,
          country: row.user_country,
          region: row.user_region
        }
      }));
    } catch (error) {
      logger.error('Error getting posts by location', undefined, error as Error, 'server');
      return [];
    }
  }
  
  // Like operations
  async likePost(postId: number, userId: number): Promise<boolean> {
    try {
      // Check if like already exists
      const [existingLike] = await db
        .select()
        .from(likes)
        .where(
          and(
            eq(likes.postId, postId),
            eq(likes.userId, userId)
          )
        );
      
      if (existingLike) {
        // Already liked
        return true;
      }
      
      // Create a new like
      await db.insert(likes).values({
        postId,
        userId
      });
      
      // Increment the post's like count
      await db
        .update(posts)
        .set({
          likes: sql`${posts.likes} + 1`,
          updatedAt: new Date()
        })
        .where(eq(posts.id, postId));
      
      return true;
    } catch (error) {
      logger.error('Error liking post', undefined, error as Error, 'server');
      return false;
    }
  }
  
  async unlikePost(postId: number, userId: number): Promise<boolean> {
    try {
      // Find and delete the like
      const [existingLike] = await db
        .select()
        .from(likes)
        .where(
          and(
            eq(likes.postId, postId),
            eq(likes.userId, userId)
          )
        );
      
      if (!existingLike) {
        // Not liked yet
        return true;
      }
      
      // Delete the like
      await db
        .delete(likes)
        .where(eq(likes.id, existingLike.id));
      
      // Decrement the post's like count
      await db
        .update(posts)
        .set({
          likes: sql`GREATEST(${posts.likes} - 1, 0)`, // Ensure likes don't go below 0
          updatedAt: new Date()
        })
        .where(eq(posts.id, postId));
      
      return true;
    } catch (error) {
      logger.error('Error unliking post', undefined, error as Error, 'server');
      return false;
    }
  }
  
  async checkIfUserLikedPost(postId: number, userId: number): Promise<boolean> {
    try {
      const [existingLike] = await db
        .select()
        .from(likes)
        .where(
          and(
            eq(likes.postId, postId),
            eq(likes.userId, userId)
          )
        );
      
      return !!existingLike;
    } catch (error) {
      logger.error('Error checking if user liked post', undefined, error as Error, 'server');
      return false;
    }
  }
  
  async getPostLikes(postId: number): Promise<any[]> {
    try {
      const postLikes = await db
        .select({
          like: likes,
          user: {
            id: users.id,
            username: users.username,
            name: users.name,
            avatar: users.avatar,
            isVendor: users.isVendor
          }
        })
        .from(likes)
        .leftJoin(users, eq(likes.userId, users.id))
        .where(eq(likes.postId, postId))
        .orderBy(desc(likes.createdAt));
      
      return postLikes.map(({ like, user }) => ({
        id: like.id,
        userId: user?.id || 0,
        username: user?.username || '',
        name: user?.name || '',
        avatar: user?.avatar || null,
        isVendor: user?.isVendor || false,
        createdAt: like.createdAt
      }));
    } catch (error) {
      logger.error('Error getting post likes', undefined, error as Error, 'server');
      return [];
    }
  }
  
  // Comment operations
  async createComment(comment: InsertComment): Promise<Comment> {
    try {
      const [newComment] = await db.insert(comments).values(comment).returning();
      
      // Increment the post's comment count
      await db
        .update(posts)
        .set({
          comments: sql`${posts.comments} + 1`,
          updatedAt: new Date()
        })
        .where(eq(posts.id, newComment.postId));
      
      return newComment;
    } catch (error) {
      logger.error('Error creating comment', undefined, error as Error, 'server');
      throw new Error('Failed to create comment');
    }
  }
  
  async getPostComments(postId: number, limit: number = 10, offset: number = 0): Promise<Comment[]> {
    try {
      const postComments = await db
        .select({
          comment: comments,
          user: {
            id: users.id,
            username: users.username,
            name: users.name,
            avatar: users.avatar
          }
        })
        .from(comments)
        .leftJoin(users, eq(comments.userId, users.id))
        .where(eq(comments.postId, postId))
        .orderBy(desc(comments.createdAt))
        .limit(limit)
        .offset(offset);
      
      return postComments.map(({ comment, user }) => ({
        ...comment,
        user: {
          id: user?.id || 0,
          username: user?.username || '',
          name: user?.name || '',
          avatar: user?.avatar || null
        }
      })) as Comment[];
    } catch (error) {
      logger.error('Error getting post comments', undefined, error as Error, 'server');
      return [];
    }
  }
  
  async deleteComment(id: number): Promise<boolean> {
    try {
      // Get the comment first to know which post to update
      const [comment] = await db
        .select()
        .from(comments)
        .where(eq(comments.id, id));
      
      if (!comment) {
        return false;
      }
      
      // Delete the comment
      await db.delete(comments).where(eq(comments.id, id));
      
      // Decrement the post's comment count
      await db
        .update(posts)
        .set({
          comments: sql`GREATEST(${posts.comments} - 1, 0)`, // Ensure comments don't go below 0
          updatedAt: new Date()
        })
        .where(eq(posts.id, comment.postId));
      
      return true;
    } catch (error) {
      logger.error('Error deleting comment', undefined, error as Error, 'server');
      return false;
    }
  }
  
  async getComment(id: number): Promise<Comment | undefined> {
    try {
      const [comment] = await db
        .select({
          comment: comments,
          user: {
            id: users.id,
            username: users.username,
            name: users.name,
            avatar: users.avatar
          }
        })
        .from(comments)
        .leftJoin(users, eq(comments.userId, users.id))
        .where(eq(comments.id, id));
      
      if (!comment) {
        return undefined;
      }
      
      return {
        ...comment.comment,
        user: {
          id: comment.user?.id || 0,
          username: comment.user?.username || '',
          name: comment.user?.name || '',
          avatar: comment.user?.avatar || null
        }
      } as Comment;
    } catch (error) {
      logger.error('Error getting comment', undefined, error as Error, 'server');
      return undefined;
    }
  }
  
  async updateComment(id: number, content: string): Promise<Comment | undefined> {
    try {
      const [updatedComment] = await db
        .update(comments)
        .set({
          content,
          updatedAt: new Date()
        })
        .where(eq(comments.id, id))
        .returning();
      
      if (!updatedComment) {
        return undefined;
      }
      
      // Get the user information to include in the response
      const [user] = await db
        .select({
          id: users.id,
          username: users.username,
          name: users.name,
          avatar: users.avatar
        })
        .from(users)
        .where(eq(users.id, updatedComment.userId));
      
      return {
        ...updatedComment,
        user
      } as Comment;
    } catch (error) {
      logger.error('Error updating comment', undefined, error as Error, 'server');
      return undefined;
    }
  }
  
  async getPostLike(postId: number, userId: number): Promise<any | undefined> {
    try {
      const [like] = await db
        .select()
        .from(likes)
        .where(
          and(
            eq(likes.postId, postId),
            eq(likes.userId, userId)
          )
        );
      
      return like;
    } catch (error) {
      logger.error('Error getting post like', undefined, error as Error, 'server');
      return undefined;
    }
  }
  
  // Saved posts operations
  async savePost(postId: number, userId: number): Promise<void> {
    try {
      // Check if already saved
      const alreadySaved = await this.checkSavedPost(postId, userId);
      
      if (alreadySaved) {
        return; // Already saved
      }
      
      // Save the post
      await db.insert(savedPosts).values({
        postId,
        userId
      });
    } catch (error) {
      logger.error('Error saving post', undefined, error as Error, 'server');
      throw new Error('Failed to save post');
    }
  }
  
  async unsavePost(postId: number, userId: number): Promise<boolean> {
    try {
      // Delete the saved post record
      const result = await db
        .delete(savedPosts)
        .where(
          and(
            eq(savedPosts.postId, postId),
            eq(savedPosts.userId, userId)
          )
        );
      
      // Return true if at least one record was deleted
      return result.rowCount > 0;
    } catch (error) {
      logger.error('Error unsaving post', undefined, error as Error, 'server');
      return false;
    }
  }
  
  async checkSavedPost(postId: number, userId: number): Promise<boolean> {
    try {
      const [savedPost] = await db
        .select()
        .from(savedPosts)
        .where(
          and(
            eq(savedPosts.postId, postId),
            eq(savedPosts.userId, userId)
          )
        );
      
      return !!savedPost; // Return true if savedPost exists, false otherwise
    } catch (error) {
      logger.error('Error checking saved post', undefined, error as Error, 'server');
      return false;
    }
  }
  
  async getSavedPosts(userId: number, options: { limit: number, offset: number }): Promise<Post[]> {
    try {
      // First, get the saved post IDs for this user
      const savedPostItems = await db
        .select()
        .from(savedPosts)
        .where(eq(savedPosts.userId, userId))
        .orderBy(desc(savedPosts.createdAt))
        .limit(options.limit)
        .offset(options.offset);
      
      if (savedPostItems.length === 0) {
        return [];
      }
      
      // Get the post IDs
      const postIds = savedPostItems.map(item => item.postId);
      
      // Fetch the actual posts with these IDs
      const postsData = await db
        .select({
          post: posts,
          user: {
            id: users.id,
            username: users.username,
            name: users.name,
            avatar: users.avatar
          },
          savedAt: savedPosts.createdAt
        })
        .from(posts)
        .innerJoin(savedPosts, eq(posts.id, savedPosts.postId))
        .innerJoin(users, eq(posts.userId, users.id))
        .where(
          and(
            inArray(posts.id, postIds),
            eq(savedPosts.userId, userId),
            eq(posts.publishStatus, 'published') // Only show published posts
          )
        )
        .orderBy(desc(savedPosts.createdAt));
      
      // Format the posts for the response
      return postsData.map(data => {
        const { post, user, savedAt } = data;
        return {
          ...post,
          user: {
            id: user.id,
            username: user.username,
            name: user.name,
            avatar: user.avatar
          },
          savedAt
        } as Post;
      });
    } catch (error) {
      logger.error('Error getting saved posts', undefined, error as Error, 'server');
      return [];
    }
  }
  
  async promotePost(postId: number, endDate: Date): Promise<Post | undefined> {
    try {
      const [promotedPost] = await db
        .update(posts)
        .set({
          isPromoted: true,
          promotionEndDate: endDate,
          updatedAt: new Date()
        })
        .where(eq(posts.id, postId))
        .returning();
      
      return promotedPost;
    } catch (error) {
      logger.error('Error promoting post', undefined, error as Error, 'server');
      return undefined;
    }
  }
  
  async unpromotePost(postId: number): Promise<Post | undefined> {
    try {
      const [unpromoted] = await db
        .update(posts)
        .set({
          isPromoted: false,
          promotionEndDate: null,
          updatedAt: new Date()
        })
        .where(eq(posts.id, postId))
        .returning();
      
      return unpromoted;
    } catch (error) {
      logger.error('Error un-promoting post', undefined, error as Error, 'server');
      return undefined;
    }
  }
  
  // Admin analytics methods
  async getUserCount(): Promise<number> {
    try {
      const [result] = await db
        .select({ count: count() })
        .from(users);
      
      return result?.count || 0;
    } catch (error) {
      logger.error('Error getting user count', undefined, error as Error, 'server');
      return 0;
    }
  }
  
  async getProductCount(): Promise<number> {
    try {
      const [result] = await db
        .select({ count: count() })
        .from(products);
      
      return result?.count || 0;
    } catch (error) {
      logger.error('Error getting product count', undefined, error as Error, 'server');
      return 0;
    }
  }
  
  async getOrderCount(): Promise<number> {
    try {
      const [result] = await db
        .select({ count: count() })
        .from(orders);
      
      return result?.count || 0;
    } catch (error) {
      logger.error('Error getting order count', undefined, error as Error, 'server');
      return 0;
    }
  }
  
  async getCommunityCount(): Promise<number> {
    try {
      const [result] = await db
        .select({ count: count() })
        .from(communities);
      
      return result?.count || 0;
    } catch (error) {
      logger.error('Error getting community count', undefined, error as Error, 'server');
      return 0;
    }
  }
  
  async getUserCommunities(userId: number): Promise<any[]> {
    try {
      // Get communities created by the user
      const userCommunities = await db.select({
        id: communities.id,
        name: communities.name,
        description: communities.description,
        logo: communities.logo,
        bannerImage: communities.bannerImage,
        memberCount: communities.memberCount,
        ownerId: communities.ownerId,
        visibility: communities.visibility,
        isVerified: communities.isVerified,
        createdAt: communities.createdAt
      })
        .from(communities)
        .where(eq(communities.ownerId, userId))
        .orderBy(desc(communities.createdAt));
      
      // Also get communities the user is a member of but didn't create
      const memberCommunities = await db.select({
        id: communities.id,
        name: communities.name,
        description: communities.description,
        logo: communities.logo,
        bannerImage: communities.bannerImage,
        memberCount: communities.memberCount,
        ownerId: communities.ownerId,
        visibility: communities.visibility,
        isVerified: communities.isVerified,
        createdAt: communities.createdAt
      })
        .from(communityMembers)
        .innerJoin(communities, eq(communityMembers.communityId, communities.id))
        .where(
          and(
            eq(communityMembers.userId, userId),
            ne(communities.ownerId, userId)
          )
        )
        .orderBy(desc(communities.createdAt));
      
      // Combine the two sets
      return [...userCommunities, ...memberCommunities];
    } catch (error) {
      logger.error('Error getting user communities', undefined, error as Error, 'server');
      return [];
    }
  }
  
  async countPosts(options: any): Promise<number> {
    try {
      let query = db.select({ count: count() }).from(posts).$dynamic();
      
      if (options.isFlagged !== undefined) {
        query = query.where(eq(posts.isFlagged, options.isFlagged));
      }
      
      if (options.reviewStatus) {
        query = query.where(eq(posts.reviewStatus, options.reviewStatus));
      }
      
      const [result] = await query;
      return result?.count || 0;
    } catch (error) {
      logger.error('Error counting posts', undefined, error as Error, 'server');
      return 0;
    }
  }
  
  // Exclusive content operations
  async getCommunityContent(contentId: number): Promise<CommunityContent | undefined> {
    try {
      const [content] = await db
        .select()
        .from(communityContents)
        .where(eq(communityContents.id, contentId));
      return content;
    } catch (error) {
      logger.error('Error getting community content', { contentId }, error as Error, 'storage');
      return undefined;
    }
  }
  
  async canUserAccessContent(userId: number, contentId: number): Promise<boolean> {
    try {
      // Get the content to check which tier is required
      const content = await this.getCommunityContent(contentId);
      if (!content) return false;
      
      // Check if user is the creator
      if (content.creatorId === userId) return true;
      
      // Check if user is admin or owner of the community
      const isAdmin = await this.isUserCommunityAdminOrOwner(userId, content.communityId);
      if (isAdmin) return true;
      
      // Check if user has an active membership for the required tier
      const [membership] = await db
        .select()
        .from(memberships)
        .where(
          and(
            eq(memberships.userId, userId),
            eq(memberships.tierId, content.tierId),
            eq(memberships.communityId, content.communityId),
            eq(memberships.status, 'active')
          )
        );
      
      return !!membership;
    } catch (error) {
      logger.error('Error checking user content access', { userId, contentId }, error as Error, 'storage');
      return false;
    }
  }
  
  async listCommunityContent(communityId: number): Promise<CommunityContent[]> {
    try {
      const content = await db
        .select()
        .from(communityContents)
        .where(eq(communityContents.communityId, communityId))
        .orderBy(desc(communityContents.createdAt));
      return content;
    } catch (error) {
      logger.error('Error listing community content', { communityId }, error as Error, 'storage');
      return [];
    }
  }
  
  async getMembershipTier(tierId: number, communityId?: number): Promise<MembershipTier | undefined> {
    try {
      const query = db
        .select()
        .from(membershipTiers)
        .where(eq(membershipTiers.id, tierId));
      
      const [tier] = await query;
      return tier;
    } catch (error) {
      logger.error('Error getting membership tier', { tierId, communityId }, error as Error, 'storage');
      return undefined;
    }
  }
  
  async getAccessibleCommunityContent(communityId: number, userId: number): Promise<CommunityContent[]> {
    try {
      // Get all content for this community
      const allContent = await this.listCommunityContent(communityId);
      
      // Filter to only content the user can access
      const accessibleContent = [];
      for (const content of allContent) {
        const hasAccess = await this.canUserAccessContent(userId, content.id);
        if (hasAccess) {
          accessibleContent.push(content);
        }
      }
      
      return accessibleContent;
    } catch (error) {
      logger.error('Error getting accessible community content', { communityId, userId }, error as Error, 'storage');
      return [];
    }
  }
  
  async isUserCommunityAdminOrOwner(userId: number, communityId: number): Promise<boolean> {
    try {
      // Check if user is the owner of the community
      const [community] = await db
        .select()
        .from(communities)
        .where(eq(communities.id, communityId));
      
      if (community && community.ownerId === userId) return true;
      
      // Check if user is an admin or moderator in the community
      const [member] = await db
        .select()
        .from(communityMembers)
        .where(
          and(
            eq(communityMembers.communityId, communityId),
            eq(communityMembers.userId, userId),
            inArray(communityMembers.role, ['owner', 'admin', 'moderator'])
          )
        );
      
      return !!member;
    } catch (error) {
      logger.error('Error checking if user is community admin/owner', { userId, communityId }, error as Error, 'storage');
      return false;
    }
  }
  
  async createCommunityContent(contentData: InsertCommunityContent): Promise<CommunityContent> {
    try {
      const [newContent] = await db
        .insert(communityContents)
        .values(contentData)
        .returning();
      
      logger.info('Community content created', { contentId: newContent.id, communityId: contentData.communityId }, 'storage');
      return newContent;
    } catch (error) {
      logger.error('Error creating community content', { contentData }, error as Error, 'storage');
      throw error;
    }
  }
  
  async updateCommunityContent(contentId: number, updates: Partial<CommunityContent>): Promise<CommunityContent | undefined> {
    try {
      const [updated] = await db
        .update(communityContents)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(communityContents.id, contentId))
        .returning();
      
      logger.info('Community content updated', { contentId }, 'storage');
      return updated;
    } catch (error) {
      logger.error('Error updating community content', { contentId, updates }, error as Error, 'storage');
      return undefined;
    }
  }
  
  async deleteCommunityContent(contentId: number): Promise<boolean> {
    try {
      await db
        .delete(communityContents)
        .where(eq(communityContents.id, contentId));
      
      logger.info('Community content deleted', { contentId }, 'storage');
      return true;
    } catch (error) {
      logger.error('Error deleting community content', { contentId }, error as Error, 'storage');
      return false;
    }
  }
  
  async incrementContentViewCount(contentId: number): Promise<boolean> {
    try {
      await db
        .update(communityContents)
        .set({ viewCount: sql`${communityContents.viewCount} + 1` })
        .where(eq(communityContents.id, contentId));
      
      return true;
    } catch (error) {
      logger.error('Error incrementing content view count', { contentId }, error as Error, 'storage');
      return false;
    }
  }
  
  async likeContent(userId: number, contentId: number): Promise<CommunityContentLike> {
    try {
      // Insert like record
      const [like] = await db
        .insert(communityContentLikes)
        .values({ userId, contentId })
        .returning();
      
      // Increment like count
      await db
        .update(communityContents)
        .set({ likeCount: sql`${communityContents.likeCount} + 1` })
        .where(eq(communityContents.id, contentId));
      
      logger.info('Content liked', { userId, contentId }, 'storage');
      return like;
    } catch (error) {
      logger.error('Error liking content', { userId, contentId }, error as Error, 'storage');
      throw error;
    }
  }
  
  async unlikeContent(userId: number, contentId: number): Promise<boolean> {
    try {
      // Delete like record
      await db
        .delete(communityContentLikes)
        .where(
          and(
            eq(communityContentLikes.userId, userId),
            eq(communityContentLikes.contentId, contentId)
          )
        );
      
      // Decrement like count
      await db
        .update(communityContents)
        .set({ likeCount: sql`GREATEST(0, ${communityContents.likeCount} - 1)` })
        .where(eq(communityContents.id, contentId));
      
      logger.info('Content unliked', { userId, contentId }, 'storage');
      return true;
    } catch (error) {
      logger.error('Error unliking content', { userId, contentId }, error as Error, 'storage');
      return false;
    }
  }
  
  async getCommunityContentByTier(communityId: number, tier: number): Promise<CommunityContent[]> {
    try {
      const content = await db
        .select()
        .from(communityContents)
        .where(
          and(
            eq(communityContents.communityId, communityId),
            eq(communityContents.tierId, tier)
          )
        )
        .orderBy(desc(communityContents.createdAt));
      
      return content;
    } catch (error) {
      logger.error('Error getting content by tier', { communityId, tier }, error as Error, 'storage');
      return [];
    }
  }
  
  async getCommunityContentByType(communityId: number, contentType: string): Promise<CommunityContent[]> {
    try {
      const content = await db
        .select()
        .from(communityContents)
        .where(
          and(
            eq(communityContents.communityId, communityId),
            eq(communityContents.contentType, contentType as any)
          )
        )
        .orderBy(desc(communityContents.createdAt));
      
      return content;
    } catch (error) {
      logger.error('Error getting content by type', { communityId, contentType }, error as Error, 'storage');
      return [];
    }
  }
  
  async getFeaturedCommunityContent(communityId: number): Promise<CommunityContent[]> {
    try {
      const content = await db
        .select()
        .from(communityContents)
        .where(
          and(
            eq(communityContents.communityId, communityId),
            eq(communityContents.isFeatured, true)
          )
        )
        .orderBy(desc(communityContents.createdAt));
      
      return content;
    } catch (error) {
      logger.error('Error getting featured content', { communityId }, error as Error, 'storage');
      return [];
    }
  }
  
  // Order analytics
  async countOrders(options: any): Promise<number> {
    try {
      let query = db.select({ count: count() }).from(orders).$dynamic();
      
      if (options.status) {
        query = query.where(eq(orders.status, options.status));
      }
      
      const [result] = await query;
      return result?.count || 0;
    } catch (error) {
      logger.error('Error counting orders', undefined, error as Error, 'server');
      return 0;
    }
  }
  
  async calculateTotalRevenue(): Promise<number> {
    try {
      const [result] = await db
        .select({ total: sql`SUM(${orders.totalAmount})` })
        .from(orders)
        .where(eq(orders.paymentStatus, 'completed'));
      
      return (result?.total as number) || 0;
    } catch (error) {
      logger.error('Error calculating total revenue', undefined, error as Error, 'server');
      return 0;
    }
  }
  
  async calculateAverageOrderValue(): Promise<number> {
    try {
      const [result] = await db
        .select({ avg: sql`AVG(${orders.totalAmount})` })
        .from(orders)
        .where(eq(orders.paymentStatus, 'completed'));
      
      return (result?.avg as number) || 0;
    } catch (error) {
      logger.error('Error calculating average order value', undefined, error as Error, 'server');
      return 0;
    }
  }
  
  // Product analytics
  async getTopSellingProducts(limit: number): Promise<any[]> {
    try {
      // For now, return empty array since orders/orderItems tables may not exist yet
      // This prevents the app from crashing
      return [];
    } catch (error) {
      logger.error('Error getting top selling products', undefined, error as Error, 'server');
      return [];
    }
  }
  
  async getProductPerformanceMetrics(timeRange: string): Promise<any> {
    try {
      // Calculate time period for the query
      const endDate = new Date();
      let startDate = new Date();
      
      if (timeRange === '7days') {
        startDate.setDate(endDate.getDate() - 7);
      } else if (timeRange === '30days') {
        startDate.setDate(endDate.getDate() - 30);
      } else if (timeRange === '90days') {
        startDate.setDate(endDate.getDate() - 90);
      } else if (timeRange === '12months') {
        startDate.setMonth(endDate.getMonth() - 12);
      }
      
      // Get product performance metrics
      const totalSold = await db
        .select({
          count: sql`SUM(${orderItems.quantity})`,
        })
        .from(orderItems)
        .innerJoin(orders, eq(orderItems.orderId, orders.id))
        .where(
          and(
            eq(orders.paymentStatus, 'completed'),
            sql`${orders.createdAt} >= ${startDate}`,
            sql`${orders.createdAt} <= ${endDate}`
          )
        );
      
      const totalRevenue = await db
        .select({
          revenue: sql`SUM(${orderItems.unitPrice} * ${orderItems.quantity})`,
        })
        .from(orderItems)
        .innerJoin(orders, eq(orderItems.orderId, orders.id))
        .where(
          and(
            eq(orders.paymentStatus, 'completed'),
            sql`${orders.createdAt} >= ${startDate}`,
            sql`${orders.createdAt} <= ${endDate}`
          )
        );
      
      // Get growth compared to previous period
      const previousStartDate = new Date(startDate);
      const previousPeriodLength = endDate.getTime() - startDate.getTime();
      previousStartDate.setTime(previousStartDate.getTime() - previousPeriodLength);
      
      const previousPeriod = await db
        .select({
          count: sql<number>`SUM(${orderItems.quantity})`,
          revenue: sql<number>`SUM(${orderItems.unitPrice} * ${orderItems.quantity})`,
        })
        .from(orderItems)
        .innerJoin(orders, eq(orderItems.orderId, orders.id))
        .where(
          and(
            eq(orders.paymentStatus, 'completed'),
            sql`${orders.createdAt} >= ${previousStartDate}`,
            sql`${orders.createdAt} < ${startDate}`
          )
        );
      
      // Calculate growth percentages
      const prevCount = Number(previousPeriod[0]?.count) || 0;
      const prevRevenue = Number(previousPeriod[0]?.revenue) || 0;
      const currentCount = Number(totalSold[0]?.count) || 0;
      const currentRevenue = Number(totalRevenue[0]?.revenue) || 0;
      
      const salesGrowth = prevCount > 0 
        ? ((currentCount - prevCount) / prevCount) * 100 
        : 0;
      
      const revenueGrowth = prevRevenue > 0 
        ? ((currentRevenue - prevRevenue) / prevRevenue) * 100 
        : 0;
      
      return {
        totalSold: totalSold[0]?.count || 0,
        totalRevenue: totalRevenue[0]?.revenue || 0,
        salesGrowth: salesGrowth,
        revenueGrowth: revenueGrowth,
        timeRange: timeRange
      };
    } catch (error) {
      logger.error('Error getting product performance metrics', undefined, error as Error, 'server');
      return {
        totalSold: 0,
        totalRevenue: 0,
        salesGrowth: 0,
        revenueGrowth: 0,
        timeRange: timeRange
      };
    }
  }
  
  async getCategoryTrendsData(): Promise<any> {
    try {
      // Get product counts by category
      const categoryCounts = await db
        .select({
          category: products.category,
          categoryName: categories.name,
          count: count(products.id)
        })
        .from(products)
        .leftJoin(categories, eq(products.category, categories.name))
        .groupBy(products.category, categories.name);
      
      // Get sales counts by category
      const categorySales = await db
        .select({
          category: products.category,
          categoryName: categories.name,
          totalSold: sql`SUM(${orderItems.quantity})`,
          revenue: sql`SUM(${orderItems.unitPrice} * ${orderItems.quantity})`
        })
        .from(orderItems)
        .innerJoin(products, eq(orderItems.productId, products.id))
        .innerJoin(categories, eq(products.category, categories.name))
        .innerJoin(orders, eq(orderItems.orderId, orders.id))
        .where(eq(orders.paymentStatus, 'completed'))
        .groupBy(products.category, categories.name);
      
      // Combine the data
      const combinedData = categorySales.map(salesData => {
        const countData = categoryCounts.find(c => c.category === salesData.category);
        return {
          category: salesData.category,
          name: salesData.categoryName,
          productCount: countData?.count || 0,
          totalSold: salesData.totalSold,
          revenue: salesData.revenue
        };
      });
      
      return combinedData;
    } catch (error) {
      logger.error('Error getting category trends data', undefined, error as Error, 'server');
      return [];
    }
  }
  
  async getRevenueByCategory(timeRange: string): Promise<any> {
    try {
      // Calculate time period for the query
      const endDate = new Date();
      let startDate = new Date();
      
      if (timeRange === '7days') {
        startDate.setDate(endDate.getDate() - 7);
      } else if (timeRange === '30days') {
        startDate.setDate(endDate.getDate() - 30);
      } else if (timeRange === '90days') {
        startDate.setDate(endDate.getDate() - 90);
      } else if (timeRange === '12months') {
        startDate.setMonth(endDate.getMonth() - 12);
      }
      
      // Get revenue by category
      const categoryRevenue = await db
        .select({
          category: products.category,
          categoryName: categories.name,
          revenue: sql`SUM(${orderItems.unitPrice} * ${orderItems.quantity})`
        })
        .from(orderItems)
        .innerJoin(products, eq(orderItems.productId, products.id))
        .innerJoin(categories, eq(products.category, categories.name))
        .innerJoin(orders, eq(orderItems.orderId, orders.id))
        .where(
          and(
            eq(orders.paymentStatus, 'completed'),
            sql`${orders.createdAt} >= ${startDate}`,
            sql`${orders.createdAt} <= ${endDate}`
          )
        )
        .groupBy(products.category, categories.name)
        .orderBy(desc(sql`SUM(${orderItems.unitPrice} * ${orderItems.quantity})`));
      
      return {
        categories: categoryRevenue.map(c => c.categoryName),
        data: categoryRevenue.map(c => c.revenue),
        timeRange: timeRange
      };
    } catch (error) {
      logger.error('Error getting revenue by category', undefined, error as Error, 'server');
      return {
        categories: [],
        data: [],
        timeRange: timeRange
      };
    }
  }
  
  async getInventoryAlerts(): Promise<any[]> {
    try {
      // Get products with low inventory
      const lowInventory = await db
        .select({
          id: products.id,
          name: products.name,
          stock: products.inventory,
          category: categories.name,
          price: products.price,
          thumbnail: products.thumbnail
        })
        .from(products)
        .leftJoin(categories, eq(products.category, categories.name))
        .where(
          or(
            lte(products.inventory, 5), // Low stock threshold
            eq(products.inventory, 0)   // Out of stock
          )
        )
        .orderBy(asc(products.inventory))
        .limit(20);
      
      return lowInventory.map(product => ({
        ...product,
        status: product.stock === 0 ? 'Out of stock' : 'Low stock',
        alertLevel: product.stock === 0 ? 'high' : 'medium'
      }));
    } catch (error) {
      logger.error('Error getting inventory alerts', undefined, error as Error, 'server');
      return [];
    }
  }
  
  // Admin dashboard analytics
  async getUserRegistrationTrends(timeRange: string): Promise<any> {
    try {
      // Calculate time period for the query
      const endDate = new Date();
      let startDate = new Date();
      let interval = 'day'; // SQL interval type - day, week, month
      
      if (timeRange === '7days') {
        startDate.setDate(endDate.getDate() - 7);
        interval = 'day';
      } else if (timeRange === '30days') {
        startDate.setDate(endDate.getDate() - 30);
        interval = 'day';
      } else if (timeRange === '90days') {
        startDate.setDate(endDate.getDate() - 90);
        interval = 'week';
      } else if (timeRange === '12months') {
        startDate.setMonth(endDate.getMonth() - 12);
        interval = 'month';
      }
      
      // Get user registration counts by interval
      const registrations = await db
        .select({
          date: sql<Date>`date_trunc(${interval}, ${users.createdAt})`,
          count: count()
        })
        .from(users)
        .where(
          and(
            sql`${users.createdAt} >= ${startDate}`,
            sql`${users.createdAt} <= ${endDate}`
          )
        )
        .groupBy(sql`date_trunc(${interval}, ${users.createdAt})`)
        .orderBy(sql`date_trunc(${interval}, ${users.createdAt})`);
      
      return {
        labels: registrations.map(r => new Date(r.date).toISOString().split('T')[0]),
        data: registrations.map(r => r.count),
        timeRange: timeRange
      };
    } catch (error) {
      logger.error('Error getting user registration trends', undefined, error as Error, 'server');
      return {
        labels: [],
        data: [],
        timeRange: timeRange
      };
    }
  }
  
  async getActiveUserStats(timeRange: string): Promise<any> {
    try {
      // Calculate time period for the query
      const endDate = new Date();
      let startDate = new Date();
      
      if (timeRange === '7days') {
        startDate.setDate(endDate.getDate() - 7);
      } else if (timeRange === '30days') {
        startDate.setDate(endDate.getDate() - 30);
      } else if (timeRange === '90days') {
        startDate.setDate(endDate.getDate() - 90);
      } else if (timeRange === '12months') {
        startDate.setMonth(endDate.getMonth() - 12);
      }
      
      // Count active users based on login activity
      const [activeUsers] = await db
        .select({ count: count() })
        .from(userSessions)
        .where(
          and(
            sql`${userSessions.lastActiveAt} >= ${startDate}`,
            sql`${userSessions.lastActiveAt} <= ${endDate}`
          )
        )
        .groupBy(userSessions.userId);
      
      // Count active users based on recent post activity
      const [activePosters] = await db
        .select({ count: count() })
        .from(posts)
        .where(
          and(
            sql`${posts.createdAt} >= ${startDate}`,
            sql`${posts.createdAt} <= ${endDate}`
          )
        )
        .groupBy(posts.userId);
      
      // Get total users count
      const [totalUsers] = await db
        .select({ count: count() })
        .from(users);
      
      return {
        activeUsers: activeUsers?.count || 0,
        activePosters: activePosters?.count || 0,
        totalUsers: totalUsers?.count || 0,
        activePercentage: totalUsers?.count > 0
          ? (activeUsers?.count || 0) / totalUsers.count * 100
          : 0,
        timeRange: timeRange
      };
    } catch (error) {
      logger.error('Error getting active user stats', undefined, error as Error, 'server');
      return {
        activeUsers: 0,
        activePosters: 0,
        totalUsers: 0,
        activePercentage: 0,
        timeRange: timeRange
      };
    }
  }
  
  async getSalesData(timeRange: string): Promise<any> {
    try {
      // Calculate time period for the query
      const endDate = new Date();
      let startDate = new Date();
      let interval = 'day'; // SQL interval type - day, week, month
      
      if (timeRange === '7days') {
        startDate.setDate(endDate.getDate() - 7);
        interval = 'day';
      } else if (timeRange === '30days') {
        startDate.setDate(endDate.getDate() - 30);
        interval = 'day';
      } else if (timeRange === '90days') {
        startDate.setDate(endDate.getDate() - 90);
        interval = 'week';
      } else if (timeRange === '12months') {
        startDate.setMonth(endDate.getMonth() - 12);
        interval = 'month';
      }
      
      // Get sales data by interval
      const salesData = await db
        .select({
          date: sql<Date>`date_trunc(${interval}, ${orders.createdAt})`,
          orderCount: count(),
          revenue: sql<number>`SUM(${orders.totalAmount})`
        })
        .from(orders)
        .where(
          and(
            eq(orders.paymentStatus, 'completed'),
            sql`${orders.createdAt} >= ${startDate}`,
            sql`${orders.createdAt} <= ${endDate}`
          )
        )
        .groupBy(sql`date_trunc(${interval}, ${orders.createdAt})`)
        .orderBy(sql`date_trunc(${interval}, ${orders.createdAt})`);
      
      return {
        labels: salesData.map(d => new Date(d.date).toISOString().split('T')[0]),
        orderCounts: salesData.map(d => d.orderCount),
        revenue: salesData.map(d => d.revenue),
        timeRange: timeRange
      };
    } catch (error) {
      logger.error('Error getting sales data', undefined, error as Error, 'server');
      return {
        labels: [],
        orderCounts: [],
        revenue: [],
        timeRange: timeRange
      };
    }
  }
  
  async getProductCategoryDistribution(): Promise<any> {
    try {
      // Get product counts by category
      const categoryDistribution = await db
        .select({
          category: products.category,
          categoryName: categories.name,
          count: count()
        })
        .from(products)
        .leftJoin(categories, eq(products.category, categories.name))
        .groupBy(products.category, categories.name);
      
      // Calculate total products
      const totalProducts = categoryDistribution.reduce((sum, category) => sum + category.count, 0);
      
      // Calculate percentages
      const distribution = categoryDistribution.map(category => ({
        name: category.categoryName,
        value: category.count,
        percentage: totalProducts > 0 ? (category.count / totalProducts * 100).toFixed(2) : 0
      }));
      
      return {
        labels: distribution.map(d => d.name),
        data: distribution.map(d => d.value),
        percentages: distribution.map(d => d.percentage)
      };
    } catch (error) {
      logger.error('Error getting product category distribution', undefined, error as Error, 'server');
      return {
        labels: [],
        data: [],
        percentages: []
      };
    }
  }
  
  async getTrafficSourcesData(timeRange: string): Promise<any> {
    try {
      // Calculate time period for the query
      const endDate = new Date();
      let startDate = new Date();
      
      if (timeRange === '7days') {
        startDate.setDate(endDate.getDate() - 7);
      } else if (timeRange === '30days') {
        startDate.setDate(endDate.getDate() - 30);
      } else if (timeRange === '90days') {
        startDate.setDate(endDate.getDate() - 90);
      } else if (timeRange === '12months') {
        startDate.setMonth(endDate.getMonth() - 12);
      }
      
      // Get traffic sources from analytics table
      const trafficSources = await db
        .select({
          source: trafficAnalytics.source,
          sessions: sql`SUM(${trafficAnalytics.sessions})`,
          conversions: sql`SUM(${trafficAnalytics.conversions})`,
          revenue: sql`SUM(${trafficAnalytics.revenue})`
        })
        .from(trafficAnalytics)
        .where(
          and(
            sql`${trafficAnalytics.date} >= ${startDate}`,
            sql`${trafficAnalytics.date} <= ${endDate}`
          )
        )
        .groupBy(trafficAnalytics.source)
        .orderBy(desc(sql`SUM(${trafficAnalytics.sessions})`));
      
      return {
        sources: trafficSources.map(s => s.source),
        sessions: trafficSources.map(s => s.sessions),
        conversions: trafficSources.map(s => s.conversions),
        revenue: trafficSources.map(s => s.revenue),
        timeRange: timeRange
      };
    } catch (error) {
      logger.error('Error getting traffic sources data', undefined, error as Error, 'server');
      return {
        sources: ['Direct', 'Social', 'Search', 'Referral'],
        sessions: [0, 0, 0, 0],
        conversions: [0, 0, 0, 0],
        revenue: [0, 0, 0, 0],
        timeRange: timeRange
      };
    }
  }
  
  // Order operations
  async getOrder(id: number): Promise<any> {
    try {
      const [order] = await db
        .select()
        .from(orders)
        .where(eq(orders.id, id));
      
      if (!order) {
        return undefined;
      }
      
      // Get order items
      const orderItemsData = await db
        .select({
          item: orderItems,
          product: {
            id: products.id,
            name: products.name,
            image: products.imageUrl
          }
        })
        .from(orderItems)
        .leftJoin(products, eq(orderItems.productId, products.id))
        .where(eq(orderItems.orderId, id));
      
      // Get user details
      const user = await this.getUser(order.userId);
      
      return {
        ...order,
        items: orderItemsData.map((item: any) => ({
          ...item.item,
          product: item.product
        })),
        user: user ? {
          id: user.id,
          username: user.username,
          name: user.name,
          email: user.email
        } : null
      };
    } catch (error) {
      logger.error('Error getting order', undefined, error as Error, 'server');
      return undefined;
    }
  }
  
  async updateOrder(id: number, updates: any): Promise<any> {
    try {
      const [updatedOrder] = await db
        .update(orders)
        .set(updates)
        .where(eq(orders.id, id))
        .returning();
      
      return updatedOrder;
    } catch (error) {
      logger.error('Error updating order', undefined, error as Error, 'server');
      return undefined;
    }
  }
  
  async updateOrderItemsStatus(orderId: number, status: string): Promise<boolean> {
    try {
      await db
        .update(orderItems)
        .set({ status })
        .where(eq(orderItems.orderId, orderId));
      
      return true;
    } catch (error) {
      logger.error('Error updating order items status', undefined, error as Error, 'server');
      return false;
    }
  }
  
  async deleteUser(userId: number): Promise<boolean> {
    try {
      await db.delete(users).where(eq(users.id, userId));
      return true;
    } catch (error) {
      logger.error('Error deleting user', undefined, error as Error, 'server');
      return false;
    }
  }
  
  async resetUserPassword(userId: number, newPassword: string): Promise<boolean> {
    try {
      // Hash the new password
      const hashedPassword = await hashPassword(newPassword);
      
      // Update the user's password
      await db
        .update(users)
        .set({
          password: hashedPassword,
          updatedAt: new Date()
        })
        .where(eq(users.id, userId));
      
      return true;
    } catch (error) {
      logger.error('Error resetting user password', undefined, error as Error, 'server');
      return false;
    }
  }
  
  async listPosts(options: any): Promise<any[]> {
    try {
      let query = db.select({
        post: posts,
        user: {
          id: users.id,
          username: users.username,
          name: users.name,
          avatar: users.avatar
        }
      })
      .from(posts)
      .leftJoin(users, eq(posts.userId, users.id))
      .$dynamic();
      
      // Apply filters
      if (options.isFlagged !== undefined) {
        query = query.where(eq(posts.isFlagged, options.isFlagged));
      }
      
      if (options.reviewStatus) {
        query = query.where(eq(posts.reviewStatus, options.reviewStatus));
      }
      
      if (options.search) {
        query = query.where(
          or(
            like(posts.content, `%${options.search}%`),
            like(posts.title, `%${options.search}%`)
          )
        );
      }
      
      // Apply pagination
      if (options.limit) {
        query = query.limit(options.limit);
      }
      
      if (options.offset) {
        query = query.offset(options.offset);
      }
      
      // Order by creation date (newest first)
      query = query.orderBy(desc(posts.createdAt));
      
      const result = await query;
      
      // Format the results
      return result.map(item => ({
        ...item.post,
        user: item.user
      }));
    } catch (error) {
      logger.error('Error listing posts', undefined, error as Error, 'server');
      return [];
    }
  }
  
  // Auth token operations
  async getAuthToken(token: string): Promise<any | undefined> {
    try {
      const [authToken] = await db.select().from(authTokens).where(eq(authTokens.token, token));
      return authToken;
    } catch (error) {
      logger.error('Error getting auth token', undefined, error as Error, 'server');
      return undefined;
    }
  }

  async createAuthToken(tokenData: any): Promise<any> {
    try {
      const [newToken] = await db.insert(authTokens).values(tokenData).returning();
      return newToken;
    } catch (error) {
      logger.error('Error creating auth token', undefined, error as Error, 'server');
      throw new Error('Failed to create auth token');
    }
  }

  async revokeAuthToken(id: number, reason: string = 'User initiated'): Promise<boolean> {
    try {
      await db
        .update(authTokens)
        .set({ 
          isRevoked: true, 
          revokedReason: reason,
          lastActiveAt: new Date()
        })
        .where(eq(authTokens.id, id));
      return true;
    } catch (error) {
      logger.error('Error revoking auth token', undefined, error as Error, 'server');
      return false;
    }
  }

  async updateTokenLastActive(id: number): Promise<boolean> {
    try {
      await db
        .update(authTokens)
        .set({ 
          lastActiveAt: new Date()
        })
        .where(eq(authTokens.id, id));
      return true;
    } catch (error) {
      logger.error('Error updating token last active', undefined, error as Error, 'server');
      return false;
    }
  }

  async revokeAllUserTokens(userId: number, reason: string = 'Security measure'): Promise<boolean> {
    try {
      await db
        .update(authTokens)
        .set({ 
          isRevoked: true, 
          revokedReason: reason,
          lastActiveAt: new Date()
        })
        .where(
          and(
            eq(authTokens.userId, userId),
            eq(authTokens.isRevoked, false)
          )
        );
      return true;
    } catch (error) {
      logger.error('Error revoking all user tokens', undefined, error as Error, 'server');
      return false;
    }
  }

  async revokeAllUserTokensExcept(userId: number, tokenId: number): Promise<boolean> {
    try {
      await db
        .update(authTokens)
        .set({ 
          isRevoked: true, 
          revokedReason: 'Revoked by user (logout from all other devices)',
          lastActiveAt: new Date()
        })
        .where(
          and(
            eq(authTokens.userId, userId),
            eq(authTokens.isRevoked, false),
            sql`${authTokens.id} != ${tokenId}`
          )
        );
      return true;
    } catch (error) {
      logger.error('Error revoking all user tokens except current', undefined, error as Error, 'server');
      return false;
    }
  }

  async revokeSpecificToken(userId: number, tokenId: number): Promise<boolean> {
    try {
      const [token] = await db
        .select()
        .from(authTokens)
        .where(
          and(
            eq(authTokens.id, tokenId),
            eq(authTokens.userId, userId)
          )
        );
      
      if (!token) {
        return false;
      }
      
      return await this.revokeAuthToken(tokenId, 'Revoked by user');
    } catch (error) {
      logger.error('Error revoking specific token', undefined, error as Error, 'server');
      return false;
    }
  }

  async cleanupExpiredTokens(): Promise<void> {
    try {
      // Revoke expired tokens
      await db
        .update(authTokens)
        .set({ 
          isRevoked: true, 
          revokedReason: 'Token expired',
          lastActiveAt: new Date()
        })
        .where(
          and(
            eq(authTokens.isRevoked, false),
            sql`${authTokens.expiresAt} < CURRENT_TIMESTAMP`
          )
        );
      
      // Optional: delete very old tokens (e.g., more than 30 days old)
      await db
        .delete(authTokens)
        .where(sql`${authTokens.expiresAt} < CURRENT_TIMESTAMP - INTERVAL '30 days'`);
    } catch (error) {
      logger.error('Error cleaning up expired tokens', undefined, error as Error, 'server');
    }
  }

  async incrementLoginAttempts(userId: number): Promise<void> {
    try {
      await db
        .update(users)
        .set({ 
          failedLoginAttempts: sql`COALESCE(${users.failedLoginAttempts}, 0) + 1`,
          updatedAt: new Date()
        })
        .where(eq(users.id, userId));
    } catch (error) {
      logger.error('Error incrementing login attempts', undefined, error as Error, 'server');
    }
  }

  async resetLoginAttempts(userId: number): Promise<void> {
    try {
      await db
        .update(users)
        .set({ 
          failedLoginAttempts: 0,
          updatedAt: new Date()
        })
        .where(eq(users.id, userId));
    } catch (error) {
      logger.error('Error resetting login attempts', undefined, error as Error, 'server');
    }
  }

  async lockUserAccount(userId: number, lock: boolean): Promise<void> {
    try {
      await db
        .update(users)
        .set({ 
          isLocked: lock,
          updatedAt: new Date()
        })
        .where(eq(users.id, userId));
    } catch (error) {
      logger.error('Error locking/unlocking user account', undefined, error as Error, 'server');
    }
  }

  // Additional messaging methods
  async getConversations(userId: number): Promise<any[]> {
    return this.getUserConversations(userId);
  }

  async markMessagesAsRead(currentUserId: number, otherUserId: number): Promise<void> {
    try {
      await db
        .update(messages)
        .set({ isRead: true })
        .where(
          and(
            eq(messages.receiverId, currentUserId),
            eq(messages.senderId, otherUserId),
            eq(messages.isRead, false)
          )
        );
    } catch (error) {
      logger.error('Error marking messages as read', undefined, error as Error, 'server');
      throw error;
    }
  }

  async deleteMessage(id: number, userId?: number): Promise<boolean> {
    try {
      if (userId) {
        // Only allow deletion if the user is the sender
        const [message] = await db
          .select()
          .from(messages)
          .where(and(eq(messages.id, id), eq(messages.senderId, userId)));
        
        if (!message) {
          return false;
        }
      }

      await db.delete(messages).where(eq(messages.id, id));
      return true;
    } catch (error) {
      logger.error('Error deleting message', undefined, error as Error, 'server');
      return false;
    }
  }

  // Missing methods from interface
  async checkPostLike(postId: number, userId: number): Promise<boolean> {
    try {
      const [existingLike] = await db
        .select()
        .from(likes)
        .where(and(eq(likes.postId, postId), eq(likes.userId, userId)))
        .limit(1);
      
      return !!existingLike;
    } catch (error) {
      logger.error('Error checking if user liked post', undefined, error as Error, 'server');
      return false;
    }
  }

  async checkPostSave(postId: number, userId: number): Promise<boolean> {
    try {
      const [existingSave] = await db
        .select()
        .from(savedPosts)
        .where(and(eq(savedPosts.postId, postId), eq(savedPosts.userId, userId)));
      
      return !!existingSave;
    } catch (error) {
      logger.error('Error checking if user saved post', undefined, error as Error, 'server');
      return false;
    }
  }

  async getUserFeed(userId: number, limit: number = 10, offset: number = 0): Promise<Post[]> {
    try {
      logger.debug(`getUserFeed called for user ${userId}`, 'server');
      const userFeed = await db
        .select({
          post: posts,
          user: {
            id: users.id,
            username: users.username,
            name: users.name,
            avatar: users.avatar,
            isVendor: users.isVendor,
            city: users.city,
            country: users.country,
            region: users.region
          },
          product: {
            id: products.id,
            name: products.name,
            description: products.description,
            price: products.price,
            discountPrice: products.discountPrice,
            imageUrl: products.imageUrl,
            category: products.category,
            stock: products.inventory,
            vendorId: products.vendorId
          },
          vendor: {
            id: vendors.id,
            storeName: vendors.storeName,
            businessName: vendors.businessName,
            rating: vendors.rating
          }
        })
        .from(posts)
        .leftJoin(users, eq(posts.userId, users.id))
        .leftJoin(follows, and(eq(follows.followingId, posts.userId), eq(follows.followerId, userId)))
        .leftJoin(products, eq(posts.productId, products.id))
        .leftJoin(vendors, eq(products.vendorId, vendors.id))
        .where(
          and(
            eq(posts.publishStatus, 'published'), // Only show published posts
            or(
              eq(posts.userId, userId), // User's own posts
              eq(follows.followerId, userId) // Posts from followed users
            )
          )
        )
        .orderBy(desc(posts.createdAt))
        .limit(limit)
        .offset(offset);

      logger.debug('Found posts for user feed', { count: userFeed.length, firstUser: userFeed[0]?.user }, 'server');
      
      const result = userFeed.map(({ post, user, product, vendor }) => ({
        ...post,
        user: user ? {
          id: user.id,
          username: user.username,
          name: user.name,
          avatar: user.avatar,
          isVendor: user.isVendor,
          city: user.city,
          country: user.country,
          region: user.region
        } : {
          id: 0,
          username: 'Unknown',
          name: 'Unknown User',
          avatar: null,
          isVendor: false,
          city: null,
          country: null,
          region: null
        },
        // Add complete product information if post has a productId
        product: product ? {
          id: product.id,
          name: product.name,
          description: product.description,
          price: product.price,
          discountPrice: product.discountPrice,
          imageUrl: product.imageUrl,
          category: product.category,
          stock: product.stock,
          vendorId: product.vendorId,
          vendorName: vendor?.storeName || vendor?.businessName || 'Unknown Vendor'
        } : null
      })) as Post[];
      
      return result;
    } catch (error) {
      logger.error('Error getting user feed', undefined, error as Error, 'server');
      return [];
    }
  }

  async getUserFollowerCount(userId: number): Promise<number> {
    return this.getFollowersCount(userId);
  }

  // Liked products operations
  async likeProduct(userId: number, productId: number): Promise<LikedProduct> {
    try {
      const [likedProduct] = await db
        .insert(likedProducts)
        .values({ userId, productId })
        .returning();
      return likedProduct;
    } catch (error) {
      logger.error('Error liking product', undefined, error as Error, 'server');
      throw error;
    }
  }

  async unlikeProduct(userId: number, productId: number): Promise<boolean> {
    try {
      const result = await db
        .delete(likedProducts)
        .where(and(eq(likedProducts.userId, userId), eq(likedProducts.productId, productId)));
      return true;
    } catch (error) {
      logger.error('Error unliking product', undefined, error as Error, 'server');
      return false;
    }
  }

  async checkProductLiked(userId: number, productId: number): Promise<boolean> {
    try {
      const [liked] = await db
        .select()
        .from(likedProducts)
        .where(and(eq(likedProducts.userId, userId), eq(likedProducts.productId, productId)))
        .limit(1);
      return !!liked;
    } catch (error) {
      logger.error('Error checking if product is liked', undefined, error as Error, 'server');
      return false;
    }
  }

  async getUserLikedProducts(userId: number): Promise<Product[]> {
    try {
      const likedProductsData = await db
        .select({
          product: products,
          vendor: vendors,
        })
        .from(likedProducts)
        .innerJoin(products, eq(likedProducts.productId, products.id))
        .innerJoin(vendors, eq(products.vendorId, vendors.id))
        .where(eq(likedProducts.userId, userId))
        .orderBy(desc(likedProducts.createdAt));

      return likedProductsData.map(({ product, vendor }) => ({
        ...product,
        vendor: vendor.storeName
      })) as Product[];
    } catch (error) {
      logger.error('Error getting user liked products', undefined, error as Error, 'server');
      return [];
    }
  }

  async getUserLikedProductsCount(userId: number): Promise<number> {
    try {
      const [result] = await db
        .select({ count: sql<number>`count(*)` })
        .from(likedProducts)
        .where(eq(likedProducts.userId, userId));
      
      return result?.count || 0;
    } catch (error) {
      logger.error('Error getting user liked products count', undefined, error as Error, 'server');
      return 0;
    }
  }

  async getUserFollowingCount(userId: number): Promise<number> {
    return this.getFollowingCount(userId);
  }

  async getPostsByRegion(userId: number, limit: number, offset: number): Promise<Post[]> {
    try {
      // First get the current user's region
      const [currentUser] = await db.select({ region: users.region }).from(users).where(eq(users.id, userId));
      
      if (!currentUser || !currentUser.region) {
        // If user has no region set, return empty array
        return [];
      }

      // Get posts from users in the same region with product and vendor joins
      const regionPosts = await db
        .select({
          post: posts,
          user: {
            id: users.id,
            username: users.username,
            name: users.name,
            avatar: users.avatar,
            isVendor: users.isVendor
          },
          product: {
            id: products.id,
            name: products.name,
            description: products.description,
            price: products.price,
            discountPrice: products.discountPrice,
            imageUrl: products.imageUrl,
            category: products.category,
            stock: products.inventory,
            vendorId: products.vendorId
          },
          vendor: {
            id: vendors.id,
            storeName: vendors.storeName,
            businessName: vendors.businessName,
            rating: vendors.rating
          }
        })
        .from(posts)
        .leftJoin(users, eq(posts.userId, users.id))
        .leftJoin(products, eq(posts.productId, products.id))
        .leftJoin(vendors, eq(products.vendorId, vendors.id))
        .where(
          and(
            eq(posts.publishStatus, 'published'), // Only show published posts
            eq(users.region, currentUser.region)
          )
        )
        .orderBy(desc(posts.createdAt))
        .limit(limit)
        .offset(offset);

      // Transform the results to match the Post interface
      return regionPosts.map(row => ({
        ...row.post,
        user: row.user || {
          id: 0,
          username: 'Unknown',
          name: 'Unknown User',
          avatar: null,
          isVendor: false
        },
        product: row.product && row.product.id ? {
          id: row.product.id,
          name: row.product.name,
          description: row.product.description,
          price: row.product.price,
          discountPrice: row.product.discountPrice,
          imageUrl: row.product.imageUrl,
          category: row.product.category,
          stock: row.product.stock,
          vendorId: row.product.vendorId,
          vendorName: row.vendor?.storeName || row.vendor?.businessName
        } : null
      })) as Post[];
    } catch (error) {
      logger.error('Error getting posts by region', undefined, error as Error, 'server');
      return [];
    }
  }

  async getPostsByCountry(userId: number, limit: number, offset: number): Promise<Post[]> {
    try {
      // First get the current user's country
      const [currentUser] = await db.select({ country: users.country }).from(users).where(eq(users.id, userId));
      
      if (!currentUser || !currentUser.country) {
        // If user has no country set, return empty array
        return [];
      }

      // Get posts from users in the same country with product and vendor joins
      const countryPosts = await db
        .select({
          post: posts,
          user: {
            id: users.id,
            username: users.username,
            name: users.name,
            avatar: users.avatar,
            isVendor: users.isVendor
          },
          product: {
            id: products.id,
            name: products.name,
            description: products.description,
            price: products.price,
            discountPrice: products.discountPrice,
            imageUrl: products.imageUrl,
            category: products.category,
            stock: products.inventory,
            vendorId: products.vendorId
          },
          vendor: {
            id: vendors.id,
            storeName: vendors.storeName,
            businessName: vendors.businessName,
            rating: vendors.rating
          }
        })
        .from(posts)
        .leftJoin(users, eq(posts.userId, users.id))
        .leftJoin(products, eq(posts.productId, products.id))
        .leftJoin(vendors, eq(products.vendorId, vendors.id))
        .where(
          and(
            eq(posts.publishStatus, 'published'), // Only show published posts
            eq(users.country, currentUser.country)
          )
        )
        .orderBy(desc(posts.createdAt))
        .limit(limit)
        .offset(offset);

      // Transform the results to match the Post interface
      return countryPosts.map(row => ({
        ...row.post,
        user: row.user || {
          id: 0,
          username: 'Unknown',
          name: 'Unknown User',
          avatar: null,
          isVendor: false
        },
        product: row.product && row.product.id ? {
          id: row.product.id,
          name: row.product.name,
          description: row.product.description,
          price: row.product.price,
          discountPrice: row.product.discountPrice,
          imageUrl: row.product.imageUrl,
          category: row.product.category,
          stock: row.product.stock,
          vendorId: row.product.vendorId,
          vendorName: row.vendor?.storeName || row.vendor?.businessName
        } : null
      })) as Post[];
    } catch (error) {
      logger.error('Error getting posts by country', undefined, error as Error, 'server');
      return [];
    }
  }

  // Add missing methods for API endpoints
  async getProducts(): Promise<Product[]> {
    try {
      return await db.select().from(products).orderBy(desc(products.createdAt));
    } catch (error) {
      logger.error('Error getting products', undefined, error as Error, 'server');
      return [];
    }
  }

  async getPopularProducts(): Promise<Product[]> {
    try {
      // Return products ordered by creation date since rating column may not exist
      return await db.select().from(products)
        .orderBy(desc(products.createdAt))
        .limit(10);
    } catch (error) {
      logger.error('Error getting popular products', undefined, error as Error, 'server');
      return [];
    }
  }

  async deletePost(id: number, userId?: number): Promise<boolean> {
    try {
      if (userId) {
        // Verify the user owns the post or is admin
        const [post] = await db.select().from(posts).where(eq(posts.id, id));
        if (!post || (post.userId !== userId)) {
          return false;
        }
      }
      
      await db.delete(posts).where(eq(posts.id, id));
      return true;
    } catch (error) {
      logger.error('Error deleting post', undefined, error as Error, 'server');
      return false;
    }
  }

  // Friend request operations
  async createFriendRequest(request: { senderId: number, recipientId: number, message: string }): Promise<any> {
    try {
      const [friendRequest] = await db
        .insert(friendRequests)
        .values({
          senderId: request.senderId,
          recipientId: request.recipientId,
          message: request.message,
          status: 'pending'
        })
        .returning();
      return friendRequest;
    } catch (error) {
      logger.error('Error creating friend request', undefined, error as Error, 'server');
      throw error;
    }
  }

  async getFriendRequest(senderId: number, recipientId: number): Promise<any> {
    try {
      const [friendRequest] = await db
        .select()
        .from(friendRequests)
        .where(and(
          eq(friendRequests.senderId, senderId),
          eq(friendRequests.recipientId, recipientId),
          eq(friendRequests.status, 'pending')
        ))
        .limit(1);
      return friendRequest;
    } catch (error) {
      logger.error('Error getting friend request', undefined, error as Error, 'server');
      return undefined;
    }
  }

  async getFriendRequests(userId: number): Promise<any[]> {
    try {
      const requests = await db
        .select({
          id: friendRequests.id,
          senderId: friendRequests.senderId,
          recipientId: friendRequests.recipientId,
          message: friendRequests.message,
          status: friendRequests.status,
          createdAt: friendRequests.createdAt,
          sender: {
            id: users.id,
            name: users.name,
            username: users.username,
            avatar: users.avatar
          }
        })
        .from(friendRequests)
        .innerJoin(users, eq(friendRequests.senderId, users.id))
        .where(and(
          eq(friendRequests.recipientId, userId),
          eq(friendRequests.status, 'pending')
        ))
        .orderBy(desc(friendRequests.createdAt));
      return requests;
    } catch (error) {
      logger.error('Error getting friend requests', undefined, error as Error, 'server');
      return [];
    }
  }

  async acceptFriendRequest(requestId: number, userId: number): Promise<void> {
    try {
      // First get the friend request
      const [request] = await db
        .select()
        .from(friendRequests)
        .where(and(
          eq(friendRequests.id, requestId),
          eq(friendRequests.recipientId, userId),
          eq(friendRequests.status, 'pending')
        ));

      if (!request) {
        throw new Error('Friend request not found');
      }

      // Update the friend request status
      await db
        .update(friendRequests)
        .set({ status: 'accepted' })
        .where(eq(friendRequests.id, requestId));

      // Create mutual connections
      await db.insert(connections).values({
        userId: request.senderId,
        connectedUserId: request.recipientId,
        initiatedBy: request.senderId,
        status: 'active'
      });

      await db.insert(connections).values({
        userId: request.recipientId,
        connectedUserId: request.senderId,
        initiatedBy: request.senderId,
        status: 'active'
      });
    } catch (error) {
      logger.error('Error accepting friend request', undefined, error as Error, 'server');
      throw error;
    }
  }

  async rejectFriendRequest(requestId: number, userId: number): Promise<void> {
    try {
      await db
        .update(friendRequests)
        .set({ status: 'rejected' })
        .where(and(
          eq(friendRequests.id, requestId),
          eq(friendRequests.recipientId, userId),
          eq(friendRequests.status, 'pending')
        ));
    } catch (error) {
      logger.error('Error rejecting friend request', undefined, error as Error, 'server');
      throw error;
    }
  }

  // Category-specific message methods
  async getMessagesByCategory(userId: number, category: 'marketplace' | 'community' | 'dating'): Promise<any[]> {
    try {
      const results = await db
        .select({
          id: messages.id,
          senderId: messages.senderId,
          receiverId: messages.receiverId,
          content: messages.content,
          attachmentUrl: messages.attachmentUrl,
          attachmentType: messages.attachmentType,
          isRead: messages.isRead,
          messageType: messages.messageType,
          category: messages.category,
          createdAt: messages.createdAt,
          sender: {
            id: users.id,
            name: users.name,
            username: users.username,
            avatar: users.avatar
          }
        })
        .from(messages)
        .innerJoin(users, eq(messages.senderId, users.id))
        .where(and(
          or(eq(messages.senderId, userId), eq(messages.receiverId, userId)),
          eq(messages.category, category)
        ))
        .orderBy(desc(messages.createdAt));
      
      return results;
    } catch (error) {
      logger.error('Error getting messages', { category }, error as Error, 'server');
      return [];
    }
  }

  async getConversationsByCategory(userId: number, category: 'marketplace' | 'community' | 'dating'): Promise<any[]> {
    try {
      const results = await db
        .select({
          id: messages.id,
          senderId: messages.senderId,
          receiverId: messages.receiverId,
          content: messages.content,
          isRead: messages.isRead,
          category: messages.category,
          createdAt: messages.createdAt,
          otherUser: {
            id: users.id,
            name: users.name,
            username: users.username,
            avatar: users.avatar
          }
        })
        .from(messages)
        .innerJoin(users, 
          or(
            and(eq(messages.senderId, users.id), eq(messages.receiverId, userId)),
            and(eq(messages.receiverId, users.id), eq(messages.senderId, userId))
          )
        )
        .where(and(
          or(eq(messages.senderId, userId), eq(messages.receiverId, userId)),
          eq(messages.category, category)
        ))
        .orderBy(desc(messages.createdAt));

      // Group by conversation partner and get latest message
      const conversationMap = new Map();
      
      for (const message of results) {
        const otherUserId = message.senderId === userId ? message.receiverId : message.senderId;
        
        if (!conversationMap.has(otherUserId)) {
          conversationMap.set(otherUserId, {
            id: otherUserId,
            otherUser: message.otherUser,
            lastMessage: message,
            unreadCount: 0
          });
        }
        
        // Count unread messages from the other user
        if (message.receiverId === userId && !message.isRead) {
          conversationMap.get(otherUserId).unreadCount++;
        }
      }
      
      return Array.from(conversationMap.values());
    } catch (error) {
      logger.error('Error getting conversations', { category }, error as Error, 'server');
      return [];
    }
  }

  async getUnreadCountByCategory(userId: number, category: 'marketplace' | 'community' | 'dating'): Promise<number> {
    try {
      const [result] = await db
        .select({ count: count() })
        .from(messages)
        .where(and(
          eq(messages.receiverId, userId),
          eq(messages.isRead, false),
          eq(messages.category, category)
        ));
      
      return result?.count || 0;
    } catch (error) {
      logger.error('Error getting unread count', { category }, error as Error, 'server');
      return 0;
    }
  }

  // Alias for getUserConversationsByCategory to match the expected method name
  async getUserConversationsByCategory(userId: number, category: 'marketplace' | 'community' | 'dating'): Promise<any[]> {
    return this.getConversationsByCategory(userId, category);
  }

  // Gift operations
  async createGiftProposition(giftData: InsertGiftProposition): Promise<GiftProposition> {
    try {
      const [newGift] = await db
        .insert(giftPropositions)
        .values(giftData)
        .returning();
      return newGift;
    } catch (error) {
      logger.error('Error creating gift proposition', undefined, error as Error, 'server');
      throw new Error('Failed to create gift proposition');
    }
  }

  async getGiftProposition(id: number): Promise<GiftProposition | undefined> {
    try {
      const [gift] = await db
        .select()
        .from(giftPropositions)
        .where(eq(giftPropositions.id, id));
      return gift;
    } catch (error) {
      logger.error('Error getting gift proposition', undefined, error as Error, 'server');
      return undefined;
    }
  }

  async getUserSentGifts(userId: number): Promise<GiftProposition[]> {
    try {
      const gifts = await db
        .select({
          gift: giftPropositions,
          recipient: {
            id: users.id,
            username: users.username,
            name: users.name,
            avatar: users.avatar
          },
          product: {
            id: products.id,
            name: products.name,
            image: products.imageUrl,
            price: products.price
          }
        })
        .from(giftPropositions)
        .leftJoin(users, eq(giftPropositions.recipientId, users.id))
        .leftJoin(products, eq(giftPropositions.productId, products.id))
        .where(eq(giftPropositions.senderId, userId))
        .orderBy(desc(giftPropositions.createdAt));

      return gifts.map(item => ({
        ...item.gift,
        recipient: item.recipient,
        product: item.product
      })) as GiftProposition[];
    } catch (error) {
      logger.error('Error getting user sent gifts', undefined, error as Error, 'server');
      return [];
    }
  }

  async getUserReceivedGifts(userId: number): Promise<GiftProposition[]> {
    try {
      const gifts = await db
        .select({
          gift: giftPropositions,
          sender: {
            id: users.id,
            username: users.username,
            name: users.name,
            avatar: users.avatar
          },
          product: {
            id: products.id,
            name: products.name,
            image: products.imageUrl,
            price: products.price
          }
        })
        .from(giftPropositions)
        .leftJoin(users, eq(giftPropositions.senderId, users.id))
        .leftJoin(products, eq(giftPropositions.productId, products.id))
        .where(eq(giftPropositions.recipientId, userId))
        .orderBy(desc(giftPropositions.createdAt));

      return gifts.map(item => ({
        ...item.gift,
        sender: item.sender,
        product: item.product
      })) as GiftProposition[];
    } catch (error) {
      logger.error('Error getting user received gifts', undefined, error as Error, 'server');
      return [];
    }
  }

  async updateGiftStatus(id: number, status: string, paymentIntentId?: string): Promise<GiftProposition | undefined> {
    try {
      const updateData: any = {
        status,
        respondedAt: new Date(),
        updatedAt: new Date()
      };

      if (paymentIntentId) {
        updateData.paymentIntentId = paymentIntentId;
      }

      if (status === 'paid') {
        updateData.paidAt = new Date();
      }

      const [updatedGift] = await db
        .update(giftPropositions)
        .set(updateData)
        .where(eq(giftPropositions.id, id))
        .returning();

      return updatedGift;
    } catch (error) {
      logger.error('Error updating gift status', undefined, error as Error, 'server');
      return undefined;
    }
  }

  // Calendar operations
  async createCalendarEvent(eventData: InsertCalendarEvent): Promise<CalendarEvent> {
    try {
      const [newEvent] = await db
        .insert(calendarEvents)
        .values(eventData)
        .returning();
      return newEvent;
    } catch (error) {
      logger.error('Error creating calendar event', undefined, error as Error, 'server');
      throw new Error('Failed to create calendar event');
    }
  }

  async getCalendarEvent(id: number): Promise<CalendarEvent | undefined> {
    try {
      const [event] = await db
        .select()
        .from(calendarEvents)
        .where(eq(calendarEvents.id, id));
      return event;
    } catch (error) {
      logger.error('Error getting calendar event', undefined, error as Error, 'server');
      return undefined;
    }
  }

  async getUserCalendarEvents(userId: number, startDate?: Date, endDate?: Date): Promise<CalendarEvent[]> {
    try {
      let query = db
        .select()
        .from(calendarEvents)
        .$dynamic();

      if (startDate && endDate) {
        query = query.where(and(
          eq(calendarEvents.userId, userId),
          lte(calendarEvents.startDate, endDate),
          gte(calendarEvents.endDate, startDate)
        ));
      } else {
        query = query.where(eq(calendarEvents.userId, userId));
      }

      const events = await query.orderBy(asc(calendarEvents.startDate));
      return events;
    } catch (error) {
      logger.error('Error getting user calendar events', undefined, error as Error, 'server');
      return [];
    }
  }

  async getEventsByCategory(userId: number, category: string): Promise<CalendarEvent[]> {
    try {
      const events = await db
        .select()
        .from(calendarEvents)
        .where(and(
          eq(calendarEvents.userId, userId),
          eq(calendarEvents.category, category as any)
        ))
        .orderBy(asc(calendarEvents.startDate));
      return events;
    } catch (error) {
      logger.error('Error getting events by category', undefined, error as Error, 'server');
      return [];
    }
  }

  async updateCalendarEvent(id: number, userId: number, updates: Partial<CalendarEvent>): Promise<CalendarEvent | undefined> {
    try {
      const [updatedEvent] = await db
        .update(calendarEvents)
        .set({ ...updates, updatedAt: new Date() })
        .where(and(
          eq(calendarEvents.id, id),
          eq(calendarEvents.userId, userId)
        ))
        .returning();
      return updatedEvent;
    } catch (error) {
      logger.error('Error updating calendar event', undefined, error as Error, 'server');
      return undefined;
    }
  }

  async deleteCalendarEvent(id: number, userId: number): Promise<boolean> {
    try {
      const result = await db
        .delete(calendarEvents)
        .where(and(
          eq(calendarEvents.id, id),
          eq(calendarEvents.userId, userId)
        ));
      return result.rowCount !== null && result.rowCount > 0;
    } catch (error) {
      logger.error('Error deleting calendar event', undefined, error as Error, 'server');
      return false;
    }
  }

  async getUpcomingEvents(userId: number, limit: number = 10): Promise<CalendarEvent[]> {
    try {
      const now = new Date();
      const events = await db
        .select()
        .from(calendarEvents)
        .where(and(
          eq(calendarEvents.userId, userId),
          gte(calendarEvents.startDate, now),
          eq(calendarEvents.isCancelled, false)
        ))
        .orderBy(asc(calendarEvents.startDate))
        .limit(limit);
      return events;
    } catch (error) {
      logger.error('Error getting upcoming events', undefined, error as Error, 'server');
      return [];
    }
  }

  async getEventReminders(userId: number): Promise<CalendarEventReminder[]> {
    try {
      const reminders = await db
        .select()
        .from(calendarEventReminders)
        .where(and(
          eq(calendarEventReminders.userId, userId),
          eq(calendarEventReminders.isSent, false)
        ))
        .orderBy(asc(calendarEventReminders.reminderTime));
      return reminders;
    } catch (error) {
      logger.error('Error getting event reminders', undefined, error as Error, 'server');
      return [];
    }
  }

  async createEventReminder(reminderData: InsertCalendarEventReminder): Promise<CalendarEventReminder> {
    try {
      const [newReminder] = await db
        .insert(calendarEventReminders)
        .values(reminderData)
        .returning();
      return newReminder;
    } catch (error) {
      logger.error('Error creating event reminder', undefined, error as Error, 'server');
      throw new Error('Failed to create event reminder');
    }
  }

  async updateEventReminder(id: number, updates: Partial<CalendarEventReminder>): Promise<CalendarEventReminder | undefined> {
    try {
      const [updatedReminder] = await db
        .update(calendarEventReminders)
        .set(updates)
        .where(eq(calendarEventReminders.id, id))
        .returning();
      return updatedReminder;
    } catch (error) {
      logger.error('Error updating event reminder', undefined, error as Error, 'server');
      return undefined;
    }
  }

  async getEventParticipants(eventId: number): Promise<Array<{ participant: CalendarEventParticipant; user: { id: number; username: string; name: string | null; avatar: string | null } }>> {
    try {
      const participants = await db
        .select({
          participant: calendarEventParticipants,
          user: {
            id: users.id,
            username: users.username,
            name: users.name,
            avatar: users.avatar
          }
        })
        .from(calendarEventParticipants)
        .leftJoin(users, eq(calendarEventParticipants.userId, users.id))
        .where(eq(calendarEventParticipants.eventId, eventId));
      
      return participants.filter(p => p.user !== null) as Array<{ participant: CalendarEventParticipant; user: { id: number; username: string; name: string | null; avatar: string | null } }>;
    } catch (error) {
      logger.error('Error getting event participants', undefined, error as Error, 'server');
      return [];
    }
  }

  async addEventParticipant(participantData: InsertCalendarEventParticipant): Promise<CalendarEventParticipant> {
    try {
      const [newParticipant] = await db
        .insert(calendarEventParticipants)
        .values(participantData)
        .returning();
      return newParticipant;
    } catch (error) {
      logger.error('Error adding event participant', undefined, error as Error, 'server');
      throw new Error('Failed to add event participant');
    }
  }

  async updateParticipantStatus(eventId: number, userId: number, status: string): Promise<CalendarEventParticipant | undefined> {
    try {
      const [updatedParticipant] = await db
        .update(calendarEventParticipants)
        .set({ status, responseAt: new Date() })
        .where(and(
          eq(calendarEventParticipants.eventId, eventId),
          eq(calendarEventParticipants.userId, userId)
        ))
        .returning();
      return updatedParticipant;
    } catch (error) {
      logger.error('Error updating participant status', undefined, error as Error, 'server');
      return undefined;
    }
  }

  async searchCalendarEvents(userId: number, query: string): Promise<CalendarEvent[]> {
    try {
      const searchPattern = `%${query.toLowerCase()}%`;
      const events = await db
        .select()
        .from(calendarEvents)
        .where(and(
          eq(calendarEvents.userId, userId),
          or(
            ilike(calendarEvents.title, searchPattern),
            ilike(calendarEvents.description, searchPattern),
            ilike(calendarEvents.location, searchPattern),
            ilike(calendarEvents.people, searchPattern),
            ilike(calendarEvents.notes, searchPattern)
          )
        ))
        .orderBy(desc(calendarEvents.startDate));
      return events;
    } catch (error) {
      logger.error('Error searching calendar events', undefined, error as Error, 'server');
      return [];
    }
  }

  // Calendar event file operations
  async addCalendarEventAttachment(eventId: number, userId: number, attachment: CalendarEventAttachment): Promise<CalendarEvent | undefined> {
    try {
      const hasAccess = await this.checkEventParticipantAccess(eventId, userId);
      if (!hasAccess) {
        throw new Error('User does not have access to this event');
      }

      const event = await this.getCalendarEvent(eventId);
      if (!event) {
        throw new Error('Event not found');
      }

      const currentAttachments = (event.attachments as CalendarEventAttachment[]) || [];
      const updatedAttachments = [...currentAttachments, attachment];

      const [updatedEvent] = await db
        .update(calendarEvents)
        .set({ attachments: updatedAttachments })
        .where(eq(calendarEvents.id, eventId))
        .returning();

      return updatedEvent;
    } catch (error) {
      logger.error('Error adding calendar event attachment', undefined, error as Error, 'server');
      throw error;
    }
  }

  async getCalendarEventAttachments(eventId: number): Promise<CalendarEventAttachment[]> {
    try {
      const event = await this.getCalendarEvent(eventId);
      if (!event) {
        return [];
      }
      return (event.attachments as CalendarEventAttachment[]) || [];
    } catch (error) {
      logger.error('Error getting calendar event attachments', undefined, error as Error, 'server');
      return [];
    }
  }

  async deleteCalendarEventAttachment(eventId: number, userId: number, attachmentId: string): Promise<CalendarEvent | undefined> {
    try {
      const hasAccess = await this.checkEventParticipantAccess(eventId, userId);
      if (!hasAccess) {
        throw new Error('User does not have access to this event');
      }

      const event = await this.getCalendarEvent(eventId);
      if (!event) {
        throw new Error('Event not found');
      }

      const currentAttachments = (event.attachments as CalendarEventAttachment[]) || [];
      const updatedAttachments = currentAttachments.filter((att) => att.id !== attachmentId);

      const [updatedEvent] = await db
        .update(calendarEvents)
        .set({ attachments: updatedAttachments })
        .where(eq(calendarEvents.id, eventId))
        .returning();

      return updatedEvent;
    } catch (error) {
      logger.error('Error deleting calendar event attachment', undefined, error as Error, 'server');
      throw error;
    }
  }

  async checkEventParticipantAccess(eventId: number, userId: number): Promise<boolean> {
    try {
      const event = await this.getCalendarEvent(eventId);
      if (!event) {
        return false;
      }

      if (event.userId === userId) {
        return true;
      }

      const [participant] = await db
        .select()
        .from(calendarEventParticipants)
        .where(and(
          eq(calendarEventParticipants.eventId, eventId),
          eq(calendarEventParticipants.userId, userId)
        ));

      return !!participant;
    } catch (error) {
      logger.error('Error checking event participant access', undefined, error as Error, 'server');
      return false;
    }
  }

  // Lifestyle service operations
  async createLifestyleService(serviceData: InsertLifestyleService): Promise<LifestyleService> {
    try {
      const [newService] = await db
        .insert(lifestyleServices)
        .values(serviceData)
        .returning();
      return newService;
    } catch (error) {
      logger.error('Error creating lifestyle service', undefined, error as Error, 'server');
      throw new Error('Failed to create lifestyle service');
    }
  }

  async getLifestyleService(id: number): Promise<LifestyleService | undefined> {
    try {
      const [service] = await db
        .select()
        .from(lifestyleServices)
        .where(eq(lifestyleServices.id, id));
      return service;
    } catch (error) {
      logger.error('Error getting lifestyle service', undefined, error as Error, 'server');
      return undefined;
    }
  }

  async getAllLifestyleServices(category?: string): Promise<LifestyleService[]> {
    try {
      let query = db
        .select()
        .from(lifestyleServices)
        .$dynamic();

      if (category) {
        query = query.where(and(
          eq(lifestyleServices.isActive, true),
          eq(lifestyleServices.category, category)
        ));
      } else {
        query = query.where(eq(lifestyleServices.isActive, true));
      }

      const services = await query.orderBy(desc(lifestyleServices.isFeatured), desc(lifestyleServices.createdAt));
      return services;
    } catch (error) {
      logger.error('Error getting all lifestyle services', undefined, error as Error, 'server');
      return [];
    }
  }

  async getUserLifestyleServices(userId: number, category?: string): Promise<LifestyleService[]> {
    try {
      let query = db
        .select()
        .from(lifestyleServices)
        .$dynamic();

      if (category) {
        query = query.where(and(
          eq(lifestyleServices.userId, userId),
          eq(lifestyleServices.category, category)
        ));
      } else {
        query = query.where(eq(lifestyleServices.userId, userId));
      }

      const services = await query.orderBy(desc(lifestyleServices.createdAt));
      return services;
    } catch (error) {
      logger.error('Error getting user lifestyle services', undefined, error as Error, 'server');
      return [];
    }
  }

  async updateLifestyleService(id: number, userId: number, updates: Partial<LifestyleService>): Promise<LifestyleService | undefined> {
    try {
      const [updatedService] = await db
        .update(lifestyleServices)
        .set({ ...updates, updatedAt: new Date() })
        .where(and(
          eq(lifestyleServices.id, id),
          eq(lifestyleServices.userId, userId)
        ))
        .returning();
      return updatedService;
    } catch (error) {
      logger.error('Error updating lifestyle service', undefined, error as Error, 'server');
      return undefined;
    }
  }

  async deleteLifestyleService(id: number, userId: number): Promise<boolean> {
    try {
      const result = await db
        .delete(lifestyleServices)
        .where(and(
          eq(lifestyleServices.id, id),
          eq(lifestyleServices.userId, userId)
        ));
      return result.rowCount !== null && result.rowCount > 0;
    } catch (error) {
      logger.error('Error deleting lifestyle service', undefined, error as Error, 'server');
      return false;
    }
  }

  async searchLifestyleServices(query: string, category?: string): Promise<LifestyleService[]> {
    try {
      const lowerQuery = query.toLowerCase();
      const conditions = [
        eq(lifestyleServices.isActive, true),
        or(
          sql`LOWER(${lifestyleServices.title}) LIKE ${`%${lowerQuery}%`}`,
          sql`LOWER(${lifestyleServices.description}) LIKE ${`%${lowerQuery}%`}`,
          sql`LOWER(${lifestyleServices.location}) LIKE ${`%${lowerQuery}%`}`,
          sql`LOWER(${lifestyleServices.city}) LIKE ${`%${lowerQuery}%`}`
        )
      ];

      if (category) {
        conditions.push(eq(lifestyleServices.category, category));
      }

      const services = await db
        .select()
        .from(lifestyleServices)
        .where(and(...conditions))
        .orderBy(desc(lifestyleServices.isFeatured), desc(lifestyleServices.createdAt))
        .limit(50);
      return services;
    } catch (error) {
      logger.error('Error searching lifestyle services', undefined, error as Error, 'server');
      return [];
    }
  }

  async getFeaturedLifestyleServices(category?: string, limit: number = 10): Promise<LifestyleService[]> {
    try {
      const conditions = [
        eq(lifestyleServices.isActive, true),
        eq(lifestyleServices.isFeatured, true)
      ];

      if (category) {
        conditions.push(eq(lifestyleServices.category, category));
      }

      const services = await db
        .select()
        .from(lifestyleServices)
        .where(and(...conditions))
        .orderBy(desc(lifestyleServices.createdAt))
        .limit(limit);
      return services;
    } catch (error) {
      logger.error('Error getting featured lifestyle services', undefined, error as Error, 'server');
      return [];
    }
  }

  async createService(serviceData: InsertService): Promise<Service> {
    try {
      const [newService] = await db
        .insert(services)
        .values(serviceData)
        .returning();
      return newService;
    } catch (error) {
      logger.error('Error creating service', undefined, error as Error, 'server');
      throw error;
    }
  }

  async getService(id: number): Promise<Service | undefined> {
    try {
      const [service] = await db
        .select()
        .from(services)
        .where(eq(services.id, id));
      return service;
    } catch (error) {
      logger.error('Error getting service', undefined, error as Error, 'server');
      return undefined;
    }
  }

  async getAllServices(category?: string): Promise<Service[]> {
    try {
      const conditions = [eq(services.isActive, true)];

      if (category) {
        conditions.push(eq(services.category, category));
      }

      return await db
        .select()
        .from(services)
        .where(and(...conditions))
        .orderBy(desc(services.createdAt));
    } catch (error) {
      logger.error('Error getting all services', undefined, error as Error, 'server');
      return [];
    }
  }

  async getUserServices(userId: number, category?: string): Promise<Service[]> {
    try {
      const conditions = [eq(services.userId, userId)];

      if (category) {
        conditions.push(eq(services.category, category));
      }

      return await db
        .select()
        .from(services)
        .where(and(...conditions))
        .orderBy(desc(services.createdAt));
    } catch (error) {
      logger.error('Error getting user services', undefined, error as Error, 'server');
      return [];
    }
  }

  async updateService(id: number, userId: number, updates: Partial<Service>): Promise<Service | undefined> {
    try {
      const [updatedService] = await db
        .update(services)
        .set({ ...updates, updatedAt: new Date() })
        .where(and(
          eq(services.id, id),
          eq(services.userId, userId)
        ))
        .returning();
      return updatedService;
    } catch (error) {
      logger.error('Error updating service', undefined, error as Error, 'server');
      return undefined;
    }
  }

  async deleteService(id: number, userId: number): Promise<boolean> {
    try {
      const result = await db
        .delete(services)
        .where(and(
          eq(services.id, id),
          eq(services.userId, userId)
        ))
        .returning();
      return result.length > 0;
    } catch (error) {
      logger.error('Error deleting service', undefined, error as Error, 'server');
      return false;
    }
  }

  async searchServices(query: string, category?: string): Promise<Service[]> {
    try {
      const searchTerm = `%${query.toLowerCase()}%`;
      const conditions = [
        eq(services.isActive, true),
        or(
          sql`LOWER(${services.title}) LIKE ${searchTerm}`,
          sql`LOWER(${services.description}) LIKE ${searchTerm}`,
          sql`LOWER(${services.location}) LIKE ${searchTerm}`
        )
      ];

      if (category) {
        conditions.push(eq(services.category, category));
      }

      return await db
        .select()
        .from(services)
        .where(and(...conditions))
        .orderBy(desc(services.createdAt));
    } catch (error) {
      logger.error('Error searching services', undefined, error as Error, 'server');
      return [];
    }
  }

  async getFeaturedServices(category?: string, limit: number = 10): Promise<Service[]> {
    try {
      const conditions = [
        eq(services.isActive, true),
        eq(services.isFeatured, true)
      ];

      if (category) {
        conditions.push(eq(services.category, category));
      }

      const servicesData = await db
        .select()
        .from(services)
        .where(and(...conditions))
        .orderBy(desc(services.createdAt))
        .limit(limit);
      return servicesData;
    } catch (error) {
      logger.error('Error getting featured services', undefined, error as Error, 'server');
      return [];
    }
  }

  // Liked events operations
  async likeEvent(userId: number, eventId: number): Promise<LikedEvent> {
    try {
      const [newLike] = await db
        .insert(likedEvents)
        .values({ userId, eventId })
        .returning();
      return newLike;
    } catch (error) {
      logger.error('Error liking event', undefined, error as Error, 'server');
      throw new Error('Failed to like event');
    }
  }

  async unlikeEvent(userId: number, eventId: number): Promise<boolean> {
    try {
      const result = await db
        .delete(likedEvents)
        .where(and(eq(likedEvents.userId, userId), eq(likedEvents.eventId, eventId)));
      return result.rowCount !== null && result.rowCount > 0;
    } catch (error) {
      logger.error('Error unliking event', undefined, error as Error, 'server');
      return false;
    }
  }

  async checkEventLiked(userId: number, eventId: number): Promise<boolean> {
    try {
      const [like] = await db
        .select()
        .from(likedEvents)
        .where(and(eq(likedEvents.userId, userId), eq(likedEvents.eventId, eventId)))
        .limit(1);
      return !!like;
    } catch (error) {
      logger.error('Error checking if event is liked', undefined, error as Error, 'server');
      return false;
    }
  }

  async getUserLikedEvents(userId: number): Promise<Event[]> {
    try {
      const events = await db
        .select({
          id: eventsTable.id,
          communityId: eventsTable.communityId,
          title: eventsTable.title,
          description: eventsTable.description,
          eventType: eventsTable.eventType,
          coverImage: eventsTable.coverImage,
          startTime: eventsTable.startTime,
          endTime: eventsTable.endTime,
          timezone: eventsTable.timezone,
          location: eventsTable.location,
          price: eventsTable.price,
          currency: eventsTable.currency,
          maxAttendees: eventsTable.maxAttendees,
          isPublished: eventsTable.isPublished,
          requiredTierId: eventsTable.requiredTierId,
          hostId: eventsTable.hostId,
          createdAt: eventsTable.createdAt,
          updatedAt: eventsTable.updatedAt,
          host: {
            id: users.id,
            name: users.name,
            username: users.username,
            avatar: users.avatar
          }
        })
        .from(likedEvents)
        .innerJoin(eventsTable, eq(likedEvents.eventId, eventsTable.id))
        .innerJoin(users, eq(eventsTable.hostId, users.id))
        .where(eq(likedEvents.userId, userId))
        .orderBy(desc(likedEvents.createdAt));

      return events as any;
    } catch (error) {
      logger.error('Error getting user liked events', undefined, error as Error, 'server');
      return [];
    }
  }

  // Store user management operations
  async searchUsersForStore(query: string): Promise<User[]> {
    try {
      const searchResults = await db
        .select({
          id: users.id,
          username: users.username,
          name: users.name,
          email: users.email,
          avatar: users.avatar
        })
        .from(users)
        .where(
          or(
            like(users.username, `%${query}%`),
            like(users.name, `%${query}%`),
            like(users.email, `%${query}%`)
          )
        )
        .limit(10);
      
      return searchResults as User[];
    } catch (error) {
      logger.error('Error searching users for store', undefined, error as Error, 'server');
      return [];
    }
  }

  async getStoreUsers(vendorId: number): Promise<any[]> {
    try {
      const storeUsersList = await db
        .select({
          id: storeUsers.id,
          userId: storeUsers.userId,
          role: storeUsers.role,
          isActive: storeUsers.isActive,
          createdAt: storeUsers.createdAt,
          user: {
            id: users.id,
            username: users.username,
            name: users.name,
            email: users.email,
            avatar: users.avatar
          },
          assignedByUser: {
            id: users.id,
            username: users.username,
            name: users.name
          }
        })
        .from(storeUsers)
        .leftJoin(users, eq(storeUsers.userId, users.id))
        .where(eq(storeUsers.vendorId, vendorId))
        .orderBy(desc(storeUsers.createdAt));
      
      return storeUsersList;
    } catch (error) {
      logger.error('Error getting store users', undefined, error as Error, 'server');
      return [];
    }
  }

  async assignUserToStore(storeUserData: InsertStoreUser): Promise<StoreUser> {
    try {
      const [newStoreUser] = await db
        .insert(storeUsers)
        .values(storeUserData)
        .returning();
      
      return newStoreUser;
    } catch (error) {
      logger.error('Error assigning user to store', undefined, error as Error, 'server');
      throw new Error('Failed to assign user to store');
    }
  }

  async updateStoreUser(id: number, vendorId: number, updates: Partial<StoreUser>): Promise<StoreUser | undefined> {
    try {
      const [updatedStoreUser] = await db
        .update(storeUsers)
        .set({
          ...updates,
          updatedAt: new Date()
        })
        .where(and(eq(storeUsers.id, id), eq(storeUsers.vendorId, vendorId)))
        .returning();
      
      return updatedStoreUser;
    } catch (error) {
      logger.error('Error updating store user', undefined, error as Error, 'server');
      return undefined;
    }
  }

  async removeUserFromStore(id: number, vendorId: number): Promise<boolean> {
    try {
      await db
        .delete(storeUsers)
        .where(and(eq(storeUsers.id, id), eq(storeUsers.vendorId, vendorId)));
      
      return true;
    } catch (error) {
      logger.error('Error removing user from store', undefined, error as Error, 'server');
      return false;
    }
  }

  // Dating profile operations
  async getDatingProfile(userId: number): Promise<DatingProfile | undefined> {
    try {
      const [profile] = await db
        .select()
        .from(datingProfiles)
        .where(eq(datingProfiles.userId, userId))
        .limit(1);
      
      return profile;
    } catch (error) {
      logger.error('Error getting dating profile', undefined, error as Error, 'server');
      return undefined;
    }
  }

  async getDatingProfileById(profileId: number): Promise<DatingProfile | undefined> {
    try {
      const [profile] = await db
        .select()
        .from(datingProfiles)
        .where(eq(datingProfiles.id, profileId))
        .limit(1);
      
      return profile;
    } catch (error) {
      logger.error('Error getting dating profile by ID', undefined, error as Error, 'server');
      return undefined;
    }
  }

  async createDatingProfile(profileData: InsertDatingProfile): Promise<DatingProfile> {
    try {
      const [profile] = await db
        .insert(datingProfiles)
        .values(profileData)
        .returning();
      
      return profile;
    } catch (error) {
      logger.error('Error creating dating profile', undefined, error as Error, 'server');
      throw error;
    }
  }

  async updateDatingProfile(userId: number, updates: Partial<DatingProfile>): Promise<DatingProfile | undefined> {
    try {
      const [profile] = await db
        .update(datingProfiles)
        .set({
          ...updates,
          updatedAt: new Date()
        })
        .where(eq(datingProfiles.userId, userId))
        .returning();
      
      return profile;
    } catch (error) {
      logger.error('Error updating dating profile', undefined, error as Error, 'server');
      return undefined;
    }
  }

  async addGiftToDatingProfile(userId: number, productId: number): Promise<boolean> {
    try {
      // Get existing dating profile
      let profile = await this.getDatingProfile(userId);
      
      if (!profile) {
        // Auto-create draft profile with first gift
        profile = await this.createDatingProfile({
          userId,
          selectedGifts: [productId],
          displayName: '',
          age: 0,
          bio: '',
          location: '',
          interests: [],
          lookingFor: '',
          relationshipType: '',
          profileImages: [],
          isActive: false
        });
        return true;
      } else {
        const currentGifts = profile.selectedGifts || [];
        
        // Check if product already exists
        if (currentGifts.includes(productId)) {
          return false; // Already exists
        }
        
        // Check 20-gift limit
        if (currentGifts.length >= 20) {
          return false; // Limit reached
        }
        
        const updatedGifts = [...currentGifts, productId];
        await this.updateDatingProfile(userId, { selectedGifts: updatedGifts });
        return true;
      }
    } catch (error) {
      logger.error('Error adding gift to dating profile', undefined, error as Error, 'server');
      return false;
    }
  }

  async removeGiftFromDatingProfile(userId: number, productId: number): Promise<boolean> {
    try {
      const profile = await this.getDatingProfile(userId);
      
      if (!profile || !profile.selectedGifts) {
        return false;
      }
      
      const currentGifts = profile.selectedGifts;
      const updatedGifts = currentGifts.filter(id => id !== productId);
      
      await this.updateDatingProfile(userId, { selectedGifts: updatedGifts });
      return true;
    } catch (error) {
      logger.error('Error removing gift from dating profile', undefined, error as Error, 'server');
      return false;
    }
  }

  async getDatingProfileGifts(userId: number): Promise<Product[]> {
    try {
      const profile = await this.getDatingProfile(userId);
      
      if (!profile || !profile.selectedGifts || profile.selectedGifts.length === 0) {
        return [];
      }
      
      const giftProducts = await db
        .select({
          id: products.id,
          name: products.name,
          description: products.description,
          price: products.price,
          imageUrl: products.imageUrl,
          category: products.category,
          vendorId: products.vendorId,
          vendor: {
            id: vendors.id,
            storeName: vendors.storeName,
            rating: vendors.rating
          }
        })
        .from(products)
        .innerJoin(vendors, eq(products.vendorId, vendors.id))
        .where(inArray(products.id, profile.selectedGifts));
      
      return giftProducts as any as Product[];
    } catch (error) {
      logger.error('Error getting dating profile gifts', undefined, error as Error, 'server');
      return [];
    }
  }

  // Dating likes and matches operations
  async checkExistingLike(likerId: number, likedId: number): Promise<DatingLike | undefined> {
    try {
      const [existingLike] = await db
        .select()
        .from(datingLikes)
        .where(and(
          eq(datingLikes.likerId, likerId),
          eq(datingLikes.likedId, likedId)
        ))
        .limit(1);
      
      return existingLike;
    } catch (error) {
      logger.error('Error checking existing like', undefined, error as Error, 'server');
      return undefined;
    }
  }

  async likeDatingProfile(likerId: number, likedId: number): Promise<{ liked: boolean; matched: boolean }> {
    try {
      // Check if user is trying to like themselves
      if (likerId === likedId) {
        return { liked: false, matched: false };
      }

      // Check if already liked/passed
      const existingLike = await this.checkExistingLike(likerId, likedId);
      if (existingLike) {
        return { liked: existingLike.isLike, matched: false };
      }

      // Create the like
      await db.insert(datingLikes).values({
        likerId,
        likedId,
        isLike: true
      });

      // Check if there's a mutual like (match)
      const mutualLike = await this.checkExistingLike(likedId, likerId);
      let matched = false;

      if (mutualLike && mutualLike.isLike) {
        // Create a match
        await this.createMatch(likerId, likedId);
        matched = true;
      }

      return { liked: true, matched };
    } catch (error) {
      logger.error('Error liking dating profile', undefined, error as Error, 'server');
      return { liked: false, matched: false };
    }
  }

  async passDatingProfile(userId: number, passedId: number): Promise<boolean> {
    try {
      // Check if user is trying to pass themselves
      if (userId === passedId) {
        return false;
      }

      // Check if already liked/passed
      const existingLike = await this.checkExistingLike(userId, passedId);
      if (existingLike) {
        return true; // Already processed
      }

      // Create the pass
      await db.insert(datingLikes).values({
        likerId: userId,
        likedId: passedId,
        isLike: false
      });

      return true;
    } catch (error) {
      logger.error('Error passing dating profile', undefined, error as Error, 'server');
      return false;
    }
  }

  async createMatch(user1Id: number, user2Id: number): Promise<DatingMatch> {
    try {
      // Ensure consistent ordering (lower ID first)
      const [firstUserId, secondUserId] = user1Id < user2Id ? [user1Id, user2Id] : [user2Id, user1Id];

      const [match] = await db.insert(datingMatches).values({
        user1Id: firstUserId,
        user2Id: secondUserId,
        isActive: true
      }).returning();

      return match;
    } catch (error) {
      logger.error('Error creating match', undefined, error as Error, 'server');
      throw error;
    }
  }

  async getUserMatches(userId: number): Promise<any[]> {
    try {
      const matches = await db
        .select({
          id: datingMatches.id,
          user1Id: datingMatches.user1Id,
          user2Id: datingMatches.user2Id,
          matchedAt: datingMatches.matchedAt,
          lastMessageAt: datingMatches.lastMessageAt,
          isActive: datingMatches.isActive,
          // Get the other user's info
          otherUser: {
            id: users.id,
            username: users.username,
            name: users.name,
            avatar: users.avatar,
            city: users.city,
            country: users.country
          },
          // Get the other user's dating profile
          otherProfile: {
            id: datingProfiles.id,
            displayName: datingProfiles.displayName,
            age: datingProfiles.age,
            bio: datingProfiles.bio,
            location: datingProfiles.location,
            interests: datingProfiles.interests,
            profileImages: datingProfiles.profileImages,
            datingRoomTier: datingProfiles.datingRoomTier
          }
        })
        .from(datingMatches)
        .innerJoin(users, or(
          and(eq(datingMatches.user1Id, userId), eq(users.id, datingMatches.user2Id)),
          and(eq(datingMatches.user2Id, userId), eq(users.id, datingMatches.user1Id))
        ))
        .innerJoin(datingProfiles, eq(datingProfiles.userId, users.id))
        .where(and(
          or(
            eq(datingMatches.user1Id, userId),
            eq(datingMatches.user2Id, userId)
          ),
          eq(datingMatches.isActive, true)
        ))
        .orderBy(desc(datingMatches.matchedAt));

      return matches.map(match => ({
        ...match,
        matchedWith: match.otherUser,
        matchedProfile: match.otherProfile
      }));
    } catch (error) {
      logger.error('Error getting user matches', undefined, error as Error, 'server');
      return [];
    }
  }

  async searchEvents(searchTerm: string, limit: number = 10): Promise<any[]> {
    try {
      if (!searchTerm || searchTerm.trim().length === 0) {
        return [];
      }

      const query = `%${searchTerm.toLowerCase()}%`;
      
      const eventResults = await db
        .select({
          id: eventsTable.id,
          title: eventsTable.title,
          description: eventsTable.description,
          eventType: eventsTable.eventType,
          coverImage: eventsTable.coverImage,
          startTime: eventsTable.startTime,
          endTime: eventsTable.endTime,
          location: eventsTable.location,
          price: eventsTable.price,
          communityId: eventsTable.communityId,
          hostId: eventsTable.hostId,
          hostName: users.name,
          hostUsername: users.username,
          hostAvatar: users.avatar
        })
        .from(eventsTable)
        .leftJoin(users, eq(eventsTable.hostId, users.id))
        .where(
          and(
            or(
              sql`LOWER(${eventsTable.title}) LIKE ${query}`,
              sql`LOWER(${eventsTable.description}) LIKE ${query}`
            ),
            eq(eventsTable.isPublished, true)
          )
        )
        .orderBy(desc(eventsTable.startTime))
        .limit(limit);

      return eventResults;
    } catch (error) {
      logger.error('Error searching events', undefined, error as Error, 'server');
      return [];
    }
  }

  async searchPosts(query: string, limit: number = 10): Promise<any[]> {
    try {
      if (!query || query.trim().length === 0) {
        return [];
      }

      const searchQuery = `%${query.toLowerCase()}%`;
      
      const postResults = await db
        .select({
          id: posts.id,
          userId: posts.userId,
          content: posts.content,
          title: posts.title,
          contentType: posts.contentType,
          imageUrl: posts.imageUrl,
          videoUrl: posts.videoUrl,
          likes: posts.likes,
          comments: posts.comments,
          views: posts.views,
          createdAt: posts.createdAt,
          userName: users.name,
          username: users.username,
          userAvatar: users.avatar
        })
        .from(posts)
        .leftJoin(users, eq(posts.userId, users.id))
        .where(
          and(
            or(
              sql`LOWER(${posts.content}) LIKE ${searchQuery}`,
              sql`LOWER(${posts.title}) LIKE ${searchQuery}`
            ),
            eq(posts.isPublished, true)
          )
        )
        .orderBy(desc(posts.createdAt))
        .limit(limit);

      return postResults;
    } catch (error) {
      logger.error('Error searching posts', undefined, error as Error, 'server');
      return [];
    }
  }

  async searchMembers(query: string, limit: number = 10): Promise<any[]> {
    try {
      if (!query || query.trim().length === 0) {
        return [];
      }

      const searchQuery = `%${query.toLowerCase()}%`;
      
      const memberResults = await db
        .select({
          id: users.id,
          username: users.username,
          name: users.name,
          bio: users.bio,
          avatar: users.avatar,
          city: users.city,
          country: users.country,
          isVendor: users.isVendor
        })
        .from(users)
        .where(
          or(
            sql`LOWER(${users.username}) LIKE ${searchQuery}`,
            sql`LOWER(${users.name}) LIKE ${searchQuery}`,
            sql`LOWER(${users.bio}) LIKE ${searchQuery}`
          )
        )
        .orderBy(users.name)
        .limit(limit);

      return memberResults;
    } catch (error) {
      logger.error('Error searching members', undefined, error as Error, 'server');
      return [];
    }
  }


  async searchDatingProfiles(query: string, currentUserId?: number, limit: number = 10): Promise<any[]> {
    try {
      if (!query || query.trim().length === 0) {
        return [];
      }

      const searchQuery = `%${query.toLowerCase()}%`;
      
      let whereConditions = and(
        or(
          sql`LOWER(${datingProfiles.displayName}) LIKE ${searchQuery}`,
          sql`LOWER(${datingProfiles.bio}) LIKE ${searchQuery}`,
          sql`LOWER(${datingProfiles.location}) LIKE ${searchQuery}`
        ),
        eq(datingProfiles.isActive, true)
      );

      // Exclude current user if provided
      if (currentUserId) {
        whereConditions = and(
          whereConditions,
          ne(datingProfiles.userId, currentUserId)
        );
      }
      
      const profileResults = await db
        .select({
          id: datingProfiles.id,
          userId: datingProfiles.userId,
          displayName: datingProfiles.displayName,
          age: datingProfiles.age,
          bio: datingProfiles.bio,
          location: datingProfiles.location,
          interests: datingProfiles.interests,
          profileImages: datingProfiles.profileImages,
          datingRoomTier: datingProfiles.datingRoomTier,
          userName: users.name,
          username: users.username
        })
        .from(datingProfiles)
        .leftJoin(users, eq(datingProfiles.userId, users.id))
        .where(whereConditions)
        .orderBy(desc(datingProfiles.createdAt))
        .limit(limit);

      return profileResults;
    } catch (error) {
      logger.error('Error searching dating profiles', undefined, error as Error, 'server');
      return [];
    }
  }

  async comprehensiveSearch(query: string, currentUserId?: number): Promise<{
    posts: any[];
    members: any[];
    events: any[];
    datingProfiles: any[];
  }> {
    try {
      // Run all searches in parallel for better performance
      const [posts, members, events, datingProfiles] = await Promise.all([
        this.searchPosts(query, 10),
        this.searchMembers(query, 10),
        this.searchEvents(query, 10),
        this.searchDatingProfiles(query, currentUserId, 10)
      ]);

      return {
        posts,
        members,
        events,
        datingProfiles
      };
    } catch (error) {
      logger.error('Error in comprehensive search', undefined, error as Error, 'server');
      return {
        posts: [],
        members: [],
        events: [],
        datingProfiles: []
      };
    }
  }

  async getPlatformUsers(excludeUserId: number): Promise<User[]> {
    try {
      const platformUsers = await db
        .select({
          id: users.id,
          username: users.username,
          name: users.name,
          avatar: users.avatar,
          city: users.city,
          country: users.country
        })
        .from(users)
        .where(ne(users.id, excludeUserId))
        .orderBy(users.name, users.username);
      
      return platformUsers as User[];
    } catch (error) {
      logger.error('Error getting platform users', undefined, error as Error, 'server');
      return [];
    }
  }

  async createGift(giftData: any): Promise<any> {
    try {
      // For now, create a gift proposition in the existing gift table
      const gift = await db
        .insert(giftPropositions)
        .values({
          senderId: giftData.senderId,
          recipientId: giftData.recipientId,
          productId: giftData.cartItems[0]?.productId || 0, // Use first item's product ID
          amount: giftData.total,
          currency: giftData.currency || 'GBP',
          message: giftData.message,
          status: giftData.status || 'pending'
        })
        .returning();
      
      return gift[0];
    } catch (error) {
      logger.error('Error creating gift', undefined, error as Error, 'server');
      throw new Error('Failed to create gift');
    }
  }

  // Affiliate partnership operations implementation
  async getAffiliatePartnerByUserId(userId: number): Promise<any | undefined> {
    try {
      // For now, use the user information to simulate affiliate partner data
      const user = await this.getUser(userId);
      if (!user) return undefined;
      
      // Check if there's an existing affiliate partner record
      const existingPartners = await db
        .select()
        .from(affiliatePartners)
        .where(eq(affiliatePartners.email, user.email || ''));
      
      if (existingPartners.length > 0) {
        return {
          ...existingPartners[0],
          userId: userId
        };
      }
      
      return undefined;
    } catch (error) {
      logger.error('Error getting affiliate partner', undefined, error as Error, 'server');
      return undefined;
    }
  }

  async createAffiliatePartner(partnerData: any): Promise<any> {
    try {
      const user = await this.getUser(partnerData.userId);
      if (!user) {
        throw new Error('User not found');
      }

      const [newPartner] = await db
        .insert(affiliatePartners)
        .values({
          name: partnerData.partnerName || user.name || user.username,
          email: partnerData.contactEmail || user.email || `${user.username}@example.com`,
          phone: partnerData.contactPhone,
          company: partnerData.businessName,
          website: partnerData.website,
          partnerCode: partnerData.referralCode,
          description: partnerData.description,
          specialization: partnerData.specialization || 'general',
          region: 'global',
          languages: ['en'],
          commissionRate: (partnerData.commissionRate || 5.0).toString(),
          status: 'pending', // Start as pending for admin approval
          isVerified: false
        })
        .returning();
      return {
        ...newPartner,
        userId: partnerData.userId
      };
    } catch (error) {
      logger.error('Error creating affiliate partner', undefined, error as Error, 'server');
      throw new Error('Failed to create affiliate partner');
    }
  }

  async getAllAffiliatePartners(): Promise<any[]> {
    try {
      const partners = await db
        .select()
        .from(affiliatePartners)
        .orderBy(desc(affiliatePartners.createdAt));
      return partners;
    } catch (error) {
      logger.error('Error getting all affiliate partners', undefined, error as Error, 'server');
      return [];
    }
  }

  async getPendingAffiliatePartners(): Promise<any[]> {
    try {
      const partners = await db
        .select()
        .from(affiliatePartners)
        .where(eq(affiliatePartners.status, 'pending'))
        .orderBy(desc(affiliatePartners.createdAt));
      return partners;
    } catch (error) {
      logger.error('Error getting pending affiliate partners', undefined, error as Error, 'server');
      return [];
    }
  }

  async updateAffiliatePartnerStatus(partnerId: number, status: string, adminId: number): Promise<boolean> {
    try {
      await db
        .update(affiliatePartners)
        .set({ 
          status: status,
          isVerified: status === 'approved',
          verificationDate: status === 'approved' ? new Date() : null,
          updatedAt: new Date()
        })
        .where(eq(affiliatePartners.id, partnerId));
      return true;
    } catch (error) {
      logger.error('Error updating affiliate partner status', undefined, error as Error, 'server');
      return false;
    }
  }

  async getAffiliatePartnerById(partnerId: number): Promise<any | null> {
    try {
      const [partner] = await db
        .select()
        .from(affiliatePartners)
        .where(eq(affiliatePartners.id, partnerId));
      return partner || null;
    } catch (error) {
      logger.error('Error getting affiliate partner by ID', undefined, error as Error, 'server');
      return null;
    }
  }

  async updateAffiliatePartner(id: number, updates: any): Promise<any | undefined> {
    try {
      const [updatedPartner] = await db
        .update(affiliatePartners)
        .set(updates)
        .where(eq(affiliatePartners.id, id))
        .returning();
      return updatedPartner;
    } catch (error) {
      logger.error('Error updating affiliate partner', undefined, error as Error, 'server');
      return undefined;
    }
  }

  async getAffiliateReferrals(affiliateId: number): Promise<any[]> {
    try {
      // For now, return vendor assignments as referrals
      const assignments = await db
        .select({
          id: vendorAffiliatePartners.id,
          vendorId: vendorAffiliatePartners.vendorId,
          assignedAt: vendorAffiliatePartners.assignedAt,
          status: vendorAffiliatePartners.status,
          notes: vendorAffiliatePartners.notes
        })
        .from(vendorAffiliatePartners)
        .where(eq(vendorAffiliatePartners.affiliatePartnerId, affiliateId))
        .orderBy(desc(vendorAffiliatePartners.assignedAt));
      
      return assignments;
    } catch (error) {
      logger.error('Error getting affiliate referrals', undefined, error as Error, 'server');
      return [];
    }
  }

  async getAffiliateEarnings(affiliateId: number): Promise<any[]> {
    try {
      // For now, return calculated earnings based on partner record
      const partner = await db
        .select()
        .from(affiliatePartners)
        .where(eq(affiliatePartners.id, affiliateId));
      
      if (partner.length === 0) return [];
      
      return [{
        id: 1,
        affiliateId: affiliateId,
        amount: partner[0].totalCommissionEarned || '0',
        type: 'commission',
        description: 'Total commission earned',
        createdAt: new Date()
      }];
    } catch (error) {
      logger.error('Error getting affiliate earnings', undefined, error as Error, 'server');
      return [];
    }
  }

  async generateReferralLink(affiliateId: number): Promise<string> {
    try {
      const partner = await db
        .select()
        .from(affiliatePartners)
        .where(eq(affiliatePartners.id, affiliateId));
      
      if (partner.length === 0) {
        throw new Error('Affiliate partner not found');
      }
      
      const domain = process.env.REPLIT_DOMAINS?.split(',')[0] || 'localhost:5000';
      return `https://${domain}?ref=${partner[0].partnerCode}`;
    } catch (error) {
      logger.error('Error generating referral link', undefined, error as Error, 'server');
      throw new Error('Failed to generate referral link');
    }
  }

  // Gift card operations implementation
  async createGiftCard(giftCardData: InsertGiftCard): Promise<GiftCard> {
    try {
      // Generate unique gift card code, card number, and PIN
      const code = await this.generateGiftCardCode();
      const cardNumber = await this.generateGiftCardNumber();
      const { plainPin, hashedPin } = await this.generateGiftCardPin();
      
      const [giftCard] = await db
        .insert(giftCards)
        .values({
          ...giftCardData,
          code,
          cardNumber,
          pin: hashedPin
        })
        .returning();
      
      // Create purchase transaction
      if (giftCard.purchasedBy) {
        await this.createGiftCardTransaction({
          giftCardId: giftCard.id,
          type: 'purchase',
          amount: giftCard.amount,
          currency: giftCard.currency,
          userId: giftCard.purchasedBy,
          orderId: giftCardData.purchaseOrderId,
          stripePaymentIntentId: giftCardData.stripePaymentIntentId,
          description: `Gift card purchase - £${giftCard.amount}`
        });
      }
      
      // Send gift card email if recipient email is provided
      if (giftCard.recipientEmail) {
        // Create a temporary object with plaintext PIN for email
        const giftCardForEmail = { ...giftCard, pin: plainPin };
        await this.sendGiftCardEmail(giftCardForEmail, giftCard.recipientEmail);
      }

      // Return gift card with plaintext PIN for immediate use
      return { ...giftCard, pin: plainPin };
    } catch (error) {
      logger.error('Error creating gift card', undefined, error as Error, 'server');
      throw new Error('Failed to create gift card');
    }
  }

  async getGiftCard(id: number): Promise<GiftCard | undefined> {
    try {
      const [giftCard] = await db
        .select()
        .from(giftCards)
        .where(eq(giftCards.id, id));
      
      return giftCard;
    } catch (error) {
      logger.error('Error getting gift card', undefined, error as Error, 'server');
      return undefined;
    }
  }

  async getGiftCardByCode(code: string): Promise<GiftCard | undefined> {
    try {
      const [giftCard] = await db
        .select()
        .from(giftCards)
        .where(eq(giftCards.code, code));
      
      return giftCard;
    } catch (error) {
      logger.error('Error getting gift card by code', undefined, error as Error, 'server');
      return undefined;
    }
  }

  async updateGiftCard(id: number, updates: Partial<GiftCard>): Promise<GiftCard | undefined> {
    try {
      const [updatedGiftCard] = await db
        .update(giftCards)
        .set({
          ...updates,
          updatedAt: new Date()
        })
        .where(eq(giftCards.id, id))
        .returning();
      
      return updatedGiftCard;
    } catch (error) {
      logger.error('Error updating gift card', undefined, error as Error, 'server');
      return undefined;
    }
  }

  async getUserGiftCards(userId: number): Promise<GiftCard[]> {
    try {
      const userGiftCards = await db
        .select()
        .from(giftCards)
        .where(
          or(
            eq(giftCards.purchasedBy, userId),
            eq(giftCards.redeemedBy, userId)
          )
        )
        .orderBy(desc(giftCards.createdAt));
      
      return userGiftCards;
    } catch (error) {
      logger.error('Error getting user gift cards', undefined, error as Error, 'server');
      return [];
    }
  }

  async redeemGiftCard(code: string, userId: number, orderId: number, amount: number): Promise<{ success: boolean; remainingBalance: number; message: string }> {
    try {
      const giftCard = await this.getGiftCardByCode(code);
      
      if (!giftCard) {
        return { success: false, remainingBalance: 0, message: 'Invalid gift card code' };
      }
      
      if (giftCard.status !== 'active') {
        return { success: false, remainingBalance: 0, message: 'Gift card is not active' };
      }
      
      if (giftCard.expiresAt && new Date() > giftCard.expiresAt) {
        await this.updateGiftCard(giftCard.id, { status: 'expired' });
        return { success: false, remainingBalance: 0, message: 'Gift card has expired' };
      }
      
      const currentBalance = giftCard.amount - (giftCard.redeemedAmount || 0);
      
      if (currentBalance <= 0) {
        await this.updateGiftCard(giftCard.id, { status: 'redeemed' });
        return { success: false, remainingBalance: 0, message: 'Gift card has already been fully redeemed' };
      }
      
      if (amount > currentBalance) {
        return { success: false, remainingBalance: currentBalance, message: `Insufficient balance. Available: £${currentBalance.toFixed(2)}` };
      }
      
      const newRedeemedAmount = (giftCard.redeemedAmount || 0) + amount;
      const remainingBalance = giftCard.amount - newRedeemedAmount;
      
      // Update gift card
      await this.updateGiftCard(giftCard.id, {
        redeemedAmount: newRedeemedAmount,
        redeemedBy: userId,
        redeemedAt: new Date(),
        status: remainingBalance <= 0 ? 'redeemed' : 'active'
      });
      
      // Create redemption transaction
      await this.createGiftCardTransaction({
        giftCardId: giftCard.id,
        type: 'redemption',
        amount: amount,
        currency: giftCard.currency,
        userId: userId,
        orderId: orderId,
        description: `Gift card redemption - £${amount}`
      });
      
      // Create redemption record
      await this.createGiftCardRedemption({
        giftCardId: giftCard.id,
        orderId: orderId,
        redeemedAmount: amount,
        remainingBalance: remainingBalance,
        redeemedBy: userId
      });
      
      return { 
        success: true, 
        remainingBalance: remainingBalance, 
        message: `Successfully redeemed £${amount}. Remaining balance: £${remainingBalance.toFixed(2)}` 
      };
    } catch (error) {
      logger.error('Error redeeming gift card', undefined, error as Error, 'server');
      return { success: false, remainingBalance: 0, message: 'Failed to redeem gift card' };
    }
  }

  async createGiftCardTransaction(transactionData: InsertGiftCardTransaction): Promise<GiftCardTransaction> {
    try {
      const [transaction] = await db
        .insert(giftCardTransactions)
        .values(transactionData)
        .returning();
      
      return transaction;
    } catch (error) {
      logger.error('Error creating gift card transaction', undefined, error as Error, 'server');
      throw new Error('Failed to create gift card transaction');
    }
  }

  async getGiftCardTransactions(giftCardId: number): Promise<GiftCardTransaction[]> {
    try {
      const transactions = await db
        .select()
        .from(giftCardTransactions)
        .where(eq(giftCardTransactions.giftCardId, giftCardId))
        .orderBy(desc(giftCardTransactions.createdAt));
      
      return transactions;
    } catch (error) {
      logger.error('Error getting gift card transactions', undefined, error as Error, 'server');
      return [];
    }
  }

  async createGiftCardRedemption(redemptionData: InsertGiftCardRedemption): Promise<GiftCardRedemption> {
    try {
      const [redemption] = await db
        .insert(giftCardRedemptions)
        .values(redemptionData)
        .returning();
      
      return redemption;
    } catch (error) {
      logger.error('Error creating gift card redemption', undefined, error as Error, 'server');
      throw new Error('Failed to create gift card redemption');
    }
  }

  async getGiftCardBalance(code: string): Promise<{ balance: number; status: string } | null> {
    try {
      const giftCard = await this.getGiftCardByCode(code);
      
      if (!giftCard) {
        return null;
      }
      
      const balance = giftCard.amount - (giftCard.redeemedAmount || 0);
      
      return {
        balance: Math.max(0, balance),
        status: giftCard.status
      };
    } catch (error) {
      logger.error('Error getting gift card balance', undefined, error as Error, 'server');
      return null;
    }
  }

  async generateGiftCardCode(): Promise<string> {
    try {
      let code: string;
      let isUnique = false;
      let attempts = 0;
      const maxAttempts = 10;
      
      while (!isUnique && attempts < maxAttempts) {
        // Generate a 16-character alphanumeric code
        code = Array.from(
          { length: 16 }, 
          () => 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'[Math.floor(Math.random() * 36)]
        ).join('');
        
        // Format as XXXX-XXXX-XXXX-XXXX
        code = code.match(/.{1,4}/g)?.join('-') || code;
        
        // Check if code is unique
        const existing = await this.getGiftCardByCode(code);
        isUnique = !existing;
        attempts++;
      }
      
      if (!isUnique) {
        throw new Error('Failed to generate unique gift card code');
      }
      
      return code!;
    } catch (error) {
      logger.error('Error generating gift card code', undefined, error as Error, 'server');
      throw new Error('Failed to generate gift card code');
    }
  }

  async generateGiftCardNumber(): Promise<string> {
    try {
      let cardNumber: string;
      let isUnique = false;
      let attempts = 0;
      const maxAttempts = 10;
      
      while (!isUnique && attempts < maxAttempts) {
        // Generate a 16-digit number
        cardNumber = Array.from(
          { length: 16 }, 
          () => Math.floor(Math.random() * 10).toString()
        ).join('');
        
        // Check if card number is unique
        const existing = await this.getGiftCardByCardNumber(cardNumber);
        isUnique = !existing;
        attempts++;
      }
      
      if (!isUnique) {
        throw new Error('Failed to generate unique gift card number');
      }
      
      return cardNumber!;
    } catch (error) {
      logger.error('Error generating gift card number', undefined, error as Error, 'server');
      throw new Error('Failed to generate gift card number');
    }
  }

  async generateGiftCardPin(): Promise<{ plainPin: string; hashedPin: string }> {
    // Generate a 4-digit PIN
    const plainPin = Array.from(
      { length: 4 }, 
      () => Math.floor(Math.random() * 10).toString()
    ).join('');
    
    // Hash the PIN for storage
    const bcrypt = require('bcryptjs');
    const hashedPin = await bcrypt.hash(plainPin, 10);
    
    // Return both for different uses
    return { plainPin, hashedPin };
  }

  async getGiftCardByCardNumber(cardNumber: string): Promise<GiftCard | undefined> {
    try {
      const [giftCard] = await db
        .select()
        .from(giftCards)
        .where(eq(giftCards.cardNumber, cardNumber));
      
      return giftCard;
    } catch (error) {
      logger.error('Error getting gift card by card number', undefined, error as Error, 'server');
      return undefined;
    }
  }

  async getGiftCardBalanceByCardNumber(cardNumber: string, pin: string): Promise<{ balance: number; status: string; cardNumber: string } | null> {
    try {
      const giftCard = await this.getGiftCardByCardNumber(cardNumber);
      
      if (!giftCard) {
        return null;
      }
      
      // Verify PIN using bcrypt comparison
      const bcrypt = require('bcryptjs');
      const pinMatches = await bcrypt.compare(pin, giftCard.pin);
      
      if (!pinMatches) {
        return null;
      }
      
      const balance = giftCard.amount - (giftCard.redeemedAmount || 0);
      
      return {
        balance: Math.max(0, balance),
        status: giftCard.status,
        cardNumber: giftCard.cardNumber
      };
    } catch (error) {
      logger.error('Error getting gift card balance by card number', undefined, error as Error, 'server');
      return null;
    }
  }

  async sendGiftCardEmail(giftCard: GiftCard, recipientEmail: string): Promise<void> {
    try {
      const { sendEmail } = await import('./email-service');
      
      const emailBody = `
        <h2>Your Dedw3n Gift Card</h2>
        <p>Dear ${giftCard.recipientName || 'Valued Customer'},</p>
        <p>You have received a Dedw3n gift card!</p>
        <p><strong>Card Number:</strong> ${giftCard.cardNumber}</p>
        <p><strong>PIN:</strong> ${giftCard.pin}</p>
        <p><strong>Amount:</strong> ${giftCard.amount} ${giftCard.currency}</p>
        ${giftCard.giftMessage ? `<p><strong>Message:</strong> ${giftCard.giftMessage}</p>` : ''}
        <p><strong>Expires:</strong> ${giftCard.expiresAt ? new Date(giftCard.expiresAt).toLocaleDateString() : 'Never'}</p>
        <p>Thank you for using Dedw3n!</p>
      `;

      await sendEmail({
        to: recipientEmail,
        from: 'noreply@dedw3n.com',
        subject: 'Your Dedw3n Gift Card',
        html: emailBody
      });
      
      logger.info('Gift card email sent successfully', { email: recipientEmail }, 'server');
    } catch (error) {
      logger.error('Error sending gift card email', undefined, error as Error, 'server');
      // Don't throw error here as gift card creation should succeed even if email fails
    }
  }

  // Proxy Accounts operations
  async createProxyAccount(accountData: InsertProxyAccount): Promise<ProxyAccount> {
    try {
      const result = await db.insert(proxyAccounts).values({
        ...accountData,
        updatedAt: new Date()
      }).returning();
      return result[0];
    } catch (error) {
      logger.error('Error creating proxy account', undefined, error as Error, 'server');
      throw error;
    }
  }

  async getProxyAccount(id: number): Promise<ProxyAccount | undefined> {
    try {
      const result = await db.select().from(proxyAccounts).where(eq(proxyAccounts.id, id));
      return result[0];
    } catch (error) {
      logger.error('Error getting proxy account', undefined, error as Error, 'server');
      throw error;
    }
  }

  async getUserProxyAccounts(parentUserId: number): Promise<ProxyAccount[]> {
    try {
      const result = await db.select()
        .from(proxyAccounts)
        .where(eq(proxyAccounts.parentUserId, parentUserId))
        .orderBy(desc(proxyAccounts.createdAt));
      return result;
    } catch (error) {
      logger.error('Error getting user proxy accounts', undefined, error as Error, 'server');
      throw error;
    }
  }

  async updateProxyAccount(id: number, updates: Partial<ProxyAccount>): Promise<ProxyAccount | undefined> {
    try {
      const result = await db.update(proxyAccounts)
        .set({
          ...updates,
          updatedAt: new Date()
        })
        .where(eq(proxyAccounts.id, id))
        .returning();
      return result[0];
    } catch (error) {
      logger.error('Error updating proxy account', undefined, error as Error, 'server');
      throw error;
    }
  }

  async deleteProxyAccount(id: number): Promise<boolean> {
    try {
      const result = await db.delete(proxyAccounts).where(eq(proxyAccounts.id, id));
      return true;
    } catch (error) {
      logger.error('Error deleting proxy account', undefined, error as Error, 'server');
      return false;
    }
  }

  async updateProxyAccountStatus(id: number, status: string, notes?: string): Promise<ProxyAccount | undefined> {
    try {
      const updateData: any = {
        status,
        updatedAt: new Date()
      };
      
      if (status === 'verified') {
        updateData.verifiedAt = new Date();
      } else if (status === 'suspended') {
        updateData.suspendedAt = new Date();
      }
      
      if (notes) {
        if (status === 'rejected') {
          updateData.rejectionReason = notes;
        } else if (status === 'suspended') {
          updateData.suspensionReason = notes;
        } else {
          updateData.verificationNotes = notes;
        }
      }

      const result = await db.update(proxyAccounts)
        .set(updateData)
        .where(eq(proxyAccounts.id, id))
        .returning();
      return result[0];
    } catch (error) {
      logger.error('Error updating proxy account status', undefined, error as Error, 'server');
      throw error;
    }
  }

  async updateProxyAccountKYCStatus(id: number, kycStatus: string, verifiedBy?: number): Promise<ProxyAccount | undefined> {
    try {
      const updateData: any = {
        kycStatus,
        updatedAt: new Date()
      };
      
      if (kycStatus === 'approved') {
        updateData.kycVerifiedAt = new Date();
        if (verifiedBy) {
          updateData.kycVerifiedBy = verifiedBy;
        }
      }

      const result = await db.update(proxyAccounts)
        .set(updateData)
        .where(eq(proxyAccounts.id, id))
        .returning();
      return result[0];
    } catch (error) {
      logger.error('Error updating proxy account KYC status', undefined, error as Error, 'server');
      throw error;
    }
  }

  // Cryptocurrency payment operations
  async createCryptoPayment(payment: InsertCryptoPayment): Promise<CryptoPayment> {
    try {
      const result = await db.insert(cryptoPayments).values(payment).returning();
      return result[0];
    } catch (error) {
      logger.error('Error creating crypto payment', undefined, error as Error, 'server');
      throw error;
    }
  }

  async getCryptoPayment(paymentId: string): Promise<CryptoPayment | undefined> {
    try {
      const result = await db.select().from(cryptoPayments).where(eq(cryptoPayments.paymentId, paymentId));
      return result[0];
    } catch (error) {
      logger.error('Error getting crypto payment', undefined, error as Error, 'server');
      throw error;
    }
  }

  async updateCryptoPaymentStatus(paymentId: string, updates: Partial<CryptoPayment>): Promise<CryptoPayment | undefined> {
    try {
      const result = await db.update(cryptoPayments)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(cryptoPayments.paymentId, paymentId))
        .returning();
      return result[0];
    } catch (error) {
      logger.error('Error updating crypto payment status', undefined, error as Error, 'server');
      throw error;
    }
  }

  async getCryptoPaymentsByOrder(orderId: number): Promise<CryptoPayment[]> {
    try {
      const result = await db.select().from(cryptoPayments).where(eq(cryptoPayments.orderId, orderId));
      return result;
    } catch (error) {
      logger.error('Error getting crypto payments by order', undefined, error as Error, 'server');
      throw error;
    }
  }

  async getCryptoPaymentsByUser(userId: number): Promise<CryptoPayment[]> {
    try {
      const result = await db.select().from(cryptoPayments).where(eq(cryptoPayments.userId, userId));
      return result;
    } catch (error) {
      logger.error('Error getting crypto payments by user', undefined, error as Error, 'server');
      throw error;
    }
  }

  async blockUser(blockerId: number, blockedId: number, reason?: string): Promise<boolean> {
    try {
      if (blockerId === blockedId) {
        throw new Error('Cannot block yourself');
      }

      const blockData: InsertUserBlock = {
        blockerId,
        blockedId,
        reason: reason || null
      };

      await db.insert(userBlocks).values(blockData);
      return true;
    } catch (error) {
      logger.error('Error blocking user', undefined, error as Error, 'server');
      throw error;
    }
  }

  async unblockUser(blockerId: number, blockedId: number): Promise<boolean> {
    try {
      const result = await db.delete(userBlocks)
        .where(
          and(
            eq(userBlocks.blockerId, blockerId),
            eq(userBlocks.blockedId, blockedId)
          )
        )
        .returning();
      
      return result.length > 0;
    } catch (error) {
      logger.error('Error unblocking user', undefined, error as Error, 'server');
      throw error;
    }
  }

  async checkUserBlocked(blockerId: number, blockedId: number): Promise<boolean> {
    try {
      const result = await db.select()
        .from(userBlocks)
        .where(
          and(
            eq(userBlocks.blockerId, blockerId),
            eq(userBlocks.blockedId, blockedId)
          )
        );
      
      return result.length > 0;
    } catch (error) {
      logger.error('Error checking user blocked', undefined, error as Error, 'server');
      return false;
    }
  }

  async getBlockedUsers(userId: number): Promise<User[]> {
    try {
      const blocks = await db.select()
        .from(userBlocks)
        .where(eq(userBlocks.blockerId, userId));
      
      if (blocks.length === 0) {
        return [];
      }

      const blockedUserIds = blocks.map(b => b.blockedId);
      const blockedUsers = await db.select()
        .from(users)
        .where(inArray(users.id, blockedUserIds));
      
      return blockedUsers;
    } catch (error) {
      logger.error('Error getting blocked users', undefined, error as Error, 'server');
      return [];
    }
  }

  async createModerationReport(reportData: { reporterId: number; subjectId: number; subjectType: string; reason: string; description?: string }): Promise<any> {
    try {
      const reportRecord: InsertModerationReport = {
        reportType: reportData.subjectType,
        reporterId: reportData.reporterId,
        subjectId: reportData.subjectId,
        subjectType: reportData.subjectType,
        reason: reportData.reason,
        description: reportData.description || null,
        status: 'pending'
      };

      const result = await db.insert(moderationReports).values(reportRecord).returning();
      return result[0];
    } catch (error) {
      logger.error('Error creating moderation report', undefined, error as Error, 'server');
      throw error;
    }
  }

  async getUserModerationReports(userId: number): Promise<any[]> {
    try {
      const reports = await db.select()
        .from(moderationReports)
        .where(eq(moderationReports.reporterId, userId))
        .orderBy(desc(moderationReports.createdAt));
      
      return reports;
    } catch (error) {
      logger.error('Error getting user moderation reports', undefined, error as Error, 'server');
      return [];
    }
  }

  async getFinancialServicesByUserId(userId: number): Promise<any[]> {
    try {
      const services = await db.select()
        .from(financialServices)
        .where(eq(financialServices.userId, userId))
        .orderBy(desc(financialServices.createdAt));
      
      return services;
    } catch (error) {
      logger.error('Error fetching financial services', undefined, error as Error, 'server');
      return [];
    }
  }

  async createFinancialService(serviceData: any): Promise<any> {
    try {
      const result = await db.insert(financialServices)
        .values(serviceData)
        .returning();
      
      return result[0];
    } catch (error) {
      logger.error('Error creating financial service', undefined, error as Error, 'server');
      throw error;
    }
  }

  async updateFinancialService(id: number, userId: number, updates: any): Promise<any | undefined> {
    try {
      const result = await db.update(financialServices)
        .set({
          ...updates,
          updatedAt: new Date()
        })
        .where(
          and(
            eq(financialServices.id, id),
            eq(financialServices.userId, userId)
          )
        )
        .returning();
      
      return result[0];
    } catch (error) {
      logger.error('Error updating financial service', undefined, error as Error, 'server');
      return undefined;
    }
  }

  async deleteFinancialService(id: number, userId: number): Promise<boolean> {
    try {
      const result = await db.delete(financialServices)
        .where(
          and(
            eq(financialServices.id, id),
            eq(financialServices.userId, userId)
          )
        )
        .returning();
      
      return result.length > 0;
    } catch (error) {
      logger.error('Error deleting financial service', undefined, error as Error, 'server');
      return false;
    }
  }

  async getGovernmentServicesByUserId(userId: number): Promise<any[]> {
    try {
      const services = await db.select()
        .from(governmentServices)
        .where(eq(governmentServices.userId, userId))
        .orderBy(desc(governmentServices.createdAt));
      
      return services;
    } catch (error) {
      logger.error('Error fetching government services', undefined, error as Error, 'server');
      return [];
    }
  }

  async createGovernmentService(serviceData: any): Promise<any> {
    try {
      const result = await db.insert(governmentServices)
        .values(serviceData)
        .returning();
      
      return result[0];
    } catch (error) {
      logger.error('Error creating government service', undefined, error as Error, 'server');
      throw error;
    }
  }

  async updateGovernmentService(id: number, userId: number, updates: any): Promise<any | undefined> {
    try {
      const result = await db.update(governmentServices)
        .set({
          ...updates,
          updatedAt: new Date()
        })
        .where(
          and(
            eq(governmentServices.id, id),
            eq(governmentServices.userId, userId)
          )
        )
        .returning();
      
      return result[0];
    } catch (error) {
      logger.error('Error updating government service', undefined, error as Error, 'server');
      return undefined;
    }
  }

  async deleteGovernmentService(id: number, userId: number): Promise<boolean> {
    try {
      const result = await db.delete(governmentServices)
        .where(
          and(
            eq(governmentServices.id, id),
            eq(governmentServices.userId, userId)
          )
        )
        .returning();
      
      return result.length > 0;
    } catch (error) {
      logger.error('Error deleting government service', undefined, error as Error, 'server');
      return false;
    }
  }

  async createTicket(ticketData: any): Promise<any> {
    try {
      const ticketNumber = `TKT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      
      const result = await db.insert(tickets)
        .values({
          ...ticketData,
          ticketNumber,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();
      
      return result[0];
    } catch (error) {
      logger.error('Error creating ticket', undefined, error as Error, 'server');
      throw error;
    }
  }

  async getTicket(id: number): Promise<any | undefined> {
    try {
      const result = await db.select()
        .from(tickets)
        .where(eq(tickets.id, id))
        .limit(1);
      
      return result[0];
    } catch (error) {
      logger.error('Error fetching ticket', undefined, error as Error, 'server');
      return undefined;
    }
  }

  async getTickets(filters?: { status?: string; department?: string; assignedTo?: number; userId?: number; priority?: string }): Promise<any[]> {
    try {
      let query = db.select()
        .from(tickets)
        .orderBy(desc(tickets.createdAt));

      const conditions = [];
      
      if (filters?.status) {
        conditions.push(eq(tickets.status, filters.status as any));
      }
      if (filters?.department) {
        conditions.push(eq(tickets.department, filters.department as any));
      }
      if (filters?.assignedTo) {
        conditions.push(eq(tickets.assignedTo, filters.assignedTo));
      }
      if (filters?.userId) {
        conditions.push(eq(tickets.userId, filters.userId));
      }
      if (filters?.priority) {
        conditions.push(eq(tickets.priority, filters.priority as any));
      }

      if (conditions.length > 0) {
        query = query.where(and(...conditions)) as any;
      }

      const result = await query;
      return result;
    } catch (error) {
      logger.error('Error fetching tickets', undefined, error as Error, 'server');
      return [];
    }
  }

  async getTicketByNumber(ticketNumber: string): Promise<any | undefined> {
    try {
      const result = await db.select()
        .from(tickets)
        .where(eq(tickets.ticketNumber, ticketNumber))
        .limit(1);
      
      return result[0];
    } catch (error) {
      logger.error('Error fetching ticket by number', undefined, error as Error, 'server');
      return undefined;
    }
  }

  async getTicketsByUser(userId: number): Promise<any[]> {
    try {
      const result = await db.select()
        .from(tickets)
        .where(eq(tickets.userId, userId))
        .orderBy(desc(tickets.createdAt));
      
      return result;
    } catch (error) {
      logger.error('Error fetching tickets by user', undefined, error as Error, 'server');
      return [];
    }
  }

  async getTicketsByEmail(email: string): Promise<any[]> {
    try {
      const result = await db.select()
        .from(tickets)
        .where(eq(tickets.email, email))
        .orderBy(desc(tickets.createdAt));
      
      return result;
    } catch (error) {
      logger.error('Error fetching tickets by email', undefined, error as Error, 'server');
      return [];
    }
  }

  async getTicketsByDepartment(department: string): Promise<any[]> {
    try {
      const result = await db.select()
        .from(tickets)
        .where(eq(tickets.department, department as any))
        .orderBy(desc(tickets.createdAt));
      
      return result;
    } catch (error) {
      logger.error('Error fetching tickets by department', undefined, error as Error, 'server');
      return [];
    }
  }

  async updateTicket(id: number, updates: any): Promise<any | undefined> {
    try {
      const result = await db.update(tickets)
        .set({
          ...updates,
          updatedAt: new Date()
        })
        .where(eq(tickets.id, id))
        .returning();
      
      return result[0];
    } catch (error) {
      logger.error('Error updating ticket', undefined, error as Error, 'server');
      return undefined;
    }
  }

  async assignTicket(id: number, assignedTo: number): Promise<any | undefined> {
    try {
      const result = await db.update(tickets)
        .set({
          assignedTo,
          status: 'in_progress',
          updatedAt: new Date()
        })
        .where(eq(tickets.id, id))
        .returning();
      
      return result[0];
    } catch (error) {
      logger.error('Error assigning ticket', undefined, error as Error, 'server');
      return undefined;
    }
  }

  async resolveTicket(id: number, resolvedBy: number): Promise<any | undefined> {
    try {
      const result = await db.update(tickets)
        .set({
          status: 'resolved',
          resolvedBy,
          resolvedAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(tickets.id, id))
        .returning();
      
      return result[0];
    } catch (error) {
      logger.error('Error resolving ticket', undefined, error as Error, 'server');
      return undefined;
    }
  }

  async closeTicket(id: number): Promise<any | undefined> {
    try {
      const result = await db.update(tickets)
        .set({
          status: 'closed',
          closedAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(tickets.id, id))
        .returning();
      
      return result[0];
    } catch (error) {
      logger.error('Error closing ticket', undefined, error as Error, 'server');
      return undefined;
    }
  }

  async deleteTicket(id: number): Promise<boolean> {
    try {
      const result = await db.delete(tickets)
        .where(eq(tickets.id, id))
        .returning();
      
      return result.length > 0;
    } catch (error) {
      logger.error('Error deleting ticket', undefined, error as Error, 'server');
      return false;
    }
  }

  async getTicketStats(): Promise<any> {
    try {
      const allTickets = await db.select().from(tickets);
      
      const stats = {
        total: allTickets.length,
        open: allTickets.filter(t => t.status === 'open').length,
        inProgress: allTickets.filter(t => t.status === 'in_progress').length,
        resolved: allTickets.filter(t => t.status === 'resolved').length,
        closed: allTickets.filter(t => t.status === 'closed').length,
        byDepartment: {
          operations: allTickets.filter(t => t.department === 'operations').length,
          tech: allTickets.filter(t => t.department === 'tech').length,
          legal: allTickets.filter(t => t.department === 'legal').length,
          marketing: allTickets.filter(t => t.department === 'marketing').length,
          sales: allTickets.filter(t => t.department === 'sales').length,
          finance: allTickets.filter(t => t.department === 'finance').length,
          hr: allTickets.filter(t => t.department === 'hr').length,
        },
        byPriority: {
          low: allTickets.filter(t => t.priority === 'low').length,
          medium: allTickets.filter(t => t.priority === 'medium').length,
          high: allTickets.filter(t => t.priority === 'high').length,
          urgent: allTickets.filter(t => t.priority === 'urgent').length,
        }
      };
      
      return stats;
    } catch (error) {
      logger.error('Error fetching ticket stats', undefined, error as Error, 'server');
      return { total: 0, open: 0, inProgress: 0, resolved: 0, closed: 0, byDepartment: {}, byPriority: {} };
    }
  }

  async createTicketMessage(messageData: any): Promise<any> {
    try {
      const result = await db.insert(ticketMessages)
        .values({
          ...messageData,
          createdAt: new Date()
        })
        .returning();
      
      await db.update(tickets)
        .set({ updatedAt: new Date() })
        .where(eq(tickets.id, messageData.ticketId));
      
      return result[0];
    } catch (error) {
      logger.error('Error creating ticket message', undefined, error as Error, 'server');
      throw error;
    }
  }

  async getTicketMessages(ticketId: number): Promise<any[]> {
    try {
      const result = await db.select()
        .from(ticketMessages)
        .where(eq(ticketMessages.ticketId, ticketId))
        .orderBy(asc(ticketMessages.createdAt));
      
      return result;
    } catch (error) {
      logger.error('Error fetching ticket messages', undefined, error as Error, 'server');
      return [];
    }
  }

  async getTicketMessage(id: number): Promise<any | undefined> {
    try {
      const result = await db.select()
        .from(ticketMessages)
        .where(eq(ticketMessages.id, id))
        .limit(1);
      
      return result[0];
    } catch (error) {
      logger.error('Error fetching ticket message', undefined, error as Error, 'server');
      return undefined;
    }
  }

  // =====================================
  // Analytics Tracking Methods
  // =====================================

  async trackProfileView(data: { profileUserId: number; viewerUserId: number | null; viewerIp: string | null; viewerUserAgent: string | null }): Promise<void> {
    try {
      await db.insert(profileViews).values({
        profileUserId: data.profileUserId,
        viewerUserId: data.viewerUserId,
        viewerIp: data.viewerIp,
        viewerUserAgent: data.viewerUserAgent,
      });
      logger.info('Profile view tracked', { profileUserId: data.profileUserId, viewerUserId: data.viewerUserId }, 'server');
    } catch (error) {
      logger.error('Error tracking profile view', undefined, error as Error, 'server');
    }
  }

  async trackPostImpression(data: { postId: number; userId: number | null; impressionType: string; userIp: string | null; userAgent: string | null }): Promise<void> {
    try {
      await db.insert(postImpressions).values({
        postId: data.postId,
        userId: data.userId,
        impressionType: data.impressionType,
        userIp: data.userIp,
        userAgent: data.userAgent,
      });
      logger.info('Post impression tracked', { postId: data.postId, userId: data.userId, impressionType: data.impressionType }, 'server');
    } catch (error) {
      logger.error('Error tracking post impression', undefined, error as Error, 'server');
    }
  }

  async trackSearchAppearance(data: { userId: number; searchQuery: string; searchType: string; position: number | null; searcherUserId: number | null }): Promise<void> {
    try {
      await db.insert(searchAppearances).values({
        userId: data.userId,
        searchQuery: data.searchQuery,
        searchType: data.searchType,
        position: data.position,
        searcherUserId: data.searcherUserId,
      });
      logger.info('Search appearance tracked', { userId: data.userId, searchQuery: data.searchQuery, searchType: data.searchType }, 'server');
    } catch (error) {
      logger.error('Error tracking search appearance', undefined, error as Error, 'server');
    }
  }

  async getUserAnalyticsStats(userId: number): Promise<{ profileViews: number; postImpressions: number; searchAppearances: number }> {
    try {
      // Get profile views count
      const profileViewsResult = await db.select({ count: count() })
        .from(profileViews)
        .where(eq(profileViews.profileUserId, userId));
      
      // Get post impressions count (sum all impressions for user's posts)
      const userPosts = await db.select({ id: posts.id })
        .from(posts)
        .where(eq(posts.userId, userId));
      
      const postIds = userPosts.map(p => p.id);
      let postImpressionsCount = 0;
      
      if (postIds.length > 0) {
        const postImpressionsResult = await db.select({ count: count() })
          .from(postImpressions)
          .where(inArray(postImpressions.postId, postIds));
        
        postImpressionsCount = Number(postImpressionsResult[0]?.count || 0);
      }
      
      // Get search appearances count
      const searchAppearancesResult = await db.select({ count: count() })
        .from(searchAppearances)
        .where(eq(searchAppearances.userId, userId));
      
      const stats = {
        profileViews: Number(profileViewsResult[0]?.count || 0),
        postImpressions: postImpressionsCount,
        searchAppearances: Number(searchAppearancesResult[0]?.count || 0),
      };
      
      logger.info('User analytics stats retrieved', { userId, stats }, 'server');
      return stats;
    } catch (error) {
      logger.error('Error getting user analytics stats', undefined, error as Error, 'server');
      return { profileViews: 0, postImpressions: 0, searchAppearances: 0 };
    }
  }

}

export const storage = new DatabaseStorage();
