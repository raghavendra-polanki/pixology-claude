/**
 * User Service
 *
 * Handles all user-related business logic including user creation,
 * retrieval, updates, and authentication state management.
 *
 * @module services/UserService
 */

import { User, CreateUserDTO, UpdateUserDTO, toUserResponse, UserResponse } from '../models/User';
import GCPDatabaseService from './GCPDatabaseService';
import config from '../config/config';
import logger from '../config/logger';

/**
 * User Service Class
 *
 * Provides methods for managing user data and authentication state.
 */
class UserService {
  private static instance: UserService;
  private databaseService: GCPDatabaseService;

  /**
   * Private constructor (singleton pattern)
   */
  private constructor() {
    this.databaseService = GCPDatabaseService.getInstance();
    logger.info('✓ User Service initialized');
  }

  /**
   * Get singleton instance of UserService
   *
   * @returns UserService instance
   */
  public static getInstance(): UserService {
    if (!UserService.instance) {
      UserService.instance = new UserService();
    }
    return UserService.instance;
  }

  /**
   * Create a new user
   *
   * @param userData - User creation data
   * @returns Promise<User>
   */
  public async createUser(userData: CreateUserDTO): Promise<User> {
    try {
      logger.info('Creating new user', { email: userData.email, googleId: userData.googleId });

      // Check if user already exists
      const existingUser = await this.findByGoogleId(userData.googleId);

      if (existingUser) {
        logger.warn('User already exists, updating instead', { googleId: userData.googleId });
        return await this.updateUser(existingUser.id, {
          name: userData.name,
          profilePicture: userData.profilePicture,
          accessToken: userData.accessToken,
          refreshToken: userData.refreshToken,
          lastLoginAt: new Date(),
        });
      }

      // Generate user ID (using googleId as the primary key)
      const userId = userData.googleId;

      const newUser: User = {
        id: userId,
        googleId: userData.googleId,
        email: userData.email,
        name: userData.name,
        profilePicture: userData.profilePicture,
        accessToken: userData.accessToken,
        refreshToken: userData.refreshToken,
        createdAt: new Date(),
        lastLoginAt: new Date(),
        status: 'active',
        role: 'user',
      };

      await this.databaseService.create(
        config.firestore.usersCollection,
        userId,
        this.serializeUser(newUser)
      );

      logger.info('User created successfully', { userId, email: userData.email });

      return newUser;
    } catch (error) {
      logger.error('Failed to create user', { error });
      throw new Error('User creation failed');
    }
  }

  /**
   * Find a user by their ID
   *
   * @param userId - User ID
   * @returns Promise<User | null>
   */
  public async findById(userId: string): Promise<User | null> {
    try {
      const userData = await this.databaseService.findById(
        config.firestore.usersCollection,
        userId
      );

      if (!userData) {
        return null;
      }

      return this.deserializeUser(userData);
    } catch (error) {
      logger.error('Failed to find user by ID', { userId, error });
      throw new Error('User lookup failed');
    }
  }

  /**
   * Find a user by their Google ID
   *
   * @param googleId - Google account ID
   * @returns Promise<User | null>
   */
  public async findByGoogleId(googleId: string): Promise<User | null> {
    try {
      const userData = await this.databaseService.findOne(
        config.firestore.usersCollection,
        'googleId',
        googleId
      );

      if (!userData) {
        return null;
      }

      return this.deserializeUser(userData);
    } catch (error) {
      logger.error('Failed to find user by Google ID', { googleId, error });
      throw new Error('User lookup failed');
    }
  }

  /**
   * Find a user by email
   *
   * @param email - User email
   * @returns Promise<User | null>
   */
  public async findByEmail(email: string): Promise<User | null> {
    try {
      const userData = await this.databaseService.findOne(
        config.firestore.usersCollection,
        'email',
        email
      );

      if (!userData) {
        return null;
      }

      return this.deserializeUser(userData);
    } catch (error) {
      logger.error('Failed to find user by email', { email, error });
      throw new Error('User lookup failed');
    }
  }

  /**
   * Update user information
   *
   * @param userId - User ID
   * @param updateData - Data to update
   * @returns Promise<User>
   */
  public async updateUser(userId: string, updateData: UpdateUserDTO): Promise<User> {
    try {
      logger.info('Updating user', { userId });

      await this.databaseService.update(
        config.firestore.usersCollection,
        userId,
        updateData
      );

      const updatedUser = await this.findById(userId);

      if (!updatedUser) {
        throw new Error('User not found after update');
      }

      logger.info('User updated successfully', { userId });

      return updatedUser;
    } catch (error) {
      logger.error('Failed to update user', { userId, error });
      throw new Error('User update failed');
    }
  }

  /**
   * Update user's last login timestamp
   *
   * @param userId - User ID
   * @returns Promise<void>
   */
  public async updateLastLogin(userId: string): Promise<void> {
    try {
      await this.databaseService.update(
        config.firestore.usersCollection,
        userId,
        { lastLoginAt: new Date() }
      );

      logger.info('Updated last login timestamp', { userId });
    } catch (error) {
      logger.error('Failed to update last login', { userId, error });
    }
  }

  /**
   * Delete a user (soft delete - marks as deleted)
   *
   * @param userId - User ID
   * @returns Promise<void>
   */
  public async deleteUser(userId: string): Promise<void> {
    try {
      logger.info('Deleting user', { userId });

      await this.databaseService.update(
        config.firestore.usersCollection,
        userId,
        { status: 'deleted' }
      );

      logger.info('User deleted successfully', { userId });
    } catch (error) {
      logger.error('Failed to delete user', { userId, error });
      throw new Error('User deletion failed');
    }
  }

  /**
   * Get user response (sanitized for API)
   *
   * @param userId - User ID
   * @returns Promise<UserResponse | null>
   */
  public async getUserResponse(userId: string): Promise<UserResponse | null> {
    const user = await this.findById(userId);

    if (!user) {
      return null;
    }

    return toUserResponse(user);
  }

  /**
   * Serialize user data for database storage
   *
   * @param user - User object
   * @returns Database-safe user object
   */
  private serializeUser(user: User): any {
    return {
      ...user,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
    };
  }

  /**
   * Deserialize user data from database
   *
   * @param data - Database user data
   * @returns User object
   */
  private deserializeUser(data: any): User {
    return {
      ...data,
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
      lastLoginAt: data.lastLoginAt?.toDate ? data.lastLoginAt.toDate() : new Date(data.lastLoginAt),
    } as User;
  }
}

export default UserService;
