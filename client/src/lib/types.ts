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
