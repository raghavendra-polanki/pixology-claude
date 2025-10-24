/**
 * Authentication Controller
 *
 * Handles authentication-related HTTP requests including
 * Google OAuth login, logout, and session management.
 *
 * @module controllers/authController
 */

import { Request, Response, NextFunction } from 'express';
import passport from 'passport';
import config from '../config/config';
import logger from '../config/logger';
import UserService from '../services/UserService';

/**
 * Initiate Google OAuth login
 *
 * Redirects user to Google's OAuth consent screen.
 *
 * @route GET /auth/google
 */
export const googleLogin = passport.authenticate('google', {
  scope: ['profile', 'email'],
  prompt: 'select_account', // Always show account selection
});

/**
 * Google OAuth callback handler
 *
 * Handles the callback from Google after user authentication.
 * On success, redirects to client with session established.
 * On failure, redirects to client with error.
 *
 * @route GET /auth/google/callback
 */
export const googleCallback = (req: Request, res: Response, next: NextFunction) => {
  passport.authenticate('google', (err: Error, user: Express.User, info: any) => {
    if (err) {
      logger.error('Google OAuth callback error', { error: err });
      return res.redirect(`${config.clientUrl}/login?error=auth_failed`);
    }

    if (!user) {
      logger.warn('Google OAuth callback - no user', { info });
      return res.redirect(`${config.clientUrl}/login?error=no_user`);
    }

    // Establish session
    req.logIn(user, (loginErr) => {
      if (loginErr) {
        logger.error('Session login error', { error: loginErr });
        return res.redirect(`${config.clientUrl}/login?error=session_failed`);
      }

      logger.info('User logged in successfully', { userId: user.id });

      // Redirect to client app (could include a success token or redirect to dashboard)
      const returnTo = req.session.returnTo || '/';
      delete req.session.returnTo;

      return res.redirect(`${config.clientUrl}${returnTo}`);
    });
  })(req, res, next);
};

/**
 * Logout handler
 *
 * Destroys the user's session and logs them out.
 *
 * @route POST /auth/logout
 */
export const logout = (req: Request, res: Response): void => {
  const userId = req.user?.id;

  req.logout((err) => {
    if (err) {
      logger.error('Logout error', { userId, error: err });
      res.status(500).json({
        success: false,
        error: 'Logout failed',
      });
      return;
    }

    req.session.destroy((destroyErr) => {
      if (destroyErr) {
        logger.error('Session destruction error', { userId, error: destroyErr });
      }

      logger.info('User logged out successfully', { userId });

      res.json({
        success: true,
        message: 'Logged out successfully',
      });
    });
  });
};

/**
 * Get current user information
 *
 * Returns the currently authenticated user's profile data.
 *
 * @route GET /auth/me
 */
export const getCurrentUser = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Not authenticated',
      });
      return;
    }

    const userService = UserService.getInstance();
    const userResponse = await userService.getUserResponse(req.user.id);

    if (!userResponse) {
      res.status(404).json({
        success: false,
        error: 'User not found',
      });
      return;
    }

    res.json({
      success: true,
      user: userResponse,
    });
  } catch (error) {
    logger.error('Get current user error', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve user information',
    });
  }
};

/**
 * Check authentication status
 *
 * Simple endpoint to check if user is authenticated.
 *
 * @route GET /auth/status
 */
export const checkAuthStatus = (req: Request, res: Response): void => {
  res.json({
    success: true,
    authenticated: req.isAuthenticated ? req.isAuthenticated() : false,
    user: req.user || null,
  });
};
