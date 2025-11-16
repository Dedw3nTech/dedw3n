import { useState, useEffect } from "react";
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

interface AvatarData {
  url?: string;
  username?: string;
  userId?: number;
  initials?: string;
  avatarUpdatedAt?: string;
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

  // Use the profile picture API endpoint that supports both userId and username
  // Prefer userId over username for more reliable lookups
  // Encode identifier to handle special characters in usernames
  const identifier = encodeURIComponent(userId || username || '');
  
  // Add a timestamp to force refetch after uploads
  // This ensures the query key changes when avatar is updated
  const [cacheVersion, setCacheVersion] = useState(Date.now());
  
  // Listen for avatar update events
  useEffect(() => {
    const handleAvatarUpdate = () => {
      setCacheVersion(Date.now());
    };
    
    // Listen for custom avatar update event
    window.addEventListener('avatar-updated', handleAvatarUpdate);
    
    return () => {
      window.removeEventListener('avatar-updated', handleAvatarUpdate);
    };
  }, []);
  
  // Fetch profile picture data using the dedicated endpoint with performance-friendly caching
  // Cache busting handled by avatarUpdatedAt timestamp in URL query param
  const { data: avatarData, isLoading, error } = useQuery<AvatarData>({
    queryKey: [`/api/users/${identifier}/profilePicture`, cacheVersion],
    enabled: !!identifier,
    staleTime: 1000, // Keep stale for only 1 second to ensure fresh data after upload
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes (was cacheTime in v4)
    refetchOnMount: true, // Refetch on mount to get latest avatar
    refetchOnWindowFocus: true, // Refetch when window regains focus
  });

  // Debug logging
  useEffect(() => {
    if (avatarData) {
      console.log(`[UserAvatar] Data for ${identifier}:`, avatarData);
    }
    if (error) {
      console.error(`[UserAvatar] Error fetching data for ${identifier}:`, error);
    }
  }, [avatarData, error, identifier]);

  // Reset image error state when avatar URL changes
  useEffect(() => {
    setImageError(false);
  }, [avatarData?.url]);

  // Reset image error state if the user changes
  const handleImageError = (e: any) => {
    console.error(`[UserAvatar] Image load error for ${identifier}:`, {
      src: e?.target?.src,
      avatarUrl: avatarData?.url,
      error: e
    });
    setImageError(true);
  };

  // Get avatar URL with enforced cache-busting via avatarUpdatedAt timestamp
  const getAvatarUrl = () => {
    if (!avatarData || !avatarData.url || imageError) {
      return "";
    }
    
    let url = avatarData.url;
    
    // Ensure cache-busting query parameter is present
    // Backend provides ?v=timestamp, but enforce it client-side as fallback
    if (!url.includes('?v=') && !url.includes('&v=')) {
      const timestamp = avatarData.avatarUpdatedAt 
        ? new Date(avatarData.avatarUpdatedAt).getTime() 
        : Date.now();
      const separator = url.includes('?') ? '&' : '?';
      url = `${url}${separator}v=${timestamp}`;
    }
    
    return sanitizeImageUrl(url, `/assets/default-avatar.png`);
  };
  
  const validAvatarUrl = getAvatarUrl();

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
      <AvatarImage 
        src={validAvatarUrl || '/assets/default-avatar.png'} 
        alt={avatarData?.username || username || "User avatar"} 
        onError={handleImageError}
      />
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