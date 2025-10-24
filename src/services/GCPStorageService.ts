/**
 * GCP Storage Service
 *
 * Handles file uploads and management with Google Cloud Storage.
 * Provides methods for uploading, downloading, and managing images in GCS.
 *
 * @module services/GCPStorageService
 */

import { Storage, Bucket, File } from '@google-cloud/storage';
import config from '../config/config';
import logger from '../config/logger';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

/**
 * Upload result interface
 */
export interface UploadResult {
  /**
   * Public URL to access the uploaded file
   */
  publicUrl: string;

  /**
   * GCS bucket name
   */
  bucket: string;

  /**
   * File path within the bucket
   */
  path: string;

  /**
   * File size in bytes
   */
  size: number;

  /**
   * File MIME type
   */
  mimeType: string;
}

/**
 * GCP Storage Service Class
 *
 * Manages all Google Cloud Storage operations for image files.
 * Implements singleton pattern to ensure single storage client.
 */
class GCPStorageService {
  private static instance: GCPStorageService;
  private storage: Storage;
  private bucket: Bucket;

  /**
   * Private constructor (singleton pattern)
   * Initializes GCS client with credentials
   */
  private constructor() {
    try {
      this.storage = new Storage({
        projectId: config.gcp.projectId,
        keyFilename: config.gcp.credentialsPath,
      });

      this.bucket = this.storage.bucket(config.gcs.bucketName);

      logger.info('✓ Google Cloud Storage connection established', {
        projectId: config.gcp.projectId,
        bucket: config.gcs.bucketName,
      });
    } catch (error) {
      logger.error('Failed to initialize Google Cloud Storage', { error });
      throw new Error('GCS initialization failed');
    }
  }

  /**
   * Get singleton instance of GCPStorageService
   *
   * @returns GCPStorageService instance
   */
  public static getInstance(): GCPStorageService {
    if (!GCPStorageService.instance) {
      GCPStorageService.instance = new GCPStorageService();
    }
    return GCPStorageService.instance;
  }

  /**
   * Upload a file to Google Cloud Storage
   *
   * @param buffer - File buffer (e.g., Base64 decoded image data)
   * @param fileName - Original file name
   * @param mimeType - File MIME type (e.g., 'image/png')
   * @param userId - ID of the user uploading the file
   * @param metadata - Additional metadata to store with the file
   * @returns Promise<UploadResult>
   */
  public async uploadFile(
    buffer: Buffer,
    fileName: string,
    mimeType: string,
    userId: string,
    metadata?: Record<string, string>
  ): Promise<UploadResult> {
    try {
      // Generate unique file path: users/{userId}/images/{uuid}-{fileName}
      const fileExtension = path.extname(fileName) || '.png';
      const uniqueFileName = `${uuidv4()}${fileExtension}`;
      const filePath = `users/${userId}/images/${uniqueFileName}`;

      const file = this.bucket.file(filePath);

      // Upload the file
      await file.save(buffer, {
        metadata: {
          contentType: mimeType,
          metadata: {
            userId,
            uploadedAt: new Date().toISOString(),
            ...metadata,
          },
        },
        public: true, // Make file publicly accessible
        resumable: false, // Use simple upload for small files
      });

      // Make the file publicly accessible
      await file.makePublic();

      // Get file metadata
      const [fileMetadata] = await file.getMetadata();

      const publicUrl = `${config.gcs.publicUrlBase}${filePath}`;

      logger.info('File uploaded to GCS', {
        userId,
        filePath,
        size: fileMetadata.size,
      });

      return {
        publicUrl,
        bucket: config.gcs.bucketName,
        path: filePath,
        size: parseInt(fileMetadata.size as string, 10),
        mimeType,
      };
    } catch (error) {
      logger.error('Failed to upload file to GCS', { userId, fileName, error });
      throw new Error('File upload failed');
    }
  }

  /**
   * Upload Base64 encoded image to GCS
   *
   * @param base64Data - Base64 encoded image data
   * @param fileName - Original file name
   * @param userId - ID of the user uploading the file
   * @param metadata - Additional metadata
   * @returns Promise<UploadResult>
   */
  public async uploadBase64Image(
    base64Data: string,
    fileName: string,
    userId: string,
    metadata?: Record<string, string>
  ): Promise<UploadResult> {
    try {
      // Extract MIME type from Base64 data URL if present
      let mimeType = 'image/png';
      let base64Content = base64Data;

      if (base64Data.startsWith('data:')) {
        const matches = base64Data.match(/^data:([^;]+);base64,(.+)$/);
        if (matches) {
          mimeType = matches[1] || 'image/png';
          base64Content = matches[2] || '';
        }
      }

      // Convert Base64 to Buffer
      const buffer = Buffer.from(base64Content, 'base64');

      return await this.uploadFile(buffer, fileName, mimeType, userId, metadata);
    } catch (error) {
      logger.error('Failed to upload Base64 image to GCS', { userId, error });
      throw new Error('Base64 image upload failed');
    }
  }

  /**
   * Download a file from GCS
   *
   * @param filePath - Path to the file in GCS
   * @returns Promise<Buffer>
   */
  public async downloadFile(filePath: string): Promise<Buffer> {
    try {
      const file = this.bucket.file(filePath);
      const [buffer] = await file.download();

      logger.info('File downloaded from GCS', { filePath });

      return buffer;
    } catch (error) {
      logger.error('Failed to download file from GCS', { filePath, error });
      throw new Error('File download failed');
    }
  }

  /**
   * Delete a file from GCS
   *
   * @param filePath - Path to the file in GCS
   * @returns Promise<void>
   */
  public async deleteFile(filePath: string): Promise<void> {
    try {
      const file = this.bucket.file(filePath);
      await file.delete();

      logger.info('File deleted from GCS', { filePath });
    } catch (error) {
      logger.error('Failed to delete file from GCS', { filePath, error });
      throw new Error('File deletion failed');
    }
  }

  /**
   * Check if a file exists in GCS
   *
   * @param filePath - Path to the file in GCS
   * @returns Promise<boolean>
   */
  public async fileExists(filePath: string): Promise<boolean> {
    try {
      const file = this.bucket.file(filePath);
      const [exists] = await file.exists();

      return exists;
    } catch (error) {
      logger.error('Failed to check file existence in GCS', { filePath, error });
      return false;
    }
  }

  /**
   * Get public URL for a file
   *
   * @param filePath - Path to the file in GCS
   * @returns string - Public URL
   */
  public getPublicUrl(filePath: string): string {
    return `${config.gcs.publicUrlBase}${filePath}`;
  }

  /**
   * List all files for a user
   *
   * @param userId - User ID
   * @param limit - Maximum number of files to return
   * @returns Promise<string[]> - Array of file paths
   */
  public async listUserFiles(userId: string, limit: number = 100): Promise<string[]> {
    try {
      const prefix = `users/${userId}/images/`;
      const [files] = await this.bucket.getFiles({
        prefix,
        maxResults: limit,
      });

      return files.map(file => file.name);
    } catch (error) {
      logger.error('Failed to list user files from GCS', { userId, error });
      throw new Error('Failed to list user files');
    }
  }
}

export default GCPStorageService;
