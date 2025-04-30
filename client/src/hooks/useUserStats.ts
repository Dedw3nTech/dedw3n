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
          // Add Authorization header with the user's id to show we're authenticated
          const response = await apiRequest('GET', '/api/user/stats');
          
          if (!response.ok) {
            console.warn('Failed to fetch user stats:', response.status, response.statusText);
            // If we're not authenticated for some reason, let's try to get stats from the users endpoint instead
            if (response.status === 401) {
              try {
                const userStatsResponse = await apiRequest('GET', `/api/users/${user.id}/stats`);
                if (userStatsResponse.ok) {
                  return userStatsResponse.json();
                }
              } catch (fallbackError) {
                console.warn(`Fallback stats fetch failed: ${fallbackError instanceof Error ? fallbackError.message : 'Unknown error'}`);
              }
            }
            throw new Error(`Failed to fetch user stats: ${response.status} ${response.statusText}`);
          }
          return response.json();
        } catch (error) {
          if (error instanceof Error) {
            console.error('Error fetching current user stats:', error.message);
          } else if (Object.keys(error || {}).length === 0) {
            // This is likely the unauthorized error case
            console.error('Error fetching current user stats: User not authenticated');
          } else {
            console.error('Error fetching current user stats:', error);
          }
          // Return default values when there's an error
          return { postCount: 0, followerCount: 0, followingCount: 0 };
        }
      },
      enabled: !!user,
      // Refresh stats every 30 seconds to keep counts updated
      refetchInterval: 30000,
      // Add retry options for better resilience
      retry: 1,
      retryDelay: 2000,
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
            throw new Error(`Failed to fetch user stats: ${response.status} ${response.statusText}`);
          }
          return response.json();
        } catch (error) {
          console.error(`Error fetching stats for user ${userId}:`, error instanceof Error ? error.message : 'Unknown error');
          return { postCount: 0, followerCount: 0, followingCount: 0 };
        }
      },
      enabled: !!userId,
      // Refresh stats every 30 seconds to keep counts updated
      refetchInterval: 30000,
      retry: 1,
      retryDelay: 2000,
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