import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from 'ws';
import fs from 'fs';
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { registerPaymentRoutes } from "./payment";
import { registerPaypalRoutes } from "./paypal";
import { registerShippingRoutes } from "./shipping";
import { registerMobileMoneyRoutes } from "./mobile-money";
import { seedDatabase } from "./seed";
import { 
  insertVendorSchema, insertProductSchema, insertPostSchema, insertCommentSchema, 
  insertMessageSchema, insertReviewSchema, insertCartSchema, insertWalletSchema, 
  insertTransactionSchema, insertCommunitySchema, insertCommunityMemberSchema,
  insertMembershipTierSchema, insertMembershipSchema, insertEventSchema,
  insertEventRegistrationSchema, insertPollSchema, insertPollVoteSchema,
  insertCreatorEarningSchema, insertSubscriptionSchema, insertVideoSchema,
  insertVideoEngagementSchema, insertVideoPlaylistSchema, insertPlaylistItemSchema
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication with passport
  setupAuth(app);

  // Create HTTP server from Express
  const httpServer = createServer(app);
  
  // Setup WebSocket server for real-time messaging
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  // Store active connections with user IDs
  const connections = new Map<number, WebSocket[]>();
  
  wss.on('connection', (ws) => {
    console.log('WebSocket client connected');
    let userId: number | null = null;
    
    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        // Handle authentication
        if (data.type === 'auth') {
          userId = data.userId;
          // Store connection by user ID
          if (!connections.has(userId)) {
            connections.set(userId, []);
          }
          connections.get(userId)?.push(ws);
          console.log(`User ${userId} authenticated on WebSocket`);
          
          // Send initial online status of connections
          const onlineUsers = Array.from(connections.keys());
          ws.send(JSON.stringify({
            type: 'online_users',
            users: onlineUsers
          }));
        }
        
        // Handle chat message
        else if (data.type === 'message') {
          console.log(`Received message: ${JSON.stringify(data)}`);
          
          // Store message in database
          if (userId && data.recipientId && data.content) {
            const messageData = {
              senderId: userId,
              receiverId: data.recipientId, // Changed to receiverId to match schema
              content: data.content,
              attachmentUrl: data.attachmentUrl || null,
              attachmentType: data.attachmentType || null
            };
            
            // Save to database
            const savedMessage = await storage.createMessage(messageData);
            
            // Forward message to recipient if online
            const receiverConnections = connections.get(data.recipientId);
            if (receiverConnections && receiverConnections.length > 0) {
              const outgoingMessage = JSON.stringify({
                type: 'new_message',
                message: savedMessage
              });
              
              receiverConnections.forEach(conn => {
                if (conn.readyState === WebSocket.OPEN) {
                  conn.send(outgoingMessage);
                }
              });
            }
            
            // Send confirmation back to sender
            ws.send(JSON.stringify({
              type: 'message_sent',
              messageId: savedMessage.id
            }));
          }
        }
        
        // Handle typing indicator
        else if (data.type === 'typing') {
          if (userId && data.recipientId) {
            const receiverConnections = connections.get(data.recipientId);
            if (receiverConnections && receiverConnections.length > 0) {
              const typingNotification = JSON.stringify({
                type: 'typing',
                senderId: userId,
                receiverId: data.recipientId,
                isTyping: data.isTyping
              });
              
              receiverConnections.forEach(conn => {
                if (conn.readyState === WebSocket.OPEN) {
                  conn.send(typingNotification);
                }
              });
            }
          }
        }
        
        // Handle read receipts
        else if (data.type === 'read_receipt') {
          if (userId && data.messageIds && Array.isArray(data.messageIds)) {
            // Update messages as read in database
            for (const messageId of data.messageIds) {
              await storage.markMessageAsRead(messageId);
            }
            
            // Notify sender that messages were read
            if (data.senderId) {
              const senderConnections = connections.get(data.senderId);
              if (senderConnections && senderConnections.length > 0) {
                const readReceipt = JSON.stringify({
                  type: 'read_receipt',
                  messageIds: data.messageIds,
                  readBy: userId
                });
                
                senderConnections.forEach(conn => {
                  if (conn.readyState === WebSocket.OPEN) {
                    conn.send(readReceipt);
                  }
                });
              }
            }
          }
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    });
    
    ws.on('close', () => {
      console.log('WebSocket client disconnected');
      if (userId) {
        // Remove this connection from user's connections
        const userConnections = connections.get(userId);
        if (userConnections) {
          const index = userConnections.indexOf(ws);
          if (index !== -1) {
            userConnections.splice(index, 1);
          }
          
          // If no more connections, remove user from connections map
          if (userConnections.length === 0) {
            connections.delete(userId);
            
            // Broadcast user offline status
            for (const userConnections of connections.values()) {
              userConnections.forEach(conn => {
                if (conn.readyState === WebSocket.OPEN) {
                  conn.send(JSON.stringify({
                    type: 'user_offline',
                    userId
                  }));
                }
              });
            }
          }
        }
      }
    });
  });

  // Seed the database with initial data
  await seedDatabase();

  // Backward compatibility for client-side code
  app.post("/api/register", (req, res) => res.redirect(307, "/api/auth/register"));
  app.post("/api/login", (req, res) => res.redirect(307, "/api/auth/login"));
  app.post("/api/logout", (req, res) => res.redirect(307, "/api/auth/logout"));
  app.get("/api/user", (req, res) => res.redirect(307, "/api/auth/me"));
  
  // User profile routes
  app.get("/api/users/:username", async (req, res) => {
    try {
      const username = req.params.username;
      console.log(`[DEBUG] Fetching profile for username: ${username}`);
      const user = await storage.getUserByUsername(username);
      
      console.log(`[DEBUG] User found:`, user ? 'Yes' : 'No');
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Remove password before sending
      const { password, ...userData } = user;
      console.log(`[DEBUG] Returning user data for username: ${username}`);
      res.json(userData);
    } catch (error) {
      console.error(`[ERROR] Failed to get profile for ${req.params.username}:`, error);
      res.status(500).json({ message: "Failed to get user profile" });
    }
  });
  
  // Get user's posts
  app.get("/api/users/:username/posts", async (req, res) => {
    try {
      const username = req.params.username;
      const user = await storage.getUserByUsername(username);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const posts = await storage.getUserPosts(user.id);
      res.json(posts);
    } catch (error) {
      res.status(500).json({ message: "Failed to get user posts" });
    }
  });
  
  // Get user's communities
  app.get("/api/users/:username/communities", async (req, res) => {
    try {
      const username = req.params.username;
      const user = await storage.getUserByUsername(username);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Get communities the user is a member of
      const communities = await storage.getUserCommunities(user.id);
      res.json(communities);
    } catch (error) {
      console.error("[ERROR] Failed to get user communities:", error);
      res.status(500).json({ message: "Failed to get user communities" });
    }
  });
  
  // Get user's vendor information
  app.get("/api/users/:username/vendor", async (req, res) => {
    try {
      const username = req.params.username;
      const user = await storage.getUserByUsername(username);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Check if user is a vendor
      if (!user.isVendor) {
        return res.status(404).json({ message: "User is not a vendor" });
      }
      
      // Get vendor info
      const vendorInfo = await storage.getVendorByUserId(user.id);
      
      if (!vendorInfo) {
        return res.status(404).json({ message: "Vendor information not found" });
      }
      
      res.json(vendorInfo);
    } catch (error) {
      console.error("[ERROR] Failed to get vendor info:", error);
      res.status(500).json({ message: "Failed to get vendor information" });
    }
  });

  // Auth middleware
  const isAuthenticated = (req: Request, res: Response, next: Function) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ message: "Unauthorized" });
  };

  // Register API Routes
  // All routes should be prefixed with /api
  // Authentication routes are handled by auth.ts
  
  // Register payment routes
  registerPaymentRoutes(app);
  
  // Register PayPal routes
  registerPaypalRoutes(app);
  
  // Register shipping routes
  registerShippingRoutes(app);
  
  // Register mobile money payment routes
  registerMobileMoneyRoutes(app);
  
  // Update user profile
  app.patch("/api/users/profile", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      console.log(`[DEBUG] Updating profile for user ID: ${userId}`);
      
      // Handle form data or JSON
      const updates = req.body;
      console.log(`[DEBUG] Update data:`, updates);
      
      const updatedUser = await storage.updateUser(userId, updates);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Remove password before sending
      const { password, ...userData } = updatedUser;
      console.log(`[DEBUG] Profile updated successfully for user ID: ${userId}`);
      res.json(userData);
    } catch (error) {
      console.error(`[ERROR] Failed to update profile:`, error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });
  
  // Message routes
  // Get user's conversations
  app.get("/api/messages/conversations", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const conversations = await storage.getUserConversations(userId);
      res.json(conversations);
    } catch (error) {
      res.status(500).json({ message: "Failed to get conversations" });
    }
  });
  
  // Get conversation messages between users
  app.get("/api/messages/conversation/:partnerId", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const partnerId = parseInt(req.params.partnerId);
      const messages = await storage.getConversationMessages(userId, partnerId);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: "Failed to get conversation messages" });
    }
  });
  
  // Room-based messaging will be implemented in a future update
  // For now, we're focusing on direct user-to-user messaging
  
  // Get unread message count
  app.get("/api/messages/unread/count", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const count = await storage.getUnreadMessageCount(userId);
      res.json({ count });
    } catch (error) {
      res.status(500).json({ message: "Failed to get unread message count" });
    }
  });
  
  // Mark messages as read
  app.post("/api/messages/mark-read", isAuthenticated, async (req, res) => {
    try {
      const { messageIds } = req.body;
      
      if (!messageIds || !Array.isArray(messageIds)) {
        return res.status(400).json({ message: "Invalid message IDs" });
      }
      
      for (const messageId of messageIds) {
        await storage.markMessageAsRead(messageId);
      }
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to mark messages as read" });
    }
  });
  
  // Group chat and room-based messaging will be implemented in a future update
  // For now, we're focusing on direct user-to-user messaging
  
  // Video-related routes
  
  // Create a new video
  app.post("/api/videos", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      
      const validatedData = insertVideoSchema.parse({
        ...req.body,
        userId,
      });
      
      const video = await storage.createVideo(validatedData);
      res.status(201).json(video);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Failed to create video" });
    }
  });
  
  // Get all videos with optional filtering
  app.get("/api/videos", async (req, res) => {
    try {
      const filter: Record<string, any> = {};
      
      // Parse query parameters for filtering
      if (req.query.userId) {
        filter.userId = parseInt(req.query.userId as string);
      }
      
      if (req.query.videoType) {
        filter.videoType = req.query.videoType;
      }
      
      if (req.query.isPublished) {
        filter.isPublished = req.query.isPublished === 'true';
      }
      
      if (req.query.tags) {
        filter.tags = (req.query.tags as string).split(',');
      }
      
      const videos = await storage.listVideos(filter);
      res.json(videos);
    } catch (error) {
      res.status(500).json({ message: "Failed to list videos" });
    }
  });
  
  // Get trending videos - MUST be before the video ID route to avoid conflict
  app.get("/api/videos/trending", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const videos = await storage.getTrendingVideos(limit);
      res.json(videos);
    } catch (error) {
      res.status(500).json({ message: "Failed to get trending videos" });
    }
  });
  
  // Get videos by type - MUST be before the video ID route to avoid conflict
  app.get("/api/videos/type/:type", async (req, res) => {
    try {
      const type = req.params.type;
      const videos = await storage.getVideosByType(type);
      res.json(videos);
    } catch (error) {
      res.status(500).json({ message: "Failed to get videos by type" });
    }
  });
  
  // Get a specific video by ID - This route MUST come after all other /api/videos/* routes
  app.get("/api/videos/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const video = await storage.getVideo(id);
      
      if (!video) {
        return res.status(404).json({ message: "Video not found" });
      }
      
      res.json(video);
    } catch (error) {
      res.status(500).json({ message: "Failed to get video" });
    }
  });
  
  // Update a video
  app.patch("/api/videos/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const videoId = parseInt(req.params.id);
      
      // Verify video exists and belongs to the user
      const video = await storage.getVideo(videoId);
      if (!video) {
        return res.status(404).json({ message: "Video not found" });
      }
      
      if (video.userId !== userId) {
        return res.status(403).json({ message: "You can only update your own videos" });
      }
      
      const updatedVideo = await storage.updateVideo(videoId, req.body);
      res.json(updatedVideo);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Failed to update video" });
    }
  });
  
  // Delete a video
  app.delete("/api/videos/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const videoId = parseInt(req.params.id);
      
      // Verify video exists and belongs to the user
      const video = await storage.getVideo(videoId);
      if (!video) {
        return res.status(404).json({ message: "Video not found" });
      }
      
      if (video.userId !== userId) {
        return res.status(403).json({ message: "You can only delete your own videos" });
      }
      
      await storage.deleteVideo(videoId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete video" });
    }
  });
  
  // Get user's videos
  app.get("/api/users/:userId/videos", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const videos = await storage.getUserVideos(userId);
      res.json(videos);
    } catch (error) {
      res.status(500).json({ message: "Failed to get user videos" });
    }
  });
  
  // Create a video engagement (view, like, share, comment)
  app.post("/api/videos/:videoId/engagements", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const videoId = parseInt(req.params.videoId);
      
      // Verify video exists
      const video = await storage.getVideo(videoId);
      if (!video) {
        return res.status(404).json({ message: "Video not found" });
      }
      
      const validatedData = insertVideoEngagementSchema.parse({
        ...req.body,
        userId,
        videoId,
      });
      
      const engagement = await storage.createVideoEngagement(validatedData);
      res.status(201).json(engagement);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Failed to create video engagement" });
    }
  });
  
  // Get video engagements
  app.get("/api/videos/:videoId/engagements", async (req, res) => {
    try {
      const videoId = parseInt(req.params.videoId);
      const type = req.query.type as string | undefined;
      
      const engagements = await storage.getVideoEngagements(videoId, type);
      res.json(engagements);
    } catch (error) {
      res.status(500).json({ message: "Failed to get video engagements" });
    }
  });
  
  // Playlist routes
  
  // Create a playlist
  app.post("/api/playlists", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      
      const validatedData = insertVideoPlaylistSchema.parse({
        ...req.body,
        userId,
      });
      
      const playlist = await storage.createPlaylist(validatedData);
      res.status(201).json(playlist);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Failed to create playlist" });
    }
  });
  
  // Get a specific playlist
  app.get("/api/playlists/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const playlist = await storage.getPlaylist(id);
      
      if (!playlist) {
        return res.status(404).json({ message: "Playlist not found" });
      }
      
      res.json(playlist);
    } catch (error) {
      res.status(500).json({ message: "Failed to get playlist" });
    }
  });
  
  // Update a playlist
  app.patch("/api/playlists/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const playlistId = parseInt(req.params.id);
      
      // Verify playlist exists and belongs to the user
      const playlist = await storage.getPlaylist(playlistId);
      if (!playlist) {
        return res.status(404).json({ message: "Playlist not found" });
      }
      
      if (playlist.userId !== userId) {
        return res.status(403).json({ message: "You can only update your own playlists" });
      }
      
      const updatedPlaylist = await storage.updatePlaylist(playlistId, req.body);
      res.json(updatedPlaylist);
    } catch (error) {
      res.status(500).json({ message: "Failed to update playlist" });
    }
  });
  
  // Delete a playlist
  app.delete("/api/playlists/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const playlistId = parseInt(req.params.id);
      
      // Verify playlist exists and belongs to the user
      const playlist = await storage.getPlaylist(playlistId);
      if (!playlist) {
        return res.status(404).json({ message: "Playlist not found" });
      }
      
      if (playlist.userId !== userId) {
        return res.status(403).json({ message: "You can only delete your own playlists" });
      }
      
      await storage.deletePlaylist(playlistId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete playlist" });
    }
  });
  
  // Get user's playlists
  app.get("/api/users/:userId/playlists", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const playlists = await storage.getUserPlaylists(userId);
      res.json(playlists);
    } catch (error) {
      res.status(500).json({ message: "Failed to get user playlists" });
    }
  });
  
  // Add video to playlist
  app.post("/api/playlists/:playlistId/videos", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const playlistId = parseInt(req.params.playlistId);
      
      // Verify playlist exists and belongs to the user
      const playlist = await storage.getPlaylist(playlistId);
      if (!playlist) {
        return res.status(404).json({ message: "Playlist not found" });
      }
      
      if (playlist.userId !== userId) {
        return res.status(403).json({ message: "You can only modify your own playlists" });
      }
      
      const videoId = req.body.videoId;
      if (!videoId) {
        return res.status(400).json({ message: "Video ID is required" });
      }
      
      // Verify video exists
      const video = await storage.getVideo(videoId);
      if (!video) {
        return res.status(404).json({ message: "Video not found" });
      }
      
      // Get the existing items to determine the position
      const playlistItems = await storage.getPlaylistItems(playlistId);
      const position = playlistItems.length > 0 ? 
        Math.max(...playlistItems.map(item => item.position)) + 1 : 
        0;
      
      const validatedData = insertPlaylistItemSchema.parse({
        playlistId,
        videoId,
        position,
      });
      
      const item = await storage.addToPlaylist(validatedData);
      
      // Update the playlist's video count
      await storage.updatePlaylist(playlistId, {
        videoCount: (playlist.videoCount || 0) + 1
      });
      
      res.status(201).json(item);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Failed to add video to playlist" });
    }
  });
  
  // Remove video from playlist
  app.delete("/api/playlists/:playlistId/videos/:videoId", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const playlistId = parseInt(req.params.playlistId);
      const videoId = parseInt(req.params.videoId);
      
      // Verify playlist exists and belongs to the user
      const playlist = await storage.getPlaylist(playlistId);
      if (!playlist) {
        return res.status(404).json({ message: "Playlist not found" });
      }
      
      if (playlist.userId !== userId) {
        return res.status(403).json({ message: "You can only modify your own playlists" });
      }
      
      const success = await storage.removeFromPlaylist(playlistId, videoId);
      
      if (success && playlist.videoCount !== null && playlist.videoCount > 0) {
        // Update the playlist's video count
        await storage.updatePlaylist(playlistId, {
          videoCount: playlist.videoCount - 1
        });
      }
      
      res.json({ success });
    } catch (error) {
      res.status(500).json({ message: "Failed to remove video from playlist" });
    }
  });
  
  // Get playlist items
  app.get("/api/playlists/:playlistId/videos", async (req, res) => {
    try {
      const playlistId = parseInt(req.params.playlistId);
      const playlistItems = await storage.getPlaylistItems(playlistId);
      res.json(playlistItems);
    } catch (error) {
      res.status(500).json({ message: "Failed to get playlist items" });
    }
  });

  // Vendor routes
  app.post("/api/vendors", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      
      // Check if user is already a vendor
      const existingVendor = await storage.getVendorByUserId(userId);
      if (existingVendor) {
        return res.status(400).json({ message: "User is already a vendor" });
      }
      
      const validatedData = insertVendorSchema.parse({
        ...req.body,
        userId,
      });
      
      const vendor = await storage.createVendor(validatedData);
      
      // Update user to mark as vendor
      const user = await storage.getUser(userId);
      if (user) {
        user.isVendor = true;
      }
      
      res.status(201).json(vendor);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Failed to create vendor" });
    }
  });

  app.get("/api/vendors", async (req, res) => {
    try {
      const vendors = await storage.listVendors();
      res.json(vendors);
    } catch (error) {
      res.status(500).json({ message: "Failed to list vendors" });
    }
  });

  app.get("/api/vendors/user/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const vendor = await storage.getVendorByUserId(userId);
      
      if (!vendor) {
        return res.status(404).json({ message: "Vendor not found for this user" });
      }
      
      res.json(vendor);
    } catch (error) {
      res.status(500).json({ message: "Failed to get vendor by user ID" });
    }
  });
  
  app.get("/api/vendors/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const vendor = await storage.getVendor(id);
      
      if (!vendor) {
        return res.status(404).json({ message: "Vendor not found" });
      }
      
      res.json(vendor);
    } catch (error) {
      res.status(500).json({ message: "Failed to get vendor" });
    }
  });

  // Product routes
  app.post("/api/products", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      
      // Check if user is a vendor
      const vendor = await storage.getVendorByUserId(userId);
      if (!vendor) {
        return res.status(403).json({ message: "Only vendors can create products" });
      }
      
      const validatedData = insertProductSchema.parse({
        ...req.body,
        vendorId: vendor.id,
      });
      
      const product = await storage.createProduct(validatedData);
      res.status(201).json(product);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Failed to create product" });
    }
  });

  app.get("/api/products", async (req, res) => {
    try {
      const { category, vendorId, minPrice, maxPrice, isOnSale, isNew } = req.query;
      
      const filters: any = {};
      if (category) filters.category = category as string;
      if (vendorId) filters.vendorId = parseInt(vendorId as string);
      if (minPrice) filters.minPrice = parseFloat(minPrice as string);
      if (maxPrice) filters.maxPrice = parseFloat(maxPrice as string);
      if (isOnSale) filters.isOnSale = (isOnSale as string) === 'true';
      if (isNew) filters.isNew = (isNew as string) === 'true';
      
      const products = await storage.listProducts(filters);
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "Failed to list products" });
    }
  });

  app.get("/api/products/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const product = await storage.getProduct(id);
      
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      res.json(product);
    } catch (error) {
      res.status(500).json({ message: "Failed to get product" });
    }
  });

  app.put("/api/products/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const productId = parseInt(req.params.id);
      
      // Get the product
      const product = await storage.getProduct(productId);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      // Get the vendor
      const vendor = await storage.getVendor(product.vendorId);
      if (!vendor || vendor.userId !== userId) {
        return res.status(403).json({ message: "You can only update your own products" });
      }
      
      const validatedData = insertProductSchema.partial().parse(req.body);
      const updatedProduct = await storage.updateProduct(productId, validatedData);
      
      res.json(updatedProduct);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Failed to update product" });
    }
  });

  app.delete("/api/products/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const productId = parseInt(req.params.id);
      
      // Get the product
      const product = await storage.getProduct(productId);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      // Get the vendor
      const vendor = await storage.getVendor(product.vendorId);
      if (!vendor || vendor.userId !== userId) {
        return res.status(403).json({ message: "You can only delete your own products" });
      }
      
      await storage.deleteProduct(productId);
      res.json({ message: "Product deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete product" });
    }
  });

  // Category routes
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await storage.listCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Failed to list categories" });
    }
  });

  // Enhanced post routes with direct JSON data for content and file uploads
  app.post("/api/posts", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      
      // Create a post data object from the JSON request
      const postData: any = {
        userId,
        content: req.body.content,
        contentType: req.body.contentType || 'standard',
      };
      
      // Add optional fields if they exist
      if (req.body.title) postData.title = req.body.title;
      if (req.body.communityId) postData.communityId = parseInt(req.body.communityId);
      
      // Handle tags array directly
      if (req.body.tags && Array.isArray(req.body.tags)) {
        postData.tags = req.body.tags;
      }
      
      // Handle media URLs
      if (req.body.imageUrl) {
        // Check if it's a base64 image
        if (req.body.imageUrl.startsWith('data:image')) {
          // Convert base64 to URL by storing it as an asset
          // This is a simplified approach - in production you would save to cloud storage
          const base64Data = req.body.imageUrl.split(',')[1];
          const filename = `image_${Date.now()}.png`;
          
          // Create uploads directory if it doesn't exist
          if (!fs.existsSync('./public/uploads')) {
            fs.mkdirSync('./public/uploads', { recursive: true });
          }
          if (!fs.existsSync('./public/uploads/images')) {
            fs.mkdirSync('./public/uploads/images', { recursive: true });
          }
          
          // Save the file
          fs.writeFileSync(`./public/uploads/images/${filename}`, base64Data, 'base64');
          
          // Set the image URL to the saved file
          postData.imageUrl = `/uploads/images/${filename}`;
        } else {
          // Use existing URL (for post editing)
          postData.imageUrl = req.body.imageUrl;
        }
      }
      
      // Handle video URLs
      if (req.body.videoUrl) {
        // Check if it's a base64 video
        if (req.body.videoUrl.startsWith('data:video')) {
          // Convert base64 to URL by storing it as an asset
          const base64Data = req.body.videoUrl.split(',')[1];
          const filename = `video_${Date.now()}.mp4`;
          
          // Create uploads directory if it doesn't exist
          if (!fs.existsSync('./public/uploads')) {
            fs.mkdirSync('./public/uploads', { recursive: true });
          }
          if (!fs.existsSync('./public/uploads/videos')) {
            fs.mkdirSync('./public/uploads/videos', { recursive: true });
          }
          
          // Save the file
          fs.writeFileSync(`./public/uploads/videos/${filename}`, base64Data, 'base64');
          
          // Set the video URL to the saved file
          postData.videoUrl = `/uploads/videos/${filename}`;
        } else {
          // Use existing URL (for post editing)
          postData.videoUrl = req.body.videoUrl;
        }
      }
      
      if (req.body.linkUrl) postData.linkUrl = req.body.linkUrl;
      if (req.body.isPromoted !== undefined) postData.isPromoted = req.body.isPromoted;
      
      console.log("Creating post with data:", postData);
      
      // Validate the data before creating the post
      const validatedData = insertPostSchema.parse(postData);
      const post = await storage.createPost(validatedData);
      
      res.status(201).json(post);
    } catch (error) {
      console.error("Error creating post:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Failed to create post" });
    }
  });

  app.put("/api/posts/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const postId = parseInt(req.params.id);
      
      // Get the post
      const post = await storage.getPost(postId);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      
      // Check if the post belongs to the user
      if (post.userId !== userId) {
        return res.status(403).json({ message: "You can only update your own posts" });
      }
      
      const validatedData = insertPostSchema.partial().parse(req.body);
      
      const updatedPost = await storage.updatePost(postId, validatedData);
      res.json(updatedPost);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Failed to update post" });
    }
  });

  app.get("/api/posts", async (req, res) => {
    try {
      // Extract query parameters for advanced filtering
      const options: {
        userId?: number;
        contentType?: string | string[];
        isPromoted?: boolean;
        tags?: string[];
        limit?: number;
        offset?: number;
      } = {};
      
      if (req.query.userId) {
        options.userId = parseInt(req.query.userId as string);
      }
      
      if (req.query.contentType) {
        options.contentType = req.query.contentType as string;
      }
      
      if (req.query.isPromoted !== undefined) {
        options.isPromoted = req.query.isPromoted === 'true';
      }
      
      if (req.query.tags) {
        options.tags = (req.query.tags as string).split(',');
      }
      
      if (req.query.limit) {
        options.limit = parseInt(req.query.limit as string);
      }
      
      if (req.query.offset) {
        options.offset = parseInt(req.query.offset as string);
      }
      
      const posts = await storage.listPosts(options);
      res.json(posts);
    } catch (error) {
      res.status(500).json({ message: "Failed to list posts" });
    }
  });
  
  app.get("/api/posts/:id", async (req, res) => {
    try {
      const postId = parseInt(req.params.id);
      const post = await storage.getPost(postId);
      
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      
      // Increment view count
      await storage.incrementPostView(postId);
      
      res.json(post);
    } catch (error) {
      res.status(500).json({ message: "Failed to get post" });
    }
  });
  
  app.put("/api/posts/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const postId = parseInt(req.params.id);
      
      // Get the post
      const post = await storage.getPost(postId);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      
      // Check if the post belongs to the user
      if (post.userId !== userId) {
        return res.status(403).json({ message: "You can only update your own posts" });
      }
      
      const validatedData = insertPostSchema.partial().parse(req.body);
      const updatedPost = await storage.updatePost(postId, validatedData);
      
      res.json(updatedPost);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Failed to update post" });
    }
  });
  
  app.post("/api/posts/:id/like", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const postId = parseInt(req.params.id);
      
      // Get the post
      const post = await storage.getPost(postId);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      
      // Update like count
      const updatedPost = await storage.updatePostStats(postId, {
        likes: (post.likes || 0) + 1
      });
      
      res.json(updatedPost);
    } catch (error) {
      res.status(500).json({ message: "Failed to like post" });
    }
  });
  
  app.delete("/api/posts/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const postId = parseInt(req.params.id);
      
      // Get the post
      const post = await storage.getPost(postId);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      
      // Check if the post belongs to the user
      if (post.userId !== userId) {
        return res.status(403).json({ message: "You can only delete your own posts" });
      }
      
      await storage.deletePost(postId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete post" });
    }
  });
  
  // Promotion management endpoints
  app.post("/api/posts/:id/promote", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const postId = parseInt(req.params.id);
      
      // Get the post
      const post = await storage.getPost(postId);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      
      // Check if the post belongs to the user
      if (post.userId !== userId) {
        return res.status(403).json({ message: "You can only promote your own posts" });
      }
      
      // Get promotion end date from request or default to 7 days from now
      const endDateString = req.body.endDate;
      let endDate: Date;
      
      if (endDateString) {
        endDate = new Date(endDateString);
      } else {
        endDate = new Date();
        endDate.setDate(endDate.getDate() + 7); // Default: 7 days from now
      }
      
      const promotedPost = await storage.promotePost(postId, endDate);
      res.json(promotedPost);
    } catch (error) {
      res.status(500).json({ message: "Failed to promote post" });
    }
  });
  
  app.post("/api/posts/:id/unpromote", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const postId = parseInt(req.params.id);
      
      // Get the post
      const post = await storage.getPost(postId);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      
      // Check if the post belongs to the user
      if (post.userId !== userId) {
        return res.status(403).json({ message: "You can only unpromote your own posts" });
      }
      
      const unpromotedPost = await storage.unpromotePost(postId);
      res.json(unpromotedPost);
    } catch (error) {
      res.status(500).json({ message: "Failed to unpromote post" });
    }
  });
  
  // Social network explore routes
  app.get("/api/explore/trending", async (req, res) => {
    try {
      // Get trending posts - those with most likes, comments and views
      const limit = parseInt(req.query.limit as string) || 10;
      const trending = await storage.getTrendingPosts(limit);
      res.json(trending);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch trending content" });
    }
  });
  
  app.get("/api/explore/tags", async (req, res) => {
    try {
      // Get popular tags
      const limit = parseInt(req.query.limit as string) || 20;
      const tags = await storage.getPopularTags(limit);
      res.json(tags);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch popular tags" });
    }
  });
  
  app.get("/api/explore/communities", async (req, res) => {
    try {
      // Get recommended communities
      const limit = parseInt(req.query.limit as string) || 10;
      const communities = await storage.getPopularCommunities(limit);
      res.json(communities);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch recommended communities" });
    }
  });
  
  app.get("/api/explore/products", async (req, res) => {
    try {
      // Get featured products
      const limit = parseInt(req.query.limit as string) || 10;
      const products = await storage.getFeaturedProducts(limit);
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch featured products" });
    }
  });
  
  app.get("/api/explore/users", async (req, res) => {
    try {
      // Get suggested users
      const limit = parseInt(req.query.limit as string) || 10;
      const userId = req.isAuthenticated() ? (req.user as any).id : undefined;
      
      const users = await storage.getSuggestedUsers(limit, userId);
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch suggested users" });
    }
  });

  // Comment routes
  app.post("/api/comments", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      
      const validatedData = insertCommentSchema.parse({
        ...req.body,
        userId,
      });
      
      const comment = await storage.createComment(validatedData);
      res.status(201).json(comment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Failed to create comment" });
    }
  });

  app.get("/api/posts/:postId/comments", async (req, res) => {
    try {
      const postId = parseInt(req.params.postId);
      const comments = await storage.listCommentsByPost(postId);
      res.json(comments);
    } catch (error) {
      res.status(500).json({ message: "Failed to list comments" });
    }
  });

  // Message routes
  app.post("/api/messages", isAuthenticated, async (req, res) => {
    try {
      const senderId = (req.user as any).id;
      
      const validatedData = insertMessageSchema.parse({
        ...req.body,
        senderId,
      });
      
      const message = await storage.createMessage(validatedData);
      res.status(201).json(message);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  app.get("/api/messages", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const messages = await storage.listMessagesByUser(userId);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: "Failed to list messages" });
    }
  });

  app.get("/api/messages/unread/count", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const count = await storage.countUnreadMessages(userId);
      res.json({ count });
    } catch (error) {
      res.status(500).json({ message: "Failed to count unread messages" });
    }
  });

  // Review routes
  app.post("/api/reviews", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      
      const validatedData = insertReviewSchema.parse({
        ...req.body,
        userId,
      });
      
      const review = await storage.createReview(validatedData);
      res.status(201).json(review);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Failed to create review" });
    }
  });

  app.get("/api/products/:productId/reviews", async (req, res) => {
    try {
      const productId = parseInt(req.params.productId);
      const reviews = await storage.listReviewsByProduct(productId);
      res.json(reviews);
    } catch (error) {
      res.status(500).json({ message: "Failed to list reviews" });
    }
  });

  app.get("/api/vendors/:vendorId/reviews", async (req, res) => {
    try {
      const vendorId = parseInt(req.params.vendorId);
      const reviews = await storage.listReviewsByVendor(vendorId);
      res.json(reviews);
    } catch (error) {
      res.status(500).json({ message: "Failed to list reviews" });
    }
  });

  // Cart routes
  app.post("/api/cart", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      
      const validatedData = insertCartSchema.parse({
        ...req.body,
        userId,
      });
      
      const cartItem = await storage.addToCart(validatedData);
      res.status(201).json(cartItem);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Failed to add to cart" });
    }
  });

  app.get("/api/cart", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const cartItems = await storage.listCartItems(userId);
      res.json(cartItems);
    } catch (error) {
      res.status(500).json({ message: "Failed to list cart items" });
    }
  });

  app.put("/api/cart/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const itemId = parseInt(req.params.id);
      
      // Get the cart item
      const cartItem = await storage.getCartItem(itemId);
      if (!cartItem) {
        return res.status(404).json({ message: "Cart item not found" });
      }
      
      // Check if the cart item belongs to the user
      if (cartItem.userId !== userId) {
        return res.status(403).json({ message: "You can only update your own cart items" });
      }
      
      const { quantity } = req.body;
      if (typeof quantity !== 'number' || quantity < 1) {
        return res.status(400).json({ message: "Quantity must be a positive number" });
      }
      
      const updatedCartItem = await storage.updateCartQuantity(itemId, quantity);
      res.json(updatedCartItem);
    } catch (error) {
      res.status(500).json({ message: "Failed to update cart item" });
    }
  });

  app.delete("/api/cart/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const itemId = parseInt(req.params.id);
      
      // Get the cart item
      const cartItem = await storage.getCartItem(itemId);
      if (!cartItem) {
        return res.status(404).json({ message: "Cart item not found" });
      }
      
      // Check if the cart item belongs to the user
      if (cartItem.userId !== userId) {
        return res.status(403).json({ message: "You can only remove your own cart items" });
      }
      
      await storage.removeFromCart(itemId);
      res.json({ message: "Cart item removed successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to remove cart item" });
    }
  });

  app.get("/api/cart/count", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const count = await storage.countCartItems(userId);
      res.json({ count });
    } catch (error) {
      res.status(500).json({ message: "Failed to count cart items" });
    }
  });

  // Vendor Analytics routes
  app.get("/api/vendors/:vendorId/analytics/total-sales", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const vendorId = parseInt(req.params.vendorId);
      
      // Verify the vendor exists
      const vendor = await storage.getVendor(vendorId);
      if (!vendor) {
        return res.status(404).json({ message: "Vendor not found" });
      }
      
      // Make sure the user is the vendor or an admin
      if (vendor.userId !== userId) {
        return res.status(403).json({ message: "You can only view your own analytics" });
      }
      
      const totalSales = await storage.getVendorTotalSales(vendorId);
      res.json({ totalSales });
    } catch (error) {
      res.status(500).json({ message: "Failed to get total sales analytics" });
    }
  });
  
  app.get("/api/vendors/:vendorId/analytics/order-stats", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const vendorId = parseInt(req.params.vendorId);
      
      // Verify the vendor exists
      const vendor = await storage.getVendor(vendorId);
      if (!vendor) {
        return res.status(404).json({ message: "Vendor not found" });
      }
      
      // Make sure the user is the vendor or an admin
      if (vendor.userId !== userId) {
        return res.status(403).json({ message: "You can only view your own analytics" });
      }
      
      const orderStats = await storage.getVendorOrderStats(vendorId);
      res.json(orderStats);
    } catch (error) {
      res.status(500).json({ message: "Failed to get order stats analytics" });
    }
  });
  
  app.get("/api/vendors/:vendorId/analytics/revenue", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const vendorId = parseInt(req.params.vendorId);
      const period = (req.query.period as "daily" | "weekly" | "monthly" | "yearly") || "monthly";
      
      // Validate period
      if (!["daily", "weekly", "monthly", "yearly"].includes(period)) {
        return res.status(400).json({ message: "Invalid period. Use daily, weekly, monthly, or yearly." });
      }
      
      // Verify the vendor exists
      const vendor = await storage.getVendor(vendorId);
      if (!vendor) {
        return res.status(404).json({ message: "Vendor not found" });
      }
      
      // Make sure the user is the vendor or an admin
      if (vendor.userId !== userId) {
        return res.status(403).json({ message: "You can only view your own analytics" });
      }
      
      const revenueData = await storage.getVendorRevenueByPeriod(vendorId, period);
      res.json(revenueData);
    } catch (error) {
      res.status(500).json({ message: "Failed to get revenue analytics" });
    }
  });
  
  app.get("/api/vendors/:vendorId/analytics/top-products", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const vendorId = parseInt(req.params.vendorId);
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
      
      // Verify the vendor exists
      const vendor = await storage.getVendor(vendorId);
      if (!vendor) {
        return res.status(404).json({ message: "Vendor not found" });
      }
      
      // Make sure the user is the vendor or an admin
      if (vendor.userId !== userId) {
        return res.status(403).json({ message: "You can only view your own analytics" });
      }
      
      const topProducts = await storage.getVendorTopProducts(vendorId, limit);
      res.json(topProducts);
    } catch (error) {
      res.status(500).json({ message: "Failed to get top products analytics" });
    }
  });
  
  app.get("/api/vendors/:vendorId/analytics/profit-loss", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const vendorId = parseInt(req.params.vendorId);
      
      // Verify the vendor exists
      const vendor = await storage.getVendor(vendorId);
      if (!vendor) {
        return res.status(404).json({ message: "Vendor not found" });
      }
      
      // Make sure the user is the vendor or an admin
      if (vendor.userId !== userId) {
        return res.status(403).json({ message: "You can only view your own analytics" });
      }
      
      const profitLossData = await storage.getVendorProfitLoss(vendorId);
      res.json(profitLossData);
    } catch (error) {
      res.status(500).json({ message: "Failed to get profit/loss analytics" });
    }
  });
  
  // Get top buyers for a vendor
  app.get("/api/vendors/:vendorId/analytics/top-buyers", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const vendorId = parseInt(req.params.vendorId);
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
      
      // Verify the vendor exists
      const vendor = await storage.getVendor(vendorId);
      if (!vendor) {
        return res.status(404).json({ message: "Vendor not found" });
      }
      
      // Make sure the user is the vendor or an admin
      if (vendor.userId !== userId) {
        return res.status(403).json({ message: "You can only view your own analytics" });
      }
      
      const topBuyers = await storage.getVendorTopBuyers(vendorId, limit);
      res.json(topBuyers);
    } catch (error) {
      res.status(500).json({ message: "Failed to get top buyers analytics" });
    }
  });

  // HTTP server already initialized at the top of the function
  
  // Add member directory routes
  app.get("/api/members", async (req, res) => {
    try {
      const users = await storage.listUsers();
      // Remove sensitive data like passwords before sending
      const members = users.map(user => {
        const { password, ...memberData } = user;
        return memberData;
      });
      res.json(members);
    } catch (error) {
      res.status(500).json({ message: "Failed to list members" });
    }
  });

  app.get("/api/members/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = await storage.getUser(id);
      
      if (!user) {
        return res.status(404).json({ message: "Member not found" });
      }
      
      // Remove password before sending
      const { password, ...memberData } = user;
      res.json(memberData);
    } catch (error) {
      res.status(500).json({ message: "Failed to get member" });
    }
  });
  
  // Wallet routes
  app.post("/api/wallets", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      
      // Check if user already has a wallet
      const existingWallet = await storage.getWalletByUserId(userId);
      if (existingWallet) {
        return res.status(400).json({ message: "User already has a wallet" });
      }
      
      const validatedData = insertWalletSchema.parse({
        ...req.body,
        userId,
        // Set default wallet currency to GBP if not provided
        currency: req.body.currency || 'GBP',
        // Set default balance to 0 if not provided
        balance: req.body.balance || 0,
        // Set wallet to active by default
        isActive: req.body.isActive !== undefined ? req.body.isActive : true,
      });
      
      const wallet = await storage.createWallet(validatedData);
      res.status(201).json(wallet);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Failed to create wallet" });
    }
  });
  
  app.get("/api/wallets/me", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const wallet = await storage.getWalletByUserId(userId);
      
      if (!wallet) {
        return res.status(404).json({ message: "Wallet not found" });
      }
      
      res.json(wallet);
    } catch (error) {
      res.status(500).json({ message: "Failed to get wallet" });
    }
  });
  
  app.post("/api/transactions", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      
      // Get the user's wallet
      const wallet = await storage.getWalletByUserId(userId);
      if (!wallet) {
        return res.status(404).json({ message: "Wallet not found, please create a wallet first" });
      }
      
      // Check if sufficient funds for withdrawals and payments
      if ((req.body.type === 'withdrawal' || req.body.type === 'payment') && 
          wallet.balance < req.body.amount) {
        return res.status(400).json({ message: "Insufficient funds" });
      }
      
      const validatedData = insertTransactionSchema.parse({
        ...req.body,
        walletId: wallet.id,
      });
      
      const transaction = await storage.createTransaction(validatedData);
      res.status(201).json(transaction);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Failed to create transaction" });
    }
  });
  
  app.get("/api/transactions", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const transactions = await storage.listTransactionsByUser(userId);
      
      // Fetch related user information for transfer transactions
      const transactionsWithUserInfo = await Promise.all(
        transactions.map(async transaction => {
          if ((transaction.type === 'transfer_in' || transaction.type === 'transfer_out') && transaction.relatedUserId) {
            try {
              const relatedUser = await storage.getUser(transaction.relatedUserId);
              if (relatedUser) {
                // Remove sensitive data like password
                const { password, ...userData } = relatedUser;
                return {
                  ...transaction,
                  relatedUser: userData
                };
              }
            } catch (err) {
              console.error('Error fetching related user:', err);
            }
          }
          return transaction;
        })
      );
      
      res.json(transactionsWithUserInfo);
    } catch (error) {
      res.status(500).json({ message: "Failed to list transactions" });
    }
  });
  
  // Additional endpoint to get transactions for a specific user (needed for spending analytics)
  app.get("/api/transactions/user/:userId", isAuthenticated, async (req, res) => {
    try {
      const requestingUserId = (req.user as any).id;
      const targetUserId = parseInt(req.params.userId);
      
      // Users can only see their own transactions (security check)
      if (requestingUserId !== targetUserId) {
        return res.status(403).json({ message: "You can only view your own transactions" });
      }
      
      const transactions = await storage.listTransactionsByUser(targetUserId);
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ message: "Failed to list user transactions" });
    }
  });
  
  // New endpoints for categorized transactions
  app.get("/api/transactions/categories", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const wallet = await storage.getWalletByUserId(userId);
      
      if (!wallet) {
        return res.status(404).json({ message: "Wallet not found" });
      }
      
      const categorizedTransactions = await storage.getTransactionsByCategory(wallet.id);
      res.json(categorizedTransactions);
    } catch (error) {
      res.status(500).json({ message: "Failed to get categorized transactions" });
    }
  });
  
  app.get("/api/transactions/stats", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const wallet = await storage.getWalletByUserId(userId);
      
      if (!wallet) {
        return res.status(404).json({ message: "Wallet not found" });
      }
      
      const stats = await storage.getTransactionStats(wallet.id);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to get transaction statistics" });
    }
  });
  
  // Wallet transfers route
  app.post("/api/transfers", isAuthenticated, async (req, res) => {
    try {
      const senderId = (req.user as any).id;
      const { recipientUsername, amount, description } = req.body;
      
      if (!recipientUsername) {
        return res.status(400).json({ message: "Recipient username is required" });
      }
      
      if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
        return res.status(400).json({ message: "Amount must be a positive number" });
      }
      
      // Get sender's wallet
      const senderWallet = await storage.getWalletByUserId(senderId);
      if (!senderWallet) {
        return res.status(404).json({ message: "Sender's wallet not found" });
      }
      
      // Check if sender has enough funds
      if (senderWallet.balance < Number(amount)) {
        return res.status(400).json({ message: "Insufficient funds" });
      }
      
      // Get recipient by username
      const recipient = await storage.getUserByUsername(recipientUsername);
      if (!recipient) {
        return res.status(404).json({ message: "Recipient not found" });
      }
      
      // Get or create recipient's wallet
      let recipientWallet = await storage.getWalletByUserId(recipient.id);
      if (!recipientWallet) {
        // Create a wallet for the recipient if they don't have one
        recipientWallet = await storage.createWallet({
          userId: recipient.id,
          balance: 0,
          currency: "GBP", // Use GBP as default currency
          isActive: true
        });
      }
      
      // Create a transaction for the sender (transfer_out)
      const senderTransaction = await storage.createTransaction({
        type: "transfer_out",
        amount: Number(amount),
        walletId: senderWallet.id,
        description: description || `Transfer to ${recipientUsername}`,
        category: "transfer",
        paymentMethod: "wallet",
        status: "completed",
        relatedUserId: recipient.id  // Link to recipient's user ID
      });
      
      // Create a transaction for the recipient (transfer_in)
      const recipientTransaction = await storage.createTransaction({
        type: "transfer_in",
        amount: Number(amount),
        walletId: recipientWallet.id,
        description: description || `Transfer from ${(req.user as any).username}`,
        category: "transfer",
        paymentMethod: "wallet",
        status: "completed",
        relatedUserId: senderId  // Link to sender's user ID
      });
      
      // Update wallet balances
      await storage.updateWalletBalance(senderWallet.id, senderWallet.balance - Number(amount));
      await storage.updateWalletBalance(recipientWallet.id, recipientWallet.balance + Number(amount));
      
      res.status(201).json({ 
        success: true, 
        message: "Transfer completed successfully",
        transaction: senderTransaction
      });
    } catch (error) {
      console.error("Transfer error:", error);
      res.status(500).json({ message: "Failed to process transfer" });
    }
  });
  
  // Community management API routes
  // Communities routes
  app.post("/api/communities", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      
      const validatedData = insertCommunitySchema.parse({
        ...req.body,
        ownerId: userId,
      });
      
      const community = await storage.createCommunity(validatedData);
      res.status(201).json(community);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Failed to create community" });
    }
  });
  
  app.get("/api/communities", async (req, res) => {
    try {
      const options: any = {};
      
      // Extract query parameters
      if (req.query.ownerId) {
        options.ownerId = parseInt(req.query.ownerId as string);
      }
      
      if (req.query.visibility) {
        options.visibility = req.query.visibility;
      }
      
      if (req.query.topics) {
        options.topics = (req.query.topics as string).split(',');
      }
      
      if (req.query.isVerified !== undefined) {
        options.isVerified = req.query.isVerified === 'true';
      }
      
      if (req.query.limit) {
        options.limit = parseInt(req.query.limit as string);
      }
      
      if (req.query.offset) {
        options.offset = parseInt(req.query.offset as string);
      }
      
      const communities = await storage.listCommunities(options);
      res.json(communities);
    } catch (error) {
      res.status(500).json({ message: "Failed to list communities" });
    }
  });
  
  app.get("/api/communities/:id", async (req, res) => {
    try {
      const communityId = parseInt(req.params.id);
      const community = await storage.getCommunity(communityId);
      
      if (!community) {
        return res.status(404).json({ message: "Community not found" });
      }
      
      res.json(community);
    } catch (error) {
      res.status(500).json({ message: "Failed to get community" });
    }
  });
  
  app.put("/api/communities/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const communityId = parseInt(req.params.id);
      
      // Get the community
      const community = await storage.getCommunity(communityId);
      if (!community) {
        return res.status(404).json({ message: "Community not found" });
      }
      
      // Check if the user is the owner
      if (community.ownerId !== userId) {
        return res.status(403).json({ message: "Only the community owner can update it" });
      }
      
      const validatedData = insertCommunitySchema.partial().parse(req.body);
      const updatedCommunity = await storage.updateCommunity(communityId, validatedData);
      
      res.json(updatedCommunity);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Failed to update community" });
    }
  });
  
  // Community membership routes
  app.post("/api/communities/:id/members", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const communityId = parseInt(req.params.id);
      
      // Check if community exists
      const community = await storage.getCommunity(communityId);
      if (!community) {
        return res.status(404).json({ message: "Community not found" });
      }
      
      // Check if already a member
      const existingMembership = await storage.getMembershipStatus(communityId, userId);
      if (existingMembership) {
        return res.status(400).json({ message: "Already a member of this community" });
      }
      
      // Add as member
      const member = await storage.addCommunityMember({
        communityId,
        userId,
        role: "member"
      });
      
      res.status(201).json(member);
    } catch (error) {
      res.status(500).json({ message: "Failed to join community" });
    }
  });
  
  app.get("/api/communities/:id/members", async (req, res) => {
    try {
      const communityId = parseInt(req.params.id);
      const { role } = req.query;
      
      // Check if community exists
      const community = await storage.getCommunity(communityId);
      if (!community) {
        return res.status(404).json({ message: "Community not found" });
      }
      
      // Get members, optionally filtered by role
      const members = await storage.listCommunityMembers(
        communityId, 
        role ? (role as string) : undefined
      );
      
      // Enrich with user information
      const membersWithUserInfo = await Promise.all(
        members.map(async (member) => {
          const user = await storage.getUser(member.userId);
          if (user) {
            const { password, ...userData } = user;
            return {
              ...member,
              user: userData
            };
          }
          return member;
        })
      );
      
      res.json(membersWithUserInfo);
    } catch (error) {
      res.status(500).json({ message: "Failed to list community members" });
    }
  });
  
  app.delete("/api/communities/:communityId/members/:userId", isAuthenticated, async (req, res) => {
    try {
      const requestingUserId = (req.user as any).id;
      const communityId = parseInt(req.params.communityId);
      const targetUserId = parseInt(req.params.userId);
      
      // Check if community exists
      const community = await storage.getCommunity(communityId);
      if (!community) {
        return res.status(404).json({ message: "Community not found" });
      }
      
      // Check permissions: must be removing self or be the owner
      if (requestingUserId !== targetUserId && community.ownerId !== requestingUserId) {
        return res.status(403).json({ message: "You don't have permission to remove this member" });
      }
      
      // Remove member
      const result = await storage.removeCommunityMember(communityId, targetUserId);
      
      if (result) {
        res.status(200).json({ message: "Member removed successfully" });
      } else {
        res.status(404).json({ message: "Member not found" });
      }
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to remove member" });
    }
  });
  
  // Membership tiers routes
  app.post("/api/communities/:id/tiers", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const communityId = parseInt(req.params.id);
      
      // Check if community exists and user is the owner
      const community = await storage.getCommunity(communityId);
      if (!community) {
        return res.status(404).json({ message: "Community not found" });
      }
      
      if (community.ownerId !== userId) {
        return res.status(403).json({ message: "Only the community owner can create membership tiers" });
      }
      
      const validatedData = insertMembershipTierSchema.parse({
        ...req.body,
        communityId,
      });
      
      const tier = await storage.createMembershipTier(validatedData);
      res.status(201).json(tier);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Failed to create membership tier" });
    }
  });
  
  app.get("/api/communities/:id/tiers", async (req, res) => {
    try {
      const communityId = parseInt(req.params.id);
      
      // Check if community exists
      const community = await storage.getCommunity(communityId);
      if (!community) {
        return res.status(404).json({ message: "Community not found" });
      }
      
      const tiers = await storage.listMembershipTiers(communityId);
      res.json(tiers);
    } catch (error) {
      res.status(500).json({ message: "Failed to list membership tiers" });
    }
  });
  
  // Events routes
  app.post("/api/communities/:id/events", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const communityId = parseInt(req.params.id);
      
      // Check if community exists
      const community = await storage.getCommunity(communityId);
      if (!community) {
        return res.status(404).json({ message: "Community not found" });
      }
      
      // Check if the user is a member or the owner
      const isMember = await storage.getMembershipStatus(communityId, userId);
      if (!isMember && community.ownerId !== userId) {
        return res.status(403).json({ message: "Only community members can create events" });
      }
      
      const validatedData = insertEventSchema.parse({
        ...req.body,
        communityId,
        hostId: userId
      });
      
      const event = await storage.createEvent(validatedData);
      res.status(201).json(event);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Failed to create event" });
    }
  });
  
  app.get("/api/communities/:id/events", async (req, res) => {
    try {
      const communityId = parseInt(req.params.id);
      
      // Check if community exists
      const community = await storage.getCommunity(communityId);
      if (!community) {
        return res.status(404).json({ message: "Community not found" });
      }
      
      // Get events with optional filters
      const options: any = { communityId };
      
      if (req.query.eventType) {
        options.eventType = req.query.eventType;
      }
      
      if (req.query.startAfter) {
        options.startAfter = new Date(req.query.startAfter as string);
      }
      
      if (req.query.isPublished !== undefined) {
        options.isPublished = req.query.isPublished === 'true';
      }
      
      const events = await storage.listEvents(options);
      
      // Enrich with host information
      const eventsWithHostInfo = await Promise.all(
        events.map(async (event) => {
          const host = await storage.getUser(event.hostId);
          if (host) {
            const { password, ...hostData } = host;
            return {
              ...event,
              host: hostData
            };
          }
          return event;
        })
      );
      
      res.json(eventsWithHostInfo);
    } catch (error) {
      res.status(500).json({ message: "Failed to list events" });
    }
  });
  
  // Polls routes
  app.post("/api/communities/:id/polls", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const communityId = parseInt(req.params.id);
      
      // Check if community exists
      const community = await storage.getCommunity(communityId);
      if (!community) {
        return res.status(404).json({ message: "Community not found" });
      }
      
      // Check if the user is a member or owner
      const isMember = await storage.getMembershipStatus(communityId, userId);
      if (!isMember && community.ownerId !== userId) {
        return res.status(403).json({ message: "Only community members can create polls" });
      }
      
      const validatedData = insertPollSchema.parse({
        ...req.body,
        communityId,
        creatorId: userId
      });
      
      const poll = await storage.createPoll(validatedData);
      res.status(201).json(poll);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Failed to create poll" });
    }
  });
  
  app.get("/api/communities/:id/polls", async (req, res) => {
    try {
      const communityId = parseInt(req.params.id);
      
      // Check if community exists
      const community = await storage.getCommunity(communityId);
      if (!community) {
        return res.status(404).json({ message: "Community not found" });
      }
      
      // Get active status from query params
      const isActive = req.query.isActive !== undefined 
        ? req.query.isActive === 'true'
        : undefined;
      
      const polls = await storage.listPolls(communityId, isActive);
      
      // Enrich with creator info
      const enrichedPolls = await Promise.all(
        polls.map(async (poll) => {
          const creator = await storage.getUser(poll.creatorId);
          let creatorData = null;
          if (creator) {
            const { password, ...userData } = creator;
            creatorData = userData;
          }
          
          return {
            ...poll,
            creator: creatorData
          };
        })
      );
      
      res.json(enrichedPolls);
    } catch (error) {
      res.status(500).json({ message: "Failed to list polls" });
    }
  });
  
  app.post("/api/polls/:id/vote", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const pollId = parseInt(req.params.id);
      
      // Validate selected options
      if (!req.body.selectedOptions || !Array.isArray(req.body.selectedOptions)) {
        return res.status(400).json({ message: "selectedOptions must be an array" });
      }
      
      try {
        const vote = await storage.castVote({
          pollId,
          userId,
          selectedOptions: req.body.selectedOptions
        });
        
        res.status(201).json(vote);
      } catch (error) {
        return res.status(400).json({ message: error instanceof Error ? error.message : "Failed to cast vote" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to cast vote" });
    }
  });
  
  // Creator earnings routes
  app.get("/api/creator/earnings", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      
      const earnings = await storage.listCreatorEarnings(userId);
      res.json(earnings);
    } catch (error) {
      res.status(500).json({ message: "Failed to get creator earnings" });
    }
  });
  
  app.get("/api/creator/stats", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      
      const stats = await storage.getCreatorRevenueStats(userId);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to get creator stats" });
    }
  });

  // WebSocket server already set up at the top of the function
  // Store active connections
  const clients = new Map();
  
  // Use the existing WebSocket server
  // Additional connection handler for specific messaging features
  wss.on('connection', (socket, req) => {
    console.log('WebSocket connection established');
    // Get user ID from query params
    const url = new URL(req.url || '', `http://${req.headers.host}`);
    const userId = url.searchParams.get('userId');
    
    if (userId) {
      clients.set(userId, socket);
      
      // Send initial connection confirmation
      socket.send(JSON.stringify({
        type: 'connection',
        status: 'connected',
        userId: userId,
        timestamp: new Date().toISOString()
      }));
      
      // Handle messages
      socket.on('message', async (data) => {
        try {
          const message = JSON.parse(data.toString());
          console.log('Received message:', message);
          
          // Handle different message types
          if (message.type === 'chat') {
            // Save message to database
            const savedMessage = await storage.createMessage({
              senderId: parseInt(userId),
              receiverId: message.receiverId,
              content: message.content
              // isRead field removed as it's not in the schema
            });
            
            // Forward message to recipient if online
            const recipientSocket = clients.get(message.receiverId.toString());
            if (recipientSocket && recipientSocket.readyState === WebSocket.OPEN) {
              recipientSocket.send(JSON.stringify({
                type: 'chat',
                messageId: savedMessage.id,
                senderId: parseInt(userId),
                content: message.content,
                timestamp: new Date().toISOString()
              }));
            }
            
            // Confirm message saved to sender
            socket.send(JSON.stringify({
              type: 'confirmation',
              messageId: savedMessage.id,
              receiverId: message.receiverId,
              status: 'sent',
              timestamp: new Date().toISOString()
            }));
          }
          
          // Handle video/audio call requests
          else if (message.type === 'call-request') {
            const recipientSocket = clients.get(message.receiverId.toString());
            if (recipientSocket && recipientSocket.readyState === WebSocket.OPEN) {
              recipientSocket.send(JSON.stringify({
                type: 'call-request',
                callerId: parseInt(userId),
                callType: message.callType, // 'audio' or 'video'
                timestamp: new Date().toISOString()
              }));
            } else {
              // Recipient offline
              socket.send(JSON.stringify({
                type: 'call-error',
                receiverId: message.receiverId,
                error: 'recipient-offline',
                timestamp: new Date().toISOString()
              }));
            }
          }
          
          // Handle call acceptance/rejection
          else if (message.type === 'call-response') {
            const callerSocket = clients.get(message.callerId.toString());
            if (callerSocket && callerSocket.readyState === WebSocket.OPEN) {
              callerSocket.send(JSON.stringify({
                type: 'call-response',
                accepted: message.accepted,
                responderId: parseInt(userId),
                sdpOffer: message.sdpOffer, // For WebRTC
                timestamp: new Date().toISOString()
              }));
            }
          }
          
          // Handle WebRTC signaling
          else if (message.type === 'webrtc-signal') {
            const targetSocket = clients.get(message.targetId.toString());
            if (targetSocket && targetSocket.readyState === WebSocket.OPEN) {
              targetSocket.send(JSON.stringify({
                type: 'webrtc-signal',
                senderId: parseInt(userId),
                signal: message.signal,
                timestamp: new Date().toISOString()
              }));
            }
          }
        } catch (error) {
          console.error('WebSocket message error:', error);
          socket.send(JSON.stringify({
            type: 'error',
            error: 'Failed to process message',
            timestamp: new Date().toISOString()
          }));
        }
      });
      
      // Handle disconnection
      socket.on('close', () => {
        console.log(`User ${userId} disconnected`);
        clients.delete(userId);
        
        // Notify relevant users about the disconnection
        // (This could be used to update online status in the member directory)
        // Implementation depends on your application's requirements
      });
    } else {
      // No userId provided, close connection
      socket.send(JSON.stringify({
        type: 'error',
        error: 'No user ID provided',
        timestamp: new Date().toISOString()
      }));
      socket.close();
    }
  });

  return httpServer;
}
