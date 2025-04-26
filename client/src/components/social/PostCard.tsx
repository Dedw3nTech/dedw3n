import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { getInitials } from "@/lib/utils";
import { useLocation } from "wouter";
import {
  MessageSquare,
  ThumbsUp,
  Share2,
  MoreHorizontal,
  Globe,
  Lock,
  CalendarDays,
  Loader2,
  Send,
} from "lucide-react";

// Type for the post object
interface Post {
  id: number;
  title?: string | null;
  content: string;
  createdAt: string;
  userId: number;
  user: {
    id: number;
    name: string;
    username: string;
    avatar?: string | null;
  };
  imageUrl?: string | null;
  videoUrl?: string | null;
  likes: number;
  comments: number;
  shares: number;
  tags?: string[] | null;
  community?: {
    id: number;
    name: string;
    visibility: "public" | "private" | "secret";
  } | null;
  isLiked?: boolean;
}

// Component props
interface PostCardProps {
  post: Post;
  showComments?: boolean;
  isDetailed?: boolean;
  onDelete?: () => void;
}

export default function PostCard({
  post,
  showComments = false,
  isDetailed = false,
  onDelete,
}: PostCardProps) {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isCommenting, setIsCommenting] = useState(false);
  const [commentText, setCommentText] = useState("");

  // Fetch comments if needed
  const {
    data: comments,
    isLoading: isLoadingComments,
    refetch: refetchComments,
  } = useQuery({
    queryKey: [`/api/posts/${post.id}/comments`],
    queryFn: async () => {
      const response = await fetch(`/api/posts/${post.id}/comments`);
      if (!response.ok) {
        throw new Error("Failed to fetch comments");
      }
      return response.json();
    },
    enabled: showComments || isDetailed,
  });

  // Like post mutation
  const likeMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest(
        post.isLiked ? "DELETE" : "POST",
        `/api/posts/${post.id}/like`,
        {}
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to like/unlike post");
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Invalidate query cache to refresh posts
      queryClient.invalidateQueries({ queryKey: ["/api/feed/personal"] });
      queryClient.invalidateQueries({ queryKey: ["/api/feed/communities"] });
      queryClient.invalidateQueries({ queryKey: ["/api/feed/recommended"] });
      queryClient.invalidateQueries({ queryKey: [`/api/posts/${post.id}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${post.user.username}/posts`] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to like/unlike post",
        variant: "destructive",
      });
    },
  });

  // Share post mutation
  const shareMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest(
        "POST",
        `/api/posts/${post.id}/share`,
        {}
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to share post");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Post shared successfully",
      });
      
      // Invalidate query cache to refresh posts
      queryClient.invalidateQueries({ queryKey: ["/api/feed/personal"] });
      queryClient.invalidateQueries({ queryKey: ["/api/feed/communities"] });
      queryClient.invalidateQueries({ queryKey: ["/api/feed/recommended"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to share post",
        variant: "destructive",
      });
    },
  });

  // Comment mutation
  const commentMutation = useMutation({
    mutationFn: async (comment: string) => {
      const response = await apiRequest(
        "POST",
        `/api/posts/${post.id}/comments`,
        { content: comment }
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to add comment");
      }
      
      return response.json();
    },
    onSuccess: () => {
      setCommentText("");
      setIsCommenting(false);
      
      // Refetch comments
      if (showComments || isDetailed) {
        refetchComments();
      }
      
      // Invalidate post query to update comment count
      queryClient.invalidateQueries({ queryKey: [`/api/posts/${post.id}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/feed/personal"] });
      queryClient.invalidateQueries({ queryKey: ["/api/feed/communities"] });
      queryClient.invalidateQueries({ queryKey: ["/api/feed/recommended"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add comment",
        variant: "destructive",
      });
    },
  });

  // Delete post mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest(
        "DELETE",
        `/api/posts/${post.id}`,
        {}
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete post");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Post deleted successfully",
      });
      
      // Invalidate query cache to refresh posts
      queryClient.invalidateQueries({ queryKey: ["/api/feed/personal"] });
      queryClient.invalidateQueries({ queryKey: ["/api/feed/communities"] });
      queryClient.invalidateQueries({ queryKey: ["/api/feed/recommended"] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${post.user.username}/posts`] });
      
      if (onDelete) {
        onDelete();
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete post",
        variant: "destructive",
      });
    },
  });

  const handleLike = () => {
    if (!currentUser) {
      toast({
        title: "Authentication required",
        description: "Please log in to like posts",
        variant: "destructive",
      });
      setLocation("/auth");
      return;
    }
    
    likeMutation.mutate();
  };

  const handleComment = () => {
    if (!currentUser) {
      toast({
        title: "Authentication required",
        description: "Please log in to comment on posts",
        variant: "destructive",
      });
      setLocation("/auth");
      return;
    }
    
    setIsCommenting(!isCommenting);
  };

  const handleShare = () => {
    if (!currentUser) {
      toast({
        title: "Authentication required",
        description: "Please log in to share posts",
        variant: "destructive",
      });
      setLocation("/auth");
      return;
    }
    
    shareMutation.mutate();
  };

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this post?")) {
      deleteMutation.mutate();
    }
  };

  const handleSubmitComment = () => {
    if (!commentText.trim()) return;
    commentMutation.mutate(commentText);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
    });
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-0">
        <div className="flex justify-between">
          <div className="flex items-center gap-2">
            <Avatar 
              className="h-10 w-10 cursor-pointer"
              onClick={() => setLocation(`/profile/${post.user.username}`)}
            >
              {post.user.avatar ? (
                <AvatarImage 
                  src={post.user.avatar} 
                  alt={post.user.name} 
                />
              ) : null}
              <AvatarFallback>
                {getInitials(post.user.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center">
                <p 
                  className="font-medium cursor-pointer hover:underline"
                  onClick={() => setLocation(`/profile/${post.user.username}`)}
                >
                  {post.user.name}
                </p>
                {post.community && (
                  <>
                    <span className="mx-1 text-muted-foreground">•</span>
                    <Badge 
                      variant="outline" 
                      className="text-xs flex items-center cursor-pointer"
                      onClick={() => setLocation(`/communities/${post.community!.id}`)}
                    >
                      {post.community.visibility === "public" ? (
                        <Globe className="h-3 w-3 mr-1" />
                      ) : (
                        <Lock className="h-3 w-3 mr-1" />
                      )}
                      {post.community.name}
                    </Badge>
                  </>
                )}
              </div>
              <p className="text-xs text-muted-foreground flex items-center">
                <CalendarDays className="h-3 w-3 inline mr-1" />
                {formatDate(post.createdAt)}
              </p>
            </div>
          </div>
          
          {currentUser && currentUser.id === post.userId && (
            <div className="relative group">
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-5 w-5" />
              </Button>
              <div className="absolute right-0 mt-2 w-36 bg-background shadow-md rounded-md p-1 hidden group-hover:block z-10 border">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full justify-start text-sm"
                  onClick={() => setLocation(`/posts/${post.id}/edit`)}
                >
                  <i className="ri-edit-line mr-2"></i>
                  Edit Post
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full justify-start text-sm text-destructive hover:text-destructive"
                  onClick={handleDelete}
                  disabled={deleteMutation.isPending}
                >
                  {deleteMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <i className="ri-delete-bin-line mr-2"></i>
                  )}
                  Delete Post
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="pt-4">
        {post.title && (
          <h3 className="text-lg font-medium mb-2">{post.title}</h3>
        )}
        
        <p className={`${isDetailed ? "" : "line-clamp-4"} mb-4`}>{post.content}</p>
        
        {post.imageUrl && (
          <div 
            className="rounded-md overflow-hidden mb-4 cursor-pointer"
            onClick={() => setLocation(`/posts/${post.id}`)}
          >
            <img 
              src={post.imageUrl} 
              alt="Post content" 
              className="w-full object-cover max-h-96"
            />
          </div>
        )}
        
        {post.videoUrl && (
          <div className="rounded-md overflow-hidden mb-4">
            <video 
              src={post.videoUrl} 
              controls 
              className="w-full"
            />
          </div>
        )}
        
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {post.tags.map((tag, index) => (
              <Badge key={index} variant="outline" className="cursor-pointer">
                #{tag}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between border-t pt-4 pb-4">
        <div className="flex gap-4">
          <Button 
            variant="ghost" 
            size="sm"
            className={`flex items-center gap-1 ${post.isLiked ? "text-blue-500" : ""}`}
            onClick={handleLike}
            disabled={likeMutation.isPending}
          >
            {likeMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ThumbsUp className={`h-4 w-4 ${post.isLiked ? "fill-current" : ""}`} />
            )}
            <span>{post.likes}</span>
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm"
            className="flex items-center gap-1"
            onClick={handleComment}
          >
            <MessageSquare className="h-4 w-4" />
            <span>{post.comments}</span>
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm"
            className="flex items-center gap-1"
            onClick={handleShare}
            disabled={shareMutation.isPending}
          >
            {shareMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Share2 className="h-4 w-4" />
            )}
            <span>{post.shares}</span>
          </Button>
        </div>
        
        {!isDetailed && (
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setLocation(`/posts/${post.id}`)}
          >
            View Details
          </Button>
        )}
      </CardFooter>
      
      {/* Comment input section */}
      {isCommenting && (
        <div className="p-4 pt-0 border-t">
          <div className="flex gap-3">
            <Avatar className="h-8 w-8">
              {currentUser?.avatar ? (
                <AvatarImage 
                  src={currentUser.avatar} 
                  alt={currentUser.name || "User"} 
                />
              ) : null}
              <AvatarFallback>
                {getInitials(currentUser?.name || "User")}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 relative">
              <Textarea 
                placeholder="Write a comment..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="pr-10 min-h-[80px]"
              />
              <Button
                size="icon"
                variant="ghost"
                className="absolute right-2 bottom-2"
                onClick={handleSubmitComment}
                disabled={commentMutation.isPending || !commentText.trim()}
              >
                {commentMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {/* Comments section */}
      {(showComments || isDetailed) && (
        <div className="p-4 pt-0 border-t">
          <h4 className="font-medium mb-4">Comments ({post.comments})</h4>
          
          {isLoadingComments ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : !comments || comments.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              No comments yet. Be the first to comment!
            </p>
          ) : (
            <div className="space-y-4">
              {comments.map((comment: any) => (
                <div key={comment.id} className="flex gap-3">
                  <Avatar className="h-8 w-8">
                    {comment.user?.avatar ? (
                      <AvatarImage 
                        src={comment.user.avatar} 
                        alt={comment.user.name} 
                      />
                    ) : null}
                    <AvatarFallback>
                      {getInitials(comment.user?.name || "User")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="bg-accent p-3 rounded-lg">
                      <div className="flex justify-between">
                        <p 
                          className="font-medium text-sm cursor-pointer hover:underline"
                          onClick={() => setLocation(`/profile/${comment.user.username}`)}
                        >
                          {comment.user.name}
                        </p>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(comment.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm mt-1">{comment.content}</p>
                    </div>
                    <div className="flex gap-4 mt-1 ml-2">
                      <button className="text-xs text-muted-foreground hover:text-foreground">
                        Like
                      </button>
                      <button className="text-xs text-muted-foreground hover:text-foreground">
                        Reply
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}