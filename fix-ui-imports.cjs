const fs = require('fs');
const path = require('path');

const importMappings = {
  '@/components/ui/StandardToast': '@/components/ui/feedback/StandardToast',
  '@/components/ui/FormInput': '@/components/ui/forms/FormInput',
  '@/components/ui/ContactInput': '@/components/ui/forms/ContactInput',
  '@/components/ui/Input': '@/components/ui/forms/Input',
  '@/components/ui/input': '@/components/ui/forms/input',
  '@/components/ui/textarea': '@/components/ui/forms/textarea',
  '@/components/ui/SearchInterface': '@/components/ui/forms/SearchInterface',
  '@/components/ui/Breadcrumb': '@/components/ui/navigation/Breadcrumb',
  '@/components/ui/DropdownMenu': '@/components/ui/navigation/DropdownMenu',
  '@/components/ui/Alert': '@/components/ui/feedback/Alert',
  '@/components/ui/Toast': '@/components/ui/feedback/Toast',
  '@/components/ui/Toaster': '@/components/ui/feedback/Toaster',
  '@/components/ui/LoadingSpinner': '@/components/ui/feedback/LoadingSpinner',
  '@/components/ui/Skeleton': '@/components/ui/feedback/Skeleton',
  '@/components/ui/BottomSheet': '@/components/bottom-sheet/BottomSheet',
  '@/components/ui/layout/BottomSheet': '@/components/bottom-sheet/BottomSheet',
  '@/components/ui/Separator': '@/components/ui/layout/Separator',
  '@/components/ui/card': '@/components/ui/layout/card',
  '@/components/ui/Table': '@/components/ui/data-display/Table',
  '@/components/ui/Rating': '@/components/ui/data-display/Rating',
  '@/components/ui/badge': '@/components/ui/data-display/badge',
  '@/components/ui/WineCard': '@/components/ui/data-display/WineCard',
  '@/components/ui/WineCardComponent': '@/components/ui/data-display/WineCardComponent',
  '@/components/ui/ConfirmationDialog': '@/components/bottom-sheet/ConfirmationDialog',
  '@/components/ui/overlays/ConfirmationDialog': '@/components/bottom-sheet/ConfirmationDialog',
  '@/components/ui/Tooltip': '@/components/ui/overlays/Tooltip',
  '@/components/ui/Select': '@/components/ui/primitives/Select',
  '@/components/ui/Switch': '@/components/ui/primitives/Switch',
  '@/components/ui/Toggle': '@/components/ui/primitives/Toggle',
  '@/components/ui/Button': '@/components/ui/buttons/Button',
  '@/components/ui/IconButton': '@/components/ui/buttons/IconButton',
  '@/components/ui/SectionHeaderButton': '@/components/ui/buttons/SectionHeaderButton',
  '@/components/ui/TextGenerateEffect': '@/components/ui/misc/TextGenerateEffect',
  '@/components/AuthBottomSheet': '@/components/bottom-sheet/AuthBottomSheet',
  '@/components/VoiceBottomSheet': '@/components/bottom-sheet/VoiceBottomSheet',
  '@/components/voice/VoiceAssistantBottomSheet': '@/components/bottom-sheet/VoiceAssistantBottomSheet',
  './ui/Button': './ui/buttons/Button',
  './ui/IconButton': './ui/buttons/IconButton',
  './ui/BottomSheet': '../bottom-sheet/BottomSheet',
  './ui/layout/BottomSheet': '../bottom-sheet/BottomSheet',
  './ui/StandardToast': './ui/feedback/StandardToast',
  './ui/LoadingSpinner': './ui/feedback/LoadingSpinner',
  './ui/SearchInterface': './ui/forms/SearchInterface',
  '../ui/layout/BottomSheet': '../bottom-sheet/BottomSheet'
};

function updateImports(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let updated = false;
    
    for (const [oldPath, newPath] of Object.entries(importMappings)) {
      const regex = new RegExp(oldPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      if (content.includes(oldPath)) {
        content = content.replace(regex, newPath);
        updated = true;
      }
    }
    
    if (updated) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Updated: ${filePath}`);
    }
  } catch (error) {
    console.error(`Error updating ${filePath}:`, error.message);
  }
}

function findFiles(dir, extensions = ['.tsx', '.ts']) {
  const files = [];
  
  function traverse(currentDir) {
    const items = fs.readdirSync(currentDir);
    
    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        traverse(fullPath);
      } else if (stat.isFile() && extensions.some(ext => item.endsWith(ext))) {
        files.push(fullPath);
      }
    }
  }
  
  traverse(dir);
  return files;
}

// Update all TypeScript files
const files = findFiles('client/src');
files.forEach(updateImports);

console.log('Import path updates complete!');