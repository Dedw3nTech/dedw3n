import { pgTable, text, varchar, timestamp, serial, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Instagram-like API schema

/**
 * Media containers table - stores media items that have been uploaded but may not yet be published
 */
export const media_containers = pgTable("media_containers", {
  id: varchar("id").primaryKey().notNull(),
  userId: integer("user_id").notNull(),
  mediaType: varchar("media_type").notNull(), // IMAGE, VIDEO, CAROUSEL_ALBUM
  mediaUrl: text("media_url").notNull(),
  caption: text("caption"),
  status: varchar("status").notNull(), // CREATED, PUBLISHED, ERROR
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/**
 * Post media table - stores published media posts
 */
export const post_media = pgTable("post_media", {
  id: serial("id").primaryKey(),
  containerId: varchar("container_id").notNull().references(() => media_containers.id),
  userId: integer("user_id").notNull(),
  caption: text("caption"),
  mediaType: varchar("media_type").notNull(), // IMAGE, VIDEO, CAROUSEL_ALBUM
  mediaUrl: text("media_url").notNull(),
  viewCount: integer("view_count").default(0),
  likeCount: integer("like_count").default(0),
  commentCount: integer("comment_count").default(0),
  shareCount: integer("share_count").default(0),
  publishedAt: timestamp("published_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Schema definitions for validation
export const insertMediaContainerSchema = createInsertSchema(media_containers);
export const insertPostMediaSchema = createInsertSchema(post_media);

// Types for TypeScript
export type InsertMediaContainer = z.infer<typeof insertMediaContainerSchema>;
export type InsertPostMedia = z.infer<typeof insertPostMediaSchema>;
export type MediaContainer = typeof media_containers.$inferSelect;
export type PostMedia = typeof post_media.$inferSelect;