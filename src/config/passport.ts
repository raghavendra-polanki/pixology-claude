/**
 * Passport Configuration
 *
 * Configures Passport.js for Google OAuth 2.0 authentication.
 * Handles user authentication and session serialization.
 *
 * @module config/passport
 */

import passport from 'passport';
import { Strategy as GoogleStrategy, Profile, VerifyCallback } from 'passport-google-oauth20';
import config from './config';
import logger from './logger';
import UserService from '../services/UserService';
import { User } from '../models/User';

/**
 * Configure Google OAuth strategy
 */
passport.use(
  new GoogleStrategy(
    {
      clientID: config.google.clientId,
      clientSecret: config.google.clientSecret,
      callbackURL: config.google.callbackUrl,
      scope: ['profile', 'email'],
    },
    async (
      accessToken: string,
      refreshToken: string,
      profile: Profile,
      done: VerifyCallback
    ) => {
      try {
        logger.info('Google OAuth callback received', {
          googleId: profile.id,
          email: profile.emails?.[0]?.value,
        });

        const userService = UserService.getInstance();

        // Extract user information from Google profile
        const email = profile.emails?.[0]?.value || '';
        const name = profile.displayName || '';
        const profilePicture = profile.photos?.[0]?.value;

        // Find or create user
        let user = await userService.findByGoogleId(profile.id);

        if (!user) {
          // Create new user
          logger.info('Creating new user from Google profile', { email, googleId: profile.id });

          user = await userService.createUser({
            googleId: profile.id,
            email,
            name,
            profilePicture,
            accessToken,
            refreshToken,
          });
        } else {
          // Update existing user
          logger.info('Updating existing user from Google profile', {
            userId: user.id,
            email,
          });

          user = await userService.updateUser(user.id, {
            name,
            profilePicture,
            accessToken,
            refreshToken,
            lastLoginAt: new Date(),
          });
        }

        logger.info('User authenticated successfully', { userId: user.id, email });

        // Pass user to Passport
        done(null, {
          id: user.id,
          googleId: user.googleId,
          email: user.email,
          name: user.name,
          profilePicture: user.profilePicture,
          role: user.role,
        });
      } catch (error) {
        logger.error('Google OAuth authentication error', { error });
        done(error as Error, undefined);
      }
    }
  )
);

/**
 * Serialize user for session storage
 *
 * Stores only the user ID in the session to keep it lightweight.
 */
passport.serializeUser((user: any, done) => {
  logger.debug('Serializing user', { userId: user.id });
  done(null, user.id);
});

/**
 * Deserialize user from session
 *
 * Retrieves full user data from database using stored user ID.
 */
passport.deserializeUser(async (id: string, done) => {
  try {
    logger.debug('Deserializing user', { userId: id });

    const userService = UserService.getInstance();
    const user = await userService.findById(id);

    if (!user) {
      logger.warn('User not found during deserialization', { userId: id });
      return done(null, false);
    }

    // Return sanitized user data for req.user
    done(null, {
      id: user.id,
      googleId: user.googleId,
      email: user.email,
      name: user.name,
      profilePicture: user.profilePicture,
      role: user.role,
    });
  } catch (error) {
    logger.error('User deserialization error', { userId: id, error });
    done(error, false);
  }
});

logger.info('✓ Passport configuration initialized');

export default passport;
