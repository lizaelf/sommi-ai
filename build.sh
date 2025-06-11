#!/bin/bash

# Wine Collection App Build Script
echo "🍷 Building Wine Collection App..."

# Step 1: Copy assets for deployment
echo "📁 Copying wine image assets..."
node copy-assets.js

# Step 2: Build frontend
echo "🎨 Building frontend..."
npm run build

echo "✅ Build complete! Wine images are ready for deployment."