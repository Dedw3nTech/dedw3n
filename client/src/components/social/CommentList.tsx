import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useMutation } from "@tanstack/react-query";
import { getInitials, formatDate } from "@/lib/utils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { ThumbsUp, MessageSquare, Trash2 } from "lucide-react";
import { useLocation } from "wouter";

export interface Comment {
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

interface CommentListProps {
  comments: Comment[];
  onCommentUpdate?: () => void;
}

export default function CommentList({ comments, onCommentUpdate }: CommentListProps) {
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const [, setLocation] = useLocation();

  // Delete comment mutation
  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: number) => {
      const response = await apiRequest(
        "DELETE",
        `/api/comments/${commentId}`,
        {}
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete comment");
      }
      
      return response.json();
    },
    onSuccess: () => {
      // After successful deletion, refresh comment list
      if (onCommentUpdate) {
        onCommentUpdate();
      }
      
      toast({
        title: "Comment deleted",
        description: "Your comment has been successfully deleted.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Like comment mutation
  const likeCommentMutation = useMutation({
    mutationFn: async ({ commentId, isLiked }: { commentId: number, isLiked: boolean }) => {
      const response = await apiRequest(
        isLiked ? "DELETE" : "POST",
        `/api/comments/${commentId}/like`,
        {}
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to like/unlike comment");
      }
      
      return response.json();
    },
    onSuccess: () => {
      // After successful like/unlike, refresh comment list
      if (onCommentUpdate) {
        onCommentUpdate();
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleDeleteComment = (commentId: number) => {
    if (window.confirm("Are you sure you want to delete this comment?")) {
      deleteCommentMutation.mutate(commentId);
    }
  };

  const handleLikeComment = (comment: Comment) => {
    likeCommentMutation.mutate({ 
      commentId: comment.id, 
      isLiked: comment.isLiked || false 
    });
  };

  if (comments.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        No comments yet. Be the first to comment!
      </div>
    );
  }

  return (
    <div className="space-y-4 mt-4">
      {comments.map((comment) => (
        <Card key={comment.id} className="p-4">
          <div className="flex items-start gap-3">
            <Avatar 
              className="h-8 w-8 cursor-pointer"
              onClick={() => setLocation(`/profile/${comment.user.username}`)}
            >
              {comment.user.avatar ? (
                <AvatarImage 
                  src={comment.user.avatar} 
                  alt={comment.user.name} 
                />
              ) : null}
              <AvatarFallback>
                {getInitials(comment.user.name || comment.user.username || 'User')}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span 
                  className="font-medium cursor-pointer hover:underline"
                  onClick={() => setLocation(`/profile/${comment.user.username}`)}
                >
                  {comment.user.name}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatDate(comment.createdAt)}
                </span>
              </div>
              
              <p className="mt-1">{comment.content}</p>
              
              <div className="flex items-center gap-4 mt-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className={`p-0 h-auto ${comment.isLiked ? 'text-primary' : ''}`}
                  onClick={() => handleLikeComment(comment)}
                >
                  <ThumbsUp className="h-4 w-4 mr-1" />
                  <span className="text-xs">{comment.likes || 0}</span>
                </Button>
                
                {currentUser && currentUser.id === comment.userId && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="p-0 h-auto text-destructive hover:text-destructive/80"
                    onClick={() => handleDeleteComment(comment.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}