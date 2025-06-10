import { useState, useRef, ChangeEvent } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { getInitials } from "@/lib/utils";
import { useLocation } from "wouter";
import {
  Image as ImageIcon,
  Video,
  Tag,
  Link as LinkIcon,
  FileText,
  Smile,
  Users,
  Loader2,
  X,
  ChevronDown,
  MessageSquarePlus,
  PenLine,
  Book,
  Megaphone,
  ShoppingBag,
  Search,
  Calendar
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { EmojiPickerComponent } from "@/components/ui/emoji-picker";
import { useMasterBatchTranslation } from "@/hooks/use-master-translation";

interface CreatePostProps {
  communityId?: number;
  editingPost?: any;
  onSuccess?: () => void;
}

type ContentType = 'standard' | 'article' | 'visual' | 'video' | 'advertisement';

// Product interface
interface Product {
  id: number;
  name: string;
  price: number;
  imageUrl: string;
  vendorId: number;
  vendorName?: string;
  discountPrice?: number | null;
  category?: string;
}

export default function CreatePost({
  communityId,
  editingPost,
  onSuccess,
}: CreatePostProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Translation setup
  const textsToTranslate = [
    "What's on your mind",
    "Cancel",
    "Post",
    "Update",
    "Posting...",
    "Updating...",
    "Add Photo",
    "Add Video",
    "Share Event",
    "Event Tagged",
    "Tag Product", 
    "Product Tagged",
    "Select an Event to Share",
    "Share an event with your followers. They can view event details and purchase tickets directly from your post.",
    "Search events...",
    "No events found",
    "Confirm Selection",
    "Select a Product to Tag",
    "Tag a product to make your post shoppable. Users can view and purchase the product directly from your post.",
    "Search products...",
    "No products found"
  ];

  const { translations } = useMasterBatchTranslation(textsToTranslate);

  const whatsOnYourMindText = translations[0] || "What's on your mind";
  const cancelText = translations[1] || "Cancel";
  const postText = translations[2] || "Post";
  const updateText = translations[3] || "Update";
  const postingText = translations[4] || "Posting...";
  const updatingText = translations[5] || "Updating...";
  const addPhotoText = translations[6] || "Add Photo";
  const addVideoText = translations[7] || "Add Video";
  const shareEventText = translations[8] || "Share Event";
  const eventTaggedText = translations[9] || "Event Tagged";
  const tagProductText = translations[10] || "Tag Product";
  const productTaggedText = translations[11] || "Product Tagged";
  const selectEventText = translations[12] || "Select an Event to Share";
  const shareEventDescText = translations[13] || "Share an event with your followers. They can view event details and purchase tickets directly from your post.";
  const searchEventsText = translations[14] || "Search events...";
  const noEventsText = translations[15] || "No events found";
  const confirmSelectionText = translations[16] || "Confirm Selection";
  const selectProductText = translations[17] || "Select a Product to Tag";
  const tagProductDescText = translations[18] || "Tag a product to make your post shoppable. Users can view and purchase the product directly from your post.";
  const searchProductsText = translations[19] || "Search products...";
  const noProductsText = translations[20] || "No products found";
  const [, setLocation] = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  
  const [content, setContent] = useState(editingPost?.content || "");
  const [title, setTitle] = useState(editingPost?.title || "");
  const [tags, setTags] = useState<string[]>(editingPost?.tags || []);
  const [currentTag, setCurrentTag] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>(editingPost?.imageUrl || "");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string>(editingPost?.videoUrl || "");
  const [isExpanded, setIsExpanded] = useState(!!editingPost);
  const [postToVisibility, setPostToVisibility] = useState<string>(editingPost?.communityId ? "community" : "public");
  const [selectedCommunityId, setSelectedCommunityId] = useState<number | null>(
    editingPost?.communityId || communityId || null
  );
  const [contentType, setContentType] = useState<ContentType>(editingPost?.contentType || 'standard');
  const [linkUrl, setLinkUrl] = useState(editingPost?.linkUrl || "");
  const [isPromoted, setIsPromoted] = useState(editingPost?.isPromoted || false);
  
  // Product tagging
  const [isShoppable, setIsShoppable] = useState(editingPost?.isShoppable || false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(editingPost?.product || null);
  const [productSearchQuery, setProductSearchQuery] = useState("");
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);

  // Event tagging
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [eventSearchQuery, setEventSearchQuery] = useState("");
  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false);

  // Fetch communities that the user is a member of
  const { data: userCommunities, isLoading: isLoadingCommunities } = useQuery({
    queryKey: ["/api/users/communities"],
    queryFn: async () => {
      const response = await fetch("/api/users/communities");
      if (!response.ok) {
        throw new Error("Failed to fetch user communities");
      }
      return response.json();
    },
    enabled: !!user,
  });

  // Fetch products for tagging
  const { data: products, isLoading: isLoadingProducts } = useQuery({
    queryKey: ["/api/products", productSearchQuery],
    queryFn: async () => {
      const url = productSearchQuery 
        ? `/api/products?search=${encodeURIComponent(productSearchQuery)}`
        : "/api/products";
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to fetch products");
      }
      return response.json();
    },
    enabled: isProductDialogOpen
  });

  // Fetch events for tagging
  const { data: events, isLoading: isLoadingEvents } = useQuery({
    queryKey: ["/api/events", eventSearchQuery],
    queryFn: async () => {
      const url = eventSearchQuery 
        ? `/api/events?search=${encodeURIComponent(eventSearchQuery)}`
        : "/api/events";
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to fetch events");
      }
      return response.json();
    },
    enabled: isEventDialogOpen
  });

  // Create/Edit post mutation
  const postMutation = useMutation({
    mutationFn: async (postData: any) => {
      const url = editingPost
        ? `/api/posts/${editingPost.id}`
        : "/api/posts";
      
      const method = editingPost ? "PUT" : "POST";
      
      // Log authentication state for debugging
      console.log("Authentication state:", { 
        user: user ? `ID: ${user.id}, Username: ${user.username}` : 'Not logged in',
        isAuthenticated: !!user
      });
      
      // Get auth token directly from localStorage for direct authentication
      const authToken = localStorage.getItem('dedwen_auth_token');
      console.log("Auth token available:", !!authToken);
      
      // Enhanced debugging for post data
      console.log("Post data being sent:", { 
        ...postData,
        content: postData.content?.length > 50 ? 
          `${postData.content.substring(0, 50)}... (${postData.content.length} chars)` : 
          postData.content,
        imageUrl: postData.imageUrl ? 
          (postData.imageUrl.startsWith('data:') ? 
            `[base64 data - ${postData.imageUrl.length} chars]` : 
            postData.imageUrl) : 
          'none'
      });
      
      // Create options with enhanced debugging headers
      const options = {
        headers: {
          // Include auth token if available for JWT auth
          ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {}),
          // Add session cookie support flag
          'X-Use-Session': 'true',
          'X-Client-Auth': 'true',
          'X-Request-Time': new Date().toISOString(),
          'X-Client-User-ID': user?.id?.toString() || '',
          'Accept': 'application/json',
        }
      };
      
      console.log(`Sending ${method} request to ${url} with headers:`, options.headers);
      
      try {
        // Use simple fetch for direct debugging instead of apiRequest
        const response = await fetch(url, {
          method,
          credentials: 'include', // Important for cookies
          headers: {
            ...options.headers,
            'Content-Type': 'application/json' // Simplified to use JSON format consistently
          },
          body: JSON.stringify(postData)
        });
        
        console.log(`Server response status: ${response.status} ${response.statusText}`);
        
        // Log response headers for debugging
        const headers: Record<string, string> = {};
        response.headers.forEach((value, key) => {
          headers[key] = value;
        });
        console.log("Response headers:", headers);
        
        if (!response.ok) {
          let errorMessage = "Failed to save post";
          let errorDetails = '';
          
          try {
            const errorData = await response.json();
            console.error("Post creation error:", errorData);
            errorMessage = errorData.message || errorMessage;
            errorDetails = JSON.stringify(errorData, null, 2);
          } catch (e) {
            // If it's not JSON, get the response text
            const text = await response.text();
            console.error("Non-JSON error response:", text);
            errorMessage = `Server error (${response.status}): ${response.statusText}`;
            errorDetails = text;
          }
          
          throw new Error(`${errorMessage}\n${errorDetails}`);
        }
        
        return response.json();
      } catch (error) {
        console.error("Post submission error:", error);
        throw error;
      }
    },
    onSuccess: () => {
      // Reset form
      setContent("");
      setTitle("");
      setTags([]);
      setCurrentTag("");
      setImageFile(null);
      setImagePreview("");
      setVideoFile(null);
      setVideoPreview("");
      setIsExpanded(false);
      setPostToVisibility("public");
      setSelectedCommunityId(communityId || null);
      setSelectedProduct(null);
      setIsShoppable(false);
      setSelectedEvent(null);
      
      // Show success message
      toast({
        title: "Success",
        description: editingPost ? "Post updated successfully" : "Post created successfully",
      });
      
      // Invalidate queries to refresh post lists
      queryClient.invalidateQueries({ 
        queryKey: ["/api/feed/personal"],
        refetchType: 'all'
      });
      queryClient.invalidateQueries({ 
        queryKey: ["/api/feed/communities"],
        refetchType: 'all' 
      });
      queryClient.invalidateQueries({ 
        queryKey: ["/api/feed/recommended"],
        refetchType: 'all'
      });
      queryClient.invalidateQueries({ 
        queryKey: ["/api/posts"],
        refetchType: 'all'
      });
      queryClient.invalidateQueries({ 
        queryKey: [`/api/users/${user?.username}/posts`],
        refetchType: 'all'
      });
      
      // Invalidate user stats queries to refresh post count
      queryClient.invalidateQueries({ 
        queryKey: ['/api/user/stats'],
        refetchType: 'all'
      });
      queryClient.invalidateQueries({ 
        queryKey: [`/api/users/${user?.id}/stats`],
        refetchType: 'all'
      });
      queryClient.invalidateQueries({ 
        queryKey: ['/api/social/posts/count'],
        refetchType: 'all'
      });
      
      if (communityId) {
        queryClient.invalidateQueries({ 
          queryKey: [`/api/communities/${communityId}/posts`],
          refetchType: 'all'
        });
      }
      
      if (selectedCommunityId) {
        queryClient.invalidateQueries({ 
          queryKey: [`/api/communities/${selectedCommunityId}/posts`],
          refetchType: 'all'
        });
      }
      
      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error: Error) => {
      console.error('Post mutation error details:', error);
      
      // Extract meaningful message parts
      let errorMessage = error.message || "Failed to save post";
      if (errorMessage.length > 100) {
        errorMessage = errorMessage.substring(0, 100) + "...";
      }
      
      // Show toast with improved error details
      toast({
        title: "Post Creation Failed",
        description: errorMessage,
        variant: "destructive",
      });
      
      // Show more detailed console error for debugging
      console.error('Full error message:', error.message);
      
      // Try to recover application state
      setIsExpanded(true); // Keep form open to allow editing
    },
  });

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file",
        description: "Please select an image file (JPEG, PNG, etc.)",
        variant: "destructive",
      });
      return;
    }
    
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setVideoFile(null);
    setVideoPreview("");
  };

  const handleVideoChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith("video/")) {
      toast({
        title: "Invalid file",
        description: "Please select a video file (MP4, WebM, etc.)",
        variant: "destructive",
      });
      return;
    }
    
    setVideoFile(file);
    setVideoPreview(URL.createObjectURL(file));
    setImageFile(null);
    setImagePreview("");
  };

  const addTag = () => {
    if (!currentTag.trim()) return;
    
    if (tags.includes(currentTag.trim())) {
      toast({
        title: "Duplicate tag",
        description: "This tag has already been added",
        variant: "destructive",
      });
      return;
    }
    
    if (tags.length >= 5) {
      toast({
        title: "Too many tags",
        description: "You can add a maximum of 5 tags",
        variant: "destructive",
      });
      return;
    }
    
    setTags([...tags, currentTag.trim()]);
    setCurrentTag("");
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  // Function to convert File to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handleSubmit = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to create a post",
        variant: "destructive",
      });
      setLocation("/auth");
      return;
    }
    
    // Validate required fields
    if (!content.trim()) {
      toast({
        title: "Post content required",
        description: "Please add some content to your post",
        variant: "destructive",
      });
      return;
    }
    
    // Create post data object with required fields including user ID
    const postData: any = {
      content,
      contentType: 'standard',
      userId: user.id, // Explicitly include user ID for server authentication
    };
    
    // Only add title if present
    if (title.trim()) {
      postData.title = title;
    }
    
    // Add selected event if present
    if (selectedEvent) {
      postData.eventId = selectedEvent.id;
    }
    
    // Handle image if present - keep payload as small as possible
    try {
      if (imageFile) {
        const base64Image = await fileToBase64(imageFile);
        postData.imageUrl = base64Image;
      } else if (imagePreview && !imageFile) {
        // Use existing image URL if editing post
        postData.imageUrl = imagePreview;
      }
    } catch (error) {
      toast({
        title: "File upload error",
        description: "There was a problem processing your image file",
        variant: "destructive",
      });
      return;
    }
    
    // Debug information to help troubleshoot
    console.log("Sending post data - content length:", postData.content.length);
    console.log("Post data keys:", Object.keys(postData));
    
    // Submit post with specific options to ensure proper formatting
    toast({
      title: "Creating post...",
      description: "Please wait while we process your post",
    });
    
    // Submit post with application/x-www-form-urlencoded format
    postMutation.mutate(postData);
  };

  if (!user) {
    return null;
  }

  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        {/* Initial collapsed view */}
        {!isExpanded && (
          <div 
            className="flex items-center gap-3 cursor-text"
            onClick={() => setIsExpanded(true)}
          >
            <Avatar className="h-10 w-10">
              {user.avatar ? (
                <AvatarImage 
                  src={user.avatar} 
                  alt={user.name || "User"}
                />
              ) : null}
              <AvatarFallback>
                {getInitials(user.name || "User")}
              </AvatarFallback>
            </Avatar>
            <div className="bg-accent px-4 py-2 rounded-full text-muted-foreground flex-1">
              {whatsOnYourMindText}, {user.name?.split(" ")[0]}?
            </div>
          </div>
        )}
        
        {/* Expanded post creation UI */}
        {isExpanded && (
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Avatar className="h-10 w-10">
                {user.avatar ? (
                  <AvatarImage 
                    src={user.avatar} 
                    alt={user.name || "User"}
                  />
                ) : null}
                <AvatarFallback>
                  {getInitials(user.name || "User")}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 space-y-3">
                <p className="font-medium">{user.name}</p>
                

                

                
                {/* Title input removed as requested */}
                
                {/* Content textarea with emoji picker */}
                <div className="relative">
                  <Textarea
                    placeholder={whatsOnYourMindText + "?"}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={4}
                    className="border-0 bg-accent/50 focus-visible:ring-0 pr-10"
                  />
                  <div className="absolute bottom-2 right-2">
                    <EmojiPickerComponent
                      onEmojiSelect={(emoji: string) => setContent((prev: string) => prev + emoji)}
                      className="text-muted-foreground hover:text-foreground"
                    />
                  </div>
                </div>
                
                {/* Image preview */}
                {imagePreview && (
                  <div className="relative">
                    <img 
                      src={imagePreview} 
                      alt="Post preview" 
                      className="max-h-64 rounded-md object-contain w-full"
                    />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 h-6 w-6 rounded-full"
                      onClick={() => {
                        setImageFile(null);
                        setImagePreview("");
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                
                {/* Video preview */}
                {videoPreview && (
                  <div className="relative">
                    <video 
                      src={videoPreview} 
                      controls 
                      className="max-h-64 rounded-md w-full"
                    />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 h-6 w-6 rounded-full"
                      onClick={() => {
                        setVideoFile(null);
                        setVideoPreview("");
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                
                {/* Tags */}
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag, index) => (
                      <div 
                        key={index}
                        className="bg-primary/10 text-primary rounded-full px-3 py-1 text-xs flex items-center"
                      >
                        #{tag}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-4 w-4 ml-1"
                          onClick={() => removeTag(tag)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                

              </div>
            </div>
            
            {/* Content Type Selector Tabs */}
            <Tabs
              value={contentType}
              onValueChange={(value) => setContentType(value as ContentType)}
              className="w-full pt-3 border-t"
            >


              {/* Standard Post Content */}
              <TabsContent value="standard" className="space-y-2">
                <div className="flex gap-2 mt-3">
                  {/* Image upload button */}
                  <Button
                    size="sm"
                    className="bg-black text-white hover:bg-gray-800"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={!!videoFile}
                  >
                    <ImageIcon className="h-3 w-3 mr-1 font-bold" />
                    <span className="font-semibold">{addPhotoText}</span>
                  </Button>
                  
                  {/* Video upload button */}
                  <Button
                    size="sm"
                    className="bg-black text-white hover:bg-gray-800"
                    onClick={() => videoInputRef.current?.click()}
                    disabled={!!imageFile}
                  >
                    <Video className="h-3 w-3 mr-1 font-bold" />
                    <span className="font-semibold">{addVideoText}</span>
                  </Button>
                  
                  {/* Events & Meetups button */}
                  <Dialog open={isEventDialogOpen} onOpenChange={setIsEventDialogOpen}>
                    <DialogTrigger asChild>
                      <Button 
                        size="sm"
                        className="bg-black text-white hover:bg-gray-800"
                      >
                        <Calendar className="h-3 w-3 mr-1 font-bold" />
                        <span className="font-semibold">{selectedEvent ? eventTaggedText : shareEventText}</span>
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>{selectEventText}</DialogTitle>
                        <DialogDescription>
                          {shareEventDescText}
                        </DialogDescription>
                      </DialogHeader>
                      
                      <div className="my-4">
                        <div className="flex gap-2 mb-4">
                          <Input
                            placeholder={searchEventsText}
                            value={eventSearchQuery}
                            onChange={(e) => setEventSearchQuery(e.target.value)}
                            className="flex-1"
                          />
                          <Button variant="secondary" size="icon">
                            <Search className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        <ScrollArea className="h-[300px] rounded-md border p-2">
                          {isLoadingEvents ? (
                            <div className="flex justify-center py-10">
                              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                            </div>
                          ) : events && events.length > 0 ? (
                            <div className="space-y-3">
                              {events.map((event: any) => (
                                <div 
                                  key={event.id}
                                  className={`flex gap-3 p-2 rounded-md cursor-pointer transition-colors ${
                                    selectedEvent?.id === event.id
                                      ? "bg-primary/10 border border-primary/30"
                                      : "hover:bg-muted"
                                  }`}
                                  onClick={() => setSelectedEvent(event)}
                                >
                                  <div className="h-16 w-16 rounded overflow-hidden flex-shrink-0 bg-blue-50">
                                    <div className="h-full w-full flex items-center justify-center">
                                      <Calendar className="h-6 w-6 text-blue-600" />
                                    </div>
                                  </div>
                                  <div className="flex-1">
                                    <h3 className="font-medium text-sm">{event.title}</h3>
                                    <p className="text-xs text-muted-foreground mb-1">
                                      {event.location} • {new Date(event.startDate).toLocaleDateString()}
                                    </p>
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm font-semibold text-blue-600">
                                        {event.price === 0 ? 'Free' : `£${event.price}`}
                                      </span>
                                      <span className="text-xs text-muted-foreground">
                                        {event.attendees || 0} attending
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-10 text-muted-foreground">
                              <p>{noEventsText}</p>
                            </div>
                          )}
                        </ScrollArea>
                      </div>
                      
                      <DialogFooter>
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            setIsEventDialogOpen(false);
                            setSelectedEvent(null);
                          }}
                        >
                          {cancelText}
                        </Button>
                        <Button 
                          onClick={() => {
                            setIsEventDialogOpen(false);
                          }}
                          disabled={!selectedEvent}
                        >
                          {confirmSelectionText}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                  
                  {/* Product tagging button */}
                  <Dialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen}>
                    <DialogTrigger asChild>
                      <Button 
                        size="sm"
                        className="bg-black text-white hover:bg-gray-800"
                      >
                        <ShoppingBag className="h-3 w-3 mr-1 font-bold" />
                        <span className="font-semibold">{selectedProduct ? productTaggedText : tagProductText}</span>
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>{selectProductText}</DialogTitle>
                        <DialogDescription>
                          {tagProductDescText}
                        </DialogDescription>
                      </DialogHeader>
                      
                      <div className="my-4">
                        <div className="flex gap-2 mb-4">
                          <Input
                            placeholder={searchProductsText}
                            value={productSearchQuery}
                            onChange={(e) => setProductSearchQuery(e.target.value)}
                            className="flex-1"
                          />
                          <Button variant="secondary" size="icon">
                            <Search className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        <ScrollArea className="h-[300px] rounded-md border p-2">
                          {isLoadingProducts ? (
                            <div className="flex justify-center py-10">
                              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                            </div>
                          ) : products && products.length > 0 ? (
                            <div className="space-y-3">
                              {products.map((product: Product) => (
                                <div 
                                  key={product.id}
                                  className={`flex gap-3 p-2 rounded-md cursor-pointer transition-colors ${
                                    selectedProduct?.id === product.id
                                      ? "bg-primary/10 border border-primary/30"
                                      : "hover:bg-muted"
                                  }`}
                                  onClick={() => setSelectedProduct(product)}
                                >
                                  <div className="h-16 w-16 rounded overflow-hidden flex-shrink-0">
                                    <img 
                                      src={product.imageUrl} 
                                      alt={product.name}
                                      className="h-full w-full object-cover"
                                    />
                                  </div>
                                  <div className="flex-1">
                                    <h3 className="font-medium text-sm">{product.name}</h3>
                                    <p className="text-xs text-muted-foreground mb-1">
                                      {product.category || "Uncategorized"}
                                    </p>
                                    <div className="flex items-center gap-2">
                                      {product.discountPrice ? (
                                        <>
                                          <span className="text-xs line-through text-muted-foreground">
                                            £{product.price.toFixed(2)}
                                          </span>
                                          <span className="text-sm font-semibold text-primary">
                                            £{product.discountPrice.toFixed(2)}
                                          </span>
                                        </>
                                      ) : (
                                        <span className="text-sm font-semibold">
                                          £{product.price.toFixed(2)}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-10 text-muted-foreground">
                              <p>No products found</p>
                            </div>
                          )}
                        </ScrollArea>
                      </div>
                      
                      <DialogFooter>
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            setIsProductDialogOpen(false);
                            setSelectedProduct(null);
                          }}
                        >
                          Cancel
                        </Button>
                        <Button 
                          onClick={() => {
                            setIsProductDialogOpen(false);
                            setIsShoppable(!!selectedProduct);
                          }}
                          disabled={!selectedProduct}
                        >
                          Confirm Selection
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
                
                {/* Selected Product Preview */}
                {selectedProduct && (
                  <div className="border rounded-md p-3 bg-muted/30 mt-3 flex items-center gap-3">
                    <div className="h-14 w-14 rounded overflow-hidden flex-shrink-0">
                      <img 
                        src={selectedProduct.imageUrl} 
                        alt={selectedProduct.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-sm">{selectedProduct.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        {selectedProduct.discountPrice ? (
                          <>
                            <span className="text-xs line-through text-muted-foreground">
                              £{selectedProduct.price.toFixed(2)}
                            </span>
                            <span className="text-sm font-semibold text-primary">
                              £{selectedProduct.discountPrice.toFixed(2)}
                            </span>
                          </>
                        ) : (
                          <span className="text-sm font-semibold">
                            £{selectedProduct.price.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => {
                        setSelectedProduct(null);
                        setIsShoppable(false);
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </TabsContent>




            </Tabs>

            {/* Shared upload inputs */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
            <input
              type="file"
              ref={videoInputRef}
              accept="video/*"
              onChange={handleVideoChange}
              className="hidden"
            />

            <div className="flex items-center justify-end mt-3">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsExpanded(false);
                    setContent("");
                    setTitle("");
                    setTags([]);
                    setCurrentTag("");
                    setImageFile(null);
                    setImagePreview("");
                    setVideoFile(null);
                    setVideoPreview("");
                    setPostToVisibility("public");
                    setSelectedCommunityId(communityId || null);
                    setContentType('standard');
                    setLinkUrl('');
                    setIsPromoted(false);
                  }}
                >
                  Cancel
                </Button>
                
                <Button
                  onClick={handleSubmit}
                  disabled={postMutation.isPending || !content.trim()}
                  className="bg-black text-white hover:bg-gray-800 disabled:bg-gray-400"
                >
                  {postMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      {editingPost ? "Updating..." : "Posting..."}
                    </>
                  ) : (
                    <>{editingPost ? "Update" : "Post"}</>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}