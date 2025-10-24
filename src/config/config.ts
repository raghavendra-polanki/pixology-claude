/**
 * Configuration Service
 *
 * Centralized configuration management for the Pixology.ai backend.
 * Loads environment variables and provides type-safe access to configuration values.
 *
 * @module config/config
 */

import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config();

/**
 * Configuration interface defining all application settings
 */
interface Config {
  // Server Configuration
  env: string;
  port: number;
  host: string;
  apiBaseUrl: string;
  clientUrl: string;

  // Google OAuth Configuration
  google: {
    clientId: string;
    clientSecret: string;
    callbackUrl: string;
  };

  // Session Configuration
  session: {
    secret: string;
    maxAge: number;
    cookie: {
      secure: boolean;
      httpOnly: boolean;
      sameSite: 'strict' | 'lax' | 'none';
    };
  };

  // Google Cloud Platform Configuration
  gcp: {
    projectId: string;
    credentialsPath: string;
  };

  // Firestore Configuration
  firestore: {
    usersCollection: string;
    imagesCollection: string;
  };

  // Google Cloud Storage Configuration
  gcs: {
    bucketName: string;
    bucketLocation: string;
    publicUrlBase: string;
  };

  // Gemini API Configuration
  gemini: {
    apiKey: string;
    imageModel: string;
    apiTimeout: number;
  };

  // Rate Limiting Configuration
  rateLimit: {
    maxRequests: number;
    windowMinutes: number;
  };

  // Logging Configuration
  logging: {
    level: string;
    dir: string;
  };

  // CORS Configuration
  cors: {
    allowedOrigins: string[];
  };

  // Image Generation Settings
  imageGeneration: {
    maxImagesPerUserPerDay: number;
    defaultWidth: number;
    defaultHeight: number;
    defaultQuality: string;
  };
}

/**
 * Get an environment variable value or throw an error if not found
 *
 * @param key - Environment variable key
 * @param defaultValue - Optional default value
 * @returns Environment variable value
 * @throws Error if the variable is not set and no default is provided
 */
const getEnvVar = (key: string, defaultValue?: string): string => {
  const value = process.env[key] || defaultValue;

  if (value === undefined) {
    throw new Error(`Environment variable ${key} is not set`);
  }

  return value;
};

/**
 * Get an environment variable as a number
 *
 * @param key - Environment variable key
 * @param defaultValue - Default value if not set
 * @returns Numeric value
 */
const getEnvNumber = (key: string, defaultValue: number): number => {
  const value = process.env[key];
  return value ? parseInt(value, 10) : defaultValue;
};

/**
 * Get an environment variable as a boolean
 *
 * @param key - Environment variable key
 * @param defaultValue - Default value if not set
 * @returns Boolean value
 */
const getEnvBoolean = (key: string, defaultValue: boolean): boolean => {
  const value = process.env[key];
  if (value === undefined) return defaultValue;
  return value.toLowerCase() === 'true';
};

/**
 * Application configuration object
 *
 * All configuration values are loaded from environment variables.
 * See .env.example for a complete list of required variables.
 */
const config: Config = {
  // Server Configuration
  env: getEnvVar('NODE_ENV', 'development'),
  port: getEnvNumber('PORT', 3001),
  host: getEnvVar('HOST', 'localhost'),
  apiBaseUrl: getEnvVar('API_BASE_URL', 'http://localhost:3001'),
  clientUrl: getEnvVar('CLIENT_URL', 'http://localhost:3000'),

  // Google OAuth Configuration
  google: {
    clientId: getEnvVar('GOOGLE_CLIENT_ID'),
    clientSecret: getEnvVar('GOOGLE_CLIENT_SECRET'),
    callbackUrl: getEnvVar('GOOGLE_CALLBACK_URL'),
  },

  // Session Configuration
  session: {
    secret: getEnvVar('SESSION_SECRET'),
    maxAge: getEnvNumber('SESSION_MAX_AGE', 86400000), // 24 hours
    cookie: {
      secure: getEnvBoolean('SESSION_COOKIE_SECURE', false),
      httpOnly: getEnvBoolean('SESSION_COOKIE_HTTP_ONLY', true),
      sameSite: getEnvVar('SESSION_COOKIE_SAME_SITE', 'lax') as 'strict' | 'lax' | 'none',
    },
  },

  // Google Cloud Platform Configuration
  gcp: {
    projectId: getEnvVar('GCP_PROJECT_ID'),
    credentialsPath: getEnvVar('GOOGLE_APPLICATION_CREDENTIALS', './config/gcp-service-account-key.json'),
  },

  // Firestore Configuration
  firestore: {
    usersCollection: getEnvVar('FIRESTORE_USERS_COLLECTION', 'users'),
    imagesCollection: getEnvVar('FIRESTORE_IMAGES_COLLECTION', 'images'),
  },

  // Google Cloud Storage Configuration
  gcs: {
    bucketName: getEnvVar('GCS_BUCKET_NAME'),
    bucketLocation: getEnvVar('GCS_BUCKET_LOCATION', 'us-central1'),
    publicUrlBase: getEnvVar('GCS_PUBLIC_URL_BASE'),
  },

  // Gemini API Configuration
  gemini: {
    apiKey: getEnvVar('GEMINI_API_KEY'),
    imageModel: getEnvVar('GEMINI_IMAGE_MODEL', 'gemini-2.5-flash-image-preview'),
    apiTimeout: getEnvNumber('GEMINI_API_TIMEOUT', 30000),
  },

  // Rate Limiting Configuration
  rateLimit: {
    maxRequests: getEnvNumber('RATE_LIMIT_MAX_REQUESTS', 100),
    windowMinutes: getEnvNumber('RATE_LIMIT_WINDOW_MINUTES', 15),
  },

  // Logging Configuration
  logging: {
    level: getEnvVar('LOG_LEVEL', 'info'),
    dir: getEnvVar('LOG_DIR', 'logs'),
  },

  // CORS Configuration
  cors: {
    allowedOrigins: getEnvVar('CORS_ALLOWED_ORIGINS', 'http://localhost:3000,http://localhost:3001')
      .split(',')
      .map(origin => origin.trim()),
  },

  // Image Generation Settings
  imageGeneration: {
    maxImagesPerUserPerDay: getEnvNumber('MAX_IMAGES_PER_USER_PER_DAY', 50),
    defaultWidth: getEnvNumber('DEFAULT_IMAGE_WIDTH', 1024),
    defaultHeight: getEnvNumber('DEFAULT_IMAGE_HEIGHT', 1024),
    defaultQuality: getEnvVar('DEFAULT_IMAGE_QUALITY', 'standard'),
  },
};

/**
 * Validate configuration on startup
 *
 * @throws Error if any required configuration is invalid
 */
export const validateConfig = (): void => {
  const requiredVars = [
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'SESSION_SECRET',
    'GCP_PROJECT_ID',
    'GCS_BUCKET_NAME',
    'GEMINI_API_KEY',
  ];

  const missing = requiredVars.filter(key => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      'Please check your .env file against .env.example'
    );
  }

  console.log('✓ Configuration validated successfully');
};

export default config;
