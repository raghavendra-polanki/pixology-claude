/**
 * Image Generation Controller
 *
 * Handles image generation requests and image history retrieval.
 * Integrates with ImageGenerationService for the core generation logic.
 *
 * @module controllers/imageController
 */

import { Request, Response } from 'express';
import logger from '../config/logger';
import ImageGenerationService from '../services/ImageGenerationService';
import { GenerateImageRequest } from '../models/Image';

/**
 * Generate a new image
 *
 * Accepts a prompt and optional style parameters, generates an image
 * using the Gemini API, uploads to GCS, and returns the public URL.
 *
 * @route POST /api/v1/generate/image
 * @access Private
 */
export const generateImage = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
      return;
    }

    const { prompt, styleParams }: GenerateImageRequest = req.body;

    logger.info('Image generation request received', {
      userId,
      prompt: prompt.substring(0, 50),
      hasStyleParams: !!styleParams,
    });

    // Validate prompt
    if (!prompt || prompt.trim().length === 0) {
      res.status(400).json({
        success: false,
        error: 'Prompt is required',
      });
      return;
    }

    const imageGenerationService = ImageGenerationService.getInstance();

    // Check daily limit
    const hasReachedLimit = await imageGenerationService.hasReachedDailyLimit(userId);

    if (hasReachedLimit) {
      logger.warn('User reached daily generation limit', { userId });
      res.status(429).json({
        success: false,
        error: 'Daily image generation limit reached. Please try again tomorrow.',
      });
      return;
    }

    // Generate the image
    const result = await imageGenerationService.generateImage(
      userId,
      prompt,
      styleParams
    );

    logger.info('Image generated successfully', {
      userId,
      imageId: result.imageId,
      imageUrl: result.imageUrl,
    });

    res.status(201).json({
      success: true,
      image: {
        id: result.imageId,
        gcsUrl: result.imageUrl,
        prompt: result.prompt,
        styleParams: result.styleParams,
        dimensions: result.dimensions,
        createdAt: new Date(),
      },
    });
  } catch (error) {
    logger.error('Image generation failed', { error });

    res.status(500).json({
      success: false,
      error: 'Image generation failed. Please try again.',
    });
  }
};

/**
 * Get user's image generation history
 *
 * Returns a list of previously generated images for the authenticated user.
 *
 * @route GET /api/v1/images/history
 * @access Private
 */
export const getImageHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
      return;
    }

    const limit = parseInt(req.query.limit as string) || 50;

    const imageGenerationService = ImageGenerationService.getInstance();
    const images = await imageGenerationService.getUserImageHistory(userId, limit);

    logger.info('Image history retrieved', { userId, count: images.length });

    res.json({
      success: true,
      images,
      count: images.length,
    });
  } catch (error) {
    logger.error('Failed to retrieve image history', { error });

    res.status(500).json({
      success: false,
      error: 'Failed to retrieve image history',
    });
  }
};

/**
 * Get image by ID
 *
 * Returns metadata for a specific image.
 *
 * @route GET /api/v1/images/:imageId
 * @access Private
 */
export const getImageById = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { imageId } = req.params;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
      return;
    }

    const imageGenerationService = ImageGenerationService.getInstance();
    const databaseService = (imageGenerationService as any).databaseService;

    const image = await databaseService.findById('images', imageId);

    if (!image) {
      res.status(404).json({
        success: false,
        error: 'Image not found',
      });
      return;
    }

    // Check if user owns this image
    if (image.userId !== userId) {
      res.status(403).json({
        success: false,
        error: 'Forbidden. You do not have access to this image.',
      });
      return;
    }

    logger.info('Image retrieved', { userId, imageId });

    res.json({
      success: true,
      image,
    });
  } catch (error) {
    logger.error('Failed to retrieve image', { error });

    res.status(500).json({
      success: false,
      error: 'Failed to retrieve image',
    });
  }
};

/**
 * Health check endpoint
 *
 * @route GET /api/v1/health
 * @access Public
 */
export const healthCheck = (req: Request, res: Response): void => {
  res.json({
    success: true,
    message: 'Pixology API is running',
    timestamp: new Date().toISOString(),
  });
};
