import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

// Enhanced script to copy attached_assets with deduplication
console.log('📁 Copying wine image assets for deployment...');

// Function to get file hash for duplicate detection
function getFileHash(filePath) {
  const fileBuffer = fs.readFileSync(filePath);
  return crypto.createHash('md5').update(fileBuffer).digest('hex');
}

// Function to detect and remove duplicates
function deduplicateAssets(sourceDir) {
  if (!fs.existsSync(sourceDir)) return [];
  
  const files = fs.readdirSync(sourceDir);
  const hashMap = new Map();
  const duplicates = [];
  
  files.forEach(file => {
    const filePath = path.join(sourceDir, file);
    if (fs.statSync(filePath).isFile()) {
      const hash = getFileHash(filePath);
      
      if (hashMap.has(hash)) {
        // Found duplicate - keep the one with shorter filename or newer timestamp
        const existingFile = hashMap.get(hash);
        const existingPath = path.join(sourceDir, existingFile);
        const existingStat = fs.statSync(existingPath);
        const currentStat = fs.statSync(filePath);
        
        if (currentStat.mtime > existingStat.mtime || file.length < existingFile.length) {
          // Current file is newer or has shorter name, remove the existing one
          duplicates.push(existingFile);
          hashMap.set(hash, file);
        } else {
          // Existing file is better, mark current as duplicate
          duplicates.push(file);
        }
      } else {
        hashMap.set(hash, file);
      }
    }
  });
  
  return duplicates;
}

try {
  const attachedAssetsSource = 'attached_assets';
  const publicAssetsDir = path.join('public', 'attached_assets');
  
  // Deduplicate assets first
  const duplicates = deduplicateAssets(attachedAssetsSource);
  if (duplicates.length > 0) {
    console.log(`🔍 Found ${duplicates.length} duplicate files:`);
    duplicates.forEach(duplicate => {
      const duplicatePath = path.join(attachedAssetsSource, duplicate);
      console.log(`🗑️ Removing duplicate: ${duplicate}`);
      fs.unlinkSync(duplicatePath);
    });
  }
  
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
        // Check if destination file already exists and is identical
        if (fs.existsSync(destPath)) {
          const sourceHash = getFileHash(sourcePath);
          const destHash = getFileHash(destPath);
          if (sourceHash === destHash) {
            console.log(`⏭️ Skipping identical file: ${file}`);
            return;
          }
        }
        
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