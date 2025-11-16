import { Request, Response, Express } from 'express';
import { randomUUID } from 'crypto';
import { createHash } from 'crypto';
import { objectStorageClient, ObjectStorageService } from './objectStorage';
import { setObjectAclPolicy } from './objectAcl';
import { storage } from './storage';
import { isAuthenticated } from './unified-auth';
import { Readable } from 'stream';

const MAX_FILE_SIZE = 50 * 1024 * 1024;

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'text/csv',
  'video/mp4',
  'video/mpeg',
  'video/quicktime',
  'video/x-msvideo',
  'video/webm',
  'audio/mpeg',
  'audio/wav',
  'audio/ogg',
  'application/zip',
  'application/x-rar-compressed',
];

function parseObjectPath(fullPath: string): { bucketName: string; objectName: string } {
  if (!fullPath.startsWith('/')) {
    throw new Error('Object path must start with /');
  }

  const parts = fullPath.slice(1).split('/');
  if (parts.length < 2) {
    throw new Error('Invalid object path format');
  }

  const bucketName = parts[0];
  const objectName = parts.slice(1).join('/');

  return { bucketName, objectName };
}

export async function uploadEventFile(req: Request, res: Response): Promise<void> {
  try {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    const user = req.user as any;
    const eventId = parseInt(req.params.eventId);

    if (isNaN(eventId)) {
      res.status(400).json({
        success: false,
        message: 'Invalid event ID'
      });
      return;
    }

    const hasAccess = await storage.checkEventParticipantAccess(eventId, user.id);
    if (!hasAccess) {
      res.status(403).json({
        success: false,
        message: 'You do not have permission to upload files to this event'
      });
      return;
    }

    const event = await storage.getCalendarEvent(eventId);
    if (!event) {
      res.status(404).json({
        success: false,
        message: 'Event not found'
      });
      return;
    }

    if (!event.shareWithParticipants) {
      res.status(403).json({
        success: false,
        message: 'File sharing is not enabled for this event'
      });
      return;
    }

    const fileName = req.headers['x-file-name'] as string;
    const fileType = req.headers['x-file-type'] as string;
    const contentLength = req.headers['content-length'];

    if (!fileName || !fileType) {
      res.status(400).json({
        success: false,
        message: 'x-file-name and x-file-type headers are required'
      });
      return;
    }

    if (!contentLength) {
      res.status(411).json({
        success: false,
        message: 'Content-Length header is required'
      });
      return;
    }

    const fileSize = parseInt(contentLength, 10);

    if (isNaN(fileSize) || fileSize <= 0) {
      res.status(400).json({
        success: false,
        message: 'Invalid Content-Length header'
      });
      return;
    }

    if (fileSize > MAX_FILE_SIZE) {
      res.status(413).json({
        success: false,
        message: `File size ${(fileSize / 1024 / 1024).toFixed(2)}MB exceeds maximum limit of ${MAX_FILE_SIZE / 1024 / 1024}MB`
      });
      return;
    }

    if (!ALLOWED_MIME_TYPES.includes(fileType.toLowerCase())) {
      res.status(400).json({
        success: false,
        message: `Unsupported file type. Allowed types: images, documents, videos, audio, and archives`
      });
      return;
    }

    const fileId = randomUUID();
    const fileExtension = fileName.split('.').pop() || '';
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storageFileName = `${fileId}_${sanitizedFileName}`;
    
    const privateDir = process.env.PRIVATE_OBJECT_DIR || '/.private';
    const storagePath = `${privateDir}/calendar-events/${eventId}/${storageFileName}`;

    const { bucketName, objectName } = parseObjectPath(storagePath);

    const hash = createHash('sha256');
    let uploadedSize = 0;

    req.on('data', (chunk: Buffer) => {
      uploadedSize += chunk.length;
      if (uploadedSize > fileSize) {
        req.pause();
        req.destroy();
      }
      hash.update(chunk);
    });

    await objectStorageClient.putObject(
      bucketName,
      objectName,
      req as Readable,
      fileSize,
      {
        'Content-Type': fileType,
        'x-uploaded-by': user.id.toString(),
        'x-event-id': eventId.toString(),
      }
    );

    const checksum = hash.digest('hex');

    const attachment = {
      id: fileId,
      name: fileName,
      mimeType: fileType,
      size: fileSize,
      storagePath,
      checksum,
      uploadedBy: user.id,
      uploadedAt: new Date().toISOString(),
    };

    await storage.addCalendarEventAttachment(eventId, user.id, attachment);

    res.json({
      success: true,
      message: 'File uploaded successfully',
      attachment,
    });
  } catch (error: any) {
    console.error('Error uploading event file:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to upload file'
    });
  }
}

export async function downloadEventFile(req: Request, res: Response): Promise<void> {
  try {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    const user = req.user as any;
    const eventId = parseInt(req.params.eventId);
    const attachmentId = req.params.attachmentId;

    if (isNaN(eventId)) {
      res.status(400).json({
        success: false,
        message: 'Invalid event ID'
      });
      return;
    }

    const hasAccess = await storage.checkEventParticipantAccess(eventId, user.id);
    if (!hasAccess) {
      res.status(403).json({
        success: false,
        message: 'You do not have permission to access this file'
      });
      return;
    }

    const attachments = await storage.getCalendarEventAttachments(eventId);
    const attachment = attachments.find((att: any) => att.id === attachmentId);

    if (!attachment) {
      res.status(404).json({
        success: false,
        message: 'File not found'
      });
      return;
    }

    const { bucketName, objectName } = parseObjectPath(attachment.storagePath);

    const dataStream = await objectStorageClient.getObject(bucketName, objectName);

    res.setHeader('Content-Type', attachment.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${attachment.name}"`);
    res.setHeader('Content-Length', attachment.size);

    dataStream.pipe(res);
  } catch (error: any) {
    console.error('Error downloading event file:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to download file'
    });
  }
}

export async function deleteEventFile(req: Request, res: Response): Promise<void> {
  try {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    const user = req.user as any;
    const eventId = parseInt(req.params.eventId);
    const attachmentId = req.params.attachmentId;

    if (isNaN(eventId)) {
      res.status(400).json({
        success: false,
        message: 'Invalid event ID'
      });
      return;
    }

    const hasAccess = await storage.checkEventParticipantAccess(eventId, user.id);
    if (!hasAccess) {
      res.status(403).json({
        success: false,
        message: 'You do not have permission to delete this file'
      });
      return;
    }

    const attachments = await storage.getCalendarEventAttachments(eventId);
    const attachment = attachments.find((att: any) => att.id === attachmentId);

    if (!attachment) {
      res.status(404).json({
        success: false,
        message: 'File not found'
      });
      return;
    }

    const event = await storage.getCalendarEvent(eventId);
    if (event && event.userId !== user.id && attachment.uploadedBy !== user.id) {
      res.status(403).json({
        success: false,
        message: 'You can only delete files you uploaded or if you are the event owner'
      });
      return;
    }

    const { bucketName, objectName } = parseObjectPath(attachment.storagePath);

    await objectStorageClient.removeObject(bucketName, objectName);

    await storage.deleteCalendarEventAttachment(eventId, user.id, attachmentId);

    res.json({
      success: true,
      message: 'File deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting event file:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete file'
    });
  }
}

export async function listEventFiles(req: Request, res: Response): Promise<void> {
  try {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    const user = req.user as any;
    const eventId = parseInt(req.params.eventId);

    if (isNaN(eventId)) {
      res.status(400).json({
        success: false,
        message: 'Invalid event ID'
      });
      return;
    }

    const hasAccess = await storage.checkEventParticipantAccess(eventId, user.id);
    if (!hasAccess) {
      res.status(403).json({
        success: false,
        message: 'You do not have permission to view files for this event'
      });
      return;
    }

    const attachments = await storage.getCalendarEventAttachments(eventId);

    res.json({
      success: true,
      attachments
    });
  } catch (error: any) {
    console.error('Error listing event files:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to list files'
    });
  }
}

export function registerCalendarEventFileRoutes(app: Express) {
  app.post('/api/calendar/events/:eventId/files', isAuthenticated, uploadEventFile);
  app.get('/api/calendar/events/:eventId/files', isAuthenticated, listEventFiles);
  app.get('/api/calendar/events/:eventId/files/:attachmentId', isAuthenticated, downloadEventFile);
  app.delete('/api/calendar/events/:eventId/files/:attachmentId', isAuthenticated, deleteEventFile);
}
