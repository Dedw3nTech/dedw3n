import { useFollow } from "@/hooks/useFollow";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface FollowButtonProps {
  userId: number;
  size?: "default" | "sm" | "lg" | "icon";
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  className?: string;
}

export default function FollowButton({ userId, size = "default", variant = "outline", className = "" }: FollowButtonProps) {
  const { user } = useAuth();
  const { 
    checkFollowStatus, 
    follow, 
    unfollow, 
    isFollowLoading, 
    isUnfollowLoading 
  } = useFollow();
  
  const { data, isLoading } = checkFollowStatus(userId);
  const isFollowing = data?.isFollowing;
  
  // Don't render button if this is the current user
  if (user?.id === userId) {
    return null;
  }
  
  // If not logged in, don't show follow button
  if (!user) {
    return null;
  }
  
  const handleToggleFollow = () => {
    if (isFollowing) {
      unfollow(userId);
    } else {
      follow(userId);
    }
  };
  
  if (isLoading) {
    return (
      <Button 
        size={size} 
        variant={variant} 
        disabled 
        className={className}
      >
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
        Loading
      </Button>
    );
  }
  
  return (
    <Button 
      onClick={handleToggleFollow}
      size={size} 
      variant={isFollowing ? "secondary" : variant}
      disabled={isFollowLoading || isUnfollowLoading}
      className={className}
    >
      {(isFollowLoading || isUnfollowLoading) ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
          {isFollowing ? "Unfollowing..." : "Following..."}
        </>
      ) : (
        isFollowing ? "Unfollow" : "Follow"
      )}
    </Button>
  );
}