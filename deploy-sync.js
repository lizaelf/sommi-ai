#!/usr/bin/env node

// Deployment Synchronization Script
// Ensures deployed version matches Replit version exactly

import fs from 'fs';
import path from 'path';

console.log('🔄 Starting deployment synchronization...');

// Check if we're in development or production
const isDevelopment = process.env.NODE_ENV !== 'production';
const baseUrl = isDevelopment ? '' : '/sommi-ai/client';

console.log(`Environment: ${isDevelopment ? 'Development' : 'Production'}`);
console.log(`Base URL: ${baseUrl || '(root)'}`);

// Update asset paths for deployment
function updateAssetPaths() {
  console.log('📝 Updating asset paths for deployment...');
  
  // Read the current data sync file
  const dataSyncPath = './client/src/utils/dataSync.ts';
  let dataSyncContent = fs.readFileSync(dataSyncPath, 'utf8');
  
  // Ensure asset paths are correctly prefixed for deployment
  if (!isDevelopment) {
    // Update image paths to include base URL for production
    dataSyncContent = dataSyncContent.replace(
      /image: "\/assets\//g, 
      `image: "${baseUrl}/assets/`
    );
    dataSyncContent = dataSyncContent.replace(
      /image: "\/@assets\//g, 
      `image: "${baseUrl}/assets/`
    );
  } else {
    // Ensure development paths use @assets alias
    dataSyncContent = dataSyncContent.replace(
      /image: "\/sommi-ai\/client\/assets\//g, 
      'image: "/@assets/'
    );
  }
  
  fs.writeFileSync(dataSyncPath, dataSyncContent);
  console.log('✅ Asset paths updated successfully');
}

// Sync component implementations
function syncComponents() {
  console.log('🔄 Synchronizing component implementations...');
  
  const componentsToSync = [
    './client/src/pages/WineDetails.tsx',
    './client/src/pages/WineScan.tsx',
    './client/src/components/EnhancedChatInterface.tsx'
  ];
  
  componentsToSync.forEach(componentPath => {
    if (fs.existsSync(componentPath)) {
      let content = fs.readFileSync(componentPath, 'utf8');
      
      // Ensure loading states are consistent
      if (content.includes('wine-details-loading') || content.includes('wine-details-ready')) {
        console.log(`✅ ${path.basename(componentPath)} has proper loading states`);
      }
      
      // Ensure asset imports are correct
      if (!isDevelopment) {
        content = content.replace(
          /@assets\//g,
          `${baseUrl}/assets/`
        );
        fs.writeFileSync(componentPath, content);
      }
    }
  });
  
  console.log('✅ Component synchronization complete');
}

// Update CSS for deployment
function syncStyles() {
  console.log('🎨 Synchronizing styles...');
  
  const cssPath = './client/src/index.css';
  if (fs.existsSync(cssPath)) {
    let cssContent = fs.readFileSync(cssPath, 'utf8');
    
    // Ensure wine-details loading classes are present
    if (!cssContent.includes('wine-details-loading')) {
      cssContent += `
/* Prevent flash during wine details loading */
.wine-details-loading {
  visibility: hidden !important;
  opacity: 0 !important;
}

.wine-details-ready {
  visibility: visible !important;
  opacity: 1 !important;
  transition: opacity 0.2s ease-in !important;
}
`;
      fs.writeFileSync(cssPath, cssContent);
      console.log('✅ Loading styles added to CSS');
    } else {
      console.log('✅ Loading styles already present');
    }
  }
}

// Update package.json homepage for deployment
function updatePackageJson() {
  console.log('📦 Updating package.json for deployment...');
  
  const packagePath = './package.json';
  if (fs.existsSync(packagePath)) {
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    
    if (!isDevelopment) {
      packageJson.homepage = 'https://lizaelf.github.io/sommi-ai/client';
    } else {
      delete packageJson.homepage;
    }
    
    fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));
    console.log('✅ Package.json updated');
  }
}

// Run synchronization
try {
  updateAssetPaths();
  syncComponents();
  syncStyles();
  updatePackageJson();
  
  console.log('🎉 Deployment synchronization complete!');
  console.log('📋 Next steps:');
  console.log('   1. Run: npm run build');
  console.log('   2. Deploy to your hosting platform');
  console.log('   3. Verify scanned and wine details pages match Replit version');
  
} catch (error) {
  console.error('❌ Synchronization failed:', error.message);
  process.exit(1);
}