/**
 * All-in-One Social Media Suite
 * 
 * A comprehensive API implementation that integrates all social media features
 * in a unified, consistent interface replacing the previous fragmented approach.
 */

import { 
  posts, users, comments, likes, notifications, messages, communities, videos, follows,
  communityMembers, videoEngagements, videoPlaylists, playlistItems, videoProductOverlays,
  Post, User, Comment, Like, Message, Community, Video, Follow
} from '@shared/schema';
import { db } from './db';
import { eq, and, or, desc, sql, not, isNull, gt, lt, gte, lte, asc } from 'drizzle-orm';

/**
 * Social Media Suite Interface
 */
export interface SocialMediaSuite {
  // Post operations
  getPosts(options: GetPostsOptions): Promise<Partial<Post>[]>;
  getPostById(id: number): Promise<Partial<Post> | null>;
  createPost(postData: CreatePostData): Promise<Partial<Post>>;
  updatePost(id: number, postData: Partial<Post>): Promise<Partial<Post> | null>;
  deletePost(id: number): Promise<boolean>;
  likePost(postId: number, userId: number): Promise<void>;
  unlikePost(postId: number, userId: number): Promise<void>;
  sharePost(postId: number, userId: number): Promise<Partial<Post>>;
  
  // Comment operations
  getComments(postId: number): Promise<Partial<Comment>[]>;
  createComment(commentData: CreateCommentData): Promise<Partial<Comment>>;
  deleteComment(id: number): Promise<boolean>;
  
  // User social operations
  followUser(followerId: number, followingId: number): Promise<void>;
  unfollowUser(followerId: number, followingId: number): Promise<void>;
  getFollowers(userId: number): Promise<Partial<User>[]>;
  getFollowing(userId: number): Promise<Partial<User>[]>;
  getFollowerCount(userId: number): Promise<number>;
  getFollowingCount(userId: number): Promise<number>;
  getSuggestedUsers(userId: number, limit?: number): Promise<Partial<User>[]>;
  
  // Feed operations
  getUserFeed(userId: number, options?: FeedOptions): Promise<Partial<Post>[]>;
  getExploreContent(userId?: number): Promise<ExploreContent>;
  getTrendingPosts(limit?: number): Promise<Partial<Post>[]>;
  
  // Community operations
  getUserCommunities(userId: number): Promise<Partial<Community>[]>;
  getCommunityPosts(communityId: number): Promise<Partial<Post>[]>;
  
  // Notification operations
  getNotifications(userId: number, limit?: number): Promise<Partial<Notification>[]>;
  getUnreadNotificationCount(userId: number): Promise<number>;
  markNotificationsAsRead(notificationIds: number[]): Promise<void>;
  
  // Messaging operations
  getUserConversations(userId: number): Promise<Conversation[]>;
  getConversationMessages(userId: number, partnerId: number): Promise<Partial<Message>[]>;
  sendMessage(messageData: CreateMessageData): Promise<Partial<Message>>;
  markMessagesAsRead(messageIds: number[]): Promise<void>;
  getUnreadMessageCount(userId: number): Promise<number>;
  
  // Video operations
  getTrendingVideos(limit?: number): Promise<Partial<Video>[]>;
  getVideo(id: number): Promise<Partial<Video> | null>;
  
  // Search operations
  searchPosts(query: string): Promise<Partial<Post>[]>;
  searchUsers(query: string): Promise<Partial<User>[]>;
}

// Type definitions
export interface GetPostsOptions {
  userId?: number;
  limit?: number;
  offset?: number;
  contentType?: string | string[];
  isPromoted?: boolean;
  tags?: string[];
  excludeIds?: number[];
  includeUserDetails?: boolean;
}

export interface CreatePostData {
  userId: number;
  content: string;
  title?: string;
  contentType?: string;
  imageUrl?: string;
  videoUrl?: string;
  tags?: string[];
  isPromoted?: boolean;
  productId?: number;
  communityId?: number;
}

export interface CreateCommentData {
  userId: number;
  postId: number;
  content: string;
}

export interface FeedOptions {
  limit?: number;
  offset?: number;
  includeUserDetails?: boolean;
  contentTypes?: string[];
}

export interface CreateMessageData {
  senderId: number;
  receiverId: number;
  content: string;
  attachmentUrl?: string;
  attachmentType?: string;
}

export interface Conversation {
  partnerId: number;
  partnerName: string;
  partnerAvatar: string | null;
  lastMessage: string;
  lastMessageTime: Date;
  unreadCount: number;
}

export interface ExploreContent {
  trendingPosts: Partial<Post>[];
  trendingVideos: Partial<Video>[];
  suggestedUsers: Partial<User>[];
  popularCommunities: Partial<Community>[];
}

/**
 * Concrete implementation of Social Media Suite
 */
export class SocialMediaSuiteImpl implements SocialMediaSuite {
  /**
   * Get posts with various filtering options
   */
  async getPosts(options: GetPostsOptions): Promise<Partial<Post>[]> {
    try {
      console.log('Getting posts with options:', options);
      
      // Start building our query
      let query = db.select().from(posts);
      
      // Apply filters
      if (options.userId) {
        query = query.where(eq(posts.userId, options.userId));
      }
      
      if (options.contentType) {
        if (Array.isArray(options.contentType)) {
          query = query.where(sql`${posts.contentType} IN (${options.contentType.join(',')})`);
        } else {
          query = query.where(eq(posts.contentType, options.contentType));
        }
      }
      
      if (options.isPromoted !== undefined) {
        query = query.where(eq(posts.isPromoted, options.isPromoted));
      }
      
      if (options.tags && options.tags.length > 0) {
        // This is a simplified approach - in production you might use a more sophisticated tags matching
        query = query.where(sql`${posts.tags} && ARRAY[${options.tags.join(',')}]::text[]`);
      }
      
      if (options.excludeIds && options.excludeIds.length > 0) {
        query = query.where(sql`${posts.id} NOT IN (${options.excludeIds.join(',')})`);
      }
      
      // Filter out unpublished posts by default
      query = query.where(eq(posts.isPublished, true));
      
      // Order by most recent first
      query = query.orderBy(desc(posts.createdAt));
      
      // Apply pagination
      if (options.limit) {
        query = query.limit(options.limit);
      }
      
      if (options.offset) {
        query = query.offset(options.offset);
      }
      
      // If user details are requested, do a separate query to join with users
      let results = await query;
      
      if (options.includeUserDetails && results.length > 0) {
        // Get all unique user IDs from posts
        const userIds = [...new Set(results.map(post => post.userId))];
        
        // Get user details in a single query
        const userDetails = await db.select({
          id: users.id,
          username: users.username,
          name: users.name,
          avatar: users.avatar
        }).from(users).where(users.id.in(userIds));
        
        // Create a map of user IDs to user details for quick lookup
        const userMap = new Map();
        userDetails.forEach(user => userMap.set(user.id, user));
        
        // Add user details to posts
        return results.map(post => ({
          ...post,
          user: userMap.get(post.userId)
        }));
      }
      
      return results;
    } catch (error) {
      console.error('Error getting posts:', error);
      throw error;
    }
  }

  /**
   * Get a single post by ID
   */
  async getPostById(id: number): Promise<Partial<Post> | null> {
    try {
      const [post] = await db.select().from(posts).where(eq(posts.id, id)).limit(1);
      
      if (post) {
        // Get user details
        const [author] = await db.select({
          id: users.id,
          username: users.username,
          name: users.name,
          avatar: users.avatar
        }).from(users).where(eq(users.id, post.userId));
        
        // Return post with author details
        return {
          ...post,
          user: author
        };
      }
      
      return null;
    } catch (error) {
      console.error(`Error getting post by ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Create a new post
   */
  async createPost(postData: CreatePostData): Promise<Partial<Post>> {
    try {
      console.log('Creating post with data:', postData);
      
      // Ensure required fields are present
      if (!postData.userId || !postData.content) {
        throw new Error('Missing required fields for post creation');
      }
      
      // Prepare data for insertion
      const insertData = {
        userId: postData.userId,
        content: postData.content,
        contentType: postData.contentType || 'text',
        isPublished: true,
        likes: 0,
        comments: 0,
        shares: 0,
        views: 0
      };
      
      // Add optional fields if they exist
      if (postData.title) insertData.title = postData.title;
      if (postData.imageUrl) insertData.imageUrl = postData.imageUrl;
      if (postData.videoUrl) insertData.videoUrl = postData.videoUrl;
      if (postData.tags) insertData.tags = postData.tags;
      if (postData.isPromoted !== undefined) insertData.isPromoted = postData.isPromoted;
      if (postData.productId) insertData.productId = postData.productId;
      if (postData.communityId) insertData.communityId = postData.communityId;
      
      // Insert into database
      const [newPost] = await db.insert(posts).values(insertData).returning();
      console.log('Post created successfully:', newPost);
      
      // Get user details for the response
      const [author] = await db.select({
        id: users.id,
        username: users.username,
        name: users.name,
        avatar: users.avatar
      }).from(users).where(eq(users.id, postData.userId));
      
      // Return the post with author information
      return {
        ...newPost,
        user: author
      };
    } catch (error) {
      console.error('Error creating post:', error);
      throw error;
    }
  }

  /**
   * Update an existing post
   */
  async updatePost(id: number, postData: Partial<Post>): Promise<Partial<Post> | null> {
    try {
      // Remove any properties that shouldn't be updated
      const { id: _, createdAt, userId, ...updateData } = postData;
      
      // Set updated timestamp
      const updates = {
        ...updateData,
        updatedAt: new Date()
      };
      
      // Update the post
      const [updatedPost] = await db.update(posts)
        .set(updates)
        .where(eq(posts.id, id))
        .returning();
      
      if (updatedPost) {
        // Get user details
        const [author] = await db.select({
          id: users.id,
          username: users.username,
          name: users.name,
          avatar: users.avatar
        }).from(users).where(eq(users.id, updatedPost.userId));
        
        // Return post with author details
        return {
          ...updatedPost,
          user: author
        };
      }
      
      return null;
    } catch (error) {
      console.error(`Error updating post with ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete a post by ID
   */
  async deletePost(id: number): Promise<boolean> {
    try {
      // Check if post exists before deleting
      const [post] = await db.select().from(posts).where(eq(posts.id, id)).limit(1);
      
      if (!post) {
        return false;
      }
      
      // Delete any related comments
      await db.delete(comments).where(eq(comments.postId, id));
      
      // Delete any related likes
      await db.delete(likes).where(eq(likes.postId, id));
      
      // Delete the post
      await db.delete(posts).where(eq(posts.id, id));
      
      return true;
    } catch (error) {
      console.error(`Error deleting post with ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Like a post
   */
  async likePost(postId: number, userId: number): Promise<void> {
    try {
      // Check if the like already exists
      const existingLike = await db.select()
        .from(likes)
        .where(and(eq(likes.postId, postId), eq(likes.userId, userId)))
        .limit(1);
      
      if (existingLike.length === 0) {
        // Create the like if it doesn't exist
        await db.insert(likes).values({
          postId,
          userId,
          createdAt: new Date()
        });
        
        // Increment the post's like count
        await db.update(posts)
          .set({ likes: sql`${posts.likes} + 1` })
          .where(eq(posts.id, postId));
        
        // Create a notification for the post owner
        const [post] = await db.select().from(posts).where(eq(posts.id, postId)).limit(1);
        
        if (post && post.userId !== userId) {
          await db.insert(notifications).values({
            userId: post.userId,
            type: 'like',
            content: `Someone liked your post`,
            isRead: false,
            sourceId: postId,
            sourceType: 'post',
            createdAt: new Date()
          });
        }
      }
    } catch (error) {
      console.error(`Error liking post ${postId} by user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Unlike a post
   */
  async unlikePost(postId: number, userId: number): Promise<void> {
    try {
      // Check if the like exists
      const existingLike = await db.select()
        .from(likes)
        .where(and(eq(likes.postId, postId), eq(likes.userId, userId)))
        .limit(1);
      
      if (existingLike.length > 0) {
        // Delete the like if it exists
        await db.delete(likes)
          .where(and(eq(likes.postId, postId), eq(likes.userId, userId)));
        
        // Decrement the post's like count
        await db.update(posts)
          .set({ likes: sql`greatest(${posts.likes} - 1, 0)` })
          .where(eq(posts.id, postId));
      }
    } catch (error) {
      console.error(`Error unliking post ${postId} by user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Share a post
   */
  async sharePost(postId: number, userId: number): Promise<Partial<Post>> {
    try {
      // First get the original post
      const [originalPost] = await db.select().from(posts).where(eq(posts.id, postId)).limit(1);
      
      if (!originalPost) {
        throw new Error(`Post with ID ${postId} not found`);
      }
      
      // Increment the shares count on the original post
      await db.update(posts)
        .set({ shares: sql`${posts.shares} + 1` })
        .where(eq(posts.id, postId));
      
      // Create a new post that shares the original
      const insertData = {
        userId,
        content: `Shared: ${originalPost.content?.substring(0, 50)}...`,
        contentType: 'share',
        isPublished: true,
        likes: 0,
        comments: 0,
        shares: 0,
        views: 0,
        // Add a field to reference the original post
        sharedPostId: postId
      };
      
      // Insert into database
      const [newPost] = await db.insert(posts).values(insertData).returning();
      
      // Create a notification for the original post owner
      if (originalPost.userId !== userId) {
        await db.insert(notifications).values({
          userId: originalPost.userId,
          type: 'share',
          content: `Someone shared your post`,
          isRead: false,
          sourceId: newPost.id,
          sourceType: 'post',
          createdAt: new Date()
        });
      }
      
      // Get user details for the response
      const [author] = await db.select({
        id: users.id,
        username: users.username,
        name: users.name,
        avatar: users.avatar
      }).from(users).where(eq(users.id, userId));
      
      // Return the new post with author info
      return {
        ...newPost,
        user: author,
        originalPost
      };
    } catch (error) {
      console.error(`Error sharing post ${postId} by user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Get comments for a post
   */
  async getComments(postId: number): Promise<Partial<Comment>[]> {
    try {
      const commentsData = await db.select({
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
        .innerJoin(users, eq(comments.userId, users.id))
        .where(eq(comments.postId, postId))
        .orderBy(asc(comments.createdAt));
      
      return commentsData;
    } catch (error) {
      console.error(`Error getting comments for post ${postId}:`, error);
      throw error;
    }
  }

  /**
   * Create a comment on a post
   */
  async createComment(commentData: CreateCommentData): Promise<Partial<Comment>> {
    try {
      // Insert the comment
      const [newComment] = await db.insert(comments).values({
        userId: commentData.userId,
        postId: commentData.postId,
        content: commentData.content,
        createdAt: new Date()
      }).returning();
      
      // Increment the comment count on the post
      await db.update(posts)
        .set({ comments: sql`${posts.comments} + 1` })
        .where(eq(posts.id, commentData.postId));
      
      // Get the post owner for notification
      const [post] = await db.select().from(posts).where(eq(posts.id, commentData.postId)).limit(1);
      
      // Create a notification for the post owner if it's not their own comment
      if (post && post.userId !== commentData.userId) {
        await db.insert(notifications).values({
          userId: post.userId,
          type: 'comment',
          content: 'Someone commented on your post',
          isRead: false,
          sourceId: commentData.postId,
          sourceType: 'post',
          createdAt: new Date()
        });
      }
      
      // Get user details for the response
      const [author] = await db.select({
        id: users.id,
        username: users.username,
        name: users.name,
        avatar: users.avatar
      }).from(users).where(eq(users.id, commentData.userId));
      
      // Return comment with user details
      return {
        ...newComment,
        user: author
      };
    } catch (error) {
      console.error('Error creating comment:', error);
      throw error;
    }
  }

  /**
   * Delete a comment
   */
  async deleteComment(id: number): Promise<boolean> {
    try {
      // Get the comment to know which post to update
      const [comment] = await db.select().from(comments).where(eq(comments.id, id)).limit(1);
      
      if (!comment) {
        return false;
      }
      
      // Delete the comment
      await db.delete(comments).where(eq(comments.id, id));
      
      // Decrement the comment count on the post
      await db.update(posts)
        .set({ comments: sql`greatest(${posts.comments} - 1, 0)` })
        .where(eq(posts.id, comment.postId));
      
      return true;
    } catch (error) {
      console.error(`Error deleting comment ${id}:`, error);
      throw error;
    }
  }

  /**
   * Follow a user
   */
  async followUser(followerId: number, followingId: number): Promise<void> {
    try {
      // Check if already following
      const existingFollow = await db.select()
        .from(follows)
        .where(and(eq(follows.followerId, followerId), eq(follows.followingId, followingId)))
        .limit(1);
      
      if (existingFollow.length === 0) {
        // Create the follow relationship
        await db.insert(follows).values({
          followerId,
          followingId,
          createdAt: new Date()
        });
        
        // Get follower info for notification
        const [follower] = await db.select().from(users).where(eq(users.id, followerId)).limit(1);
        
        // Create a notification for the followed user
        await db.insert(notifications).values({
          userId: followingId,
          type: 'follow',
          content: follower ? `${follower.username} started following you` : 'Someone started following you',
          isRead: false,
          sourceId: followerId,
          sourceType: 'user',
          createdAt: new Date()
        });
      }
    } catch (error) {
      console.error(`Error following user ${followingId} by user ${followerId}:`, error);
      throw error;
    }
  }

  /**
   * Unfollow a user
   */
  async unfollowUser(followerId: number, followingId: number): Promise<void> {
    try {
      // Check if the follow relationship exists
      const existingFollow = await db.select()
        .from(follows)
        .where(and(eq(follows.followerId, followerId), eq(follows.followingId, followingId)))
        .limit(1);
        
      if (existingFollow.length > 0) {
        // Delete the follow relationship
        await db.delete(follows)
          .where(and(eq(follows.followerId, followerId), eq(follows.followingId, followingId)));
      }
    } catch (error) {
      console.error(`Error unfollowing user ${followingId} by user ${followerId}:`, error);
      throw error;
    }
  }

  /**
   * Get a user's followers
   */
  async getFollowers(userId: number): Promise<Partial<User>[]> {
    try {
      const followers = await db.select({
        id: users.id,
        username: users.username,
        name: users.name,
        avatar: users.avatar,
        bio: users.bio,
        isVendor: users.isVendor,
        role: users.role
      })
        .from(follows)
        .innerJoin(users, eq(follows.followerId, users.id))
        .where(eq(follows.followingId, userId));
      
      return followers;
    } catch (error) {
      console.error(`Error getting followers for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Get users that a user is following
   */
  async getFollowing(userId: number): Promise<Partial<User>[]> {
    try {
      const following = await db.select({
        id: users.id,
        username: users.username,
        name: users.name, 
        avatar: users.avatar,
        bio: users.bio,
        isVendor: users.isVendor,
        role: users.role
      })
        .from(follows)
        .innerJoin(users, eq(follows.followingId, users.id))
        .where(eq(follows.followerId, userId));
      
      return following;
    } catch (error) {
      console.error(`Error getting following for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Get follower count for a user
   */
  async getFollowerCount(userId: number): Promise<number> {
    try {
      const result = await db.select({ count: sql<number>`count(*)` })
        .from(follows)
        .where(eq(follows.followingId, userId));
      
      return result[0]?.count || 0;
    } catch (error) {
      console.error(`Error getting follower count for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Get following count for a user
   */
  async getFollowingCount(userId: number): Promise<number> {
    try {
      const result = await db.select({ count: sql<number>`count(*)` })
        .from(follows)
        .where(eq(follows.followerId, userId));
      
      return result[0]?.count || 0;
    } catch (error) {
      console.error(`Error getting following count for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Get suggested users to follow
   */
  async getSuggestedUsers(userId: number, limit = 10): Promise<Partial<User>[]> {
    try {
      // First, get the list of users the current user is already following
      const following = await db.select({ followingId: follows.followingId })
        .from(follows)
        .where(eq(follows.followerId, userId));
      
      const followingIds = following.map(f => f.followingId);
      followingIds.push(userId); // Add the current user to the exclusion list
      
      // Find users that the current user is not following
      // Use an array to avoid the 'in' operator issue with PgColumn
      const excludeIds = [...followingIds];
      
      const suggestedUsers = await db.select({
        id: users.id,
        username: users.username,
        name: users.name,
        avatar: users.avatar,
        bio: users.bio,
        isVendor: users.isVendor,
        role: users.role
      })
        .from(users)
        .where(
          sql`${users.id} NOT IN (${excludeIds.join(',')})`
        )
        .orderBy(desc(users.lastLogin))
        .limit(limit);
      
      return suggestedUsers;
    } catch (error) {
      console.error(`Error getting suggested users for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Get user's personalized feed
   */
  async getUserFeed(userId: number, options: FeedOptions = {}): Promise<Partial<Post>[]> {
    try {
      // Get the list of users the current user is following
      const following = await db.select({ followingId: follows.followingId })
        .from(follows)
        .where(eq(follows.followerId, userId));
      
      const followingIds = following.map(f => f.followingId);
      followingIds.push(userId); // Include the user's own posts in their feed
      
      // Use an array join for SQL query to avoid 'in' operator issues
      const includeUserIds = [...followingIds];
      
      // Query for posts from followed users
      let postsQuery = db.select({
        id: posts.id,
        userId: posts.userId,
        content: posts.content,
        title: posts.title,
        contentType: posts.contentType,
        imageUrl: posts.imageUrl,
        videoUrl: posts.videoUrl,
        productId: posts.productId,
        communityId: posts.communityId,
        likes: posts.likes,
        comments: posts.comments,
        shares: posts.shares,
        views: posts.views,
        tags: posts.tags,
        isPromoted: posts.isPromoted,
        isPublished: posts.isPublished,
        createdAt: posts.createdAt,
        updatedAt: posts.updatedAt,
        // User details joined
        user: {
          id: users.id,
          username: users.username,
          name: users.name,
          avatar: users.avatar,
          bio: users.bio,
          isVendor: users.isVendor
        }
      })
        .from(posts)
        .innerJoin(users, eq(posts.userId, users.id))
        .where(and(
          sql`${posts.userId} IN (${includeUserIds.join(',')})`,
          eq(posts.isPublished, true)
        ))
        .orderBy(desc(posts.createdAt));
      
      // Apply content type filtering if specified
      if (options.contentTypes && options.contentTypes.length > 0) {
        const contentTypeList = options.contentTypes.map(type => `'${type}'`).join(',');
        postsQuery = postsQuery.where(
          sql`${posts.contentType} IN (${contentTypeList})`
        );
      }
      
      // Apply pagination
      if (options.limit) {
        postsQuery = postsQuery.limit(options.limit);
      }
      
      if (options.offset) {
        postsQuery = postsQuery.offset(options.offset);
      }
      
      const feedPosts = await postsQuery;
      return feedPosts;
    } catch (error) {
      console.error(`Error getting feed for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Get explore content for discovery
   */
  async getExploreContent(userId?: number): Promise<ExploreContent> {
    try {
      // Get trending posts
      const trendingPosts = await this.getTrendingPosts(5);
      
      // Get trending videos
      const trendingVideos = await this.getTrendingVideos(5);
      
      // Get popular communities
      const popularCommunities = await db.select({
        id: communities.id,
        name: communities.name,
        description: communities.description,
        coverImage: communities.coverImage,
        icon: communities.icon,
        memberCount: communities.memberCount,
        creatorId: communities.creatorId,
        visibility: communities.visibility,
        isVerified: communities.isVerified,
        createdAt: communities.createdAt
      })
        .from(communities)
        .orderBy(desc(communities.memberCount))
        .limit(5);
      
      // Get suggested users
      let suggestedUsers: Partial<User>[] = [];
      if (userId) {
        suggestedUsers = await this.getSuggestedUsers(userId, 5);
      } else {
        // Get some active users if not logged in
        suggestedUsers = await db.select({
          id: users.id,
          username: users.username,
          name: users.name,
          avatar: users.avatar,
          bio: users.bio,
          isVendor: users.isVendor,
          role: users.role
        })
          .from(users)
          .orderBy(desc(users.lastLogin))
          .limit(5);
      }
      
      return {
        trendingPosts,
        trendingVideos,
        popularCommunities,
        suggestedUsers
      };
    } catch (error) {
      console.error('Error getting explore content:', error);
      throw error;
    }
  }

  /**
   * Get trending posts
   */
  async getTrendingPosts(limit = 10): Promise<Partial<Post>[]> {
    try {
      // Calculate a trending score based on likes, comments, and views
      const trendingPosts = await db.select({
        id: posts.id,
        userId: posts.userId,
        content: posts.content,
        title: posts.title,
        contentType: posts.contentType,
        imageUrl: posts.imageUrl,
        videoUrl: posts.videoUrl,
        productId: posts.productId,
        communityId: posts.communityId,
        likes: posts.likes,
        comments: posts.comments,
        shares: posts.shares,
        views: posts.views,
        tags: posts.tags,
        isPromoted: posts.isPromoted,
        isPublished: posts.isPublished,
        createdAt: posts.createdAt,
        updatedAt: posts.updatedAt,
        // User details
        user: {
          id: users.id,
          username: users.username,
          name: users.name,
          avatar: users.avatar,
          bio: users.bio,
          isVendor: users.isVendor
        }
      })
        .from(posts)
        .innerJoin(users, eq(posts.userId, users.id))
        .where(eq(posts.isPublished, true))
        .orderBy(desc(sql`${posts.likes} + ${posts.comments} * 2 + ${posts.views} * 0.1`))
        .limit(limit);
      
      return trendingPosts;
    } catch (error) {
      console.error('Error getting trending posts:', error);
      throw error;
    }
  }

  /**
   * Get a user's communities
   */
  async getUserCommunities(userId: number): Promise<Partial<Community>[]> {
    try {
      // Get communities created by the user and communities they belong to
      const userCommunities = await db.select({
        id: communities.id,
        name: communities.name,
        description: communities.description,
        coverImage: communities.coverImage,
        icon: communities.icon,
        memberCount: communities.memberCount,
        creatorId: communities.creatorId,
        visibility: communities.visibility,
        isVerified: communities.isVerified,
        createdAt: communities.createdAt
      })
        .from(communities)
        .where(eq(communities.creatorId, userId))
        .orderBy(desc(communities.createdAt));
      
      // Also get communities the user is a member of but didn't create
      const memberCommunities = await db.select({
        id: communities.id,
        name: communities.name,
        description: communities.description,
        coverImage: communities.coverImage,
        icon: communities.icon,
        memberCount: communities.memberCount,
        creatorId: communities.creatorId,
        visibility: communities.visibility,
        isVerified: communities.isVerified,
        createdAt: communities.createdAt
      })
        .from(communityMembers)
        .innerJoin(communities, eq(communityMembers.communityId, communities.id))
        .where(
          and(
            eq(communityMembers.userId, userId),
            sql`${communities.creatorId} != ${userId}`
          )
        )
        .orderBy(desc(communities.createdAt));
      
      // Combine the two sets
      return [...userCommunities, ...memberCommunities];
    } catch (error) {
      console.error(`Error getting communities for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Get posts from a specific community
   */
  async getCommunityPosts(communityId: number): Promise<Partial<Post>[]> {
    try {
      const communityPosts = await db.select({
        id: posts.id,
        userId: posts.userId,
        content: posts.content,
        title: posts.title,
        contentType: posts.contentType,
        imageUrl: posts.imageUrl,
        videoUrl: posts.videoUrl,
        productId: posts.productId,
        communityId: posts.communityId,
        likes: posts.likes,
        comments: posts.comments,
        shares: posts.shares,
        views: posts.views,
        tags: posts.tags,
        isPromoted: posts.isPromoted,
        isPublished: posts.isPublished,
        createdAt: posts.createdAt,
        updatedAt: posts.updatedAt,
        // User details
        user: {
          id: users.id,
          username: users.username,
          name: users.name,
          avatar: users.avatar,
          bio: users.bio,
          isVendor: users.isVendor
        }
      })
        .from(posts)
        .innerJoin(users, eq(posts.userId, users.id))
        .where(and(
          eq(posts.communityId, communityId),
          eq(posts.isPublished, true)
        ))
        .orderBy(desc(posts.createdAt));
      
      return communityPosts;
    } catch (error) {
      console.error(`Error getting posts for community ${communityId}:`, error);
      throw error;
    }
  }

  /**
   * Get notifications for a user
   */
  async getNotifications(userId: number, limit = 10): Promise<Partial<Notification>[]> {
    try {
      const userNotifications = await db.select({
        id: notifications.id,
        userId: notifications.userId,
        type: notifications.type,
        message: notifications.message,
        relatedUserId: notifications.relatedUserId,
        relatedEntityId: notifications.relatedEntityId,
        relatedEntityType: notifications.relatedEntityType,
        isRead: notifications.isRead,
        actionUrl: notifications.actionUrl,
        createdAt: notifications.createdAt,
        // Include related user details when available
        relatedUser: {
          id: users.id,
          username: users.username,
          name: users.name,
          avatar: users.avatar
        }
      })
        .from(notifications)
        .leftJoin(users, eq(notifications.relatedUserId, users.id))
        .where(eq(notifications.userId, userId))
        .orderBy(desc(notifications.createdAt))
        .limit(limit);
      
      return userNotifications;
    } catch (error) {
      console.error(`Error getting notifications for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Get unread notification count for a user
   */
  async getUnreadNotificationCount(userId: number): Promise<number> {
    try {
      const result = await db.select({ count: sql<number>`count(*)` })
        .from(notifications)
        .where(and(
          eq(notifications.userId, userId),
          eq(notifications.isRead, false)
        ));
      
      return result[0]?.count || 0;
    } catch (error) {
      console.error(`Error getting unread notification count for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Mark notifications as read
   */
  async markNotificationsAsRead(notificationIds: number[]): Promise<void> {
    try {
      if (notificationIds.length === 0) return;
      
      // Use SQL template for the IN condition to avoid issues with the typed schema
      const idList = notificationIds.join(',');
      await db.update(notifications)
        .set({ isRead: true })
        .where(sql`${notifications.id} IN (${idList})`);
    } catch (error) {
      console.error(`Error marking notifications as read:`, error);
      throw error;
    }
  }

  /**
   * Get user's conversations (chat partners)
   */
  async getUserConversations(userId: number): Promise<Conversation[]> {
    try {
      // Get messages sent by user
      const sentMessages = await db.select({
        partnerId: messages.receiverId,
        message: messages.content,
        createdAt: messages.createdAt
      })
        .from(messages)
        .where(eq(messages.senderId, userId))
        .orderBy(desc(messages.createdAt));
      
      // Get messages received by user
      const receivedMessages = await db.select({
        partnerId: messages.senderId,
        message: messages.content,
        createdAt: messages.createdAt
      })
        .from(messages)
        .where(eq(messages.receiverId, userId))
        .orderBy(desc(messages.createdAt));
      
      // Combine and sort messages
      const allMessages = [...sentMessages, ...receivedMessages]
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      
      // Create a Map to track the most recent message from each partner
      const conversationsMap = new Map<number, {
        lastMessage: string;
        lastMessageTime: Date;
      }>();
      
      // Populate the map with the most recent message from each partner
      allMessages.forEach(msg => {
        if (!conversationsMap.has(msg.partnerId)) {
          conversationsMap.set(msg.partnerId, {
            lastMessage: msg.message,
            lastMessageTime: msg.createdAt
          });
        }
      });
      
      // Get unread counts for each conversation
      const unreadCounts = await db.select({
        senderId: messages.senderId,
        count: sql<number>`count(*)`
      })
        .from(messages)
        .where(and(
          eq(messages.receiverId, userId),
          eq(messages.isRead, false)
        ))
        .groupBy(messages.senderId);
      
      // Create a map of partner ID to unread count
      const unreadCountMap = new Map<number, number>();
      unreadCounts.forEach(uc => {
        unreadCountMap.set(uc.senderId, uc.count);
      });
      
      // Get user details for each conversation partner
      const partnerIds = Array.from(conversationsMap.keys());
      
      // Use raw SQL for IN clause since the typed schema doesn't support it properly
      const partnerIdsString = partnerIds.join(',');
      const partners = await db.select({
        id: users.id,
        name: users.name,
        username: users.username,
        avatar: users.avatar
      })
        .from(users)
        .where(sql`${users.id} IN (${partnerIdsString})`);
      
      // Create a map of partner ID to user details
      const partnerDetailsMap = new Map<number, {
        name: string;
        username: string;
        avatar: string | null;
      }>();
      partners.forEach(p => {
        partnerDetailsMap.set(p.id, {
          name: p.name,
          username: p.username,
          avatar: p.avatar
        });
      });
      
      // Build the final conversations array
      const conversations: Conversation[] = [];
      conversationsMap.forEach((conv, partnerId) => {
        const partnerDetails = partnerDetailsMap.get(partnerId);
        if (partnerDetails) {
          conversations.push({
            partnerId,
            partnerName: partnerDetails.name,
            partnerAvatar: partnerDetails.avatar,
            lastMessage: conv.lastMessage,
            lastMessageTime: conv.lastMessageTime,
            unreadCount: unreadCountMap.get(partnerId) || 0
          });
        }
      });
      
      // Sort conversations by most recent message
      return conversations.sort((a, b) => 
        b.lastMessageTime.getTime() - a.lastMessageTime.getTime()
      );
    } catch (error) {
      console.error(`Error getting conversations for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Get messages between two users
   */
  async getConversationMessages(userId: number, partnerId: number): Promise<Partial<Message>[]> {
    try {
      const conversationMessages = await db.select({
        id: messages.id,
        senderId: messages.senderId,
        receiverId: messages.receiverId,
        content: messages.content,
        attachmentUrl: messages.attachmentUrl,
        attachmentType: messages.attachmentType,
        isRead: messages.isRead,
        createdAt: messages.createdAt
      })
        .from(messages)
        .where(or(
          and(
            eq(messages.senderId, userId),
            eq(messages.receiverId, partnerId)
          ),
          and(
            eq(messages.senderId, partnerId),
            eq(messages.receiverId, userId)
          )
        ))
        .orderBy(asc(messages.createdAt));
      
      return conversationMessages;
    } catch (error) {
      console.error(`Error getting conversation messages between users ${userId} and ${partnerId}:`, error);
      throw error;
    }
  }

  /**
   * Send a message to another user
   */
  async sendMessage(messageData: CreateMessageData): Promise<Partial<Message>> {
    try {
      // Add the message to the database
      const [newMessage] = await db.insert(messages).values({
        senderId: messageData.senderId,
        receiverId: messageData.receiverId,
        content: messageData.content,
        attachmentUrl: messageData.attachmentUrl,
        attachmentType: messageData.attachmentType,
        isRead: false,
        createdAt: new Date()
      }).returning();
      
      // Create a notification for the recipient
      await db.insert(notifications).values({
        userId: messageData.receiverId,
        type: 'message',
        message: 'You have a new message',
        relatedUserId: messageData.senderId,
        relatedEntityId: newMessage.id,
        relatedEntityType: 'message',
        isRead: false,
        createdAt: new Date()
      });
      
      return newMessage;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  /**
   * Mark messages as read
   */
  async markMessagesAsRead(messageIds: number[]): Promise<void> {
    try {
      if (messageIds.length === 0) return;
      
      // Use SQL template for the IN condition to avoid issues with typed schema
      const idList = messageIds.join(',');
      await db.update(messages)
        .set({ isRead: true })
        .where(sql`${messages.id} IN (${idList})`);
    } catch (error) {
      console.error('Error marking messages as read:', error);
      throw error;
    }
  }

  /**
   * Get unread message count for a user
   */
  async getUnreadMessageCount(userId: number): Promise<number> {
    try {
      const result = await db.select({ count: sql<number>`count(*)` })
        .from(messages)
        .where(and(
          eq(messages.receiverId, userId),
          eq(messages.isRead, false)
        ));
      
      return result[0]?.count || 0;
    } catch (error) {
      console.error(`Error getting unread message count for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Get trending videos
   */
  async getTrendingVideos(limit = 5): Promise<Partial<Video>[]> {
    try {
      // Get posts with video content type and sort by engagement metrics
      const videoContents = await db.select({
        id: posts.id,
        userId: posts.userId,
        content: posts.content,
        title: posts.title,
        contentType: posts.contentType,
        imageUrl: posts.imageUrl,
        videoUrl: posts.videoUrl,
        likes: posts.likes,
        comments: posts.comments,
        shares: posts.shares,
        views: posts.views,
        tags: posts.tags,
        createdAt: posts.createdAt,
        // Include user details
        user: {
          id: users.id,
          username: users.username,
          name: users.name,
          avatar: users.avatar
        }
      })
        .from(posts)
        .innerJoin(users, eq(posts.userId, users.id))
        .where(and(
          eq(posts.contentType, 'video'),
          eq(posts.isPublished, true),
          sql`${posts.videoUrl} IS NOT NULL`
        ))
        .orderBy(desc(sql`${posts.views} + ${posts.likes} * 2 + ${posts.comments} * 3`))
        .limit(limit);
      
      return videoContents;
    } catch (error) {
      console.error('Error getting trending videos:', error);
      throw error;
    }
  }

  /**
   * Get a video by ID
   */
  async getVideo(id: number): Promise<Partial<Video> | null> {
    try {
      // Find a post with video content type by ID
      const [videoContent] = await db.select({
        id: posts.id,
        userId: posts.userId,
        content: posts.content,
        title: posts.title,
        contentType: posts.contentType,
        imageUrl: posts.imageUrl,
        videoUrl: posts.videoUrl,
        likes: posts.likes,
        comments: posts.comments,
        shares: posts.shares,
        views: posts.views,
        tags: posts.tags,
        createdAt: posts.createdAt,
        // Include user details
        user: {
          id: users.id,
          username: users.username,
          name: users.name,
          avatar: users.avatar
        }
      })
        .from(posts)
        .innerJoin(users, eq(posts.userId, users.id))
        .where(and(
          eq(posts.id, id),
          eq(posts.contentType, 'video'),
          eq(posts.isPublished, true)
        ))
        .limit(1);
      
      if (videoContent) {
        // Update view count
        await db.update(posts)
          .set({ views: sql`${posts.views} + 1` })
          .where(eq(posts.id, id));
      }
      
      return videoContent || null;
    } catch (error) {
      console.error(`Error getting video with ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Search for posts by keyword
   */
  async searchPosts(query: string): Promise<Partial<Post>[]> {
    try {
      if (!query || query.trim() === '') {
        return [];
      }
      
      // Basic search implementation
      const searchText = `%${query.toLowerCase()}%`;
      
      const searchResults = await db.select({
        id: posts.id,
        userId: posts.userId,
        content: posts.content,
        title: posts.title,
        contentType: posts.contentType,
        imageUrl: posts.imageUrl,
        videoUrl: posts.videoUrl,
        productId: posts.productId,
        communityId: posts.communityId,
        likes: posts.likes,
        comments: posts.comments,
        shares: posts.shares,
        views: posts.views,
        tags: posts.tags,
        isPromoted: posts.isPromoted,
        isPublished: posts.isPublished,
        createdAt: posts.createdAt,
        // User details
        user: {
          id: users.id,
          username: users.username,
          name: users.name,
          avatar: users.avatar,
          bio: users.bio
        }
      })
        .from(posts)
        .innerJoin(users, eq(posts.userId, users.id))
        .where(and(
          eq(posts.isPublished, true),
          or(
            sql`lower(${posts.content}) LIKE ${searchText}`,
            sql`lower(${posts.title}) LIKE ${searchText}`,
            sql`${posts.tags}::text LIKE ${searchText}`
          )
        ))
        .orderBy(desc(posts.createdAt));
      
      return searchResults;
    } catch (error) {
      console.error(`Error searching posts with query "${query}":`, error);
      throw error;
    }
  }

  /**
   * Search for users by keyword
   */
  async searchUsers(query: string): Promise<Partial<User>[]> {
    try {
      if (!query || query.trim() === '') {
        return [];
      }
      
      // Basic search implementation
      const searchText = `%${query.toLowerCase()}%`;
      
      const userResults = await db.select({
        id: users.id,
        username: users.username,
        name: users.name,
        avatar: users.avatar,
        bio: users.bio,
        isVendor: users.isVendor,
        followerCount: users.followerCount,
        followingCount: users.followingCount,
        role: users.role,
        lastLogin: users.lastLogin
      })
        .from(users)
        .where(or(
          sql`lower(${users.username}) LIKE ${searchText}`,
          sql`lower(${users.name}) LIKE ${searchText}`,
          sql`lower(${users.bio}) LIKE ${searchText}`
        ))
        .limit(20);
      
      return userResults;
    } catch (error) {
      console.error(`Error searching users with query "${query}":`, error);
      throw error;
    }
  }
}

// Create and export a singleton instance
export const socialMediaSuite = new SocialMediaSuiteImpl();