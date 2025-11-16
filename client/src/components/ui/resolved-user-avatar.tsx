import { UserAvatar } from "@/components/ui/user-avatar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ResolvedUserAvatarProps {
  // Preferred: Use userId or username for proper cache-busting
  userId?: number | string;
  username?: string;
  
  // Fallback: Direct avatar URL (deprecated, use only during migration)
  avatarUrl?: string | null;
  
  // Display properties
  name?: string;
  initials?: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  onClick?: () => void;
  
  // For cases where we have a full user object
  user?: {
    id?: number | string;
    userId?: number | string;
    username?: string;
    avatar?: string | null;
    avatarUrl?: string | null;
    profilePicture?: string | null;
    name?: string;
  };
}

/**
 * ResolvedUserAvatar - Migration helper component
 * 
 * This component helps transition from direct AvatarImage usage to UserAvatar.
 * It handles multiple prop patterns and falls back gracefully when identifiers aren't available.
 * 
 * Priority:
 * 1. Use userId/username for proper cache-busting with UserAvatar
 * 2. Extract from user object if provided
 * 3. Fall back to direct URL rendering (temporary during migration)
 */
export function ResolvedUserAvatar({
  userId,
  username,
  avatarUrl,
  name,
  initials,
  size = "md",
  className = "",
  onClick,
  user
}: ResolvedUserAvatarProps) {
  
  // Extract identifiers from user object if provided
  const resolvedUserId = userId || user?.userId || user?.id;
  const resolvedUsername = username || user?.username;
  const resolvedAvatarUrl = avatarUrl || user?.avatarUrl || user?.avatar || user?.profilePicture;
  const resolvedName = name || user?.name;
  
  // Compute initials if not provided
  const computedInitials = initials || (() => {
    if (resolvedName) {
      return resolvedName.split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);
    }
    if (resolvedUsername) {
      return resolvedUsername.substring(0, 2).toUpperCase();
    }
    return '??';
  })();
  
  // Preferred: Use UserAvatar when we have identifiers
  // Convert userId to number if it's a string
  const numericUserId = typeof resolvedUserId === 'string' 
    ? parseInt(resolvedUserId, 10) 
    : resolvedUserId;
  
  if (numericUserId && typeof numericUserId === 'number' && !isNaN(numericUserId)) {
    return (
      <UserAvatar
        userId={numericUserId}
        username={resolvedUsername}
        size={size}
        className={className}
        onClick={onClick}
      />
    );
  }
  
  // Fallback: Direct URL rendering (temporary during migration)
  // This path should be eliminated once all components pass proper identifiers
  const sizeClass = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-14 h-14",
    xl: "w-24 h-24"
  }[size];
  
  return (
    <Avatar className={`${sizeClass} ${className}`} onClick={onClick}>
      {resolvedAvatarUrl ? (
        <AvatarImage 
          src={resolvedAvatarUrl} 
          alt={resolvedName || "User"}
        />
      ) : null}
      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
        {computedInitials}
      </AvatarFallback>
    </Avatar>
  );
}