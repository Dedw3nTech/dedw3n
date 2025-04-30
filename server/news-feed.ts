/**
 * News Feed API Integration
 * 
 * This file implements the backend API for fetching and integrating news content
 * from various sources into the social media platform.
 */
import { Request, Response, NextFunction } from "express";
import { db } from "./db";
import { posts, users } from "@shared/schema";
import { and, eq, like, desc, sql } from "drizzle-orm";

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

// Sample news sources
export const newsSources = [
  { id: "dedwen-news", name: "Dedwen News", logoUrl: "/assets/news/dedwen-news.png" },
  { id: "techcrunch", name: "TechCrunch", logoUrl: "/assets/news/techcrunch.png" },
  { id: "bbc", name: "BBC", logoUrl: "/assets/news/bbc.png" },
  { id: "cnn", name: "CNN", logoUrl: "/assets/news/cnn.png" },
  { id: "reuters", name: "Reuters", logoUrl: "/assets/news/reuters.png" }
];

// Structure for news items
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

/**
 * Get trending news from all categories
 */
export async function getTrendingNews(req: Request, res: Response) {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = parseInt(req.query.offset as string) || 0;
    
    // For now, we'll create and return some demo news items
    // In a real implementation, this would fetch from external news APIs
    const newsItems: NewsItem[] = [];
    
    // Generate news items for the requested page
    for (let i = 0; i < limit; i++) {
      const idx = offset + i;
      if (idx >= 50) break; // Max 50 dummy items
      
      const categoryIndex = idx % newsCategories.length;
      const sourceIndex = (idx % newsSources.length);
      const source = newsSources[sourceIndex];
      
      const daysAgo = idx % 7;
      const pubDate = new Date();
      pubDate.setDate(pubDate.getDate() - daysAgo);
      
      newsItems.push({
        id: `news-${idx + 1}`,
        title: `Latest developments in ${newsCategories[categoryIndex].charAt(0).toUpperCase() + newsCategories[categoryIndex].slice(1)}`,
        summary: `This is a summary of the latest news in ${newsCategories[categoryIndex]}.`,
        content: `This is the full content of the news article about ${newsCategories[categoryIndex]}.`,
        sourceId: source.id,
        sourceName: source.name,
        sourceLogoUrl: source.logoUrl,
        author: `Reporter ${idx + 1}`,
        publishedAt: pubDate,
        url: `https://example.com/news/${idx + 1}`,
        imageUrl: `/assets/news/image-${(idx % 8) + 1}.jpg`,
        category: newsCategories[categoryIndex],
        tags: [newsCategories[categoryIndex], "trending", "news"]
      });
    }
    
    return res.json({
      items: newsItems,
      total: 50, // Total number of fake news items
      hasMore: (offset + limit) < 50
    });
  } catch (error) {
    console.error("Error fetching trending news:", error);
    return res.status(500).json({ message: "Failed to fetch trending news" });
  }
}

/**
 * Get news by category
 */
export async function getNewsByCategory(req: Request, res: Response) {
  try {
    const { category } = req.params;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = parseInt(req.query.offset as string) || 0;
    
    if (!newsCategories.includes(category)) {
      return res.status(400).json({ message: "Invalid category" });
    }
    
    // For now, we'll create and return some demo news items for the specified category
    const newsItems: NewsItem[] = [];
    
    // Generate news items for the requested category and page
    for (let i = 0; i < limit; i++) {
      const idx = offset + i;
      if (idx >= 20) break; // Max 20 dummy items per category
      
      const sourceIndex = (idx % newsSources.length);
      const source = newsSources[sourceIndex];
      
      const daysAgo = idx % 5;
      const pubDate = new Date();
      pubDate.setDate(pubDate.getDate() - daysAgo);
      
      newsItems.push({
        id: `${category}-${idx + 1}`,
        title: `${category.charAt(0).toUpperCase() + category.slice(1)} news headline ${idx + 1}`,
        summary: `This is a summary of the news article about ${category}.`,
        content: `This is the full content of the news article about ${category}.`,
        sourceId: source.id,
        sourceName: source.name,
        sourceLogoUrl: source.logoUrl,
        author: `${category.charAt(0).toUpperCase() + category.slice(1)} Reporter ${idx + 1}`,
        publishedAt: pubDate,
        url: `https://example.com/news/${category}/${idx + 1}`,
        imageUrl: `/assets/news/${category}-${(idx % 5) + 1}.jpg`,
        category: category,
        tags: [category, "news"]
      });
    }
    
    return res.json({
      items: newsItems,
      total: 20, // Total number of fake news items per category
      hasMore: (offset + limit) < 20
    });
  } catch (error) {
    console.error(`Error fetching ${req.params.category} news:`, error);
    return res.status(500).json({ message: `Failed to fetch ${req.params.category} news` });
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
    if (!req.user) {
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
    if (!req.user) {
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
    if (!req.user) {
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
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { title, url, summary, imageUrl, sourceId, sourceName } = req.body;
    const userId = req.user.id;
    
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