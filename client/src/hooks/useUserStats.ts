import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "./use-auth";

export interface UserStats {
  postCount: number;
  followerCount: number;
  followingCount: number;
}

export function useUserStats() {
  const { user } = useAuth();

  // Get current user's statistics
  const getCurrentUserStats = () => {
    return useQuery<UserStats>({
      queryKey: ['/api/user/stats'],
      queryFn: async () => {
        if (!user) return { postCount: 0, followerCount: 0, followingCount: 0 };
        
        try {
          const response = await apiRequest('GET', '/api/user/stats');
          if (!response.ok) {
            throw new Error('Failed to fetch user stats');
          }
          return response.json();
        } catch (error) {
          console.error('Error fetching current user stats:', error);
          return { postCount: 0, followerCount: 0, followingCount: 0 };
        }
      },
      enabled: !!user,
      // Refresh stats every 30 seconds to keep counts updated
      refetchInterval: 30000,
    });
  };

  // Get any user's statistics by ID
  const getUserStats = (userId: number) => {
    return useQuery<UserStats>({
      queryKey: ['/api/users/stats', userId],
      queryFn: async () => {
        try {
          const response = await apiRequest('GET', `/api/users/${userId}/stats`);
          if (!response.ok) {
            throw new Error('Failed to fetch user stats');
          }
          return response.json();
        } catch (error) {
          console.error(`Error fetching stats for user ${userId}:`, error);
          return { postCount: 0, followerCount: 0, followingCount: 0 };
        }
      },
      enabled: !!userId,
      // Refresh stats every 30 seconds to keep counts updated
      refetchInterval: 30000,
    });
  };

  // Get user post count
  const getUserPostCount = (userId: number) => {
    return useQuery<number>({
      queryKey: ['/api/social/posts/count', userId],
      queryFn: async () => {
        try {
          const response = await apiRequest('GET', `/api/social/posts/count/${userId}`);
          if (!response.ok) {
            throw new Error('Failed to fetch post count');
          }
          const data = await response.json();
          return data.count;
        } catch (error) {
          console.error(`Error fetching post count for user ${userId}:`, error);
          return 0;
        }
      },
      enabled: !!userId,
    });
  };

  // Get followers count
  const getFollowersCount = (userId: number) => {
    return useQuery<number>({
      queryKey: ['/api/social/followers/count', userId],
      queryFn: async () => {
        try {
          const response = await apiRequest('GET', `/api/social/followers/count/${userId}`);
          if (!response.ok) {
            throw new Error('Failed to fetch followers count');
          }
          const data = await response.json();
          return data.count;
        } catch (error) {
          console.error(`Error fetching followers count for user ${userId}:`, error);
          return 0;
        }
      },
      enabled: !!userId,
    });
  };

  // Get following count
  const getFollowingCount = (userId: number) => {
    return useQuery<number>({
      queryKey: ['/api/social/following/count', userId],
      queryFn: async () => {
        try {
          const response = await apiRequest('GET', `/api/social/following/count/${userId}`);
          if (!response.ok) {
            throw new Error('Failed to fetch following count');
          }
          const data = await response.json();
          return data.count;
        } catch (error) {
          console.error(`Error fetching following count for user ${userId}:`, error);
          return 0;
        }
      },
      enabled: !!userId,
    });
  };

  return {
    getCurrentUserStats,
    getUserStats,
    getUserPostCount,
    getFollowersCount,
    getFollowingCount,
  };
}