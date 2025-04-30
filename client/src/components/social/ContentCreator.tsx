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
import { 
  Image, 
  Video, 
  FileText, 
  Tag, 
  Megaphone,
  X,
  Upload
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
  
  // Create post mutation
  const createPostMutation = useMutation({
    mutationFn: async (postData: InsertPost) => {
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
      
      // Refresh posts list
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      
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
    
    // No additional validations needed for removed content types
    
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
  
  return (
    <Card>
      <CardContent className="p-4">
        <Tabs defaultValue={contentType} onValueChange={(value) => setContentType(value as ContentType)}>
          <TabsList className="w-full mb-4 grid grid-cols-3">
            <TabsTrigger value="text" className="flex items-center gap-1">
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">{t("text")}</span>
            </TabsTrigger>
            <TabsTrigger value="image" className="flex items-center gap-1">
              <Image className="w-4 h-4" />
              <span className="hidden sm:inline">{t("image")}</span>
            </TabsTrigger>
            <TabsTrigger value="video" className="flex items-center gap-1">
              <Video className="w-4 h-4" />
              <span className="hidden sm:inline">{t("video")}</span>
            </TabsTrigger>
          </TabsList>
          
          {/* Text Content Tab */}
          <TabsContent value="text">
            <Textarea
              placeholder="What's on your mind? Share with Dedw..."
              className="mb-4"
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </TabsContent>
          
          {/* Image Content Tab */}
          <TabsContent value="image">
            <Input
              placeholder="Enter image URL or use upload button below"
              className="mb-4"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
            />
            {imageUrl && (
              <div className="mb-4 relative">
                <img 
                  src={imageUrl} 
                  alt="Post preview" 
                  className="w-full h-48 object-cover rounded-md"
                  onError={() => {
                    toast({
                      title: t("errors.error"),
                      description: t("invalid_image_url"),
                      variant: "destructive",
                    });
                    setImageUrl("");
                  }}
                />
              </div>
            )}
            <Textarea
              placeholder="Add a description for your image"
              className="mb-4"
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </TabsContent>
          
          {/* Video Content Tab */}
          <TabsContent value="video">
            <Input
              placeholder="Enter video URL (YouTube, Vimeo, etc.)"
              className="mb-4"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
            />
            <Textarea
              placeholder="Tell us about this video"
              className="mb-4"
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </TabsContent>
          
          {/* No more article or advertisement tabs */}
          
          {/* Common fields for all content types */}
          <div className="mt-4">
            <div className="flex items-center space-x-2 mb-4">
              <Tag className="w-4 h-4 text-gray-500" />
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
            
            <div className="flex items-center space-x-2 mb-4">
              <input
                type="checkbox"
                id="promote-post"
                checked={isPromoted}
                onChange={(e) => setIsPromoted(e.target.checked)}
                className="rounded text-primary focus:ring-primary/25"
              />
              <label htmlFor="promote-post" className="text-sm text-gray-700">
                Promote this post
              </label>
            </div>
          </div>
          
          <div className="flex justify-between items-center mt-4">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                className="rounded-full flex items-center gap-1 px-3 bg-blue-500 hover:bg-blue-600"
                title="Upload image"
                onClick={() => fileInputRef.current?.click()}
              >
                <Image className="h-5 w-5 text-white" />
                <span className="text-sm text-white font-medium">Upload</span>
              </Button>
              <input 
                type="file"
                ref={fileInputRef}
                accept="image/*,.txt,.md,.doc,.docx"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  
                  // Check if file is an image
                  if (file.type.startsWith('image/')) {
                    // Handle image file
                    const objectUrl = URL.createObjectURL(file);
                    setImageUrl(objectUrl);
                    
                    // Switch to image tab if not already there
                    if (contentType !== "image") {
                      setContentType("image");
                    }
                  } else {
                    // Handle text file
                    const reader = new FileReader();
                    reader.onload = (event) => {
                      const textContent = event.target?.result as string;
                      if (textContent) {
                        setContent(textContent);
                        
                        // Switch to text tab if not already there
                        if (contentType !== "text") {
                          setContentType("text");
                        }
                        
                        toast({
                          title: t("file_loaded") || "File loaded",
                          description: `${file.name} (${(file.size / 1024).toFixed(1)} KB)`,
                        });
                      }
                    };
                    
                    reader.onerror = () => {
                      toast({
                        title: t("errors.error") || "Error",
                        description: t("file_read_error") || "Failed to read file",
                        variant: "destructive",
                      });
                    };
                    
                    reader.readAsText(file);
                  }
                  
                  // Reset file input
                  e.target.value = "";
                }}
              />
            </div>
            <Button 
              onClick={handleSubmit}
              disabled={createPostMutation.isPending}
              className="bg-primary hover:bg-primary/90"
            >
              {createPostMutation.isPending ? "Posting..." : "Post to Dedw"}
            </Button>
          </div>
        </Tabs>
      </CardContent>
    </Card>
  );
}