import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  Bookmark, 
  Eye, 
  ArrowLeft,
  Send,
  MoreHorizontal,
  Flag
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Post {
  id: number;
  userId: number;
  content: string;
  title: string | null;
  contentType: string;
  imageUrl: string | null;
  videoUrl: string | null;
  likes: number;
  comments: number;
  shares: number;
  views: number;
  createdAt: string;
  updatedAt: string;
  user: {
    id: number;
    username: string;
    name: string;
    avatar: string | null;
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
    username: string;
    name: string;
    avatar: string | null;
  };
}

export default function PostDetail() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [comment, setComment] = useState("");
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // Fetch post data
  const { data: post, isLoading: postLoading, error: postError } = useQuery<Post>({
    queryKey: [`/api/posts/${id}`],
    enabled: !!id,
  });

  // Fetch comments
  const { data: comments = [], isLoading: commentsLoading } = useQuery<Comment[]>({
    queryKey: [`/api/posts/${id}/comments`],
    enabled: !!id,
  });

  // Like mutation
  const likeMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/posts/${id}/like`);
      return response.json();
    },
    onSuccess: () => {
      setIsLiked(!isLiked);
      queryClient.invalidateQueries({ queryKey: [`/api/posts/${id}`] });
      toast({
        title: isLiked ? "Post unliked" : "Post liked",
        description: isLiked ? "Removed from your liked posts" : "Added to your liked posts",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update like status",
        variant: "destructive",
      });
    },
  });

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/posts/${id}/save`);
      return response.json();
    },
    onSuccess: () => {
      setIsSaved(!isSaved);
      toast({
        title: isSaved ? "Post unsaved" : "Post saved",
        description: isSaved ? "Removed from your saved posts" : "Added to your saved posts",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update save status",
        variant: "destructive",
      });
    },
  });

  // Comment mutation
  const commentMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await apiRequest("POST", `/api/posts/${id}/comments`, {
        content,
      });
      return response.json();
    },
    onSuccess: () => {
      setComment("");
      queryClient.invalidateQueries({ queryKey: [`/api/posts/${id}/comments`] });
      queryClient.invalidateQueries({ queryKey: [`/api/posts/${id}`] });
      toast({
        title: "Comment posted",
        description: "Your comment has been added successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to post comment",
        variant: "destructive",
      });
    },
  });

  // Share mutation
  const shareMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/posts/${id}/share`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/posts/${id}`] });
      toast({
        title: "Post shared",
        description: "Post has been shared successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to share post",
        variant: "destructive",
      });
    },
  });

  // Handle comment submission
  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim() || !isAuthenticated) return;
    commentMutation.mutate(comment);
  };

  // Handle share
  const handleShare = () => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication required",
        description: "Please log in to share posts",
        variant: "destructive",
      });
      return;
    }
    shareMutation.mutate();
  };

  // Handle like
  const handleLike = () => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication required",
        description: "Please log in to like posts",
        variant: "destructive",
      });
      return;
    }
    likeMutation.mutate();
  };

  // Handle save
  const handleSave = () => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication required",
        description: "Please log in to save posts",
        variant: "destructive",
      });
      return;
    }
    saveMutation.mutate();
  };

  // Update view count on page load
  useEffect(() => {
    if (id) {
      apiRequest("POST", `/api/posts/${id}/view`).catch(() => {
        // Silent fail for view tracking
      });
    }
  }, [id]);

  if (postLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (postError || !post) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-2">Post Not Found</h1>
            <p className="text-muted-foreground mb-4">The post you're looking for doesn't exist or has been removed.</p>
            <Button onClick={() => setLocation("/community")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Feed
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Back button */}
        <Button 
          variant="ghost" 
          onClick={() => setLocation("/community")}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Feed
        </Button>

        {/* Main post */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <Avatar>
                  <AvatarImage src={post.user.avatar || ""} />
                  <AvatarFallback>{post.user.name[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold">{post.user.name}</h3>
                  <p className="text-sm text-muted-foreground">@{post.user.username}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="secondary">{post.contentType}</Badge>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* Title */}
            {post.title && (
              <h1 className="text-2xl font-bold">{post.title}</h1>
            )}
            
            {/* Content */}
            <div className="text-base leading-relaxed whitespace-pre-wrap">
              {post.content}
            </div>
            
            {/* Media */}
            {post.imageUrl && (
              <div className="rounded-lg overflow-hidden">
                <img 
                  src={post.imageUrl} 
                  alt="Post image" 
                  className="w-full h-auto max-h-96 object-cover"
                />
              </div>
            )}
            
            {post.videoUrl && (
              <div className="rounded-lg overflow-hidden">
                <video 
                  src={post.videoUrl} 
                  controls 
                  className="w-full h-auto max-h-96"
                />
              </div>
            )}
            
            {/* Stats */}
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="flex items-center space-x-6 text-sm text-muted-foreground">
                <span className="flex items-center space-x-1">
                  <Eye className="h-4 w-4" />
                  <span>{post.views}</span>
                </span>
                <span>{post.likes} likes</span>
                <span>{post.comments} comments</span>
                <span>{post.shares} shares</span>
              </div>
            </div>
            
            {/* Actions */}
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLike}
                  className={isLiked ? "text-red-500" : ""}
                  disabled={likeMutation.isPending}
                >
                  <Heart className={`h-4 w-4 mr-1 ${isLiked ? "fill-current" : ""}`} />
                  Like
                </Button>
                <Button variant="ghost" size="sm">
                  <MessageCircle className="h-4 w-4 mr-1" />
                  Comment
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleShare}
                  disabled={shareMutation.isPending}
                >
                  <Share2 className="h-4 w-4 mr-1" />
                  Share
                </Button>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSave}
                  className={isSaved ? "text-blue-500" : ""}
                  disabled={saveMutation.isPending}
                >
                  <Bookmark className={`h-4 w-4 ${isSaved ? "fill-current" : ""}`} />
                </Button>
                <Button variant="ghost" size="sm" className="text-red-500">
                  <Flag className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Comments section */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">Comments ({comments.length})</h2>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* Comment form */}
            {isAuthenticated && (
              <form onSubmit={handleCommentSubmit} className="space-y-3">
                <div className="flex items-start space-x-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.avatar || ""} />
                    <AvatarFallback>{user?.name?.[0] || "U"}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <Textarea
                      placeholder="Write a comment..."
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      className="min-h-[80px] resize-none"
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button 
                    type="submit" 
                    disabled={!comment.trim() || commentMutation.isPending}
                    size="sm"
                  >
                    <Send className="h-4 w-4 mr-1" />
                    Post Comment
                  </Button>
                </div>
              </form>
            )}
            
            {!isAuthenticated && (
              <div className="text-center py-6 text-muted-foreground">
                <p>Please log in to post comments</p>
              </div>
            )}
            
            <Separator />
            
            {/* Comments list */}
            {commentsLoading ? (
              <div className="text-center py-6">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
              </div>
            ) : comments.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <MessageCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No comments yet</p>
                <p className="text-sm">Be the first to comment on this post</p>
              </div>
            ) : (
              <div className="space-y-4">
                {comments.map((comment) => (
                  <div key={comment.id} className="flex items-start space-x-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={comment.user.avatar || ""} />
                      <AvatarFallback>{comment.user.name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="bg-muted rounded-lg p-3">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-medium text-sm">{comment.user.name}</span>
                          <span className="text-xs text-muted-foreground">
                            @{comment.user.username}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                          </span>
                        </div>
                        <p className="text-sm">{comment.content}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}