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
      queryKey: ['/api/users/stats'],
      queryFn: async () => {
        if (!user) return { postCount: 0, followerCount: 0, followingCount: 0 };
        
        const response = await apiRequest('GET', '/api/users/stats');
        return response.json();
      },
      enabled: !!user,
    });
  };

  // Get any user's statistics by ID
  const getUserStats = (userId: number) => {
    return useQuery<UserStats>({
      queryKey: ['/api/users/stats', userId],
      queryFn: async () => {
        const response = await apiRequest('GET', `/api/users/${userId}/stats`);
        return response.json();
      },
      enabled: !!userId,
    });
  };

  return {
    getCurrentUserStats,
    getUserStats,
  };
}