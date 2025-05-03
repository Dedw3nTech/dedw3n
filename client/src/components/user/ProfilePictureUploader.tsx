import { useState, useRef, useEffect } from 'react';
import { Camera, Upload, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { UserAvatar } from '@/components/ui/user-avatar';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
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

  // Reset upload complete status after a delay
  useEffect(() => {
    if (uploadComplete) {
      const timer = setTimeout(() => {
        setUploadComplete(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [uploadComplete]);

  // Simulate upload progress
  useEffect(() => {
    if (isUploading && uploadProgress < 90) {
      const timer = setTimeout(() => {
        setUploadProgress(prev => Math.min(prev + Math.random() * 15, 90));
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isUploading, uploadProgress]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset states
    setShowFileSizeWarning(false);
    setShowFileTypeWarning(false);
    setUploadProgress(0);

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setShowFileTypeWarning(true);
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setShowFileSizeWarning(true);
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const uploadImage = async () => {
    if (!previewImage) return;
    
    try {
      setIsUploading(true);
      setUploadProgress(10); // Start progress
      
      // Use the identifier (username or userId) to update the profile picture
      const identifier = username || userId;
      
      const response = await apiRequest('POST', `/api/users/${identifier}/profilePicture`, {
        imageData: previewImage
      });
      
      setUploadProgress(95); // Almost complete
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to upload profile picture');
      }
      
      const data = await response.json();
      
      setUploadProgress(100);
      setUploadComplete(true);
      
      toast({
        title: 'Profile picture updated',
        description: 'Your profile picture has been updated successfully',
      });
      
      // Reset preview
      setPreviewImage(null);
      
      // Callback with new avatar URL
      if (onUploadSuccess) {
        onUploadSuccess(data.avatarUrl);
      }
      
      // Invalidate queries to refresh avatar display across the app
      queryClient.invalidateQueries({ 
        queryKey: [`/api/users/${userId}/profilePicture`] 
      });
      
      if (username) {
        queryClient.invalidateQueries({ 
          queryKey: [`/api/users/${username}/profilePicture`] 
        });
      }
      
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      toast({
        title: 'Upload failed',
        description: error instanceof Error ? error.message : 'Failed to upload profile picture',
        variant: 'destructive'
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative group">
        <UserAvatar 
          userId={userId} 
          username={username} 
          size="xl"
          className={`cursor-pointer border-2 ${uploadComplete ? 'border-green-500' : 'border-primary/20 hover:border-primary/50'} transition-colors`}
          onClick={triggerFileInput}
        />
        
        {uploadComplete && (
          <div className="absolute bottom-0 right-0 bg-green-500 text-white rounded-full h-7 w-7 flex items-center justify-center border-2 border-white">
            <CheckCircle2 className="h-4 w-4" />
          </div>
        )}
        
        {!uploadComplete && (
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
        />
      </div>
      
      {previewImage && (
        <div className="flex flex-col items-center gap-3 w-full">
          <div className="rounded-full w-24 h-24 overflow-hidden border-2 border-primary">
            <img 
              src={previewImage} 
              alt="Preview" 
              className="w-full h-full object-cover"
            />
          </div>
          
          {isUploading && (
            <div className="w-full max-w-xs">
              <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-300 ease-out"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <p className="text-xs text-muted-foreground text-center mt-1">
                {uploadProgress < 100 ? 'Uploading...' : 'Processing...'}
              </p>
            </div>
          )}
          
          {!isUploading && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPreviewImage(null)}
              >
                Cancel
              </Button>
              
              <Button
                size="sm"
                onClick={uploadImage}
              >
                <Upload className="mr-2 h-4 w-4" />
                Upload
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
        >
          <Camera className="mr-2 h-4 w-4" />
          Change Picture
        </Button>
      )}
      
      {/* File size warning dialog */}
      <AlertDialog open={showFileSizeWarning} onOpenChange={setShowFileSizeWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center">
              <AlertCircle className="mr-2 h-5 w-5 text-destructive" />
              File Too Large
            </AlertDialogTitle>
            <AlertDialogDescription>
              The selected image exceeds the maximum allowed size of 5MB. 
              Please choose a smaller file or compress the current one.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowFileSizeWarning(false)}>
              OK
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* File type warning dialog */}
      <AlertDialog open={showFileTypeWarning} onOpenChange={setShowFileTypeWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center">
              <AlertCircle className="mr-2 h-5 w-5 text-destructive" />
              Invalid File Type
            </AlertDialogTitle>
            <AlertDialogDescription>
              Please select a valid image file (JPG, PNG, GIF, etc).
              The file you selected is not recognized as an image.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowFileTypeWarning(false)}>
              OK
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default ProfilePictureUploader;