import type { Request, Response } from "express";
import type { UploadSession, VideoMetadata } from "@shared/videoValidation";
import {
  VideoErrorCode,
  VIDEO_CONSTRAINTS,
  validateVideoMetadata,
  createVideoError,
  generateCorrelationId
} from "@shared/videoValidation";
import { v4 as uuidv4 } from 'uuid';
import { objectStorageClient } from './objectStorage';
import multer from 'multer';
import { Readable } from 'stream';

interface UploadSessionWithChunks extends UploadSession {
  uploadedChunkIndices: number[];
}

interface UploadSessionStore {
  [sessionId: string]: UploadSessionWithChunks;
}

const uploadSessions: UploadSessionStore = {};
const SESSION_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: VIDEO_CONSTRAINTS.CHUNK_SIZE * 2 // Allow some buffer
  }
});

function getBucketName(): string {
  const publicPaths = process.env.PUBLIC_OBJECT_SEARCH_PATHS || '';
  const firstPath = publicPaths.split(',')[0].trim();
  const bucketMatch = firstPath.match(/\/([^\/,]+)/);
  return bucketMatch ? bucketMatch[1].replace(/,+$/, '') : '';
}

function getChunkPath(sessionId: string, chunkIndex: number): string {
  return `.private/video-uploads/${sessionId}/chunk-${chunkIndex}`;
}

function getFinalVideoPath(sessionId: string, fileName: string): string {
  const timestamp = Date.now();
  const extension = fileName.substring(fileName.lastIndexOf('.'));
  return `videos/${sessionId}-${timestamp}${extension}`;
}

export const videoUploadService = {
  async validateVideo(req: Request, res: Response) {
    try {
      const { fileName, fileSize, mimeType, duration, width, height } = req.body;

      if (!fileName || !fileSize || !mimeType) {
        return res.status(400).json({
          valid: false,
          errors: [createVideoError(
            VideoErrorCode.CLIENT_VALIDATION,
            "Missing required fields: fileName, fileSize, mimeType"
          )]
        });
      }

      const metadata: VideoMetadata = {
        fileName,
        fileSize,
        mimeType,
        duration,
        width,
        height
      };

      const result = validateVideoMetadata(metadata);

      if (result.valid) {
        return res.json({
          valid: true,
          metadata: result.metadata,
          warnings: result.warnings
        });
      } else {
        return res.status(400).json({
          valid: false,
          errors: result.errors,
          warnings: result.warnings
        });
      }
    } catch (error) {
      console.error('[VIDEO-VALIDATION] Error validating video', error);
      return res.status(500).json({
        valid: false,
        errors: [createVideoError(
          VideoErrorCode.UNKNOWN_ERROR,
          'Failed to validate video',
          { error: error instanceof Error ? error.message : 'Unknown error' }
        )]
      });
    }
  },

  async createUploadSession(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (typeof userId !== 'number') {
        return res.status(401).json({
          error: createVideoError(
            VideoErrorCode.AUTHENTICATION_REQUIRED,
            'Authentication required'
          )
        });
      }

      const { fileName, fileSize, mimeType } = req.body;

      if (!fileName || !fileSize || !mimeType) {
        return res.status(400).json({
          error: createVideoError(
            VideoErrorCode.CLIENT_VALIDATION,
            'Missing required fields: fileName, fileSize, mimeType'
          )
        });
      }

      const validationResult = validateVideoMetadata({
        fileName,
        fileSize,
        mimeType
      });

      if (!validationResult.valid) {
        return res.status(400).json({
          error: validationResult.errors[0],
          allErrors: validationResult.errors
        });
      }

      const sessionId = uuidv4();
      const totalChunks = Math.ceil(fileSize / VIDEO_CONSTRAINTS.CHUNK_SIZE);

      if (totalChunks > VIDEO_CONSTRAINTS.MAX_CHUNKS) {
        return res.status(400).json({
          error: createVideoError(
            VideoErrorCode.FILE_TOO_LARGE,
            `File is too large. Maximum ${VIDEO_CONSTRAINTS.MAX_CHUNKS} chunks allowed.`,
            { totalChunks, maxChunks: VIDEO_CONSTRAINTS.MAX_CHUNKS }
          )
        });
      }

      const session: UploadSessionWithChunks = {
        sessionId,
        fileName,
        fileSize,
        mimeType,
        totalChunks,
        chunkSize: VIDEO_CONSTRAINTS.CHUNK_SIZE,
        uploadedChunks: [],
        uploadedChunkIndices: [],
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + SESSION_EXPIRY_MS),
        userId,
        status: 'pending'
      };

      uploadSessions[sessionId] = session;

      this.cleanupExpiredSessions();

      console.log(`[VIDEO-UPLOAD] Created session ${sessionId} for user ${userId}, ${totalChunks} chunks`);

      return res.status(201).json({
        sessionId,
        totalChunks,
        chunkSize: VIDEO_CONSTRAINTS.CHUNK_SIZE,
        expiresAt: session.expiresAt
      });
    } catch (error) {
      console.error('[VIDEO-UPLOAD] Error creating upload session', error);
      return res.status(500).json({
        error: createVideoError(
          VideoErrorCode.UNKNOWN_ERROR,
          'Failed to create upload session',
          { error: error instanceof Error ? error.message : 'Unknown error' }
        )
      });
    }
  },

  uploadChunkMiddleware: upload.single('chunk'),

  async uploadChunk(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (typeof userId !== 'number') {
        return res.status(401).json({
          error: createVideoError(
            VideoErrorCode.AUTHENTICATION_REQUIRED,
            'Authentication required'
          )
        });
      }

      const { sessionId } = req.params;
      const chunkIndexStr = req.body.chunkIndex;

      if (!sessionId || chunkIndexStr === undefined || !req.file) {
        return res.status(400).json({
          error: createVideoError(
            VideoErrorCode.CLIENT_VALIDATION,
            'Missing required fields: sessionId, chunkIndex, chunk file'
          )
        });
      }

      const session = uploadSessions[sessionId];

      if (!session) {
        return res.status(404).json({
          error: createVideoError(
            VideoErrorCode.CHUNK_IO,
            'Upload session not found or expired',
            { sessionId }
          )
        });
      }

      if (session.userId !== userId) {
        return res.status(403).json({
          error: createVideoError(
            VideoErrorCode.AUTHENTICATION_REQUIRED,
            'Unauthorized access to upload session'
          )
        });
      }

      if (new Date() > session.expiresAt) {
        delete uploadSessions[sessionId];
        return res.status(410).json({
          error: createVideoError(
            VideoErrorCode.CHUNK_IO,
            'Upload session expired',
            { sessionId, expiresAt: session.expiresAt }
          )
        });
      }

      const chunkIndex = parseInt(chunkIndexStr);
      if (chunkIndex < 0 || chunkIndex >= session.totalChunks) {
        return res.status(400).json({
          error: createVideoError(
            VideoErrorCode.CHUNK_IO,
            `Invalid chunk index: ${chunkIndex}. Valid range: 0-${session.totalChunks - 1}`
          )
        });
      }

      const bucketName = getBucketName();
      if (!bucketName) {
        return res.status(503).json({
          error: createVideoError(
            VideoErrorCode.STORAGE_UNAVAILABLE,
            'Object storage not configured'
          )
        });
      }

      const bucket = objectStorageClient.bucket(bucketName);
      const chunkPath = getChunkPath(sessionId, chunkIndex);
      const chunkFile = bucket.file(chunkPath);

      await chunkFile.save(req.file.buffer, {
        metadata: {
          contentType: 'application/octet-stream'
        }
      });

      if (!session.uploadedChunkIndices.includes(chunkIndex)) {
        session.uploadedChunkIndices.push(chunkIndex);
        session.uploadedChunkIndices.sort((a, b) => a - b);
        session.uploadedChunks = session.uploadedChunkIndices;
        session.status = 'uploading';
      }

      console.log(`[VIDEO-UPLOAD] Chunk ${chunkIndex}/${session.totalChunks - 1} uploaded for session ${sessionId}`);

      return res.json({
        success: true,
        sessionId,
        uploadedChunks: session.uploadedChunkIndices.length,
        totalChunks: session.totalChunks,
        progress: (session.uploadedChunkIndices.length / session.totalChunks) * 100
      });
    } catch (error) {
      console.error('[VIDEO-UPLOAD] Error uploading chunk', error);
      return res.status(500).json({
        error: createVideoError(
          VideoErrorCode.CHUNK_IO,
          'Failed to upload chunk',
          { error: error instanceof Error ? error.message : 'Unknown error' }
        )
      });
    }
  },

  async getUploadStatus(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (typeof userId !== 'number') {
        return res.status(401).json({
          error: createVideoError(
            VideoErrorCode.AUTHENTICATION_REQUIRED,
            'Authentication required'
          )
        });
      }

      const { sessionId } = req.params;

      if (!sessionId) {
        return res.status(400).json({
          error: createVideoError(
            VideoErrorCode.CLIENT_VALIDATION,
            'Session ID required'
          )
        });
      }

      const session = uploadSessions[sessionId];

      if (!session) {
        return res.status(404).json({
          error: createVideoError(
            VideoErrorCode.CHUNK_IO,
            'Upload session not found',
            { sessionId }
          )
        });
      }

      if (session.userId !== userId) {
        return res.status(403).json({
          error: createVideoError(
            VideoErrorCode.AUTHENTICATION_REQUIRED,
            'Unauthorized access to upload session'
          )
        });
      }

      return res.json({
        sessionId: session.sessionId,
        status: session.status,
        uploadedChunks: session.uploadedChunkIndices,
        totalChunks: session.totalChunks,
        progress: (session.uploadedChunkIndices.length / session.totalChunks) * 100,
        expiresAt: session.expiresAt
      });
    } catch (error) {
      console.error('[VIDEO-UPLOAD] Error getting upload status', error);
      return res.status(500).json({
        error: createVideoError(
          VideoErrorCode.UNKNOWN_ERROR,
          'Failed to get upload status',
          { error: error instanceof Error ? error.message : 'Unknown error' }
        )
      });
    }
  },

  async finalizeUpload(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (typeof userId !== 'number') {
        return res.status(401).json({
          error: createVideoError(
            VideoErrorCode.AUTHENTICATION_REQUIRED,
            'Authentication required'
          )
        });
      }

      const { sessionId } = req.params;

      if (!sessionId) {
        return res.status(400).json({
          error: createVideoError(
            VideoErrorCode.CLIENT_VALIDATION,
            'Session ID required'
          )
        });
      }

      const session = uploadSessions[sessionId];

      if (!session) {
        return res.status(404).json({
          error: createVideoError(
            VideoErrorCode.FINALIZE,
            'Upload session not found',
            { sessionId }
          )
        });
      }

      if (session.userId !== userId) {
        return res.status(403).json({
          error: createVideoError(
            VideoErrorCode.AUTHENTICATION_REQUIRED,
            'Unauthorized access to upload session'
          )
        });
      }

      if (session.uploadedChunkIndices.length !== session.totalChunks) {
        const missingChunks = Array.from(
          { length: session.totalChunks },
          (_, i) => i
        ).filter(i => !session.uploadedChunkIndices.includes(i));

        return res.status(400).json({
          error: createVideoError(
            VideoErrorCode.FINALIZE,
            'Not all chunks have been uploaded',
            {
              uploadedChunks: session.uploadedChunkIndices.length,
              totalChunks: session.totalChunks,
              missingChunks
            }
          )
        });
      }

      const bucketName = getBucketName();
      if (!bucketName) {
        return res.status(503).json({
          error: createVideoError(
            VideoErrorCode.STORAGE_UNAVAILABLE,
            'Object storage not configured'
          )
        });
      }

      console.log(`[VIDEO-UPLOAD] Assembling ${session.totalChunks} chunks for session ${sessionId}`);

      const bucket = objectStorageClient.bucket(bucketName);
      const chunks: Buffer[] = [];

      for (let i = 0; i < session.totalChunks; i++) {
        const chunkPath = getChunkPath(sessionId, i);
        const chunkFile = bucket.file(chunkPath);
        
        const [chunkData] = await chunkFile.download();
        chunks.push(chunkData);
      }

      const completeFile = Buffer.concat(chunks);

      if (completeFile.length !== session.fileSize) {
        console.error(`[VIDEO-UPLOAD] File size mismatch: expected ${session.fileSize}, got ${completeFile.length}`);
        return res.status(500).json({
          error: createVideoError(
            VideoErrorCode.FINALIZE,
            'File assembly failed: size mismatch',
            { expected: session.fileSize, actual: completeFile.length }
          )
        });
      }

      const finalPath = getFinalVideoPath(sessionId, session.fileName);
      const finalFile = bucket.file(finalPath);

      await finalFile.save(completeFile, {
        metadata: {
          contentType: session.mimeType
        }
      });

      for (let i = 0; i < session.totalChunks; i++) {
        const chunkPath = getChunkPath(sessionId, i);
        const chunkFile = bucket.file(chunkPath);
        await chunkFile.delete().catch((err: any) => 
          console.warn(`[VIDEO-UPLOAD] Failed to delete chunk ${i}:`, err)
        );
      }

      session.status = 'completed';

      const correlationId = generateCorrelationId();

      console.log(`[VIDEO-UPLOAD] Upload finalized: ${sessionId} -> ${finalPath} (correlation: ${correlationId})`);

      const publicUrl = `/${finalPath}`;

      return res.json({
        success: true,
        sessionId,
        fileName: session.fileName,
        fileSize: session.fileSize,
        videoUrl: publicUrl,
        correlationId
      });
    } catch (error) {
      console.error('[VIDEO-UPLOAD] Error finalizing upload', error);
      return res.status(500).json({
        error: createVideoError(
          VideoErrorCode.FINALIZE,
          'Failed to finalize upload',
          { error: error instanceof Error ? error.message : 'Unknown error' }
        )
      });
    }
  },

  async cancelUploadSession(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (typeof userId !== 'number') {
        return res.status(401).json({
          error: createVideoError(
            VideoErrorCode.AUTHENTICATION_REQUIRED,
            'Authentication required'
          )
        });
      }

      const { sessionId } = req.params;

      if (!sessionId) {
        return res.status(400).json({
          error: createVideoError(
            VideoErrorCode.CLIENT_VALIDATION,
            'Session ID required'
          )
        });
      }

      const session = uploadSessions[sessionId];

      if (!session) {
        return res.status(404).json({
          error: createVideoError(
            VideoErrorCode.UNKNOWN_ERROR,
            'Upload session not found',
            { sessionId }
          )
        });
      }

      if (session.userId !== userId) {
        return res.status(403).json({
          error: createVideoError(
            VideoErrorCode.AUTHENTICATION_REQUIRED,
            'Unauthorized access to upload session'
          )
        });
      }

      const bucketName = getBucketName();
      if (bucketName) {
        const bucket = objectStorageClient.bucket(bucketName);
        
        for (let i = 0; i < session.uploadedChunkIndices.length; i++) {
          const chunkIndex = session.uploadedChunkIndices[i];
          const chunkPath = getChunkPath(sessionId, chunkIndex);
          const chunkFile = bucket.file(chunkPath);
          await chunkFile.delete().catch((err: any) => 
            console.warn(`[VIDEO-UPLOAD] Failed to delete chunk ${chunkIndex}:`, err)
          );
        }
      }

      delete uploadSessions[sessionId];

      console.log(`[VIDEO-UPLOAD] Session ${sessionId} cancelled and cleaned up`);

      return res.json({
        success: true,
        message: 'Upload session cancelled'
      });
    } catch (error) {
      console.error('[VIDEO-UPLOAD] Error cancelling upload session', error);
      return res.status(500).json({
        error: createVideoError(
          VideoErrorCode.UNKNOWN_ERROR,
          'Failed to cancel upload session',
          { error: error instanceof Error ? error.message : 'Unknown error' }
        )
      });
    }
  },

  cleanupExpiredSessions() {
    const now = new Date();
    const expiredSessions = Object.entries(uploadSessions)
      .filter(([_, session]) => now > session.expiresAt)
      .map(([sessionId]) => sessionId);

    expiredSessions.forEach(sessionId => {
      const session = uploadSessions[sessionId];
      
      const bucketName = getBucketName();
      if (bucketName && session.uploadedChunkIndices.length > 0) {
        const bucket = objectStorageClient.bucket(bucketName);
        
        session.uploadedChunkIndices.forEach(chunkIndex => {
          const chunkPath = getChunkPath(sessionId, chunkIndex);
          const chunkFile = bucket.file(chunkPath);
          chunkFile.delete().catch((err: any) => 
            console.warn(`[VIDEO-UPLOAD] Failed to delete expired chunk:`, err)
          );
        });
      }
      
      delete uploadSessions[sessionId];
    });

    if (expiredSessions.length > 0) {
      console.log(`[VIDEO-UPLOAD] Cleaned up ${expiredSessions.length} expired session(s)`);
    }
  }
};

setInterval(() => {
  videoUploadService.cleanupExpiredSessions();
}, 60 * 60 * 1000); // Clean up every hour
