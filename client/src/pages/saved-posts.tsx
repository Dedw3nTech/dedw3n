import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, BookmarkIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import EnhancedPostCard from "@/components/social/EnhancedPostCard";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";

export default function SavedPosts() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const { toast } = useToast();
  const [page, setPage] = useState(1);
  const limit = 10;
  const offset = (page - 1) * limit;

  const {
    data: savedPosts,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["/api/saved-posts", page, limit],
    queryFn: async () => {
      const response = await fetch(`/api/saved-posts?limit=${limit}&offset=${offset}`);
      if (!response.ok) {
        throw new Error("Failed to load saved posts");
      }
      return response.json();
    },
    enabled: !!user,
  });

  if (isAuthLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" />;
  }

  if (isError) {
    toast({
      title: "Error",
      description: error?.message || "Failed to load saved posts",
      variant: "destructive",
    });
  }

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <div className="flex items-center space-x-2 mb-6">
        <BookmarkIcon className="h-6 w-6 text-yellow-500" />
        <h1 className="text-2xl font-bold">Saved Posts</h1>
      </div>

      {isLoading ? (
        <div className="flex justify-center my-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : savedPosts?.length === 0 ? (
        <div className="text-center py-12 bg-muted/30 rounded-lg">
          <BookmarkIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-medium mb-2">No saved posts yet</h3>
          <p className="text-muted-foreground">
            When you save posts, they will appear here for you to find later.
          </p>
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
                Previous
              </button>
              <span className="px-4 py-2 bg-muted rounded">
                Page {page}
              </span>
              <button
                className="px-4 py-2 bg-primary text-primary-foreground rounded disabled:opacity-50"
                disabled={savedPosts?.length < limit}
                onClick={() => setPage((prev) => prev + 1)}
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}