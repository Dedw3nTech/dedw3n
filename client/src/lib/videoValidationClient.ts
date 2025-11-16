import type { VideoMetadata, VideoValidationResult, VideoValidationError } from "@shared/videoValidation";
import {
  VideoErrorCode,
  VIDEO_CONSTRAINTS,
  validateVideoMetadata,
  createVideoError,
  getUserFriendlyErrorMessage
} from "@shared/videoValidation";

export async function extractVideoMetadata(file: File): Promise<VideoMetadata> {
  return new Promise((resolve, reject) => {
    const metadata: VideoMetadata = {
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type
    };

    const video = document.createElement('video');
    video.preload = 'metadata';

    video.onloadedmetadata = () => {
      metadata.duration = Math.floor(video.duration);
      metadata.width = video.videoWidth;
      metadata.height = video.videoHeight;
      
      URL.revokeObjectURL(video.src);
      resolve(metadata);
    };

    video.onerror = () => {
      URL.revokeObjectURL(video.src);
      reject(new Error('Failed to load video metadata'));
    };

    video.src = URL.createObjectURL(file);
  });
}

export async function validateVideoFile(file: File): Promise<VideoValidationResult> {
  try {
    const metadata = await extractVideoMetadata(file);
    const result = validateVideoMetadata(metadata);
    return result;
  } catch (error) {
    return {
      valid: false,
      errors: [createVideoError(
        VideoErrorCode.PREPROCESSING,
        error instanceof Error ? error.message : 'Failed to validate video file'
      )]
    };
  }
}

export function displayValidationErrors(errors: VideoValidationError[]): string[] {
  return errors.map(error => getUserFriendlyErrorMessage(error));
}

export interface UploadProgress {
  sessionId: string;
  totalChunks: number;
  uploadedChunks: number;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'failed' | 'cancelled';
  error?: VideoValidationError;
}

export class ResumableVideoUploader {
  private file: File;
  private sessionId: string | null = null;
  private totalChunks: number = 0;
  private uploadedChunks: Set<number> = new Set();
  private onProgress?: (progress: UploadProgress) => void;
  private onComplete?: (videoUrl: string) => void;
  private onError?: (error: VideoValidationError) => void;
  private abortController: AbortController | null = null;

  constructor(
    file: File,
    callbacks?: {
      onProgress?: (progress: UploadProgress) => void;
      onComplete?: (videoUrl: string) => void;
      onError?: (error: VideoValidationError) => void;
    }
  ) {
    this.file = file;
    this.onProgress = callbacks?.onProgress;
    this.onComplete = callbacks?.onComplete;
    this.onError = callbacks?.onError;
  }

  async start(): Promise<string> {
    try {
      const validationResult = await validateVideoFile(this.file);
      
      if (!validationResult.valid) {
        const error = validationResult.errors[0];
        this.onError?.(error);
        throw new Error(getUserFriendlyErrorMessage(error));
      }

      const session = await this.createUploadSession();
      this.sessionId = session.sessionId;
      this.totalChunks = session.totalChunks;

      await this.uploadChunks();
      const finalResult = await this.finalizeUpload();

      this.onComplete?.(finalResult.videoUrl);
      return finalResult.videoUrl;
    } catch (error) {
      const videoError = createVideoError(
        VideoErrorCode.UNKNOWN_ERROR,
        error instanceof Error ? error.message : 'Upload failed'
      );
      this.onError?.(videoError);
      throw error;
    }
  }

  private async createUploadSession(): Promise<{
    sessionId: string;
    totalChunks: number;
    chunkSize: number;
    expiresAt: Date;
  }> {
    const response = await fetch('/api/videos/upload/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        fileName: this.file.name,
        fileSize: this.file.size,
        mimeType: this.file.type
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Failed to create upload session');
    }

    return response.json();
  }

  private async uploadChunks(): Promise<void> {
    this.abortController = new AbortController();

    for (let chunkIndex = 0; chunkIndex < this.totalChunks; chunkIndex++) {
      if (this.uploadedChunks.has(chunkIndex)) {
        continue;
      }

      const start = chunkIndex * VIDEO_CONSTRAINTS.CHUNK_SIZE;
      const end = Math.min(start + VIDEO_CONSTRAINTS.CHUNK_SIZE, this.file.size);
      const chunk = this.file.slice(start, end);

      await this.uploadChunk(chunkIndex, chunk);
      
      this.uploadedChunks.add(chunkIndex);
      
      this.notifyProgress();
    }
  }

  private async uploadChunk(chunkIndex: number, chunk: Blob): Promise<void> {
    const maxRetries = 3;
    let attempt = 0;

    while (attempt < maxRetries) {
      try {
        const formData = new FormData();
        formData.append('chunk', chunk);
        formData.append('chunkIndex', chunkIndex.toString());

        const response = await fetch(`/api/videos/upload/${this.sessionId}/chunk`, {
          method: 'POST',
          credentials: 'include',
          body: formData,
          signal: this.abortController?.signal
        });

        if (!response.ok) {
          throw new Error(`Failed to upload chunk ${chunkIndex}`);
        }

        return;
      } catch (error) {
        attempt++;
        if (attempt >= maxRetries) {
          throw error;
        }
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
  }

  private async finalizeUpload(): Promise<{ videoUrl: string }> {
    const response = await fetch(`/api/videos/upload/${this.sessionId}/finalize`, {
      method: 'POST',
      credentials: 'include'
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Failed to finalize upload');
    }

    return response.json();
  }

  private notifyProgress(): void {
    if (!this.sessionId) return;

    this.onProgress?.({
      sessionId: this.sessionId,
      totalChunks: this.totalChunks,
      uploadedChunks: this.uploadedChunks.size,
      progress: (this.uploadedChunks.size / this.totalChunks) * 100,
      status: this.uploadedChunks.size === this.totalChunks ? 'completed' : 'uploading'
    });
  }

  cancel(): void {
    this.abortController?.abort();
    if (this.sessionId) {
      fetch(`/api/videos/upload/${this.sessionId}/cancel`, {
        method: 'DELETE',
        credentials: 'include'
      }).catch(console.error);
    }
  }

  async resume(sessionId: string): Promise<void> {
    this.sessionId = sessionId;
    
    const response = await fetch(`/api/videos/upload/${sessionId}/status`, {
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error('Failed to get upload status');
    }

    const status = await response.json();
    this.totalChunks = status.totalChunks;
    
    if (Array.isArray(status.uploadedChunks)) {
      this.uploadedChunks = new Set(status.uploadedChunks);
    }

    if (status.status !== 'completed') {
      await this.uploadChunks();
      const finalResult = await this.finalizeUpload();
      this.onComplete?.(finalResult.videoUrl);
    }
  }
}
