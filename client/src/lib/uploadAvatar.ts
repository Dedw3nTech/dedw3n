import { apiRequest } from "./queryClient";
import { compressImage, getOptimalSettings } from "./imageCompression";

/**
 * Converts a blob URL to a blob object
 * @param blobUrl The blob URL to convert
 * @returns Promise with the Blob
 */
export async function blobUrlToBlob(blobUrl: string): Promise<Blob> {
  const response = await fetch(blobUrl);
  return await response.blob();
}

/**
 * Converts a blob URL to a data URL (base64)
 * @param blobUrl The blob URL to convert
 * @returns Promise with the data URL
 */
export async function blobUrlToBase64(blobUrl: string): Promise<string> {
  // Skip conversion if it's already a data URL
  if (blobUrl.startsWith('data:')) return blobUrl;
  
  // Skip if it's not a blob URL
  if (!blobUrl.startsWith('blob:')) return blobUrl;
  
  try {
    // Fetch the blob
    const response = await fetch(blobUrl);
    const blob = await response.blob();
    
    // Convert blob to base64
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result as string);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error converting blob URL to base64:', error);
    throw error;
  }
}

/**
 * Uploads an avatar image to the server with optimized compression
 * @param imageData The image data as a blob URL or base64 string
 * @param useDirectUpload Whether to use direct-to-storage upload (faster)
 * @returns The URL of the uploaded avatar
 */
export async function uploadAvatar(imageData: string, useDirectUpload: boolean = true): Promise<string> {
  try {
    let blob: Blob;
    
    // Convert to blob if needed
    if (imageData.startsWith('blob:')) {
      blob = await blobUrlToBlob(imageData);
    } else if (imageData.startsWith('data:')) {
      // Convert base64 to blob
      const base64Data = imageData.split(',')[1];
      const mimeType = imageData.match(/data:([^;]+);/)?.[1] || 'image/jpeg';
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      blob = new Blob([byteArray], { type: mimeType });
    } else {
      throw new Error('Invalid image data format');
    }
    
    // Create file from blob for compression
    const file = new File([blob], 'avatar.png', { type: blob.type });
    
    // Compress for optimal performance (profile images should be smaller)
    const compressed = await compressImage(file, {
      maxWidth: 512,
      maxHeight: 512,
      quality: 0.85,
      format: 'webp',
      maintainAspectRatio: true
    });
    
    // Use secure upload proxy with server-side size enforcement
    if (useDirectUpload) {
      // Upload via secure proxy
      const uploadResponse = await fetch('/api/image/secure-upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'image/webp',
          'Content-Length': compressed.size.toString(),
          'X-File-Name': 'avatar.webp',
          'X-File-Type': 'image/webp',
          'X-Image-Type': 'profile'
        },
        body: compressed.blob
      });
      
      const data = await uploadResponse.json();
      
      if (!uploadResponse.ok || !data.success) {
        throw new Error(data.message || 'Failed to upload avatar');
      }
      
      return data.publicUrl;
    } else {
      // Fallback: Convert compressed to base64 and use server upload
      const base64Data = compressed.dataUrl;
      const response = await apiRequest('POST', '/api/users/avatar', { imageData: base64Data });
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to upload avatar');
      }
      
      return data.avatarUrl;
    }
  } catch (error) {
    console.error('Error uploading avatar:', error);
    throw error;
  }
}