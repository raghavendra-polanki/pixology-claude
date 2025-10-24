# Pixology.ai React Client

This directory is a placeholder for your React frontend application.

## Setup

1. Create your React app here:
   ```bash
   cd client
   npx create-react-app . --template typescript
   ```

2. Or use Vite for a faster development experience:
   ```bash
   cd client
   npm create vite@latest . -- --template react-ts
   ```

## Integration with Backend

The backend Express server is configured to serve the built React application from `client/build`.

### Development Mode

During development, run the React dev server separately:
```bash
cd client
npm start
```

The backend API will be available at `http://localhost:3001`.

### Production Build

When ready for production:
```bash
cd client
npm run build
```

This creates an optimized build in the `client/build` directory, which the Express server will serve.

## API Integration

The backend provides the following API endpoints:

### Authentication
- `GET /auth/google` - Initiate Google OAuth login
- `GET /auth/google/callback` - OAuth callback
- `POST /auth/logout` - Logout
- `GET /auth/me` - Get current user
- `GET /auth/status` - Check auth status

### Image Generation
- `POST /api/v1/generate/image` - Generate a new image
- `GET /api/v1/images/history` - Get image history
- `GET /api/v1/images/:imageId` - Get specific image

### Health Check
- `GET /health` - Server health check
