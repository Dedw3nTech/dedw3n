/**
 * Kids Verification Document Protection Service
 * 
 * Handles secure upload and storage of Kids Account verification documents
 * (ID or government-issued documents) to object storage for admin centre access.
 */

import { objectStorageClient } from './objectStorage';
import { db } from './db';
import { proxyAccounts } from '../shared/schema';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';

interface UploadResult {
  success: boolean;
  url: string | null;
  error?: string;
}

export class KidsDocumentProtectionService {
  private bucketName: string;
  private privatePath: string;

  constructor() {
    // Extract bucket name from PUBLIC_OBJECT_SEARCH_PATHS environment variable
    const publicPaths = process.env.PUBLIC_OBJECT_SEARCH_PATHS || '';
    const bucketMatch = publicPaths.match(/\/([^\/]+)/);
    this.bucketName = bucketMatch ? bucketMatch[1] : '';
    
    // Fallback to DEFAULT_OBJECT_STORAGE_BUCKET_ID if not found
    if (!this.bucketName) {
      this.bucketName = process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID || '';
    }
    
    this.privatePath = '.private/kids-verification-documents';
  }

  private generateSecureFilename(accountId: number, extension: string): string {
    const timestamp = Date.now();
    const randomBytes = crypto.randomBytes(8).toString('hex');
    return `kids-doc-${accountId}-${timestamp}-${randomBytes}.${extension}`;
  }

  private getDocumentExtension(base64Data: string): string {
    const match = base64Data.match(/^data:(application|image)\/([a-zA-Z0-9+\-]+);base64,/);
    if (match && match[2]) {
      const mimeSubtype = match[2].toLowerCase();
      
      if (mimeSubtype === 'pdf') return 'pdf';
      if (mimeSubtype === 'jpeg' || mimeSubtype === 'jpg') return 'jpg';
      if (mimeSubtype === 'png') return 'png';
      
      return mimeSubtype;
    }
    
    return 'pdf';
  }

  private getContentType(extension: string): string {
    const contentTypes: Record<string, string> = {
      'pdf': 'application/pdf',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp'
    };
    
    return contentTypes[extension.toLowerCase()] || 'application/pdf';
  }

  private base64ToBuffer(base64Data: string): Buffer {
    const base64String = base64Data.replace(/^data:(application|image)\/[a-zA-Z0-9+\-]+;base64,/, '');
    return Buffer.from(base64String, 'base64');
  }

  async uploadVerificationDocument(
    accountId: number,
    documentData: string
  ): Promise<UploadResult> {
    try {
      if (!this.bucketName) {
        throw new Error('Object Storage not configured');
      }

      const extension = this.getDocumentExtension(documentData);
      const buffer = this.base64ToBuffer(documentData);
      const filename = this.generateSecureFilename(accountId, extension);
      const filePath = `${this.privatePath}/${filename}`;

      const bucket = objectStorageClient.bucket(this.bucketName);
      const file = bucket.file(filePath);

      const contentType = this.getContentType(extension);

      await file.save(buffer, {
        metadata: {
          contentType: contentType,
          metadata: {
            uploadedAt: new Date().toISOString(),
            accountId: accountId.toString(),
            documentType: 'kids_verification',
            protected: 'true'
          }
        },
        resumable: true,
        timeout: 30000
      });

      // Generate private object URL that will be served through secure routes
      const documentUrl = `/${filePath}`;

      await db.update(proxyAccounts)
        .set({ 
          kidsVerificationDocumentUrl: documentUrl,
          updatedAt: new Date()
        })
        .where(eq(proxyAccounts.id, accountId));

      console.log(`[KIDS-DOC-PROTECTION] Document uploaded successfully for account ${accountId}`);

      return {
        success: true,
        url: documentUrl
      };

    } catch (error) {
      console.error('[KIDS-DOC-PROTECTION] Upload failed:', error);
      
      return {
        success: false,
        url: null,
        error: error instanceof Error ? error.message : 'Upload failed'
      };
    }
  }
}

export const kidsDocumentProtection = new KidsDocumentProtectionService();
