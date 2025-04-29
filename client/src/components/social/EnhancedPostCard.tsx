import { useState, useEffect, useRef } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Post } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { 
  Heart, 
  MessageSquare, 
  Share2, 
  MoreHorizontal,
  ThumbsUp, 
  Tag,
  BadgeCheck,
  ImageOff,
  Send,
  ShoppingCart
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { UserAvatar } from "@/components/ui/user-avatar";
import { UserDisplayName } from "@/components/ui/user-display-name";
import { Textarea } from "@/components/ui/textarea";

interface EnhancedPostCardProps {
  post: Post;
}

// Function to validate image URLs
const isValidImageUrl = (url?: string): boolean => {
  if (!url) return false;
  
  // Check if it's a blob URL (these won't work in the feed)
  if (url.startsWith('blob:')) return false;
  
  // Validate that it's a web URL or an absolute path
  return url.startsWith('http://') || 
         url.startsWith('https://') || 
         url.startsWith('/uploads/');
};

export default function EnhancedPostCard({ post }: EnhancedPostCardProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likes || 0);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  
  // Reset image error state when post changes (using post.id as dependency)
  const [imageError, setImageError] = useState(false);
  
  // Reset image error when post id changes
  useEffect(() => {
    setImageError(false);
    
    // Check if the post is already liked by the current user
    if (user) {
      fetch(`/api/posts/${post.id}/like/check`)
        .then(res => res.json())
        .then(data => {
          setIsLiked(data.isLiked);
        })
        .catch(err => {
          console.error("Error checking like status:", err);
        });
    }
  }, [post.id, user]);
  
  // Fetch comments when showComments is true
  const {
    data: comments = [],
    isLoading: isLoadingComments,
    refetch: refetchComments
  } = useQuery({
    queryKey: [`/api/posts/${post.id}/comments`],
    queryFn: () => fetch(`/api/posts/${post.id}/comments`).then(res => res.json()),
    enabled: showComments,
  });
  
  const isOwner = user?.id === post.userId;
  
  // Format date
  const formattedDate = post.createdAt 
    ? formatDistanceToNow(new Date(post.createdAt), { addSuffix: true }) 
    : "";
    
  // Fetch linked product if post has a productId
  const {
    data: linkedProduct,
    isLoading: isLoadingProduct
  } = useQuery({
    queryKey: [`/api/products/${post.productId}`],
    queryFn: () => fetch(`/api/products/${post.productId}`).then(res => res.json()),
    enabled: !!post.productId, // Only run query if post has a productId
  });
  
  // Like post mutation
  const likeMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/posts/${post.id}/like`, {});
      return { success: true };
    },
    onMutate: () => {
      setIsLiked(true);
      setLikeCount(prev => prev + 1);
    },
    onError: () => {
      setIsLiked(false);
      setLikeCount(prev => prev - 1);
      toast({
        title: t("errors.error"),
        description: t("social.like_error"),
        variant: "destructive",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
    },
  });
  
  const unlikeMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/posts/${post.id}/like`, {});
      return { success: true };
    },
    onMutate: () => {
      setIsLiked(false);
      setLikeCount(prev => Math.max(0, prev - 1));
    },
    onError: () => {
      setIsLiked(true);
      setLikeCount(prev => prev + 1);
      toast({
        title: t("errors.error"),
        description: t("social.unlike_error"),
        variant: "destructive",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
    },
  });
  
  // Delete post mutation
  const deletePostMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/posts/${post.id}`, {});
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      toast({
        title: t("social.post_deleted"),
        description: t("social.post_delete_success"),
      });
    },
    onError: () => {
      toast({
        title: t("errors.error"),
        description: t("social.delete_error"),
        variant: "destructive",
      });
    },
  });
  
  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: async (data: { content: string }) => {
      await apiRequest("POST", `/api/posts/${post.id}/comments`, data);
      return { success: true };
    },
    onSuccess: () => {
      setCommentText(""); // Clear input after successful comment
      refetchComments(); // Refetch comments to show the new one
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] }); // Update post count
      toast({
        title: t("social.comment_added"),
        description: t("social.comment_success"),
      });
    },
    onError: () => {
      toast({
        title: t("errors.error"),
        description: t("social.comment_error"),
        variant: "destructive",
      });
    },
  });
  
  const handleLike = () => {
    if (!user) {
      toast({
        title: t("errors.error"),
        description: t("errors.unauthorized"),
        variant: "destructive",
      });
      return;
    }
    
    if (isLiked) {
      unlikeMutation.mutate();
    } else {
      likeMutation.mutate();
    }
  };
  
  const handleComment = () => {
    if (!user) {
      toast({
        title: t("errors.error"),
        description: t("errors.unauthorized"),
        variant: "destructive",
      });
      return;
    }
    
    setShowComments(!showComments);
  };
  
  const handleShare = () => {
    if (!user) {
      toast({
        title: t("errors.error"),
        description: t("errors.unauthorized"),
        variant: "destructive",
      });
      return;
    }
    
    // In a real app, this would open a sharing dialog
    // For now, we'll just copy the post link to clipboard
    const postUrl = `${window.location.origin}/posts/${post.id}`;
    navigator.clipboard.writeText(postUrl)
      .then(() => {
        toast({
          title: t("social.link_copied"),
          description: t("social.copied_to_clipboard"),
        });
      })
      .catch(() => {
        toast({
          title: t("errors.error"),
          description: t("social.copy_error"),
          variant: "destructive",
        });
      });
  };
  
  const handleDelete = () => {
    // Confirm before deleting
    if (window.confirm(t("social.confirm_delete"))) {
      deletePostMutation.mutate();
    }
  };
  
  const handleBuy = () => {
    if (!user) {
      toast({
        title: t("errors.error"),
        description: t("errors.unauthorized"),
        variant: "destructive",
      });
      return;
    }
    
    if (!linkedProduct) {
      toast({
        title: t("errors.error"),
        description: t("social.product_not_found"),
        variant: "destructive",
      });
      return;
    }
    
    // Navigate to the product detail page
    window.location.href = `/product-detail?id=${linkedProduct.id}`;
  };
  
  // Render content based on content type
  const renderContent = () => {
    switch (post.contentType) {
      case "image":
        return (
          <div className="mb-4">
            {post.imageUrl && isValidImageUrl(post.imageUrl) && !imageError ? (
              <img 
                src={post.imageUrl} 
                alt={post.title || t("social.post_image")} 
                className="w-full rounded-md object-contain max-h-[400px]"
                onError={() => setImageError(true)}
              />
            ) : post.imageUrl ? (
              <div className="w-full rounded-md bg-gray-100 flex items-center justify-center max-h-[400px] p-8">
                <div className="text-center text-gray-500">
                  <ImageOff className="h-16 w-16 mx-auto mb-2" />
                  <p>{t("social.image_unavailable")}</p>
                </div>
              </div>
            ) : null}
            <p className="mt-3 text-gray-700">{post.content}</p>
          </div>
        );
        
      case "video":
        return (
          <div className="mb-4">
            {post.videoUrl && (
              <div className="aspect-video rounded-md overflow-hidden bg-gray-100">
                <iframe
                  src={post.videoUrl}
                  className="w-full h-full"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
            )}
            <p className="mt-3 text-gray-700">{post.content}</p>
          </div>
        );
        
      case "article":
        return (
          <div className="mb-4">
            {post.title && (
              <h2 className="text-xl font-bold mb-2">{post.title}</h2>
            )}
            <div className="prose max-w-none">
              <p className="text-gray-700">{post.content}</p>
            </div>
            {post.imageUrl && isValidImageUrl(post.imageUrl) && !imageError ? (
              <img 
                src={post.imageUrl} 
                alt={post.title || t("social.article_image")} 
                className="w-full rounded-md object-contain mt-4 max-h-[300px]"
                onError={() => setImageError(true)}
              />
            ) : post.imageUrl ? (
              <div className="w-full rounded-md bg-gray-100 flex items-center justify-center max-h-[300px] mt-4 p-8">
                <div className="text-center text-gray-500">
                  <ImageOff className="h-16 w-16 mx-auto mb-2" />
                  <p>{t("social.image_unavailable")}</p>
                </div>
              </div>
            ) : null}
          </div>
        );
        
      case "advertisement":
        return (
          <div className="mb-4 relative">
            <div className="absolute top-0 right-0 bg-blue-500 text-white text-xs px-2 py-1 rounded-bl-md">
              {t("social.sponsored")}
            </div>
            {post.title && (
              <h2 className="text-xl font-bold mb-2">{post.title}</h2>
            )}
            <p className="text-gray-700">{post.content}</p>
            {post.imageUrl && isValidImageUrl(post.imageUrl) && !imageError ? (
              <img 
                src={post.imageUrl} 
                alt={post.title || t("social.ad_image")} 
                className="w-full rounded-md object-contain mt-4 max-h-[300px]"
                onError={() => setImageError(true)}
              />
            ) : post.imageUrl ? (
              <div className="w-full rounded-md bg-gray-100 flex items-center justify-center max-h-[300px] mt-4 p-8">
                <div className="text-center text-gray-500">
                  <ImageOff className="h-16 w-16 mx-auto mb-2" />
                  <p>{t("social.image_unavailable")}</p>
                </div>
              </div>
            ) : null}
            <div className="mt-4">
              <Button size="sm" className="bg-primary hover:bg-primary/90">
                {t("social.learn_more")}
              </Button>
            </div>
          </div>
        );
        
      case "text":
      default:
        return (
          <div className="mb-4">
            <p className="text-gray-700">{post.content}</p>
          </div>
        );
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
      {/* Post Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <Link href={`/members/${post.userId}`} className="block">
            <UserAvatar userId={post.userId} />
          </Link>
          <div>
            <div className="flex items-center">
              <Link href={`/members/${post.userId}`} className="font-medium text-gray-900 hover:underline">
                <UserDisplayName userId={post.userId} />
              </Link>
              {post.isPromoted && (
                <BadgeCheck className="w-4 h-4 text-blue-500 ml-1" />
              )}
            </div>
            <div className="flex items-center text-sm text-gray-500">
              <span>{formattedDate}</span>
              <span className="mx-1">•</span>
              <span className="capitalize">{post.contentType}</span>
            </div>
          </div>
        </div>
        
        <div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="px-2">
                <MoreHorizontal className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {isOwner ? (
                <>
                  <DropdownMenuItem disabled>{t("social.edit")}</DropdownMenuItem>
                  <DropdownMenuItem onClick={handleDelete}>{t("social.delete")}</DropdownMenuItem>
                </>
              ) : (
                <>
                  <DropdownMenuItem disabled>{t("social.report")}</DropdownMenuItem>
                  <DropdownMenuItem disabled>{t("social.hide")}</DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      {/* Post Content */}
      {renderContent()}
      
      {/* Linked Product */}
      {post.productId && linkedProduct && !isLoadingProduct && (
        <div className="mb-4 mt-2 p-3 border border-gray-200 rounded-md bg-gray-50">
          <div className="flex items-center">
            <div className="flex-shrink-0 mr-3">
              {linkedProduct.imageUrl && (
                <img 
                  src={linkedProduct.imageUrl} 
                  alt={linkedProduct.name} 
                  className="w-16 h-16 object-cover rounded-md"
                  onError={(e) => { 
                    (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIGZpbGw9IiNFNUU3RUIiLz48cGF0aCBkPSJNOCAxMEMxMC4yMDkxIDEwIDEyIDguMjA5MTQgMTIgNkMxMiAzLjc5MDg2IDEwLjIwOTEgMiA4IDJDNS43OTA4NiAyIDQgMy43OTA4NiA0IDZDNCA4LjIwOTE0IDUuNzkwODYgMTAgOCAxMFoiIGZpbGw9IiM5Q0EzQUYiLz48cGF0aCBkPSJNMTIuNSAxMi43NUMxMi41IDE0Ljk2NDEgMTAuNjk0MSAxNi43NSA4LjUgMTYuNzVINy41QzUuMzA1ODYgMTYuNzUgMy41IDE0Ljk2NDEgMy41IDEyLjc1VjEyLjVDMy41IDExLjEyMTMgNC42MjEzIDEwIDYgMTBIMTBDMTEuMzc4NyAxMCAxMi41IDExLjEyMTMgMTIuNSAxMi41VjEyLjc1WiIgZmlsbD0iIzlDQTNBRiIvPjwvc3ZnPg==' 
                  }}
                />
              )}
            </div>
            <div className="flex-1">
              <h4 className="font-medium">{linkedProduct.name}</h4>
              <div className="flex justify-between items-center mt-1">
                <div className="text-green-600 font-semibold">
                  ${linkedProduct.price?.toFixed(2)}
                </div>
                {linkedProduct.discountPrice && (
                  <div className="text-gray-500 line-through text-sm">
                    ${linkedProduct.discountPrice.toFixed(2)}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Tags */}
      {post.tags && post.tags.length > 0 && (
        <div className="flex items-center flex-wrap gap-2 mb-4">
          {post.tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="bg-gray-100 text-gray-700 hover:bg-gray-200">
              #{tag}
            </Badge>
          ))}
        </div>
      )}
      
      {/* Post Stats */}
      <div className="flex items-center justify-between text-sm text-gray-500 py-2 border-t border-b">
        <div>
          {likeCount > 0 && (
            <span className="flex items-center">
              <ThumbsUp className="w-4 h-4 text-blue-500 mr-1" />
              {likeCount}
            </span>
          )}
        </div>
        <div className="flex space-x-4">
          {(post.comments && post.comments > 0) && (
            <span>{post.comments} {t("social.comments")}</span>
          )}
          {(post.shares && post.shares > 0) && (
            <span>{post.shares} {t("social.shares")}</span>
          )}
          {(post.views && post.views > 0) && (
            <span>{post.views} {t("social.views")}</span>
          )}
        </div>
      </div>
      
      {/* Post Actions */}
      <div className="flex justify-between pt-2">
        <button
          onClick={handleLike}
          className={`flex items-center py-1 px-2 rounded-md ${
            isLiked ? "text-blue-500" : "text-gray-500 hover:bg-gray-100"
          }`}
        >
          <Heart className={`w-5 h-5 mr-1 ${isLiked ? "fill-current" : ""}`} />
          <span>{t("social.like")}</span>
        </button>
        
        <button
          onClick={handleComment}
          className="flex items-center py-1 px-2 text-gray-500 hover:bg-gray-100 rounded-md"
        >
          <MessageSquare className="w-5 h-5 mr-1" />
          <span>{t("social.comment")}</span>
        </button>
        
        <button
          onClick={handleShare}
          className="flex items-center py-1 px-2 text-gray-500 hover:bg-gray-100 rounded-md"
        >
          <Share2 className="w-5 h-5 mr-1" />
          <span>{t("social.share")}</span>
        </button>
        
        {post.productId && (
          <button
            onClick={handleBuy}
            className="flex items-center py-1 px-2 text-green-600 hover:bg-green-50 rounded-md"
          >
            <ShoppingCart className="w-5 h-5 mr-1" />
            <span>{t("social.buy_now")}</span>
          </button>
        )}
      </div>
      
      {/* Comments Section */}
      {showComments && (
        <div className="mt-4 pt-3 border-t">
          {/* Comment Input */}
          <div className="flex items-start space-x-3 mb-4">
            {user && <UserAvatar userId={user.id} size="sm" />}
            <div className="flex-1 relative">
              <Textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder={t("social.write_comment")}
                className="w-full min-h-[60px] p-2 pr-10 bg-gray-50 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white resize-none"
              />
              <Button 
                size="sm" 
                variant="ghost" 
                className="absolute right-2 bottom-2 p-1 h-auto text-primary"
                onClick={() => {
                  if (commentText.trim()) {
                    addCommentMutation.mutate({ content: commentText.trim() });
                  }
                }}
                disabled={!commentText.trim() || addCommentMutation.isPending}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* Comments List */}
          <div className="space-y-4">
            {isLoadingComments ? (
              <div className="text-center text-gray-500 text-sm py-4">
                {t("social.loading_comments")}
              </div>
            ) : comments.length > 0 ? (
              comments.map((comment: any) => (
                <div key={comment.id} className="flex items-start space-x-3">
                  <UserAvatar userId={comment.userId} size="sm" />
                  <div className="flex-1">
                    <div className="bg-gray-50 rounded-md p-3">
                      <div className="font-medium text-sm">
                        <UserDisplayName userId={comment.userId} />
                      </div>
                      <p className="text-sm mt-1">{comment.content}</p>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {comment.createdAt && formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-gray-500 text-sm py-4">
                {t("social.no_comments")}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}