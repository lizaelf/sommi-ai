# Deploying Wine Collection App

This document provides instructions for deploying the wine collection app with synchronized scanned and wine details pages.

## Prerequisites

- GitHub account
- Git installed on your local machine
- Node.js and npm installed

## Deployment Steps

### 1. Create a GitHub Repository

Create a new repository on GitHub named `sommi-ai` (or use your existing one).

### 2. Synchronize and Build the Application

Ensure deployed version matches Replit version exactly:

```bash
# 1. Synchronize deployment configuration
node deploy-sync.js

# 2. Copy wine images and assets
node copy-assets.js

# 3. Build the application
npm run build
```

Alternatively, use the automated build script:

```bash
./build.sh
```

The application is built with the correct paths for deployment. The built files are in the `dist/` directory.

### 3. Set Up GitHub Pages

1. Push the contents of this repository to your GitHub repository
2. Go to your repository on GitHub
3. Navigate to Settings > Pages
4. Set the source to "Deploy from a branch"
5. Select the branch (e.g., "main" or "gh-pages")
6. Set the folder to "/" (root)
7. Click "Save"

### 4. Create GitHub Actions Workflow (Optional)

For automatic deployments, create a `.github/workflows/deploy.yml` file with the following content:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v3

      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: 18

      - name: Install dependencies
        run: npm ci

      - name: Copy Assets
        run: node copy-assets.js

      - name: Build
        run: npm run build
        env:
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}

      - name: Deploy to GitHub Pages
        uses: JamesIves/github-pages-deploy-action@v4
        with:
          folder: dist
          branch: gh-pages
```

### 5. Add OpenAI API Key to GitHub Secrets

1. In your GitHub repository, go to Settings > Secrets and variables > Actions
2. Click "New repository secret"
3. Name: `OPENAI_API_KEY`
4. Value: Your OpenAI API key
5. Click "Add secret"

## Important Notes

- The application will make API calls to the backend server when deployed. Make sure your backend is properly configured and accessible.
- For the fully functioning application, you need a valid OpenAI API key.
- The homepage in package.json is set to: `https://lizaelf.github.io/sommi-ai/client`
- All assets are referenced with relative paths to ensure they work correctly on GitHub Pages.

## Troubleshooting

If you encounter issues with paths:
1. Make sure all asset references in the built HTML files use relative paths (starting with `./`) rather than absolute paths (starting with `/`).
2. Verify that the homepage in package.json matches your GitHub Pages URL.
3. Check if the GitHub Pages site is being served from the correct directory.

For API connection issues:
1. Ensure your API key is properly set in the GitHub Secrets.
2. Check if the API endpoints are correctly configured for the production environment.