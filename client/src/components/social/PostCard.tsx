import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { EmojiPickerComponent } from "@/components/ui/emoji-picker";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useLoginPrompt } from "@/hooks/use-login-prompt";
import { LoginPromptModal } from "@/components/LoginPromptModal";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { getInitials } from "@/lib/utils";
import { useLocation } from "wouter";
import { 
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Film,
  ShoppingBag,
  ShoppingCart,
  Tag,
  DollarSign,
  Users,
  Truck,
  Star,
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
  thumbnailUrl?: string | null;
  contentType?: string;
  duration?: number;
  views?: number;
  videoType?: 'standard' | 'short' | 'story' | 'live';
  // Commerce-related properties
  productId?: number | null;
  product?: {
    id: number;
    name: string;
    price: number;
    discountPrice?: number | null;
    imageUrl: string;
    vendorId: number;
    vendorName?: string;
  } | null;
  isShoppable?: boolean;
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
  const { isOpen, action, showLoginPrompt, closePrompt, requireAuth } = useLoginPrompt();
  const [, setLocation] = useLocation();
  const [isCommenting, setIsCommenting] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const [offerAmount, setOfferAmount] = useState("");
  const [offerMessage, setOfferMessage] = useState("");
  
  // Video player states
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [videoProgress, setVideoProgress] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

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
  
  // Add to cart mutation
  const addToCartMutation = useMutation({
    mutationFn: async (productId: number) => {
      const response = await apiRequest(
        "POST",
        "/api/cart",
        { productId, quantity: 1 }
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to add product to cart");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Added to cart",
        description: "Product added to your cart successfully",
      });
      
      // Invalidate cart data
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add product to cart",
        variant: "destructive",
      });
    },
  });

  // Offer message mutation
  const offerMutation = useMutation({
    mutationFn: async ({ amount, message }: { amount: string; message: string }) => {
      const response = await apiRequest(
        "POST",
        `/api/messages/send`,
        { 
          recipientId: post.userId,
          content: `💰 Offer: $${amount}\n\n${message}`
        }
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to send offer");
      }
      
      return response.json();
    },
    onSuccess: () => {
      setOfferAmount("");
      setOfferMessage("");
      setIsOfferModalOpen(false);
      toast({
        title: "Offer Sent!",
        description: "Your offer has been sent as a message to the post author",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send offer",
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

  // Video player functions
  const toggleVideoPlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleVideoMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleVideoEnded = () => {
    setIsPlaying(false);
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
    }
  };

  const handleVideoTimeUpdate = () => {
    if (videoRef.current) {
      const progress = (videoRef.current.currentTime / videoRef.current.duration) * 100;
      setVideoProgress(progress);
    }
  };

  const handleViewFullVideo = () => {
    // Navigate to video detail page
    if (post.videoType === 'short') {
      setLocation('/videos/shorts');
    } else if (post.videoType === 'story') {
      setLocation('/videos/stories');
    } else if (post.videoType === 'live') {
      setLocation('/videos/live');
    } else {
      setLocation(`/videos/${post.id}`);
    }
  };

  // Format video duration from seconds to MM:SS
  const formatVideoDuration = (seconds?: number) => {
    if (!seconds) return '';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
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

  // Early error checking to prevent errors with undefined properties
  if (!post.user) {
    return (
      <Card className="overflow-hidden">
        <CardHeader className="pb-0">
          <div className="flex justify-between">
            <div className="flex items-center gap-2">
              <div className="text-destructive">Error: Missing user data</div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <p>This post cannot be displayed correctly due to missing user information.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-0">
        <div className="flex justify-between">
          <div className="flex items-center gap-2">
            <Avatar 
              className="h-10 w-10 cursor-pointer"
              onClick={() => setLocation(`/profile/${post.user.username}`)}
            >
              {post.user && post.user.avatar ? (
                <AvatarImage 
                  src={post.user.avatar} 
                  alt={post.user.name || 'User'} 
                />
              ) : null}
              <AvatarFallback>
                {post.user ? getInitials(post.user.name || post.user.username || 'User') : 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center">
                <div>
                  <p 
                    className="font-medium cursor-pointer hover:underline"
                    onClick={() => setLocation(`/profile/${post.user.username}`)}
                  >
                    {post.user.name}
                  </p>
                  <p 
                    className="text-xs text-blue-600 cursor-pointer hover:underline"
                    onClick={() => setLocation(`/profile/${post.user.username}`)}
                  >
                    @{post.user.username}
                  </p>
                </div>
                {post.community && (
                  <>
                    <span className="mx-1 text-muted-foreground">•</span>
                    <Badge 
                      variant="outline" 
                      className="text-xs flex items-center cursor-pointer"
                      onClick={() => post.community?.id && setLocation(`/communities/${post.community.id}`)}
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
          <h3 
            className="text-lg font-medium mb-2 cursor-pointer hover:text-primary transition-colors"
            onClick={() => !isDetailed && setLocation(`/posts/${post.id}`)}
          >
            {post.title}
          </h3>
        )}
        
        <p 
          className={`${isDetailed ? "" : "line-clamp-4"} mb-4 ${!isDetailed ? "cursor-pointer hover:text-primary/90 transition-colors" : ""}`}
          onClick={() => !isDetailed && setLocation(`/posts/${post.id}`)}
        >
          {post.content}
        </p>
        
        {post.imageUrl && !post.videoUrl && (
          <div 
            className="rounded-md overflow-hidden mb-4 cursor-pointer"
            onClick={() => setLocation(`/posts/${post.id}`)}
          >
            <img 
              src={post.imageUrl} 
              alt="Post content" 
              className="w-full object-contain"
            />
          </div>
        )}
        
        {post.videoUrl && (
          <div className="rounded-md overflow-hidden mb-4 relative group">
            {/* Video thumbnail with play overlay when video is not playing */}
            {!isPlaying && post.thumbnailUrl && (
              <div className="relative">
                <img 
                  src={post.thumbnailUrl} 
                  alt={post.title || "Video thumbnail"} 
                  className="w-full object-contain"
                />
                <div 
                  className="absolute inset-0 flex items-center justify-center bg-black/50 cursor-pointer"
                  onClick={toggleVideoPlay}
                >
                  <Play className="h-16 w-16 text-white" />
                  
                  {/* Video type badge */}
                  {post.videoType && (
                    <Badge 
                      variant={post.videoType === 'live' ? 'destructive' : 'secondary'} 
                      className="absolute top-3 left-3"
                    >
                      {post.videoType === 'short' ? 'SHORT' : 
                       post.videoType === 'story' ? 'STORY' : 
                       post.videoType === 'live' ? 'LIVE' : 'VIDEO'}
                    </Badge>
                  )}
                  
                  {/* Duration badge */}
                  {post.duration && post.videoType !== 'live' && (
                    <Badge variant="outline" className="absolute bottom-3 right-3 bg-black/70 text-white">
                      {formatVideoDuration(post.duration)}
                    </Badge>
                  )}
                  
                  {/* View count if available */}
                  {post.views !== undefined && (
                    <Badge variant="outline" className="absolute bottom-3 left-3 bg-black/70 text-white flex items-center gap-1">
                      <i className="ri-eye-line text-xs"></i>
                      {post.views}
                    </Badge>
                  )}
                </div>
              </div>
            )}
            
            {/* Actual video player */}
            <div className={isPlaying ? 'block' : 'hidden'}>
              <video 
                ref={videoRef}
                src={post.videoUrl} 
                className="w-full object-contain"
                autoPlay={isPlaying}
                muted={isMuted}
                playsInline
                loop={post.videoType === 'short'}
                onTimeUpdate={handleVideoTimeUpdate}
                onEnded={handleVideoEnded}
              />
              
              {/* Video controls overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3">
                <div className="flex justify-between items-start w-full">
                  {/* Video type badge */}
                  {post.videoType && (
                    <Badge 
                      variant={post.videoType === 'live' ? 'destructive' : 'secondary'} 
                    >
                      {post.videoType === 'short' ? 'SHORT' : 
                       post.videoType === 'story' ? 'STORY' : 
                       post.videoType === 'live' ? 'LIVE' : 'VIDEO'}
                    </Badge>
                  )}
                  
                  {/* View in fullscreen button */}
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-white hover:bg-black/30"
                    onClick={handleViewFullVideo}
                  >
                    <Maximize className="h-5 w-5" />
                  </Button>
                </div>
                
                <div className="w-full">
                  {/* Progress bar */}
                  <div className="w-full h-1 bg-white/30 mb-3">
                    <div 
                      className="h-full bg-primary"
                      style={{ width: `${videoProgress}%` }}
                    ></div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    {/* Play/pause button */}
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-white hover:bg-black/30"
                      onClick={toggleVideoPlay}
                    >
                      {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                    </Button>
                    
                    {/* Volume control */}
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-white hover:bg-black/30"
                      onClick={toggleVideoMute}
                    >
                      {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
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
        
        {/* Product card for embedded commerce */}
        {post.product && (
          <div className="border rounded-lg p-3 mb-4 bg-muted/30 hover:bg-muted/50 transition duration-200">
            <div className="flex gap-3">
              <div 
                className="w-20 h-20 rounded-md overflow-hidden flex-shrink-0 cursor-pointer" 
                onClick={() => post.product?.id && setLocation(`/product/${post.product.id}`)}
              >
                <img 
                  src={post.product.imageUrl} 
                  alt={post.product.name} 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 
                      className="font-medium text-base hover:underline cursor-pointer"
                      onClick={() => post.product?.id && setLocation(`/product/${post.product.id}`)}
                    >
                      {post.product.name}
                    </h4>
                    {post.product.vendorName && (
                      <p className="text-xs text-muted-foreground flex items-center mt-1">
                        <Users className="h-3 w-3 mr-1" />
                        {post.product.vendorName}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1">
                      {post.product.discountPrice !== null && (
                        <span className="text-sm line-through text-muted-foreground">
                          £{post.product.price.toFixed(2)}
                        </span>
                      )}
                      <span className="font-semibold text-primary">
                        £{(post.product.discountPrice ?? post.product.price).toFixed(2)}
                      </span>
                    </div>
                    {post.product.discountPrice !== null && (
                      <Badge className="bg-green-500 hover:bg-green-600 mt-1">
                        {post.product.discountPrice !== null && Math.round((1 - (post.product.discountPrice || 0) / post.product.price) * 100)}% OFF
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex mt-3 gap-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="default" 
                          size="sm" 
                          className="flex-1"
                          onClick={() => {
                            if (!currentUser) {
                              toast({
                                title: "Authentication required",
                                description: "Please log in to add items to cart",
                                variant: "destructive",
                              });
                              setLocation("/auth");
                              return;
                            }
                            
                            if (post.product?.id) {
                              addToCartMutation.mutate(post.product.id);
                            }
                          }}
                          disabled={addToCartMutation.isPending}
                        >
                          {addToCartMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-1" />
                          ) : (
                            <ShoppingBag className="h-4 w-4 mr-1" />
                          )}
                          Shop Now
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Add to your cart</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="icon"
                          onClick={() => post.product?.id && setLocation(`/product/${post.product.id}`)}
                        >
                          <Maximize className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>View product details</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between border-t pt-4 pb-4">
        <div className="flex gap-4">
          <Button 
            variant="ghost" 
            size="sm"
            className="flex items-center gap-1 bg-green-500 hover:bg-green-600 text-white"
            onClick={() => {
              // Add buy functionality here
              toast({ title: "Buy feature coming soon!" });
            }}
          >
            <ShoppingCart className="h-4 w-4" />
            <span>Buy</span>
          </Button>

          <Button 
            variant="ghost" 
            size="sm"
            className="flex items-center gap-1 bg-white hover:bg-gray-50 text-black border-2 border-orange-500 hover:border-orange-600"
            onClick={() => {
              // Add make offer functionality here
              toast({ title: "Make an offer feature coming soon!" });
            }}
          >
            <span>Make an Offer</span>
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm"
            className={`flex items-center gap-1 ${post.isLiked ? "text-blue-500" : ""}`}
            onClick={() => requireAuth("like", handleLike)}
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
            onClick={() => requireAuth("comment", handleComment)}
          >
            <MessageSquare className="h-4 w-4" />
            <span>{post.comments}</span>
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm"
            className="flex items-center gap-1"
            onClick={() => requireAuth("share", handleShare)}
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
                className="pr-20 min-h-[80px]"
              />
              <div className="absolute right-12 bottom-2">
                <EmojiPickerComponent
                  onEmojiSelect={(emoji: string) => setCommentText((prev: string) => prev + emoji)}
                  className="text-muted-foreground hover:text-foreground"
                />
              </div>
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
      
      {/* Login Prompt Modal */}
      <LoginPromptModal 
        isOpen={isOpen} 
        onClose={closePrompt} 
        action={action} 
      />
    </Card>
  );
}