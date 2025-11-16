import { z } from "zod";

export enum VideoErrorCode {
  CLIENT_VALIDATION = "CLIENT_VALIDATION",
  INVALID_FORMAT = "INVALID_FORMAT",
  INVALID_CODEC = "INVALID_CODEC",
  FILE_TOO_LARGE = "FILE_TOO_LARGE",
  DURATION_TOO_LONG = "DURATION_TOO_LONG",
  RESOLUTION_INVALID = "RESOLUTION_INVALID",
  PREPROCESSING = "PREPROCESSING",
  CHUNK_IO = "CHUNK_IO",
  FINALIZE = "FINALIZE",
  STORAGE_UNAVAILABLE = "STORAGE_UNAVAILABLE",
  NETWORK_ERROR = "NETWORK_ERROR",
  AUTHENTICATION_REQUIRED = "AUTHENTICATION_REQUIRED",
  CONTENT_VIOLATION = "CONTENT_VIOLATION",
  UNKNOWN_ERROR = "UNKNOWN_ERROR"
}

export interface VideoValidationError {
  code: VideoErrorCode;
  message: string;
  details?: Record<string, any>;
  correlationId?: string;
  timestamp?: Date;
}

export const VIDEO_CONSTRAINTS = {
  ALLOWED_FORMATS: [
    'video/mp4',
    'video/webm',
    'video/quicktime',
    'video/x-msvideo',
    'video/x-matroska'
  ] as const,
  
  ALLOWED_EXTENSIONS: [
    '.mp4',
    '.webm',
    '.mov',
    '.avi',
    '.mkv'
  ] as const,
  
  ALLOWED_CODECS: {
    VIDEO: ['h264', 'h265', 'vp8', 'vp9', 'av1'],
    AUDIO: ['aac', 'opus', 'vorbis', 'mp3']
  },
  
  MAX_FILE_SIZE: {
    FREE: 100 * 1024 * 1024, // 100MB for free users
    PREMIUM: 500 * 1024 * 1024, // 500MB for premium users
    VIP: 2 * 1024 * 1024 * 1024 // 2GB for VIP users
  },
  
  MAX_DURATION: {
    SHORT_FORM: 60, // 60 seconds
    STORY: 30, // 30 seconds
    STANDARD: 600, // 10 minutes
    PREMIUM: 3600, // 1 hour
    LIVE_STREAM: Infinity
  },
  
  RESOLUTION: {
    MIN_WIDTH: 320,
    MIN_HEIGHT: 240,
    MAX_WIDTH: 3840, // 4K
    MAX_HEIGHT: 2160, // 4K
    RECOMMENDED_RATIOS: ['16:9', '9:16', '1:1', '4:3']
  },
  
  CHUNK_SIZE: 5 * 1024 * 1024, // 5MB chunks for resumable upload
  MAX_CHUNKS: 1000
} as const;

export type AllowedVideoFormat = typeof VIDEO_CONSTRAINTS.ALLOWED_FORMATS[number];
export type AllowedVideoExtension = typeof VIDEO_CONSTRAINTS.ALLOWED_EXTENSIONS[number];

export interface VideoMetadata {
  fileName: string;
  fileSize: number;
  mimeType: string;
  duration?: number;
  width?: number;
  height?: number;
  codec?: string;
  bitrate?: number;
}

export interface VideoValidationResult {
  valid: boolean;
  errors: VideoValidationError[];
  warnings?: string[];
  metadata?: VideoMetadata;
}

export function generateCorrelationId(): string {
  return `vid_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function createVideoError(
  code: VideoErrorCode,
  message: string,
  details?: Record<string, any>
): VideoValidationError {
  return {
    code,
    message,
    details,
    correlationId: generateCorrelationId(),
    timestamp: new Date()
  };
}

export function validateVideoFormat(mimeType: string, fileName: string): VideoValidationResult {
  const errors: VideoValidationError[] = [];
  
  if (!VIDEO_CONSTRAINTS.ALLOWED_FORMATS.includes(mimeType as AllowedVideoFormat)) {
    errors.push(createVideoError(
      VideoErrorCode.INVALID_FORMAT,
      `Unsupported video format: ${mimeType}. Allowed formats: ${VIDEO_CONSTRAINTS.ALLOWED_FORMATS.join(', ')}`,
      { mimeType, fileName, allowedFormats: VIDEO_CONSTRAINTS.ALLOWED_FORMATS }
    ));
  }
  
  const extension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
  if (!VIDEO_CONSTRAINTS.ALLOWED_EXTENSIONS.includes(extension as AllowedVideoExtension)) {
    errors.push(createVideoError(
      VideoErrorCode.INVALID_FORMAT,
      `Unsupported file extension: ${extension}. Allowed extensions: ${VIDEO_CONSTRAINTS.ALLOWED_EXTENSIONS.join(', ')}`,
      { extension, fileName, allowedExtensions: VIDEO_CONSTRAINTS.ALLOWED_EXTENSIONS }
    ));
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

export function validateVideoSize(
  fileSize: number,
  userTier: 'FREE' | 'PREMIUM' | 'VIP' = 'FREE'
): VideoValidationResult {
  const errors: VideoValidationError[] = [];
  const maxSize = VIDEO_CONSTRAINTS.MAX_FILE_SIZE[userTier];
  
  if (fileSize > maxSize) {
    const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(2);
    const fileSizeMB = (fileSize / (1024 * 1024)).toFixed(2);
    
    errors.push(createVideoError(
      VideoErrorCode.FILE_TOO_LARGE,
      `Video file is too large. File size: ${fileSizeMB}MB, Maximum allowed: ${maxSizeMB}MB for ${userTier} users`,
      { 
        fileSize, 
        maxSize, 
        fileSizeMB, 
        maxSizeMB, 
        userTier,
        upgradeRequired: userTier === 'FREE' ? 'Consider upgrading to Premium or VIP' : undefined
      }
    ));
  }
  
  if (fileSize === 0) {
    errors.push(createVideoError(
      VideoErrorCode.CLIENT_VALIDATION,
      'Video file is empty',
      { fileSize: 0 }
    ));
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

export function validateVideoDuration(
  duration: number,
  videoType: 'SHORT_FORM' | 'STORY' | 'STANDARD' | 'PREMIUM' | 'LIVE_STREAM' = 'STANDARD'
): VideoValidationResult {
  const errors: VideoValidationError[] = [];
  const maxDuration = VIDEO_CONSTRAINTS.MAX_DURATION[videoType];
  
  if (duration > maxDuration && maxDuration !== Infinity) {
    errors.push(createVideoError(
      VideoErrorCode.DURATION_TOO_LONG,
      `Video duration exceeds maximum. Duration: ${duration}s, Maximum: ${maxDuration}s for ${videoType} videos`,
      { duration, maxDuration, videoType }
    ));
  }
  
  if (duration <= 0) {
    errors.push(createVideoError(
      VideoErrorCode.CLIENT_VALIDATION,
      'Invalid video duration',
      { duration }
    ));
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

export function validateVideoResolution(
  width: number,
  height: number
): VideoValidationResult {
  const errors: VideoValidationError[] = [];
  const warnings: string[] = [];
  
  if (width < VIDEO_CONSTRAINTS.RESOLUTION.MIN_WIDTH || height < VIDEO_CONSTRAINTS.RESOLUTION.MIN_HEIGHT) {
    errors.push(createVideoError(
      VideoErrorCode.RESOLUTION_INVALID,
      `Video resolution too low. Minimum: ${VIDEO_CONSTRAINTS.RESOLUTION.MIN_WIDTH}x${VIDEO_CONSTRAINTS.RESOLUTION.MIN_HEIGHT}`,
      { width, height, minWidth: VIDEO_CONSTRAINTS.RESOLUTION.MIN_WIDTH, minHeight: VIDEO_CONSTRAINTS.RESOLUTION.MIN_HEIGHT }
    ));
  }
  
  if (width > VIDEO_CONSTRAINTS.RESOLUTION.MAX_WIDTH || height > VIDEO_CONSTRAINTS.RESOLUTION.MAX_HEIGHT) {
    errors.push(createVideoError(
      VideoErrorCode.RESOLUTION_INVALID,
      `Video resolution too high. Maximum: ${VIDEO_CONSTRAINTS.RESOLUTION.MAX_WIDTH}x${VIDEO_CONSTRAINTS.RESOLUTION.MAX_HEIGHT}`,
      { width, height, maxWidth: VIDEO_CONSTRAINTS.RESOLUTION.MAX_WIDTH, maxHeight: VIDEO_CONSTRAINTS.RESOLUTION.MAX_HEIGHT }
    ));
  }
  
  const aspectRatio = width / height;
  const commonRatios: Record<string, number> = {
    '16:9': 16/9,
    '9:16': 9/16,
    '1:1': 1,
    '4:3': 4/3
  };
  
  const matchesCommonRatio = Object.entries(commonRatios).some(
    ([ratio, value]) => Math.abs(aspectRatio - value) < 0.01
  );
  
  if (!matchesCommonRatio) {
    warnings.push(`Non-standard aspect ratio detected. Recommended ratios: ${VIDEO_CONSTRAINTS.RESOLUTION.RECOMMENDED_RATIOS.join(', ')}`);
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings: warnings.length > 0 ? warnings : undefined
  };
}

export function validateVideoMetadata(metadata: VideoMetadata): VideoValidationResult {
  const allErrors: VideoValidationError[] = [];
  const allWarnings: string[] = [];
  
  const formatResult = validateVideoFormat(metadata.mimeType, metadata.fileName);
  allErrors.push(...formatResult.errors);
  
  const sizeResult = validateVideoSize(metadata.fileSize);
  allErrors.push(...sizeResult.errors);
  
  if (metadata.duration) {
    const durationResult = validateVideoDuration(metadata.duration);
    allErrors.push(...durationResult.errors);
  }
  
  if (metadata.width && metadata.height) {
    const resolutionResult = validateVideoResolution(metadata.width, metadata.height);
    allErrors.push(...resolutionResult.errors);
    if (resolutionResult.warnings) {
      allWarnings.push(...resolutionResult.warnings);
    }
  }
  
  return {
    valid: allErrors.length === 0,
    errors: allErrors,
    warnings: allWarnings.length > 0 ? allWarnings : undefined,
    metadata
  };
}

export const uploadSessionSchema = z.object({
  sessionId: z.string(),
  fileName: z.string(),
  fileSize: z.number().positive(),
  mimeType: z.string(),
  totalChunks: z.number().positive().max(VIDEO_CONSTRAINTS.MAX_CHUNKS),
  chunkSize: z.number().positive().max(VIDEO_CONSTRAINTS.CHUNK_SIZE),
  uploadedChunks: z.array(z.number()).default([]),
  createdAt: z.date().default(() => new Date()),
  expiresAt: z.date(),
  userId: z.number(),
  status: z.enum(['pending', 'uploading', 'completed', 'failed', 'expired']).default('pending')
});

export type UploadSession = z.infer<typeof uploadSessionSchema>;

export function getUserFriendlyErrorMessage(error: VideoValidationError): string {
  const baseMessages: Record<VideoErrorCode, string> = {
    [VideoErrorCode.CLIENT_VALIDATION]: "Please check your video file and try again.",
    [VideoErrorCode.INVALID_FORMAT]: "This video format is not supported. Please use MP4, WebM, MOV, AVI, or MKV format.",
    [VideoErrorCode.INVALID_CODEC]: "Your video uses an unsupported codec. Please re-encode using H.264 or H.265.",
    [VideoErrorCode.FILE_TOO_LARGE]: "Your video file is too large. Please compress it or upgrade your account for higher limits.",
    [VideoErrorCode.DURATION_TOO_LONG]: "Your video is too long for this content type. Please trim it or choose a different video type.",
    [VideoErrorCode.RESOLUTION_INVALID]: "Video resolution is not supported. Please use a resolution between 320x240 and 3840x2160.",
    [VideoErrorCode.PREPROCESSING]: "We couldn't process your video. Please try again or use a different file.",
    [VideoErrorCode.CHUNK_IO]: "Upload failed. Please check your internet connection and try again.",
    [VideoErrorCode.FINALIZE]: "Couldn't finalize your upload. Please try again.",
    [VideoErrorCode.STORAGE_UNAVAILABLE]: "Our storage service is temporarily unavailable. Please try again in a few minutes.",
    [VideoErrorCode.NETWORK_ERROR]: "Network error occurred. Please check your connection and try again.",
    [VideoErrorCode.AUTHENTICATION_REQUIRED]: "Please log in to upload videos.",
    [VideoErrorCode.CONTENT_VIOLATION]: "Your video may violate our content policies. Please review our guidelines.",
    [VideoErrorCode.UNKNOWN_ERROR]: "An unexpected error occurred. Please try again later."
  };
  
  return error.message || baseMessages[error.code] || baseMessages[VideoErrorCode.UNKNOWN_ERROR];
}
