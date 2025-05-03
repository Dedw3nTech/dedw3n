import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useQuery } from "@tanstack/react-query";
import { User } from "lucide-react";
import { sanitizeImageUrl } from "@/lib/queryClient";

interface UserAvatarProps {
  userId: number;
  username?: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  onClick?: () => void;
}

export function UserAvatar({ userId, username, size = "md", className = "", onClick }: UserAvatarProps) {
  const [imageError, setImageError] = useState(false);
  
  // Size mapping
  const sizeClass = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-14 h-14 text-base",
    xl: "w-24 h-24 text-xl"
  }[size];

  // Use the new profile picture API endpoint that supports both userId and username
  const identifier = username || userId;
  
  // Fetch profile picture data using the new dedicated endpoint
  const { data: avatarData, isLoading } = useQuery({
    queryKey: [`/api/users/${identifier}/profilePicture`],
    enabled: !!identifier,
    staleTime: 300000, // 5 minutes caching
  });

  // Reset image error state if the user changes
  const handleImageError = () => {
    console.log(`Avatar image error for user ${identifier}`);
    setImageError(true);
  };

  // Get avatar URL safely
  const validAvatarUrl = !avatarData || !avatarData.url || imageError 
    ? "" 
    : sanitizeImageUrl(
        avatarData.url, 
        `/assets/default-avatar.png`
      );

  // Get initials for fallback
  const getInitials = () => {
    if (avatarData?.initials) {
      return avatarData.initials;
    } else if (avatarData?.username) {
      return avatarData.username.charAt(0).toUpperCase();
    } else {
      return username ? username.charAt(0).toUpperCase() : "U";
    }
  };

  return (
    <Avatar className={`${sizeClass} border ${className}`} onClick={onClick}>
      {validAvatarUrl ? (
        <AvatarImage 
          src={validAvatarUrl} 
          alt={avatarData?.username || username || "User avatar"} 
          onError={handleImageError}
        />
      ) : null}
      <AvatarFallback className="bg-primary-foreground text-primary">
        {isLoading ? (
          "..."
        ) : (
          getInitials()
        )}
      </AvatarFallback>
    </Avatar>
  );
}