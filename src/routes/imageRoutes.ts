/**
 * Image Generation Routes
 *
 * Defines all image-related routes including generation,
 * history retrieval, and individual image access.
 *
 * @module routes/imageRoutes
 */

import { Router } from 'express';
import {
  generateImage,
  getImageHistory,
  getImageById,
  healthCheck,
} from '../controllers/imageController';
import { isAuthenticated } from '../middleware/authMiddleware';
import { validateImageGeneration, handleValidationErrors } from '../middleware/validation';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

/**
 * @route   GET /api/v1/health
 * @desc    Health check endpoint
 * @access  Public
 */
router.get('/health', healthCheck);

/**
 * @route   POST /api/v1/generate/image
 * @desc    Generate a new image using Gemini API
 * @access  Private (requires authentication)
 */
router.post(
  '/generate/image',
  isAuthenticated,
  validateImageGeneration,
  handleValidationErrors,
  asyncHandler(generateImage)
);

/**
 * @route   GET /api/v1/images/history
 * @desc    Get user's image generation history
 * @access  Private (requires authentication)
 */
router.get('/images/history', isAuthenticated, asyncHandler(getImageHistory));

/**
 * @route   GET /api/v1/images/:imageId
 * @desc    Get specific image by ID
 * @access  Private (requires authentication)
 */
router.get('/images/:imageId', isAuthenticated, asyncHandler(getImageById));

export default router;
