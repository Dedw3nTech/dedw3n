import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "./use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "./useAuth";

export function useFollow() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  // Check if the current user is following a specific user
  const checkFollowStatus = (userId: number) => {
    return useQuery({
      queryKey: ['/api/social/follow/check', userId],
      queryFn: async () => {
        if (!user) return { isFollowing: false };
        
        const response = await apiRequest('GET', `/api/social/follow/check/${userId}`);
        const data = await response.json();
        return data;
      },
      enabled: !!user && !!userId,
    });
  };

  // Get followers of a user
  const getFollowers = (userId: number) => {
    return useQuery({
      queryKey: ['/api/social/followers', userId],
      queryFn: async () => {
        const response = await apiRequest('GET', `/api/social/followers/${userId}`);
        return response.json();
      },
      enabled: !!userId,
    });
  };

  // Get users followed by a user
  const getFollowing = (userId: number) => {
    return useQuery({
      queryKey: ['/api/social/following', userId],
      queryFn: async () => {
        const response = await apiRequest('GET', `/api/social/following/${userId}`);
        return response.json();
      },
      enabled: !!userId,
    });
  };

  // Get followers count
  const getFollowersCount = (userId: number) => {
    return useQuery({
      queryKey: ['/api/social/followers/count', userId],
      queryFn: async () => {
        const response = await apiRequest('GET', `/api/social/followers/count/${userId}`);
        const data = await response.json();
        return data.count;
      },
      enabled: !!userId,
    });
  };

  // Get following count
  const getFollowingCount = (userId: number) => {
    return useQuery({
      queryKey: ['/api/social/following/count', userId],
      queryFn: async () => {
        const response = await apiRequest('GET', `/api/social/following/count/${userId}`);
        const data = await response.json();
        return data.count;
      },
      enabled: !!userId,
    });
  };

  // Get suggested users to follow
  const getSuggestedUsers = (limit: number = 10) => {
    return useQuery({
      queryKey: ['/api/social/suggested', limit],
      queryFn: async () => {
        if (!user) return [];
        
        const response = await apiRequest('GET', `/api/social/suggested?limit=${limit}`);
        return response.json();
      },
      enabled: !!user,
    });
  };

  // Follow a user
  const followMutation = useMutation({
    mutationFn: async (userId: number) => {
      const response = await apiRequest('POST', `/api/social/follow/${userId}`);
      return response.json();
    },
    onSuccess: (_, userId) => {
      toast({
        title: "Success",
        description: "You are now following this user",
      });
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['/api/social/follow/check', userId] });
      queryClient.invalidateQueries({ queryKey: ['/api/social/followers', userId] });
      queryClient.invalidateQueries({ queryKey: ['/api/social/followers/count', userId] });
      
      if (user) {
        queryClient.invalidateQueries({ queryKey: ['/api/social/following', user.id] });
        queryClient.invalidateQueries({ queryKey: ['/api/social/following/count', user.id] });
      }
      
      queryClient.invalidateQueries({ queryKey: ['/api/social/suggested'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to follow user",
        variant: "destructive",
      });
      console.error("Follow error:", error);
    },
  });

  // Unfollow a user
  const unfollowMutation = useMutation({
    mutationFn: async (userId: number) => {
      const response = await apiRequest('DELETE', `/api/social/follow/${userId}`);
      return response.json();
    },
    onSuccess: (_, userId) => {
      toast({
        title: "Success",
        description: "You are no longer following this user",
      });
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['/api/social/follow/check', userId] });
      queryClient.invalidateQueries({ queryKey: ['/api/social/followers', userId] });
      queryClient.invalidateQueries({ queryKey: ['/api/social/followers/count', userId] });
      
      if (user) {
        queryClient.invalidateQueries({ queryKey: ['/api/social/following', user.id] });
        queryClient.invalidateQueries({ queryKey: ['/api/social/following/count', user.id] });
      }
      
      queryClient.invalidateQueries({ queryKey: ['/api/social/suggested'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to unfollow user",
        variant: "destructive",
      });
      console.error("Unfollow error:", error);
    },
  });

  return {
    checkFollowStatus,
    getFollowers,
    getFollowing,
    getFollowersCount,
    getFollowingCount,
    getSuggestedUsers,
    follow: followMutation.mutate,
    unfollow: unfollowMutation.mutate,
    isFollowLoading: followMutation.isPending,
    isUnfollowLoading: unfollowMutation.isPending,
  };
}