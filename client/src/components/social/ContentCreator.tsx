import { useState } from "react";
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
  X
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";

type ContentType = "text" | "image" | "video" | "article" | "advertisement";

interface ContentCreatorProps {
  onSuccess?: () => void;
  defaultContentType?: ContentType;
}

export default function ContentCreator({ onSuccess, defaultContentType = "text" }: ContentCreatorProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
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
        title: t("social.post_created"),
        description: t("social.post_success_message"),
      });
      
      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error: any) => {
      toast({
        title: t("errors.error"),
        description: error.message || t("social.post_error"),
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
        description: t("social.content_required"),
        variant: "destructive",
      });
      return;
    }
    
    if (contentType === "image" && !imageUrl.trim()) {
      toast({
        title: t("errors.error"),
        description: t("social.image_required"),
        variant: "destructive",
      });
      return;
    }
    
    if (contentType === "video" && !videoUrl.trim()) {
      toast({
        title: t("errors.error"),
        description: t("social.video_required"),
        variant: "destructive",
      });
      return;
    }
    
    if (contentType === "article" && (!title.trim() || !content.trim())) {
      toast({
        title: t("errors.error"),
        description: t("social.title_and_content_required"),
        variant: "destructive",
      });
      return;
    }
    
    if (contentType === "advertisement" && (!title.trim() || !content.trim())) {
      toast({
        title: t("errors.error"),
        description: t("social.ad_title_content_required"),
        variant: "destructive",
      });
      return;
    }
    
    // Create post
    const postData: InsertPost = {
      userId: user.id,
      content,
      contentType,
      isPublished: true,
      isPromoted: contentType === "advertisement" ? true : isPromoted,
    };
    
    // Add title for content types that need it
    if (["article", "advertisement"].includes(contentType) || title.trim()) {
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
          <TabsList className="w-full mb-4 grid grid-cols-5">
            <TabsTrigger value="text" className="flex items-center gap-1">
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">{t("social.text")}</span>
            </TabsTrigger>
            <TabsTrigger value="image" className="flex items-center gap-1">
              <Image className="w-4 h-4" />
              <span className="hidden sm:inline">{t("social.image")}</span>
            </TabsTrigger>
            <TabsTrigger value="video" className="flex items-center gap-1">
              <Video className="w-4 h-4" />
              <span className="hidden sm:inline">{t("social.video")}</span>
            </TabsTrigger>
            <TabsTrigger value="article" className="flex items-center gap-1">
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">{t("social.article")}</span>
            </TabsTrigger>
            <TabsTrigger value="advertisement" className="flex items-center gap-1">
              <Megaphone className="w-4 h-4" />
              <span className="hidden sm:inline">{t("social.ad")}</span>
            </TabsTrigger>
          </TabsList>
          
          {/* Text Content Tab */}
          <TabsContent value="text">
            <Textarea
              placeholder={t("social.whats_on_your_mind")}
              className="mb-4"
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </TabsContent>
          
          {/* Image Content Tab */}
          <TabsContent value="image">
            <Input
              placeholder={t("social.image_url")}
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
                      description: t("social.invalid_image_url"),
                      variant: "destructive",
                    });
                    setImageUrl("");
                  }}
                />
              </div>
            )}
            <Textarea
              placeholder={t("social.image_description")}
              className="mb-4"
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </TabsContent>
          
          {/* Video Content Tab */}
          <TabsContent value="video">
            <Input
              placeholder={t("social.video_url")}
              className="mb-4"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
            />
            <Textarea
              placeholder={t("social.video_description")}
              className="mb-4"
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </TabsContent>
          
          {/* Article Content Tab */}
          <TabsContent value="article">
            <Input
              placeholder={t("social.article_title")}
              className="mb-4"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <Textarea
              placeholder={t("social.article_content")}
              className="mb-4 min-h-[200px]"
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </TabsContent>
          
          {/* Advertisement Content Tab */}
          <TabsContent value="advertisement">
            <Input
              placeholder={t("social.ad_title")}
              className="mb-4"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <Textarea
              placeholder={t("social.ad_description")}
              className="mb-4"
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
            <Input
              placeholder={t("social.image_url")}
              className="mb-4"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
            />
            {imageUrl && (
              <div className="mb-4 relative">
                <img 
                  src={imageUrl} 
                  alt="Ad preview" 
                  className="w-full h-48 object-cover rounded-md"
                  onError={() => {
                    toast({
                      title: t("errors.error"),
                      description: t("social.invalid_image_url"),
                      variant: "destructive",
                    });
                    setImageUrl("");
                  }}
                />
              </div>
            )}
          </TabsContent>
          
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
                  placeholder={t("social.add_tags")}
                  className="flex-1 border-none shadow-none focus-visible:ring-0 min-w-[100px] h-7 p-0"
                />
              </div>
            </div>
            
            {contentType !== "advertisement" && (
              <div className="flex items-center space-x-2 mb-4">
                <input
                  type="checkbox"
                  id="promote-post"
                  checked={isPromoted}
                  onChange={(e) => setIsPromoted(e.target.checked)}
                  className="rounded text-primary focus:ring-primary/25"
                />
                <label htmlFor="promote-post" className="text-sm text-gray-700">
                  {t("social.promote_post")}
                </label>
              </div>
            )}
          </div>
          
          <div className="flex justify-end mt-4">
            <Button 
              onClick={handleSubmit}
              disabled={createPostMutation.isPending}
              className="bg-primary hover:bg-primary/90"
            >
              {createPostMutation.isPending ? t("social.posting") : t("social.post")}
            </Button>
          </div>
        </Tabs>
      </CardContent>
    </Card>
  );
}