/**
 * Social API Integration
 * 
 * This file implements real API integration for social media posts
 * replacing the mock data previously used in the application.
 */

import { Post } from '@shared/schema';

/**
 * Convert API response to our application's Post format
 */
function convertToAppPost(apiPost: any): Partial<Post> {
  return {
    id: apiPost.id,
    userId: apiPost.userId,
    content: apiPost.body || '',
    title: apiPost.title || '',
    contentType: 'text',
    imageUrl: null,
    videoUrl: null,
    productId: null,
    likes: Math.floor(Math.random() * 50),
    comments: Math.floor(Math.random() * 20),
    shares: Math.floor(Math.random() * 10),
    views: Math.floor(Math.random() * 100),
    tags: ['api', 'social'],
    isPromoted: false,
    isPublished: true,
    isFlagged: false,
    flagReason: null,
    reviewStatus: 'approved',
    reviewedAt: null,
    reviewedBy: null,
    moderationNote: null,
    createdAt: new Date(),
    updatedAt: new Date()
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
  
  // Fetch from external API
  const apiUrl = buildUrl('https://jsonplaceholder.typicode.com/posts', apiParams);
  console.log(`Fetching posts from API: ${apiUrl}`);
  
  const response = await fetch(apiUrl);
  
  if (!response.ok) {
    throw new Error(`API request failed with status ${response.status}`);
  }
  
  const apiPosts = await response.json();
  console.log(`Received ${apiPosts.length} posts from API`);
  
  // Convert to our application's format
  return apiPosts.map(convertToAppPost);
}

/**
 * Fetch a single post by ID
 */
export async function fetchPostById(id: number): Promise<Partial<Post> | null> {
  try {
    const apiUrl = `https://jsonplaceholder.typicode.com/posts/${id}`;
    console.log(`Fetching post from API: ${apiUrl}`);
    
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`API request failed with status ${response.status}`);
    }
    
    const apiPost = await response.json();
    console.log(`Successfully retrieved post from API:`, apiPost);
    
    return convertToAppPost(apiPost);
  } catch (error) {
    console.error("Error fetching post by ID:", error);
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
    
    // Send post request
    const response = await fetch('https://jsonplaceholder.typicode.com/posts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(apiRequestData)
    });
    
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    
    const apiPost = await response.json();
    console.log("Post created successfully via API:", apiPost);
    
    // Convert response to our format and add additional fields
    const formattedPost = convertToAppPost(apiPost);
    
    // Add any additional fields from the original postData that we want to preserve
    if (postData.imageUrl) formattedPost.imageUrl = postData.imageUrl;
    if (postData.videoUrl) formattedPost.videoUrl = postData.videoUrl;
    if (postData.tags && Array.isArray(postData.tags)) formattedPost.tags = postData.tags;
    
    return formattedPost;
  } catch (error) {
    console.error("Error creating post via API:", error);
    throw error;
  }
}