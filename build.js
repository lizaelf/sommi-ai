import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

// Build for production
console.log('📦 Building for production...');
try {
  // Run the Vite build
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✅ Build completed successfully');

  // Create a dist folder if it doesn't exist
  if (!fs.existsSync('dist')) {
    fs.mkdirSync('dist');
  }

  // Copy root index.html to dist folder
  fs.copyFileSync('index.html', path.join('dist', 'index.html'));
  console.log('✅ Copied index.html to dist folder');

  // Copy README.md to dist folder
  fs.copyFileSync('README.md', path.join('dist', 'README.md'));
  console.log('✅ Copied README.md to dist folder');

  // Copy attached_assets folder to dist folder for wine images
  const attachedAssetsSource = 'attached_assets';
  const attachedAssetsDest = path.join('dist', 'attached_assets');
  
  if (fs.existsSync(attachedAssetsSource)) {
    // Create destination directory
    if (!fs.existsSync(attachedAssetsDest)) {
      fs.mkdirSync(attachedAssetsDest, { recursive: true });
    }
    
    // Copy all files from attached_assets
    const files = fs.readdirSync(attachedAssetsSource);
    files.forEach(file => {
      const sourcePath = path.join(attachedAssetsSource, file);
      const destPath = path.join(attachedAssetsDest, file);
      if (fs.statSync(sourcePath).isFile()) {
        fs.copyFileSync(sourcePath, destPath);
      }
    });
    console.log('✅ Copied attached_assets folder to dist folder');
  }

  // Create a simple .nojekyll file to prevent GitHub Pages from ignoring directories that start with underscore
  fs.writeFileSync(path.join('dist', '.nojekyll'), '');
  console.log('✅ Created .nojekyll file');

  console.log('🎉 Build ready for GitHub Pages deployment!');
  console.log('📂 All files are in the "dist" directory. You can now commit and push to GitHub.');
} catch (error) {
  console.error('❌ Build failed:', error);
  process.exit(1);
}