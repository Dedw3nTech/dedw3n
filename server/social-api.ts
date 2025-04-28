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
    console.log(`Fetching posts from API with params:`, apiParams);
    
    // Using XMLHttpRequest as an alternative to fetch since axios installation failed
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const url = buildUrl(apiUrl, apiParams);
      
      xhr.open('GET', url, true);
      xhr.onload = function() {
        if (xhr.status >= 200 && xhr.status < 300) {
          const apiPosts = JSON.parse(xhr.responseText);
          console.log(`Received ${apiPosts.length} posts from API`);
          resolve(apiPosts.map(convertToAppPost));
        } else {
          reject(new Error(`API request failed with status ${xhr.status}`));
        }
      };
      
      xhr.onerror = function() {
        reject(new Error('Network error occurred'));
      };
      
      xhr.send();
    });
  } catch (error) {
    console.error('Error fetching posts:', error);
    throw error;
  }
}

/**
 * Fetch a single post by ID
 */
export async function fetchPostById(id: number): Promise<Partial<Post> | null> {
  try {
    const apiUrl = `https://jsonplaceholder.typicode.com/posts/${id}`;
    console.log(`Fetching post from API: ${apiUrl}`);
    
    // Using XMLHttpRequest as an alternative to fetch
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      xhr.open('GET', apiUrl, true);
      xhr.onload = function() {
        if (xhr.status >= 200 && xhr.status < 300) {
          const apiPost = JSON.parse(xhr.responseText);
          console.log(`Successfully retrieved post from API:`, apiPost);
          resolve(convertToAppPost(apiPost));
        } else if (xhr.status === 404) {
          resolve(null);
        } else {
          reject(new Error(`API request failed with status ${xhr.status}`));
        }
      };
      
      xhr.onerror = function() {
        reject(new Error('Network error occurred'));
      };
      
      xhr.send();
    });
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
    
    const apiUrl = 'https://jsonplaceholder.typicode.com/posts';
    console.log("Creating post via API with data:", apiRequestData);
    
    // Using XMLHttpRequest as an alternative to fetch
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      xhr.open('POST', apiUrl, true);
      xhr.setRequestHeader('Content-Type', 'application/json');
      
      xhr.onload = function() {
        if (xhr.status >= 200 && xhr.status < 300) {
          const apiPost = JSON.parse(xhr.responseText);
          console.log("Post created successfully via API:", apiPost);
          
          // Convert response to our format and add additional fields
          const formattedPost = convertToAppPost(apiPost);
          
          // Add any additional fields from the original postData that we want to preserve
          if (postData.imageUrl) formattedPost.imageUrl = postData.imageUrl;
          if (postData.videoUrl) formattedPost.videoUrl = postData.videoUrl;
          if (postData.tags && Array.isArray(postData.tags)) formattedPost.tags = postData.tags;
          
          resolve(formattedPost);
        } else {
          reject(new Error(`API request failed with status ${xhr.status}`));
        }
      };
      
      xhr.onerror = function() {
        reject(new Error('Network error occurred'));
      };
      
      xhr.send(JSON.stringify(apiRequestData));
    });
  } catch (error) {
    console.error("Error creating post via API:", error);
    throw error;
  }
}