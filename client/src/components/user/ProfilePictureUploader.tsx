import { useState, useRef } from 'react';
import { Camera, Upload, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { UserAvatar } from '@/components/ui/user-avatar';
import { apiRequest } from '@/lib/queryClient';

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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file type',
        description: 'Please select an image file',
        variant: 'destructive'
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please select an image smaller than 5MB',
        variant: 'destructive'
      });
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
      
      // Use the identifier (username or userId) to update the profile picture
      const identifier = username || userId;
      
      const response = await apiRequest('POST', `/api/users/${identifier}/profilePicture`, {
        imageData: previewImage
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to upload profile picture');
      }
      
      const data = await response.json();
      
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
          className="cursor-pointer border-2 border-primary/20 hover:border-primary/50 transition-colors"
          onClick={triggerFileInput}
        />
        
        <div 
          className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 
                   flex items-center justify-center rounded-full transition-opacity cursor-pointer"
          onClick={triggerFileInput}
        >
          <Camera className="w-8 h-8 text-white" />
        </div>
        
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
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPreviewImage(null)}
              disabled={isUploading}
            >
              Cancel
            </Button>
            
            <Button
              size="sm"
              onClick={uploadImage}
              disabled={isUploading}
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload
                </>
              )}
            </Button>
          </div>
        </div>
      )}
      
      {!previewImage && (
        <Button 
          variant="outline" 
          size="sm"
          onClick={triggerFileInput}
        >
          <Camera className="mr-2 h-4 w-4" />
          Change Picture
        </Button>
      )}
    </div>
  );
}

export default ProfilePictureUploader;