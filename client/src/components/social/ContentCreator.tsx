import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { InsertPost, Post } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { 
  Image, 
  Video, 
  FileText, 
  Tag, 
  Megaphone,
  X,
  Upload,
  CheckCircle,
  Trash
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";

type ContentType = "text" | "image" | "video";

interface ContentCreatorProps {
  onSuccess?: () => void;
  defaultContentType?: ContentType;
}

export default function ContentCreator({ onSuccess, defaultContentType = "text" }: ContentCreatorProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [contentType, setContentType] = useState<ContentType>(defaultContentType);
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [isPromoted, setIsPromoted] = useState(false);
  const [promotionDialogOpen, setPromotionDialogOpen] = useState(false);
  const [selectedPromotionPlan, setSelectedPromotionPlan] = useState("1day");
  
  // Create post mutation
  const createPostMutation = useMutation({
    mutationFn: async (postData: InsertPost) => {
      // Add invalidation of personal feed to ensure new posts appear
      queryClient.invalidateQueries({ queryKey: ["/api/feed/personal"] });
      const response = await apiRequest("POST", "/api/posts", postData);
      return response.json();
    },
    onSuccess: (data: Post) => {
      // Reset form
      setContent("");
      setTitle("");
      setImageUrl("");
      setVideoUrl("");
      setTags([]);
      setTagInput("");
      setIsPromoted(false);
      
      // Refresh posts list and feed
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/feed/personal"] });
      
      // Show success toast
      toast({
        title: t("post_created"),
        description: t("post_success_message"),
      });
      
      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error: any) => {
      toast({
        title: t("errors.error"),
        description: error.message || t("post_error"),
        variant: "destructive",
      });
    },
  });
  
  // Enhanced image upload with error handling for HTML responses
  const uploadImageMutation = useMutation({
    mutationFn: async (data: { blob: string; description: string; tags: string[] }) => {
      try {
        // First check API connection with ping endpoint
        const pingResponse = await apiRequest("POST", "/api/posts/ping", { test: true });
        
        // Check ping content type to ensure API is responding with JSON
        const pingContentType = pingResponse.headers.get("content-type");
        if (!pingContentType?.includes("application/json")) {
          throw new Error("API server is not returning JSON responses. Please refresh the page and try again.");
        }
        
        // If ping succeeds, proceed with the actual upload
        const response = await apiRequest("POST", "/api/social/upload-image", data);
        
        // First check if response is OK before trying to parse JSON
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText || `Server error: ${response.status}`);
        }
        
        // Check content type to make sure we're getting JSON back
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          return response.json();
        } else {
          // Handle non-JSON responses by throwing an appropriate error
          const text = await response.text();
          if (text.includes("<!DOCTYPE html>")) {
            console.error("Received HTML instead of JSON:", text.substring(0, 500));
            throw new Error("Received HTML instead of JSON. Server might be redirecting to an error page.");
          } else {
            throw new Error(`Unexpected response format: ${contentType || "unknown"}`);
          }
        }
      } catch (err: any) {
        console.error("Upload image error:", err);
        throw new Error(err.message || "Failed to upload image");
      }
    },
    onSuccess: (data) => {
      // Reset form
      setContent("");
      setTitle("");
      setImageUrl("");
      setVideoUrl("");
      setTags([]);
      setTagInput("");
      setIsPromoted(false);
      
      // Refresh posts list and feed
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/feed/personal"] });
      
      // Show success toast
      toast({
        title: t("post_created"),
        description: t("post_success_message"),
      });
      
      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error: any) => {
      toast({
        title: t("errors.error"),
        description: error.message || t("image_upload_error") || "Failed to upload image",
        variant: "destructive",
      });
    },
  });
  
  const handleSubmit = () => {
    if (!user) {
      toast({
        title: t("errors.error"),
        description: t("errors.unauthorized"),
        variant: "destructive",
      });
      return;
    }
    
    // Basic validation
    if (contentType === "text" && !content.trim()) {
      toast({
        title: t("errors.error"),
        description: t("content_required"),
        variant: "destructive",
      });
      return;
    }
    
    if (contentType === "image" && !imageUrl.trim()) {
      toast({
        title: t("errors.error"),
        description: t("image_required"),
        variant: "destructive",
      });
      return;
    }
    
    if (contentType === "video" && !videoUrl.trim()) {
      toast({
        title: t("errors.error"),
        description: t("video_required"),
        variant: "destructive",
      });
      return;
    }
    
    // For image content type with base64 data, use the direct blob upload API
    if (contentType === "image" && imageUrl.startsWith('data:image/')) {
      // Enhanced error handling for image uploads
      try {
        // Perform the image upload with better error handling
        uploadImageMutation.mutate({
          blob: imageUrl,
          description: content,
          tags: tags
        }, {
          onError: (error) => {
            console.error("Upload image error:", error);
            toast({
              title: t("errors.error") || "Error",
              description: "Upload failed. Please try refreshing the page and try again.",
              variant: "destructive",
            });
          }
        });
      } catch (error) {
        console.error("Upload preparation failed:", error);
        toast({
          title: t("errors.error") || "Error",
          description: "Upload failed. Please try refreshing the page and try again.",
          variant: "destructive",
        });
      }
      return;
    }
    
    // For other content types, use the standard post creation API
    // Create post
    const postData: InsertPost = {
      userId: user.id,
      content,
      contentType,
      isPublished: true,
      isPromoted: isPromoted,
    };
    
    // Add title if available
    if (title.trim()) {
      postData.title = title;
    }
    
    // Add media URLs if present
    if (imageUrl.trim()) {
      postData.imageUrl = imageUrl;
    }
    
    if (videoUrl.trim()) {
      postData.videoUrl = videoUrl;
    }
    
    // Add tags if any
    if (tags.length > 0) {
      postData.tags = tags;
    }
    
    // Submit post
    createPostMutation.mutate(postData);
  };
  
  const handleTagAdd = () => {
    const trimmedTag = tagInput.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag]);
      setTagInput("");
    }
  };
  
  const handleTagRemove = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      handleTagAdd();
    }
  };
  
  const handlePromotionSelect = () => {
    // Add promotion to user's cart based on selected plan
    const promotionDetails: Record<string, { duration: string, price: number }> = {
      '1day': { duration: '1 Day', price: 2 },
      '7days': { duration: '7 Days', price: 10 },
      '30days': { duration: '30 Days', price: 30 }
    };
    
    const selected = promotionDetails[selectedPromotionPlan];
    
    // Close dialog and set promoted state
    setPromotionDialogOpen(false);
    setIsPromoted(true);
    
    // Show confirmation toast
    toast({
      title: "Promotion Added",
      description: `${selected.duration} promotion (£${selected.price}) added to your cart.`,
    });
    
    // Here you would typically call an API to add this to the user's cart
    // apiRequest("POST", "/api/cart/add", { 
    //   type: "promotion", 
    //   plan: selectedPromotionPlan,
    //   duration: selected.duration,
    //   price: selected.price
    // });
  };
  
  return (
    <Card>
      <CardContent className="p-4">
        {/* Promotion Dialog */}
        <Dialog open={promotionDialogOpen} onOpenChange={setPromotionDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Promote Your Post</DialogTitle>
              <DialogDescription>
                Select a promotion plan to increase the visibility of your post.
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-4">
              <RadioGroup 
                value={selectedPromotionPlan} 
                onValueChange={setSelectedPromotionPlan}
                className="space-y-4"
              >
                <div className="flex items-center space-x-2 border rounded-lg p-4 hover:bg-accent cursor-pointer">
                  <RadioGroupItem value="1day" id="1day" />
                  <Label 
                    htmlFor="1day" 
                    className="flex-grow flex justify-between cursor-pointer"
                  >
                    <div>
                      <span className="font-medium">1 Day</span>
                      <p className="text-sm text-muted-foreground">
                        Short boost for immediate impact.
                      </p>
                    </div>
                    <span className="font-semibold">£2</span>
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2 border rounded-lg p-4 hover:bg-accent cursor-pointer">
                  <RadioGroupItem value="7days" id="7days" />
                  <Label 
                    htmlFor="7days" 
                    className="flex-grow flex justify-between cursor-pointer"
                  >
                    <div>
                      <span className="font-medium">7 Days</span>
                      <p className="text-sm text-muted-foreground">
                        Week-long visibility boost. Best value.
                      </p>
                    </div>
                    <span className="font-semibold">£10</span>
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2 border rounded-lg p-4 hover:bg-accent cursor-pointer">
                  <RadioGroupItem value="30days" id="30days" />
                  <Label 
                    htmlFor="30days" 
                    className="flex-grow flex justify-between cursor-pointer"
                  >
                    <div>
                      <span className="font-medium">30 Days</span>
                      <p className="text-sm text-muted-foreground">
                        Maximum exposure for a full month.
                      </p>
                    </div>
                    <span className="font-semibold">£30</span>
                  </Label>
                </div>
              </RadioGroup>
            </div>
            
            <DialogFooter className="flex justify-between sm:justify-between">
              <Button 
                variant="outline" 
                onClick={() => setPromotionDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                onClick={handlePromotionSelect}
                className="bg-green-500 hover:bg-green-600"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Add to Cart
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        <Tabs defaultValue={contentType} onValueChange={(value) => setContentType(value as ContentType)}>
          <TabsList className="w-full mb-4 grid grid-cols-3">
            <TabsTrigger value="text" className="flex items-center gap-1">
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">{t("text")}</span>
            </TabsTrigger>

          </TabsList>
          
          {/* Text Content Tab */}
          <TabsContent value="text">
            <Textarea
              placeholder="Write a Dedw"
              className="mb-4"
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </TabsContent>
          

          
          {/* No more article or advertisement tabs */}
          
          {/* Common fields for all content types */}
          <div className="mt-4">
            <div className="flex items-center space-x-2 mb-4">
              <Tag className="w-4 h-4 text-black" />
              <div className="flex-1 flex flex-wrap gap-2 items-center border rounded-md p-2">
                {tags.map((tag) => (
                  <Badge key={tag} className="flex items-center gap-1 bg-blue-100 text-blue-800 hover:bg-blue-200">
                    #{tag}
                    <X 
                      className="w-3 h-3 cursor-pointer" 
                      onClick={() => handleTagRemove(tag)}
                    />
                  </Badge>
                ))}
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onBlur={() => tagInput.trim() && handleTagAdd()}
                  placeholder="Add tags..."
                  className="flex-1 border-none shadow-none focus-visible:ring-0 min-w-[100px] h-7 p-0"
                />
              </div>
            </div>
            
            {/* Promotion checkbox moved to button next to Submit */}
          </div>
          
          <div className="flex justify-end items-center mt-4">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                onClick={() => setPromotionDialogOpen(true)}
                className={`flex items-center gap-1 px-3 ${isPromoted ? 'bg-green-600 hover:bg-green-700' : 'bg-green-500 hover:bg-green-600'}`}
              >
                <span className="text-sm text-white font-medium">
                  {isPromoted ? 'Promoted ✓' : 'Promote'}
                </span>
              </Button>
              <Button 
                onClick={handleSubmit}
                disabled={createPostMutation.isPending}
                className="bg-primary hover:bg-primary/90"
              >
                {createPostMutation.isPending ? "Sending..." : "Post"}
              </Button>
            </div>
          </div>
        </Tabs>
      </CardContent>
    </Card>
  );
}