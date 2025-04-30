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
        
        // Track if we're using fallback counts
        let usedFallbackCounts = false;
        
        try {
          // Add timeout to the main request
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000);
          
          // First try primary endpoint with a timeout
          try {
            const response = await apiRequest('GET', '/api/user/stats', undefined, {
              signal: controller.signal,
              isFormData: false
            });
            
            // Clear the timeout since request completed
            clearTimeout(timeoutId);
            
            if (response.ok) {
              return await response.json();
            }
            
            console.warn('Failed to fetch user stats:', response.status, response.statusText);
            
            // Handle specific error codes
            if (response.status === 401) {
              // Authentication issue, fall back to another endpoint
            } else if (response.status === 502 || response.status === 504) {
              console.warn('Server timeout or gateway error when fetching stats');
            }
            
            throw new Error(`Primary stats endpoint failed: ${response.status} ${response.statusText}`);
          } catch (mainError) {
            // Clear timeout if it hasn't fired yet
            clearTimeout(timeoutId);
            
            // Log the error details for debugging
            const errorMessage = mainError instanceof Error ? mainError.message : String(mainError);
            console.warn(`Primary stats endpoint error: ${errorMessage}`);
            
            throw mainError; // Let the fallback logic handle it
          }
        } catch (primaryError) {
          usedFallbackCounts = true;
          console.warn('Using fallback stats endpoints...');
          
          // Implement fallback strategy - fetch individual counts separately
          try {
            // Try the alternative user stats endpoint first
            try {
              const userStatsResponse = await apiRequest('GET', `/api/users/${user.id}/stats`, undefined, {
                // Set shorter timeout for fallback requests
                signal: AbortSignal.timeout(3000),
                isFormData: false
              });
              
              if (userStatsResponse.ok) {
                return await userStatsResponse.json();
              }
            } catch (fallbackError) {
              console.warn(`Fallback user stats failed: ${fallbackError instanceof Error ? fallbackError.message : 'Unknown error'}`);
            }
            
            // If that fails too, try to gather stats from individual endpoints
            const stats = { postCount: 0, followerCount: 0, followingCount: 0 };
            
            // Collect all promises for individual stats
            const promises = [
              // Get post count
              apiRequest('GET', `/api/social/posts/count/${user.id}`)
                .then(res => res.ok ? res.json().then(data => stats.postCount = data.count) : null)
                .catch(e => console.warn(`Failed to get post count: ${e}`)),
                
              // Get follower count
              apiRequest('GET', `/api/social/followers/count/${user.id}`)
                .then(res => res.ok ? res.json().then(data => stats.followerCount = data.count) : null)
                .catch(e => console.warn(`Failed to get follower count: ${e}`)),
                
              // Get following count
              apiRequest('GET', `/api/social/following/count/${user.id}`)
                .then(res => res.ok ? res.json().then(data => stats.followingCount = data.count) : null)
                .catch(e => console.warn(`Failed to get following count: ${e}`))
            ];
            
            // Wait for all to complete (regardless of success/failure)
            await Promise.allSettled(promises);
            
            console.log('Using individually collected stats:', stats);
            return stats;
          } catch (completeFailure) {
            console.error('All stats endpoints failed:', 
              completeFailure instanceof Error ? completeFailure.message : completeFailure);
            
            // Last resort - return zeros
            return { postCount: 0, followerCount: 0, followingCount: 0 };
          }
        } finally {
          if (usedFallbackCounts) {
            console.log('Used fallback strategy for user stats');
          }
        }
      },
      enabled: !!user,
      // Refresh stats less frequently when using the improved error handling
      refetchInterval: 60000, 
      // Increase retry attempts with the more robust implementation
      retry: 2,
      retryDelay: 3000,
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