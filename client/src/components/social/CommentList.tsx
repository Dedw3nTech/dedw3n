import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { formatDistanceToNow } from "date-fns";
import { MoreVertical, Trash, Flag, Edit } from "lucide-react";
import { apiRequest, sanitizeImageUrl } from "@/lib/queryClient";
import { getInitials } from "@/lib/utils";

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

interface CommentListProps {
  comments: Comment[];
  onCommentUpdate?: () => void;
}

export default function CommentList({ comments, onCommentUpdate }: CommentListProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Handle comment deletion
  const handleDelete = async (commentId: number) => {
    try {
      setDeletingId(commentId);
      await apiRequest("DELETE", `/api/comments/${commentId}`);
      toast({
        title: "Comment deleted",
        description: "Your comment has been deleted successfully",
      });
      
      if (onCommentUpdate) {
        onCommentUpdate();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete comment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };

  // Handle comment reporting
  const handleReport = (commentId: number) => {
    toast({
      title: "Comment reported",
      description: "Thank you for reporting this comment. We'll review it shortly.",
    });
  };

  if (!comments || comments.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        No comments yet
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {comments.map((comment) => (
        <Card key={comment.id} className="p-4">
          <div className="flex justify-between">
            <div className="flex items-start">
              <Avatar className="h-8 w-8 mr-3">
                {comment.user.avatar ? (
                  <AvatarImage 
                    src={sanitizeImageUrl(comment.user.avatar)} 
                    alt={comment.user.name || "User"}
                  />
                ) : null}
                <AvatarFallback className="text-xs">
                  {getInitials(comment.user.name || "User")}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
                  <h4 className="font-medium">{comment.user.name}</h4>
                  <span className="text-xs text-muted-foreground">
                    @{comment.user.username}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(comment.createdAt), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
                <p className="mt-1 text-sm">{comment.content}</p>
              </div>
            </div>
            
            {/* Comment actions dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="h-4 w-4" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {user && user.id === comment.userId ? (
                  <DropdownMenuItem
                    onClick={() => handleDelete(comment.id)}
                    disabled={deletingId === comment.id}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash className="mr-2 h-4 w-4" />
                    {deletingId === comment.id ? "Deleting..." : "Delete"}
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem onClick={() => handleReport(comment.id)}>
                    <Flag className="mr-2 h-4 w-4" />
                    Report
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </Card>
      ))}
    </div>
  );
}