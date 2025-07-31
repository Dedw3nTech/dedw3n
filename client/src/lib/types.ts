import type { User, Vendor, Product, Post, Comment } from "@shared/schema";

export interface UserWithoutPassword extends Omit<User, "password"> {}

// Extended types with relationships
export interface ProductWithVendor extends Product {
  vendor?: Vendor;
}

export interface PostWithUser extends Post {
  user?: UserWithoutPassword;
  comments?: CommentWithUser[];
}

export interface CommentWithUser extends Comment {
  user?: UserWithoutPassword;
}

// View type for switching between Marketplace and Social
export type ViewType = "marketplace" | "social";

// Market type for different marketplace experiences
export type MarketType = "c2c" | "b2c" | "b2b" | "rqst" | "gov";

// Market type labels
export const MARKET_TYPE_LABELS = {
  c2c: "Buy from a friend",
  b2c: "Buy from a store", 
  b2b: "Business",
  rqst: "Request marketplace",
  gov: "Governmental"
};

// Authentication
export interface AuthContextType {
  user: UserWithoutPassword | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (userData: { username: string; password: string; name: string; email: string }) => Promise<void>;
  logout: () => Promise<void>;
}

// Cart
export interface CartItem {
  id: number;
  userId: number;
  productId: number;
  quantity: number;
  product?: Product;
}

// Format Date utilities
export interface TimeAgo {
  value: number;
  unit: string;
}
