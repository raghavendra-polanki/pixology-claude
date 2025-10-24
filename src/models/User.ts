/**
 * User Model
 *
 * Defines the structure and interface for User entities in the system.
 * Users are authenticated via Google OAuth and stored in Firestore.
 *
 * @module models/User
 */

/**
 * User interface representing a user in the system
 */
export interface User {
  /**
   * Unique user identifier (Google ID or auto-generated)
   */
  id: string;

  /**
   * Google account identifier
   */
  googleId: string;

  /**
   * User's email address
   */
  email: string;

  /**
   * User's display name
   */
  name: string;

  /**
   * URL to user's profile picture
   */
  profilePicture?: string;

  /**
   * Google OAuth access token (encrypted in database)
   */
  accessToken?: string;

  /**
   * Google OAuth refresh token (encrypted in database)
   */
  refreshToken?: string;

  /**
   * User account creation timestamp
   */
  createdAt: Date;

  /**
   * Last login timestamp
   */
  lastLoginAt: Date;

  /**
   * User account status
   */
  status: 'active' | 'suspended' | 'deleted';

  /**
   * User role
   */
  role: 'user' | 'admin';

  /**
   * Additional metadata
   */
  metadata?: Record<string, unknown>;
}

/**
 * Data Transfer Object for creating a new user
 */
export interface CreateUserDTO {
  googleId: string;
  email: string;
  name: string;
  profilePicture?: string;
  accessToken?: string;
  refreshToken?: string;
}

/**
 * Data Transfer Object for updating user information
 */
export interface UpdateUserDTO {
  name?: string;
  profilePicture?: string;
  accessToken?: string;
  refreshToken?: string;
  lastLoginAt?: Date;
  status?: 'active' | 'suspended' | 'deleted';
  metadata?: Record<string, unknown>;
}

/**
 * Serialized user data for API responses (excludes sensitive fields)
 */
export interface UserResponse {
  id: string;
  email: string;
  name: string;
  profilePicture?: string;
  createdAt: Date;
  lastLoginAt: Date;
  status: string;
  role: string;
}

/**
 * Convert User to UserResponse (remove sensitive data)
 *
 * @param user - Full user object
 * @returns Sanitized user object for API response
 */
export const toUserResponse = (user: User): UserResponse => {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    profilePicture: user.profilePicture,
    createdAt: user.createdAt,
    lastLoginAt: user.lastLoginAt,
    status: user.status,
    role: user.role,
  };
};
