import { useState, useRef, ChangeEvent, DragEvent } from "react";
import { Upload, X, FileText, Image, Video, File, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface UploadedFile {
  name: string;
  url: string;
  type: string;
  size: number;
}

interface FileUploadProps {
  value?: UploadedFile[];
  onChange?: (files: UploadedFile[]) => void;
  maxFiles?: number;
  accept?: string;
  disabled?: boolean;
}

export function FileUpload({ 
  value = [], 
  onChange, 
  maxFiles = 10,
  accept = "image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.txt",
  disabled = false 
}: FileUploadProps) {
  const { toast } = useToast();
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (disabled) return;
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      await uploadFiles(files);
    }
  };

  const handleChange = async (e: ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (disabled) return;
    
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      await uploadFiles(files);
    }
  };

  const uploadFiles = async (files: File[]) => {
    const remainingSlots = maxFiles - value.length;
    const filesToUpload = files.slice(0, remainingSlots);
    
    if (filesToUpload.length === 0) return;
    
    setUploading(true);
    try {
      const uploadedFiles: UploadedFile[] = [];
      
      for (const file of filesToUpload) {
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await fetch('/api/upload/file', {
          method: 'POST',
          body: formData,
          credentials: 'include',
        });
        
        if (!response.ok) {
          throw new Error(`Failed to upload ${file.name}`);
        }
        
        const data = await response.json();
        uploadedFiles.push({
          name: file.name,
          url: data.url,
          type: file.type,
          size: file.size,
        });
      }
      
      onChange?.([...value, ...uploadedFiles]);
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload some files. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    }
  };

  const removeFile = (index: number) => {
    const newFiles = value.filter((_, i) => i !== index);
    onChange?.(newFiles);
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <Image className="h-4 w-4" />;
    if (type.startsWith('video/')) return <Video className="h-4 w-4" />;
    if (type.includes('pdf') || type.includes('document')) return <FileText className="h-4 w-4" />;
    return <File className="h-4 w-4" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="w-full space-y-3">
      <div
        className={cn(
          "relative border-2 border-dashed rounded-lg p-6 transition-colors",
          dragActive ? "border-primary bg-primary/5" : "border-gray-300",
          disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:border-primary",
          uploading && "pointer-events-none opacity-60"
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !disabled && inputRef.current?.click()}
        data-testid="file-upload-dropzone"
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={accept}
          onChange={handleChange}
          disabled={disabled}
          className="hidden"
          data-testid="file-upload-input"
        />
        
        <div className="flex flex-col items-center justify-center gap-2 text-center">
          <Upload className={cn(
            "h-8 w-8",
            uploading ? "animate-pulse" : ""
          )} />
          <div className="text-sm">
            <span className="font-medium">
              {uploading ? "Uploading..." : "Click to upload"}
            </span>
            {!uploading && (
              <span className="text-gray-500"> or drag and drop</span>
            )}
          </div>
          <p className="text-xs text-gray-500">
            Documents, images, videos ({maxFiles - value.length} remaining)
          </p>
        </div>
      </div>

      {value.length > 0 && (
        <div className="space-y-2">
          {value.map((file, index) => (
            <div
              key={index}
              className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg group"
              data-testid={`uploaded-file-${index}`}
            >
              <div className="flex-shrink-0">
                {getFileIcon(file.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" title={file.name}>
                  {file.name}
                </p>
                <p className="text-xs text-gray-500">
                  {formatFileSize(file.size)}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(file.url, '_blank');
                  }}
                  data-testid={`button-download-file-${index}`}
                >
                  <Download className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(index);
                  }}
                  disabled={disabled}
                  data-testid={`button-remove-file-${index}`}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
