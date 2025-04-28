import { useFollow } from "@/hooks/useFollow";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";

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
  const { getFollowersCount, getFollowingCount } = useFollow();
  
  const { 
    data: followersCount, 
    isLoading: isFollowersLoading 
  } = getFollowersCount(userId);
  
  const { 
    data: followingCount, 
    isLoading: isFollowingLoading 
  } = getFollowingCount(userId);
  
  if (isFollowersLoading || isFollowingLoading) {
    return (
      <div className={`flex gap-4 text-sm text-muted-foreground ${className}`}>
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-5 w-20" />
      </div>
    );
  }
  
  const formattedFollowersCount = followersCount >= 1000 
    ? `${(followersCount / 1000).toFixed(1)}k` 
    : followersCount;
    
  const formattedFollowingCount = followingCount >= 1000 
    ? `${(followingCount / 1000).toFixed(1)}k` 
    : followingCount;
  
  if (linkToFollowersPage) {
    return (
      <div className={`flex gap-4 text-sm ${className}`}>
        <Link to={`/profile/${userId}/followers`}>
          <span className="hover:underline cursor-pointer">
            <span className="font-semibold">{formattedFollowersCount}</span> Followers
          </span>
        </Link>
        <Link to={`/profile/${userId}/following`}>
          <span className="hover:underline cursor-pointer">
            <span className="font-semibold">{formattedFollowingCount}</span> Following
          </span>
        </Link>
      </div>
    );
  }
  
  return (
    <div className={`flex gap-4 text-sm ${className}`}>
      <span>
        <span className="font-semibold">{formattedFollowersCount}</span> Followers
      </span>
      <span>
        <span className="font-semibold">{formattedFollowingCount}</span> Following
      </span>
    </div>
  );
}