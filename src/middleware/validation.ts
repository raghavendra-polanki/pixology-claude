/**
 * Validation Middleware
 *
 * Request validation middleware using express-validator.
 * Validates and sanitizes incoming request data.
 *
 * @module middleware/validation
 */

import { body, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';
import logger from '../config/logger';

/**
 * Validation rules for image generation request
 */
export const validateImageGeneration = [
  body('prompt')
    .trim()
    .notEmpty()
    .withMessage('Prompt is required')
    .isLength({ min: 3, max: 1000 })
    .withMessage('Prompt must be between 3 and 1000 characters'),

  body('styleParams')
    .optional()
    .isObject()
    .withMessage('Style parameters must be an object'),

  body('styleParams.style')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Style must be less than 100 characters'),

  body('styleParams.colorScheme')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Color scheme must be less than 100 characters'),

  body('styleParams.mood')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Mood must be less than 100 characters'),

  body('styleParams.modifiers')
    .optional()
    .isArray()
    .withMessage('Modifiers must be an array'),

  body('styleParams.dimensions')
    .optional()
    .isObject()
    .withMessage('Dimensions must be an object'),

  body('styleParams.dimensions.width')
    .optional()
    .isInt({ min: 256, max: 2048 })
    .withMessage('Width must be between 256 and 2048'),

  body('styleParams.dimensions.height')
    .optional()
    .isInt({ min: 256, max: 2048 })
    .withMessage('Height must be between 256 and 2048'),

  body('styleParams.quality')
    .optional()
    .isIn(['standard', 'high', 'ultra'])
    .withMessage('Quality must be standard, high, or ultra'),
];

/**
 * Middleware to handle validation errors
 *
 * Checks validation results and returns 400 if validation fails.
 *
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export const handleValidationErrors = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    logger.warn('Validation failed', {
      path: req.path,
      errors: errors.array(),
    });

    res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array().map(err => ({
        field: (err as any).path,
        message: err.msg,
      })),
    });
    return;
  }

  next();
};
