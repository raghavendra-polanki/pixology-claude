/**
 * Image Model
 *
 * Defines the structure and interface for generated images in the system.
 * Images are generated via Gemini API and stored in Google Cloud Storage.
 *
 * @module models/Image
 */

/**
 * Style parameters for image generation
 */
export interface StyleParams {
  /**
   * Art style (e.g., realistic, cartoon, abstract)
   */
  style?: string;

  /**
   * Color scheme or palette
   */
  colorScheme?: string;

  /**
   * Mood or atmosphere
   */
  mood?: string;

  /**
   * Additional style modifiers
   */
  modifiers?: string[];

  /**
   * Image dimensions
   */
  dimensions?: {
    width: number;
    height: number;
  };

  /**
   * Image quality
   */
  quality?: 'standard' | 'high' | 'ultra';
}

/**
 * Generated image metadata
 */
export interface Image {
  /**
   * Unique image identifier
   */
  id: string;

  /**
   * ID of the user who generated the image
   */
  userId: string;

  /**
   * Text prompt used to generate the image
   */
  prompt: string;

  /**
   * Style parameters used for generation
   */
  styleParams?: StyleParams;

  /**
   * Google Cloud Storage URL (publicly accessible)
   */
  gcsUrl: string;

  /**
   * GCS bucket name
   */
  gcsBucket: string;

  /**
   * GCS file path within bucket
   */
  gcsPath: string;

  /**
   * Image file size in bytes
   */
  fileSize: number;

  /**
   * Image MIME type
   */
  mimeType: string;

  /**
   * Image dimensions
   */
  dimensions: {
    width: number;
    height: number;
  };

  /**
   * Generation timestamp
   */
  createdAt: Date;

  /**
   * Generation status
   */
  status: 'generating' | 'completed' | 'failed';

  /**
   * Error message if generation failed
   */
  errorMessage?: string;

  /**
   * Additional metadata
   */
  metadata?: Record<string, unknown>;
}

/**
 * Data Transfer Object for creating a new image record
 */
export interface CreateImageDTO {
  userId: string;
  prompt: string;
  styleParams?: StyleParams;
  gcsUrl: string;
  gcsBucket: string;
  gcsPath: string;
  fileSize: number;
  mimeType: string;
  dimensions: {
    width: number;
    height: number;
  };
  status?: 'generating' | 'completed' | 'failed';
  metadata?: Record<string, unknown>;
}

/**
 * Data Transfer Object for updating image information
 */
export interface UpdateImageDTO {
  status?: 'generating' | 'completed' | 'failed';
  errorMessage?: string;
  gcsUrl?: string;
  fileSize?: number;
  metadata?: Record<string, unknown>;
}

/**
 * Request body for image generation API
 */
export interface GenerateImageRequest {
  /**
   * Text prompt for image generation
   */
  prompt: string;

  /**
   * Optional style parameters
   */
  styleParams?: StyleParams;
}

/**
 * Response from image generation API
 */
export interface GenerateImageResponse {
  /**
   * Success status
   */
  success: boolean;

  /**
   * Generated image metadata
   */
  image?: {
    id: string;
    gcsUrl: string;
    prompt: string;
    styleParams?: StyleParams;
    dimensions: {
      width: number;
      height: number;
    };
    createdAt: Date;
  };

  /**
   * Error message if generation failed
   */
  error?: string;
}
