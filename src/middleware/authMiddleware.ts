/**
 * Authentication Middleware
 *
 * Middleware functions for protecting routes and verifying user authentication.
 * Integrates with Passport.js and Express sessions.
 *
 * @module middleware/authMiddleware
 */

import { Request, Response, NextFunction } from 'express';
import logger from '../config/logger';

/**
 * Middleware to check if user is authenticated
 *
 * Verifies that the user has a valid session with authentication data.
 * If authenticated, allows the request to proceed; otherwise, returns 401.
 *
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export const isAuthenticated = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (req.isAuthenticated && req.isAuthenticated()) {
    logger.info('User authenticated', {
      userId: req.user?.id,
      path: req.path,
    });
    return next();
  }

  logger.warn('Unauthorized access attempt', {
    path: req.path,
    ip: req.ip,
  });

  res.status(401).json({
    success: false,
    error: 'Unauthorized. Please log in.',
  });
};

/**
 * Middleware to check if user is authenticated (optional)
 *
 * Similar to isAuthenticated but allows the request to proceed even if
 * the user is not authenticated. Useful for routes that have different
 * behavior for authenticated vs. anonymous users.
 *
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export const optionalAuth = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (req.isAuthenticated && req.isAuthenticated()) {
    logger.info('User authenticated (optional)', {
      userId: req.user?.id,
      path: req.path,
    });
  } else {
    logger.info('Anonymous access', {
      path: req.path,
      ip: req.ip,
    });
  }

  next();
};

/**
 * Middleware to check if user has admin role
 *
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export const isAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    logger.warn('Unauthorized admin access attempt', {
      path: req.path,
      ip: req.ip,
    });

    return res.status(401).json({
      success: false,
      error: 'Unauthorized. Please log in.',
    }) as any;
  }

  if (req.user?.role !== 'admin') {
    logger.warn('Forbidden admin access attempt', {
      userId: req.user?.id,
      role: req.user?.role,
      path: req.path,
    });

    return res.status(403).json({
      success: false,
      error: 'Forbidden. Admin access required.',
    }) as any;
  }

  logger.info('Admin authenticated', {
    userId: req.user?.id,
    path: req.path,
  });

  next();
};

/**
 * Middleware to attach user ID to request
 *
 * Ensures that req.user.id is available for authenticated requests.
 *
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export const attachUserId = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (req.isAuthenticated && req.isAuthenticated() && req.user) {
    // User ID is already attached by Passport
    logger.debug('User ID attached', { userId: req.user.id });
  }

  next();
};

/**
 * Error handler for authentication errors
 *
 * @param err - Error object
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export const authErrorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  logger.error('Authentication error', {
    error: err.message,
    stack: err.stack,
    path: req.path,
  });

  res.status(500).json({
    success: false,
    error: 'Authentication error occurred',
  });
};
