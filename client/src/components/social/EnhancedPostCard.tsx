import { useState, useEffect, useRef } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Post } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { Link, useLocation } from "wouter";
import { useMasterTranslation, useSingleTranslation } from "@/hooks/use-master-translation";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCurrency } from "@/contexts/CurrencyContext";
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
  Flag
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2 } from "lucide-react";
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
import { Input } from "@/components/ui/input";

interface EnhancedPostCardProps {
  post: Post;
  showActions?: boolean;
  showBookmarkButton?: boolean;
}

// Function to validate image URLs
const isValidImageUrl = (url?: string): boolean => {
  if (!url) return false;
  
  // Accept blob URLs in development (these might not work in production)
  if (url.startsWith('blob:')) return true;
  
  // Handle base64 encoded images
  if (url.startsWith('data:image/')) return true;
  
  // Handle relative paths for local assets (including uploads)
  if (url.startsWith('./') || url.startsWith('/uploads/') || url.startsWith('/')) return true;
  
  // Check for common file extensions
  const extensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.avif'];
  if (extensions.some(ext => url.toLowerCase().endsWith(ext))) return true;
  
  // Validate that it's a web URL or an absolute path
  return url.startsWith('http://') || 
         url.startsWith('https://') || 
         url.startsWith('/uploads/');
};

export default function EnhancedPostCard({ 
  post, 
  showActions = true, 
  showBookmarkButton = true 
}: EnhancedPostCardProps) {
  const { translateText } = useMasterTranslation();
  const { currentLanguage } = useLanguage();
  const { formatPrice } = useCurrency();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likes || 0);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  
  // Inline editing state
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(post.content || "");
  const [editedTitle, setEditedTitle] = useState(post.title || "");
  
  // Translation state - manual translation approach
  const [isTranslated, setIsTranslated] = useState(false);
  const [translatedContent, setTranslatedContent] = useState("");
  
  // Reset image error state when post changes (using post.id as dependency)
  const [imageError, setImageError] = useState(false);
  
  // Promise-based translation hook for manual translation
  const { translateTextAsync } = useMasterTranslation();
  
  // Reset image error when post id changes
  useEffect(() => {
    setImageError(false);
    
    // Track post impression when post is displayed
    fetch('/api/analytics/post-impression', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ postId: post.id, impressionType: 'view' })
    }).catch(err => console.error('Failed to track post impression:', err));
    
    if (user) {
      // Check if the post is already liked by the current user
      fetch(`/api/posts/${post.id}/like/check`)
        .then(res => res.json())
        .then(data => {
          setIsLiked(data.isLiked);
        })
        .catch(err => {
          console.error("Error checking like status:", err);
        });
      
      // Check if the post is already saved by the current user
      fetch(`/api/posts/${post.id}/save/check`)
        .then(res => res.json())
        .then(data => {
          setIsSaved(data.isSaved);
        })
        .catch(err => {
          console.error("Error checking save status:", err);
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
  const isDraft = post.publishStatus === 'draft';
  
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
        title: translateText("Error"),
        description: translateText("Failed to like post"),
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
        title: translateText("Error"),
        description: translateText("Failed to unlike post"),
        variant: "destructive",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
    },
  });
  
  // Update post content mutation (inline editing)
  const updatePostMutation = useMutation({
    mutationFn: async (data: { content: string; title?: string }) => {
      const response = await apiRequest("PUT", `/api/posts/${post.id}`, {
        ...data,
        publishStatus: post.publishStatus || 'draft' // Preserve the publish status
      });
      return response;
    },
    onSuccess: () => {
      setIsEditing(false);
      toast({
        title: translateText("Success"),
        description: translateText("Post updated successfully!"),
      });
      // Invalidate post-related queries
      queryClient.invalidateQueries({ queryKey: ["/api/posts"], refetchType: 'all' });
      queryClient.invalidateQueries({ queryKey: ["/api/draft-posts"], refetchType: 'all' });
    },
    onError: (error: any) => {
      toast({
        title: translateText("Error"),
        description: error.message || translateText("Failed to update post"),
        variant: "destructive",
      });
    },
  });
  
  // Publish draft post mutation
  const publishPostMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("PATCH", `/api/posts/${post.id}/publish`, {});
      return response;
    },
    onSuccess: async () => {
      toast({
        title: translateText("Success"),
        description: translateText("Post published successfully!"),
      });
      
      // Invalidate and refetch all feed queries immediately for instant visibility
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["/api/posts"], refetchType: 'all' }),
        queryClient.invalidateQueries({ queryKey: ["/api/draft-posts"], refetchType: 'all' }),
        queryClient.invalidateQueries({ queryKey: ["/api/feed/personal"], refetchType: 'all' }),
        queryClient.invalidateQueries({ queryKey: ["/api/feed/communities"], refetchType: 'all' }),
        queryClient.invalidateQueries({ queryKey: ["/api/feed/recommended"], refetchType: 'all' }),
        queryClient.invalidateQueries({ queryKey: ["/api/feed/community"], refetchType: 'all' }),
      ]);
      
      // Redirect to social feed
      setLocation('/social');
    },
    onError: (error: any) => {
      toast({
        title: translateText("Error"),
        description: error.message || translateText("Failed to publish post"),
        variant: "destructive",
      });
    },
  });
  
  // Delete post mutation
  const deletePostMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/posts/${post.id}`, {});
      return { success: true };
    },
    onSuccess: () => {
      // Invalidate post-related queries
      queryClient.invalidateQueries({ queryKey: ["/api/posts"], refetchType: 'all' });
      queryClient.invalidateQueries({ queryKey: ["/api/feed/personal"], refetchType: 'all' });
      queryClient.invalidateQueries({ queryKey: ["/api/feed/communities"], refetchType: 'all' });
      queryClient.invalidateQueries({ queryKey: ["/api/feed/recommended"], refetchType: 'all' });
      
      // Invalidate user stats to update post counts
      queryClient.invalidateQueries({ queryKey: ['/api/user/stats'], refetchType: 'all' });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user?.id}/stats`], refetchType: 'all' });
      queryClient.invalidateQueries({ queryKey: ['/api/social/posts/count'], refetchType: 'all' });
      
      // Log success for debugging
      console.log("Post created or modified - invalidating all feed endpoints");
      console.log("Post creation successful - refreshing feeds");
      
      toast({
        title: translateText("Post Deleted"),
        description: translateText("Your post has been successfully deleted"),
      });
    },
    onError: () => {
      toast({
        title: translateText("Error"),
        description: translateText("Failed to delete post"),
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
        title: translateText("Comment Added"),
        description: translateText("Your comment has been posted successfully"),
      });
    },
    onError: () => {
      toast({
        title: translateText("Error"),
        description: translateText("Failed to add comment"),
        variant: "destructive",
      });
    },
  });
  
  const handleLike = () => {
    if (!user) {
      toast({
        title: translateText("Error"),
        description: translateText("You must be logged in to like posts"),
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
        title: translateText("Error"),
        description: translateText("You must be logged in to comment"),
        variant: "destructive",
      });
      return;
    }
    
    setShowComments(!showComments);
  };
  
  // Share options handlers
  const copyLink = () => {
    const postUrl = `${window.location.origin}/posts/${post.id}`;
    navigator.clipboard.writeText(postUrl)
      .then(() => {
        toast({
          title: translateText("Link Copied"),
          description: translateText("Post link copied to clipboard"),
        });
      })
      .catch(() => {
        toast({
          title: translateText("Error"),
          description: translateText("Failed to copy link"),
          variant: "destructive",
        });
      });
  };
  
  const shareViaEmail = () => {
    const postUrl = `${window.location.origin}/posts/${post.id}`;
    const subject = encodeURIComponent(translateText("Check out this post"));
    const body = encodeURIComponent(`${translateText("I thought you might like this")}: ${postUrl}`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
    
    toast({
      title: translateText("Email Client Opened"),
      description: translateText("Share this post via email"),
    });
  };
  
  const sendViaMessage = () => {
    // In a real app, this would navigate to a messaging interface
    // With the post pre-filled
    toast({
      title: translateText("Send via Message"),
      description: translateText("Post will be shared via message"),
    });
    
    // Navigate to messages page
    window.location.href = `/messages?share=${post.id}`;
  };
  
  const shareWithMember = () => {
    // In a real app, this would open a dialog to select a member
    toast({
      title: translateText("Share with Member"),
      description: translateText("Select a member to share with"),
    });
    
    // Navigate to members page with share parameter
    window.location.href = `/members?share=${post.id}`;
  };
  
  const handleShare = () => {
    if (!user) {
      toast({
        title: translateText("Error"),
        description: translateText("You must be logged in to share posts"),
        variant: "destructive",
      });
      return;
    }
  };
  
  const handleReport = () => {
    if (!user) {
      toast({
        title: translateText("Error"),
        description: translateText("You must be logged in to report posts"),
        variant: "destructive",
      });
      return;
    }
    
    // Show a success message message for now
    toast({
      title: translateText("Post Reported"),
      description: translateText("Thank you for helping keep our community safe. Our team will review this content."),
    });
    
    // In a real implementation, we would call an API to report the post
    console.log('Reporting post', post.id);
  };
  
  // Save post mutation
  const savePostMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/posts/${post.id}/save`, {});
      return { success: true };
    },
    onMutate: () => {
      setIsSaved(true);
    },
    onError: () => {
      setIsSaved(false);
      toast({
        title: translateText("Error"),
        description: translateText("Failed to save post"),
        variant: "destructive",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/saved-posts"] });
      toast({
        title: translateText("Post Saved"),
        description: translateText("Post saved to your collection"),
      });
    },
  });
  
  // Unsave post mutation
  const unsavePostMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/posts/${post.id}/save`, {});
      return { success: true };
    },
    onMutate: () => {
      setIsSaved(false);
    },
    onError: () => {
      setIsSaved(true);
      toast({
        title: translateText("Error"),
        description: translateText("Failed to remove saved post"),
        variant: "destructive",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/saved-posts"] });
      toast({
        title: translateText("Post Removed"),
        description: translateText("Post removed from your saved items"),
      });
    },
  });
  
  // Handle save/bookmark post
  const handleSave = () => {
    if (!user) {
      toast({
        title: translateText("Error"),
        description: translateText("You must be logged in to save posts"),
        variant: "destructive",
      });
      return;
    }
    
    if (isSaved) {
      unsavePostMutation.mutate();
    } else {
      savePostMutation.mutate();
    }
  };
  
  // State for delete confirmation dialog
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  const handleDelete = () => {
    // Show confirmation dialog instead of window.confirm
    setShowDeleteDialog(true);
  };
  
  const confirmDelete = () => {
    deletePostMutation.mutate();
    setShowDeleteDialog(false);
  };
  
  const handleBuy = () => {
    if (!user) {
      toast({
        title: translateText("Error"),
        description: translateText("You must be logged in to purchase"),
        variant: "destructive",
      });
      return;
    }
    
    if (!linkedProduct) {
      toast({
        title: translateText("Error"),
        description: translateText("Product not found"),
        variant: "destructive",
      });
      return;
    }
    
    // Navigate to the product detail page
    window.location.href = `/product/${linkedProduct.id}`;
  };
  
  // Render content based on content type
  const renderContent = () => {
    switch (post.contentType) {
      case "image":
        return (
          <div className="mb-4">
            {post.imageUrl && isValidImageUrl(post.imageUrl) && !imageError ? (
              <div className="w-full rounded-md overflow-hidden">
                <img 
                  src={post.imageUrl} 
                  alt={post.title || translateText("Post image")} 
                  className="w-full h-auto rounded-md object-contain cursor-pointer"
                  onClick={() => setLocation(`/posts/${post.id}`)}
                  onError={() => setImageError(true)}
                  onLoad={(e) => {
                    // No need to restrict height - show full image
                    const img = e.target as HTMLImageElement;
                    // Retain any needed image processing logic here
                  }}
                />
              </div>
            ) : post.imageUrl ? (
              <div className="w-full rounded-md bg-gray-100 flex items-center justify-center h-[300px] p-8">
                <div className="text-center text-gray-500">
                  <ImageOff className="h-16 w-16 mx-auto mb-2" />
                  <p>{translateText("Image unavailable")}</p>
                </div>
              </div>
            ) : null}
            <p className="mt-3 text-gray-700">{isTranslated ? translatedContent : post.content}</p>
            {currentLanguage !== 'EN' && post.content && (
              <button
                onClick={async () => {
                  if (!isTranslated) {
                    const translated = await translateTextAsync(post.content, 'instant');
                    setTranslatedContent(translated);
                    setIsTranslated(true);
                  } else {
                    setIsTranslated(false);
                  }
                }}
                className="text-sm text-gray-500 hover:text-gray-700 mt-2 transition-colors"
              >
                {isTranslated ? translateText("Show Original") : translateText("Translate")}
              </button>
            )}
          </div>
        );
        
      case "video":
        return (
          <div className="mb-4">
            {post.videoUrl && (
              <div className="w-full rounded-md overflow-hidden bg-gray-100">
                <div 
                  className="relative aspect-video bg-gradient-to-br from-gray-300 to-gray-500 flex items-center justify-center"
                >
                  <div className="text-center text-white">
                    <div className="w-16 h-16 mx-auto mb-3 bg-white/30 rounded-full flex items-center justify-center">
                      <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                    </div>
                    <p className="text-sm font-medium">Video Content</p>
                    <p className="text-xs opacity-75">Click to play</p>
                  </div>
                </div>
              </div>
            )}
            <p className="mt-3 text-gray-700">{isTranslated ? translatedContent : post.content}</p>
            {currentLanguage !== 'EN' && post.content && (
              <button
                onClick={async () => {
                  if (!isTranslated) {
                    const translated = await translateTextAsync(post.content, 'instant');
                    setTranslatedContent(translated);
                    setIsTranslated(true);
                  } else {
                    setIsTranslated(false);
                  }
                }}
                className="text-sm text-gray-500 hover:text-gray-700 mt-2 transition-colors"
              >
                {isTranslated ? translateText("Show Original") : translateText("Translate")}
              </button>
            )}
          </div>
        );
        
      case "article":
        return (
          <div className="mb-4">
            {post.title && (
              <h2 className="text-xl font-bold mb-2">{post.title}</h2>
            )}
            <div className="prose max-w-none">
              <p className="text-gray-700">{isTranslated ? translatedContent : post.content}</p>
              {currentLanguage !== 'EN' && post.content && (
                <button
                  onClick={async () => {
                    if (!isTranslated) {
                      const translated = await translateTextAsync(post.content, 'instant');
                      setTranslatedContent(translated);
                      setIsTranslated(true);
                    } else {
                      setIsTranslated(false);
                    }
                  }}
                  className="text-sm text-gray-500 hover:text-gray-700 mt-2 transition-colors"
                >
                  {isTranslated ? translateText("Show Original") : translateText("Translate")}
                </button>
              )}
            </div>
            {post.imageUrl && isValidImageUrl(post.imageUrl) && !imageError ? (
              <div className="w-full rounded-md overflow-hidden mt-4">
                <img 
                  src={post.imageUrl} 
                  alt={post.title || translateText("Article image")} 
                  className="w-full h-auto rounded-md object-contain cursor-pointer"
                  onClick={() => setLocation(`/posts/${post.id}`)}
                  onError={() => setImageError(true)}
                  onLoad={(e) => {
                    // No need to restrict height - show full image
                    const img = e.target as HTMLImageElement;
                    // Retain any needed image processing logic here
                  }}
                />
              </div>
            ) : post.imageUrl ? (
              <div className="w-full rounded-md bg-gray-100 flex items-center justify-center h-[300px] mt-4 p-8">
                <div className="text-center text-gray-500">
                  <ImageOff className="h-16 w-16 mx-auto mb-2" />
                  <p>{translateText("Image unavailable")}</p>
                </div>
              </div>
            ) : null}
          </div>
        );
        
      case "advertisement":
        return (
          <div className="mb-4 relative">
            <div className="absolute top-0 right-0 bg-blue-500 text-white text-xs px-2 py-1 rounded-bl-md z-10">
              {translateText("Sponsored")}
            </div>
            {post.title && (
              <h2 className="text-xl font-bold mb-2">{post.title}</h2>
            )}
            <p className="text-gray-700">{isTranslated ? translatedContent : post.content}</p>
            {currentLanguage !== 'EN' && post.content && (
              <button
                onClick={async () => {
                  if (!isTranslated) {
                    const translated = await translateTextAsync(post.content, 'instant');
                    setTranslatedContent(translated);
                    setIsTranslated(true);
                  } else {
                    setIsTranslated(false);
                  }
                }}
                className="text-sm text-gray-500 hover:text-gray-700 mt-2 transition-colors"
              >
                {isTranslated ? translateText("Show Original") : translateText("Translate")}
              </button>
            )}
            {post.imageUrl && isValidImageUrl(post.imageUrl) && !imageError ? (
              <div className="w-full rounded-md overflow-hidden mt-4">
                <img 
                  src={post.imageUrl} 
                  alt={post.title || translateText("Advertisement image")} 
                  className="w-full h-auto rounded-md object-contain cursor-pointer"
                  onClick={() => setLocation(`/posts/${post.id}`)}
                  onError={() => setImageError(true)}
                  onLoad={(e) => {
                    // No need to restrict height - show full image
                    const img = e.target as HTMLImageElement;
                    // Retain any needed image processing logic here
                  }}
                />
              </div>
            ) : post.imageUrl ? (
              <div className="w-full rounded-md bg-gray-100 flex items-center justify-center h-[300px] mt-4 p-8">
                <div className="text-center text-gray-500">
                  <ImageOff className="h-16 w-16 mx-auto mb-2" />
                  <p>{translateText("Image unavailable")}</p>
                </div>
              </div>
            ) : null}
            <div className="mt-4">
              <Button size="sm" className="bg-primary hover:bg-primary/90">
                {translateText("Learn More")}
              </Button>
            </div>
          </div>
        );
        
      case "text":
      default:
        return (
          <div className="mb-4">
            <p className="text-gray-700">{isTranslated ? translatedContent : post.content}</p>
            {currentLanguage !== 'EN' && post.content && (
              <button
                onClick={async () => {
                  if (!isTranslated) {
                    const translated = await translateTextAsync(post.content, 'instant');
                    setTranslatedContent(translated);
                    setIsTranslated(true);
                  } else {
                    setIsTranslated(false);
                  }
                }}
                className="text-sm text-gray-500 hover:text-gray-700 mt-2 transition-colors"
                data-testid="button-translate-post"
              >
                {isTranslated ? translateText("Show Original") : translateText("Translate")}
              </button>
            )}
          </div>
        );
    }
  };
  
  return (
    <Card className="overflow-hidden mb-4">
      <CardHeader className="pb-0">
        <div className="flex items-center justify-between">
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
              {post.contentType && post.contentType !== 'standard' && (
                <>
                  <span className="mx-1">•</span>
                  <span className="capitalize">{post.contentType.replace(/_/g, ' ')}</span>
                </>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center">
          {/* Report Button - Only show for posts not owned by user */}
          {!isOwner && (
            <span 
              className="flex items-center cursor-pointer text-red-500 hover:text-red-600 text-xs mr-2 bg-red-50 p-1 rounded-md"
              onClick={handleReport}
            >
              <Flag className="w-4 h-4 mr-1 fill-red-200" />
              Report
            </span>
          )}
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="px-2">
                <MoreHorizontal className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {isOwner ? (
                <>
                  <DropdownMenuItem 
                    disabled={!isDraft}
                    onClick={() => {
                      if (isDraft) {
                        setIsEditing(true);
                        setEditedContent(post.content || "");
                      }
                    }}
                  >
                    {translateText("Edit")}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleDelete}>{translateText("Delete")}</DropdownMenuItem>
                </>
              ) : (
                <>
                  <DropdownMenuItem disabled>{translateText("Report")}</DropdownMenuItem>
                  <DropdownMenuItem disabled>{translateText("Hide")}</DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      </CardHeader>
      
      <CardContent className="pt-4">
      {/* Post Content */}
      {isEditing && isDraft ? (
        <div className="mb-4 space-y-3">
          {/* Content textarea */}
          <Textarea
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            placeholder={translateText("Edit your post content...")}
            className="w-full min-h-[200px] p-3 bg-white rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            data-testid="textarea-edit-content"
          />
          {/* Edit action buttons */}
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsEditing(false);
                setEditedContent(post.content || "");
              }}
              disabled={updatePostMutation.isPending}
              data-testid="button-cancel-edit"
            >
              {translateText("Cancel")}
            </Button>
            <Button
              onClick={() => {
                updatePostMutation.mutate({
                  content: editedContent
                });
              }}
              disabled={updatePostMutation.isPending || !editedContent.trim()}
              className="bg-black hover:bg-gray-800 text-white"
              data-testid="button-confirm-edit"
            >
              {updatePostMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {translateText("Updating...")}
                </>
              ) : (
                <>{translateText("Confirm Edit")}</>
              )}
            </Button>
          </div>
        </div>
      ) : (
        renderContent()
      )}
      
      {/* Linked Product */}
      {post.productId && linkedProduct && !isLoadingProduct && (
        <Link href={`/marketplace/products/${linkedProduct.id}`}>
          <div className="mb-4 mt-2 p-3 border border-gray-200 rounded-md bg-gray-50 cursor-pointer hover:bg-gray-100 hover:border-gray-300 transition-colors">
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
                    {formatPrice(linkedProduct.price || 0)}
                  </div>
                  {linkedProduct.discountPrice && (
                    <div className="text-gray-500 line-through text-sm">
                      {formatPrice(linkedProduct.discountPrice)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Link>
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
      
      {/* Publish Draft Button - Only show for draft posts owned by user */}
      {isDraft && isOwner && (
        <div className="flex justify-end pt-3 pb-2 border-t">
          <Button
            onClick={() => publishPostMutation.mutate()}
            disabled={publishPostMutation.isPending}
            className="bg-black hover:bg-gray-800 text-white px-6 py-2"
            data-testid="button-publish-post"
          >
            {publishPostMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {translateText("Publishing...")}
              </>
            ) : (
              <>{translateText("Post")}</>
            )}
          </Button>
        </div>
      )}
      
      {/* Post Stats - Only show for published posts */}
      {!isDraft && (
        <div className="flex items-center gap-6 text-sm text-gray-500 py-2 border-t border-b">
          <span className="flex items-center gap-1">
            {likeCount} Ded
          </span>
          <span className="flex items-center gap-1">
            {post.comments || 0} {translateText("Comment")}
          </span>
          <span className="flex items-center gap-1">
            {post.shares || 0} {translateText("Share")}
          </span>
        </div>
      )}
      
      {/* Post Actions - Only show for published posts */}
      {!isDraft && showActions && (
        <div className="flex justify-end gap-1 pt-2">
          <button
            onClick={handleLike}
            className={`flex items-center py-1 px-2 rounded-md ${
              isLiked ? "text-black" : "text-gray-500 hover:bg-gray-100"
            }`}
          >
            <Heart className={`w-5 h-5 mr-1 ${isLiked ? "fill-current" : ""}`} />
            <span>{translateText("Ded")}</span>
          </button>
          
          <button
            onClick={handleComment}
            className="flex items-center py-1 px-2 text-gray-500 hover:bg-gray-100 rounded-md"
          >
            <MessageSquare className="w-5 h-5 mr-1" />
            <span>{translateText("Comment")}</span>
          </button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                onClick={handleShare}
                className="flex items-center py-1 px-2 text-gray-500 hover:bg-gray-100 rounded-md"
              >
                <Share2 className="w-5 h-5 mr-1" />
                <span>{translateText("Share")}</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={copyLink}>
                {translateText("Copy Link")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={shareViaEmail}>
                {translateText("Share via Email")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={sendViaMessage}>
                {translateText("Send via Message")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={shareWithMember}>
                {translateText("Share with Member")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
      
      {/* Comments Section - Only show for published posts */}
      {!isDraft && showComments && (
        <div className="mt-4 pt-3 border-t">
          {/* Comment Input */}
          <div className="flex items-start space-x-3 mb-4">
            {user && <UserAvatar userId={user.id} size="sm" />}
            <div className="flex-1 relative">
              <Textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder={translateText("Write a comment...")}
                className="w-full min-h-[60px] p-2 pr-10 bg-gray-50 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white resize-none"
              />
              <Button 
                size="sm" 
                className="absolute right-2 bottom-2 p-1 h-auto bg-black hover:bg-gray-800 text-white"
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
                {translateText("Loading comments...")}
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
                {translateText("No comments yet")}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{translateText("Delete Post")}</AlertDialogTitle>
            <AlertDialogDescription>
              {translateText("Are you sure you want to delete this post? This action cannot be undone.")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletePostMutation.isPending}>
              {translateText("Cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deletePostMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletePostMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              {translateText("Delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </CardContent>
    </Card>
  );
}