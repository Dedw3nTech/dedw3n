import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft, Flag, Share2, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import PageHeader from "@/components/layout/PageHeader";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import PostCard from "@/components/social/PostCard";
import CommentList from "@/components/social/CommentList";
import CommentForm from "@/components/social/CommentForm";
import { formatDistanceToNow } from "date-fns";
import { getInitials } from "@/lib/utils";
import { sanitizeImageUrl } from "@/lib/queryClient";

// Define the Post interface to match what the API returns
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

// Comment interface
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
}

export default function PostDetailPage() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const postId = parseInt(id);

  // Check for valid post ID
  useEffect(() => {
    if (isNaN(postId)) {
      toast({
        title: "Invalid post ID",
        description: "The post you're looking for doesn't exist",
        variant: "destructive",
      });
      setLocation("/wall");
    }
  }, [postId, toast, setLocation]);

  // Fetch the post details from the API
  const {
    data: post,
    isLoading: isLoadingPost,
    isError: isPostError,
    refetch: refetchPost,
  } = useQuery<Post>({
    queryKey: [`/api/posts/${postId}`],
    enabled: !isNaN(postId),
  });

  // Fetch comments for this post
  const {
    data: comments,
    isLoading: isLoadingComments,
    isError: isCommentsError,
    refetch: refetchComments,
  } = useQuery<Comment[]>({
    queryKey: [`/api/posts/${postId}/comments`],
    enabled: !isNaN(postId),
  });

  // Handle sharing the post
  const handleShare = () => {
    navigator.clipboard.writeText(`${window.location.origin}/posts/${postId}`);
    toast({
      title: "Link copied",
      description: "Post link copied to clipboard",
    });
  };

  // Handle reporting the post
  const handleReport = () => {
    toast({
      title: "Post reported",
      description: "Thank you for reporting this post. We'll review it shortly.",
    });
  };

  // Handle successful comment submission
  const handleCommentSuccess = () => {
    refetchComments();
    refetchPost();
  };

  if (isNaN(postId)) {
    return null;
  }

  if (isLoadingPost) {
    return (
      <div className="container max-w-screen-xl py-6">
        <div className="flex justify-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (isPostError || !post) {
    return (
      <div className="container max-w-screen-xl py-6">
        <div className="text-center py-10">
          <h2 className="text-xl font-bold mb-2">Post not found</h2>
          <p className="text-muted-foreground mb-4">
            The post you're looking for doesn't exist or has been removed.
          </p>
          <Button onClick={() => setLocation("/wall")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Go back to wall
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen">
      <PageHeader
        title="Post Details"
        description="View and interact with this post"
        icon={<MessageCircle className="h-6 w-6" />}
      />

      <div className="container max-w-screen-xl py-6">
        <Button
          variant="outline"
          className="mb-6"
          onClick={() => setLocation("/wall")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to wall
        </Button>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left column for post details */}
          <div className="md:col-span-2">
            <Card className="p-6">
              {/* Post header with user info */}
              <div className="flex items-center mb-4">
                <Avatar className="h-10 w-10 mr-3">
                  {post.user.avatar ? (
                    <AvatarImage
                      src={sanitizeImageUrl(post.user.avatar)}
                      alt={post.user.name || "User"}
                    />
                  ) : null}
                  <AvatarFallback className="text-sm">
                    {getInitials(post.user.name || "User")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-medium">{post.user.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    @{post.user.username} •{" "}
                    {formatDistanceToNow(new Date(post.createdAt), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
              </div>

              {/* Post content */}
              <div className="mb-4">
                {post.title && (
                  <h2 className="text-xl font-bold mb-2">{post.title}</h2>
                )}
                <p className="whitespace-pre-line">{post.content}</p>
              </div>

              {/* Post image if available */}
              {post.imageUrl && (
                <div className="mb-4 rounded-md overflow-hidden">
                  <img
                    src={sanitizeImageUrl(post.imageUrl)}
                    alt="Post"
                    className="w-full object-cover"
                  />
                </div>
              )}

              {/* Post video if available */}
              {post.videoUrl && (
                <div className="mb-4 rounded-md overflow-hidden">
                  <video
                    src={post.videoUrl}
                    controls
                    className="w-full"
                  ></video>
                </div>
              )}

              {/* Tags if available */}
              {post.tags && post.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {post.tags.map((tag, index) => (
                    <div
                      key={index}
                      className="text-sm bg-muted px-2 py-1 rounded-md"
                    >
                      #{tag}
                    </div>
                  ))}
                </div>
              )}

              {/* Post stats and actions */}
              <div className="flex justify-between items-center mt-6">
                <div className="flex space-x-4 text-sm text-muted-foreground">
                  <span>{post.likes} likes</span>
                  <span>{post.comments} comments</span>
                  <span>{post.shares} shares</span>
                  <span>{post.views} views</span>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleShare}
                  >
                    <Share2 className="h-4 w-4 mr-2" /> Share
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleReport}
                    className="text-destructive hover:text-destructive"
                  >
                    <Flag className="h-4 w-4 mr-2" /> Report
                  </Button>
                </div>
              </div>
            </Card>

            {/* Comments section */}
            <div className="mt-6">
              <h3 className="font-medium text-lg mb-4">Comments</h3>
              
              {user ? (
                <CommentForm postId={postId} onSuccess={handleCommentSuccess} />
              ) : (
                <Card className="p-4 mb-6">
                  <p className="text-center text-muted-foreground">
                    Please{" "}
                    <Button
                      variant="link"
                      className="p-0 h-auto"
                      onClick={() => setLocation("/auth")}
                    >
                      log in
                    </Button>{" "}
                    to leave a comment.
                  </p>
                </Card>
              )}

              {isLoadingComments ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : isCommentsError || !comments ? (
                <p className="text-center text-muted-foreground py-6">
                  Failed to load comments. Please try again.
                </p>
              ) : comments.length === 0 ? (
                <p className="text-center text-muted-foreground py-6">
                  No comments yet. Be the first to comment!
                </p>
              ) : (
                <CommentList 
                  comments={comments} 
                  onCommentUpdate={refetchComments} 
                />
              )}
            </div>
          </div>

          {/* Right column for related content */}
          <div className="md:col-span-1">
            <Card className="p-6 mb-6">
              <h3 className="font-medium mb-4">About the Author</h3>
              <div className="flex items-center mb-4">
                <Avatar className="h-16 w-16 mr-4">
                  {post.user.avatar ? (
                    <AvatarImage
                      src={sanitizeImageUrl(post.user.avatar)}
                      alt={post.user.name || "User"}
                    />
                  ) : null}
                  <AvatarFallback className="text-lg">
                    {getInitials(post.user.name || "User")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="font-medium">{post.user.name}</h4>
                  <p className="text-sm text-muted-foreground">
                    @{post.user.username}
                  </p>
                </div>
              </div>
              <Button
                className="w-full"
                onClick={() => setLocation(`/profile/${post.user.username}`)}
              >
                View Profile
              </Button>
            </Card>

            {/* Related posts could be added here */}
          </div>
        </div>
      </div>
    </div>
  );
}