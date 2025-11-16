import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, BookmarkIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import EnhancedPostCard from "@/components/social/EnhancedPostCard";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useMasterTranslation } from "@/hooks/use-master-translation";

export default function SavedPosts() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const { toast } = useToast();
  const { translateText } = useMasterTranslation();
  const [page, setPage] = useState(1);
  const limit = 10;
  const offset = (page - 1) * limit;
  const [, setLocation] = useLocation();
  const [hasRedirected, setHasRedirected] = useState(false);

  const savedPostsTitle = translateText("Saved Posts");
  const noSavedPostsYet = translateText("No saved posts yet");
  const failedToLoadSavedPosts = translateText("Failed to load saved posts");
  const errorTitle = translateText("Error");
  const previousText = translateText("Previous");
  const nextText = translateText("Next");
  const pageText = translateText("Page");

  // Handle auth redirect using useEffect to prevent render loop
  useEffect(() => {
    if (!isAuthLoading && !user && !hasRedirected) {
      setHasRedirected(true);
      setLocation("/auth");
    }
  }, [user, isAuthLoading, hasRedirected, setLocation]);

  const {
    data: savedPosts,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["/api/saved-posts", page, limit],
    queryFn: async () => {
      const response = await fetch(`/api/saved-posts?limit=${limit}&offset=${offset}`, {
        credentials: 'include',
        headers: {
          'x-use-session': 'true',
          'x-client-auth': 'true'
        }
      });
      if (!response.ok) {
        throw new Error(failedToLoadSavedPosts);
      }
      return response.json();
    },
    enabled: !!user && !isAuthLoading,
  });

  if (isAuthLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (isError) {
    toast({
      title: errorTitle,
      description: error?.message || failedToLoadSavedPosts,
      variant: "destructive",
    });
  }

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{savedPostsTitle}</h1>
      </div>

      {isLoading ? (
        <div className="flex justify-center my-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : savedPosts?.length === 0 ? (
        <div className="text-center py-12 bg-muted/30 rounded-lg">
          <h3 className="text-xl font-medium mb-2">{noSavedPostsYet}</h3>
        </div>
      ) : (
        <div className="space-y-6">
          {savedPosts?.map((post: any) => (
            <EnhancedPostCard 
              key={post.id} 
              post={post} 
              showActions={true}
              showBookmarkButton={true}
            />
          ))}

          {savedPosts?.length > 0 && (
            <div className="flex justify-center space-x-2 mt-8">
              <button
                className="px-4 py-2 bg-primary text-primary-foreground rounded disabled:opacity-50"
                disabled={page === 1}
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              >
                {previousText}
              </button>
              <span className="px-4 py-2 bg-muted rounded">
                {pageText} {page}
              </span>
              <button
                className="px-4 py-2 bg-primary text-primary-foreground rounded disabled:opacity-50"
                disabled={savedPosts?.length < limit}
                onClick={() => setPage((prev) => prev + 1)}
              >
                {nextText}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}