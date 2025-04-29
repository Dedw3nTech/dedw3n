import { apiRequest } from "./queryClient";

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
 * Uploads an avatar image to the server
 * @param imageData The image data as a blob URL or base64 string
 * @returns The URL of the uploaded avatar
 */
export async function uploadAvatar(imageData: string): Promise<string> {
  try {
    // If it's a blob URL, convert it to base64 first
    const base64Data = imageData.startsWith('blob:') 
      ? await blobUrlToBase64(imageData)
      : imageData;
    
    // Upload the image to the server
    const response = await apiRequest('POST', '/api/users/avatar', { imageData: base64Data });
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to upload avatar');
    }
    
    return data.avatarUrl;
  } catch (error) {
    console.error('Error uploading avatar:', error);
    throw error;
  }
}