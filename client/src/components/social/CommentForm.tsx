import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Send } from "lucide-react";

interface CommentFormProps {
  postId: number;
  onSuccess?: () => void;
}

export default function CommentForm({ postId, onSuccess }: CommentFormProps) {
  const [commentText, setCommentText] = useState("");
  const { toast } = useToast();

  // Create comment mutation
  const commentMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await apiRequest(
        "POST",
        `/api/posts/${postId}/comments`,
        { content }
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to add comment");
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Clear form after successful comment
      setCommentText("");
      
      // Invalidate queries to refresh comment list
      queryClient.invalidateQueries({ queryKey: [`/api/posts/${postId}/comments`] });
      queryClient.invalidateQueries({ queryKey: [`/api/posts/${postId}`] });
      
      // Trigger the success callback if provided
      if (onSuccess) {
        onSuccess();
      }
      
      toast({
        title: "Comment added",
        description: "Your comment has been successfully added.",
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    commentMutation.mutate(commentText);
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4">
      <div className="relative">
        <Textarea
          placeholder="Add a comment..."
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          className="min-h-20 pr-12"
        />
        <Button 
          type="submit" 
          size="icon" 
          className="absolute bottom-2 right-2 h-8 w-8"
          disabled={!commentText.trim() || commentMutation.isPending}
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </form>
  );
}