import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";

interface UserDisplayNameProps {
  userId: number;
  showUsername?: boolean;
}

export function UserDisplayName({ userId, showUsername = false }: UserDisplayNameProps) {
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

  // Generate the display name
  const getDisplayName = () => {
    if (!user) return `User ${userId}`;
    
    if (showUsername) {
      return user.name ? `${user.name} (@${user.username})` : `@${user.username}`;
    }
    
    return user.name || user.username;
  };

  if (isLoading) {
    return <Skeleton className="h-4 w-20" />;
  }

  return <span>{getDisplayName()}</span>;
}