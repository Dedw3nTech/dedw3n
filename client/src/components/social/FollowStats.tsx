import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { useUserStats } from "@/hooks/useUserStats";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, Users, UserPlus } from "lucide-react";
import { useEffect, useState } from "react";

interface FollowStatsProps {
  userId: number;
  className?: string;
  linkToFollowersPage?: boolean;
}

export default function FollowStats({ 
  userId, 
  className = "",
  linkToFollowersPage = true
}: FollowStatsProps) {
  const { 
    getUserStats, 
    getUserPostCount,
    getFollowersCount,
    getFollowingCount 
  } = useUserStats();
  
  // We'll use both the combined stats endpoint and individual ones for redundancy
  const { 
    data: userStats, 
    isLoading: isLoadingCombinedStats 
  } = getUserStats(userId);
  
  const { 
    data: postCount, 
    isLoading: isLoadingPostCount 
  } = getUserPostCount(userId);
  
  const { 
    data: followerCount, 
    isLoading: isLoadingFollowerCount 
  } = getFollowersCount(userId);
  
  const { 
    data: followingCount, 
    isLoading: isLoadingFollowingCount 
  } = getFollowingCount(userId);
  
  // Combined loading state
  const isLoading = isLoadingCombinedStats && 
                    (isLoadingPostCount || isLoadingFollowerCount || isLoadingFollowingCount);
  
  // Use individual endpoint data if available, fall back to combined data
  const postCountValue = postCount !== undefined ? postCount : userStats?.postCount || 0;
  const followerCountValue = followerCount !== undefined ? followerCount : userStats?.followerCount || 0;
  const followingCountValue = followingCount !== undefined ? followingCount : userStats?.followingCount || 0;
  
  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <div className="flex justify-between">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-5 w-20" />
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Format numbers to display more nicely (e.g., 1.2k instead of 1200)
  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}k`;
    }
    return num;
  };
  
  const formattedPostCount = formatNumber(postCountValue);
  const formattedFollowersCount = formatNumber(followerCountValue);
  const formattedFollowingCount = formatNumber(followingCountValue);
  
  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="flex justify-between text-center">
          <div className="flex flex-col items-center">
            <FileText className="h-4 w-4 mb-1 text-muted-foreground" />
            <span className="font-semibold">{formattedPostCount}</span>
            <span className="text-xs text-muted-foreground">Posts</span>
          </div>
          
          {linkToFollowersPage ? (
            <Link to={`/profile/${userId}/followers`}>
              <div className="flex flex-col items-center cursor-pointer hover:text-primary transition-colors">
                <Users className="h-4 w-4 mb-1 text-muted-foreground" />
                <span className="font-semibold">{formattedFollowersCount}</span>
                <span className="text-xs text-muted-foreground">Followers</span>
              </div>
            </Link>
          ) : (
            <div className="flex flex-col items-center">
              <Users className="h-4 w-4 mb-1 text-muted-foreground" />
              <span className="font-semibold">{formattedFollowersCount}</span>
              <span className="text-xs text-muted-foreground">Followers</span>
            </div>
          )}
          
          {linkToFollowersPage ? (
            <Link to={`/profile/${userId}/following`}>
              <div className="flex flex-col items-center cursor-pointer hover:text-primary transition-colors">
                <UserPlus className="h-4 w-4 mb-1 text-muted-foreground" />
                <span className="font-semibold">{formattedFollowingCount}</span>
                <span className="text-xs text-muted-foreground">Following</span>
              </div>
            </Link>
          ) : (
            <div className="flex flex-col items-center">
              <UserPlus className="h-4 w-4 mb-1 text-muted-foreground" />
              <span className="font-semibold">{formattedFollowingCount}</span>
              <span className="text-xs text-muted-foreground">Following</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}