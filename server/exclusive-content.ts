import { Request, Response } from "express";
import { storage } from "./storage";

/**
 * Get exclusive content for a community
 */
export async function getExclusiveContent(req: Request, res: Response) {
  try {
    const communityId = parseInt(req.params.communityId);
    
    if (isNaN(communityId)) {
      return res.status(400).json({ message: "Invalid community ID" });
    }
    
    // Check if user is authenticated
    const userId = req.isAuthenticated() ? (req.user as any).id : null;
    
    // Get the community
    const community = await storage.getCommunity(communityId);
    if (!community) {
      return res.status(404).json({ message: "Community not found" });
    }
    
    // Get user's membership (if any)
    let userMembership = null;
    if (userId) {
      userMembership = await storage.getUserMembership(userId, communityId);
    }
    
    // Get content based on user's membership
    const content = await storage.getCommunityContent(communityId);
    
    // If the user has no membership, only return previews of content
    // If user has membership, return content for their tier and below
    const processedContent = content.map(item => {
      // Determine if the user can access this content based on their membership
      const canAccess = userMembership && 
                       (userMembership.tierId >= item.tierId || 
                        userMembership.isAdmin);
      
      // Return either full content or preview based on access
      return {
        ...item,
        // For protected content, only provide a preview unless the user has access
        content: canAccess ? item.content : null,
        videoUrl: canAccess ? item.videoUrl : null,
        audioUrl: canAccess ? item.audioUrl : null,
        // Always include basic info for preview purposes
        id: item.id,
        title: item.title,
        description: item.description,
        contentType: item.contentType,
        thumbnailUrl: item.thumbnailUrl,
        tierId: item.tierId,
        tierName: item.tierName,
        createdAt: item.createdAt,
        creatorId: item.creatorId,
        creatorName: item.creatorName,
        creatorAvatar: item.creatorAvatar,
      };
    });
    
    // Organize content into sections
    const result = {
      featured: processedContent.filter(item => item.isFeatured).slice(0, 6),
      recentContent: processedContent.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ).slice(0, 12),
      byContentType: {
        video: processedContent.filter(item => item.contentType === 'video'),
        article: processedContent.filter(item => item.contentType === 'article'),
        image: processedContent.filter(item => item.contentType === 'image'),
        audio: processedContent.filter(item => item.contentType === 'audio')
      }
    };
    
    res.json(result);
  } catch (error) {
    console.error("[ERROR] Failed to get exclusive content:", error);
    res.status(500).json({ message: "Failed to get exclusive content" });
  }
}

/**
 * Get a specific exclusive content item
 */
export async function getContentItem(req: Request, res: Response) {
  try {
    const communityId = parseInt(req.params.communityId);
    const contentId = parseInt(req.params.contentId);
    
    if (isNaN(communityId) || isNaN(contentId)) {
      return res.status(400).json({ message: "Invalid parameters" });
    }
    
    // Check if user is authenticated
    const userId = req.isAuthenticated() ? (req.user as any).id : null;
    if (!userId) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    // Get the content
    const contentItem = await storage.getCommunityContentItem(contentId);
    if (!contentItem) {
      return res.status(404).json({ message: "Content not found" });
    }
    
    // Verify the content belongs to the specified community
    if (contentItem.communityId !== communityId) {
      return res.status(404).json({ message: "Content not found in this community" });
    }
    
    // Check user's membership
    const userMembership = await storage.getUserMembership(userId, communityId);
    
    // Determine if the user can access this content
    const canAccess = userMembership && 
                     (userMembership.tierId >= contentItem.tierId || 
                      userMembership.isAdmin);
    
    if (!canAccess) {
      return res.status(403).json({ 
        message: "Upgrade your membership to access this content",
        requiredTierId: contentItem.tierId
      });
    }
    
    // Return the full content
    res.json(contentItem);
  } catch (error) {
    console.error("[ERROR] Failed to get content item:", error);
    res.status(500).json({ message: "Failed to get content item" });
  }
}

/**
 * Create a new exclusive content item
 */
export async function createExclusiveContent(req: Request, res: Response) {
  try {
    const communityId = parseInt(req.params.communityId);
    
    if (isNaN(communityId)) {
      return res.status(400).json({ message: "Invalid community ID" });
    }
    
    // Check if user is authenticated
    const userId = req.isAuthenticated() ? (req.user as any).id : null;
    if (!userId) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    // Verify user is an admin or moderator of the community
    const userMembership = await storage.getUserMembership(userId, communityId);
    if (!userMembership || (!userMembership.isAdmin && !userMembership.isModerator)) {
      return res.status(403).json({ message: "Unauthorized to create content" });
    }
    
    // Create the content
    const contentData = {
      ...req.body,
      communityId,
      creatorId: userId,
    };
    
    const content = await storage.createCommunityContent(contentData);
    res.status(201).json(content);
  } catch (error) {
    console.error("[ERROR] Failed to create exclusive content:", error);
    res.status(500).json({ message: "Failed to create exclusive content" });
  }
}

/**
 * Update an exclusive content item
 */
export async function updateExclusiveContent(req: Request, res: Response) {
  try {
    const communityId = parseInt(req.params.communityId);
    const contentId = parseInt(req.params.contentId);
    
    if (isNaN(communityId) || isNaN(contentId)) {
      return res.status(400).json({ message: "Invalid parameters" });
    }
    
    // Check if user is authenticated
    const userId = req.isAuthenticated() ? (req.user as any).id : null;
    if (!userId) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    // Get the content item
    const contentItem = await storage.getCommunityContentItem(contentId);
    if (!contentItem) {
      return res.status(404).json({ message: "Content not found" });
    }
    
    // Verify the content belongs to the specified community
    if (contentItem.communityId !== communityId) {
      return res.status(404).json({ message: "Content not found in this community" });
    }
    
    // Verify user is an admin, moderator, or the creator
    const userMembership = await storage.getUserMembership(userId, communityId);
    const isCreator = contentItem.creatorId === userId;
    
    if (!userMembership || 
        (!userMembership.isAdmin && !userMembership.isModerator && !isCreator)) {
      return res.status(403).json({ message: "Unauthorized to update content" });
    }
    
    // Update the content
    const updatedContent = await storage.updateCommunityContent(contentId, req.body);
    res.json(updatedContent);
  } catch (error) {
    console.error("[ERROR] Failed to update exclusive content:", error);
    res.status(500).json({ message: "Failed to update exclusive content" });
  }
}

/**
 * Delete an exclusive content item
 */
export async function deleteExclusiveContent(req: Request, res: Response) {
  try {
    const communityId = parseInt(req.params.communityId);
    const contentId = parseInt(req.params.contentId);
    
    if (isNaN(communityId) || isNaN(contentId)) {
      return res.status(400).json({ message: "Invalid parameters" });
    }
    
    // Check if user is authenticated
    const userId = req.isAuthenticated() ? (req.user as any).id : null;
    if (!userId) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    // Get the content item
    const contentItem = await storage.getCommunityContentItem(contentId);
    if (!contentItem) {
      return res.status(404).json({ message: "Content not found" });
    }
    
    // Verify the content belongs to the specified community
    if (contentItem.communityId !== communityId) {
      return res.status(404).json({ message: "Content not found in this community" });
    }
    
    // Verify user is an admin, moderator, or the creator
    const userMembership = await storage.getUserMembership(userId, communityId);
    const isCreator = contentItem.creatorId === userId;
    
    if (!userMembership || 
        (!userMembership.isAdmin && !userMembership.isModerator && !isCreator)) {
      return res.status(403).json({ message: "Unauthorized to delete content" });
    }
    
    // Delete the content
    await storage.deleteCommunityContent(contentId);
    res.status(204).send();
  } catch (error) {
    console.error("[ERROR] Failed to delete exclusive content:", error);
    res.status(500).json({ message: "Failed to delete exclusive content" });
  }
}

/**
 * Register exclusive content routes
 */
export function registerExclusiveContentRoutes(app: any) {
  // Get all exclusive content for a community
  app.get("/api/communities/:communityId/exclusive-content", getExclusiveContent);
  
  // Get a specific content item
  app.get("/api/communities/:communityId/exclusive-content/:contentId", getContentItem);
  
  // Create a new content item
  app.post("/api/communities/:communityId/exclusive-content", createExclusiveContent);
  
  // Update a content item
  app.patch("/api/communities/:communityId/exclusive-content/:contentId", updateExclusiveContent);
  
  // Delete a content item
  app.delete("/api/communities/:communityId/exclusive-content/:contentId", deleteExclusiveContent);
}