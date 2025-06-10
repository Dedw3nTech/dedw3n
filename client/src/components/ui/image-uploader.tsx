import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Upload, ImagePlus, Check, AlertCircle } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface ImageUploaderProps {
  onImageUploaded?: (imageUrl: string) => void;
  defaultType?: 'product' | 'profile' | 'post';
  maxSizeKB?: number;
  aspectRatio?: 'square' | '4:3' | '16:9';
  className?: string;
}

export function ImageUploader({
  onImageUploaded,
  defaultType = 'product',
  maxSizeKB = 5120, // 5MB default
  aspectRatio = 'square',
  className = ''
}: ImageUploaderProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [imageType, setImageType] = useState<'product' | 'profile' | 'post'>(defaultType);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  
  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setSuccess(false);
    setUploadProgress(0);
    
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file size
    if (file.size > maxSizeKB * 1024) {
      setError(`File size exceeds maximum limit (${maxSizeKB / 1024}MB)`);
      return;
    }
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Selected file is not an image');
      return;
    }
    
    setSelectedFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };
  
  // Handle direct upload for small files (< 1MB)
  const handleDirectUpload = async () => {
    if (!selectedFile || !preview) return;
    
    setLoading(true);
    setError(null);
    setSuccess(false);
    
    try {
      const response = await apiRequest('POST', '/api/image/upload', {
        imageData: preview,
        imageType: imageType
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccess(true);
        toast({
          title: "Upload Successful",
          description: "Image has been uploaded successfully.",
          variant: "default",
        });
        
        // Call callback if provided
        if (onImageUploaded) {
          onImageUploaded(data.imageUrl);
        }
      } else {
        setError(data.message || 'Upload failed');
        toast({
          title: "Upload Failed",
          description: data.message || 'An error occurred during upload',
          variant: "destructive",
        });
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMsg);
      toast({
        title: "Upload Failed",
        description: errorMsg,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Handle chunked upload for larger files
  const handleChunkedUpload = async () => {
    if (!selectedFile || !preview) return;
    
    setLoading(true);
    setError(null);
    setSuccess(false);
    
    try {
      const CHUNK_SIZE = 50 * 1024; // 50KB chunks
      const fileId = Date.now().toString();
      const totalChunks = Math.ceil(preview.length / CHUNK_SIZE);
      
      for (let i = 0; i < totalChunks; i++) {
        const start = i * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, preview.length);
        const chunk = preview.substring(start, end);
        
        const response = await apiRequest('POST', '/api/image/chunked-upload', {
          chunkIndex: i,
          totalChunks: totalChunks,
          fileId: fileId,
          chunk: chunk,
          imageType: imageType
        });
        
        const data = await response.json();
        
        if (!data.success) {
          throw new Error(data.message || 'Chunk upload failed');
        }
        
        // Update progress
        const progress = Math.round(((i + 1) / totalChunks) * 100);
        setUploadProgress(progress);
        
        // If this is the last chunk, we're done
        if (i === totalChunks - 1) {
          setSuccess(true);
          toast({
            title: "Upload Successful",
            description: "Image has been uploaded successfully.",
            variant: "default",
          });
          
          // Call callback if provided
          if (onImageUploaded) {
            onImageUploaded(data.imageUrl);
          }
        }
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMsg);
      toast({
        title: "Upload Failed",
        description: errorMsg,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Handle upload - choose method based on file size
  const handleUpload = () => {
    if (!selectedFile) {
      setError('Please select an image first');
      return;
    }
    
    // Use direct upload for small files, chunked for larger ones
    if (selectedFile.size < 1024 * 1024) { // Less than 1MB
      handleDirectUpload();
    } else {
      handleChunkedUpload();
    }
  };
  
  // Trigger file input click
  const handleSelectClick = () => {
    fileInputRef.current?.click();
  };
  
  return (
    <Card className={`w-full ${className}`}>
      <CardHeader>
        <CardTitle>Upload Image</CardTitle>
        <CardDescription>
          Select an image to upload
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex flex-col space-y-1.5">
            <Label htmlFor="image-type">Image Type</Label>
            <Select 
              value={imageType} 
              onValueChange={(value) => setImageType(value as 'product' | 'profile' | 'post')}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select image type" />
              </SelectTrigger>
              <SelectContent position="popper">
                <SelectItem value="product">Product Image</SelectItem>
                <SelectItem value="profile">Profile Image</SelectItem>
                <SelectItem value="post">Post Image</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
            disabled={loading}
          />
          
          {!preview ? (
            <div 
              className={`border-2 border-dashed rounded-md border-gray-300 p-12 text-center cursor-pointer hover:border-primary transition-colors ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={handleSelectClick}
            >
              <div className="flex flex-col items-center justify-center space-y-2">
                <ImagePlus className="h-12 w-12 text-gray-400" />
                <div className="text-sm text-gray-500">
                  Click to select an image,<br />or drag and drop
                </div>
                <div className="text-xs text-gray-400">
                  Maximum size: {maxSizeKB / 1024}MB
                </div>
              </div>
            </div>
          ) : (
            <div className="relative">
              <div className="relative rounded-md overflow-hidden border border-gray-200">
                <img 
                  src={preview} 
                  alt="Preview" 
                  className={`w-full object-cover ${aspectRatio === 'square' ? 'aspect-square' : aspectRatio === '4:3' ? 'aspect-[4/3]' : 'aspect-[16/9]'}`}
                />
                {success && (
                  <div className="absolute inset-0 bg-green-500 bg-opacity-20 flex items-center justify-center">
                    <div className="bg-white p-2 rounded-full">
                      <Check className="h-8 w-8 text-green-500" />
                    </div>
                  </div>
                )}
              </div>
              
              <Button 
                variant="outline" 
                size="sm" 
                className="absolute top-2 right-2 bg-white bg-opacity-75 hover:bg-opacity-100"
                onClick={handleSelectClick}
                disabled={loading}
              >
                Change
              </Button>
            </div>
          )}
          
          {error && (
            <div className="flex items-center space-x-2 text-red-500 text-sm">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}
          
          {loading && uploadProgress > 0 && (
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-primary h-2.5 rounded-full transition-all duration-300" 
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          className="w-full"
          onClick={handleUpload}
          disabled={!selectedFile || loading || success}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : success ? (
            <>
              <Check className="mr-2 h-4 w-4" />
              Uploaded
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Upload Image
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}