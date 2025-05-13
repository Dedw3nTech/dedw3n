import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Container } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PostCard } from "@/components/social/PostCard";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import CommentList from "@/components/social/CommentList";
import CommentForm from "@/components/social/CommentForm";

interface Post {
  id: number;
  userId: number;
  content: string;
  title?: string | null;
  contentType?: string;
  imageUrl?: string | null;
  videoUrl?: string | null;
  productId?: number | null;
  likes: number;
  comments: number;
  shares: number;
  views: number;
  tags?: string[];
  isPromoted?: boolean;
  promotionEndDate?: string | null;
  isPublished?: boolean;
  isFlagged?: boolean;
  createdAt: string;
  user: {
    id: number;
    name: string;
    username: string;
    avatar?: string | null;
  };
}

interface Comment {
  id: number;
  userId: number;
  postId: number;
  content: string;
  createdAt: string;
  user: {
    id: number;
    name: string;
    username: string;
    avatar?: string | null;
  };
  isLiked?: boolean;
  likes?: number;
}

export default function PostDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const numericId = parseInt(id || "0", 10);

  // Query to fetch post details
  const { 
    data: post, 
    isLoading: isPostLoading, 
    error: postError 
  } = useQuery({
    queryKey: [`/api/posts/${numericId}`],
    enabled: !!numericId,
  });

  // Query to fetch post comments
  const { 
    data: commentsData, 
    isLoading: isCommentsLoading, 
    error: commentsError,
    refetch: refetchComments
  } = useQuery({
    queryKey: [`/api/posts/${numericId}/comments`],
    enabled: !!numericId,
  });

  // Handle errors
  useEffect(() => {
    if (postError) {
      toast({
        title: "Error loading post",
        description: "Failed to load post details. Please try again later.",
        variant: "destructive",
      });
    }

    if (commentsError) {
      toast({
        title: "Error loading comments",
        description: "Failed to load comments. Please try again later.",
        variant: "destructive",
      });
    }
  }, [postError, commentsError, toast]);

  // Handle loading state
  if (isPostLoading) {
    return (
      <Container className="py-6">
        <Button 
          variant="ghost" 
          className="mb-4"
          onClick={() => setLocation("/wall")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Feed
        </Button>
        
        <Card className="p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div>
              <Skeleton className="h-4 w-32 mb-2" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-3/4 mb-2" />
          <Skeleton className="h-4 w-5/6 mb-6" />
          <Skeleton className="h-40 w-full rounded-md mb-4" />
          <div className="flex justify-between">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-20" />
          </div>
        </Card>
        
        <div className="mb-6">
          <Skeleton className="h-8 w-36 mb-4" />
          <Card className="p-4 mb-4">
            <div className="flex items-start gap-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-4 w-32 mb-2" />
                <Skeleton className="h-3 w-full mb-1" />
                <Skeleton className="h-3 w-3/4" />
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-start gap-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-4 w-32 mb-2" />
                <Skeleton className="h-3 w-full mb-1" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          </Card>
        </div>
      </Container>
    );
  }

  // Handle missing post data
  if (!post && !isPostLoading) {
    return (
      <Container className="py-6">
        <Button 
          variant="ghost" 
          className="mb-4"
          onClick={() => setLocation("/wall")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Feed
        </Button>
        
        <Card className="p-6 text-center">
          <div className="py-12">
            <h2 className="text-2xl font-bold mb-2">Post Not Found</h2>
            <p className="text-muted-foreground mb-6">The post you're looking for doesn't exist or has been removed.</p>
            <Button onClick={() => setLocation("/wall")}>
              Return to Feed
            </Button>
          </div>
        </Card>
      </Container>
    );
  }

  return (
    <Container className="py-6">
      <Button 
        variant="ghost" 
        className="mb-4"
        onClick={() => setLocation("/wall")}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Feed
      </Button>
      
      {post && (
        <div className="mb-8">
          <PostCard 
            post={post} 
            isDetailed={true} 
            onDelete={() => setLocation("/wall")} 
          />
        </div>
      )}
      
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-4">Comments</h2>
        
        <Card className="p-4 mb-6">
          <CommentForm 
            postId={numericId} 
            onSuccess={refetchComments} 
          />
        </Card>
        
        {isCommentsLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : commentsData && commentsData.length > 0 ? (
          <CommentList 
            comments={commentsData} 
            onCommentUpdate={refetchComments} 
          />
        ) : (
          <Card className="p-6 text-center">
            <p className="text-muted-foreground">No comments yet. Be the first to comment!</p>
          </Card>
        )}
      </div>
    </Container>
  );
}