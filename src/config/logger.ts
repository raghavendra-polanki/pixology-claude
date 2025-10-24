/**
 * Logger Configuration
 *
 * Centralized logging service using Winston.
 * Provides structured logging with different levels and output formats.
 *
 * @module config/logger
 */

import winston from 'winston';
import path from 'path';
import config from './config';

/**
 * Custom log format for development
 */
const devFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaString = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
    return `${timestamp} [${level}]: ${message} ${metaString}`;
  })
);

/**
 * Custom log format for production (JSON)
 */
const prodFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

/**
 * Create the logger instance
 */
const logger = winston.createLogger({
  level: config.logging.level,
  format: config.env === 'production' ? prodFormat : devFormat,
  transports: [
    // Console output
    new winston.transports.Console({
      format: config.env === 'production' ? prodFormat : devFormat,
    }),

    // Error logs - separate file
    new winston.transports.File({
      filename: path.join(config.logging.dir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),

    // Combined logs - all levels
    new winston.transports.File({
      filename: path.join(config.logging.dir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(config.logging.dir, 'exceptions.log'),
    }),
  ],
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(config.logging.dir, 'rejections.log'),
    }),
  ],
});

/**
 * Create a child logger with additional context
 *
 * @param context - Additional context to add to all logs
 * @returns Child logger instance
 */
export const createChildLogger = (context: Record<string, unknown>): winston.Logger => {
  return logger.child(context);
};

export default logger;
