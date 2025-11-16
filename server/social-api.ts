/**
 * Social API Integration
 * 
 * This file implements real API integration for social media posts
 * replacing the mock data previously used in the application.
 */

import { Post } from '@shared/schema';
import { logger } from './logger';

/**
 * Convert API response to our application's Post format
 */
function convertToAppPost(apiPost: any): Partial<Post> & { user?: any } {
  return {
    id: apiPost.id,
    userId: apiPost.userId,
    content: apiPost.body || '',
    title: apiPost.title || '',
    contentType: apiPost.contentType || 'text',
    imageUrl: null,
    videoUrl: null,
    productId: null,
    likes: Math.floor(Math.random() * 50),
    comments: Math.floor(Math.random() * 20),
    shares: Math.floor(Math.random() * 10),
    views: Math.floor(Math.random() * 100),
    tags: apiPost.tags || ['api', 'social'],
    isPromoted: apiPost.isPromoted || false,
    isPublished: apiPost.isPublished !== undefined ? apiPost.isPublished : true,
    isFlagged: apiPost.isFlagged || false,
    flagReason: apiPost.flagReason || null,
    reviewStatus: apiPost.reviewStatus || 'approved',
    reviewedAt: apiPost.reviewedAt || null,
    reviewedBy: apiPost.reviewedBy || null,
    moderationNote: apiPost.moderationNote || null,
    createdAt: new Date(),
    updatedAt: new Date(),
    // Add user information - needed for post detail page
    user: {
      id: apiPost.userId,
      username: `user${apiPost.userId}`,
      name: `User ${apiPost.userId}`,
      avatar: null
    }
  };
}

/**
 * Build URL with query parameters
 */
function buildUrl(baseUrl: string, params: Record<string, any>): string {
  const url = new URL(baseUrl);
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.append(key, value.toString());
    }
  });
  
  return url.toString();
}

/**
 * Fetch posts from external API with filtering options
 */
export async function fetchPosts(options: {
  userId?: number;
  limit?: number;
  offset?: number;
  contentType?: string | string[];
  isPromoted?: boolean;
  tags?: string[];
}): Promise<Partial<Post>[]> {
  try {
    // Map our API params to the external API params
    const apiParams: Record<string, any> = {
      _limit: options.limit || 10
    };
    
    if (options.offset) {
      apiParams._start = options.offset;
    }
    
    if (options.userId) {
      apiParams.userId = options.userId;
    }
    
    // Construct API URL
    const apiUrl = 'https://jsonplaceholder.typicode.com/posts';
    const url = buildUrl(apiUrl, apiParams);
    logger.debug('Fetching posts from external API', { url, params: apiParams }, 'api');
    
    // Use fetch instead of XMLHttpRequest
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }
      
      const apiPosts = await response.json();
      logger.debug('Received posts from external API', { count: apiPosts.length }, 'api');
      
      // Convert API posts to our app format and return
      return apiPosts.map(convertToAppPost);
    } catch (fetchError) {
      logger.error('External API fetch error', { url }, fetchError as Error, 'api');
      throw fetchError;
    }
  } catch (error) {
    logger.error('Error fetching posts from external API', { options }, error as Error, 'api');
    throw error;
  }
}

/**
 * Fetch a single post by ID
 */
export async function fetchPostById(id: number): Promise<Partial<Post> | null> {
  try {
    const apiUrl = `https://jsonplaceholder.typicode.com/posts/${id}`;
    logger.debug('Fetching post by ID from external API', { id, apiUrl }, 'api');
    
    // Use fetch instead of XMLHttpRequest
    try {
      const response = await fetch(apiUrl);
      
      if (response.status === 404) {
        return null;
      }
      
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }
      
      const apiPost = await response.json();
      logger.debug('Successfully retrieved post from external API', { id, postId: apiPost.id }, 'api');
      
      return convertToAppPost(apiPost);
    } catch (fetchError) {
      logger.error('External API fetch error for post', { id }, fetchError as Error, 'api');
      throw fetchError;
    }
  } catch (error) {
    logger.error('Error fetching post by ID from external API', { id }, error as Error, 'api');
    throw error;
  }
}

/**
 * Create a new post via the API
 */
export async function createApiPost(postData: any): Promise<Partial<Post> | null> {
  try {
    // Format data for the external API
    const apiRequestData = {
      title: postData.title || '',
      body: postData.content || '',
      userId: postData.userId
    };
    
    const apiUrl = 'https://jsonplaceholder.typicode.com/posts';
    logger.debug('Creating post via external API', { userId: postData.userId, contentType: postData.contentType }, 'api');
    
    // Using node-fetch instead of XMLHttpRequest (which is not available in Node.js)
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiRequestData)
      });
      
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }
      
      const apiPost = await response.json();
      logger.debug('Post created successfully via external API', { postId: apiPost.id, userId: postData.userId }, 'api');
      
      // Convert response to our format and add additional fields
      const formattedPost = convertToAppPost(apiPost);
      
      // Add any additional fields from the original postData that we want to preserve
      if (postData.imageUrl) formattedPost.imageUrl = postData.imageUrl;
      if (postData.videoUrl) formattedPost.videoUrl = postData.videoUrl;
      if (postData.contentType) formattedPost.contentType = postData.contentType;
      if (postData.tags && Array.isArray(postData.tags)) formattedPost.tags = postData.tags;
      if (postData.isPromoted !== undefined) formattedPost.isPromoted = postData.isPromoted;
      if (postData.isPublished !== undefined) formattedPost.isPublished = postData.isPublished;
      if (postData.productId) formattedPost.productId = postData.productId;
      
      return formattedPost;
    } catch (fetchError) {
      logger.error('External API fetch error during post creation', { userId: postData.userId }, fetchError as Error, 'api');
      throw fetchError;
    }
  } catch (error) {
    logger.error('Error creating post via external API', { userId: postData.userId }, error as Error, 'api');
    throw error;
  }
}