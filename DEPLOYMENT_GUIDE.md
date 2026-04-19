# Ritual Cards - Deployment Guide

## 🎯 What's Been Fixed

1. **✅ Avatar Image Issue Fixed**: The profile picture now properly displays on generated cards using the Base64 data from the API
2. **✅ Serverless Conversion**: The Express server has been converted to Vercel serverless functions for production deployment

## 🚀 Development Options

### Option 1: Traditional Development (Current Setup)
For local development with hot reload:
```bash
# Terminal 1: Start the Express API server
npm run server

# Terminal 2: Start the Vite dev server
npm run dev
```
- App runs on: `http://localhost:3006` (or available port)
- API runs on: `http://localhost:3001`

### Option 2: Vercel Development (Simulates Production)
For testing serverless functions locally:
```bash
npm run dev:vercel
```
This runs the entire app using Vercel's development environment, simulating how it will work in production.

## 🌐 Deploying to Vercel

### Automatic Deployment
1. Push your code to GitHub
2. Connect your repository to Vercel
3. Vercel will automatically detect the configuration and deploy

### Manual Deployment
```bash
# Install Vercel CLI (if not already installed)
npm install -g vercel

# Deploy to Vercel
vercel
```

## 📁 Key Files Changed

1. **`src/App.tsx`**: 
   - Fixed avatar display by using `profile.avatar` instead of placeholder
   - Added environment detection for API endpoints
   - Development: `http://localhost:3001/api/twitter/:username`
   - Production: `/api/twitter/:username` (serverless)

2. **`api/twitter/[username].js`**: 
   - New Vercel serverless function
   - Handles Twitter profile fetching with Nitter instances
   - Returns Base64 encoded avatar images

3. **`vercel.json`**: 
   - Vercel deployment configuration
   - Routes API calls to serverless functions
   - Configures function memory and timeout settings

4. **`server.js`**: 
   - Changed port from 3002 to 3001 to avoid conflicts
   - Still used for local development

## 🔧 Environment Configuration

The app automatically detects the environment:
- **Development**: Uses local Express server (port 3001)
- **Production**: Uses Vercel serverless functions

## 📊 Current Status

- ✅ Avatar images now display correctly on cards
- ✅ Display names are properly fetched
- ✅ Serverless functions ready for Vercel deployment
- ✅ Local development environment configured
- ✅ Build and deployment scripts updated

## 🧪 Testing

To test the avatar fix:
1. Start both servers (`npm run server` and `npm run dev`)
2. Open the app in your browser
3. Enter a Twitter handle
4. The generated card should now show the actual profile picture

For Vercel testing:
1. Run `npm run dev:vercel`
2. Test the application as it will behave in production

## 📝 Notes

- The avatar image is now properly fetched from the API and displayed using Base64 encoding
- CORS issues are resolved by server-side image fetching
- The app works seamlessly in both development and production environments
- Vercel automatically handles the serverless function routing