# Pixology.ai - AI Image Generation Platform

A modern, production-ready Node.js/Express.js backend API server with Google Cloud integration for AI-powered image generation. Built with TypeScript, featuring Google OAuth authentication, Gemini AI image generation, and Google Cloud Storage.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Development](#development)
- [Build & Deployment](#build--deployment)
- [API Documentation](#api-documentation)
- [Project Structure](#project-structure)
- [Testing](#testing)
- [Contributing](#contributing)
- [License](#license)

## Overview

Pixology.ai is a full-stack boilerplate designed for building AI image generation applications. It provides:

- **Backend API**: Express.js server with TypeScript
- **Authentication**: Google OAuth 2.0 integration
- **AI Image Generation**: Google Gemini API (gemini-2.5-flash-image-preview)
- **Storage**: Google Cloud Storage for generated images
- **Database**: Google Cloud Firestore for user and image metadata
- **Frontend**: Serves a static React application

## Features

### Core Functionality

- ✅ Google OAuth 2.0 authentication
- ✅ AI-powered image generation using Gemini API
- ✅ Automatic image upload to Google Cloud Storage
- ✅ User and image metadata storage in Firestore
- ✅ RESTful API with TypeScript
- ✅ Session-based authentication with Passport.js

### Security & Best Practices

- ✅ Helmet.js for security headers
- ✅ CORS configuration
- ✅ Rate limiting
- ✅ Request validation with express-validator
- ✅ Comprehensive error handling
- ✅ Structured logging with Winston

### Developer Experience

- ✅ TypeScript with strict type checking
- ✅ Hot reload with Nodemon
- ✅ ESLint for code quality
- ✅ Modular architecture (MVC pattern)
- ✅ Detailed code comments
- ✅ Environment-based configuration

## Architecture

```
┌─────────────┐      ┌──────────────────┐      ┌──────────────────┐
│   Client    │─────▶│   Express API    │─────▶│  Google Cloud    │
│   (React)   │      │   (TypeScript)   │      │   Services       │
└─────────────┘      └──────────────────┘      └──────────────────┘
                              │                         │
                              │                         ├─ Firestore
                              │                         ├─ Cloud Storage
                              │                         ├─ Gemini API
                              │                         └─ OAuth 2.0
                              │
                     ┌────────▼────────┐
                     │  Middleware      │
                     ├─────────────────┤
                     │ • Auth          │
                     │ • Validation    │
                     │ • Rate Limit    │
                     │ • Error Handler │
                     └─────────────────┘
```

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **Google Cloud Account** with the following enabled:
  - Google Cloud Storage
  - Firestore Database
  - Gemini API access
  - OAuth 2.0 credentials

## Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd pixology-backend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Google Cloud Services

#### a. Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the following APIs:
   - Google Cloud Storage API
   - Cloud Firestore API
   - Generative Language API (Gemini)

#### b. Create OAuth 2.0 Credentials

1. Navigate to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth client ID**
3. Configure the OAuth consent screen
4. Create credentials with:
   - Application type: **Web application**
   - Authorized redirect URIs: `http://localhost:3001/auth/google/callback`
5. Save the **Client ID** and **Client Secret**

#### c. Create a Service Account

1. Go to **IAM & Admin** → **Service Accounts**
2. Create a new service account with the following roles:
   - **Cloud Datastore User** (for Firestore)
   - **Storage Object Admin** (for Cloud Storage)
3. Create and download a JSON key file
4. Save it as `./config/gcp-service-account-key.json`

#### d. Create a Cloud Storage Bucket

1. Navigate to **Cloud Storage** → **Buckets**
2. Create a new bucket (e.g., `pixology-generated-images`)
3. Set the location and storage class
4. Note the bucket name for configuration

#### e. Get Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create an API key for the Gemini API
3. Save the API key

### 4. Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env` and fill in your values:

```env
# Server Configuration
NODE_ENV=development
PORT=3001
HOST=localhost
API_BASE_URL=http://localhost:3001
CLIENT_URL=http://localhost:3000

# Google OAuth
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3001/auth/google/callback

# Session
SESSION_SECRET=your-super-secret-session-key

# Google Cloud Platform
GCP_PROJECT_ID=your-gcp-project-id
GOOGLE_APPLICATION_CREDENTIALS=./config/gcp-service-account-key.json

# Firestore
FIRESTORE_USERS_COLLECTION=users
FIRESTORE_IMAGES_COLLECTION=images

# Google Cloud Storage
GCS_BUCKET_NAME=pixology-generated-images
GCS_BUCKET_LOCATION=us-central1
GCS_PUBLIC_URL_BASE=https://storage.googleapis.com/pixology-generated-images/

# Gemini API
GEMINI_API_KEY=your-gemini-api-key
GEMINI_IMAGE_MODEL=gemini-2.5-flash-image-preview
```

## Configuration

### Environment Variables

All configuration is managed through environment variables. See `.env.example` for a complete list of available options.

### TypeScript Configuration

TypeScript is configured with strict type checking. See `tsconfig.json` for compiler options.

### Path Aliases

The following path aliases are configured:

- `@/*` → `src/*`
- `@config/*` → `src/config/*`
- `@models/*` → `src/models/*`
- `@services/*` → `src/services/*`
- `@controllers/*` → `src/controllers/*`
- `@routes/*` → `src/routes/*`
- `@middleware/*` → `src/middleware/*`

## Development

### Start Development Server

```bash
npm run dev
```

This starts the server with hot reload enabled using Nodemon.

### Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Compile TypeScript to JavaScript
- `npm start` - Start production server (requires build first)
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors automatically
- `npm test` - Run tests (when implemented)

### Development Workflow

1. **Make changes** to TypeScript files in `src/`
2. **Nodemon automatically restarts** the server
3. **View logs** in the console and `logs/` directory
4. **Test endpoints** using Postman, curl, or your frontend

## Build & Deployment

### Build Backend

```bash
npm run build
```

This compiles TypeScript files from `src/` to JavaScript in `dist/`.

### Build Frontend (React)

```bash
cd client
npm install
npm run build
cd ..
```

This creates an optimized production build in `client/build/`.

### Build Everything

```bash
npm run build:all
```

### Start Production Server

```bash
NODE_ENV=production npm start
```

### Deployment Options

#### 1. Google Cloud Run (Recommended)

```bash
# Build Docker image
docker build -t pixology-backend .

# Deploy to Cloud Run
gcloud run deploy pixology-backend \
  --image pixology-backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

#### 2. Google App Engine

Create `app.yaml`:

```yaml
runtime: nodejs18
env: standard

env_variables:
  NODE_ENV: production

handlers:
  - url: /.*
    script: auto
    secure: always
```

Deploy:

```bash
gcloud app deploy
```

#### 3. Traditional VPS/VM

1. Install Node.js v18+
2. Clone repository
3. Install dependencies: `npm install --production`
4. Build: `npm run build`
5. Set up environment variables
6. Use PM2 for process management:
   ```bash
   npm install -g pm2
   pm2 start dist/server.js --name pixology-backend
   pm2 save
   pm2 startup
   ```

## API Documentation

### Authentication Endpoints

#### `GET /auth/google`

Initiates Google OAuth login flow.

**Response**: Redirects to Google OAuth consent screen

---

#### `GET /auth/google/callback`

OAuth callback endpoint (handled automatically by Passport).

**Response**: Redirects to client application with session

---

#### `POST /auth/logout`

Logs out the current user and destroys session.

**Authentication**: Required

**Response**:
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

#### `GET /auth/me`

Get current authenticated user's profile.

**Authentication**: Required

**Response**:
```json
{
  "success": true,
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "name": "John Doe",
    "profilePicture": "https://...",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "lastLoginAt": "2024-01-01T00:00:00.000Z",
    "status": "active",
    "role": "user"
  }
}
```

---

#### `GET /auth/status`

Check authentication status.

**Response**:
```json
{
  "success": true,
  "authenticated": true,
  "user": { ... }
}
```

### Image Generation Endpoints

#### `POST /api/v1/generate/image`

Generate a new AI image using Gemini API.

**Authentication**: Required

**Request Body**:
```json
{
  "prompt": "A beautiful sunset over the ocean",
  "styleParams": {
    "style": "realistic",
    "colorScheme": "warm",
    "mood": "peaceful",
    "modifiers": ["high detail", "cinematic"],
    "dimensions": {
      "width": 1024,
      "height": 1024
    },
    "quality": "high"
  }
}
```

**Response**:
```json
{
  "success": true,
  "image": {
    "id": "image-uuid",
    "gcsUrl": "https://storage.googleapis.com/...",
    "prompt": "A beautiful sunset over the ocean",
    "styleParams": { ... },
    "dimensions": {
      "width": 1024,
      "height": 1024
    },
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

#### `GET /api/v1/images/history`

Get user's image generation history.

**Authentication**: Required

**Query Parameters**:
- `limit` (optional): Maximum number of results (default: 50)

**Response**:
```json
{
  "success": true,
  "images": [ ... ],
  "count": 10
}
```

---

#### `GET /api/v1/images/:imageId`

Get specific image by ID.

**Authentication**: Required

**Response**:
```json
{
  "success": true,
  "image": { ... }
}
```

### Health Check

#### `GET /health`

Server health check endpoint.

**Response**:
```json
{
  "success": true,
  "message": "Pixology.ai Backend is running",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "environment": "production"
}
```

## Project Structure

```
pixology-backend/
├── src/
│   ├── config/           # Configuration files
│   │   ├── config.ts     # Environment configuration
│   │   ├── logger.ts     # Winston logger setup
│   │   └── passport.ts   # Passport.js configuration
│   ├── controllers/      # Request handlers
│   │   ├── authController.ts
│   │   └── imageController.ts
│   ├── middleware/       # Express middleware
│   │   ├── authMiddleware.ts
│   │   ├── errorHandler.ts
│   │   └── validation.ts
│   ├── models/           # Data models and interfaces
│   │   ├── User.ts
│   │   └── Image.ts
│   ├── routes/           # Route definitions
│   │   ├── authRoutes.ts
│   │   └── imageRoutes.ts
│   ├── services/         # Business logic
│   │   ├── GCPDatabaseService.ts
│   │   ├── GCPStorageService.ts
│   │   ├── ImageGenerationService.ts
│   │   └── UserService.ts
│   ├── types/            # TypeScript type definitions
│   │   └── express.d.ts
│   ├── utils/            # Utility functions
│   └── server.ts         # Main application entry point
├── client/               # React frontend placeholder
│   ├── build/            # Production build output
│   └── README.md         # Frontend setup instructions
├── dist/                 # Compiled JavaScript (generated)
├── logs/                 # Application logs (generated)
├── .env.example          # Environment variables template
├── .eslintrc.json        # ESLint configuration
├── .gitignore            # Git ignore rules
├── nodemon.json          # Nodemon configuration
├── package.json          # Project dependencies
├── tsconfig.json         # TypeScript configuration
└── README.md             # This file
```

## Testing

Testing infrastructure is set up with Jest. To run tests:

```bash
npm test
```

To run tests in watch mode:

```bash
npm run test:watch
```

## Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## License

This project is licensed under the MIT License.

---

**Pixology.ai** - Built with ❤️ for the AI generation community
