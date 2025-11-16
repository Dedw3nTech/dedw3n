import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import CreatePost from "@/components/social/CreatePost";
import { Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function EditPost({ params }: { params: { id: string } }) {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [, setLocation] = useLocation();
  const postId = parseInt(params.id);

  // Fetch the post data
  const { data: post, isLoading, error } = useQuery({
    queryKey: [`/api/posts/${postId}`],
    queryFn: async () => {
      const response = await fetch(`/api/posts/${postId}`, {
        credentials: 'include',
        headers: {
          'x-use-session': 'true',
          'x-client-auth': 'true'
        }
      });
      if (!response.ok) {
        throw new Error("Failed to load post");
      }
      return response.json();
    },
    enabled: !!user && !isNaN(postId),
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthLoading && !user) {
      setLocation("/auth");
    }
  }, [user, isAuthLoading, setLocation]);

  // Redirect if post is not a draft or user is not the owner
  useEffect(() => {
    if (post) {
      if (post.publishStatus !== 'draft') {
        setLocation("/drafts");
      }
      if (post.userId !== user?.id) {
        setLocation("/drafts");
      }
    }
  }, [post, user, setLocation]);

  if (isAuthLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-red-500">Failed to load post for editing.</p>
            <button
              onClick={() => setLocation("/drafts")}
              className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded"
            >
              Back to Drafts
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Edit Draft Post</h1>
      <CreatePost
        editingPost={post}
        onSuccess={() => {
          setLocation("/drafts");
        }}
      />
    </div>
  );
}
