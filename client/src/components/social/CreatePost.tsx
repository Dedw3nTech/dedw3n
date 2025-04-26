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
  Megaphone
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

interface CreatePostProps {
  communityId?: number;
  editingPost?: any;
  onSuccess?: () => void;
}

type ContentType = 'standard' | 'article' | 'visual' | 'video' | 'advertisement';

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

  // Create/Edit post mutation
  const postMutation = useMutation({
    mutationFn: async (postData: any) => {
      const url = editingPost
        ? `/api/posts/${editingPost.id}`
        : "/api/posts";
      
      const method = editingPost ? "PUT" : "POST";
      const response = await apiRequest(method, url, postData);
      
      if (!response.ok) {
        const errorData = await response.json();
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
      
      // Show success message
      toast({
        title: "Success",
        description: editingPost ? "Post updated successfully" : "Post created successfully",
      });
      
      // Invalidate queries to refresh post lists
      queryClient.invalidateQueries({ queryKey: ["/api/feed/personal"] });
      queryClient.invalidateQueries({ queryKey: ["/api/feed/communities"] });
      queryClient.invalidateQueries({ queryKey: ["/api/feed/recommended"] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user?.username}/posts`] });
      
      if (communityId) {
        queryClient.invalidateQueries({ queryKey: [`/api/communities/${communityId}/posts`] });
      }
      
      if (selectedCommunityId) {
        queryClient.invalidateQueries({ queryKey: [`/api/communities/${selectedCommunityId}/posts`] });
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
                <div className="flex items-center">
                  <p className="font-medium">{user.name}</p>
                  
                  {/* Post visibility selector */}
                  <div className="ml-2">
                    <Select
                      value={postToVisibility}
                      onValueChange={setPostToVisibility}
                    >
                      <SelectTrigger className="h-7 w-[130px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Post to</SelectLabel>
                          <SelectItem value="public">Public</SelectItem>
                          <SelectItem value="community">Community</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Community selector */}
                  {postToVisibility === "community" && (
                    <div className="ml-2">
                      {isLoadingCommunities ? (
                        <Button variant="outline" size="sm" disabled>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Loading...
                        </Button>
                      ) : !userCommunities || userCommunities.length === 0 ? (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setLocation("/communities")}
                        >
                          Join a community
                        </Button>
                      ) : (
                        <Select
                          value={selectedCommunityId?.toString() || ""}
                          onValueChange={(value) => setSelectedCommunityId(Number(value))}
                          disabled={!!communityId}
                        >
                          <SelectTrigger className="h-7 w-[180px]">
                            <SelectValue placeholder="Select a community" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              <SelectLabel>Your communities</SelectLabel>
                              {userCommunities.map((community: any) => (
                                <SelectItem 
                                  key={community.id} 
                                  value={community.id.toString()}
                                >
                                  {community.name}
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Title input (optional) */}
                <Input
                  placeholder="Post title (optional)"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="border-0 bg-accent/50 focus-visible:ring-0"
                />
                
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
                
                {/* Tag input */}
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a tag"
                    value={currentTag}
                    onChange={(e) => setCurrentTag(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addTag();
                      }
                    }}
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addTag}
                    disabled={!currentTag.trim() || tags.length >= 5}
                  >
                    Add
                  </Button>
                </div>
              </div>
            </div>
            
            {/* Content Type Selector Tabs */}
            <Tabs
              value={contentType}
              onValueChange={(value) => setContentType(value as ContentType)}
              className="w-full pt-3 border-t"
            >
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="standard" className="flex items-center gap-1">
                  <MessageSquarePlus className="h-4 w-4" />
                  <span className="hidden sm:inline">Standard</span>
                </TabsTrigger>
                <TabsTrigger value="article" className="flex items-center gap-1">
                  <FileText className="h-4 w-4" />
                  <span className="hidden sm:inline">Article</span>
                </TabsTrigger>
                <TabsTrigger value="visual" className="flex items-center gap-1">
                  <ImageIcon className="h-4 w-4" />
                  <span className="hidden sm:inline">Visual</span>
                </TabsTrigger>
                <TabsTrigger value="video" className="flex items-center gap-1">
                  <Video className="h-4 w-4" />
                  <span className="hidden sm:inline">Video</span>
                </TabsTrigger>
                <TabsTrigger value="advertisement" className="flex items-center gap-1">
                  <Megaphone className="h-4 w-4" />
                  <span className="hidden sm:inline">Ad</span>
                </TabsTrigger>
              </TabsList>

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
                </div>
              </TabsContent>

              {/* Article Content */}
              <TabsContent value="article" className="space-y-2">
                <p className="text-sm text-muted-foreground mt-3">
                  Write a detailed article with a compelling title. Great for sharing expertise and insights.
                </p>
              </TabsContent>

              {/* Visual Content */}
              <TabsContent value="visual" className="space-y-2">
                <div className="flex gap-2 mt-3">
                  <Button
                    variant={imageFile ? "secondary" : "default"}
                    size="sm"
                    className="w-full"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <ImageIcon className="h-4 w-4 mr-1" />
                    {imageFile ? "Change Image" : "Upload Image"}
                  </Button>
                </div>
              </TabsContent>

              {/* Video Content */}
              <TabsContent value="video" className="space-y-2">
                <div className="flex gap-2 mt-3">
                  <Button
                    variant={videoFile ? "secondary" : "default"}
                    size="sm"
                    className="w-full"
                    onClick={() => videoInputRef.current?.click()}
                  >
                    <Video className="h-4 w-4 mr-1" />
                    {videoFile ? "Change Video" : "Upload Video"}
                  </Button>
                </div>
              </TabsContent>

              {/* Advertisement Content */}
              <TabsContent value="advertisement" className="space-y-2">
                <div className="mt-3 space-y-3">
                  <div className="flex gap-2">
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
                  </div>
                  <Input
                    placeholder="External link URL (optional)"
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    className="border bg-accent/30"
                  />
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="promote-post"
                      checked={isPromoted}
                      onChange={(e) => setIsPromoted(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <label htmlFor="promote-post" className="text-sm">
                      Promote this advertisement
                    </label>
                  </div>
                </div>
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

            <div className="flex items-center justify-between mt-3">
              <div className="flex gap-2">
                {/* Tags button */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground"
                  onClick={() => {
                    if (!currentTag.trim() && tags.length < 5) {
                      const tag = prompt("Add a tag (without #):");
                      if (tag && !tags.includes(tag.trim())) {
                        setTags([...tags, tag.trim()]);
                      }
                    }
                  }}
                >
                  <Tag className="h-4 w-4 mr-1" />
                  Tags ({tags.length}/5)
                </Button>
              </div>
              
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