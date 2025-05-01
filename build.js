const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

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

  // Create a simple .nojekyll file to prevent GitHub Pages from ignoring directories that start with underscore
  fs.writeFileSync(path.join('dist', '.nojekyll'), '');
  console.log('✅ Created .nojekyll file');

  console.log('🎉 Build ready for GitHub Pages deployment!');
  console.log('📂 All files are in the "dist" directory. You can now commit and push to GitHub.');
} catch (error) {
  console.error('❌ Build failed:', error);
  process.exit(1);
}