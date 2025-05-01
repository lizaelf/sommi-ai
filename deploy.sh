#!/bin/bash

# Create a dist directory if it doesn't exist
mkdir -p dist

# Run the build command
echo "📦 Building project..."
npm run build

# Copy files needed for GitHub Pages
echo "📋 Copying files for GitHub Pages..."
cp index.html dist/
cp README.md dist/

# Create .nojekyll file to ensure GitHub Pages doesn't ignore underscore-prefixed directories
touch dist/.nojekyll

echo "✅ Build completed successfully!"
echo "🚀 Ready for GitHub Pages deployment."
echo "The 'dist' directory contains all files needed for deployment."
echo ""
echo "To deploy to GitHub Pages:"
echo "1. Push your code to GitHub"
echo "2. Go to your repository Settings > Pages"
echo "3. Select the 'GitHub Actions' source"
echo "4. Your site will be deployed automatically"