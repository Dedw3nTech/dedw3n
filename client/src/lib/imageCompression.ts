/**
 * Client-side image compression and optimization utility
 * Provides near-instant image processing for uploads
 */

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'webp' | 'png';
  maintainAspectRatio?: boolean;
}

export interface CompressionResult {
  blob: Blob;
  dataUrl: string;
  size: number;
  width: number;
  height: number;
  compressionRatio: number;
}

/**
 * Compress and optimize an image file for upload
 * Uses Canvas API for fast client-side processing
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<CompressionResult> {
  const {
    maxWidth = 1920,
    maxHeight = 1920,
    quality = 0.85,
    format = 'webp',
    maintainAspectRatio = true
  } = options;

  return new Promise((resolve, reject) => {
    const img = new Image();
    const originalSize = file.size;

    img.onload = () => {
      try {
        // Calculate new dimensions
        let { width, height } = calculateDimensions(
          img.width,
          img.height,
          maxWidth,
          maxHeight,
          maintainAspectRatio
        );

        // Create canvas for compression
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        // Enable image smoothing for better quality
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Draw and compress image
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to blob with specified format and quality
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to compress image'));
              return;
            }

            // Convert blob to data URL for preview
            const reader = new FileReader();
            reader.onloadend = () => {
              resolve({
                blob,
                dataUrl: reader.result as string,
                size: blob.size,
                width,
                height,
                compressionRatio: originalSize / blob.size
              });
            };
            reader.onerror = () => reject(new Error('Failed to read compressed image'));
            reader.readAsDataURL(blob);
          },
          `image/${format}`,
          quality
        );
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => reject(new Error('Failed to load image'));

    // Load the image
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Calculate optimal dimensions while maintaining aspect ratio
 */
function calculateDimensions(
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight: number,
  maintainAspectRatio: boolean
): { width: number; height: number } {
  if (!maintainAspectRatio) {
    return { width: maxWidth, height: maxHeight };
  }

  const aspectRatio = originalWidth / originalHeight;

  let width = originalWidth;
  let height = originalHeight;

  // Scale down if needed
  if (width > maxWidth) {
    width = maxWidth;
    height = width / aspectRatio;
  }

  if (height > maxHeight) {
    height = maxHeight;
    width = height * aspectRatio;
  }

  return {
    width: Math.round(width),
    height: Math.round(height)
  };
}

/**
 * Create a low-quality image placeholder (LQIP) for progressive loading
 */
export async function createLQIP(file: File): Promise<string> {
  const result = await compressImage(file, {
    maxWidth: 50,
    maxHeight: 50,
    quality: 0.3,
    format: 'jpeg'
  });
  
  return result.dataUrl;
}

/**
 * Check if image needs compression
 */
export function shouldCompress(file: File, maxSizeBytes: number = 1024 * 1024): boolean {
  return file.size > maxSizeBytes;
}

/**
 * Get optimal compression settings based on image type
 */
export function getOptimalSettings(file: File): CompressionOptions {
  const isPhoto = file.type === 'image/jpeg' || file.type === 'image/jpg';
  const isPNG = file.type === 'image/png';
  const isLarge = file.size > 2 * 1024 * 1024; // > 2MB

  return {
    maxWidth: isLarge ? 1920 : 2560,
    maxHeight: isLarge ? 1920 : 2560,
    quality: isPhoto ? 0.85 : 0.90,
    format: isPNG ? 'png' : 'webp',
    maintainAspectRatio: true
  };
}
