import { useState, useRef, useEffect } from 'react';
import { Camera, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { UserAvatar } from '@/components/ui/user-avatar';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useMasterBatchTranslation } from '@/hooks/use-master-translation';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle 
} from "@/components/ui/alert-dialog";

interface ProfilePictureUploaderProps {
  userId: number;
  username?: string;
  currentAvatar?: string;
  onUploadSuccess?: (newAvatarUrl: string) => void;
}

export function ProfilePictureUploader({
  userId,
  username,
  currentAvatar,
  onUploadSuccess
}: ProfilePictureUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [showFileSizeWarning, setShowFileSizeWarning] = useState(false);
  const [showFileTypeWarning, setShowFileTypeWarning] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadComplete, setUploadComplete] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const translationTexts = [
    'Change Picture',
    'Preview',
    'Uploading...',
    'Processing...',
    'Cancel',
    'Upload',
    'File Too Large',
    'The selected image exceeds the maximum allowed size of 5MB. Please choose a smaller file or compress the current one.',
    'OK',
    'Invalid File Type',
    'Please select a valid image file (JPG, PNG, GIF, etc). The file you selected is not recognized as an image.',
    'Upload failed',
    'Profile picture updated successfully!',
    'Failed to upload profile picture',
    'Authentication required',
    'Too many upload requests',
    'Server error occurred'
  ];

  const { translations } = useMasterBatchTranslation(translationTexts, 'instant');
  
  const t: Record<string, string> = {};
  translationTexts.forEach((text, index) => {
    t[text] = translations[index] || text;
  });

  useEffect(() => {
    if (uploadComplete) {
      const timer = setTimeout(() => setUploadComplete(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [uploadComplete]);

  useEffect(() => {
    if (isUploading && uploadProgress < 90) {
      const timer = setTimeout(() => {
        setUploadProgress(prev => Math.min(prev + Math.random() * 15, 90));
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [isUploading, uploadProgress]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setShowFileSizeWarning(false);
    setShowFileTypeWarning(false);
    setUploadProgress(0);

    if (!file.type.startsWith('image/')) {
      setShowFileTypeWarning(true);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setShowFileSizeWarning(true);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (dataUrl) {
        setPreviewImage(dataUrl);
      }
    };
    
    reader.onerror = () => {
      toast({
        title: t['Upload failed'] || 'Upload failed',
        description: 'Failed to read the image file',
        variant: 'destructive'
      });
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    
    reader.readAsDataURL(file);
  };

  const uploadImage = async () => {
    if (!previewImage) return;
    
    try {
      setIsUploading(true);
      setUploadProgress(10);
      
      // Always prefer numeric userId, encode username if that's all we have
      const identifier = userId ? userId.toString() : encodeURIComponent(username || '');
      
      const response = await apiRequest('POST', `/api/users/${identifier}/profilePicture`, {
        imageData: previewImage
      });
      
      setUploadProgress(95);
      const data = await response.json();
      
      setUploadProgress(100);
      setUploadComplete(true);
      setPreviewImage(null);
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      toast({
        title: t['Profile picture updated successfully!'] || 'Profile picture updated successfully!',
        variant: 'default'
      });
      
      if (onUploadSuccess && data.avatarUrl) {
        onUploadSuccess(data.avatarUrl);
      }
      
      // Comprehensive cache invalidation using predicate to catch ALL avatar-related queries
      queryClient.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey;
          if (!Array.isArray(key) || key.length === 0) return false;
          
          try {
            // Check all segments of the query key for avatar-related endpoints
            // Handle non-serializable keys by walking the array
            let keyString = '';
            for (const segment of key) {
              if (typeof segment === 'string') {
                keyString += segment.toLowerCase() + ' ';
              } else if (typeof segment === 'number') {
                keyString += segment + ' ';
              } else {
                // Try to stringify, but catch errors for non-serializable objects
                try {
                  keyString += JSON.stringify(segment).toLowerCase() + ' ';
                } catch {
                  // Skip non-serializable segments
                  continue;
                }
              }
            }
            
            // Invalidate all queries that might contain user avatar data
            return (
              // Current user queries
              keyString.includes('/api/user') ||
              
              // User-specific queries
              keyString.includes('/api/users') ||
              
              // Feed and social queries
              keyString.includes('/api/feed') ||
              keyString.includes('/api/posts') ||
              keyString.includes('/api/social') ||
              
              // Social graph
              keyString.includes('/api/friends') ||
              keyString.includes('/api/followers') ||
              keyString.includes('/api/following') ||
              keyString.includes('/api/connections') ||
              
              // Messaging and chat
              keyString.includes('/api/messages') ||
              keyString.includes('/api/chatrooms') ||
              keyString.includes('/api/conversations') ||
              
              // Search and lists
              keyString.includes('/api/search') ||
              keyString.includes('platform-users') ||
              
              // Admin and proxy accounts
              keyString.includes('/api/admin') ||
              keyString.includes('/api/proxy') ||
              
              // Dating
              keyString.includes('/api/dating') ||
              keyString.includes('/api/matches') ||
              
              // Comments (which show user avatars)
              keyString.includes('/api/comments') ||
              
              // Any query that explicitly references profiles or avatars
              keyString.includes('profile') ||
              keyString.includes('avatar')
            );
          } catch (error) {
            // If anything fails, don't invalidate this query
            console.error('[ProfilePictureUploader] Error in invalidation predicate:', error);
            return false;
          }
        }
      });
      
      // Dispatch custom event to trigger UserAvatar cache version update
      window.dispatchEvent(new Event('avatar-updated'));
      
      // Optionally update query data directly for immediate visual feedback
      if (data.avatarUrl) {
        queryClient.setQueryData(['/api/user'], (oldData: any) => {
          if (!oldData) return oldData;
          return { ...oldData, avatar: data.avatarUrl, avatarUpdatedAt: new Date().toISOString() };
        });
        
        queryClient.setQueryData([`/api/users/${identifier}/profilePicture`], {
          url: data.avatarUrl,
          userId,
          username,
          avatarUpdatedAt: new Date().toISOString()
        });
      }
      
    } catch (error) {
      console.error('[ProfilePictureUploader] Upload error:', error);
      
      let errorTitle = t['Upload failed'] || 'Upload failed';
      let errorDescription = t['Failed to upload profile picture'] || 'Failed to upload profile picture';
      
      if (error instanceof Error) {
        const message = error.message.toLowerCase();
        
        if (message.includes('authentication') || message.includes('unauthorized') || message.includes('401')) {
          errorTitle = t['Authentication required'] || 'Authentication required';
          errorDescription = 'Please log in again and try uploading';
        } else if (message.includes('too many') || message.includes('rate limit') || message.includes('429')) {
          errorTitle = t['Too many upload requests'] || 'Too many upload requests';
          errorDescription = error.message;
        } else if (message.includes('server') || message.includes('500')) {
          errorTitle = t['Server error occurred'] || 'Server error occurred';
          errorDescription = 'Please try again in a moment';
        } else {
          errorDescription = error.message;
        }
      }
      
      toast({
        title: errorTitle,
        description: errorDescription,
        variant: 'destructive'
      });
      
      setPreviewImage(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const cancelUpload = () => {
    setPreviewImage(null);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative group">
        {previewImage ? (
          <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-primary/20 hover:border-primary/50 transition-colors cursor-pointer">
            <img 
              src={previewImage} 
              alt={t['Preview'] || 'Preview'} 
              className="w-full h-full object-cover"
              onClick={!isUploading ? triggerFileInput : undefined}
              loading="eager"
            />
          </div>
        ) : (
          <UserAvatar 
            userId={userId} 
            username={username} 
            size="xl"
            className={`cursor-pointer border-2 ${uploadComplete ? 'border-green-500' : 'border-primary/20 hover:border-primary/50'} transition-colors`}
            onClick={!isUploading ? triggerFileInput : undefined}
          />
        )}
        
        {uploadComplete && (
          <div className="absolute bottom-0 right-0 bg-green-500 text-white rounded-full h-7 w-7 flex items-center justify-center border-2 border-white">
            <CheckCircle2 className="h-4 w-4" />
          </div>
        )}
        
        {!uploadComplete && !isUploading && (
          <div 
            className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 
                     flex items-center justify-center rounded-full transition-opacity cursor-pointer"
            onClick={triggerFileInput}
          >
            <Camera className="w-8 h-8 text-white" />
          </div>
        )}
        
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*"
          onChange={handleFileSelect}
          disabled={isUploading}
        />
      </div>
      
      {previewImage && (
        <div className="flex flex-col items-center gap-3 w-full">
          {isUploading && (
            <div className="w-full max-w-xs">
              <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-black transition-all duration-300 ease-out"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <p className="text-xs text-muted-foreground text-center mt-1">
                {uploadProgress < 100 ? (t['Uploading...'] || 'Uploading...') : (t['Processing...'] || 'Processing...')}
              </p>
            </div>
          )}
          
          {!isUploading && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={cancelUpload}
                data-testid="button-cancel-upload"
              >
                {t['Cancel'] || 'Cancel'}
              </Button>
              
              <Button
                size="sm"
                onClick={uploadImage}
                className="bg-black hover:bg-gray-800 text-white"
                data-testid="button-upload-picture"
              >
                {t['Upload'] || 'Upload'}
              </Button>
            </div>
          )}
        </div>
      )}
      
      {!previewImage && !isUploading && (
        <Button 
          variant="outline" 
          size="sm"
          onClick={triggerFileInput}
          data-testid="button-change-picture"
        >
          <Camera className="mr-2 h-4 w-4" />
          {t['Change Picture'] || 'Change Picture'}
        </Button>
      )}
      
      <AlertDialog open={showFileSizeWarning} onOpenChange={setShowFileSizeWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              {t['File Too Large'] || 'File Too Large'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t['The selected image exceeds the maximum allowed size of 5MB. Please choose a smaller file or compress the current one.'] || 'The selected image exceeds the maximum allowed size of 5MB. Please choose a smaller file or compress the current one.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowFileSizeWarning(false)}>
              {t['OK'] || 'OK'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <AlertDialog open={showFileTypeWarning} onOpenChange={setShowFileTypeWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              {t['Invalid File Type'] || 'Invalid File Type'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t['Please select a valid image file (JPG, PNG, GIF, etc). The file you selected is not recognized as an image.'] || 'Please select a valid image file (JPG, PNG, GIF, etc). The file you selected is not recognized as an image.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowFileTypeWarning(false)}>
              {t['OK'] || 'OK'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
