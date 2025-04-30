/**
 * News Feed API Integration
 * 
 * This file implements the backend API for fetching and integrating news content
 * from NewsAPI.org.
 */
import { Request, Response, NextFunction } from "express";
import { db } from "./db";
import { posts, users } from "@shared/schema";
import { and, eq, like, desc, sql } from "drizzle-orm";
import https from 'https';

// News API configuration
const NEWS_API_KEY = process.env.NEWS_API_KEY;
const NEWS_API_BASE_URL = 'https://newsapi.org/v2';

if (!NEWS_API_KEY) {
  console.error('NEWS_API_KEY is not defined in the environment variables');
}

// Helper function to make a GET request to the News API
function fetchNewsApi(endpoint: string, params: Record<string, string | number>): Promise<any> {
  return new Promise((resolve, reject) => {
    // Construct query string from params
    const queryParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      queryParams.append(key, String(value));
    }
    // Always add the API key
    queryParams.append('apiKey', NEWS_API_KEY as string);
    
    const url = `${NEWS_API_BASE_URL}${endpoint}?${queryParams.toString()}`;
    
    https.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(data);
          if (parsedData.status === 'error') {
            reject(new Error(parsedData.message || 'News API error'));
          } else {
            resolve(parsedData);
          }
        } catch (error) {
          reject(error);
        }
      });
    }).on('error', (error) => {
      reject(error);
    });
  });
}

// News categories
export const newsCategories = [
  "technology",
  "business",
  "entertainment",
  "health",
  "sports",
  "science",
  "politics",
  "world"
];

// News sources mapping (to display logos)
export const sourceLogoMapping = {
  "techcrunch": { name: "TechCrunch", logoUrl: "https://techcrunch.com/wp-content/uploads/2015/02/cropped-cropped-favicon-gradient.png" },
  "bbc-news": { name: "BBC News", logoUrl: "https://www.bbc.co.uk/favicon.ico" },
  "cnn": { name: "CNN", logoUrl: "https://www.cnn.com/favicon.ico" },
  "reuters": { name: "Reuters", logoUrl: "https://www.reuters.com/favicon.ico" },
  "bloomberg": { name: "Bloomberg", logoUrl: "https://www.bloomberg.com/favicon.ico" },
  "the-verge": { name: "The Verge", logoUrl: "https://www.theverge.com/favicon.ico" },
  "wired": { name: "Wired", logoUrl: "https://www.wired.com/favicon.ico" },
  "ars-technica": { name: "Ars Technica", logoUrl: "https://arstechnica.com/favicon.ico" }
};

// Real sources for API requests (from NewsAPI.org)
export const newsSources = [
  { id: "techcrunch", name: "TechCrunch", logoUrl: "https://techcrunch.com/wp-content/uploads/2015/02/cropped-cropped-favicon-gradient.png" },
  { id: "bbc-news", name: "BBC News", logoUrl: "https://www.bbc.co.uk/favicon.ico" },
  { id: "cnn", name: "CNN", logoUrl: "https://www.cnn.com/favicon.ico" },
  { id: "reuters", name: "Reuters", logoUrl: "https://www.reuters.com/favicon.ico" },
  { id: "bloomberg", name: "Bloomberg", logoUrl: "https://www.bloomberg.com/favicon.ico" }
];

// NewsAPI.org response interfaces
interface NewsAPISource {
  id: string | null;
  name: string;
}

interface NewsAPIArticle {
  source: NewsAPISource;
  author: string | null;
  title: string;
  description: string;
  url: string;
  urlToImage: string | null;
  publishedAt: string;
  content: string | null;
}

interface NewsAPIResponse {
  status: string;
  totalResults: number;
  articles: NewsAPIArticle[];
  code?: string;
  message?: string;
}

// Our application's news item structure
export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  content: string;
  sourceId: string;
  sourceName: string;
  sourceLogoUrl?: string;
  author?: string;
  publishedAt: Date;
  url: string;
  imageUrl?: string;
  category: string;
  tags: string[];
}

// Authentication middleware
const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated() || req.user) {
    return next();
  }
  return res.status(401).json({ message: "Unauthorized" });
};

// Helper function to convert NewsAPI articles to our app format
function convertToNewsItem(article: NewsAPIArticle, category: string): NewsItem {
  // Create a unique ID based on the article URL
  const id = Buffer.from(article.url).toString('base64').replace(/[+/=]/g, '').substring(0, 24);
  
  // Find source logo if available
  const sourceId = article.source.id || article.source.name.toLowerCase().replace(/\s+/g, '-');
  let sourceLogoUrl = undefined;
  
  // Try to find a logo for this source in our mapping
  const normalizedSourceId = sourceId.toLowerCase();
  for (const [mappedId, sourceInfo] of Object.entries(sourceLogoMapping)) {
    if (normalizedSourceId.includes(mappedId) || mappedId.includes(normalizedSourceId)) {
      sourceLogoUrl = sourceInfo.logoUrl;
      break;
    }
  }
  
  return {
    id,
    title: article.title || 'Untitled',
    summary: article.description || 'No description available',
    content: article.content || 'No content available',
    sourceId,
    sourceName: article.source.name,
    sourceLogoUrl,
    author: article.author || undefined,
    publishedAt: new Date(article.publishedAt),
    url: article.url,
    imageUrl: article.urlToImage || undefined,
    category,
    tags: [category, 'news']
  };
}

/**
 * Get trending news from all categories
 */
export async function getTrendingNews(req: Request, res: Response) {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = parseInt(req.query.offset as string) || 0;
    const page = Math.floor(offset / limit) + 1; // NewsAPI uses 1-indexed pages
    
    // Fetch top headlines using the News API
    const response = await fetchNewsApi('/top-headlines', {
      country: 'us', // Using US as default
      pageSize: limit,
      page
    });
    
    if (!response || !response.articles) {
      console.error('Invalid response from NewsAPI:', response);
      return res.status(500).json({ message: "Failed to fetch news from external API" });
    }
    
    // Convert API response to our format
    const newsItems: NewsItem[] = response.articles.map(article => {
      // For top headlines, we need to infer the category
      const inferredCategory = inferCategoryFromArticle(article);
      return convertToNewsItem(article, inferredCategory);
    });
    
    return res.json({
      items: newsItems,
      total: response.totalResults || newsItems.length,
      hasMore: (offset + limit) < response.totalResults
    });
  } catch (error: any) {
    console.error("Error fetching trending news:", error);
    return res.status(500).json({ 
      message: "Failed to fetch trending news", 
      details: error.message 
    });
  }
}

/**
 * Helper function to infer article category from its content
 */
function inferCategoryFromArticle(article: NewsAPIArticle): string {
  // Some basic keyword matching to determine category
  const text = `${article.title} ${article.description || ''} ${article.content || ''}`.toLowerCase();
  
  // Check for category keywords
  if (text.match(/tech|software|digital|ai|robot|cyber|computer|internet|app|smartphone/g)) {
    return 'technology';
  } 
  if (text.match(/business|company|market|stock|economy|economic|finance|investor|profit|startup/g)) {
    return 'business';
  }
  if (text.match(/entertainment|movie|film|celebrity|music|actor|actress|hollywood|tv show|streaming/g)) {
    return 'entertainment';
  }
  if (text.match(/health|medical|doctor|patient|disease|virus|vaccine|hospital|medicine|therapy|covid/g)) {
    return 'health';
  }
  if (text.match(/sport|match|team|player|tournament|championship|league|game|coach|athlete/g)) {
    return 'sports';
  }
  if (text.match(/science|research|scientist|study|discovery|space|nasa|experiment|physics|biology/g)) {
    return 'science';
  }
  if (text.match(/politic|president|government|election|vote|congress|senate|minister|party|democracy|republican|democrat/g)) {
    return 'politics';
  }
  if (text.match(/world|international|global|foreign|nation|country|war|peace|diplomatic|summit/g)) {
    return 'world';
  }
  
  // Default to general category
  return 'general';
}

/**
 * Get news by category
 */
export async function getNewsByCategory(req: Request, res: Response) {
  try {
    const { category } = req.params;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = parseInt(req.query.offset as string) || 0;
    const page = Math.floor(offset / limit) + 1; // NewsAPI uses 1-indexed pages
    
    if (!newsCategories.includes(category)) {
      return res.status(400).json({ message: "Invalid category" });
    }
    
    // Map our category to NewsAPI's categories if needed
    let apiCategory = category;
    if (category === 'politics') {
      apiCategory = 'general'; // NewsAPI doesn't have a politics category, use general
    }
    
    // Fetch articles from News API
    const response = await fetchNewsApi('/top-headlines', {
      country: 'us',
      category: apiCategory,
      pageSize: limit,
      page
    });
    
    if (!response || !response.articles) {
      console.error('Invalid response from NewsAPI:', response);
      return res.status(500).json({ message: "Failed to fetch news from external API" });
    }
    
    // Convert API response to our format
    const newsItems: NewsItem[] = response.articles.map(article => {
      return convertToNewsItem(article, category);
    });
    
    return res.json({
      items: newsItems,
      total: response.totalResults || newsItems.length,
      hasMore: (offset + limit) < response.totalResults
    });
  } catch (error: any) {
    console.error(`Error fetching ${req.params.category} news:`, error);
    return res.status(500).json({ 
      message: `Failed to fetch ${req.params.category} news`,
      details: error.message
    });
  }
}

/**
 * Get news sources
 */
export function getNewsSources(req: Request, res: Response) {
  try {
    return res.json(newsSources);
  } catch (error) {
    console.error("Error fetching news sources:", error);
    return res.status(500).json({ message: "Failed to fetch news sources" });
  }
}

/**
 * Get news categories
 */
export function getNewsCategories(req: Request, res: Response) {
  try {
    return res.json(newsCategories);
  } catch (error) {
    console.error("Error fetching news categories:", error);
    return res.status(500).json({ message: "Failed to fetch news categories" });
  }
}

/**
 * Get saved news items for the current user
 */
export async function getSavedNews(req: Request, res: Response) {
  try {
    // Make sure there's a user with an id
    const userId = (req.user as any)?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // In a real implementation, we would fetch the saved news items from a database
    // For now, we'll just return some demo items
    return res.json({
      items: [],
      total: 0,
      hasMore: false
    });
  } catch (error) {
    console.error("Error fetching saved news:", error);
    return res.status(500).json({ message: "Failed to fetch saved news" });
  }
}

/**
 * Save a news item for the current user
 */
export async function saveNewsItem(req: Request, res: Response) {
  try {
    // Make sure there's a user with an id
    const userId = (req.user as any)?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { newsId } = req.params;
    
    // In a real implementation, we would save the news item to a database
    // For now, we'll just return a success message
    return res.json({ message: "News item saved successfully" });
  } catch (error) {
    console.error("Error saving news item:", error);
    return res.status(500).json({ message: "Failed to save news item" });
  }
}

/**
 * Remove a saved news item for the current user
 */
export async function removeSavedNewsItem(req: Request, res: Response) {
  try {
    // Make sure there's a user with an id
    const userId = (req.user as any)?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { newsId } = req.params;
    
    // In a real implementation, we would remove the news item from the database
    // For now, we'll just return a success message
    return res.json({ message: "News item removed successfully" });
  } catch (error) {
    console.error("Error removing saved news item:", error);
    return res.status(500).json({ message: "Failed to remove saved news item" });
  }
}

/**
 * Share a news item as a post
 */
export async function shareNewsAsPost(req: Request, res: Response) {
  try {
    // Make sure there's a user with an id
    const userId = (req.user as any)?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { title, url, summary, imageUrl, sourceId, sourceName } = req.body;
    
    if (!title || !url || !sourceId) {
      return res.status(400).json({ message: "Missing required fields" });
    }
    
    // Create a new post with the news item
    // const post = await db.insert(posts).values({
    //   userId,
    //   title,
    //   content: summary || "",
    //   imageUrl: imageUrl || "",
    //   contentType: "news",
    //   metadata: {
    //     newsSourceId: sourceId,
    //     newsSourceName: sourceName,
    //     newsUrl: url
    //   },
    //   createdAt: new Date(),
    //   updatedAt: new Date()
    // }).returning();
    
    // Return success and the created post
    return res.status(201).json({ 
      message: "News shared successfully", 
      // post: post[0] 
    });
  } catch (error) {
    console.error("Error sharing news:", error);
    return res.status(500).json({ message: "Failed to share news" });
  }
}

/**
 * Register the news feed API routes
 */
export function registerNewsFeedRoutes(app: any) {
  // Public routes (no authentication required)
  app.get('/api/news/trending', getTrendingNews);
  app.get('/api/news/categories', getNewsCategories);
  app.get('/api/news/sources', getNewsSources);
  app.get('/api/news/category/:category', getNewsByCategory);
  
  // Protected routes (authentication required)
  app.get('/api/news/saved', isAuthenticated, getSavedNews);
  app.post('/api/news/:newsId/save', isAuthenticated, saveNewsItem);
  app.delete('/api/news/:newsId/save', isAuthenticated, removeSavedNewsItem);
  app.post('/api/news/share', isAuthenticated, shareNewsAsPost);
}