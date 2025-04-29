/**
 * All-in-One Social Media Suite
 * 
 * A comprehensive API implementation that integrates all social media features
 * in a unified, consistent interface replacing the previous fragmented approach.
 */

import { Post, User, Comment, Like, Notification, Message, Community, Video, Follow } from '@shared/schema';
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
      let query = db.select().from(Post);
      
      // Apply filters
      if (options.userId) {
        query = query.where(eq(Post.userId, options.userId));
      }
      
      if (options.contentType) {
        if (Array.isArray(options.contentType)) {
          query = query.where(sql`${Post.contentType} IN (${options.contentType.join(',')})`);
        } else {
          query = query.where(eq(Post.contentType, options.contentType));
        }
      }
      
      if (options.isPromoted !== undefined) {
        query = query.where(eq(Post.isPromoted, options.isPromoted));
      }
      
      if (options.tags && options.tags.length > 0) {
        // This is a simplified approach - in production you might use a more sophisticated tags matching
        query = query.where(sql`${Post.tags} && ARRAY[${options.tags.join(',')}]::text[]`);
      }
      
      if (options.excludeIds && options.excludeIds.length > 0) {
        query = query.where(sql`${Post.id} NOT IN (${options.excludeIds.join(',')})`);
      }
      
      // Always filter out unpublished posts unless explicitly requested
      if (options.includeUserDetails) {
        // Join with user table to get user details
        query = query.innerJoin(User, eq(Post.userId, User.id))
          .select({
            post: Post,
            user: {
              id: User.id,
              username: User.username,
              name: User.name,
              avatar: User.avatar
            }
          });
      }
      
      // Order by most recent first
      query = query.orderBy(desc(Post.createdAt));
      
      // Apply pagination
      if (options.limit) {
        query = query.limit(options.limit);
      }
      
      if (options.offset) {
        query = query.offset(options.offset);
      }
      
      // Execute the query
      const results = await query;
      
      // Transform results if we joined with user details
      if (options.includeUserDetails) {
        return results.map(result => ({
          ...result.post,
          user: {
            id: result.user.id,
            username: result.user.username,
            name: result.user.name,
            avatar: result.user.avatar
          }
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
      const [post] = await db.select().from(Post).where(eq(Post.id, id)).limit(1);
      return post || null;
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
      const insertData: any = {
        userId: postData.userId,
        content: postData.content,
        contentType: postData.contentType || 'text',
        isPublished: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Add optional fields if they exist
      if (postData.title) insertData.title = postData.title;
      if (postData.imageUrl) insertData.imageUrl = postData.imageUrl;
      if (postData.videoUrl) insertData.videoUrl = postData.videoUrl;
      if (postData.tags) insertData.tags = postData.tags;
      if (postData.isPromoted !== undefined) insertData.isPromoted = postData.isPromoted;
      if (postData.productId) insertData.productId = postData.productId;
      
      // Insert into database
      const [newPost] = await db.insert(Post).values(insertData).returning();
      console.log('Post created successfully:', newPost);
      
      return newPost;
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
      updateData.updatedAt = new Date();
      
      const [updatedPost] = await db.update(Post)
        .set(updateData)
        .where(eq(Post.id, id))
        .returning();
      
      return updatedPost || null;
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
      const result = await db.delete(Post).where(eq(Post.id, id));
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
        .from(Like)
        .where(and(eq(Like.postId, postId), eq(Like.userId, userId)))
        .limit(1);
      
      if (existingLike.length === 0) {
        // Create the like if it doesn't exist
        await db.insert(Like).values({
          postId,
          userId,
          createdAt: new Date()
        });
        
        // Increment the post's like count
        await db.update(Post)
          .set({ likes: sql`${Post.likes} + 1` })
          .where(eq(Post.id, postId));
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
        .from(Like)
        .where(and(eq(Like.postId, postId), eq(Like.userId, userId)))
        .limit(1);
      
      if (existingLike.length > 0) {
        // Delete the like if it exists
        await db.delete(Like)
          .where(and(eq(Like.postId, postId), eq(Like.userId, userId)));
        
        // Decrement the post's like count
        await db.update(Post)
          .set({ likes: sql`greatest(${Post.likes} - 1, 0)` })
          .where(eq(Post.id, postId));
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
      const [originalPost] = await db.select().from(Post).where(eq(Post.id, postId)).limit(1);
      
      if (!originalPost) {
        throw new Error(`Post with ID ${postId} not found`);
      }
      
      // Increment the shares count on the original post
      await db.update(Post)
        .set({ shares: sql`${Post.shares} + 1` })
        .where(eq(Post.id, postId));
      
      // Create a new post that shares the original
      const insertData = {
        userId,
        content: `Shared: ${originalPost.content?.substring(0, 50)}...`,
        contentType: 'share',
        isPublished: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        // Store reference to the original post in a shared_post_id field
        // (You might need to add this field to your schema)
        // sharedPostId: originalPost.id
      };
      
      const [newPost] = await db.insert(Post).values(insertData).returning();
      return newPost;
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
      const comments = await db.select({
        comment: Comment,
        user: {
          id: User.id,
          username: User.username,
          name: User.name,
          avatar: User.avatar
        }
      })
        .from(Comment)
        .innerJoin(User, eq(Comment.userId, User.id))
        .where(eq(Comment.postId, postId))
        .orderBy(asc(Comment.createdAt));
      
      return comments.map(result => ({
        ...result.comment,
        user: result.user
      }));
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
      const [newComment] = await db.insert(Comment).values({
        ...commentData,
        createdAt: new Date()
      }).returning();
      
      // Increment the comment count on the post
      await db.update(Post)
        .set({ comments: sql`${Post.comments} + 1` })
        .where(eq(Post.id, commentData.postId));
      
      return newComment;
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
      const [comment] = await db.select().from(Comment).where(eq(Comment.id, id)).limit(1);
      
      if (!comment) {
        return false;
      }
      
      // Delete the comment
      await db.delete(Comment).where(eq(Comment.id, id));
      
      // Decrement the comment count on the post
      await db.update(Post)
        .set({ comments: sql`greatest(${Post.comments} - 1, 0)` })
        .where(eq(Post.id, comment.postId));
      
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
        .from(Follow)
        .where(and(eq(Follow.followerId, followerId), eq(Follow.followingId, followingId)))
        .limit(1);
      
      if (existingFollow.length === 0) {
        // Create the follow relationship
        await db.insert(Follow).values({
          followerId,
          followingId,
          createdAt: new Date()
        });
        
        // Create a notification for the followed user
        await db.insert(Notification).values({
          userId: followingId,
          type: 'follow',
          content: `A user started following you.`,
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
      await db.delete(Follow)
        .where(and(eq(Follow.followerId, followerId), eq(Follow.followingId, followingId)));
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
        user: {
          id: User.id,
          username: User.username,
          name: User.name,
          avatar: User.avatar,
          bio: User.bio
        }
      })
        .from(Follow)
        .innerJoin(User, eq(Follow.followerId, User.id))
        .where(eq(Follow.followingId, userId));
      
      return followers.map(f => f.user);
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
        user: {
          id: User.id,
          username: User.username,
          name: User.name, 
          avatar: User.avatar,
          bio: User.bio
        }
      })
        .from(Follow)
        .innerJoin(User, eq(Follow.followingId, User.id))
        .where(eq(Follow.followerId, userId));
      
      return following.map(f => f.user);
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
        .from(Follow)
        .where(eq(Follow.followingId, userId));
      
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
        .from(Follow)
        .where(eq(Follow.followerId, userId));
      
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
      const following = await db.select({ followingId: Follow.followingId })
        .from(Follow)
        .where(eq(Follow.followerId, userId));
      
      const followingIds = following.map(f => f.followingId);
      followingIds.push(userId); // Add the current user to the exclusion list
      
      // Find users that the current user is not following
      let query = db.select({
        id: User.id,
        username: User.username,
        name: User.name,
        avatar: User.avatar,
        bio: User.bio
      })
        .from(User)
        .where(not(User.id.in(followingIds)))
        .limit(limit);
      
      return await query;
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
      const following = await db.select({ followingId: Follow.followingId })
        .from(Follow)
        .where(eq(Follow.followerId, userId));
      
      const followingIds = following.map(f => f.followingId);
      followingIds.push(userId); // Include the user's own posts in their feed
      
      // Query for posts from followed users
      let query = db.select({
        post: Post,
        user: {
          id: User.id,
          username: User.username,
          name: User.name,
          avatar: User.avatar
        }
      })
        .from(Post)
        .innerJoin(User, eq(Post.userId, User.id))
        .where(and(
          Post.userId.in(followingIds),
          eq(Post.isPublished, true)
        ))
        .orderBy(desc(Post.createdAt));
      
      // Apply content type filtering if specified
      if (options.contentTypes && options.contentTypes.length > 0) {
        query = query.where(Post.contentType.in(options.contentTypes));
      }
      
      // Apply pagination
      if (options.limit) {
        query = query.limit(options.limit);
      }
      
      if (options.offset) {
        query = query.offset(options.offset);
      }
      
      const results = await query;
      
      // Transform the results
      return results.map(result => ({
        ...result.post,
        user: {
          id: result.user.id,
          username: result.user.username,
          name: result.user.name,
          avatar: result.user.avatar
        }
      }));
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
      const popularCommunities = await db.select()
        .from(Community)
        .orderBy(desc(Community.memberCount))
        .limit(5);
      
      // Get suggested users
      let suggestedUsers: Partial<User>[] = [];
      if (userId) {
        suggestedUsers = await this.getSuggestedUsers(userId, 5);
      } else {
        // Get some active users if not logged in
        suggestedUsers = await db.select({
          id: User.id,
          username: User.username,
          name: User.name,
          avatar: User.avatar,
          bio: User.bio
        })
          .from(User)
          .orderBy(desc(User.lastLogin))
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
        post: Post,
        user: {
          id: User.id,
          username: User.username,
          name: User.name,
          avatar: User.avatar
        }
      })
        .from(Post)
        .innerJoin(User, eq(Post.userId, User.id))
        .where(eq(Post.isPublished, true))
        .orderBy(desc(sql`${Post.likes} + ${Post.comments} * 2 + ${Post.views} * 0.1`))
        .limit(limit);
      
      return trendingPosts.map(result => ({
        ...result.post,
        user: {
          id: result.user.id,
          username: result.user.username,
          name: result.user.name,
          avatar: result.user.avatar
        }
      }));
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
      // This implementation would depend on your community membership schema
      // For now, we'll return a sample implementation
      const communities = await db.select()
        .from(Community)
        .where(eq(Community.creatorId, userId))
        .orderBy(desc(Community.createdAt));
      
      return communities;
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
      const posts = await db.select({
        post: Post,
        user: {
          id: User.id,
          username: User.username,
          name: User.name,
          avatar: User.avatar
        }
      })
        .from(Post)
        .innerJoin(User, eq(Post.userId, User.id))
        .where(and(
          eq(Post.communityId, communityId),
          eq(Post.isPublished, true)
        ))
        .orderBy(desc(Post.createdAt));
      
      return posts.map(result => ({
        ...result.post,
        user: {
          id: result.user.id,
          username: result.user.username,
          name: result.user.name,
          avatar: result.user.avatar
        }
      }));
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
      const notifications = await db.select()
        .from(Notification)
        .where(eq(Notification.userId, userId))
        .orderBy(desc(Notification.createdAt))
        .limit(limit);
      
      return notifications;
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
        .from(Notification)
        .where(and(
          eq(Notification.userId, userId),
          eq(Notification.isRead, false)
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
      
      await db.update(Notification)
        .set({ isRead: true })
        .where(Notification.id.in(notificationIds));
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
      // This is a more complex query that requires raw SQL in most cases
      // Here's a simplified version
      const sentMessages = await db.select({
        partnerId: Message.receiverId,
        message: Message.content,
        createdAt: Message.createdAt
      })
        .from(Message)
        .where(eq(Message.senderId, userId))
        .orderBy(desc(Message.createdAt));
      
      const receivedMessages = await db.select({
        partnerId: Message.senderId,
        message: Message.content,
        createdAt: Message.createdAt
      })
        .from(Message)
        .where(eq(Message.receiverId, userId))
        .orderBy(desc(Message.createdAt));
      
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
        senderId: Message.senderId,
        count: sql<number>`count(*)`
      })
        .from(Message)
        .where(and(
          eq(Message.receiverId, userId),
          eq(Message.isRead, false)
        ))
        .groupBy(Message.senderId);
      
      // Create a map of partner ID to unread count
      const unreadCountMap = new Map<number, number>();
      unreadCounts.forEach(uc => {
        unreadCountMap.set(uc.senderId, uc.count);
      });
      
      // Get user details for each conversation partner
      const partnerIds = Array.from(conversationsMap.keys());
      const partners = await db.select({
        id: User.id,
        name: User.name,
        username: User.username,
        avatar: User.avatar
      })
        .from(User)
        .where(User.id.in(partnerIds));
      
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
      const messages = await db.select()
        .from(Message)
        .where(or(
          and(
            eq(Message.senderId, userId),
            eq(Message.receiverId, partnerId)
          ),
          and(
            eq(Message.senderId, partnerId),
            eq(Message.receiverId, userId)
          )
        ))
        .orderBy(asc(Message.createdAt));
      
      return messages;
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
      const [newMessage] = await db.insert(Message).values({
        ...messageData,
        isRead: false,
        createdAt: new Date()
      }).returning();
      
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
      
      await db.update(Message)
        .set({ isRead: true })
        .where(Message.id.in(messageIds));
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
        .from(Message)
        .where(and(
          eq(Message.receiverId, userId),
          eq(Message.isRead, false)
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
      // This is a simplified implementation
      const videos = await db.select()
        .from(Video)
        .orderBy(desc(sql`${Video.views} + ${Video.likes} * 2`))
        .limit(limit);
      
      return videos;
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
      const [video] = await db.select()
        .from(Video)
        .where(eq(Video.id, id))
        .limit(1);
      
      return video || null;
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
      
      const posts = await db.select({
        post: Post,
        user: {
          id: User.id,
          username: User.username,
          name: User.name,
          avatar: User.avatar
        }
      })
        .from(Post)
        .innerJoin(User, eq(Post.userId, User.id))
        .where(and(
          eq(Post.isPublished, true),
          or(
            sql`lower(${Post.content}) LIKE ${searchText}`,
            sql`lower(${Post.title}) LIKE ${searchText}`,
            sql`${Post.tags}::text LIKE ${searchText}`
          )
        ))
        .orderBy(desc(Post.createdAt));
      
      return posts.map(result => ({
        ...result.post,
        user: {
          id: result.user.id,
          username: result.user.username,
          name: result.user.name,
          avatar: result.user.avatar
        }
      }));
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
      
      const users = await db.select({
        id: User.id,
        username: User.username,
        name: User.name,
        avatar: User.avatar,
        bio: User.bio
      })
        .from(User)
        .where(or(
          sql`lower(${User.username}) LIKE ${searchText}`,
          sql`lower(${User.name}) LIKE ${searchText}`,
          sql`lower(${User.bio}) LIKE ${searchText}`
        ))
        .limit(20);
      
      return users;
    } catch (error) {
      console.error(`Error searching users with query "${query}":`, error);
      throw error;
    }
  }
}

// Create and export a singleton instance
export const socialMediaSuite = new SocialMediaSuiteImpl();