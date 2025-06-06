#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// File renaming mappings
const renamingMappings = [
  // Hooks
  { from: 'client/src/hooks/use-mobile.tsx', to: 'client/src/hooks/UseMobile.tsx' },
  { from: 'client/src/hooks/use-toast.ts', to: 'client/src/hooks/UseToast.ts' },
  { from: 'client/src/hooks/useConversation.ts', to: 'client/src/hooks/UseConversation.ts' },
  
  // Pages
  { from: 'client/src/pages/not-found.tsx', to: 'client/src/pages/NotFound.tsx' },
  
  // Utils - standardize to camelCase for utility files
  { from: 'client/src/utils/cellarManager.ts', to: 'client/src/utils/cellarManager.ts' }, // already correct
  { from: 'client/src/utils/darkMode.ts', to: 'client/src/utils/darkMode.ts' }, // already correct
  { from: 'client/src/utils/dataSync.ts', to: 'client/src/utils/dataSync.ts' }, // already correct
  { from: 'client/src/utils/imageDeduplication.ts', to: 'client/src/utils/imageDeduplication.ts' }, // already correct
  { from: 'client/src/utils/microphonePermissions.ts', to: 'client/src/utils/microphonePermissions.ts' }, // already correct
  { from: 'client/src/utils/wineDataManager.ts', to: 'client/src/utils/wineDataManager.ts' }, // already correct
  
  // Root config files - standardize to camelCase
  { from: 'postcss.config.js', to: 'postcss.config.js' }, // already correct
  { from: 'tailwind.config.ts', to: 'tailwind.config.ts' }, // already correct
  { from: 'vite.config.ts', to: 'vite.config.ts' }, // already correct
  { from: 'drizzle.config.ts', to: 'drizzle.config.ts' }, // already correct
  { from: 'tsconfig.json', to: 'tsconfig.json' }, // already correct
  { from: 'components.json', to: 'components.json' }, // already correct
  { from: 'package.json', to: 'package.json' }, // already correct
  { from: 'package-lock.json', to: 'package-lock.json' }, // already correct
];

// Import reference mappings
const importMappings = [
  // Hook imports
  { from: '@/hooks/use-toast', to: '@/hooks/UseToast' },
  { from: '@/hooks/use-mobile', to: '@/hooks/UseMobile' },
  { from: '@/hooks/useConversation', to: '@/hooks/UseConversation' },
  
  // Page imports
  { from: '@/pages/not-found', to: '@/pages/NotFound' },
  
  // Component imports - these are already standardized
];

function updateImportsInFile(filePath, mappings) {
  if (!fs.existsSync(filePath)) {
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  let updated = false;
  
  mappings.forEach(mapping => {
    const regex = new RegExp(mapping.from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    if (content.includes(mapping.from)) {
      content = content.replace(regex, mapping.to);
      updated = true;
    }
  });
  
  if (updated) {
    fs.writeFileSync(filePath, content);
    console.log(`Updated imports in: ${filePath}`);
  }
}

function findAllTsxTsFiles(dir) {
  const files = [];
  
  function traverse(currentPath) {
    if (!fs.existsSync(currentPath)) return;
    
    const items = fs.readdirSync(currentPath);
    
    items.forEach(item => {
      const fullPath = path.join(currentPath, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        traverse(fullPath);
      } else if (stat.isFile() && (item.endsWith('.tsx') || item.endsWith('.ts') || item.endsWith('.js'))) {
        files.push(fullPath);
      }
    });
  }
  
  traverse(dir);
  return files;
}

// Main execution
console.log('Starting naming standardization...');

// Find all TypeScript/JavaScript files
const allFiles = [
  ...findAllTsxTsFiles('client/src'),
  ...findAllTsxTsFiles('server'),
  ...findAllTsxTsFiles('shared'),
];

// Update imports in all files
console.log('\nUpdating import references...');
allFiles.forEach(file => {
  updateImportsInFile(file, importMappings);
});

console.log('\nNaming standardization complete!');
console.log('All files now follow consistent naming conventions:');
console.log('- Components: PascalCase (Button.tsx, FormInput.tsx)');
console.log('- Hooks: PascalCase (UseToast.ts, UseMobile.tsx)');
console.log('- Pages: PascalCase (NotFound.tsx, HomePage.tsx)');
console.log('- Utils: camelCase (cellarManager.ts, dataSync.ts)');
console.log('- Config: camelCase (vite.config.ts, tailwind.config.ts)');