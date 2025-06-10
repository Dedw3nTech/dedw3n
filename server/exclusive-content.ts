import { Express, Request, Response, NextFunction } from "express";
import { storage } from "./storage";
import { z } from "zod";
import { contentTypeEnum, insertCommunityContentSchema } from "@shared/schema";

// Middleware to check if user is authenticated
const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated()) {
    return next();
  }
  return res.status(401).json({ message: "Not authenticated" });
};

// Middleware to check if user is a member of a community with the required tier
const hasContentAccess = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  const userId = (req.user as any).id;
  const contentId = parseInt(req.params.contentId);

  try {
    // Get the content details to check which tier it belongs to
    const content = await storage.getCommunityContent(contentId);
    
    if (!content) {
      return res.status(404).json({ message: "Content not found" });
    }

    // Check if user has access to this content
    const hasAccess = await storage.canUserAccessContent(userId, contentId);
    
    if (!hasAccess) {
      return res.status(403).json({ 
        message: "You need to upgrade your membership to access this content",
        requiredTierId: content.tierId
      });
    }

    // User has access, continue
    next();
  } catch (error) {
    console.error("Error checking content access:", error);
    return res.status(500).json({ message: "Failed to check content access" });
  }
};

export function registerExclusiveContentRoutes(app: Express) {
  // Get all community content (with limited info)
  app.get("/api/communities/:communityId/content", async (req, res) => {
    try {
      const communityId = parseInt(req.params.communityId);
      
      // Get all content items for this community
      const content = await storage.listCommunityContent(communityId);
      
      // Map to include tier info
      const contentWithTiers = await Promise.all(content.map(async (item) => {
        // Get the membership tier details
        const tier = await storage.getMembershipTier(item.tierId);
        return {
          ...item,
          tierName: tier?.name || `Tier ${item.tierId}`,
          // Include creator info
          creatorName: item.creatorName || (await storage.getUser(item.userId))?.name || "Unknown",
          creatorAvatar: item.creatorAvatar || (await storage.getUser(item.userId))?.avatar || null,
        };
      }));
      
      res.json(contentWithTiers);
    } catch (error) {
      console.error("Error fetching community content:", error);
      res.status(500).json({ message: "Failed to get community content" });
    }
  });

  // Get all accessible content for the authenticated user
  app.get("/api/communities/:communityId/accessible-content", isAuthenticated, async (req, res) => {
    try {
      const communityId = parseInt(req.params.communityId);
      const userId = (req.user as any).id;
      
      // Get all content that this user can access
      const content = await storage.getAccessibleCommunityContent(userId, communityId);
      
      // Map to include tier info
      const contentWithTiers = await Promise.all(content.map(async (item) => {
        // Get the membership tier details
        const tier = await storage.getMembershipTier(item.tierId);
        return {
          ...item,
          tierName: tier?.name || `Tier ${item.tierId}`,
          // Include creator info
          creatorName: item.creatorName || (await storage.getUser(item.userId))?.name || "Unknown",
          creatorAvatar: item.creatorAvatar || (await storage.getUser(item.userId))?.avatar || null,
        };
      }));
      
      res.json(contentWithTiers);
    } catch (error) {
      console.error("Error fetching accessible content:", error);
      res.status(500).json({ message: "Failed to get accessible content" });
    }
  });

  // Get a specific content item
  app.get("/api/community-content/:contentId", async (req, res) => {
    try {
      const contentId = parseInt(req.params.contentId);
      
      // Get the content details
      const content = await storage.getCommunityContent(contentId);
      
      if (!content) {
        return res.status(404).json({ message: "Content not found" });
      }

      // If user is not authenticated, return limited info
      if (!req.isAuthenticated()) {
        // Get the membership tier details
        const tier = await storage.getMembershipTier(content.tierId);
        
        return res.status(403).json({ 
          id: content.id,
          title: content.title,
          description: content.description,
          contentType: content.contentType,
          thumbnailUrl: content.thumbnailUrl,
          tierId: content.tierId,
          tierName: tier?.name || `Tier ${content.tierId}`,
          createdAt: content.createdAt,
          creatorId: content.userId,
          creatorName: (await storage.getUser(content.userId))?.name || "Unknown",
          creatorAvatar: (await storage.getUser(content.userId))?.avatar || null,
          requiredTierId: content.tierId,
          message: "Authentication required to access this content"
        });
      }

      // Check if the authenticated user has access
      const userId = (req.user as any).id;
      const hasAccess = await storage.canUserAccessContent(userId, contentId);
      
      // Get the membership tier details
      const tier = await storage.getMembershipTier(content.tierId);
      const creatorInfo = await storage.getUser(content.userId);
      
      if (!hasAccess) {
        // Return limited info with error message
        return res.status(403).json({ 
          id: content.id,
          title: content.title,
          description: content.description,
          contentType: content.contentType,
          thumbnailUrl: content.thumbnailUrl,
          tierId: content.tierId,
          tierName: tier?.name || `Tier ${content.tierId}`,
          createdAt: content.createdAt,
          creatorId: content.userId,
          creatorName: creatorInfo?.name || "Unknown",
          creatorAvatar: creatorInfo?.avatar || null,
          requiredTierId: content.tierId,
          message: "You need to upgrade your membership to access this content"
        });
      }

      // Increment view count
      await storage.incrementContentViewCount(contentId);
      
      // Return full content
      res.json({
        ...content,
        tierName: tier?.name || `Tier ${content.tierId}`,
        creatorName: creatorInfo?.name || "Unknown",
        creatorAvatar: creatorInfo?.avatar || null
      });
    } catch (error) {
      console.error("Error fetching content:", error);
      res.status(500).json({ message: "Failed to get content" });
    }
  });

  // Create new community content (only for community owners/admins)
  app.post("/api/communities/:communityId/content", isAuthenticated, async (req, res) => {
    try {
      const communityId = parseInt(req.params.communityId);
      const userId = (req.user as any).id;
      
      // Check if user is admin or owner of the community
      const isAdminOrOwner = await storage.isUserCommunityAdminOrOwner(userId, communityId);
      
      if (!isAdminOrOwner) {
        return res.status(403).json({ message: "Only community administrators can add content" });
      }

      // Validate data
      const contentData = insertCommunityContentSchema.parse({
        ...req.body,
        userId,
        communityId
      });
      
      // Create new content
      const newContent = await storage.createCommunityContent(contentData);
      
      res.status(201).json(newContent);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      console.error("Error creating content:", error);
      res.status(500).json({ message: "Failed to create content" });
    }
  });

  // Update community content (only for content creator or admins)
  app.patch("/api/community-content/:contentId", isAuthenticated, async (req, res) => {
    try {
      const contentId = parseInt(req.params.contentId);
      const userId = (req.user as any).id;
      
      // Get the content
      const content = await storage.getCommunityContent(contentId);
      
      if (!content) {
        return res.status(404).json({ message: "Content not found" });
      }
      
      // Check if user is the creator or an admin
      const isCreator = content.userId === userId;
      const isAdmin = await storage.isUserCommunityAdminOrOwner(userId, content.communityId);
      
      if (!isCreator && !isAdmin) {
        return res.status(403).json({ message: "You don't have permission to update this content" });
      }

      // Update content
      const updatedContent = await storage.updateCommunityContent(contentId, req.body);
      
      res.json(updatedContent);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      console.error("Error updating content:", error);
      res.status(500).json({ message: "Failed to update content" });
    }
  });

  // Delete community content (only for content creator or admins)
  app.delete("/api/community-content/:contentId", isAuthenticated, async (req, res) => {
    try {
      const contentId = parseInt(req.params.contentId);
      const userId = (req.user as any).id;
      
      // Get the content
      const content = await storage.getCommunityContent(contentId);
      
      if (!content) {
        return res.status(404).json({ message: "Content not found" });
      }
      
      // Check if user is the creator or an admin
      const isCreator = content.userId === userId;
      const isAdmin = await storage.isUserCommunityAdminOrOwner(userId, content.communityId);
      
      if (!isCreator && !isAdmin) {
        return res.status(403).json({ message: "You don't have permission to delete this content" });
      }

      // Delete content
      await storage.deleteCommunityContent(contentId);
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting content:", error);
      res.status(500).json({ message: "Failed to delete content" });
    }
  });

  // Like a content item
  app.post("/api/community-content/:contentId/like", isAuthenticated, async (req, res) => {
    try {
      const contentId = parseInt(req.params.contentId);
      const userId = (req.user as any).id;
      
      // Check if content exists and user has access
      const content = await storage.getCommunityContent(contentId);
      
      if (!content) {
        return res.status(404).json({ message: "Content not found" });
      }
      
      const hasAccess = await storage.canUserAccessContent(userId, contentId);
      
      if (!hasAccess) {
        return res.status(403).json({ message: "You need to upgrade your membership to interact with this content" });
      }

      // Like the content
      await storage.likeContent(contentId, userId);
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error liking content:", error);
      res.status(500).json({ message: "Failed to like content" });
    }
  });

  // Unlike a content item
  app.delete("/api/community-content/:contentId/like", isAuthenticated, async (req, res) => {
    try {
      const contentId = parseInt(req.params.contentId);
      const userId = (req.user as any).id;
      
      // Unlike the content
      await storage.unlikeContent(contentId, userId);
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error unliking content:", error);
      res.status(500).json({ message: "Failed to unlike content" });
    }
  });

  // Get content by tier
  app.get("/api/communities/:communityId/content/by-tier/:tierId", async (req, res) => {
    try {
      const communityId = parseInt(req.params.communityId);
      const tierId = parseInt(req.params.tierId);
      
      // Get content by tier
      const content = await storage.getCommunityContentByTier(communityId, tierId);
      
      // Map to include tier info
      const contentWithTiers = await Promise.all(content.map(async (item) => {
        // Get the membership tier details
        const tier = await storage.getMembershipTier(item.tierId);
        return {
          ...item,
          tierName: tier?.name || `Tier ${item.tierId}`,
          // Include creator info
          creatorName: item.creatorName || (await storage.getUser(item.userId))?.name || "Unknown",
          creatorAvatar: item.creatorAvatar || (await storage.getUser(item.userId))?.avatar || null,
        };
      }));
      
      res.json(contentWithTiers);
    } catch (error) {
      console.error("Error fetching content by tier:", error);
      res.status(500).json({ message: "Failed to get content by tier" });
    }
  });

  // Get content by type
  app.get("/api/communities/:communityId/content/by-type/:contentType", async (req, res) => {
    try {
      const communityId = parseInt(req.params.communityId);
      const contentType = req.params.contentType as z.infer<typeof contentTypeEnum>;
      
      if (!Object.values(contentTypeEnum.enum).includes(contentType)) {
        return res.status(400).json({ message: "Invalid content type" });
      }
      
      // Get content by type
      const content = await storage.getCommunityContentByType(communityId, contentType);
      
      // Map to include tier info
      const contentWithTiers = await Promise.all(content.map(async (item) => {
        // Get the membership tier details
        const tier = await storage.getMembershipTier(item.tierId);
        return {
          ...item,
          tierName: tier?.name || `Tier ${item.tierId}`,
          // Include creator info
          creatorName: item.creatorName || (await storage.getUser(item.userId))?.name || "Unknown",
          creatorAvatar: item.creatorAvatar || (await storage.getUser(item.userId))?.avatar || null,
        };
      }));
      
      res.json(contentWithTiers);
    } catch (error) {
      console.error("Error fetching content by type:", error);
      res.status(500).json({ message: "Failed to get content by type" });
    }
  });

  // Get featured content
  app.get("/api/communities/:communityId/content/featured", async (req, res) => {
    try {
      const communityId = parseInt(req.params.communityId);
      
      // Get featured content
      const content = await storage.getFeaturedCommunityContent(communityId);
      
      // Map to include tier info
      const contentWithTiers = await Promise.all(content.map(async (item) => {
        // Get the membership tier details
        const tier = await storage.getMembershipTier(item.tierId);
        return {
          ...item,
          tierName: tier?.name || `Tier ${item.tierId}`,
          // Include creator info
          creatorName: item.creatorName || (await storage.getUser(item.userId))?.name || "Unknown",
          creatorAvatar: item.creatorAvatar || (await storage.getUser(item.userId))?.avatar || null,
        };
      }));
      
      res.json(contentWithTiers);
    } catch (error) {
      console.error("Error fetching featured content:", error);
      res.status(500).json({ message: "Failed to get featured content" });
    }
  });
}