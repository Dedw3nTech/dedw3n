import { useState, useRef, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ResolvedUserAvatar } from "@/components/ui/resolved-user-avatar";
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
import { useLocation, Link } from "wouter";
import { useMasterBatchTranslation, useMasterTranslation, useSingleTranslation } from "@/hooks/use-master-translation";
import { processError } from "@/lib/error-handler";
import ReportPostDialog from "@/components/social/ReportPostDialog";
import { useLanguage } from "@/contexts/LanguageContext";
import { currencies } from "@/contexts/CurrencyContext";
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
  Heart,
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
  Mail,
  MessageCircle,
  Repeat2,
  Plus,
  Bookmark,
  Flag,
  Smartphone,
  CreditCard,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Type for translated product data
interface TranslatedProduct {
  name: string;
  soldBy: string;
  vendorName: string;
  addToCart: string;
  makeOffer: string;
  offLabel: string;
}

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
    city?: string | null;
    country?: string | null;
    region?: string | null;
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
  isSaved?: boolean;
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
  const { currentLanguage } = useLanguage();
  const [, setLocation] = useLocation();
  const [isCommenting, setIsCommenting] = useState(false);
  const [commentInput, setCommentInput] = useState("");
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const [offerAmount, setOfferAmount] = useState("");
  const [offerCurrency, setOfferCurrency] = useState("GBP");
  const [offerMessage, setOfferMessage] = useState("");
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareMessage, setShareMessage] = useState("");
  const [selectedUser, setSelectedUser] = useState("");
  const [isFriendRequestModalOpen, setIsFriendRequestModalOpen] = useState(false);
  const [friendRequestMessage, setFriendRequestMessage] = useState("Hi! I'd like to be friends.");
  const [isRepostModalOpen, setIsRepostModalOpen] = useState(false);
  const [repostText, setRepostText] = useState("");
  const [isTranslated, setIsTranslated] = useState(false);
  const [translatedContent, setTranslatedContent] = useState("");
  const [isProductTranslated, setIsProductTranslated] = useState(false);
  const [translatedProduct, setTranslatedProduct] = useState<TranslatedProduct | null>(null);
  const [productButtonLabel, setProductButtonLabel] = useState("");
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);

  // Mobile device detection
  const isMobileDevice = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  };

  // Master Translation System - PostCard Mega-Batch (60+ texts)
  const postCardTexts = useMemo(() => [
    // Post Actions (13 texts)
    "Ded", "Comment", "Share", "Save", "Report", "More options", "Delete Post", 
    "Edit Post", "Report Post", "Copy Link", "Hide Post", "Follow", "Unfollow",
    
    // Status Messages (11 texts)
    "Loved", "Saved", "Shared", "Deleted", "Reported", "Hidden", 
    "Authentication required", "Please log in to continue", "Post saved",
    "This post has been saved to your collection", "Thank you for helping keep our community safe",
    
    // Interaction Buttons (8 texts)
    "Add to Cart", "Make Offer", "Send Message", "Add Friend", 
    "Buy Now", "View Product", "Contact Seller", "View Profile",
    
    // Modal Titles & Actions (12 texts)
    "Make an Offer", "Send", "Cancel", "Share Post", "Add Comment", 
    "Send Friend Request", "Repost", "Select User", "Write message", 
    "Offer amount", "Your message", "Are you sure?",
    
    // SMS Sharing (1 text)
    "Share via Text Message",
    
    // Error Messages (5 texts)
    "Failed to like post", "Failed to save post", "Failed to share post", 
    "Failed to delete post", "Something went wrong",
    
    // Translation Controls (8 texts)
    "Translate", "Show Original", "Sold by", "% OFF", "Message", "E-mail",
    "Comments", "No comments yet. Be the first to comment!",
    
    // Video Labels (6 texts)
    "SHORT", "STORY", "LIVE", "VIDEO", "Opening Text Messages",
    "Text messaging app should open with post details"
  ], []);

  const { translations, isLoading: translationsLoading } = useMasterBatchTranslation(postCardTexts);
  
  // Extract translations with descriptive variable names
  const [
    // Post Actions
    likeText, commentBtnText, shareText, saveText, reportText, moreOptionsText, deletePostText,
    editPostText, reportPostText, copyLinkText, hidePostText, followText, unfollowText,
    
    // Status Messages
    likedText, savedText, sharedText, deletedText, reportedText, hiddenText,
    authRequiredText, loginPromptText, savedToastText, savedToCollectionText, thankYouReportText,
    
    // Interaction Buttons
    addToCartText, makeOfferText, sendMessageText, addFriendText,
    buyNowText, viewProductText, contactSellerText, viewProfileText,
    
    // Modal Titles & Actions
    makeOfferTitle, sendText, cancelText, sharePostTitle, addCommentTitle,
    friendRequestTitle, repostTitle, selectUserText, writeMessageText,
    offerAmountText, yourMessageText, confirmText,
    
    // SMS Sharing
    shareViaTextMessageText,
    
    // Error Messages
    failedLikeText, failedSaveText, failedShareText, failedDeleteText, errorText,
    
    // Translation Controls
    translateBtnText, showOriginalText, soldByText, offLabelText, messageDropdownText, emailText,
    commentsHeaderText, noCommentsText,
    
    // Video Labels
    shortText, storyText, liveText, videoText, openingTextMessagesText,
    textMessagingAppText
  ] = translations || postCardTexts;

  // Promise-based translation hook for manual translation
  const { translateTextAsync } = useMasterTranslation();

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
      // Check authentication before making request
      if (!currentUser) {
        throw new Error("AUTHENTICATION_REQUIRED");
      }
      
      const response = await apiRequest(
        post.isLiked ? "DELETE" : "POST",
        `/api/posts/${post.id}/like`,
        {}
      );
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("AUTHENTICATION_REQUIRED");
        }
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
      queryClient.invalidateQueries({ queryKey: ["/api/feed/community"] });
    },
    onError: (error: Error) => {
      if (error.message === "AUTHENTICATION_REQUIRED") {
        showLoginPrompt("like");
        return;
      }
      const errorReport = processError(error);
      toast({
        title: errorText,
        description: errorReport.userMessage || failedLikeText,
        variant: "destructive",
        errorType: `${errorReport.category} Error - ${errorReport.code}`,
        errorMessage: errorReport.technicalDetails,
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
        title: sharedText,
        description: sharedText,
      });
      
      // Invalidate query cache to refresh posts
      queryClient.invalidateQueries({ queryKey: ["/api/feed/personal"] });
      queryClient.invalidateQueries({ queryKey: ["/api/feed/communities"] });
      queryClient.invalidateQueries({ queryKey: ["/api/feed/recommended"] });
    },
    onError: (error: Error) => {
      const errorReport = processError(error);
      toast({
        title: errorText,
        description: errorReport.userMessage || failedShareText,
        variant: "destructive",
        errorType: `${errorReport.category} Error - ${errorReport.code}`,
        errorMessage: errorReport.technicalDetails,
      });
    },
  });

  // Comment mutation
  const commentMutation = useMutation({
    mutationFn: async (comment: string) => {
      // Check authentication before making request
      if (!currentUser) {
        throw new Error("AUTHENTICATION_REQUIRED");
      }
      
      const response = await apiRequest(
        "POST",
        `/api/posts/${post.id}/comments`,
        { content: comment }
      );
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("AUTHENTICATION_REQUIRED");
        }
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to add comment");
      }
      
      return response.json();
    },
    onSuccess: () => {
      setCommentInput("");
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
      queryClient.invalidateQueries({ queryKey: ["/api/feed/community"] });
    },
    onError: (error: Error) => {
      if (error.message === "AUTHENTICATION_REQUIRED") {
        showLoginPrompt("comment");
        return;
      }
      const errorReport = processError(error);
      toast({
        title: "Error",
        description: errorReport.userMessage || "Failed to add comment",
        variant: "destructive",
        errorType: `${errorReport.category} Error - ${errorReport.code}`,
        errorMessage: errorReport.technicalDetails,
      });
    },
  });

  // Add to cart mutation
  const addToCartMutation = useMutation({
    mutationFn: async () => {
      if (!post.product?.id) {
        throw new Error("No product information available");
      }
      
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Client-User-ID': currentUser?.id?.toString() || '',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
        },
        credentials: 'include',
        body: JSON.stringify({ 
          productId: post.product.id,
          quantity: 1
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to add product to cart");
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Invalidate cart data and cart count for header badge
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cart/count"] });
      
      // Show success toast
      toast({
        title: "Added to Cart",
        description: "Product added to your cart successfully",
      });
    },
    onError: (error: Error) => {
      const errorReport = processError(error);
      toast({
        title: "Error",
        description: errorReport.userMessage || "Failed to add product to cart",
        variant: "destructive",
        errorType: `${errorReport.category} Error - ${errorReport.code}`,
        errorMessage: errorReport.technicalDetails,
      });
    },
  });

  // Friend request mutation
  const friendRequestMutation = useMutation({
    mutationFn: async (message: string) => {
      const response = await apiRequest(
        "POST",
        "/api/friends/request",
        { recipientId: post.user.id, message }
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to send friend request");
      }
      
      return response.json();
    },
    onSuccess: () => {
      setIsFriendRequestModalOpen(false);
      setFriendRequestMessage("Hi! I'd like to be friends.");
      toast({
        title: "Friend request sent",
        description: "Your friend request has been sent successfully",
      });
    },
    onError: (error: Error) => {
      // Extract the original error message before processError transforms it
      const originalMessage = error.message || "";
      
      // Determine user-friendly message based on the original backend error
      let userMessage = "Failed to send friend request";
      let title = "Friend Request Error";
      
      if (originalMessage.includes("already sent")) {
        userMessage = "You've already sent a friend request to this user. Please wait for them to respond.";
        title = "Request Already Sent";
      } else if (originalMessage.includes("Already friends")) {
        userMessage = "You're already friends with this user!";
        title = "Already Friends";
      } else if (originalMessage.includes("yourself")) {
        userMessage = "You cannot send a friend request to yourself.";
        title = "Invalid Request";
      } else if (originalMessage.includes("Recipient ID is required")) {
        userMessage = "Unable to identify the recipient. Please try again.";
        title = "Invalid Request";
      } else {
        userMessage = originalMessage || "Failed to send friend request";
      }
      
      // Still process for error reporting
      const errorReport = processError(error);
      
      toast({
        title,
        description: userMessage,
        variant: "destructive",
        errorType: `${errorReport.category} Error - ${errorReport.code}`,
        errorMessage: errorReport.technicalDetails,
      });
    },
  });

  // SMS sharing function for posts
  const shareViaSMS = () => {
    const postUrl = `${window.location.origin}/posts/${post.id}`;
    let smsBody = `Check out this post by ${post.user.name}`;
    
    if (post.content) {
      smsBody += `: ${post.content.substring(0, 100)}${post.content.length > 100 ? '...' : ''}`;
    }
    
    smsBody += `\n\n${postUrl}`;
    
    // Create SMS URL scheme
    const smsUrl = `sms:?body=${encodeURIComponent(smsBody)}`;
    
    // Open SMS app
    window.open(smsUrl, '_blank');
    
    toast({
      title: "Opening Text Messages",
      description: "Text messaging app should open with post details",
    });
  };

  // Save post mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      // Check authentication before making request
      if (!currentUser) {
        throw new Error("AUTHENTICATION_REQUIRED");
      }
      
      const response = await apiRequest(
        post.isSaved ? "DELETE" : "POST",
        `/api/posts/${post.id}/save`,
        {}
      );
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("AUTHENTICATION_REQUIRED");
        }
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to save post");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: post.isSaved ? "Post unsaved" : "Post saved",
        description: post.isSaved ? "Post removed from saved posts" : "Post saved to your collection",
      });
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["/api/feed/community"] });
      queryClient.invalidateQueries({ queryKey: ["/api/feed/personal"] });
      queryClient.invalidateQueries({ queryKey: ["/api/posts/saved"] });
      queryClient.invalidateQueries({ queryKey: ["/api/feed/recommended"] });
    },
    onError: (error: Error) => {
      if (error.message === "AUTHENTICATION_REQUIRED") {
        showLoginPrompt("save");
        return;
      }
      const errorReport = processError(error);
      toast({
        title: "Error",
        description: errorReport.userMessage || "Failed to save post",
        variant: "destructive",
        errorType: `${errorReport.category} Error - ${errorReport.code}`,
        errorMessage: errorReport.technicalDetails,
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
      const errorReport = processError(error);
      toast({
        title: "Error",
        description: errorReport.userMessage || "Failed to delete post",
        variant: "destructive",
        errorType: `${errorReport.category} Error - ${errorReport.code}`,
        errorMessage: errorReport.technicalDetails,
      });
    },
  });

  // Offer message mutation
  const offerMutation = useMutation({
    mutationFn: async ({ amount, message }: { amount: string; message: string }) => {
      if (!post.userId) {
        throw new Error('Post author information is missing');
      }

      const response = await apiRequest(
        "POST",
        `/api/messages/send`,
        { 
          receiverId: post.userId,
          content: `💰 Offer: $${amount}\n\n${message}`,
          category: 'marketplace'
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
        description: `Your offer has been sent to ${post.user?.name || post.user?.username || 'the post author'}`,
      });
    },
    onError: (error: any) => {
      console.error('PostCard send offer error:', error);
      const errorReport = processError(error);
      toast({
        title: "Error",
        description: errorReport.userMessage || "Failed to send offer",
        variant: "destructive",
        errorType: `${errorReport.category} Error - ${errorReport.code}`,
        errorMessage: errorReport.technicalDetails,
      });
    },
  });

  // Repost mutation
  const repostMutation = useMutation({
    mutationFn: async ({ message }: { message: string }) => {
      // Check authentication before making request
      if (!currentUser) {
        throw new Error("AUTHENTICATION_REQUIRED");
      }
      
      const response = await apiRequest(
        "POST",
        `/api/posts`,
        { 
          content: message,
          sharedPostId: post.id
        }
      );
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("AUTHENTICATION_REQUIRED");
        }
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to repost");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Reposted",
        description: "Post shared to your timeline",
      });
      setIsShareModalOpen(false);
      setShareMessage("");
      
      // Invalidate query cache to refresh posts
      queryClient.invalidateQueries({ queryKey: ["/api/feed/personal"] });
      queryClient.invalidateQueries({ queryKey: ["/api/feed/community"] });
    },
    onError: (error: Error) => {
      if (error.message === "AUTHENTICATION_REQUIRED") {
        showLoginPrompt("repost");
        return;
      }
      const errorReport = processError(error);
      toast({
        title: "Error",
        description: errorReport.userMessage || "Failed to repost",
        variant: "destructive",
        errorType: `${errorReport.category} Error - ${errorReport.code}`,
        errorMessage: errorReport.technicalDetails,
      });
    },
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({ userId, message }: { userId: string; message: string }) => {
      const response = await apiRequest(
        "POST",
        `/api/messages/send`,
        { 
          recipientId: parseInt(userId),
          content: `📤 Shared post: "${post.content}"\n\n${message}\n\nOriginal post: ${window.location.origin}/post/${post.id}`
        }
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to send message");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Message sent",
        description: "Post shared via message",
      });
      setIsShareModalOpen(false);
      setShareMessage("");
      setSelectedUser("");
    },
    onError: (error: Error) => {
      const errorReport = processError(error);
      toast({
        title: "Error",
        description: errorReport.userMessage || "Failed to send message",
        variant: "destructive",
        errorType: `${errorReport.category} Error - ${errorReport.code}`,
        errorMessage: errorReport.technicalDetails,
      });
    },
  });

  // Fetch users for message sharing
  const { data: users = [] } = useQuery({
    queryKey: ["/api/users"],
    queryFn: async () => {
      const response = await fetch("/api/users");
      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }
      return response.json();
    },
    enabled: isShareModalOpen,
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
    if (!commentInput.trim()) return;
    commentMutation.mutate(commentInput);
  };

  const handleMakeOffer = () => {
    if (!currentUser) {
      showLoginPrompt("make an offer");
      return;
    }
    setIsOfferModalOpen(true);
  };

  const handleSendOffer = () => {
    if (!offerAmount.trim() || !offerMessage.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter both an offer amount and message",
        variant: "destructive",
      });
      return;
    }
    
    offerMutation.mutate({ 
      amount: offerAmount, 
      message: offerMessage 
    });
  };

  const handleSavePost = () => {
    saveMutation.mutate();
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

  // Helper function to map language code to locale
  const getLocaleFromLanguage = (langCode: string): string => {
    const localeMap: Record<string, string> = {
      'AR': 'ar-SA',
      'ZH': 'zh-CN',
      'CS': 'cs-CZ',
      'DA': 'da-DK',
      'NL': 'nl-NL',
      'EN': 'en-US',
      'FI': 'fi-FI',
      'FR': 'fr-FR',
      'DE': 'de-DE',
      'HU': 'hu-HU',
      'IT': 'it-IT',
      'JA': 'ja-JP',
      'KO': 'ko-KR',
      'NO': 'no-NO',
      'PL': 'pl-PL',
      'PT': 'pt-PT',
      'RU': 'ru-RU',
      'ES': 'es-ES',
      'SV': 'sv-SE',
      'TR': 'tr-TR',
    };
    return localeMap[langCode] || 'en-US';
  };

  // Format date with user's language
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const locale = getLocaleFromLanguage(currentLanguage);
    
    return date.toLocaleString(locale, {
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
            <Link href={`/profile/${post.user.username}`} data-testid="link-user-avatar">
              <ResolvedUserAvatar
                user={post.user}
                size="md"
                className="h-10 w-10 cursor-pointer"
              />
            </Link>
            <div>
              <div className="flex items-center">
                <div className="flex items-center gap-2">
                  <div>
                    <Link 
                      href={`/profile/${post.user.username}`}
                      className="font-medium text-foreground hover:underline cursor-pointer block"
                      data-testid="link-user-name"
                    >
                      {post.user.name}
                    </Link>
                    <Link 
                      href={`/profile/${post.user.username}`}
                      className="text-xs text-blue-600 hover:underline cursor-pointer block"
                      data-testid="link-user-username"
                    >
                      @{post.user.username}
                    </Link>
                    {(post.user.city || post.user.country || post.user.region) && (
                      <p className="text-xs text-gray-600 font-normal">
                        {[post.user.city, post.user.country, post.user.region]
                          .filter(Boolean)
                          .join(', ')
                        }
                      </p>
                    )}
                  </div>
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
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground flex items-center">
                  <CalendarDays className="h-3 w-3 inline mr-1" />
                  {formatDate(post.createdAt)}
                </p>
                
                {/* Add Friend Button - only show for other users */}
                {currentUser && currentUser.id !== post.userId && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="text-black hover:bg-gray-100 flex items-center gap-1 px-2 py-1 ml-auto"
                    onClick={() => requireAuth("addFriend", () => setIsFriendRequestModalOpen(true))}
                  >
                    <Plus className="h-3 w-3" />
                    <span style={{ fontSize: '13px' }}>{addFriendText}</span>
                  </Button>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">

            {/* Mobile Share Button */}
            <div className="block md:hidden">
              <Button 
                variant="ghost" 
                size="icon"
                className="h-8 w-8"
                onClick={() => requireAuth("share", () => setIsShareModalOpen(true))}
              >
                <Share2 className="h-4 w-4" />
              </Button>
            </div>

            {/* Post author's menu (Edit/Delete) */}
            {currentUser && currentUser.id === post.userId && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" data-testid="button-post-menu">
                    <MoreHorizontal className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuItem
                    onClick={() => setLocation(`/posts/${post.id}/edit`)}
                    data-testid="menu-item-edit-post"
                  >
                    <i className="ri-edit-line mr-2"></i>
                    {editPostText}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleDelete}
                    disabled={deleteMutation.isPending}
                    data-testid="menu-item-delete-post"
                    className="text-destructive hover:text-destructive"
                  >
                    {deleteMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <i className="ri-delete-bin-line mr-2"></i>
                    )}
                    {deletePostText}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Other users' posts menu (Save/Report) */}
            {currentUser && currentUser.id !== post.userId && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuItem
                    onClick={handleSavePost}
                    data-testid="menu-item-save-post"
                  >
                    <Bookmark className="mr-2 h-4 w-4 fill-current" />
                    {saveText}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => requireAuth("report", () => setIsReportDialogOpen(true))}
                    data-testid="menu-item-report-post"
                  >
                    <Flag className="mr-2 h-4 w-4 fill-current" />
                    {reportText}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
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
          className={`${isDetailed ? "" : "line-clamp-4"} ${!isDetailed ? "cursor-pointer hover:text-primary/90 transition-colors" : ""}`}
          onClick={() => !isDetailed && setLocation(`/posts/${post.id}`)}
        >
          {isTranslated ? translatedContent : post.content}
        </p>
        
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
          className="text-gray-500 text-sm hover:text-gray-700 transition-colors mb-4"
          style={{ marginTop: '7px' }}
        >
          {isTranslated ? showOriginalText : translateBtnText}
        </button>
        
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
        
        {/* Enhanced Product card for embedded commerce - Full card display for product reposts */}
        {post.product && (
          <div className="border rounded-lg p-6 mb-4 bg-white shadow-sm hover:shadow-md transition-all duration-200">
            <div className="flex flex-col gap-4">
              {/* Product image and basic info */}
              <div className="flex gap-4">
                <div 
                  className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 cursor-pointer border" 
                  onClick={() => post.product?.id && setLocation(`/product/${post.product.id}`)}
                >
                  <img 
                    src={post.product.imageUrl} 
                    alt={isProductTranslated && translatedProduct ? translatedProduct.name : post.product.name} 
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                  />
                </div>
                <div className="flex-1">
                  <h4 
                    className="font-semibold text-lg hover:underline cursor-pointer text-gray-900 mb-1"
                    onClick={() => post.product?.id && setLocation(`/product/${post.product.id}`)}
                  >
                    {isProductTranslated && translatedProduct ? translatedProduct.name : post.product.name}
                  </h4>
                  {post.product.vendorName && (
                    <p className="text-sm text-gray-600 flex items-center mb-2">
                      <Users className="h-3 w-3 mr-1" />
                      <span>{isProductTranslated && translatedProduct ? translatedProduct.soldBy : 'Sold by'} </span>
                      <span 
                        className="font-medium hover:underline cursor-pointer ml-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (post.product?.vendorId) {
                            setLocation(`/vendor/${post.product.vendorId}`);
                          }
                        }}
                      >
                        {isProductTranslated && translatedProduct ? translatedProduct.vendorName : post.product.vendorName}
                      </span>
                    </p>
                  )}
                  <div className="flex items-center gap-2">
                    {post.product.discountPrice && post.product.discountPrice < post.product.price && (
                      <span className="text-sm text-gray-500 line-through">
                        £{post.product.price.toFixed(2)}
                      </span>
                    )}
                    <span className="font-bold text-[15px] text-green-600">
                      £{(post.product.discountPrice ?? post.product.price).toFixed(2)}
                    </span>
                    {post.product.discountPrice && post.product.discountPrice < post.product.price && (
                      <Badge className="bg-black hover:bg-gray-800 text-white">
                        {Math.round((1 - post.product.discountPrice / post.product.price) * 100)}{isProductTranslated && translatedProduct ? translatedProduct.offLabel : '% OFF'}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Prominent action buttons - styled like your image */}
              <div className="flex gap-3 pt-2">
                <Button 
                  variant="default" 
                  size="lg" 
                  className="flex-1 bg-black hover:bg-gray-800 text-white font-medium h-12 text-base rounded-lg"
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
                      addToCartMutation.mutate();
                    }
                  }}
                  disabled={addToCartMutation.isPending}
                >
                  {addToCartMutation.isPending ? (
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  ) : (
                    <CreditCard className="h-5 w-5 mr-2 text-white" />
                  )}
                  {isProductTranslated && translatedProduct ? translatedProduct.addToCart : 'Add to Cart'}
                </Button>
                
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="flex-1 border-2 border-gray-300 hover:border-gray-400 text-gray-700 hover:text-gray-900 font-medium h-12 text-base rounded-lg hover:bg-gray-50"
                  onClick={handleMakeOffer}
                  disabled={!post.product}
                >
                  {isProductTranslated && translatedProduct ? translatedProduct.makeOffer : 'Make an Offer'}
                </Button>
              </div>
            </div>
            
            <button
              onClick={async () => {
                if (!isProductTranslated) {
                  const [translatedName, translatedSoldBy, translatedVendorName, translatedAddToCart, translatedMakeOffer, translatedOffLabel] = await Promise.all([
                    translateTextAsync(post.product?.name || '', 'instant'),
                    translateTextAsync('Sold by', 'instant'),
                    translateTextAsync(post.product?.vendorName || '', 'instant'),
                    translateTextAsync('Add to Cart', 'instant'),
                    translateTextAsync('Make an Offer', 'instant'),
                    translateTextAsync('% OFF', 'instant')
                  ]);
                  
                  setTranslatedProduct({
                    name: translatedName,
                    soldBy: translatedSoldBy,
                    vendorName: translatedVendorName,
                    addToCart: translatedAddToCart,
                    makeOffer: translatedMakeOffer,
                    offLabel: translatedOffLabel
                  });
                  setIsProductTranslated(true);
                } else {
                  setIsProductTranslated(false);
                }
              }}
              className="text-gray-500 text-sm hover:text-gray-700 transition-colors"
              style={{ marginTop: '7px' }}
            >
              {isProductTranslated ? showOriginalText : translateBtnText}
            </button>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex flex-col gap-3 border-t pt-4 pb-4">
        {/* Social actions - permanently visible */}
        <div className="flex justify-between w-full">
          {/* Stats display */}
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <span>{post.likes} {likeText}</span>
            <span>•</span>
            <span>{post.comments} {commentBtnText}</span>
            <span>•</span>
            <span>{post.shares} {shareText}</span>
          </div>
          
          {/* Action buttons - always visible */}
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="sm"
              className={`flex items-center gap-2 px-3 py-1.5 ${post.isLiked ? "text-black" : "text-gray-700 hover:bg-gray-100"} transition-colors`}
              onClick={() => requireAuth("like", handleLike)}
              disabled={likeMutation.isPending}
              data-testid="button-like-post"
            >
              {likeMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Heart className={`h-4 w-4 ${post.isLiked ? "fill-current" : ""}`} />
              )}
              <span className="text-sm font-medium">{likeText}</span>
            </Button>
            
            <Button 
              variant="ghost" 
              size="sm"
              className="flex items-center gap-2 px-3 py-1.5 text-gray-700 hover:bg-gray-100 transition-colors"
              onClick={() => requireAuth("comment", handleComment)}
              data-testid="button-comment-post"
            >
              <MessageSquare className="h-4 w-4" />
              <span className="text-sm font-medium">{commentBtnText}</span>
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="flex items-center gap-2 px-3 py-1.5 text-gray-700 hover:bg-gray-100 transition-colors"
                  data-testid="button-share-post"
                >
                  <Share2 className="h-4 w-4" />
                  <span className="text-sm font-medium">{shareText}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => requireAuth("share", () => setIsShareModalOpen(true))}
                >
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Message
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    const subject = `Check out this post from ${post.user.name}`;
                    const body = `${post.content}\n\nView original post: ${window.location.origin}/post/${post.id}`;
                    window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
                  }}
                >
                  <Mail className="mr-2 h-4 w-4" />
                  E-mail
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => requireAuth("repost", () => setIsRepostModalOpen(true))}
                  disabled={repostMutation.isPending}
                >
                  {repostMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Repeat2 className="mr-2 h-4 w-4" />
                  )}
                  Repost
                </DropdownMenuItem>
                {isMobileDevice() && (
                  <DropdownMenuItem onClick={shareViaSMS}>
                    <Smartphone className="mr-2 h-4 w-4 text-green-600" />
                    {shareViaTextMessageText || "Share via Text Message"}
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

      </CardFooter>
      {/* Comment input section */}
      {isCommenting && (
        <div className="p-4 pt-0 border-t">
          <div className="flex gap-3">
            <ResolvedUserAvatar
              user={currentUser || undefined}
              size="sm"
              className="h-8 w-8"
            />
            <div className="flex-1 relative">
              <Textarea 
                placeholder={writeMessageText}
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                className="pr-20 min-h-[80px]"
              />
              <div className="absolute right-12 bottom-2">
                <EmojiPickerComponent
                  onEmojiSelect={(emoji: string) => setCommentInput((prev: string) => prev + emoji)}
                  className="text-muted-foreground hover:text-foreground"
                />
              </div>
              <Button
                size="icon"
                variant="ghost"
                className="absolute right-2 bottom-2"
                onClick={handleSubmitComment}
                disabled={commentMutation.isPending || !commentInput.trim()}
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
                  <ResolvedUserAvatar
                    user={comment.user}
                    size="sm"
                    className="h-8 w-8"
                  />
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
      {/* Make Offer Modal */}
      <Dialog open={isOfferModalOpen} onOpenChange={setIsOfferModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Make an Offer</DialogTitle>
            <DialogDescription>
              Send an offer to {post.user.name} for this item
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="offer-currency" className="text-right font-medium">Currency</label>
              <Select value={offerCurrency} onValueChange={setOfferCurrency}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px] overflow-y-auto">
                  {currencies.map((currency) => (
                    <SelectItem key={currency.code} value={currency.code}>
                      {currency.code} ({currency.symbol}) - {currency.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="offer-amount" className="text-right font-medium">Amount</label>
              <Input
                id="offer-amount"
                type="number"
                placeholder="0.00"
                value={offerAmount}
                onChange={(e) => setOfferAmount(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <label htmlFor="offer-message" className="text-right font-medium pt-2">
                Message Seller
              </label>
              <Textarea
                id="offer-message"
                placeholder="Message Seller"
                value={offerMessage}
                onChange={(e) => setOfferMessage(e.target.value)}
                className="col-span-3 min-h-[80px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsOfferModalOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSendOffer}
              disabled={offerMutation.isPending}
              className="bg-black hover:bg-gray-800 text-white"
            >
              {offerMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                "Send Offer"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Share Modal */}
      <Dialog open={isShareModalOpen} onOpenChange={setIsShareModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Share Post</DialogTitle>
            <DialogDescription>
              Send this post to a user via message
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="select-user" className="text-right font-medium">Send to</label>
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a user" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user: any) => (
                    <SelectItem key={user.id} value={user.id.toString()}>
                      {user.name} (@{user.username})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <label htmlFor="share-message" className="text-right font-medium pt-2">
                Message
              </label>
              <Textarea
                id="share-message"
                placeholder="Add a message..."
                value={shareMessage}
                onChange={(e) => setShareMessage(e.target.value)}
                className="col-span-3 min-h-[80px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsShareModalOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={() => {
                if (selectedUser && shareMessage) {
                  sendMessageMutation.mutate({ userId: selectedUser, message: shareMessage });
                }
              }}
              disabled={sendMessageMutation.isPending || !selectedUser || !shareMessage}
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              {sendMessageMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                "Send Message"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Friend Request Modal */}
      <Dialog open={isFriendRequestModalOpen} onOpenChange={setIsFriendRequestModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add Friend</DialogTitle>
            <DialogDescription>
              Send a friend request to {post.user.name}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-start gap-4">
              <label htmlFor="friend-request-message" className="text-right font-medium pt-2">
                Message (Optional)
              </label>
              <Textarea
                id="friend-request-message"
                placeholder="Add a personal message..."
                value={friendRequestMessage}
                onChange={(e) => setFriendRequestMessage(e.target.value)}
                className="col-span-3 min-h-[80px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsFriendRequestModalOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={() => {
                friendRequestMutation.mutate(friendRequestMessage || "Hi! I'd like to be friends.");
              }}
              disabled={friendRequestMutation.isPending}
              className="bg-black hover:bg-gray-800 text-white"
            >
              {friendRequestMutation.isPending ? "Sending..." : "Send Friend Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Repost Modal */}
      <Dialog open={isRepostModalOpen} onOpenChange={setIsRepostModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Repost</DialogTitle>
            <DialogDescription>
              Do you want to add text to your repost?
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-3">
              <Button 
                onClick={() => {
                  setIsRepostModalOpen(false);
                  setRepostText("");
                  repostMutation.mutate({ message: `Shared from @${post.user.username}` });
                }}
                disabled={repostMutation.isPending}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                {repostMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Reposting...
                  </>
                ) : (
                  "Repost without text"
                )}
              </Button>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    or
                  </span>
                </div>
              </div>
              
              <div className="space-y-2">
                <Textarea
                  placeholder="Add your thoughts about this post..."
                  value={repostText}
                  onChange={(e) => setRepostText(e.target.value)}
                  className="min-h-[80px]"
                />
                <Button 
                  onClick={() => {
                    setIsRepostModalOpen(false);
                    const message = repostText.trim() 
                      ? `${repostText}\n\nShared from @${post.user.username}` 
                      : `Shared from @${post.user.username}`;
                    repostMutation.mutate({ message });
                    setRepostText("");
                  }}
                  disabled={repostMutation.isPending}
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                >
                  {repostMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Reposting...
                    </>
                  ) : (
                    "Repost with text"
                  )}
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsRepostModalOpen(false);
                setRepostText("");
              }}
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Login Prompt Modal */}
      <LoginPromptModal 
        isOpen={isOpen} 
        onClose={closePrompt} 
        action={action} 
      />

      {/* Report Post Dialog */}
      <ReportPostDialog 
        postId={post.id}
        isOpen={isReportDialogOpen}
        onClose={() => setIsReportDialogOpen(false)}
      />
    </Card>
  );
}