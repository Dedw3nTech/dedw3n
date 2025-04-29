import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useQuery } from "@tanstack/react-query";
import { ImageOff } from "lucide-react";

interface UserAvatarProps {
  userId: number;
  size?: "sm" | "md" | "lg";
}

export function UserAvatar({ userId, size = "md" }: UserAvatarProps) {
  const [imageError, setImageError] = useState(false);
  
  // Fetch user profile data
  const { data: user, isLoading } = useQuery({
    queryKey: [`/api/users/${userId}/profile`],
    queryFn: async () => {
      const response = await fetch(`/api/users/${userId}/profile`);
      if (!response.ok) {
        throw new Error("Failed to fetch user profile");
      }
      return response.json();
    },
    enabled: !!userId,
    staleTime: 300000, // 5 minutes caching
  });

  // Size mapping
  const sizeClass = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-14 h-14",
  }[size];

  // Generate initials for fallback
  const getInitials = () => {
    if (!user) return "U";
    if (user.name) {
      return user.name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .substring(0, 2);
    }
    return user.username?.substring(0, 2).toUpperCase() || "U";
  };

  // Handle avatar URLs that may be blob URLs from client-side uploads
  const getAvatarUrl = () => {
    if (!user || !user.avatar || imageError) return "";
    
    // If it's a blob URL from a client upload, it won't work directly
    // Return empty string to trigger the fallback
    if (user.avatar.startsWith("blob:")) return "";
    
    // Skip non-absolute paths that don't start with http or /
    if (!user.avatar.startsWith("http") && !user.avatar.startsWith("/")) return "";
    
    return user.avatar;
  };

  // Reset image error state if the user changes
  const handleImageError = () => {
    console.log(`Avatar image error for user ${userId}`);
    setImageError(true);
  };

  const validAvatarUrl = getAvatarUrl();

  return (
    <Avatar className={`${sizeClass} border`}>
      {validAvatarUrl ? (
        <AvatarImage 
          src={validAvatarUrl} 
          alt={user?.name || "User avatar"} 
          onError={handleImageError}
        />
      ) : null}
      <AvatarFallback className="bg-primary-foreground text-primary">
        {isLoading ? "..." : getInitials()}
      </AvatarFallback>
    </Avatar>
  );
}