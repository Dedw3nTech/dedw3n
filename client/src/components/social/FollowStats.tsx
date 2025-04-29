import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { useUserStats, UserStats } from "@/hooks/useUserStats";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, Users, UserPlus } from "lucide-react";

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
  const { getUserStats } = useUserStats();
  
  const { 
    data: userStats, 
    isLoading
  } = getUserStats(userId);
  
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
  
  const stats = userStats || { postCount: 0, followerCount: 0, followingCount: 0 };
  
  const formattedPostCount = formatNumber(stats.postCount);
  const formattedFollowersCount = formatNumber(stats.followerCount);
  const formattedFollowingCount = formatNumber(stats.followingCount);
  
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