/**
 * Authentication Routes
 *
 * Defines all authentication-related routes including
 * Google OAuth login, callback, logout, and user profile endpoints.
 *
 * @module routes/authRoutes
 */

import { Router } from 'express';
import {
  googleLogin,
  googleCallback,
  logout,
  getCurrentUser,
  checkAuthStatus,
} from '../controllers/authController';
import { isAuthenticated } from '../middleware/authMiddleware';

const router = Router();

/**
 * @route   GET /auth/google
 * @desc    Initiate Google OAuth login
 * @access  Public
 */
router.get('/google', googleLogin);

/**
 * @route   GET /auth/google/callback
 * @desc    Google OAuth callback URL
 * @access  Public
 */
router.get('/google/callback', googleCallback);

/**
 * @route   POST /auth/logout
 * @desc    Logout current user
 * @access  Private
 */
router.post('/logout', isAuthenticated, logout);

/**
 * @route   GET /auth/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/me', isAuthenticated, getCurrentUser);

/**
 * @route   GET /auth/status
 * @desc    Check authentication status
 * @access  Public
 */
router.get('/status', checkAuthStatus);

export default router;
