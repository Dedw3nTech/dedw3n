import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { InsertPost, Post } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { 
  Tag, 
  X,
  CheckCircle, 
  Image as ImageIcon,
  Video as VideoIcon
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";

interface ContentCreatorProps {
  onSuccess?: () => void;
}

export default function ContentCreator({ onSuccess }: ContentCreatorProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Content form state
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [isPromoted, setIsPromoted] = useState(false);
  const [promotionDialogOpen, setPromotionDialogOpen] = useState(false);
  const [selectedPromotionPlan, setSelectedPromotionPlan] = useState("1day");
  
  // Media state
  const [mediaType, setMediaType] = useState<"none" | "image" | "video">("none");
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [mediaData, setMediaData] = useState<any | null>(null);
  
  // File input references
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  
  // Upload media mutation
  const uploadMediaMutation = useMutation({
    mutationFn: async ({ file, type }: { file: File, type: "image" | "video" }) => {
      console.log(`Uploading ${type} file to server...`);
      
      // Create FormData object for the multipart/form-data upload
      const formData = new FormData();
      formData.append('media', file);
      formData.append('type', type);
      
      // Use the media upload endpoint
      const endpoint = '/api/media/upload';
      
      // First try the FormData upload
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          body: formData,
        });
        
        if (!response.ok) {
          throw new Error(`Upload failed with status: ${response.status}`);
        }
        
        return await response.json();
      } catch (formError) {
        console.warn('FormData upload failed, falling back to base64:', formError);
        
        // Fallback to base64 if FormData fails
        return new Promise<any>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = async (e) => {
            const base64Data = e.target?.result as string;
            
            try {
              const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ file: base64Data, type }),
              });
              
              if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to upload media');
              }
              
              resolve(await response.json());
            } catch (error) {
              reject(error);
            }
          };
          reader.onerror = () => reject(new Error('Failed to read file'));
          reader.readAsDataURL(file);
        });
      }
    },
    onSuccess: (data) => {
      console.log('Media upload success data:', data);
      
      // Show success toast
      toast({
        title: "Media Uploaded",
        description: "Your media has been uploaded successfully",
      });
      
      // Store both the media URL and original data for use later in form submission
      // We keep the local preview URL for display during editing
      if (data.mediaUrl) {
        // For server-side we want to use the full URL with proper server path
        // This will help ensure the media is correctly associated with the post
        const serverMediaUrl = data.fullUrl || data.mediaUrl;
        console.log('Setting media URL for post:', serverMediaUrl);
        
        // Store the media data in a ref or state for use during submission
        setMediaData(data);
        setUploadingMedia(false);
      }
    },
    onError: (error: any) => {
      console.error('Media upload failed:', error);
      setUploadingMedia(false);
      setMediaType("none");
      setMediaPreview(null);
      setMediaData(null);
      
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload media. Please try again.",
        variant: "destructive",
      });
    }
  });
  
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
      setTags([]);
      setTagInput("");
      setIsPromoted(false);
      setMediaType("none");
      setMediaPreview(null);
      setMediaData(null);
      
      // Refresh posts list and feed
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/feed/personal"] });
      
      // Show success toast
      toast({
        title: t("post_created") || "Post Created",
        description: t("post_success_message") || "Your post has been published successfully.",
      });
      
      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error: any) => {
      toast({
        title: t("errors.error") || "Error",
        description: error.message || t("post_error") || "Failed to create post",
        variant: "destructive",
      });
    },
  });
  
  // Handle image upload button click
  const handleShareImage = () => {
    if (imageInputRef.current) {
      imageInputRef.current.click();
    }
  };
  
  // Handle video upload button click
  const handleShareVideo = () => {
    if (videoInputRef.current) {
      videoInputRef.current.click();
    }
  };
  
  // Handle media file selection
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>, type: "image" | "video") => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // Basic validation
    if (type === "image" && !file.type.startsWith("image/")) {
      toast({
        title: "Invalid File",
        description: "Please select a valid image file.",
        variant: "destructive",
      });
      return;
    }
    
    if (type === "video" && !file.type.startsWith("video/")) {
      toast({
        title: "Invalid File",
        description: "Please select a valid video file.",
        variant: "destructive",
      });
      return;
    }
    
    // Size check - limit to 10MB for images, 50MB for videos
    const maxSize = type === "image" ? 10 * 1024 * 1024 : 50 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({
        title: "File Too Large",
        description: `Please select a ${type} file less than ${maxSize / (1024 * 1024)}MB.`,
        variant: "destructive",
      });
      return;
    }
    
    setMediaType(type);
    setUploadingMedia(true);
    
    try {
      // Create a local preview URL for immediate display
      const fileUrl = URL.createObjectURL(file);
      setMediaPreview(fileUrl);
      
      // We're going to use a two-step approach:
      // 1. First try the direct file upload with FormData
      // 2. If that fails, fall back to base64 encoding
      
      // Read the file as base64 for fallback
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64Data = e.target?.result as string;
        
        // Try uploading with the direct file first
        console.log(`Uploading ${type} file to server using FormData...`);
        
        // Use the file object directly in the mutation
        uploadMediaMutation.mutate({
          file: file,
          type: type
        });
      };
      
      reader.onerror = () => {
        setUploadingMedia(false);
        toast({
          title: "File Read Error",
          description: "Failed to process the selected file. Please try again.",
          variant: "destructive",
        });
      };
      
      // Start the reading process to prepare for fallback if needed
      reader.readAsDataURL(file);
    } catch (error) {
      setUploadingMedia(false);
      toast({
        title: "File Processing Error",
        description: "Failed to process the selected file. Please try again.",
        variant: "destructive",
      });
    }
    
    // Reset the input value to allow selecting the same file again
    if (event.target) {
      event.target.value = '';
    }
  };
  
  // Handle form submission
  const handleSubmit = () => {
    if (!user) {
      toast({
        title: t("errors.error") || "Error",
        description: t("errors.unauthorized") || "You must be logged in to post",
        variant: "destructive",
      });
      return;
    }
    
    // Basic validation
    if (!content.trim() && !mediaPreview) {
      toast({
        title: t("errors.error") || "Error",
        description: "Please add some content or media to your post",
        variant: "destructive",
      });
      return;
    }
    
    // Check if media is still uploading
    if (uploadingMedia) {
      toast({
        title: "Media Still Uploading",
        description: "Please wait for your media to finish uploading before posting",
        variant: "destructive",
      });
      return;
    }
    
    // Determine content type based on media
    let contentType = "text";
    if (mediaType === "image") contentType = "image";
    if (mediaType === "video") contentType = "video";
    
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
    
    // Add tags if any
    if (tags.length > 0) {
      postData.tags = tags;
    }
    
    // Add media URL if available
    if (mediaType !== "none" && mediaData) {
      // Use the server-provided URLs from the uploaded media
      const serverMediaUrl = mediaData.fullUrl || mediaData.mediaUrl;
      console.log('Using server media URL for post:', serverMediaUrl);
      
      if (mediaType === "image") {
        postData.imageUrl = serverMediaUrl;
      } else if (mediaType === "video") {
        postData.videoUrl = serverMediaUrl;
      }
    } else if (mediaPreview && mediaType !== "none") {
      // Fallback to preview URL if mediaData is somehow missing
      console.warn('Using preview URL as fallback - media data missing');
      if (mediaType === "image") {
        postData.imageUrl = mediaPreview;
      } else if (mediaType === "video") {
        postData.videoUrl = mediaPreview;
      }
    }
    
    // Submit post
    createPostMutation.mutate(postData);
  };
  
  // Tag handling
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
  
  // Promotion handling
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
        
        {/* Text content area */}
        <div className="space-y-4">
          <Textarea
            placeholder="Write your post..."
            className="min-h-[120px] resize-none"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
          
          {/* Tags input */}
          <div className="flex items-center space-x-2">
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
          
          {/* Media preview */}
          {mediaPreview && (
            <div className="relative rounded-md overflow-hidden border max-h-[300px] mt-2">
              {mediaType === "image" && (
                <img 
                  src={mediaPreview} 
                  alt="Selected image" 
                  className="w-full h-auto max-h-[300px] object-contain"
                />
              )}
              {mediaType === "video" && (
                <video 
                  src={mediaPreview} 
                  controls 
                  className="w-full h-auto max-h-[300px]"
                />
              )}
              {uploadingMedia && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <div className="animate-spin w-8 h-8 border-4 border-white border-t-transparent rounded-full"></div>
                </div>
              )}
              {!uploadingMedia && (
                <Button
                  onClick={() => {
                    setMediaPreview(null);
                    setMediaType("none");
                    setMediaData(null);
                  }}
                  className="absolute top-2 right-2 h-8 w-8 p-0 rounded-full bg-black/70 hover:bg-black"
                >
                  <X className="h-4 w-4 text-white" />
                </Button>
              )}
            </div>
          )}
          
          {/* Media upload buttons */}
          <div className="flex space-x-2">
            <input 
              type="file" 
              ref={imageInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={(e) => handleFileChange(e, "image")}
            />
            <input 
              type="file" 
              ref={videoInputRef} 
              className="hidden" 
              accept="video/*" 
              onChange={(e) => handleFileChange(e, "video")}
            />
            <Button
              type="button"
              variant="outline"
              onClick={handleShareImage}
              className="flex items-center gap-1 border-blue-400 text-blue-600 hover:bg-blue-50"
              disabled={uploadingMedia}
            >
              <ImageIcon className="h-4 w-4" />
              <span>Share Picture</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleShareVideo}
              className="flex items-center gap-1 border-purple-400 text-purple-600 hover:bg-purple-50"
              disabled={uploadingMedia}
            >
              <VideoIcon className="h-4 w-4" />
              <span>Share Video</span>
            </Button>
          </div>
          
          {/* Action buttons */}
          <div className="flex justify-end items-center space-x-2">
            <Button
              type="button"
              onClick={() => setPromotionDialogOpen(true)}
              className={`flex items-center gap-1 ${isPromoted ? 'bg-green-600 hover:bg-green-700' : 'bg-green-500 hover:bg-green-600'}`}
            >
              <span className="text-white">
                {isPromoted ? 'Promoted ✓' : 'Promote'}
              </span>
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={createPostMutation.isPending || uploadingMedia}
              className="bg-primary hover:bg-primary/90"
            >
              {createPostMutation.isPending ? "Posting..." : (uploadingMedia ? "Uploading..." : "Post")}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}