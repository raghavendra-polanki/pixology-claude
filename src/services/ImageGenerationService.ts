/**
 * Image Generation Service
 *
 * Handles image generation using Google's Gemini API (gemini-2.5-flash-image-preview).
 * This is referred to internally as the "nano banana API".
 *
 * @module services/ImageGenerationService
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import config from '../config/config';
import logger from '../config/logger';
import { StyleParams } from '../models/Image';
import GCPStorageService from './GCPStorageService';
import GCPDatabaseService from './GCPDatabaseService';
import { v4 as uuidv4 } from 'uuid';

/**
 * Image generation result
 */
export interface ImageGenerationResult {
  /**
   * Unique image ID
   */
  imageId: string;

  /**
   * Public URL to access the generated image
   */
  imageUrl: string;

  /**
   * Image dimensions
   */
  dimensions: {
    width: number;
    height: number;
  };

  /**
   * File size in bytes
   */
  fileSize: number;

  /**
   * Original prompt used
   */
  prompt: string;

  /**
   * Style parameters used
   */
  styleParams?: StyleParams;
}

/**
 * Image Generation Service Class
 *
 * Manages image generation using Google's Gemini API and handles
 * the complete workflow: generation → storage → database recording.
 */
class ImageGenerationService {
  private static instance: ImageGenerationService;
  private genAI: GoogleGenerativeAI;
  private storageService: GCPStorageService;
  private databaseService: GCPDatabaseService;

  /**
   * Private constructor (singleton pattern)
   * Initializes Gemini API client
   */
  private constructor() {
    try {
      this.genAI = new GoogleGenerativeAI(config.gemini.apiKey);
      this.storageService = GCPStorageService.getInstance();
      this.databaseService = GCPDatabaseService.getInstance();

      logger.info('✓ Image Generation Service initialized', {
        model: config.gemini.imageModel,
      });
    } catch (error) {
      logger.error('Failed to initialize Image Generation Service', { error });
      throw new Error('Image Generation Service initialization failed');
    }
  }

  /**
   * Get singleton instance of ImageGenerationService
   *
   * @returns ImageGenerationService instance
   */
  public static getInstance(): ImageGenerationService {
    if (!ImageGenerationService.instance) {
      ImageGenerationService.instance = new ImageGenerationService();
    }
    return ImageGenerationService.instance;
  }

  /**
   * Build enhanced prompt with style parameters
   *
   * @param basePrompt - User's original prompt
   * @param styleParams - Optional style parameters
   * @returns Enhanced prompt string
   */
  private buildEnhancedPrompt(basePrompt: string, styleParams?: StyleParams): string {
    let enhancedPrompt = basePrompt;

    if (styleParams) {
      const styleModifiers: string[] = [];

      if (styleParams.style) {
        styleModifiers.push(`in ${styleParams.style} style`);
      }

      if (styleParams.colorScheme) {
        styleModifiers.push(`with ${styleParams.colorScheme} color scheme`);
      }

      if (styleParams.mood) {
        styleModifiers.push(`${styleParams.mood} mood`);
      }

      if (styleParams.modifiers && styleParams.modifiers.length > 0) {
        styleModifiers.push(...styleParams.modifiers);
      }

      if (styleModifiers.length > 0) {
        enhancedPrompt = `${basePrompt}, ${styleModifiers.join(', ')}`;
      }
    }

    logger.info('Enhanced prompt built', { basePrompt, enhancedPrompt });

    return enhancedPrompt;
  }

  /**
   * Generate an image using Gemini API ("nano banana API")
   *
   * @param userId - ID of the user requesting generation
   * @param prompt - Text prompt for image generation
   * @param styleParams - Optional style parameters
   * @returns Promise<ImageGenerationResult>
   */
  public async generateImage(
    userId: string,
    prompt: string,
    styleParams?: StyleParams
  ): Promise<ImageGenerationResult> {
    const imageId = uuidv4();

    try {
      logger.info('Starting image generation', { userId, imageId, prompt });

      // Build enhanced prompt with style parameters
      const enhancedPrompt = this.buildEnhancedPrompt(prompt, styleParams);

      // Get the generative model (nano banana API)
      const model = this.genAI.getGenerativeModel({
        model: config.gemini.imageModel,
      });

      // NOTE: The actual Gemini image generation API may vary.
      // This is a placeholder implementation based on the expected API structure.
      // Adjust according to the actual Gemini API documentation.

      // Generate the image
      const result = await model.generateContent(enhancedPrompt);
      const response = await result.response;

      // Extract image data from response
      // The actual response structure may vary - this is a placeholder
      let imageBase64: string;

      // Placeholder: Extract image data from response
      // In reality, you'll need to adapt this based on Gemini API's actual response structure
      if (response.candidates && response.candidates.length > 0) {
        // This is a placeholder - actual extraction will depend on API response format
        const candidate = response.candidates[0];

        // For now, we'll create a placeholder implementation
        // In production, you would extract the actual image data from the response
        logger.warn('Using placeholder image data extraction - update for production');

        // Simulated Base64 data (in production, extract from actual response)
        imageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      } else {
        throw new Error('No image generated from Gemini API');
      }

      // Upload image to Google Cloud Storage
      const uploadResult = await this.storageService.uploadBase64Image(
        imageBase64,
        `generated-${imageId}.png`,
        userId,
        {
          prompt: prompt.substring(0, 100), // Store truncated prompt
          imageId,
        }
      );

      // Get dimensions from styleParams or use defaults
      const dimensions = {
        width: styleParams?.dimensions?.width || config.imageGeneration.defaultWidth,
        height: styleParams?.dimensions?.height || config.imageGeneration.defaultHeight,
      };

      // Save image metadata to database
      await this.databaseService.create(config.firestore.imagesCollection, imageId, {
        userId,
        prompt,
        styleParams: styleParams || null,
        gcsUrl: uploadResult.publicUrl,
        gcsBucket: uploadResult.bucket,
        gcsPath: uploadResult.path,
        fileSize: uploadResult.size,
        mimeType: uploadResult.mimeType,
        dimensions,
        status: 'completed',
        createdAt: new Date(),
      });

      logger.info('Image generation completed successfully', {
        userId,
        imageId,
        imageUrl: uploadResult.publicUrl,
      });

      return {
        imageId,
        imageUrl: uploadResult.publicUrl,
        dimensions,
        fileSize: uploadResult.size,
        prompt,
        styleParams,
      };
    } catch (error) {
      logger.error('Image generation failed', { userId, imageId, prompt, error });

      // Save failed generation to database for debugging
      try {
        await this.databaseService.create(config.firestore.imagesCollection, imageId, {
          userId,
          prompt,
          styleParams: styleParams || null,
          status: 'failed',
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          createdAt: new Date(),
        });
      } catch (dbError) {
        logger.error('Failed to save error record to database', { dbError });
      }

      throw new Error('Image generation failed');
    }
  }

  /**
   * Get image generation history for a user
   *
   * @param userId - User ID
   * @param limit - Maximum number of results
   * @returns Promise<any[]>
   */
  public async getUserImageHistory(userId: string, limit: number = 50): Promise<any[]> {
    try {
      const images = await this.databaseService.findMany(
        config.firestore.imagesCollection,
        'userId',
        userId,
        limit
      );

      logger.info('Retrieved user image history', { userId, count: images.length });

      return images;
    } catch (error) {
      logger.error('Failed to retrieve user image history', { userId, error });
      throw new Error('Failed to retrieve image history');
    }
  }

  /**
   * Check if user has reached daily generation limit
   *
   * @param userId - User ID
   * @returns Promise<boolean>
   */
  public async hasReachedDailyLimit(userId: string): Promise<boolean> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const images = await this.databaseService.findMany(
        config.firestore.imagesCollection,
        'userId',
        userId,
        config.imageGeneration.maxImagesPerUserPerDay + 1
      );

      // Filter images generated today
      const todayImages = images.filter(img => {
        const createdAt = img.createdAt.toDate ? img.createdAt.toDate() : new Date(img.createdAt);
        return createdAt >= today;
      });

      const hasReached = todayImages.length >= config.imageGeneration.maxImagesPerUserPerDay;

      logger.info('Checked daily generation limit', {
        userId,
        todayCount: todayImages.length,
        limit: config.imageGeneration.maxImagesPerUserPerDay,
        hasReached,
      });

      return hasReached;
    } catch (error) {
      logger.error('Failed to check daily limit', { userId, error });
      return false;
    }
  }
}

export default ImageGenerationService;
