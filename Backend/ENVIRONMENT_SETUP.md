# Environment Variables Setup

This backend requires the following environment variables to be set:

## Required Environment Variables

### Database Configuration
- `MONGO_URI` - MongoDB connection string
  - Development: `mongodb://localhost:27017/secure-stream`
  - Production: `mongodb+srv://username:password@cluster.mongodb.net/database`

### JWT Configuration
- `JWT_SECRET` - Secret key for access tokens
- `JWT_REFRESH_SECRET` - Secret key for refresh tokens
- `ACCESS_EXPIRES_IN` - Access token expiration time (default: `15m`)
- `REFRESH_EXPIRES_IN` - Refresh token expiration time (default: `7d`)

### Azure Blob Storage Configuration (for video streaming)
- `AZURE_ACCOUNT_NAME` - Azure Storage account name
- `AZURE_ACCOUNT_KEY` - Azure Storage account key

### Server Configuration
- `PORT` - Server port (default: `5000`)
- `NODE_ENV` - Environment mode (`development` or `production`)

## CORS Configuration

The following origins are allowed by default:
- `http://127.0.0.1:5500`, `http://localhost:5500` (Live Server)
- `http://127.0.0.1:5501`, `http://localhost:5501` (Live Server)
- `http://127.0.0.1:5000`, `http://localhost:5000` (Direct backend)
- `https://hack-odisha-5-0.vercel.app` (Vercel frontend)
- `https://hackodisha-5-0.onrender.com` (Render backend)

## Production Deployment Notes

1. **Cookie Security**: The application automatically detects cross-origin requests and sets appropriate cookie security settings (`secure: true`, `sameSite: "None"`)

2. **HTTPS Required**: In production, ensure your backend is served over HTTPS for proper cookie handling

3. **Environment Variables**: Set all required environment variables in your deployment platform (Render, Heroku, etc.)

## Example .env file

```env
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/secure-stream
JWT_SECRET=your-super-secret-jwt-key-here
JWT_REFRESH_SECRET=your-super-secret-refresh-key-here
ACCESS_EXPIRES_IN=15m
REFRESH_EXPIRES_IN=7d
AZURE_ACCOUNT_NAME=your-azure-storage-account-name
AZURE_ACCOUNT_KEY=your-azure-storage-account-key
PORT=5000
NODE_ENV=production
```
