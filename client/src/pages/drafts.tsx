import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import EnhancedPostCard from "@/components/social/EnhancedPostCard";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useMasterTranslation } from "@/hooks/use-master-translation";
import type { Post } from "@shared/schema";

export default function Drafts() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const { toast } = useToast();
  const { translateText } = useMasterTranslation();
  const [page, setPage] = useState(1);
  const limit = 20;
  const offset = (page - 1) * limit;
  const [, setLocation] = useLocation();
  const [hasRedirected, setHasRedirected] = useState(false);

  const draftPostsTitle = translateText("Draft Posts");
  const noDraftPostsYet = translateText("No draft posts yet");
  const failedToLoadDraftPosts = translateText("Failed to load draft posts");
  const errorTitle = translateText("Error");
  const previousText = translateText("Previous");
  const nextText = translateText("Next");
  const pageText = translateText("Page");

  useEffect(() => {
    if (!isAuthLoading && !user && !hasRedirected) {
      setHasRedirected(true);
      setLocation("/auth");
    }
  }, [user, isAuthLoading, hasRedirected, setLocation]);

  const {
    data: draftPosts,
    isLoading,
    isError,
    error,
  } = useQuery<Post[]>({
    queryKey: ["/api/draft-posts", page, limit],
    queryFn: async () => {
      const response = await fetch(`/api/draft-posts?limit=${limit}&offset=${offset}`, {
        credentials: 'include',
        headers: {
          'x-use-session': 'true',
          'x-client-auth': 'true'
        }
      });
      if (!response.ok) {
        throw new Error(failedToLoadDraftPosts);
      }
      return response.json();
    },
    enabled: !!user && !isAuthLoading,
  });

  useEffect(() => {
    if (isError && error) {
      toast({
        title: errorTitle,
        description: error?.message || failedToLoadDraftPosts,
        variant: "destructive",
      });
    }
  }, [isError, error, toast, errorTitle, failedToLoadDraftPosts]);

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

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <div className="flex items-center space-x-2 mb-6">
        <h1 className="text-2xl font-bold">{draftPostsTitle}</h1>
      </div>

      {isLoading ? (
        <div className="flex justify-center my-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : draftPosts?.length === 0 ? (
        <div className="text-center py-12 bg-muted/30 rounded-lg">
          <h3 className="text-xl font-medium mb-2">{noDraftPostsYet}</h3>
        </div>
      ) : (
        <div className="space-y-6">
          {draftPosts?.map((post) => (
            <EnhancedPostCard 
              key={post.id} 
              post={post} 
              showActions={true}
              showBookmarkButton={false}
            />
          ))}

          {draftPosts && draftPosts.length > 0 && (
            <div className="flex justify-center space-x-2 mt-8">
              <button
                className="px-4 py-2 text-black disabled:opacity-50"
                disabled={page === 1}
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                data-testid="button-prev-page"
              >
                {previousText}
              </button>
              <span className="px-4 py-2 text-black">
                {pageText} {page}
              </span>
              <button
                className="px-4 py-2 text-black disabled:opacity-50"
                disabled={(draftPosts?.length ?? 0) < limit}
                onClick={() => setPage((prev) => prev + 1)}
                data-testid="button-next-page"
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
