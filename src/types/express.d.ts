/**
 * Express Type Extensions
 *
 * Extends Express types to include custom properties like user session data.
 *
 * @module types/express
 */

import { User } from '../models/User';

/**
 * Extend Express Request interface to include user data
 */
declare global {
  namespace Express {
    /**
     * User property added by Passport authentication
     */
    interface User {
      id: string;
      googleId: string;
      email: string;
      name: string;
      profilePicture?: string;
      role: string;
    }
  }
}

/**
 * Extend express-session to include custom session data
 */
declare module 'express-session' {
  interface SessionData {
    userId?: string;
    returnTo?: string;
  }
}
