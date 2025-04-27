import session from "express-session";
import createMemoryStore from "memorystore";
import { hashPassword } from "./auth";

import {
  users, vendors, products, categories, posts, comments,
  likes, messages, notifications, reviews, carts,
  wallets, transactions, orders, orderItems, communities,
  communityMembers, membershipTiers, memberships, events,
  eventRegistrations, polls, pollVotes, creatorEarnings, subscriptions,
  videos, videoEngagements, videoAnalytics, videoPlaylists, playlistItems,
  videoPurchases, videoProductOverlays, communityContents,
  type User, type InsertUser, type Vendor, type InsertVendor,
  type Product, type InsertProduct, type Category, type InsertCategory,
  type Post, type InsertPost, type Comment, type InsertComment,
  type Message, type InsertMessage, type Review, type InsertReview,
  type Cart, type InsertCart, type Wallet, type InsertWallet,
  type Transaction, type InsertTransaction, type Order, type InsertOrder,
  type OrderItem, type InsertOrderItem, type Community, type InsertCommunity,
  type CommunityMember, type InsertCommunityMember, type MembershipTier, type InsertMembershipTier,
  type Membership, type InsertMembership, type Event, type InsertEvent,
  type EventRegistration, type InsertEventRegistration, type Poll, type InsertPoll,
  type PollVote, type InsertPollVote, type CreatorEarning, type InsertCreatorEarning,
  type Subscription, type InsertSubscription, type Video, type InsertVideo,
  type VideoEngagement, type InsertVideoEngagement, type VideoAnalytics, type InsertVideoAnalytics,
  type VideoPlaylist, type InsertVideoPlaylist, type PlaylistItem, type InsertPlaylistItem,
  type VideoProductOverlay, type InsertVideoProductOverlay, type VideoPurchase, type InsertVideoPurchase,
  type CommunityContent, type InsertCommunityContent
} from "@shared/schema";

// Interface for all storage operations
export interface IStorage {
  // Session store for authentication
  sessionStore: any;
  
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByResetToken(token: string): Promise<User | undefined>;
  getUserByVerificationToken(token: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User | undefined>;
  updateUserPassword(id: number, newPassword: string): Promise<User | undefined>;
  updateUserRole(id: number, role: string): Promise<User | undefined>;
  verifyUserEmail(id: number): Promise<User | undefined>;
  lockUserAccount(id: number, isLocked: boolean): Promise<User | undefined>;
  incrementLoginAttempts(id: number): Promise<User | undefined>;
  resetLoginAttempts(id: number): Promise<User | undefined>;
  listUsers(): Promise<User[]>;
  searchUsers(searchTerm: string): Promise<User[]>;
  deleteUser(id: number): Promise<boolean>;
  resetUserPassword(id: number, newPassword: string): Promise<User | undefined>;
  getUserCount(): Promise<number>;
  getProductCount(): Promise<number>;
  getOrderCount(): Promise<number>;
  getCommunityCount(): Promise<number>;
  
  // Community and vendor operations
  getUserCommunities(userId: number): Promise<Community[]>;
  getVendorByUserId(userId: number): Promise<Vendor | undefined>;
  getUserPosts(userId: number): Promise<Post[]>;
  
  // Community content operations
  createCommunityContent(content: InsertCommunityContent): Promise<CommunityContent>;
  getCommunityContent(contentId: number): Promise<CommunityContent | undefined>;
  updateCommunityContent(contentId: number, updates: Partial<CommunityContent>): Promise<CommunityContent | undefined>;
  deleteCommunityContent(contentId: number): Promise<boolean>;
  listCommunityContent(communityId: number): Promise<CommunityContent[]>;
  getAccessibleCommunityContent(userId: number, communityId: number): Promise<CommunityContent[]>;
  canUserAccessContent(userId: number, contentId: number): Promise<boolean>;
  incrementContentViewCount(contentId: number): Promise<void>;
  likeContent(contentId: number, userId: number): Promise<void>;
  unlikeContent(contentId: number, userId: number): Promise<void>;
  getCommunityContentByTier(communityId: number, tierId: number): Promise<CommunityContent[]>;
  getCommunityContentByType(communityId: number, contentType: string): Promise<CommunityContent[]>;
  getFeaturedCommunityContent(communityId: number): Promise<CommunityContent[]>;
  isUserCommunityAdminOrOwner(userId: number, communityId: number): Promise<boolean>;
  
  // Membership tier operations
  getMembershipTier(tierId: number): Promise<MembershipTier | undefined>;
  
  // Messaging operations
  createMessage(message: InsertMessage): Promise<Message>;
  getMessage(id: number): Promise<Message | undefined>;
  getUserMessages(userId: number): Promise<Message[]>;
  getConversationMessages(userId1: number, userId2: number): Promise<Message[]>;
  getUserConversations(userId: number): Promise<any[]>; // Returns user's active conversations
  getUnreadMessageCount(userId: number): Promise<number>;
  markMessageAsRead(id: number): Promise<Message | undefined>;
  
  // Video operations
  createVideo(video: InsertVideo): Promise<Video>;
  getVideo(id: number): Promise<Video | undefined>;
  updateVideo(id: number, updates: Partial<Video>): Promise<Video | undefined>;
  deleteVideo(id: number): Promise<boolean>;
  listVideos(filter?: Record<string, any>): Promise<Video[]>;
  getTrendingVideos(limit?: number): Promise<Video[]>;
  getUserVideos(userId: number): Promise<Video[]>;
  getVideosByType(type: string): Promise<Video[]>;
  
  // Video product overlays
  createVideoProductOverlay(overlay: InsertVideoProductOverlay): Promise<VideoProductOverlay>;
  getVideoProductOverlays(videoId: number): Promise<VideoProductOverlay[]>;
  getVideoProductOverlay(id: number): Promise<VideoProductOverlay | undefined>;
  updateVideoProductOverlay(id: number, updates: Partial<VideoProductOverlay>): Promise<VideoProductOverlay | undefined>;
  deleteVideoProductOverlay(id: number): Promise<boolean>;
  incrementOverlayClickCount(id: number): Promise<VideoProductOverlay | undefined>;
  incrementOverlayConversionCount(id: number): Promise<VideoProductOverlay | undefined>;
  
  // Video engagements
  createVideoEngagement(engagement: InsertVideoEngagement): Promise<VideoEngagement>;
  getVideoEngagements(videoId: number, type?: string): Promise<VideoEngagement[]>;
  getUserVideoEngagements(userId: number, type?: string): Promise<VideoEngagement[]>;
  
  // Video analytics
  getVideoAnalytics(videoId: number): Promise<VideoAnalytics | undefined>;
  updateVideoAnalytics(videoId: number, data: Partial<VideoAnalytics>): Promise<VideoAnalytics>;
  
  // Premium video purchases
  createVideoPurchase(purchase: InsertVideoPurchase): Promise<VideoPurchase>;
  getVideoPurchase(id: number): Promise<VideoPurchase | undefined>;
  getVideoPurchaseByUserAndVideo(userId: number, videoId: number): Promise<VideoPurchase | undefined>;
  getUserVideoPurchases(userId: number): Promise<VideoPurchase[]>;
  getVideoRevenue(videoId: number): Promise<number>;
  getCreatorVideoRevenue(userId: number): Promise<{ totalRevenue: number; videoCount: number; }>;
  hasUserPurchasedVideo(userId: number, videoId: number): Promise<boolean>;
  
  // Community Content operations
  getCommunityContent(id: number): Promise<CommunityContent | undefined>;
  createCommunityContent(content: InsertCommunityContent): Promise<CommunityContent>;
  updateCommunityContent(id: number, data: Partial<InsertCommunityContent>): Promise<CommunityContent | undefined>;
  deleteCommunityContent(id: number): Promise<boolean>;
  listCommunityContents(communityId: number, options?: {
    contentType?: string;
    tierId?: number;
    isFeatured?: boolean;
    creatorId?: number;
    limit?: number;
    offset?: number;
  }): Promise<CommunityContent[]>;
  incrementContentView(id: number): Promise<CommunityContent | undefined>;
  getUserAccessibleContent(userId: number, communityId: number): Promise<CommunityContent[]>;
  
  // Playlist operations
  createPlaylist(playlist: InsertVideoPlaylist): Promise<VideoPlaylist>;
  getPlaylist(id: number): Promise<VideoPlaylist | undefined>;
  updatePlaylist(id: number, updates: Partial<VideoPlaylist>): Promise<VideoPlaylist | undefined>;
  deletePlaylist(id: number): Promise<boolean>;
  getUserPlaylists(userId: number): Promise<VideoPlaylist[]>;
  
  // Playlist item operations
  addToPlaylist(item: InsertPlaylistItem): Promise<PlaylistItem>;
  removeFromPlaylist(playlistId: number, videoId: number): Promise<boolean>;
  getPlaylistItems(playlistId: number): Promise<PlaylistItem[]>;

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
  updatePost(id: number, postData: Partial<InsertPost>): Promise<Post>;
  updatePostStats(id: number, stats: { likes?: number; comments?: number; shares?: number; views?: number }): Promise<Post>;
  deletePost(id: number): Promise<boolean>;
  listPosts(options?: {
    userId?: number;
    contentType?: string | string[];
    isPromoted?: boolean;
    tags?: string[];
    limit?: number;
    offset?: number;
  }): Promise<Post[]>;
  getUserPosts(userId: number): Promise<Post[]>;
  incrementPostView(id: number): Promise<Post>;
  promotePost(id: number, endDate: Date): Promise<Post>;
  unpromotePost(id: number): Promise<Post>;

  // Comment operations
  getComment(id: number): Promise<Comment | undefined>;
  createComment(comment: InsertComment): Promise<Comment>;
  listCommentsByPost(postId: number): Promise<Comment[]>;

  // Legacy message operations (will be replaced with our enhanced versions above)

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
  
  // Get top buyers for a vendor
  getVendorTopBuyers(vendorId: number, limit?: number): Promise<{ 
    user: { id: number; username: string; name: string; email: string; }; 
    totalSpent: number; 
    orderCount: number;
  }[]>;

  // Community management operations
  getCommunity(id: number): Promise<Community | undefined>;
  getCommunityByName(name: string): Promise<Community | undefined>;
  createCommunity(community: InsertCommunity): Promise<Community>;
  updateCommunity(id: number, data: Partial<InsertCommunity>): Promise<Community>;
  updateCommunityMemberCount(id: number, change: number): Promise<Community>;
  listCommunities(options?: {
    ownerId?: number;
    visibility?: string | string[];
    topics?: string[];
    isVerified?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<Community[]>;
  
  // Community members operations
  getCommunityMember(id: number): Promise<CommunityMember | undefined>;
  getMembershipStatus(communityId: number, userId: number): Promise<CommunityMember | undefined>;
  addCommunityMember(member: InsertCommunityMember): Promise<CommunityMember>;
  updateMemberRole(communityId: number, userId: number, role: string): Promise<CommunityMember>;
  removeCommunityMember(communityId: number, userId: number): Promise<boolean>;
  listCommunityMembers(communityId: number, role?: string): Promise<CommunityMember[]>;
  
  // Membership tiers operations
  getMembershipTier(id: number): Promise<MembershipTier | undefined>;
  createMembershipTier(tier: InsertMembershipTier): Promise<MembershipTier>;
  updateMembershipTier(id: number, data: Partial<InsertMembershipTier>): Promise<MembershipTier>;
  deleteMembershipTier(id: number): Promise<boolean>;
  listMembershipTiers(communityId: number): Promise<MembershipTier[]>;
  
  // User membership operations
  getMembership(id: number): Promise<Membership | undefined>;
  getUserMemberships(userId: number): Promise<Membership[]>;
  getUserCommunityMembership(userId: number, communityId: number): Promise<Membership | undefined>;
  getTierMemberCount(tierId: number): Promise<number>;
  createMembership(membership: InsertMembership): Promise<Membership>;
  updateMembershipStatus(id: number, status: string): Promise<Membership>;
  cancelMembership(id: number): Promise<Membership>;
  
  // Events operations
  getEvent(id: number): Promise<Event | undefined>;
  createEvent(event: InsertEvent): Promise<Event>;
  updateEvent(id: number, data: Partial<InsertEvent>): Promise<Event>;
  listEvents(options?: {
    communityId?: number;
    hostId?: number;
    eventType?: string;
    startAfter?: Date;
    startBefore?: Date;
    isPublished?: boolean;
    requiredTierId?: number;
    limit?: number;
    offset?: number;
  }): Promise<Event[]>;
  publishEvent(id: number): Promise<Event>;
  cancelEvent(id: number): Promise<boolean>;
  
  // Event registrations operations
  getEventRegistration(id: number): Promise<EventRegistration | undefined>;
  registerForEvent(registration: InsertEventRegistration): Promise<EventRegistration>;
  cancelRegistration(eventId: number, userId: number): Promise<boolean>;
  checkInAttendee(eventId: number, userId: number): Promise<EventRegistration>;
  listEventAttendees(eventId: number): Promise<EventRegistration[]>;
  countEventAttendees(eventId: number): Promise<number>;
  
  // Polls operations
  getPoll(id: number): Promise<Poll | undefined>;
  createPoll(poll: InsertPoll): Promise<Poll>;
  updatePoll(id: number, data: Partial<InsertPoll>): Promise<Poll>;
  closePoll(id: number): Promise<Poll>;
  listPolls(communityId: number, isActive?: boolean): Promise<Poll[]>;
  
  // Poll votes operations
  getPollVote(pollId: number, userId: number): Promise<PollVote | undefined>;
  castVote(vote: InsertPollVote): Promise<PollVote>;
  listPollVotes(pollId: number): Promise<PollVote[]>;
  getPollResults(pollId: number): Promise<{ optionIndex: number; votes: number; percentage: number }[]>;
  
  // Creator earnings operations
  getCreatorEarning(id: number): Promise<CreatorEarning | undefined>;
  addCreatorEarning(earning: InsertCreatorEarning): Promise<CreatorEarning>;
  updateEarningStatus(id: number, status: string): Promise<CreatorEarning>;
  listCreatorEarnings(userId: number): Promise<CreatorEarning[]>;
  getCreatorRevenueStats(userId: number): Promise<{
    totalRevenue: number;
    pendingPayouts: number;
    paidRevenue: number;
    bySource: Record<string, number>;
    byPeriod: Record<string, number>;
  }>;
  
  // Subscriptions operations
  getSubscription(id: number): Promise<Subscription | undefined>;
  getUserSubscriptions(userId: number): Promise<Subscription[]>;
  getCreatorSubscribers(creatorId: number): Promise<Subscription[]>;
  createSubscription(subscription: InsertSubscription): Promise<Subscription>;
  updateSubscriptionStatus(id: number, status: string): Promise<Subscription>;
  cancelSubscription(id: number): Promise<Subscription>;
  
  // Social network operations
  getTrendingPosts(limit?: number): Promise<Post[]>;
  getPopularTags(limit?: number): Promise<{ name: string; count: number }[]>;
  getPopularCommunities(limit?: number): Promise<Community[]>;
  getFeaturedProducts(limit?: number): Promise<Product[]>;
  
  // Video operations
  createVideo(video: InsertVideo): Promise<Video>;
  getVideo(id: number): Promise<Video | undefined>;
  updateVideo(id: number, videoData: Partial<Video>): Promise<Video | undefined>;
  listVideos(options?: { userId?: number, videoType?: string, limit?: number }): Promise<Video[]>;
  getVideosByUser(userId: number, videoType?: string): Promise<Video[]>;
  getTrendingVideos(limit?: number): Promise<Video[]>;
  getVideoEngagements(videoId: number): Promise<VideoEngagement[]>;
  createVideoEngagement(engagement: InsertVideoEngagement): Promise<VideoEngagement>;
  updateVideoAnalytics(videoId: number, data: Partial<VideoAnalytics>): Promise<VideoAnalytics>;
  getVideoAnalytics(videoId: number): Promise<VideoAnalytics | undefined>;
  createVideoPlaylist(playlist: InsertVideoPlaylist): Promise<VideoPlaylist>;
  getVideoPlaylist(id: number): Promise<VideoPlaylist | undefined>;
  getPlaylistVideos(playlistId: number): Promise<Video[]>;
  addVideoToPlaylist(playlistId: number, videoId: number, position: number): Promise<PlaylistItem>;
  removeVideoFromPlaylist(playlistId: number, videoId: number): Promise<void>;
  getUserPlaylists(userId: number): Promise<VideoPlaylist[]>;
  getSuggestedUsers(limit?: number, currentUserId?: number): Promise<User[]>;
  
  // Premium video purchase operations
  createVideoPurchase(purchase: InsertVideoPurchase): Promise<VideoPurchase>;
  getVideoPurchase(id: number): Promise<VideoPurchase | undefined>;
  getVideoPurchaseByUserAndVideo(userId: number, videoId: number): Promise<VideoPurchase | undefined>;
  
  // Community Content operations
  getCommunityContent(id: number): Promise<CommunityContent | undefined>;
  createCommunityContent(content: InsertCommunityContent): Promise<CommunityContent>;
  updateCommunityContent(id: number, data: Partial<InsertCommunityContent>): Promise<CommunityContent | undefined>;
  deleteCommunityContent(id: number): Promise<boolean>;
  listCommunityContents(communityId: number, options?: {
    contentType?: string;
    tierId?: number;
    isFeatured?: boolean;
    creatorId?: number;
    limit?: number;
    offset?: number;
  }): Promise<CommunityContent[]>;
  incrementContentView(id: number): Promise<CommunityContent | undefined>;
  getUserAccessibleContent(userId: number, communityId: number): Promise<CommunityContent[]>;
  getUserVideoPurchases(userId: number): Promise<VideoPurchase[]>;
  hasUserPurchasedVideo(userId: number, videoId: number): Promise<boolean>;
  getVideoRevenue(videoId: number): Promise<number>;
  getCreatorVideoRevenue(userId: number): Promise<{ totalRevenue: number; videoCount: number; }>;
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
  // Instead of follows, we'll use connections for user relationships
  private carts: Map<number, Cart>;
  private wallets: Map<number, Wallet>;
  private transactions: Map<number, Transaction>;
  private orders: Map<number, Order>;
  private orderItems: Map<number, OrderItem>;
  
  // Community management and monetization maps
  private communities: Map<number, Community>;
  private communityMembers: Map<number, CommunityMember>;
  private membershipTiers: Map<number, MembershipTier>;
  private memberships: Map<number, Membership>;
  private events: Map<number, Event>;
  private eventRegistrations: Map<number, EventRegistration>;
  private polls: Map<number, Poll>;
  private pollVotes: Map<number, PollVote>;
  private creatorEarnings: Map<number, CreatorEarning>;
  private subscriptions: Map<number, Subscription>;
  private communityContents: Map<number, CommunityContent>;
  private contentLikes: Map<number, { contentId: number; userId: number }>;
  
  // Video-related maps
  private videos: Map<number, Video>;
  private videoEngagements: Map<number, VideoEngagement>;
  private videoAnalytics: Map<number, VideoAnalytics>;
  private videoProductOverlays: Map<number, VideoProductOverlay>;
  private videoPlaylists: Map<number, VideoPlaylist>;
  private playlistItems: Map<number, PlaylistItem>;
  private videoPurchases: Map<number, VideoPurchase>;

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
  private videoIdCounter: number;
  private videoEngagementIdCounter: number;
  private videoAnalyticsIdCounter: number;
  private videoProductOverlayIdCounter: number;
  private videoPlaylistIdCounter: number;
  private playlistItemIdCounter: number;
  private videoPurchaseIdCounter: number;
  private cartIdCounter: number;
  private walletIdCounter: number;
  private transactionIdCounter: number;
  private orderIdCounter: number;
  private orderItemIdCounter: number;
  
  // Community management and monetization counters
  private communityIdCounter: number;
  private communityMemberIdCounter: number;
  private membershipTierIdCounter: number;
  private membershipIdCounter: number;
  private eventIdCounter: number;
  private eventRegistrationIdCounter: number;
  private pollIdCounter: number;
  private pollVoteIdCounter: number;
  private creatorEarningIdCounter: number;
  private subscriptionIdCounter: number;
  private communityContentIdCounter: number;
  
  // Video-related counters (already defined above)

  // Session store for authentication
  sessionStore: any;
  
  constructor() {
    // Initialize session store with memorystore
    const MemoryStore = createMemoryStore(session);
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    });
    
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
    // Use connections for user relationships
    this.carts = new Map();
    this.wallets = new Map();
    this.transactions = new Map();
    this.orders = new Map();
    this.orderItems = new Map();
    
    // Initialize community management and monetization maps
    this.communities = new Map();
    this.communityMembers = new Map();
    this.membershipTiers = new Map();
    this.memberships = new Map();
    this.events = new Map();
    this.eventRegistrations = new Map();
    this.polls = new Map();
    this.pollVotes = new Map();
    this.creatorEarnings = new Map();
    this.subscriptions = new Map();
    this.communityContents = new Map();
    this.contentLikes = new Map();
    
    // Initialize video-related maps
    this.videos = new Map();
    this.videoEngagements = new Map();
    this.videoAnalytics = new Map();
    this.videoProductOverlays = new Map();
    this.videoPlaylists = new Map();
    this.playlistItems = new Map();
    this.videoPurchases = new Map();

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
    this.orderIdCounter = 1;
    this.orderItemIdCounter = 1;
    
    // Initialize community management and monetization counters
    this.communityIdCounter = 1;
    this.communityMemberIdCounter = 1;
    this.membershipTierIdCounter = 1;
    this.membershipIdCounter = 1;
    this.eventIdCounter = 1;
    this.eventRegistrationIdCounter = 1;
    this.pollIdCounter = 1;
    this.pollVoteIdCounter = 1;
    this.creatorEarningIdCounter = 1;
    this.subscriptionIdCounter = 1;
    this.communityContentIdCounter = 1;
    
    // Initialize video-related counters
    this.videoIdCounter = 1;
    this.videoEngagementIdCounter = 1;
    this.videoAnalyticsIdCounter = 1;
    this.videoProductOverlayIdCounter = 1;
    this.videoPlaylistIdCounter = 1;
    this.playlistItemIdCounter = 1;
    this.videoPurchaseIdCounter = 1;

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
    console.log(`[DEBUG] Looking up user by username: "${username}"`);
    console.log(`[DEBUG] Current users in storage:`, Array.from(this.users.entries()).map(([id, user]) => ({id, username: user.username})));
    
    // Make search case-insensitive to improve matching
    const user = Array.from(this.users.values()).find(
      user => user.username.toLowerCase() === username.toLowerCase()
    );
    
    console.log(`[DEBUG] User found:`, user ? `Yes (ID: ${user.id})` : 'No');
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }
  
  async getUserByResetToken(token: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.passwordResetToken === token);
  }
  
  async getUserByVerificationToken(token: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.verificationToken === token);
  }

  async createUser(user: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const now = new Date();
    
    // Initialize user with all security fields and defaults
    const newUser: User = {
      id,
      ...user,
      role: user.role || 'user',
      lastLogin: now,
      failedLoginAttempts: 0,
      isLocked: false,
      passwordResetToken: null,
      passwordResetExpires: null, 
      emailVerified: false,
      verificationToken: null,
      twoFactorEnabled: false,
      twoFactorSecret: null,
      createdAt: now,
      updatedAt: now
    };
    
    console.log(`[DEBUG] Creating new user with ID ${id}, username: ${user.username}, role: ${newUser.role}`);
    this.users.set(id, newUser);
    return newUser;
  }
  
  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) {
      return undefined;
    }
    
    const updatedUser = { 
      ...user, 
      ...updates,
      updatedAt: new Date()
    };
    
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  async updateUserPassword(id: number, newPassword: string): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) {
      return undefined;
    }
    
    const updatedUser = { 
      ...user, 
      password: newPassword,
      passwordResetToken: null,
      passwordResetExpires: null,
      failedLoginAttempts: 0,
      isLocked: false,
      updatedAt: new Date() 
    };
    
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  async updateUserRole(id: number, role: "user" | "admin" | "moderator" | "vendor"): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) {
      return undefined;
    }
    
    // Validate role is one of the allowed values
    if (!["user", "admin", "moderator", "vendor"].includes(role)) {
      throw new Error(`Invalid role: ${role}. Must be one of: user, admin, moderator, vendor`);
    }
    
    const updatedUser = { 
      ...user, 
      role,
      updatedAt: new Date() 
    };
    
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  async verifyUserEmail(id: number): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) {
      return undefined;
    }
    
    const updatedUser = { 
      ...user, 
      emailVerified: true,
      verificationToken: null,
      updatedAt: new Date() 
    };
    
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  async lockUserAccount(id: number, isLocked: boolean): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) {
      return undefined;
    }
    
    const updatedUser = { 
      ...user, 
      isLocked,
      updatedAt: new Date() 
    };
    
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  async incrementLoginAttempts(id: number): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) {
      return undefined;
    }
    
    const failedAttempts = (user.failedLoginAttempts || 0) + 1;
    const isLocked = failedAttempts >= 5; // Lock after 5 failed attempts
    
    const updatedUser = { 
      ...user, 
      failedLoginAttempts: failedAttempts,
      isLocked: isLocked ? true : user.isLocked,
      updatedAt: new Date() 
    };
    
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  async resetLoginAttempts(id: number): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) {
      return undefined;
    }
    
    const updatedUser = { 
      ...user, 
      failedLoginAttempts: 0,
      lastLogin: new Date(),
      updatedAt: new Date() 
    };
    
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async listUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }
  
  async searchUsers(searchTerm: string): Promise<User[]> {
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    
    return Array.from(this.users.values()).filter(user => 
      user.username.toLowerCase().includes(lowerCaseSearchTerm) ||
      user.name.toLowerCase().includes(lowerCaseSearchTerm) ||
      (user.email && user.email.toLowerCase().includes(lowerCaseSearchTerm))
    );
  }
  
  async deleteUser(id: number): Promise<boolean> {
    // First check if user exists
    if (!this.users.has(id)) {
      return false;
    }
    
    // Delete the user
    const deleted = this.users.delete(id);
    
    // TODO: In a real implementation, we would need to handle related data
    // like deleting user's posts, comments, etc. or marking them as deleted
    
    return deleted;
  }
  
  async resetUserPassword(id: number, newPassword: string): Promise<User | undefined> {
    // This method is similar to updateUserPassword but intended for admin use
    const user = await this.getUser(id);
    if (!user) {
      return undefined;
    }
    
    console.log(`[DEBUG] Hashing password with salt length 64`);
    const hashedPassword = await hashPassword(newPassword);
    console.log(`[DEBUG] Password hashed successfully, length: ${hashedPassword.length}`);
    
    const updatedUser = {
      ...user,
      password: hashedPassword,
      updatedAt: new Date(),
    };
    
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  async getUserCount(): Promise<number> {
    return this.users.size;
  }
  
  async getProductCount(): Promise<number> {
    return this.products.size;
  }
  
  async getOrderCount(): Promise<number> {
    return this.orders.size;
  }
  
  async getCommunityCount(): Promise<number> {
    return this.communities.size;
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
      views: 0,
      tags: post.tags || [],
      contentType: post.contentType || "text",
      isPromoted: post.isPromoted || false,
      isPublished: post.isPublished ?? true,
      title: post.title || null,
      videoUrl: post.videoUrl || null,
      imageUrl: post.imageUrl || null,
      promotionEndDate: post.promotionEndDate || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.posts.set(id, newPost);
    return newPost;
  }

  async updatePost(id: number, postData: Partial<InsertPost>): Promise<Post> {
    const post = this.posts.get(id);
    if (!post) throw new Error(`Post with id ${id} not found`);

    const updatedPost = {
      ...post,
      ...postData,
      updatedAt: new Date(),
    };

    this.posts.set(id, updatedPost);
    return updatedPost;
  }

  async updatePostStats(id: number, stats: { likes?: number; comments?: number; shares?: number; views?: number }): Promise<Post> {
    const post = this.posts.get(id);
    if (!post) throw new Error(`Post with id ${id} not found`);

    if (stats.likes !== undefined) post.likes = stats.likes;
    if (stats.comments !== undefined) post.comments = stats.comments;
    if (stats.shares !== undefined) post.shares = stats.shares;
    if (stats.views !== undefined) post.views = stats.views;

    post.updatedAt = new Date();
    this.posts.set(id, post);
    return post;
  }

  async deletePost(id: number): Promise<boolean> {
    return this.posts.delete(id);
  }

  async listPosts(options?: {
    userId?: number;
    contentType?: string | string[];
    isPromoted?: boolean;
    tags?: string[];
    limit?: number;
    offset?: number;
  }): Promise<Post[]> {
    let posts = Array.from(this.posts.values());
    
    if (options?.userId) {
      posts = posts.filter(post => post.userId === options.userId);
    }
    
    if (options?.contentType) {
      const contentTypes = Array.isArray(options.contentType) 
        ? options.contentType 
        : [options.contentType];
      posts = posts.filter(post => contentTypes.includes(post.contentType));
    }
    
    if (options?.isPromoted !== undefined) {
      posts = posts.filter(post => post.isPromoted === options.isPromoted);
    }

    if (options?.tags && options.tags.length > 0) {
      posts = posts.filter(post => {
        if (!post.tags) return false;
        return options.tags!.some(tag => post.tags.includes(tag));
      });
    }
    
    // Filter out unpublished posts (except when specifically querying for them)
    if (options?.isPromoted === undefined) {
      posts = posts.filter(post => post.isPublished);
    }
    
    // Sort by most recent first
    posts.sort((a, b) => {
      if (!a.createdAt || !b.createdAt) return 0;
      return b.createdAt.getTime() - a.createdAt.getTime();
    });
    
    // Apply pagination if limit is specified
    if (options?.limit) {
      const offset = options.offset || 0;
      posts = posts.slice(offset, offset + options.limit);
    }
    
    return posts;
  }
  
  async getUserPosts(userId: number): Promise<Post[]> {
    console.log(`[DEBUG] Getting posts for user ID: ${userId}`);
    
    // Reuse the existing listPosts method with the userId filter
    const posts = await this.listPosts({ userId });
    
    console.log(`[DEBUG] Found ${posts.length} posts for user ID: ${userId}`);
    return posts;
  }
  
  async incrementPostView(id: number): Promise<Post> {
    const post = this.posts.get(id);
    if (!post) throw new Error(`Post with id ${id} not found`);
    
    post.views = (post.views || 0) + 1;
    post.updatedAt = new Date();
    this.posts.set(id, post);
    return post;
  }
  
  async promotePost(id: number, endDate: Date): Promise<Post> {
    const post = this.posts.get(id);
    if (!post) throw new Error(`Post with id ${id} not found`);
    
    post.isPromoted = true;
    post.promotionEndDate = endDate;
    post.updatedAt = new Date();
    this.posts.set(id, post);
    return post;
  }
  
  async unpromotePost(id: number): Promise<Post> {
    const post = this.posts.get(id);
    if (!post) throw new Error(`Post with id ${id} not found`);
    
    post.isPromoted = false;
    post.promotionEndDate = null;
    post.updatedAt = new Date();
    this.posts.set(id, post);
    return post;
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

  // Order operations
  async getOrder(id: number): Promise<Order | undefined> {
    return this.orders.get(id);
  }

  async getOrdersByUser(userId: number): Promise<Order[]> {
    return Array.from(this.orders.values())
      .filter(order => order.userId === userId)
      .sort((a, b) => {
        if (!a.createdAt || !b.createdAt) return 0;
        return b.createdAt.getTime() - a.createdAt.getTime();
      });
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    const id = this.orderIdCounter++;
    const newOrder: Order = {
      id,
      ...order,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.orders.set(id, newOrder);
    return newOrder;
  }

  async updateOrderStatus(id: number, status: string): Promise<Order> {
    const order = this.orders.get(id);
    if (!order) throw new Error(`Order with id ${id} not found`);

    order.status = status;
    order.updatedAt = new Date();
    this.orders.set(id, order);
    return order;
  }

  // Order Item operations
  async getOrderItem(id: number): Promise<OrderItem | undefined> {
    return this.orderItems.get(id);
  }

  async getOrderItemsByOrder(orderId: number): Promise<OrderItem[]> {
    return Array.from(this.orderItems.values())
      .filter(item => item.orderId === orderId)
      .sort((a, b) => a.id - b.id);
  }

  async createOrderItem(orderItem: InsertOrderItem): Promise<OrderItem> {
    const id = this.orderItemIdCounter++;
    const newOrderItem: OrderItem = {
      id,
      ...orderItem,
      createdAt: new Date(),
    };
    this.orderItems.set(id, newOrderItem);
    return newOrderItem;
  }

  async updateOrderItemStatus(id: number, status: string): Promise<OrderItem> {
    const orderItem = this.orderItems.get(id);
    if (!orderItem) throw new Error(`Order item with id ${id} not found`);

    orderItem.status = status;
    this.orderItems.set(id, orderItem);
    return orderItem;
  }

  // Vendor Analytics operations
  async getVendorTotalSales(vendorId: number): Promise<number> {
    const orderItems = Array.from(this.orderItems.values())
      .filter(item => item.vendorId === vendorId);
    
    return orderItems.reduce((total, item) => total + item.totalPrice, 0);
  }

  async getVendorOrderStats(vendorId: number): Promise<{
    totalOrders: number;
    pendingOrders: number;
    shippedOrders: number;
    deliveredOrders: number;
    canceledOrders: number;
  }> {
    const orderItems = Array.from(this.orderItems.values())
      .filter(item => item.vendorId === vendorId);
    
    const stats = {
      totalOrders: orderItems.length,
      pendingOrders: orderItems.filter(item => item.status === 'pending').length,
      shippedOrders: orderItems.filter(item => item.status === 'shipped').length,
      deliveredOrders: orderItems.filter(item => item.status === 'delivered').length,
      canceledOrders: orderItems.filter(item => item.status === 'returned' || item.status === 'canceled').length,
    };
    
    return stats;
  }

  async getVendorRevenueByPeriod(vendorId: number, period: "daily" | "weekly" | "monthly" | "yearly"): Promise<Record<string, number>> {
    const orderItems = Array.from(this.orderItems.values())
      .filter(item => item.vendorId === vendorId && item.status !== 'canceled' && item.status !== 'returned');
    
    const result: Record<string, number> = {};
    
    // Group by period
    for (const item of orderItems) {
      if (!item.createdAt) continue;
      
      const date = new Date(item.createdAt);
      let key: string;
      
      switch (period) {
        case 'daily':
          key = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
          break;
        case 'weekly':
          // Get the week number
          const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
          const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
          const weekNumber = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
          key = `${date.getFullYear()}-W${weekNumber}`;
          break;
        case 'monthly':
          key = `${date.getFullYear()}-${date.getMonth() + 1}`;
          break;
        case 'yearly':
          key = `${date.getFullYear()}`;
          break;
      }
      
      if (!result[key]) {
        result[key] = 0;
      }
      
      result[key] += item.totalPrice;
    }
    
    return result;
  }

  async getVendorTopProducts(vendorId: number, limit: number = 5): Promise<{ product: Product; totalSold: number; revenue: number }[]> {
    const orderItems = Array.from(this.orderItems.values())
      .filter(item => item.vendorId === vendorId && item.status !== 'canceled' && item.status !== 'returned');
    
    // Group by product
    const productMap = new Map<number, { totalSold: number; revenue: number }>();
    
    for (const item of orderItems) {
      if (!productMap.has(item.productId)) {
        productMap.set(item.productId, { totalSold: 0, revenue: 0 });
      }
      
      const stats = productMap.get(item.productId)!;
      stats.totalSold += item.quantity;
      stats.revenue += item.totalPrice;
      
      productMap.set(item.productId, stats);
    }
    
    // Convert to array and sort by revenue
    const result: { product: Product; totalSold: number; revenue: number }[] = [];
    
    // Using Array.from to avoid TypeScript MapIterator issues
    await Promise.all(
      Array.from(productMap.entries()).map(async ([productId, stats]) => {
        const product = await this.getProduct(productId);
        if (product) {
          result.push({
            product,
            totalSold: stats.totalSold,
            revenue: stats.revenue,
          });
        }
      })
    );
    
    // Sort by revenue (highest first) and limit
    return result
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, limit);
  }

  async getVendorProfitLoss(vendorId: number): Promise<{
    totalRevenue: number;
    totalCost: number;
    netProfit: number;
    profitMargin: number;
  }> {
    const orderItems = Array.from(this.orderItems.values())
      .filter(item => item.vendorId === vendorId && item.status !== 'canceled' && item.status !== 'returned');
    
    const totalRevenue = orderItems.reduce((total, item) => total + item.totalPrice, 0);
    
    // For this example, we'll estimate the cost as 60% of the price
    // In a real application, you would store and use actual product costs
    const totalCost = orderItems.reduce((total, item) => {
      const unitCost = item.unitPrice * 0.6; // Assume 60% of price is cost
      return total + (unitCost * item.quantity);
    }, 0);
    
    const netProfit = totalRevenue - totalCost;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
    
    return {
      totalRevenue,
      totalCost,
      netProfit,
      profitMargin,
    };
  }
  
  // Get top buyers for a specific vendor
  async getVendorTopBuyers(vendorId: number, limit: number = 5): Promise<{ 
    user: { id: number; username: string; name: string; email: string; }; 
    totalSpent: number; 
    orderCount: number;
  }[]> {
    // Get all order items for this vendor
    const orderItems = Array.from(this.orderItems.values())
      .filter(item => item.vendorId === vendorId && item.status !== 'canceled' && item.status !== 'returned');
    
    // Map to get the orders these items belong to
    const orderIds = new Set(orderItems.map(item => item.orderId));
    const orders = Array.from(this.orders.values()).filter(order => orderIds.has(order.id));
    
    // Group by user and calculate stats
    const buyerStats = new Map<number, { userId: number; totalSpent: number; orderCount: number }>();
    
    orders.forEach(order => {
      const userId = order.userId;
      
      // Get all order items for this order and vendor
      const items = orderItems.filter(item => item.orderId === order.id);
      const totalSpent = items.reduce((sum, item) => sum + item.totalPrice, 0);
      
      if (!buyerStats.has(userId)) {
        buyerStats.set(userId, { userId, totalSpent, orderCount: 1 });
      } else {
        const stats = buyerStats.get(userId)!;
        stats.totalSpent += totalSpent;
        stats.orderCount += 1;
      }
    });
    
    // Convert to array and sort by total spent
    const result = Array.from(buyerStats.values())
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, limit);
      
    // Fetch user details
    return result.map(stats => {
      const user = this.users.get(stats.userId);
      if (!user) {
        return {
          user: { id: stats.userId, username: "Unknown", name: "Unknown User", email: "" },
          totalSpent: stats.totalSpent,
          orderCount: stats.orderCount
        };
      }
      return {
        user: {
          id: user.id,
          username: user.username,
          name: user.name,
          email: user.email
        },
        totalSpent: stats.totalSpent,
        orderCount: stats.orderCount
      };
    });
  }

  // COMMUNITY MANAGEMENT METHODS
  
  // Community management operations
  async getCommunity(id: number): Promise<Community | undefined> {
    return this.communities.get(id);
  }

  async getCommunityByName(name: string): Promise<Community | undefined> {
    return Array.from(this.communities.values()).find(community => 
      community.name.toLowerCase() === name.toLowerCase());
  }

  async createCommunity(community: InsertCommunity): Promise<Community> {
    const id = this.communityIdCounter++;
    const newCommunity: Community = {
      id,
      ...community,
      memberCount: 0,
      isVerified: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.communities.set(id, newCommunity);
    
    // Auto-add the owner as a member with "owner" role
    await this.addCommunityMember({
      communityId: id,
      userId: community.ownerId,
      role: "owner"
    });
    
    return newCommunity;
  }

  async updateCommunity(id: number, data: Partial<InsertCommunity>): Promise<Community> {
    const community = this.communities.get(id);
    if (!community) throw new Error(`Community with id ${id} not found`);
    
    const updatedCommunity = {
      ...community,
      ...data,
      updatedAt: new Date()
    };
    this.communities.set(id, updatedCommunity);
    return updatedCommunity;
  }

  async updateCommunityMemberCount(id: number, change: number): Promise<Community> {
    const community = this.communities.get(id);
    if (!community) throw new Error(`Community with id ${id} not found`);
    
    community.memberCount += change;
    community.updatedAt = new Date();
    this.communities.set(id, community);
    return community;
  }

  async listCommunities(options?: {
    ownerId?: number;
    visibility?: string | string[];
    topics?: string[];
    isVerified?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<Community[]> {
    let communities = Array.from(this.communities.values());
    
    if (options) {
      if (options.ownerId !== undefined) {
        communities = communities.filter(community => community.ownerId === options.ownerId);
      }
      
      if (options.visibility !== undefined) {
        const visibilities = Array.isArray(options.visibility) 
          ? options.visibility 
          : [options.visibility];
        communities = communities.filter(community => visibilities.includes(community.visibility));
      }
      
      if (options.topics && options.topics.length > 0) {
        communities = communities.filter(community => {
          if (!community.topics) return false;
          return options.topics!.some(topic => community.topics!.includes(topic));
        });
      }
      
      if (options.isVerified !== undefined) {
        communities = communities.filter(community => community.isVerified === options.isVerified);
      }
      
      // Apply pagination
      if (options.offset !== undefined) {
        communities = communities.slice(options.offset);
      }
      
      if (options.limit !== undefined) {
        communities = communities.slice(0, options.limit);
      }
    }
    
    return communities;
  }

  // Community members operations
  async getCommunityMember(id: number): Promise<CommunityMember | undefined> {
    return this.communityMembers.get(id);
  }

  async getMembershipStatus(communityId: number, userId: number): Promise<CommunityMember | undefined> {
    return Array.from(this.communityMembers.values()).find(member => 
      member.communityId === communityId && member.userId === userId);
  }

  async addCommunityMember(member: InsertCommunityMember): Promise<CommunityMember> {
    // Check if member already exists
    const existingMember = await this.getMembershipStatus(member.communityId, member.userId);
    if (existingMember) {
      return existingMember;
    }
    
    const id = this.communityMemberIdCounter++;
    const newMember: CommunityMember = {
      id,
      ...member,
      joinedAt: new Date()
    };
    this.communityMembers.set(id, newMember);
    
    // Update the community member count
    await this.updateCommunityMemberCount(member.communityId, 1);
    
    return newMember;
  }

  async updateMemberRole(communityId: number, userId: number, role: string): Promise<CommunityMember> {
    const member = Array.from(this.communityMembers.values()).find(m => 
      m.communityId === communityId && m.userId === userId);
    
    if (!member) throw new Error(`Community member not found`);
    
    member.role = role;
    this.communityMembers.set(member.id, member);
    return member;
  }

  async removeCommunityMember(communityId: number, userId: number): Promise<boolean> {
    // Find the member
    const member = Array.from(this.communityMembers.values()).find(m => 
      m.communityId === communityId && m.userId === userId);
    
    if (!member) return false;
    
    // Check if it's the owner
    const community = this.communities.get(communityId);
    if (community && community.ownerId === userId) {
      throw new Error(`Cannot remove the owner from a community`);
    }
    
    // Remove the member
    const result = this.communityMembers.delete(member.id);
    
    // Update member count
    if (result) {
      await this.updateCommunityMemberCount(communityId, -1);
    }
    
    return result;
  }

  async listCommunityMembers(communityId: number, role?: string): Promise<CommunityMember[]> {
    let members = Array.from(this.communityMembers.values())
      .filter(member => member.communityId === communityId);
    
    if (role) {
      members = members.filter(member => member.role === role);
    }
    
    return members;
  }
  
  async getUserCommunities(userId: number): Promise<Community[]> {
    console.log(`[DEBUG] Getting communities for user ID: ${userId}`);
    
    // Get all community memberships for this user
    const userMemberships = Array.from(this.communityMembers.values())
      .filter(member => member.userId === userId);
      
    console.log(`[DEBUG] Found ${userMemberships.length} community memberships for user ${userId}`);
    
    // Get the actual communities from the memberships
    const communities = userMemberships
      .map(membership => this.communities.get(membership.communityId))
      .filter(community => community !== undefined) as Community[];
    
    console.log(`[DEBUG] Returning ${communities.length} communities for user ${userId}`);
    return communities;
  }

  // Membership tiers operations
  async getMembershipTier(id: number): Promise<MembershipTier | undefined> {
    return this.membershipTiers.get(id);
  }

  async createMembershipTier(tier: InsertMembershipTier): Promise<MembershipTier> {
    const id = this.membershipTierIdCounter++;
    const newTier: MembershipTier = {
      id,
      ...tier,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.membershipTiers.set(id, newTier);
    return newTier;
  }

  async updateMembershipTier(id: number, data: Partial<InsertMembershipTier>): Promise<MembershipTier> {
    const tier = this.membershipTiers.get(id);
    if (!tier) throw new Error(`Membership tier with id ${id} not found`);
    
    const updatedTier = {
      ...tier,
      ...data,
      updatedAt: new Date()
    };
    this.membershipTiers.set(id, updatedTier);
    return updatedTier;
  }

  async deleteMembershipTier(id: number): Promise<boolean> {
    // Check if any memberships are using this tier
    const hasMembers = Array.from(this.memberships.values())
      .some(membership => membership.tierId === id);
    
    if (hasMembers) {
      throw new Error(`Cannot delete a tier with active members`);
    }
    
    return this.membershipTiers.delete(id);
  }

  async listMembershipTiers(communityId: number): Promise<MembershipTier[]> {
    return Array.from(this.membershipTiers.values())
      .filter(tier => tier.communityId === communityId);
  }

  // User membership operations
  async getMembership(id: number): Promise<Membership | undefined> {
    return this.memberships.get(id);
  }

  async getUserMemberships(userId: number): Promise<Membership[]> {
    return Array.from(this.memberships.values())
      .filter(membership => membership.userId === userId);
  }
  
  async getUserCommunityMembership(userId: number, communityId: number): Promise<Membership | undefined> {
    return Array.from(this.memberships.values())
      .find(membership => 
        membership.userId === userId && 
        membership.communityId === communityId && 
        membership.status === "active"
      );
  }

  async getTierMemberCount(tierId: number): Promise<number> {
    return Array.from(this.memberships.values())
      .filter(membership => 
        membership.tierId === tierId && 
        membership.status === "active"
      ).length;
  }

  async createMembership(membership: InsertMembership): Promise<Membership> {
    const id = this.membershipIdCounter++;
    const newMembership: Membership = {
      id,
      ...membership,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.memberships.set(id, newMembership);
    
    // Ensure the user is a member of the community
    await this.addCommunityMember({
      communityId: membership.communityId,
      userId: membership.userId,
      role: "member"
    });
    
    return newMembership;
  }

  async updateMembershipStatus(id: number, status: string): Promise<Membership> {
    const membership = this.memberships.get(id);
    if (!membership) throw new Error(`Membership with id ${id} not found`);
    
    membership.status = status;
    membership.updatedAt = new Date();
    this.memberships.set(id, membership);
    return membership;
  }

  async cancelMembership(id: number): Promise<Membership> {
    const membership = this.memberships.get(id);
    if (!membership) throw new Error(`Membership with id ${id} not found`);
    
    membership.status = "canceled";
    membership.autoRenew = false;
    membership.updatedAt = new Date();
    this.memberships.set(id, membership);
    return membership;
  }
  
  // Events operations
  async getEvent(id: number): Promise<Event | undefined> {
    return this.events.get(id);
  }

  async createEvent(event: InsertEvent): Promise<Event> {
    const id = this.eventIdCounter++;
    const newEvent: Event = {
      id,
      ...event,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.events.set(id, newEvent);
    return newEvent;
  }

  async updateEvent(id: number, data: Partial<InsertEvent>): Promise<Event> {
    const event = this.events.get(id);
    if (!event) throw new Error(`Event with id ${id} not found`);
    
    const updatedEvent = {
      ...event,
      ...data,
      updatedAt: new Date()
    };
    this.events.set(id, updatedEvent);
    return updatedEvent;
  }

  async listEvents(options?: {
    communityId?: number;
    hostId?: number;
    eventType?: string;
    startAfter?: Date;
    startBefore?: Date;
    isPublished?: boolean;
    requiredTierId?: number;
    limit?: number;
    offset?: number;
  }): Promise<Event[]> {
    let events = Array.from(this.events.values());
    
    if (options) {
      if (options.communityId !== undefined) {
        events = events.filter(event => event.communityId === options.communityId);
      }
      
      if (options.hostId !== undefined) {
        events = events.filter(event => event.hostId === options.hostId);
      }
      
      if (options.eventType !== undefined) {
        events = events.filter(event => event.eventType === options.eventType);
      }
      
      if (options.startAfter !== undefined) {
        events = events.filter(event => event.startTime >= options.startAfter!);
      }
      
      if (options.startBefore !== undefined) {
        events = events.filter(event => event.startTime <= options.startBefore!);
      }
      
      if (options.isPublished !== undefined) {
        events = events.filter(event => event.isPublished === options.isPublished);
      }
      
      if (options.requiredTierId !== undefined) {
        events = events.filter(event => event.requiredTierId === options.requiredTierId);
      }
      
      // Sort by start time (soonest first)
      events.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
      
      // Apply pagination
      if (options.offset !== undefined) {
        events = events.slice(options.offset);
      }
      
      if (options.limit !== undefined) {
        events = events.slice(0, options.limit);
      }
    }
    
    return events;
  }

  async publishEvent(id: number): Promise<Event> {
    const event = this.events.get(id);
    if (!event) throw new Error(`Event with id ${id} not found`);
    
    event.isPublished = true;
    event.updatedAt = new Date();
    this.events.set(id, event);
    return event;
  }

  async cancelEvent(id: number): Promise<boolean> {
    return this.events.delete(id);
  }

  // Event registrations operations
  async getEventRegistration(id: number): Promise<EventRegistration | undefined> {
    return this.eventRegistrations.get(id);
  }

  async registerForEvent(registration: InsertEventRegistration): Promise<EventRegistration> {
    // Check if already registered
    const existingRegistration = Array.from(this.eventRegistrations.values()).find(reg => 
      reg.eventId === registration.eventId && reg.userId === registration.userId);
      
    if (existingRegistration) {
      return existingRegistration;
    }
    
    const id = this.eventRegistrationIdCounter++;
    const newRegistration: EventRegistration = {
      id,
      ...registration,
      registeredAt: new Date(),
      checkedInAt: null
    };
    this.eventRegistrations.set(id, newRegistration);
    return newRegistration;
  }

  async cancelRegistration(eventId: number, userId: number): Promise<boolean> {
    const registration = Array.from(this.eventRegistrations.values()).find(reg => 
      reg.eventId === eventId && reg.userId === userId);
      
    if (!registration) return false;
    
    return this.eventRegistrations.delete(registration.id);
  }

  async checkInAttendee(eventId: number, userId: number): Promise<EventRegistration> {
    const registration = Array.from(this.eventRegistrations.values()).find(reg => 
      reg.eventId === eventId && reg.userId === userId);
      
    if (!registration) {
      throw new Error(`Registration not found for user ${userId} at event ${eventId}`);
    }
    
    registration.status = "attended";
    registration.checkedInAt = new Date();
    this.eventRegistrations.set(registration.id, registration);
    return registration;
  }

  async listEventAttendees(eventId: number): Promise<EventRegistration[]> {
    return Array.from(this.eventRegistrations.values())
      .filter(reg => reg.eventId === eventId);
  }

  async countEventAttendees(eventId: number): Promise<number> {
    return (await this.listEventAttendees(eventId)).length;
  }

  // Polls operations
  async getPoll(id: number): Promise<Poll | undefined> {
    return this.polls.get(id);
  }

  async createPoll(poll: InsertPoll): Promise<Poll> {
    const id = this.pollIdCounter++;
    const newPoll: Poll = {
      id,
      ...poll,
      totalVotes: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.polls.set(id, newPoll);
    return newPoll;
  }

  async updatePoll(id: number, data: Partial<InsertPoll>): Promise<Poll> {
    const poll = this.polls.get(id);
    if (!poll) throw new Error(`Poll with id ${id} not found`);
    
    const updatedPoll = {
      ...poll,
      ...data,
      updatedAt: new Date()
    };
    this.polls.set(id, updatedPoll);
    return updatedPoll;
  }

  async closePoll(id: number): Promise<Poll> {
    const poll = this.polls.get(id);
    if (!poll) throw new Error(`Poll with id ${id} not found`);
    
    poll.isActive = false;
    poll.endsAt = new Date();
    poll.updatedAt = new Date();
    this.polls.set(id, poll);
    return poll;
  }

  async listPolls(communityId: number, isActive?: boolean): Promise<Poll[]> {
    let polls = Array.from(this.polls.values())
      .filter(poll => poll.communityId === communityId);
      
    if (isActive !== undefined) {
      polls = polls.filter(poll => poll.isActive === isActive);
    }
    
    // Sort by creation date (newest first)
    return polls.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  // Poll votes operations
  async getPollVote(pollId: number, userId: number): Promise<PollVote | undefined> {
    return Array.from(this.pollVotes.values()).find(vote => 
      vote.pollId === pollId && vote.userId === userId);
  }

  async castVote(vote: InsertPollVote): Promise<PollVote> {
    // Check if user already voted
    const existingVote = await this.getPollVote(vote.pollId, vote.userId);
    if (existingVote) {
      throw new Error(`User ${vote.userId} has already voted in poll ${vote.pollId}`);
    }
    
    // Check if poll is active
    const poll = await this.getPoll(vote.pollId);
    if (!poll) {
      throw new Error(`Poll with id ${vote.pollId} not found`);
    }
    
    if (!poll.isActive) {
      throw new Error(`Poll is no longer active`);
    }
    
    // Cast vote
    const id = this.pollVoteIdCounter++;
    const newVote: PollVote = {
      id,
      ...vote,
      votedAt: new Date()
    };
    this.pollVotes.set(id, newVote);
    
    // Update poll total votes
    poll.totalVotes += 1;
    this.polls.set(poll.id, poll);
    
    return newVote;
  }

  async listPollVotes(pollId: number): Promise<PollVote[]> {
    return Array.from(this.pollVotes.values())
      .filter(vote => vote.pollId === pollId);
  }

  async getPollResults(pollId: number): Promise<{ optionIndex: number; votes: number; percentage: number }[]> {
    const poll = await this.getPoll(pollId);
    if (!poll) {
      throw new Error(`Poll with id ${pollId} not found`);
    }
    
    const votes = await this.listPollVotes(pollId);
    const options = poll.options as any[];
    
    // Initialize results
    const results = options.map((_, index) => ({
      optionIndex: index,
      votes: 0,
      percentage: 0
    }));
    
    // Count votes for each option
    votes.forEach(vote => {
      vote.selectedOptions.forEach(optionIndex => {
        if (results[optionIndex]) {
          results[optionIndex].votes += 1;
        }
      });
    });
    
    // Calculate percentages
    const totalVotes = poll.totalVotes;
    if (totalVotes > 0) {
      results.forEach(result => {
        result.percentage = (result.votes / totalVotes) * 100;
      });
    }
    
    return results.sort((a, b) => b.votes - a.votes);
  }
  
  // Creator earnings operations
  async getCreatorEarning(id: number): Promise<CreatorEarning | undefined> {
    return this.creatorEarnings.get(id);
  }

  async addCreatorEarning(earning: InsertCreatorEarning): Promise<CreatorEarning> {
    const id = this.creatorEarningIdCounter++;
    const newEarning: CreatorEarning = {
      id,
      ...earning,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.creatorEarnings.set(id, newEarning);
    return newEarning;
  }

  async updateEarningStatus(id: number, status: string): Promise<CreatorEarning> {
    const earning = this.creatorEarnings.get(id);
    if (!earning) throw new Error(`Creator earning with id ${id} not found`);
    
    earning.status = status;
    if (status === "paid") {
      earning.paymentDate = new Date();
    }
    earning.updatedAt = new Date();
    this.creatorEarnings.set(id, earning);
    return earning;
  }

  async listCreatorEarnings(userId: number): Promise<CreatorEarning[]> {
    return Array.from(this.creatorEarnings.values())
      .filter(earning => earning.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getCreatorRevenueStats(userId: number): Promise<{
    totalRevenue: number;
    pendingPayouts: number;
    paidRevenue: number;
    bySource: Record<string, number>;
    byPeriod: Record<string, number>;
  }> {
    const earnings = await this.listCreatorEarnings(userId);
    
    let totalRevenue = 0;
    let pendingPayouts = 0;
    let paidRevenue = 0;
    const bySource: Record<string, number> = {};
    const byPeriod: Record<string, number> = {};
    
    // Calculate today's date and month start for period calculations
    const today = new Date();
    const currentMonth = `${today.getFullYear()}-${today.getMonth() + 1}`;
    
    // Process earnings
    earnings.forEach(earning => {
      const amount = earning.netAmount;
      totalRevenue += amount;
      
      // Status-based stats
      if (earning.status === "pending") {
        pendingPayouts += amount;
      } else if (earning.status === "paid") {
        paidRevenue += amount;
      }
      
      // Source-based stats
      if (!bySource[earning.source]) {
        bySource[earning.source] = 0;
      }
      bySource[earning.source] += amount;
      
      // Period-based stats (monthly)
      const earningDate = earning.createdAt;
      const earningMonth = `${earningDate.getFullYear()}-${earningDate.getMonth() + 1}`;
      
      if (!byPeriod[earningMonth]) {
        byPeriod[earningMonth] = 0;
      }
      byPeriod[earningMonth] += amount;
    });
    
    return {
      totalRevenue,
      pendingPayouts,
      paidRevenue,
      bySource,
      byPeriod
    };
  }
  
  // Subscriptions operations
  async getSubscription(id: number): Promise<Subscription | undefined> {
    return this.subscriptions.get(id);
  }

  async getUserSubscriptions(userId: number): Promise<Subscription[]> {
    return Array.from(this.subscriptions.values())
      .filter(sub => sub.userId === userId);
  }
  
  async getUserSubscription(userId: number): Promise<Subscription | undefined> {
    // Get the most recent subscription for the user
    const subscriptions = await this.getUserSubscriptions(userId);
    if (subscriptions.length === 0) return undefined;
    
    // Sort by created date descending and get the most recent one
    return subscriptions.sort((a, b) => {
      if (!a.createdAt || !b.createdAt) return 0;
      return b.createdAt.getTime() - a.createdAt.getTime();
    })[0];
  }

  async getCreatorSubscribers(creatorId: number): Promise<Subscription[]> {
    return Array.from(this.subscriptions.values())
      .filter(sub => sub.creatorId === creatorId && sub.status === "active");
  }

  async createSubscription(subscription: InsertSubscription): Promise<Subscription> {
    const id = this.subscriptionIdCounter++;
    const newSubscription: Subscription = {
      id,
      ...subscription,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.subscriptions.set(id, newSubscription);
    return newSubscription;
  }

  async updateSubscriptionStatus(id: number, status: string): Promise<Subscription> {
    const subscription = this.subscriptions.get(id);
    if (!subscription) throw new Error(`Subscription with id ${id} not found`);
    
    subscription.status = status;
    subscription.updatedAt = new Date();
    this.subscriptions.set(id, subscription);
    return subscription;
  }

  async cancelSubscription(id: number): Promise<Subscription> {
    const subscription = this.subscriptions.get(id);
    if (!subscription) throw new Error(`Subscription with id ${id} not found`);
    
    subscription.status = "canceled";
    subscription.cancelAtPeriodEnd = true;
    subscription.updatedAt = new Date();
    this.subscriptions.set(id, subscription);
    return subscription;
  }
  
  async createOrUpdateSubscription(data: Partial<Subscription>): Promise<Subscription> {
    // If we have a subscription ID, update the existing subscription
    if (data.id && this.subscriptions.has(data.id)) {
      const subscription = this.subscriptions.get(data.id)!;
      
      // Update the subscription with new data
      Object.assign(subscription, {
        ...data,
        updatedAt: new Date()
      });
      
      this.subscriptions.set(subscription.id, subscription);
      return subscription;
    } 
    
    // If no ID provided or ID doesn't exist, create a new subscription
    const userId = data.userId;
    if (!userId) {
      throw new Error('userId is required to create a subscription');
    }
    
    // Get existing subscription for the user if any
    const existingSubscription = await this.getUserSubscription(userId);
    
    if (existingSubscription) {
      // Update existing subscription
      Object.assign(existingSubscription, {
        ...data,
        updatedAt: new Date()
      });
      
      this.subscriptions.set(existingSubscription.id, existingSubscription);
      return existingSubscription;
    }
    
    // Create a new subscription
    return this.createSubscription({
      userId,
      status: data.status || 'active',
      plan: data.plan || 'premium',
      expiresAt: data.expiresAt,
      creatorId: data.creatorId,
      cancelAtPeriodEnd: data.cancelAtPeriodEnd,
      stripeCustomerId: data.stripeCustomerId,
      stripeSubscriptionId: data.stripeSubscriptionId,
      tier: data.tier
    } as InsertSubscription);
  }

  // Social network methods for new explore page
  async getTrendingPosts(limit: number = 10): Promise<Post[]> {
    // In a real implementation, we would order by a combination of likes, comments, and recency
    // For our memory storage implementation, we'll simulate this by creating a trending score
    const posts = Array.from(this.posts.values());
    
    // Sort posts by a trending score (likes + comments + views, with recency as a factor)
    const sortedPosts = posts.sort((a, b) => {
      // Calculate weighted score based on engagement metrics
      const aScore = (a.likes || 0) * 3 + (a.comments || 0) * 2 + (a.views || 0);
      const bScore = (b.likes || 0) * 3 + (b.comments || 0) * 2 + (b.views || 0);
      
      // Add recency factor (newer posts get a boost)
      const aAge = Date.now() - new Date(a.createdAt).getTime();
      const bAge = Date.now() - new Date(b.createdAt).getTime();
      
      // Final score combining engagement and recency
      const aFinalScore = aScore / Math.sqrt(aAge);
      const bFinalScore = bScore / Math.sqrt(bAge);
      
      return bFinalScore - aFinalScore;
    });
    
    return sortedPosts.slice(0, limit);
  }
  
  async getPopularTags(limit: number = 20): Promise<{ name: string; count: number }[]> {
    // In a real database implementation, we would aggregate tags from posts
    // For our memory implementation, we'll extract tags from posts and count them
    const posts = Array.from(this.posts.values());
    const tagCounts: Record<string, number> = {};
    
    // Count tag occurrences
    posts.forEach(post => {
      if (post.tags && Array.isArray(post.tags)) {
        post.tags.forEach(tag => {
          if (typeof tag === 'string') {
            tagCounts[tag] = (tagCounts[tag] || 0) + 1;
          }
        });
      }
    });
    
    // Convert to array and sort by count
    const popularTags = Object.entries(tagCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
    
    // Generate sample tags if we don't have enough from posts
    if (popularTags.length < limit) {
      const sampleTags = [
        { name: "fashion", count: 120 },
        { name: "technology", count: 95 },
        { name: "food", count: 87 },
        { name: "travel", count: 76 },
        { name: "art", count: 65 },
        { name: "music", count: 58 },
        { name: "health", count: 52 },
        { name: "business", count: 48 },
        { name: "sports", count: 42 },
        { name: "books", count: 38 },
        { name: "photography", count: 35 },
        { name: "education", count: 32 },
        { name: "gaming", count: 30 },
        { name: "fitness", count: 28 },
        { name: "beauty", count: 25 },
        { name: "nature", count: 22 },
        { name: "science", count: 20 },
        { name: "movies", count: 18 },
        { name: "design", count: 15 },
        { name: "cooking", count: 12 }
      ];
      
      // Add sample tags that don't already exist in our popularTags
      const existingTagNames = new Set(popularTags.map(tag => tag.name));
      sampleTags.forEach(tag => {
        if (!existingTagNames.has(tag.name)) {
          popularTags.push(tag);
        }
      });
      
      // Re-sort the combined list
      popularTags.sort((a, b) => b.count - a.count);
    }
    
    return popularTags.slice(0, limit);
  }
  
  async getPopularCommunities(limit: number = 10): Promise<Community[]> {
    // Get communities and sort by member count (most popular first)
    const communities = Array.from(this.communities.values());
    
    // Sort by member count (descending) and recent activity
    const sortedCommunities = communities.sort((a, b) => {
      // First compare by member count
      const memberCountDiff = (b.memberCount || 0) - (a.memberCount || 0);
      if (memberCountDiff !== 0) return memberCountDiff;
      
      // If equal member count, compare by creation date (newer first)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    
    // If we have no communities yet, generate some samples
    if (sortedCommunities.length === 0) {
      // Create sample communities for demonstration
      const sampleCommunities = [
        {
          id: 1,
          name: "Tech Enthusiasts",
          description: "A community for technology lovers to discuss the latest gadgets, software, and tech news.",
          memberCount: 1250,
          visibility: "public",
          createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // 90 days ago
          ownerId: 1
        },
        {
          id: 2,
          name: "Foodies United",
          description: "Share your favorite recipes, restaurant experiences, and culinary adventures.",
          memberCount: 980,
          visibility: "public",
          createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // 60 days ago
          ownerId: 1
        },
        {
          id: 3,
          name: "Digital Nomads",
          description: "Connect with people who work while traveling the world. Share tips, destinations, and remote work advice.",
          memberCount: 750,
          visibility: "public",
          createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000), // 45 days ago
          ownerId: 1
        }
      ];
      
      // Add sample communities to our storage
      sampleCommunities.forEach(comm => {
        const community: Community = {
          ...comm,
          id: this.communityIdCounter++,
          logo: null,
          bannerImage: null,
          topics: [],
          isVerified: false,
          about: null,
          rules: null,
          location: null,
          website: null,
          socialLinks: null,
          type: "general",
          updatedAt: new Date()
        };
        
        this.communities.set(community.id, community);
        sortedCommunities.push(community);
      });
      
      // Re-sort after adding samples
      sortedCommunities.sort((a, b) => (b.memberCount || 0) - (a.memberCount || 0));
    }
    
    return sortedCommunities.slice(0, limit);
  }
  
  async getFeaturedProducts(limit: number = 10): Promise<Product[]> {
    // In a real implementation, we would have a featured flag or algorithm
    // For now, we'll use a combination of factors like ratings, sales, etc. to simulate featured products
    const products = Array.from(this.products.values());
    
    // Sort by some criteria (isOnSale, isNew, price descending)
    const sortedProducts = products.sort((a, b) => {
      // Prioritize on-sale products
      if (a.isOnSale && !b.isOnSale) return -1;
      if (!a.isOnSale && b.isOnSale) return 1;
      
      // Then new products
      if (a.isNew && !b.isNew) return -1;
      if (!a.isNew && b.isNew) return 1;
      
      // Finally by price (higher price first as a proxy for premium/featured)
      return b.price - a.price;
    });
    
    // Add vendor info to each product
    const featuredProducts = sortedProducts.slice(0, limit);
    
    for (const product of featuredProducts) {
      if (product.vendorId) {
        product.vendor = await this.getVendor(product.vendorId);
        
        // Add vendor name from user data if available
        if (product.vendor && product.vendor.userId) {
          const user = await this.getUser(product.vendor.userId);
          if (user) {
            product.vendor.user = {
              id: user.id,
              name: user.name,
              username: user.username
            };
          }
        }
      }
    }
    
    return featuredProducts;
  }
  
  async getSuggestedUsers(limit: number = 10, currentUserId?: number): Promise<User[]> {
    // Get all users
    let users = Array.from(this.users.values());
    
    // Filter out current user if specified
    if (currentUserId !== undefined) {
      users = users.filter(user => user.id !== currentUserId);
    }
    
    // In a real app we'd have an algorithm based on connections, interests, etc.
    // For now, just sort by some criteria (e.g., recently joined, has avatar, etc.)
    const sortedUsers = users.sort((a, b) => {
      // Prioritize users with avatars
      if (a.avatar && !b.avatar) return -1;
      if (!a.avatar && b.avatar) return 1;
      
      // Then by creation date (newer first)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    
    // Get the top users based on limit
    return sortedUsers.slice(0, limit);
  }

  // Enhanced messaging operations
  async getUserMessages(userId: number): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter(message => message.senderId === userId || message.receiverId === userId)
      .sort((a, b) => {
        const aTime = a.createdAt ? a.createdAt.getTime() : 0;
        const bTime = b.createdAt ? b.createdAt.getTime() : 0;
        return bTime - aTime;
      });
  }

  async getConversationMessages(userId1: number, userId2: number): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter(message => 
        (message.senderId === userId1 && message.receiverId === userId2) || 
        (message.senderId === userId2 && message.receiverId === userId1)
      )
      .sort((a, b) => {
        const aTime = a.createdAt ? a.createdAt.getTime() : 0;
        const bTime = b.createdAt ? b.createdAt.getTime() : 0;
        return aTime - bTime;
      });
  }

  async getUserConversations(userId: number): Promise<any[]> {
    // Get all messages where the user is either sender or receiver
    const userMessages = await this.getUserMessages(userId);
    
    // Extract unique user IDs the current user has conversed with
    const conversationUserIds = new Set<number>();
    userMessages.forEach(message => {
      const otherUserId = message.senderId === userId ? message.receiverId : message.senderId;
      conversationUserIds.add(otherUserId);
    });
    
    // Build conversations summary
    const conversations = [];
    for (const otherUserId of conversationUserIds) {
      const otherUser = await this.getUser(otherUserId);
      if (!otherUser) continue;
      
      // Get messages between these users
      const messages = await this.getConversationMessages(userId, otherUserId);
      const latestMessage = messages.length > 0 ? messages[messages.length - 1] : null; // Messages are sorted by date
      
      // Count unread messages
      const unreadCount = messages.filter(
        msg => msg.senderId === otherUserId && !msg.isRead
      ).length;
      
      conversations.push({
        user: {
          id: otherUser.id,
          username: otherUser.username,
          name: otherUser.name,
          avatar: otherUser.avatar
        },
        latestMessage: latestMessage ? {
          id: latestMessage.id,
          content: latestMessage.content,
          createdAt: latestMessage.createdAt,
          isRead: latestMessage.isRead,
          senderId: latestMessage.senderId,
          attachmentUrl: latestMessage.attachmentUrl,
          attachmentType: latestMessage.attachmentType
        } : null,
        unreadCount
      });
    }
    
    // Sort by latest message date
    return conversations.sort((a, b) => {
      if (!a.latestMessage || !b.latestMessage) return 0;
      const aTime = a.latestMessage.createdAt ? new Date(a.latestMessage.createdAt).getTime() : 0;
      const bTime = b.latestMessage.createdAt ? new Date(b.latestMessage.createdAt).getTime() : 0;
      return bTime - aTime;
    });
  }

  async getUnreadMessageCount(userId: number): Promise<number> {
    return Array.from(this.messages.values())
      .filter(message => message.receiverId === userId && !message.isRead)
      .length;
  }

  async markMessageAsRead(id: number): Promise<Message | undefined> {
    const message = this.messages.get(id);
    if (!message) return undefined;
    
    message.isRead = true;
    this.messages.set(id, message);
    return message;
  }

  // Video operations
  async createVideo(video: InsertVideo): Promise<Video> {
    const id = this.videoIdCounter++;
    const newVideo = {
      ...video,
      id,
      views: 0,
      likes: 0,
      shares: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.videos.set(id, newVideo);
    return newVideo;
  }

  async getVideo(id: number): Promise<Video | undefined> {
    return this.videos.get(id);
  }

  async updateVideo(id: number, updates: Partial<Video>): Promise<Video | undefined> {
    const video = await this.getVideo(id);
    if (!video) return undefined;

    const updatedVideo = {
      ...video,
      ...updates,
      updatedAt: new Date(),
    };
    this.videos.set(id, updatedVideo);
    return updatedVideo;
  }

  async deleteVideo(id: number): Promise<boolean> {
    const exists = this.videos.has(id);
    if (!exists) return false;

    this.videos.delete(id);
    
    // Also delete related engagements and analytics
    [...this.videoEngagements.values()]
      .filter(engagement => engagement.videoId === id)
      .forEach(engagement => this.videoEngagements.delete(engagement.id));

    [...this.videoAnalytics.values()]
      .filter(analytics => analytics.videoId === id)
      .forEach(analytics => this.videoAnalytics.delete(analytics.id));

    // Remove from playlists
    [...this.playlistItems.values()]
      .filter(item => item.videoId === id)
      .forEach(item => this.playlistItems.delete(item.id));

    return true;
  }

  async listVideos(filter?: Record<string, any>): Promise<Video[]> {
    let videos = [...this.videos.values()];
    
    if (filter) {
      if (filter.userId) {
        videos = videos.filter(v => v.userId === filter.userId);
      }
      
      if (filter.videoType) {
        const videoTypes = Array.isArray(filter.videoType) ? filter.videoType : [filter.videoType];
        videos = videos.filter(v => videoTypes.includes(v.videoType));
      }

      if (filter.isPublished) {
        videos = videos.filter(v => v.status === 'published');
      }

      if (filter.tags && filter.tags.length > 0) {
        videos = videos.filter(v => {
          if (!v.tags) return false;
          return filter.tags.some((tag: string) => v.tags?.includes(tag));
        });
      }
    }
    
    // Sort by creation date (newest first)
    videos.sort((a, b) => {
      const aTime = a.createdAt ? a.createdAt.getTime() : 0;
      const bTime = b.createdAt ? b.createdAt.getTime() : 0;
      return bTime - aTime;
    });
    
    return videos;
  }
  
  async getTrendingVideos(limit: number = 10): Promise<Video[]> {
    const videos = [...this.videos.values()]
      .filter(v => v.status === 'published')
      // Sort by engagement (views + likes + shares) in descending order
      .sort((a, b) => {
        const engagementA = (a.views || 0) + (a.likes || 0) + (a.shares || 0);
        const engagementB = (b.views || 0) + (b.likes || 0) + (b.shares || 0);
        return engagementB - engagementA;
      });
    
    return videos.slice(0, limit);
  }
  
  async getUserVideos(userId: number): Promise<Video[]> {
    return [...this.videos.values()]
      .filter(v => v.userId === userId)
      .sort((a, b) => {
        const aTime = a.createdAt ? a.createdAt.getTime() : 0;
        const bTime = b.createdAt ? b.createdAt.getTime() : 0;
        return bTime - aTime;
      });
  }
  
  async getVideosByType(type: string): Promise<Video[]> {
    return [...this.videos.values()]
      .filter(v => v.videoType === type && v.status === 'published')
      .sort((a, b) => {
        const aTime = a.createdAt ? a.createdAt.getTime() : 0;
        const bTime = b.createdAt ? b.createdAt.getTime() : 0;
        return bTime - aTime;
      });
  }
  
  // Video engagements
  async createVideoEngagement(engagement: InsertVideoEngagement): Promise<VideoEngagement> {
    const id = this.videoEngagementIdCounter++;
    const newEngagement = {
      ...engagement,
      id,
      createdAt: new Date()
    };
    this.videoEngagements.set(id, newEngagement);
    
    // Update video stats based on engagement type
    const video = await this.getVideo(engagement.videoId);
    if (video) {
      if (engagement.type === 'view') {
        await this.updateVideo(video.id, { views: (video.views || 0) + 1 });
      } else if (engagement.type === 'like') {
        await this.updateVideo(video.id, { likes: (video.likes || 0) + 1 });
      } else if (engagement.type === 'share') {
        await this.updateVideo(video.id, { shares: (video.shares || 0) + 1 });
      }
    }
    
    return newEngagement;
  }
  
  async getVideoEngagements(videoId: number, type?: string): Promise<VideoEngagement[]> {
    let engagements = [...this.videoEngagements.values()]
      .filter(e => e.videoId === videoId);
    
    if (type) {
      engagements = engagements.filter(e => e.type === type);
    }
    
    return engagements;
  }
  
  async getUserVideoEngagements(userId: number, type?: string): Promise<VideoEngagement[]> {
    let engagements = [...this.videoEngagements.values()]
      .filter(e => e.userId === userId);
    
    if (type) {
      engagements = engagements.filter(e => e.type === type);
    }
    
    return engagements;
  }
  
  // Video analytics
  async getVideoAnalytics(videoId: number): Promise<VideoAnalytics | undefined> {
    return [...this.videoAnalytics.values()]
      .find(a => a.videoId === videoId);
  }
  
  async updateVideoAnalytics(videoId: number, data: Partial<VideoAnalytics>): Promise<VideoAnalytics> {
    let analytics = await this.getVideoAnalytics(videoId);
    
    if (!analytics) {
      // Create new analytics if it doesn't exist
      const id = this.videoAnalyticsIdCounter++;
      analytics = {
        id,
        videoId,
        totalViews: 0,
        uniqueViewers: 0,
        averageWatchTime: 0,
        completionRate: 0,
        engagementRate: 0,
        demographics: {},
        viewsByCountry: {},
        updatedAt: new Date()
      };
      this.videoAnalytics.set(id, analytics);
    }
    
    const updatedAnalytics = {
      ...analytics,
      ...data,
      updatedAt: new Date()
    };
    
    this.videoAnalytics.set(analytics.id, updatedAnalytics);
    return updatedAnalytics;
  }

  // Video Product Overlay operations
  async createVideoProductOverlay(overlay: InsertVideoProductOverlay): Promise<VideoProductOverlay> {
    const id = this.videoProductOverlayIdCounter++;
    const newOverlay: VideoProductOverlay = {
      id,
      ...overlay,
      clickCount: 0,
      conversionCount: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.videoProductOverlays.set(id, newOverlay);
    return newOverlay;
  }

  async getVideoProductOverlay(id: number): Promise<VideoProductOverlay | undefined> {
    return this.videoProductOverlays.get(id);
  }

  async getVideoProductOverlays(videoId: number): Promise<VideoProductOverlay[]> {
    return Array.from(this.videoProductOverlays.values())
      .filter(overlay => overlay.videoId === videoId);
  }

  async updateVideoProductOverlay(id: number, updates: Partial<VideoProductOverlay>): Promise<VideoProductOverlay | undefined> {
    const overlay = this.videoProductOverlays.get(id);
    if (!overlay) {
      return undefined;
    }

    const updatedOverlay = {
      ...overlay,
      ...updates,
      updatedAt: new Date()
    };

    this.videoProductOverlays.set(id, updatedOverlay);
    return updatedOverlay;
  }

  async deleteVideoProductOverlay(id: number): Promise<boolean> {
    return this.videoProductOverlays.delete(id);
  }

  async incrementOverlayClickCount(id: number): Promise<VideoProductOverlay | undefined> {
    const overlay = this.videoProductOverlays.get(id);
    if (!overlay) {
      return undefined;
    }

    // Increment click count
    const updatedOverlay = {
      ...overlay,
      clickCount: overlay.clickCount + 1,
      updatedAt: new Date()
    };

    this.videoProductOverlays.set(id, updatedOverlay);
    return updatedOverlay;
  }

  async incrementOverlayConversionCount(id: number): Promise<VideoProductOverlay | undefined> {
    const overlay = this.videoProductOverlays.get(id);
    if (!overlay) {
      return undefined;
    }

    // Increment conversion count
    const updatedOverlay = {
      ...overlay,
      conversionCount: overlay.conversionCount + 1,
      updatedAt: new Date()
    };

    this.videoProductOverlays.set(id, updatedOverlay);
    return updatedOverlay;
  }
  
  // Playlist operations
  async createPlaylist(playlist: InsertVideoPlaylist): Promise<VideoPlaylist> {
    const id = this.videoPlaylistIdCounter++;
    const newPlaylist = {
      ...playlist,
      id,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.videoPlaylists.set(id, newPlaylist);
    return newPlaylist;
  }
  
  async getPlaylist(id: number): Promise<VideoPlaylist | undefined> {
    return this.videoPlaylists.get(id);
  }
  
  async updatePlaylist(id: number, updates: Partial<VideoPlaylist>): Promise<VideoPlaylist | undefined> {
    const playlist = await this.getPlaylist(id);
    if (!playlist) return undefined;
    
    const updatedPlaylist = {
      ...playlist,
      ...updates,
      updatedAt: new Date()
    };
    this.videoPlaylists.set(id, updatedPlaylist);
    return updatedPlaylist;
  }
  
  async deletePlaylist(id: number): Promise<boolean> {
    const exists = this.videoPlaylists.has(id);
    if (!exists) return false;
    
    this.videoPlaylists.delete(id);
    
    // Remove all playlist items
    [...this.playlistItems.values()]
      .filter(item => item.playlistId === id)
      .forEach(item => this.playlistItems.delete(item.id));
    
    return true;
  }
  
  async getUserPlaylists(userId: number): Promise<VideoPlaylist[]> {
    return [...this.videoPlaylists.values()]
      .filter(p => p.userId === userId)
      .sort((a, b) => {
        const aTime = a.createdAt ? a.createdAt.getTime() : 0;
        const bTime = b.createdAt ? b.createdAt.getTime() : 0;
        return bTime - aTime;
      });
  }
  
  // Video playlist operations
  async createVideoPlaylist(playlist: InsertVideoPlaylist): Promise<VideoPlaylist> {
    const id = this.videoPlaylistIdCounter++;
    const newPlaylist: VideoPlaylist = {
      id,
      ...playlist,
      videoCount: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.videoPlaylists.set(id, newPlaylist);
    return newPlaylist;
  }
  
  // Alias for createVideoPlaylist to maintain compatibility
  async createPlaylist(playlist: InsertVideoPlaylist): Promise<VideoPlaylist> {
    return this.createVideoPlaylist(playlist);
  }
  
  async getVideoPlaylist(id: number): Promise<VideoPlaylist | undefined> {
    return this.videoPlaylists.get(id);
  }
  
  // Alias for getVideoPlaylist to maintain compatibility
  async getPlaylist(id: number): Promise<VideoPlaylist | undefined> {
    return this.getVideoPlaylist(id);
  }
  
  async updatePlaylist(id: number, updates: Partial<VideoPlaylist>): Promise<VideoPlaylist | undefined> {
    const playlist = this.videoPlaylists.get(id);
    if (!playlist) {
      return undefined;
    }
    
    const updatedPlaylist = { 
      ...playlist, 
      ...updates,
      updatedAt: new Date() 
    };
    
    this.videoPlaylists.set(id, updatedPlaylist);
    return updatedPlaylist;
  }
  
  async deletePlaylist(id: number): Promise<boolean> {
    return this.videoPlaylists.delete(id);
  }
  
  async getUserPlaylists(userId: number): Promise<VideoPlaylist[]> {
    return [...this.videoPlaylists.values()]
      .filter(p => p.userId === userId)
      .sort((a, b) => {
        const aTime = a.createdAt ? a.createdAt.getTime() : 0;
        const bTime = b.createdAt ? b.createdAt.getTime() : 0;
        return bTime - aTime;
      });
  }
  
  // Method to get all videos in a playlist
  async getPlaylistVideos(playlistId: number): Promise<Video[]> {
    // First get all playlist items
    const items = await this.getPlaylistItems(playlistId);
    
    // Then fetch each video
    const videos = await Promise.all(
      items.map(item => this.getVideo(item.videoId))
    );
    
    // Filter out any undefined videos and return
    return videos.filter((video): video is Video => video !== undefined);
  }
  
  // Video operations
  async getVideo(id: number): Promise<Video | undefined> {
    return this.videos.get(id);
  }
  
  async getUserVideos(userId: number): Promise<Video[]> {
    return [...this.videos.values()]
      .filter(video => video.userId === userId)
      .sort((a, b) => {
        const aTime = a.createdAt ? a.createdAt.getTime() : 0;
        const bTime = b.createdAt ? b.createdAt.getTime() : 0;
        return bTime - aTime;
      });
  }
  
  // Alias for interface compatibility
  async getVideosByUser(userId: number): Promise<Video[]> {
    return this.getUserVideos(userId);
  }
  
  async createVideo(video: InsertVideo): Promise<Video> {
    const id = this.videoIdCounter++;
    const newVideo: Video = {
      id,
      ...video,
      viewCount: 0,
      likeCount: 0,
      commentCount: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.videos.set(id, newVideo);
    return newVideo;
  }
  
  async updateVideo(id: number, updates: Partial<Video>): Promise<Video | undefined> {
    const video = this.videos.get(id);
    if (!video) {
      return undefined;
    }
    
    const updatedVideo = { 
      ...video, 
      ...updates,
      updatedAt: new Date() 
    };
    
    this.videos.set(id, updatedVideo);
    return updatedVideo;
  }
  
  async deleteVideo(id: number): Promise<boolean> {
    return this.videos.delete(id);
  }
  
  async listVideos(options?: {
    userId?: number;
    isPremium?: boolean;
    isPublished?: boolean;
    limit?: number;
    offset?: number;
    sortBy?: 'newest' | 'mostViewed' | 'mostLiked';
  }): Promise<Video[]> {
    let videos = [...this.videos.values()];
    
    // Apply filters
    if (options) {
      if (options.userId !== undefined) {
        videos = videos.filter(v => v.userId === options.userId);
      }
      
      if (options.isPremium !== undefined) {
        videos = videos.filter(v => v.isPremium === options.isPremium);
      }
      
      if (options.isPublished !== undefined) {
        videos = videos.filter(v => v.isPublished === options.isPublished);
      }
      
      // Apply sorting
      if (options.sortBy) {
        switch (options.sortBy) {
          case 'newest':
            videos = videos.sort((a, b) => {
              const aTime = a.createdAt ? a.createdAt.getTime() : 0;
              const bTime = b.createdAt ? b.createdAt.getTime() : 0;
              return bTime - aTime;
            });
            break;
          case 'mostViewed':
            videos = videos.sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0));
            break;
          case 'mostLiked':
            videos = videos.sort((a, b) => (b.likeCount || 0) - (a.likeCount || 0));
            break;
        }
      }
      
      // Apply pagination
      if (options.limit !== undefined) {
        const offset = options.offset || 0;
        videos = videos.slice(offset, offset + options.limit);
      }
    }
    
    return videos;
  }
  
  // Playlist item operations
  async addToPlaylist(item: InsertPlaylistItem): Promise<PlaylistItem> {
    const id = this.playlistItemIdCounter++;
    const newItem = {
      ...item,
      id,
      createdAt: new Date()
    };
    this.playlistItems.set(id, newItem);
    
    // Update the video count in the playlist
    const playlist = this.videoPlaylists.get(item.playlistId);
    if (playlist) {
      playlist.videoCount = (playlist.videoCount || 0) + 1;
      this.videoPlaylists.set(item.playlistId, playlist);
    }
    
    return newItem;
  }
  
  // Alias for addToPlaylist to maintain compatibility with IStorage interface
  async addVideoToPlaylist(playlistId: number, videoId: number, position: number = 0): Promise<PlaylistItem> {
    // Get current max position for proper ordering if not specified
    if (position === 0) {
      const playlistItems = await this.getPlaylistItems(playlistId);
      if (playlistItems.length > 0) {
        position = Math.max(...playlistItems.map(item => item.position)) + 1;
      } else {
        position = 1; // First item in the playlist
      }
    }
    
    return this.addToPlaylist({
      playlistId,
      videoId,
      position,
    });
  }
  
  async removeFromPlaylist(playlistId: number, videoId: number): Promise<boolean> {
    const item = [...this.playlistItems.values()]
      .find(i => i.playlistId === playlistId && i.videoId === videoId);
    
    if (!item) return false;
    
    this.playlistItems.delete(item.id);
    
    // Update the video count in the playlist
    const playlist = this.videoPlaylists.get(playlistId);
    if (playlist && playlist.videoCount && playlist.videoCount > 0) {
      playlist.videoCount--;
      this.videoPlaylists.set(playlistId, playlist);
    }
    
    return true;
  }
  
  // Alias for removeFromPlaylist to maintain compatibility with IStorage interface
  async removeVideoFromPlaylist(playlistId: number, videoId: number): Promise<boolean> {
    return this.removeFromPlaylist(playlistId, videoId);
  }
  
  async getPlaylistItems(playlistId: number): Promise<PlaylistItem[]> {
    return [...this.playlistItems.values()]
      .filter(i => i.playlistId === playlistId)
      .sort((a, b) => a.position - b.position);
  }
  
  // Premium video purchase operations
  async createVideoPurchase(purchase: InsertVideoPurchase): Promise<VideoPurchase> {
    const id = this.videoPurchaseIdCounter++;
    const newPurchase: VideoPurchase = {
      id,
      ...purchase,
      createdAt: new Date()
    };
    this.videoPurchases.set(id, newPurchase);
    return newPurchase;
  }

  async getVideoPurchase(id: number): Promise<VideoPurchase | undefined> {
    return this.videoPurchases.get(id);
  }

  async getVideoPurchaseByUserAndVideo(userId: number, videoId: number): Promise<VideoPurchase | undefined> {
    return [...this.videoPurchases.values()].find(
      purchase => purchase.userId === userId && purchase.videoId === videoId
    );
  }

  async getUserVideoPurchases(userId: number): Promise<VideoPurchase[]> {
    return [...this.videoPurchases.values()].filter(
      purchase => purchase.userId === userId
    );
  }

  async getVideoRevenue(videoId: number): Promise<number> {
    const purchases = [...this.videoPurchases.values()].filter(
      purchase => purchase.videoId === videoId
    );
    
    return purchases.reduce((total, purchase) => total + purchase.amount, 0);
  }

  async getCreatorVideoRevenue(userId: number): Promise<{ totalRevenue: number; videoCount: number; }> {
    // Get all videos by this creator
    const creatorVideos = await this.getUserVideos(userId);
    
    // Filter to only premium videos
    const premiumVideos = creatorVideos.filter(video => video.isPremium);
    
    // Calculate total revenue
    let totalRevenue = 0;
    
    for (const video of premiumVideos) {
      const videoRevenue = await this.getVideoRevenue(video.id);
      totalRevenue += videoRevenue;
    }
    
    return {
      totalRevenue,
      videoCount: premiumVideos.length
    };
  }

  async hasUserPurchasedVideo(userId: number, videoId: number): Promise<boolean> {
    const purchase = await this.getVideoPurchaseByUserAndVideo(userId, videoId);
    return purchase !== undefined;
  }

  // Community Content operations
  async getCommunityContent(id: number): Promise<CommunityContent | undefined> {
    return this.communityContents.get(id);
  }
  
  async createCommunityContent(content: InsertCommunityContent): Promise<CommunityContent> {
    const id = this.communityContentIdCounter++;
    const newContent: CommunityContent = {
      id,
      ...content,
      viewCount: 0,
      likeCount: 0,
      commentCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.communityContents.set(id, newContent);
    return newContent;
  }
  
  async updateCommunityContent(id: number, data: Partial<InsertCommunityContent>): Promise<CommunityContent | undefined> {
    const content = this.communityContents.get(id);
    if (!content) {
      return undefined;
    }
    
    const updatedContent = { 
      ...content, 
      ...data,
      updatedAt: new Date() 
    };
    
    this.communityContents.set(id, updatedContent);
    return updatedContent;
  }
  
  async deleteCommunityContent(id: number): Promise<boolean> {
    return this.communityContents.delete(id);
  }
  
  async listCommunityContents(communityId: number, options?: {
    contentType?: string;
    tierId?: number;
    isFeatured?: boolean;
    creatorId?: number;
    limit?: number;
    offset?: number;
  }): Promise<CommunityContent[]> {
    let contents = Array.from(this.communityContents.values())
      .filter(content => content.communityId === communityId);
      
    if (options) {
      if (options.contentType) {
        contents = contents.filter(content => content.contentType === options.contentType);
      }
      
      if (options.tierId !== undefined) {
        contents = contents.filter(content => content.tierId === options.tierId);
      }
      
      if (options.isFeatured !== undefined) {
        contents = contents.filter(content => content.isFeatured === options.isFeatured);
      }
      
      if (options.creatorId !== undefined) {
        contents = contents.filter(content => content.creatorId === options.creatorId);
      }
    }
    
    // Sort by most recent first
    contents.sort((a, b) => {
      if (!a.createdAt || !b.createdAt) return 0;
      return b.createdAt.getTime() - a.createdAt.getTime();
    });
    
    // Apply pagination if limit is specified
    if (options?.limit) {
      const offset = options.offset || 0;
      contents = contents.slice(offset, offset + options.limit);
    }
    
    return contents;
  }
  
  async incrementContentView(id: number): Promise<CommunityContent | undefined> {
    const content = this.communityContents.get(id);
    if (!content) {
      return undefined;
    }
    
    const updatedContent = { 
      ...content, 
      viewCount: content.viewCount + 1,
      updatedAt: new Date() 
    };
    
    this.communityContents.set(id, updatedContent);
    return updatedContent;
  }
  
  async getUserAccessibleContent(userId: number, communityId: number): Promise<CommunityContent[]> {
    // Check user's membership tier for this community
    const membership = await this.getUserCommunityMembership(userId, communityId);
    if (!membership) {
      return []; // User is not a member, no access to content
    }
    
    // Get all content for the community
    const allContents = await this.listCommunityContents(communityId);
    
    // Filter content based on user's tier level
    return allContents.filter(content => {
      // Get the tier info for this content
      const contentTier = this.membershipTiers.get(content.tierId);
      const userTier = this.membershipTiers.get(membership.tierId);
      
      if (!contentTier || !userTier) {
        return false;
      }
      
      // Simple access check based on tier id
      // A lower id number typically means a higher tier
      return userTier.id <= contentTier.id;
    });
  }

  async listCommunityContent(communityId: number): Promise<CommunityContent[]> {
    return Array.from(this.communityContents.values())
      .filter(content => content.communityId === communityId);
  }

  async getAccessibleCommunityContent(userId: number, communityId: number): Promise<CommunityContent[]> {
    // Get the user's memberships for this community
    const userMemberships = Array.from(this.memberships.values())
      .filter(m => m.userId === userId && m.communityId === communityId && m.status === 'active');

    if (userMemberships.length === 0) {
      // User is not a member of this community or doesn't have an active membership
      return [];
    }

    // Get the highest tier the user has access to
    const userTierIds = userMemberships.map(m => m.tierId);
    const userTiers = await Promise.all(userTierIds.map(id => this.getMembershipTier(id)));
    
    // Find content that the user can access based on their tier levels
    const content = Array.from(this.communityContents.values())
      .filter(content => {
        // Content from the community user is a member of
        if (content.communityId !== communityId) return false;
        
        // Check if user has access to this content's tier
        return userTierIds.includes(content.tierId);
      });

    return content;
  }

  async canUserAccessContent(userId: number, contentId: number): Promise<boolean> {
    const content = await this.getCommunityContent(contentId);
    if (!content) return false;

    // Check if user has an active membership for the content's community and tier
    const userMemberships = Array.from(this.memberships.values())
      .filter(m => 
        m.userId === userId && 
        m.communityId === content.communityId && 
        m.status === 'active'
      );

    // Find if user has tier access
    for (const membership of userMemberships) {
      // Get the membership tier details
      const tier = await this.getMembershipTier(membership.tierId);
      
      // If user's tier level is equal or higher than content's tier
      if (tier && membership.tierId >= content.tierId) {
        return true;
      }
    }

    return false;
  }

  async incrementContentViewCount(contentId: number): Promise<void> {
    const content = await this.getCommunityContent(contentId);
    if (content) {
      content.viewCount = (content.viewCount || 0) + 1;
      content.updatedAt = new Date();
      this.communityContents.set(contentId, content);
    }
  }

  async likeContent(contentId: number, userId: number): Promise<void> {
    // Check if user already liked this content
    const existingLike = Array.from(this.contentLikes.values())
      .find(like => like.contentId === contentId && like.userId === userId);
    
    if (!existingLike) {
      // Add new like
      const id = Math.max(0, ...Array.from(this.contentLikes.keys())) + 1;
      this.contentLikes.set(id, { contentId, userId });
      
      // Update content like count
      const content = await this.getCommunityContent(contentId);
      if (content) {
        content.likeCount = (content.likeCount || 0) + 1;
        this.communityContents.set(contentId, content);
      }
    }
  }

  async unlikeContent(contentId: number, userId: number): Promise<void> {
    // Find the existing like
    const likeEntry = Array.from(this.contentLikes.entries())
      .find(([_, like]) => like.contentId === contentId && like.userId === userId);
    
    if (likeEntry) {
      // Remove the like
      this.contentLikes.delete(likeEntry[0]);
      
      // Update content like count
      const content = await this.getCommunityContent(contentId);
      if (content && content.likeCount && content.likeCount > 0) {
        content.likeCount -= 1;
        this.communityContents.set(contentId, content);
      }
    }
  }

  async getCommunityContentByTier(communityId: number, tierId: number): Promise<CommunityContent[]> {
    return Array.from(this.communityContents.values())
      .filter(content => content.communityId === communityId && content.tierId === tierId);
  }

  async getCommunityContentByType(communityId: number, contentType: string): Promise<CommunityContent[]> {
    return Array.from(this.communityContents.values())
      .filter(content => content.communityId === communityId && content.contentType === contentType);
  }

  async getFeaturedCommunityContent(communityId: number): Promise<CommunityContent[]> {
    return Array.from(this.communityContents.values())
      .filter(content => content.communityId === communityId && content.isFeatured === true);
  }

  async isUserCommunityAdminOrOwner(userId: number, communityId: number): Promise<boolean> {
    // Check if user is the owner
    const community = await this.getCommunity(communityId);
    if (community && community.ownerId === userId) {
      return true;
    }

    // Check if user is an admin
    const membership = Array.from(this.communityMembers.values())
      .find(m => m.communityId === communityId && m.userId === userId);
    
    return membership?.role === 'admin' || membership?.role === 'owner';
  }
}

export const storage = new MemStorage();
