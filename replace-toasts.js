#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

// Files that need toast replacement
const filesToUpdate = [
  'client/src/pages/end-user/WineScan.tsx',
  'client/src/pages/end-user/WineEdit.tsx',
  'client/src/pages/admin/TenantAdmin.tsx',
  'client/src/pages/admin/TenantCreate.tsx',
  'client/src/pages/admin/TenantAdminRefactored.tsx',
  'client/src/pages/admin/AdminPage.tsx',
  'client/src/components/VoiceAssistant.tsx',
  'client/src/components/chat/ChatInterface.tsx',
  'client/src/components/chat/EnhancedChatInterface.tsx'
];

// Function to update imports
function updateImports(content) {
  return content.replace(
    /import { useToast } from "@\/hooks\/UseToast";?/g,
    'import { useStandardToast } from "@/components/ui/StandardToast";'
  );
}

// Function to update hook usage
function updateHookUsage(content) {
  // Replace { toast } = useToast() with appropriate destructuring
  content = content.replace(
    /const { toast } = useToast\(\);?/g,
    'const { toastSuccess, toastError, toastInfo } = useStandardToast();'
  );
  
  // Handle cases where only toast is used
  content = content.replace(
    /const toast = useToast\(\)\.toast;?/g,
    'const { toastInfo } = useStandardToast();'
  );
  
  return content;
}

// Function to replace toast calls
function replaceToastCalls(content) {
  // Replace error toasts (destructive variant)
  content = content.replace(
    /toast\(\{\s*title:\s*["']Error["'],?\s*description:\s*([^,}]+),?\s*variant:\s*["']destructive["'],?\s*\}\);?/g,
    'toastError($1);'
  );
  
  // Replace error toasts without title
  content = content.replace(
    /toast\(\{\s*description:\s*([^,}]+),?\s*variant:\s*["']destructive["'],?\s*\}\);?/g,
    'toastError($1);'
  );
  
  // Replace success toasts with title and description
  content = content.replace(
    /toast\(\{\s*title:\s*([^,}]+),?\s*description:\s*([^,}]+),?\s*\}\);?/g,
    'toastSuccess($2, $1);'
  );
  
  // Replace simple success toasts (title only)
  content = content.replace(
    /toast\(\{\s*title:\s*([^,}]+),?\s*\}\);?/g,
    'toastInfo($1);'
  );
  
  // Replace JSX description toasts
  content = content.replace(
    /toast\(\{\s*description:\s*\(\s*<[^>]*>\s*([^<]+)\s*<\/[^>]*>\s*\),?[^}]*\}\);?/g,
    'toastInfo("$1");'
  );
  
  // Replace simple description toasts
  content = content.replace(
    /toast\(\{\s*description:\s*([^,}]+),?[^}]*\}\);?/g,
    'toastInfo($1);'
  );
  
  // Replace multiline toast calls
  content = content.replace(
    /toast\(\{\s*[\s\S]*?title:\s*([^,}]+)[\s\S]*?description:\s*([^,}]+)[\s\S]*?\}\);?/g,
    'toastSuccess($2, $1);'
  );
  
  return content;
}

// Process each file
filesToUpdate.forEach(filePath => {
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Apply transformations
    content = updateImports(content);
    content = updateHookUsage(content);
    content = replaceToastCalls(content);
    
    // Write back to file
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated: ${filePath}`);
  } else {
    console.log(`File not found: ${filePath}`);
  }
});

console.log('Toast replacement complete!');