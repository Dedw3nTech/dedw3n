import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { timeAgo } from "@/lib/utils";
import { Post } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface PostCardProps {
  post: Post;
}

export default function PostCard({ post }: PostCardProps) {
  const [liked, setLiked] = useState(false);
  const [comment, setComment] = useState("");
  const { toast } = useToast();
  
  const handleLike = () => {
    setLiked(!liked);
    toast({
      title: liked ? "Post unliked" : "Post liked",
      description: `You have ${liked ? "unliked" : "liked"} this post.`,
    });
  };
  
  const handleComment = () => {
    if (!comment.trim()) {
      toast({
        title: "Comment cannot be empty",
        description: "Please enter a comment before submitting.",
        variant: "destructive",
      });
      return;
    }
    
    toast({
      title: "Comment added",
      description: "Your comment has been added to this post.",
    });
    setComment("");
  };
  
  const handleShare = () => {
    toast({
      title: "Post shared",
      description: "This post has been shared to your profile.",
    });
  };
  
  const handleBookmark = () => {
    toast({
      title: "Post bookmarked",
      description: "This post has been saved to your bookmarks.",
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="p-4">
        <div className="flex items-start space-x-3">
          <Avatar>
            <AvatarImage src="https://images.unsplash.com/photo-1531123897727-8f129e1688ce?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&q=80" alt="User avatar" />
            <AvatarFallback>UN</AvatarFallback>
          </Avatar>
          <div className="flex-grow">
            <div className="flex items-center">
              <h4 className="font-medium">Username</h4>
              <span className="text-gray-500 text-sm ml-2">@username</span>
              <span className="text-gray-400 text-xs ml-2">• {timeAgo(post.createdAt)}</span>
            </div>
            <p className="mt-2 text-gray-800">{post.content}</p>
          </div>
          <button className="text-gray-400 hover:text-gray-600">
            <i className="ri-more-2-fill"></i>
          </button>
        </div>
      </div>
      
      {post.imageUrl && (
        <div className="bg-gray-50 border-t border-b border-gray-100">
          <img src={post.imageUrl} alt="Post" className="w-full max-h-96 object-cover" />
        </div>
      )}
      
      <div className="p-4">
        <div className="flex items-center justify-between text-gray-500 text-sm">
          <div className="flex space-x-4">
            <button
              className={`flex items-center space-x-1 ${liked ? 'text-primary' : 'hover:text-primary'}`}
              onClick={handleLike}
            >
              <i className={`${liked ? 'ri-heart-fill' : 'ri-heart-line'}`}></i>
              <span>{post.likes + (liked ? 1 : 0)}</span>
            </button>
            <button className="flex items-center space-x-1 hover:text-primary">
              <i className="ri-chat-1-line"></i>
              <span>{post.comments}</span>
            </button>
            <button className="flex items-center space-x-1 hover:text-primary" onClick={handleShare}>
              <i className="ri-share-forward-line"></i>
              <span>{post.shares}</span>
            </button>
          </div>
          <button className="hover:text-primary" onClick={handleBookmark}>
            <i className="ri-bookmark-line"></i>
          </button>
        </div>
        
        <div className="mt-3 border-t border-gray-100 pt-3">
          <div className="flex space-x-3">
            <Avatar className="w-8 h-8">
              <AvatarImage src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&q=80" alt="User avatar" />
              <AvatarFallback>ME</AvatarFallback>
            </Avatar>
            <div className="relative flex-grow">
              <Textarea
                placeholder="Write a comment..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full py-2 pl-3 pr-10 bg-gray-100 rounded-full text-sm min-h-0 resize-none"
              />
              <Button
                size="sm"
                variant="ghost"
                className="absolute right-3 top-2 text-primary p-0 h-auto"
                onClick={handleComment}
              >
                <i className="ri-send-plane-fill"></i>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
