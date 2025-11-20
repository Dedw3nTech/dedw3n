import { useState, useRef, ChangeEvent } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ResolvedUserAvatar } from "@/components/ui/resolved-user-avatar";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { getInitials } from "@/lib/utils";
import { useLocation } from "wouter";
import {
  Image as ImageIcon,
  Loader2,
  X,
  Calendar,
  Send
} from "lucide-react";
import { EmojiPickerComponent } from "@/components/ui/emoji-picker";
import { useMasterBatchTranslation } from "@/hooks/use-master-translation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface CreatePostProps {
  communityId?: number;
  editingPost?: any;
  onSuccess?: () => void;
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
    "Title (optional)",
    "Add tag",
    "Save as Draft",
    "Schedule",
    "Publish Status",
    "Publish Now",
    "Draft",
    "Scheduled",
    "Schedule Date & Time"
  ];

  const { translations } = useMasterBatchTranslation(textsToTranslate);

  const whatsOnYourMindText = translations[0] || "What's on your mind";
  const cancelText = translations[1] || "Cancel";
  const postText = translations[2] || "Post";
  const updateText = translations[3] || "Update";
  const postingText = translations[4] || "Posting...";
  const updatingText = translations[5] || "Updating...";
  const addPhotoText = translations[6] || "Add Photo";
  const titlePlaceholderText = translations[7] || "Title (optional)";
  const addTagText = translations[8] || "Add tag";
  const saveAsDraftText = translations[9] || "Save as Draft";
  const scheduleText = translations[10] || "Schedule";
  const publishStatusText = translations[11] || "Publish Status";
  const publishedText = translations[12] || "Publish Now";
  const draftText = translations[13] || "Draft";
  const scheduledText = translations[14] || "Scheduled";
  const scheduleDateText = translations[15] || "Schedule Date & Time";

  const [, setLocation] = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [content, setContent] = useState(editingPost?.content || "");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>(editingPost?.imageUrl || "");
  const [isExpanded, setIsExpanded] = useState(!!editingPost);
  const [selectedCommunityId, setSelectedCommunityId] = useState<number | null>(
    editingPost?.communityId || communityId || null
  );
  
  // Modern CMS fields
  const [publishStatus, setPublishStatus] = useState<'draft' | 'scheduled' | 'published'>(
    editingPost?.publishStatus || 'published'
  );
  const [publishAt, setPublishAt] = useState<string>(
    editingPost?.publishAt ? new Date(editingPost.publishAt).toISOString().slice(0, 16) : ''
  );

  // Create/Edit post mutation
  const postMutation = useMutation({
    mutationFn: async (postData: any) => {
      const url = editingPost
        ? `/api/posts/${editingPost.id}`
        : "/api/posts";
      
      const method = editingPost ? "PUT" : "POST";
      
      // Get auth token directly from localStorage for direct authentication
      const authToken = localStorage.getItem('dedwen_auth_token');
      
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
    onSuccess: (newPost) => {
      // Capture the final publish status before resetting state
      const finalStatus = newPost.publishStatus ?? publishStatus;
      const wasEditingDraft = editingPost?.publishStatus === 'draft';
      const wasPublished = editingPost?.publishStatus === 'published';
      const isDraft = finalStatus === 'draft';
      
      // Reset form immediately for instant feel
      setContent("");
      setImageFile(null);
      setImagePreview("");
      setIsExpanded(false);
      setSelectedCommunityId(communityId || null);
      setPublishStatus('published');
      setPublishAt('');
      
      // Construct complete post object with user info for optimistic update
      const completePost = {
        ...newPost,
        user: {
          id: user!.id,
          name: user!.name || "",
          username: user!.username,
          avatar: user!.avatar || null
        },
        likes: newPost.likes || 0,
        comments: newPost.comments || 0,
        shares: newPost.shares || 0,
        views: newPost.views || 0,
        createdAt: newPost.createdAt || new Date().toISOString()
      };
      
      // Optimistically add to all feed caches for instant visibility (only for published posts)
      if (finalStatus === 'published') {
        const feedKeys = [
          ["/api/feed/personal"],
          ["/api/feed/communities"],
          ["/api/feed/recommended"],
          ["/api/feed/community", 'new'],  // Community page feed with sortBy
          ["/api/feed/community", 'trending'],
          ["/api/feed/community", 'popular'],
          ["/api/posts"],
          [`/api/users/${user?.username}/posts`]
        ];
        
        feedKeys.forEach(queryKey => {
          queryClient.setQueryData(queryKey, (oldData: any) => {
            // For infinite queries (community page uses useInfiniteQuery)
            if (oldData && oldData.pages) {
              return {
                ...oldData,
                pages: [
                  { posts: [completePost, ...(oldData.pages[0]?.posts || [])], hasMore: true },
                  ...oldData.pages.slice(1)
                ]
              };
            }
            // For regular queries (wall page uses useQuery)
            if (!oldData) return [completePost];
            if (Array.isArray(oldData)) {
              return [completePost, ...oldData];
            }
            return oldData;
          });
        });
      }
      
      // Determine if we need to refresh feeds
      const shouldRefreshFeeds = finalStatus === 'published' || (wasPublished && isDraft);
      
      // Invalidate queries based on publish status for instant UI refresh
      Promise.all([
        // Invalidate feeds when publishing OR when converting published→draft
        shouldRefreshFeeds ? queryClient.invalidateQueries({ queryKey: ["/api/feed/personal"] }) : Promise.resolve(),
        shouldRefreshFeeds ? queryClient.invalidateQueries({ queryKey: ["/api/feed/communities"] }) : Promise.resolve(),
        shouldRefreshFeeds ? queryClient.invalidateQueries({ queryKey: ["/api/feed/recommended"] }) : Promise.resolve(),
        shouldRefreshFeeds ? queryClient.invalidateQueries({ queryKey: ["/api/feed/community"] }) : Promise.resolve(),
        shouldRefreshFeeds ? queryClient.invalidateQueries({ queryKey: ["/api/posts"] }) : Promise.resolve(),
        shouldRefreshFeeds ? queryClient.invalidateQueries({ queryKey: [`/api/users/${user?.username}/posts`] }) : Promise.resolve(),
        
        // Always invalidate user stats
        queryClient.invalidateQueries({ queryKey: ['/api/user/stats'] }),
        queryClient.invalidateQueries({ queryKey: [`/api/users/${user?.id}/stats`] }),
        queryClient.invalidateQueries({ queryKey: ['/api/social/posts/count'] }),
        
        // Invalidate draft posts if saving a draft OR publishing a draft (to remove from drafts list)
        isDraft || wasEditingDraft
          ? queryClient.invalidateQueries({ queryKey: ['/api/draft-posts'] })
          : Promise.resolve(),
      ]).catch(err => console.error('Background refresh error:', err));
      
      // Call onSuccess callback if provided (for wall page refetch)
      if (onSuccess) {
        onSuccess();
      }

      // Show success toast with captured status
      toast({
        title: finalStatus === 'draft' ? "Draft saved" : finalStatus === 'scheduled' ? "Post scheduled" : "Post published",
        description: finalStatus === 'scheduled' && publishAt 
          ? `Will be published on ${new Date(publishAt).toLocaleString()}` 
          : undefined,
      });
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

  const handleSubmit = async (submitPublishStatus?: 'draft' | 'scheduled' | 'published') => {
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

    // Determine final publish status
    const finalPublishStatus = submitPublishStatus || publishStatus;

    // Validate scheduled posts have a date
    if (finalPublishStatus === 'scheduled' && !publishAt) {
      toast({
        title: "Schedule date required",
        description: "Please select a date and time for scheduled posts",
        variant: "destructive",
      });
      return;
    }
    
    // Create post data object with required fields including user ID
    const postData: any = {
      content,
      publishStatus: finalPublishStatus,
      contentType: 'standard',
      userId: user.id, // Explicitly include user ID for server authentication
    };

    // Add publish date if scheduled
    if (finalPublishStatus === 'scheduled' && publishAt) {
      postData.publishAt = new Date(publishAt).toISOString();
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
        description: "There was a problem processing your file",
        variant: "destructive",
      });
      return;
    }
    
    // Submit post instantly without blocking UI
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
            <ResolvedUserAvatar
              user={user}
              size="md"
              className="h-10 w-10"
            />
            <div className="bg-black px-4 py-2 rounded-full text-white flex-1">
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
                
                {/* Simple Text Area */}
                <textarea
                  placeholder={whatsOnYourMindText + "?"}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full min-h-[120px] p-3 border-0 bg-accent/50 rounded-md resize-none focus-visible:outline-none focus-visible:ring-0"
                  data-testid="textarea-post-content"
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
              </div>
            </div>
            
            {/* Image upload button */}
            <div className="w-full pt-3 border-t">
              <div className="flex gap-2 mt-3">
                <Button
                  size="sm"
                  className="bg-black text-white hover:bg-gray-800"
                  onClick={() => fileInputRef.current?.click()}
                  data-testid="button-add-photo"
                >
                  <ImageIcon className="h-3 w-3 mr-1 font-bold" />
                  <span className="font-semibold">{addPhotoText}</span>
                </Button>
              </div>
            </div>

            {/* Image upload input */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />

            <div className="flex items-center justify-end mt-3">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsExpanded(false);
                    setContent("");
                    setImageFile(null);
                    setImagePreview("");
                    setSelectedCommunityId(communityId || null);
                    setPublishStatus('published');
                    setPublishAt('');
                  }}
                >
                  {cancelText}
                </Button>

                {/* Save as Draft button */}
                {publishStatus !== 'draft' && (
                  <Button
                    variant="outline"
                    onClick={() => handleSubmit('draft')}
                    disabled={postMutation.isPending || !content.trim()}
                    data-testid="button-save-draft"
                  >
                    {saveAsDraftText}
                  </Button>
                )}
                
                <Button
                  onClick={() => handleSubmit()}
                  disabled={postMutation.isPending || !content.trim()}
                  className="bg-black text-white hover:bg-gray-800 disabled:bg-gray-400"
                  data-testid="button-submit-post"
                >
                  {postMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      {editingPost ? updatingText : postingText}
                    </>
                  ) : (
                    publishStatus === 'draft' ? saveAsDraftText : editingPost ? updateText : postText
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
