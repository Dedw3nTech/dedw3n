import { S3Client, GetObjectCommand, PutObjectCommand, DeleteObjectCommand, HeadObjectCommand, ListObjectsV2Command, HeadBucketCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Response } from "express";
import { randomUUID } from "crypto";
import { Readable, PassThrough } from "stream";

const R2_ACCOUNT_ID = "987df99e227c1b3cd8bbc12db0692cdf";
const R2_ENDPOINT = `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;

// Validate R2 credentials at startup
const hasR2AccessKey = !!process.env.R2_ACCESS_KEY_ID;
const hasR2SecretKey = !!process.env.R2_SECRET_ACCESS_KEY;

if (!hasR2AccessKey || !hasR2SecretKey) {
  console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.error('⚠️  OBJECT STORAGE CONFIGURATION ERROR');
  console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.error('Missing required Cloudflare R2 credentials:');
  if (!hasR2AccessKey) {
    console.error('  ❌ R2_ACCESS_KEY_ID not set');
    console.error('     Set this to your Cloudflare R2 Access Key ID');
  }
  if (!hasR2SecretKey) {
    console.error('  ❌ R2_SECRET_ACCESS_KEY not set');
    console.error('     Set this to your Cloudflare R2 Secret Access Key');
  }
  console.error('');
  console.error('Without these credentials, file uploads will fail!');
  console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
} else {
  console.log('[OBJECT-STORAGE] ✓ Cloudflare R2 credentials configured');
  console.log(`[OBJECT-STORAGE] ✓ R2 Endpoint: ${R2_ENDPOINT}`);
}

// The object storage client is used to interact with Cloudflare R2 (S3-compatible)
const s3Client = new S3Client({
  region: "auto",
  endpoint: R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
  },
});

// GCS Compatibility Layer for R2
class R2BucketFile {
  constructor(private bucketName: string, private keyName: string, private s3: S3Client) {}

  get name() {
    return this.keyName;
  }

  async exists(): Promise<[boolean]> {
    try {
      await this.s3.send(new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: this.keyName,
      }));
      return [true];
    } catch (error: any) {
      if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
        return [false];
      }
      throw error;
    }
  }

  async getMetadata() {
    const result = await this.s3.send(new HeadObjectCommand({
      Bucket: this.bucketName,
      Key: this.keyName,
    }));
    return [{
      contentType: result.ContentType,
      size: result.ContentLength,
      etag: result.ETag,
      updated: result.LastModified?.toISOString(),
      metadata: result.Metadata || {},
    }];
  }

  async setMetadata(options: { metadata: Record<string, string> }) {
    // R2 doesn't support arbitrary metadata like GCS
    // This is a no-op for compatibility
    console.log(`[R2] setMetadata called for ${this.bucketName}/${this.keyName} (no-op)`);
  }

  createReadStream(options?: { start?: number; end?: number }) {
    const getCommand = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: this.keyName,
      Range: options ? `bytes=${options.start || 0}-${options.end || ''}` : undefined,
    });

    return Readable.from((async function* () {
      const result = await s3Client.send(getCommand);
      if (result.Body instanceof Readable) {
        for await (const chunk of result.Body) {
          yield chunk;
        }
      }
    })());
  }

  createWriteStream(options?: { metadata?: { contentType?: string; metadata?: Record<string, string> } }) {
    const passThrough = new PassThrough();
    const chunks: Buffer[] = [];

    passThrough.on('data', (chunk: Buffer) => {
      chunks.push(chunk);
    });

    passThrough.on('end', async () => {
      try {
        const buffer = Buffer.concat(chunks);
        const command = new PutObjectCommand({
          Bucket: this.bucketName,
          Key: this.keyName,
          Body: buffer,
          ContentType: options?.metadata?.contentType || 'application/octet-stream',
          Metadata: options?.metadata?.metadata || {},
        });
        await this.s3.send(command);
        passThrough.emit('finish');
      } catch (error) {
        console.error(`[R2] Failed to upload ${this.bucketName}/${this.keyName}:`, error);
        passThrough.emit('error', error);
      }
    });

    return passThrough;
  }

  async save(data: string | Buffer, options?: { metadata?: { contentType?: string } }) {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: this.keyName,
        Body: data,
        ContentType: options?.metadata?.contentType || 'application/octet-stream',
      });
      await this.s3.send(command);
      return true;
    } catch (error) {
      console.error(`[R2] Failed to save ${this.bucketName}/${this.keyName}:`, error);
      throw error;
    }
  }

  async download(): Promise<[Buffer]> {
    try {
      const result = await this.s3.send(new GetObjectCommand({
        Bucket: this.bucketName,
        Key: this.keyName,
      }));

      if (result.Body instanceof Readable) {
        const chunks: Buffer[] = [];
        for await (const chunk of result.Body) {
          chunks.push(Buffer.from(chunk));
        }
        return [Buffer.concat(chunks)];
      }
      
      throw new Error('Unexpected body type');
    } catch (error: any) {
      if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
        throw new Error('File not found');
      }
      throw error;
    }
  }

  async delete() {
    try {
      await this.s3.send(new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: this.keyName,
      }));
      return [true];
    } catch (error: any) {
      if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
        return [false]; // File didn't exist
      }
      throw error;
    }
  }

  async getSignedUrl(options: { version: string; action: string; expires: number }) {
    let command;
    switch (options.action) {
      case 'read':
        command = new GetObjectCommand({ Bucket: this.bucketName, Key: this.keyName });
        break;
      case 'write':
        command = new PutObjectCommand({ Bucket: this.bucketName, Key: this.keyName });
        break;
      case 'delete':
        command = new DeleteObjectCommand({ Bucket: this.bucketName, Key: this.keyName });
        break;
      default:
        throw new Error(`Unsupported action: ${options.action}`);
    }
    const ttl = Math.floor((options.expires - Date.now()) / 1000);
    return [await getSignedUrl(s3Client, command, { expiresIn: ttl })];
  }

  async copy(destination: R2BucketFile) {
    try {
      const { CopyObjectCommand } = await import("@aws-sdk/client-s3");
      const encodedSource = `${encodeURIComponent(this.bucketName)}/${encodeURIComponent(this.keyName)}`;
      await this.s3.send(new CopyObjectCommand({
        Bucket: destination.bucketName,
        Key: destination.keyName,
        CopySource: encodedSource,
      }));
      return true;
    } catch (error) {
      console.error(`[R2] Failed to copy ${this.bucketName}/${this.keyName} to ${destination.bucketName}/${destination.keyName}:`, error);
      throw error;
    }
  }
}

class R2Bucket {
  constructor(private bucketName: string, private s3: S3Client) {}

  file(keyName: string) {
    return new R2BucketFile(this.bucketName, keyName, this.s3);
  }

  async getFiles(options?: {
    prefix?: string;
    delimiter?: string;
    maxResults?: number;
    autoPaginate?: boolean;
  }): Promise<[R2BucketFile[]]> {
    try {
      const command = new ListObjectsV2Command({
        Bucket: this.bucketName,
        Prefix: options?.prefix || '',
        Delimiter: options?.delimiter,
        MaxKeys: options?.maxResults || 1000,
      });

      const response = await this.s3.send(command);
      const files = (response.Contents || []).map(
        (obj) => new R2BucketFile(this.bucketName, obj.Key!, this.s3)
      );

      return [files];
    } catch (error: any) {
      if (error.name === 'NoSuchBucket' || error.$metadata?.httpStatusCode === 404) {
        return [[]];
      }
      throw error;
    }
  }

  async exists(): Promise<boolean> {
    try {
      await this.s3.send(new HeadBucketCommand({
        Bucket: this.bucketName,
      }));
      return true;
    } catch (error: any) {
      if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
        return false;
      }
      throw error;
    }
  }
}

class R2CompatibilityClient {
  constructor(private s3: S3Client) {}

  bucket(bucketName: string) {
    return new R2Bucket(bucketName, this.s3);
  }
}

// Export with GCS-compatible interface
export const objectStorageClient: any = new R2CompatibilityClient(s3Client);

export class ObjectNotFoundError extends Error {
  constructor() {
    super("Object not found");
    this.name = "ObjectNotFoundError";
    Object.setPrototypeOf(this, ObjectNotFoundError.prototype);
  }
}

// S3 Object Reference (replaces GCS File type)
export interface S3ObjectReference {
  bucket: string;
  key: string;
}

// The object storage service is used to interact with the object storage service.
export class ObjectStorageService {
  constructor() {}

  // Gets the public object search paths.
  getPublicObjectSearchPaths(): Array<string> {
    const pathsStr = process.env.PUBLIC_OBJECT_SEARCH_PATHS || "";
    const paths = Array.from(
      new Set(
        pathsStr
          .split(",")
          .map((path) => path.trim())
          .filter((path) => path.length > 0)
      )
    );
    if (paths.length === 0) {
      throw new Error(
        "PUBLIC_OBJECT_SEARCH_PATHS not set. Set PUBLIC_OBJECT_SEARCH_PATHS env var (comma-separated paths)."
      );
    }
    return paths;
  }

  // Gets the private object directory.
  getPrivateObjectDir(): string {
    const dir = process.env.PRIVATE_OBJECT_DIR || "";
    if (!dir) {
      throw new Error(
        "PRIVATE_OBJECT_DIR not set. Set PRIVATE_OBJECT_DIR env var."
      );
    }
    return dir;
  }

  /**
   * CDN OPTIMIZATION: Get optimized cache TTL based on content type
   */
  private getOptimizedCacheTtl(contentType: string, defaultTtl: number): number {
    if (contentType.startsWith('image/')) return 86400; // 24 hours
    if (contentType.startsWith('video/')) return 604800; // 7 days
    if (contentType.includes('font') || contentType.includes('woff')) return 2592000; // 30 days
    if (contentType.includes('css') || contentType.includes('javascript')) return 86400; // 1 day
    if (contentType.includes('pdf') || contentType.includes('document')) return 43200; // 12 hours
    return defaultTtl;
  }

  /**
   * CDN OPTIMIZATION: Build optimized Cache-Control header
   */
  private buildCacheControlHeader(contentType: string, maxAge: number, isPublic: boolean): string {
    const visibility = isPublic ? 'public' : 'private';
    const staleWhileRevalidate = Math.floor(maxAge * 0.1);
    let cacheControl = `${visibility}, max-age=${maxAge}, stale-while-revalidate=${staleWhileRevalidate}`;
    
    if (contentType.includes('font') || contentType.includes('woff')) {
      cacheControl += ', immutable';
    }
    
    if (contentType.startsWith('video/')) {
      const staleIfError = maxAge * 2;
      cacheControl += `, stale-if-error=${staleIfError}`;
    }
    
    return cacheControl;
  }

  // Search for a public object from the search paths.
  async searchPublicObject(filePath: string, signal?: AbortSignal): Promise<S3ObjectReference | null> {
    for (const searchPath of this.getPublicObjectSearchPaths()) {
      // Normalize duplicate terminal segments for backward compatibility
      // Example: if searchPath ends with 'public' and filePath starts with 'public/', remove one
      const searchPathSegments = searchPath.split('/').filter(s => s);
      const filePathSegments = filePath.split('/').filter(s => s);
      
      let normalizedPath = filePath;
      if (searchPathSegments.length > 0 && filePathSegments.length > 0) {
        const lastSearchSegment = searchPathSegments[searchPathSegments.length - 1];
        const firstFileSegment = filePathSegments[0];
        
        // If both end/start with the same segment (e.g., 'public'), remove duplicate
        if (lastSearchSegment === firstFileSegment) {
          normalizedPath = filePathSegments.slice(1).join('/');
        }
      }
      
      const fullPath = `${searchPath}/${normalizedPath}`;
      const { bucketName, objectName } = parseObjectPath(fullPath);

      try {
        await s3Client.send(new HeadObjectCommand({
          Bucket: bucketName,
          Key: objectName,
        }), signal ? { abortSignal: signal } : undefined);
        return { bucket: bucketName, key: objectName };
      } catch (error: any) {
        // Handle abort signals
        if (error.name === 'AbortError') {
          throw error;
        }
        if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
          continue;
        }
        throw error;
      }
    }

    return null;
  }

  // Downloads an object to the response.
  async downloadObject(objectRef: S3ObjectReference, res: Response, cacheTtlSec: number = 3600) {
    try {
      // Get object metadata
      const headResult = await s3Client.send(new HeadObjectCommand({
        Bucket: objectRef.bucket,
        Key: objectRef.key,
      }));

      const contentType = headResult.ContentType || "application/octet-stream";
      const isPublic = true; // R2 objects are public by default for this implementation
      
      // CDN-optimized cache TTL based on content type
      const optimizedCacheTtl = this.getOptimizedCacheTtl(contentType, cacheTtlSec);
      
      // Build CDN-optimized Cache-Control header
      const cacheControl = this.buildCacheControlHeader(contentType, optimizedCacheTtl, isPublic);
      
      // Set CDN-optimized headers
      const headers: Record<string, string> = {
        "Content-Type": contentType,
        "Content-Length": headResult.ContentLength?.toString() || "0",
        "Cache-Control": cacheControl,
        "Accept-Ranges": "bytes",
        "Vary": "Accept-Encoding",
      };
      
      if (headResult.ETag) headers["ETag"] = headResult.ETag;
      if (headResult.LastModified) headers["Last-Modified"] = headResult.LastModified.toUTCString();
      if (isPublic) headers["CDN-Cache-Control"] = `max-age=${optimizedCacheTtl}`;
      
      res.set(headers);

      // Handle range requests for video streaming
      const range = res.req.headers.range;
      if (range && contentType?.startsWith('video/')) {
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const fileSize = headResult.ContentLength || 0;
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
        const chunksize = (end - start) + 1;

        res.status(206);
        res.set({
          "Content-Range": `bytes ${start}-${end}/${fileSize}`,
          "Content-Length": chunksize.toString(),
        });

        const getResult = await s3Client.send(new GetObjectCommand({
          Bucket: objectRef.bucket,
          Key: objectRef.key,
          Range: `bytes=${start}-${end}`,
        }));

        if (getResult.Body instanceof Readable) {
          getResult.Body.pipe(res);
        }
        return;
      }

      // Stream the full file
      const getResult = await s3Client.send(new GetObjectCommand({
        Bucket: objectRef.bucket,
        Key: objectRef.key,
      }));

      if (getResult.Body instanceof Readable) {
        getResult.Body.on("error", (err) => {
          console.error("Stream error:", err);
          if (!res.headersSent) {
            res.status(500).json({ error: "Error streaming file" });
          }
        });

        getResult.Body.pipe(res);
      } else {
        throw new Error("Unexpected body type");
      }
    } catch (error) {
      console.error("Error downloading file:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: "Error downloading file" });
      }
    }
  }

  // Gets the upload URL for an object entity.
  async getObjectEntityUploadURL(): Promise<string> {
    const privateObjectDir = this.getPrivateObjectDir();
    if (!privateObjectDir) {
      throw new Error("PRIVATE_OBJECT_DIR not set.");
    }

    const objectId = randomUUID();
    const fullPath = `${privateObjectDir}/uploads/${objectId}`;
    const { bucketName, objectName } = parseObjectPath(fullPath);

    return signObjectURL({
      bucketName,
      objectName,
      method: "PUT",
      ttlSec: 900,
    });
  }

  // Gets the object entity file from the object path.
  async getObjectEntityFile(objectPath: string): Promise<S3ObjectReference> {
    if (!objectPath.startsWith("/objects/")) {
      throw new ObjectNotFoundError();
    }

    const parts = objectPath.slice(1).split("/");
    if (parts.length < 2) {
      throw new ObjectNotFoundError();
    }

    const entityId = parts.slice(1).join("/");
    let entityDir = this.getPrivateObjectDir();
    if (!entityDir.endsWith("/")) {
      entityDir = `${entityDir}/`;
    }
    const objectEntityPath = `${entityDir}${entityId}`;
    const { bucketName, objectName } = parseObjectPath(objectEntityPath);

    try {
      await s3Client.send(new HeadObjectCommand({
        Bucket: bucketName,
        Key: objectName,
      }));
      return { bucket: bucketName, key: objectName };
    } catch (error: any) {
      if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
        throw new ObjectNotFoundError();
      }
      throw error;
    }
  }

  normalizeObjectEntityPath(rawPath: string): string {
    // Handle R2/S3 URLs
    if (rawPath.startsWith(`https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com/`)) {
      const url = new URL(rawPath);
      const rawObjectPath = url.pathname;
  
      let objectEntityDir = this.getPrivateObjectDir();
      if (!objectEntityDir.endsWith("/")) {
        objectEntityDir = `${objectEntityDir}/`;
      }
  
      if (!rawObjectPath.startsWith(objectEntityDir)) {
        return rawObjectPath;
      }
  
      const entityId = rawObjectPath.slice(objectEntityDir.length);
      return `/objects/${entityId}`;
    }

    // Handle legacy GCS URLs
    if (rawPath.startsWith("https://storage.googleapis.com/")) {
      const url = new URL(rawPath);
      const rawObjectPath = url.pathname;
  
      let objectEntityDir = this.getPrivateObjectDir();
      if (!objectEntityDir.endsWith("/")) {
        objectEntityDir = `${objectEntityDir}/`;
      }
  
      if (!rawObjectPath.startsWith(objectEntityDir)) {
        return rawObjectPath;
      }
  
      const entityId = rawObjectPath.slice(objectEntityDir.length);
      return `/objects/${entityId}`;
    }
    
    return rawPath;
  }

  // Simplified ACL methods for R2 (R2 doesn't support complex ACLs like GCS)
  async trySetObjectEntityAclPolicy(rawPath: string, aclPolicy: any): Promise<string> {
    const normalizedPath = this.normalizeObjectEntityPath(rawPath);
    // R2 doesn't support granular ACL policies like GCS
    // Objects are either public or private based on bucket configuration
    return normalizedPath;
  }

  async canAccessObjectEntity(params: {
    userId?: string;
    objectFile: S3ObjectReference;
    requestedPermission?: any;
  }): Promise<boolean> {
    // Simplified access check for R2
    // In R2, access is typically controlled at the bucket level
    return true;
  }
}

function parseObjectPath(path: string): {
  bucketName: string;
  objectName: string;
} {
  if (!path.startsWith("/")) {
    path = `/${path}`;
  }
  const pathParts = path.split("/");
  if (pathParts.length < 3) {
    throw new Error("Invalid path: must contain at least a bucket name");
  }

  const bucketName = pathParts[1];
  const objectName = pathParts.slice(2).join("/");

  return {
    bucketName,
    objectName,
  };
}

async function signObjectURL({
  bucketName,
  objectName,
  method,
  ttlSec,
}: {
  bucketName: string;
  objectName: string;
  method: "GET" | "PUT" | "DELETE" | "HEAD";
  ttlSec: number;
}): Promise<string> {
  try {
    let command;
    
    switch (method) {
      case "GET":
        command = new GetObjectCommand({
          Bucket: bucketName,
          Key: objectName,
        });
        break;
      case "PUT":
        command = new PutObjectCommand({
          Bucket: bucketName,
          Key: objectName,
        });
        break;
      case "DELETE":
        command = new DeleteObjectCommand({
          Bucket: bucketName,
          Key: objectName,
        });
        break;
      case "HEAD":
        command = new HeadObjectCommand({
          Bucket: bucketName,
          Key: objectName,
        });
        break;
      default:
        throw new Error(`Unsupported method: ${method}`);
    }
    
    const signedUrl = await getSignedUrl(objectStorageClient, command, {
      expiresIn: ttlSec,
    });
    
    return signedUrl;
  } catch (error) {
    console.error('Failed to sign object URL for R2:', error);
    throw new Error(
      `Failed to sign object URL: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
