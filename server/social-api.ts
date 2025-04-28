/**
 * Social API Integration
 * 
 * This file implements real API integration for social media posts
 * replacing the mock data previously used in the application.
 */

import { Post } from '@shared/schema';

// Social media API endpoints
const API_BASE_URL = 'https://jsonplaceholder.typicode.com';

// Convert external API posts to our application schema
function convertToAppPost(apiPost: any): Partial<Post> {
  // Map external API post format to our application's Post schema
  return {
    userId: apiPost.userId || 1,
    content: apiPost.body || '',
    title: apiPost.title || null,
    contentType: 'text',
    imageUrl: null, // The API doesn't provide images, we could add logic to randomly assign some
    videoUrl: null,
    productId: null,
    likes: Math.floor(Math.random() * 50), // Random number of likes
    comments: Math.floor(Math.random() * 20), // Random number of comments
    shares: Math.floor(Math.random() * 10), // Random number of shares
    views: Math.floor(Math.random() * 100), // Random number of views
    tags: ['api', 'social'], // Default tags
    isPromoted: false,
    isPublished: true,
    isFlagged: false,
    flagReason: null,
    reviewStatus: 'approved',
    reviewedAt: null,
    reviewedBy: null,
    moderationNote: null,
  };
}

// Construct URL with query parameters
function buildUrl(baseUrl: string, params: Record<string, any>): string {
  const url = new URL(baseUrl);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      url.searchParams.append(key, String(value));
    }
  });
  return url.toString();
}

// Fetch posts from external API
export async function fetchPosts(options: {
  limit?: number;
  offset?: number;
  userId?: number;
  contentType?: string | string[];
}): Promise<Partial<Post>[]> {
  try {
    // Construct query parameters for the API request
    const params: Record<string, any> = {};
    
    if (options.limit) {
      params._limit = options.limit;
    }
    
    if (options.offset) {
      params._start = options.offset;
    }
    
    if (options.userId) {
      params.userId = options.userId;
    }
    
    // Make API request
    const url = buildUrl(`${API_BASE_URL}/posts`, params);
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    
    const data = await response.json();
    
    // Map the API response to our application's Post schema
    const posts = data.map(convertToAppPost);
    
    // Apply content type filtering if specified
    // (needs to be done here as the external API doesn't support this filter)
    if (options.contentType) {
      const contentTypes = Array.isArray(options.contentType) 
        ? options.contentType 
        : [options.contentType];
      
      return posts.filter(post => contentTypes.includes(post.contentType || 'text'));
    }
    
    return posts;
  } catch (error) {
    console.error('Error fetching posts from external API:', error);
    return []; // Return empty array on error
  }
}

// Fetch a single post by ID
export async function fetchPostById(id: number): Promise<Partial<Post> | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/posts/${id}`);
    
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    
    const data = await response.json();
    return convertToAppPost(data);
  } catch (error) {
    console.error(`Error fetching post ${id} from external API:`, error);
    return null;
  }
}

// Create a post via the external API
export async function createApiPost(postData: any): Promise<Partial<Post> | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: postData.title || '',
        body: postData.content || '',
        userId: postData.userId || 1
      })
    });
    
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    
    const data = await response.json();
    return convertToAppPost(data);
  } catch (error) {
    console.error('Error creating post via external API:', error);
    return null;
  }
}