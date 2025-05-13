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
  Search
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
import { Input } from "@/components/ui/input";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";

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

  // Create/Edit post mutation
  const postMutation = useMutation({
    mutationFn: async (postData: any) => {
      const url = editingPost
        ? `/api/posts/${editingPost.id}`
        : "/api/posts";
      
      const method = editingPost ? "PUT" : "POST";
      
      // Get auth token directly from localStorage for direct authentication
      const authToken = localStorage.getItem('dedwen_auth_token');
      
      // Create options with enhanced authentication
      const options = {
        headers: {
          // Include auth token if available for JWT auth
          ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {}),
          // Include additional headers for debugging
          'X-Client-Auth': 'true',
          'X-Request-Time': new Date().toISOString(),
        }
      };
      
      // Pass options to apiRequest for enhanced authentication
      const response = await apiRequest(method, url, postData, options);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error("Post creation error:", errorData);
        throw new Error(errorData.message || "Failed to save post");
      }
      
      return response.json();
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
      toast({
        title: "Error",
        description: error.message || "Failed to save post",
        variant: "destructive",
      });
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
    
    // Validate based on content type
    if (contentType === 'article' && !title.trim()) {
      toast({
        title: "Title required",
        description: "Please add a title to your article",
        variant: "destructive",
      });
      return;
    }
    
    if (!content.trim()) {
      toast({
        title: "Post content required",
        description: "Please add some content to your post",
        variant: "destructive",
      });
      return;
    }
    
    if (contentType === 'visual' && !imageFile && !imagePreview) {
      toast({
        title: "Image required",
        description: "Please upload an image for your visual post",
        variant: "destructive",
      });
      return;
    }
    
    if (contentType === 'video' && !videoFile && !videoPreview) {
      toast({
        title: "Video required", 
        description: "Please upload a video for your video post",
        variant: "destructive",
      });
      return;
    }
    
    if (contentType === 'advertisement' && !title.trim()) {
      toast({
        title: "Title required",
        description: "Please add a title to your advertisement",
        variant: "destructive",
      });
      return;
    }
    
    // Create post data object to send as JSON
    const postData: any = {
      content,
      contentType,
    };
    
    if (title.trim()) {
      postData.title = title;
    }
    
    if (tags.length > 0) {
      postData.tags = tags;
    }
    
    // Handle media files
    try {
      if (imageFile) {
        const base64Image = await fileToBase64(imageFile);
        postData.imageUrl = base64Image;
      } else if (imagePreview && !imageFile) {
        // Use existing image URL if editing post
        postData.imageUrl = imagePreview;
      }
      
      if (videoFile) {
        const base64Video = await fileToBase64(videoFile);
        postData.videoUrl = base64Video;
      } else if (videoPreview && !videoFile) {
        // Use existing video URL if editing post
        postData.videoUrl = videoPreview;
      }
    } catch (error) {
      toast({
        title: "File upload error",
        description: "There was a problem processing your media files",
        variant: "destructive",
      });
      return;
    }
    
    if (linkUrl.trim()) {
      postData.linkUrl = linkUrl;
    }
    
    // Add product tagging if enabled
    if (isShoppable && selectedProduct) {
      postData.isShoppable = true;
      postData.productId = selectedProduct.id;
    }
    
    // Add promotion status for advertisements
    if (contentType === 'advertisement') {
      postData.isPromoted = isPromoted;
    }
    
    // Add community ID if posting to community
    if (postToVisibility === "community" && selectedCommunityId) {
      postData.communityId = selectedCommunityId;
    }
    
    console.log("Sending post data:", postData);
    
    // Submit post
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
              What's on your mind, {user.name?.split(" ")[0]}?
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
                
                {/* Content textarea */}
                <Textarea
                  placeholder="What's on your mind?"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={4}
                  className="border-0 bg-accent/50 focus-visible:ring-0"
                />
                
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
                    variant="outline"
                    size="sm"
                    className="text-muted-foreground"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={!!videoFile}
                  >
                    <ImageIcon className="h-4 w-4 mr-1" />
                    Add Photo
                  </Button>
                  
                  {/* Video upload button */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-muted-foreground"
                    onClick={() => videoInputRef.current?.click()}
                    disabled={!!imageFile}
                  >
                    <Video className="h-4 w-4 mr-1" />
                    Add Video
                  </Button>
                  
                  {/* Product tagging button */}
                  <Dialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen}>
                    <DialogTrigger asChild>
                      <Button 
                        variant={selectedProduct ? "default" : "outline"}
                        size="sm"
                      >
                        <ShoppingBag className="h-4 w-4 mr-1" />
                        {selectedProduct ? "Product Tagged" : "Tag Product"}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Select a Product to Tag</DialogTitle>
                        <DialogDescription>
                          Tag a product to make your post shoppable. Users can view and purchase the product directly from your post.
                        </DialogDescription>
                      </DialogHeader>
                      
                      <div className="my-4">
                        <div className="flex gap-2 mb-4">
                          <Input
                            placeholder="Search products..."
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