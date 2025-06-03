import fs from 'fs';
import path from 'path';

// Simple script to copy attached_assets for deployment
console.log('📁 Copying wine image assets for deployment...');

try {
  const attachedAssetsSource = 'attached_assets';
  const publicAssetsDir = path.join('public', 'attached_assets');
  
  // Create public directory if it doesn't exist
  if (!fs.existsSync('public')) {
    fs.mkdirSync('public', { recursive: true });
  }
  
  // Create public/attached_assets directory
  if (!fs.existsSync(publicAssetsDir)) {
    fs.mkdirSync(publicAssetsDir, { recursive: true });
  }
  
  if (fs.existsSync(attachedAssetsSource)) {
    // Copy all files from attached_assets to public/attached_assets
    const files = fs.readdirSync(attachedAssetsSource);
    let copiedCount = 0;
    
    files.forEach(file => {
      const sourcePath = path.join(attachedAssetsSource, file);
      const destPath = path.join(publicAssetsDir, file);
      
      if (fs.statSync(sourcePath).isFile()) {
        fs.copyFileSync(sourcePath, destPath);
        copiedCount++;
        
        if (file.includes('wine-')) {
          console.log(`✅ Copied wine image: ${file}`);
        }
      }
    });
    
    console.log(`✅ Copied ${copiedCount} asset files to public directory`);
    console.log('🍷 Wine images are now available for deployment');
  } else {
    console.log('❌ attached_assets directory not found');
  }
} catch (error) {
  console.error('❌ Asset copy failed:', error);
  process.exit(1);
}