/**
 * Pixology.ai Backend Server
 *
 * Main application entry point for the Express.js server.
 * Configures middleware, routes, authentication, and serves the React client.
 *
 * @module server
 */

import express, { Application, Request, Response } from 'express';
import session from 'express-session';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import path from 'path';

// Configuration
import config, { validateConfig } from './config/config';
import logger from './config/logger';
import passport from './config/passport';

// Routes
import authRoutes from './routes/authRoutes';
import imageRoutes from './routes/imageRoutes';

// Middleware
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

/**
 * Initialize Express application
 */
const app: Application = express();

/**
 * Validate configuration on startup
 */
try {
  validateConfig();
} catch (error) {
  logger.error('Configuration validation failed', { error });
  process.exit(1);
}

/**
 * Trust proxy (important for rate limiting and session security behind reverse proxies)
 */
app.set('trust proxy', 1);

/**
 * Security middleware
 */
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https://storage.googleapis.com'],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

/**
 * CORS configuration
 */
app.use(cors({
  origin: config.cors.allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

/**
 * Body parsing middleware
 */
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

/**
 * Compression middleware
 */
app.use(compression());

/**
 * Request logging
 */
if (config.env === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', {
    stream: {
      write: (message) => logger.info(message.trim()),
    },
  }));
}

/**
 * Rate limiting
 */
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMinutes * 60 * 1000,
  max: config.rateLimit.maxRequests,
  message: {
    success: false,
    error: 'Too many requests, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

/**
 * Session configuration
 */
app.use(
  session({
    secret: config.session.secret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: config.session.cookie.secure,
      httpOnly: config.session.cookie.httpOnly,
      sameSite: config.session.cookie.sameSite,
      maxAge: config.session.maxAge,
    },
  })
);

/**
 * Passport initialization
 */
app.use(passport.initialize());
app.use(passport.session());

/**
 * API Routes
 */
app.use('/auth', authRoutes);
app.use('/api/v1', imageRoutes);

/**
 * Serve static React client build
 */
const clientBuildPath = path.join(__dirname, '../client/build');
app.use(express.static(clientBuildPath));

/**
 * Health check endpoint (before React fallback)
 */
app.get('/health', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Pixology.ai Backend is running',
    timestamp: new Date().toISOString(),
    environment: config.env,
  });
});

/**
 * React client fallback
 * All non-API routes serve the React application
 */
app.get('*', (req: Request, res: Response) => {
  // Don't serve React for API routes that don't exist
  if (req.path.startsWith('/api/') || req.path.startsWith('/auth/')) {
    return notFoundHandler(req, res);
  }

  // Serve React app for all other routes
  res.sendFile(path.join(clientBuildPath, 'index.html'));
});

/**
 * Error handling middleware (must be last)
 */
app.use(errorHandler);

/**
 * Start server
 */
const PORT = config.port;
const HOST = config.host;

const server = app.listen(PORT, HOST, () => {
  logger.info('='.repeat(60));
  logger.info('🚀 Pixology.ai Backend Server Started');
  logger.info('='.repeat(60));
  logger.info(`Environment: ${config.env}`);
  logger.info(`Server URL: ${config.apiBaseUrl}`);
  logger.info(`Client URL: ${config.clientUrl}`);
  logger.info(`Port: ${PORT}`);
  logger.info(`Host: ${HOST}`);
  logger.info('='.repeat(60));
});

/**
 * Graceful shutdown handler
 */
const gracefulShutdown = (signal: string) => {
  logger.info(`${signal} received. Starting graceful shutdown...`);

  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

/**
 * Unhandled rejection handler
 */
process.on('unhandledRejection', (reason: Error) => {
  logger.error('Unhandled Promise Rejection', {
    reason: reason.message,
    stack: reason.stack,
  });
});

/**
 * Uncaught exception handler
 */
process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception', {
    error: error.message,
    stack: error.stack,
  });
  process.exit(1);
});

export default app;
