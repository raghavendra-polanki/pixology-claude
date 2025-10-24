/**
 * GCP Database Service
 *
 * Abstraction layer for Google Cloud Firestore database operations.
 * Provides CRUD operations for user and image data.
 *
 * @module services/GCPDatabaseService
 */

import { Firestore, DocumentData, QuerySnapshot } from '@google-cloud/firestore';
import config from '../config/config';
import logger from '../config/logger';

/**
 * GCP Database Service Class
 *
 * Manages all database operations using Google Cloud Firestore.
 * Implements singleton pattern to ensure single database connection.
 */
class GCPDatabaseService {
  private static instance: GCPDatabaseService;
  private firestore: Firestore;

  /**
   * Private constructor (singleton pattern)
   * Initializes Firestore connection with GCP credentials
   */
  private constructor() {
    try {
      this.firestore = new Firestore({
        projectId: config.gcp.projectId,
        keyFilename: config.gcp.credentialsPath,
      });

      logger.info('✓ Firestore database connection established', {
        projectId: config.gcp.projectId,
      });
    } catch (error) {
      logger.error('Failed to initialize Firestore', { error });
      throw new Error('Database initialization failed');
    }
  }

  /**
   * Get singleton instance of GCPDatabaseService
   *
   * @returns GCPDatabaseService instance
   */
  public static getInstance(): GCPDatabaseService {
    if (!GCPDatabaseService.instance) {
      GCPDatabaseService.instance = new GCPDatabaseService();
    }
    return GCPDatabaseService.instance;
  }

  /**
   * Get Firestore instance for direct access if needed
   *
   * @returns Firestore instance
   */
  public getFirestore(): Firestore {
    return this.firestore;
  }

  /**
   * Create a new document in a collection
   *
   * @param collectionName - Name of the collection
   * @param id - Document ID
   * @param data - Document data
   * @returns Promise<void>
   */
  public async create(
    collectionName: string,
    id: string,
    data: DocumentData
  ): Promise<void> {
    try {
      await this.firestore.collection(collectionName).doc(id).set({
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      logger.info(`Document created in ${collectionName}`, { id });
    } catch (error) {
      logger.error(`Failed to create document in ${collectionName}`, { id, error });
      throw error;
    }
  }

  /**
   * Find a document by ID
   *
   * @param collectionName - Name of the collection
   * @param id - Document ID
   * @returns Promise<DocumentData | null>
   */
  public async findById(
    collectionName: string,
    id: string
  ): Promise<DocumentData | null> {
    try {
      const doc = await this.firestore.collection(collectionName).doc(id).get();

      if (!doc.exists) {
        return null;
      }

      return { id: doc.id, ...doc.data() };
    } catch (error) {
      logger.error(`Failed to find document in ${collectionName}`, { id, error });
      throw error;
    }
  }

  /**
   * Find a single document by field value
   *
   * @param collectionName - Name of the collection
   * @param field - Field name to query
   * @param value - Field value to match
   * @returns Promise<DocumentData | null>
   */
  public async findOne(
    collectionName: string,
    field: string,
    value: unknown
  ): Promise<DocumentData | null> {
    try {
      const snapshot = await this.firestore
        .collection(collectionName)
        .where(field, '==', value)
        .limit(1)
        .get();

      if (snapshot.empty) {
        return null;
      }

      const doc = snapshot.docs[0];
      return { id: doc.id, ...doc.data() };
    } catch (error) {
      logger.error(`Failed to find document in ${collectionName}`, { field, value, error });
      throw error;
    }
  }

  /**
   * Find multiple documents by field value
   *
   * @param collectionName - Name of the collection
   * @param field - Field name to query
   * @param value - Field value to match
   * @param limit - Maximum number of results
   * @returns Promise<DocumentData[]>
   */
  public async findMany(
    collectionName: string,
    field: string,
    value: unknown,
    limit: number = 100
  ): Promise<DocumentData[]> {
    try {
      let query = this.firestore
        .collection(collectionName)
        .where(field, '==', value);

      if (limit) {
        query = query.limit(limit);
      }

      const snapshot = await query.get();

      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      logger.error(`Failed to find documents in ${collectionName}`, { field, value, error });
      throw error;
    }
  }

  /**
   * Update a document by ID
   *
   * @param collectionName - Name of the collection
   * @param id - Document ID
   * @param data - Data to update
   * @returns Promise<void>
   */
  public async update(
    collectionName: string,
    id: string,
    data: DocumentData
  ): Promise<void> {
    try {
      await this.firestore.collection(collectionName).doc(id).update({
        ...data,
        updatedAt: new Date(),
      });

      logger.info(`Document updated in ${collectionName}`, { id });
    } catch (error) {
      logger.error(`Failed to update document in ${collectionName}`, { id, error });
      throw error;
    }
  }

  /**
   * Delete a document by ID
   *
   * @param collectionName - Name of the collection
   * @param id - Document ID
   * @returns Promise<void>
   */
  public async delete(collectionName: string, id: string): Promise<void> {
    try {
      await this.firestore.collection(collectionName).doc(id).delete();

      logger.info(`Document deleted from ${collectionName}`, { id });
    } catch (error) {
      logger.error(`Failed to delete document from ${collectionName}`, { id, error });
      throw error;
    }
  }

  /**
   * Get all documents from a collection
   *
   * @param collectionName - Name of the collection
   * @param limit - Maximum number of results
   * @returns Promise<DocumentData[]>
   */
  public async getAll(
    collectionName: string,
    limit: number = 100
  ): Promise<DocumentData[]> {
    try {
      let query = this.firestore.collection(collectionName);

      if (limit) {
        query = query.limit(limit) as any;
      }

      const snapshot = await query.get();

      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      logger.error(`Failed to get all documents from ${collectionName}`, { error });
      throw error;
    }
  }

  /**
   * Count documents matching a query
   *
   * @param collectionName - Name of the collection
   * @param field - Field name to query
   * @param value - Field value to match
   * @returns Promise<number>
   */
  public async count(
    collectionName: string,
    field?: string,
    value?: unknown
  ): Promise<number> {
    try {
      let query: any = this.firestore.collection(collectionName);

      if (field && value !== undefined) {
        query = query.where(field, '==', value);
      }

      const snapshot = await query.get();
      return snapshot.size;
    } catch (error) {
      logger.error(`Failed to count documents in ${collectionName}`, { error });
      throw error;
    }
  }
}

export default GCPDatabaseService;
