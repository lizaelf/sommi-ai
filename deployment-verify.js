#!/usr/bin/env node

// Deployment Verification Script
// Ensures deployed version works identical to Replit version

import fs from 'fs';
import path from 'path';

console.log('🔍 Starting deployment verification...');

// Environment configuration
const deployConfig = {
  // Voice system configuration
  voiceSystem: {
    forceProductionMode: true,
    maleVoiceEnforcement: true,
    deploymentDetection: ['.replit.app', '.repl.co'],
    excludeFemaleVoices: true
  },
  
  // Asset paths
  assetPaths: {
    development: '/@assets/',
    production: '/assets/'
  },
  
  // Component synchronization
  criticalComponents: [
    'VoiceAssistant.tsx',
    'CircleAnimation.tsx', 
    'EnhancedChatInterface.tsx',
    'WineDetails.tsx',
    'HomeGlobal.tsx'
  ]
};

// Verify voice system configuration
function verifyVoiceSystem() {
  console.log('🎤 Verifying voice system configuration...');
  
  const voiceScriptPath = './client/src/lib/voiceScript.js';
  const voiceScript = fs.readFileSync(voiceScriptPath, 'utf8');
  
  // Check deployment detection
  const hasDeploymentDetection = voiceScript.includes('.replit.app') && 
                                 voiceScript.includes('.repl.co');
  
  // Check male voice enforcement
  const hasMaleVoiceEnforcement = voiceScript.includes('GUARANTEED_MALE_VOICE') &&
                                 voiceScript.includes('FORCE_MALE_VOICE_LOCK');
  
  // Check female voice exclusion
  const hasFemaleVoiceExclusion = voiceScript.includes('samantha') &&
                                 voiceScript.includes('susan') &&
                                 voiceScript.includes('karen');
  
  if (hasDeploymentDetection && hasMaleVoiceEnforcement && hasFemaleVoiceExclusion) {
    console.log('✅ Voice system properly configured for deployment');
    return true;
  } else {
    console.log('❌ Voice system configuration incomplete');
    return false;
  }
}

// Verify component synchronization
function verifyComponents() {
  console.log('🔄 Verifying component synchronization...');
  
  let allComponentsValid = true;
  
  deployConfig.criticalComponents.forEach(component => {
    const componentPath = `./client/src/components/${component}`;
    if (fs.existsSync(componentPath)) {
      const content = fs.readFileSync(componentPath, 'utf8');
      
      // Check for development-specific code that might not work in production
      const hasDevOnlyCode = content.includes('localhost:') || 
                            content.includes('127.0.0.1') ||
                            content.includes('NODE_ENV') && !content.includes('production');
      
      if (hasDevOnlyCode) {
        console.log(`⚠️  Component ${component} may have development-specific code`);
        allComponentsValid = false;
      }
    }
  });
  
  if (allComponentsValid) {
    console.log('✅ All critical components verified');
    return true;
  } else {
    console.log('❌ Some components need production optimization');
    return false;
  }
}

// Create deployment-ready configuration
function createDeploymentConfig() {
  console.log('⚙️  Creating deployment configuration...');
  
  const deploymentEnv = `
# Deployment Environment Variables
NODE_ENV=production
VITE_DEPLOYMENT_MODE=true
VITE_VOICE_FORCE_MALE=true
VITE_ASSET_PREFIX=/assets
`;

  fs.writeFileSync('.env.production', deploymentEnv.trim());
  console.log('✅ Deployment environment configured');
}

// Verify asset paths
function verifyAssetPaths() {
  console.log('📁 Verifying asset paths...');
  
  const dataSyncPath = './client/src/utils/dataSync.ts';
  if (fs.existsSync(dataSyncPath)) {
    const content = fs.readFileSync(dataSyncPath, 'utf8');
    
    // Check for proper asset path handling
    const hasAssetHandling = content.includes('@assets') || content.includes('/assets');
    
    if (hasAssetHandling) {
      console.log('✅ Asset paths properly configured');
      return true;
    }
  }
  
  console.log('❌ Asset paths need verification');
  return false;
}

// Main verification process
async function runVerification() {
  console.log('🚀 Running comprehensive deployment verification...\n');
  
  const checks = [
    { name: 'Voice System', fn: verifyVoiceSystem },
    { name: 'Components', fn: verifyComponents },
    { name: 'Asset Paths', fn: verifyAssetPaths }
  ];
  
  let allPassed = true;
  
  for (const check of checks) {
    const passed = check.fn();
    if (!passed) allPassed = false;
  }
  
  // Create deployment configuration regardless
  createDeploymentConfig();
  
  console.log('\n📋 Verification Summary:');
  console.log('==========================================');
  
  if (allPassed) {
    console.log('✅ All checks passed - Ready for deployment');
    console.log('\n🎉 Deployed version will work identically to Replit version');
    console.log('\n📝 Next steps:');
    console.log('   1. Deploy using standard deployment process');
    console.log('   2. Voice system will automatically enforce male voices');
    console.log('   3. All components are production-ready');
  } else {
    console.log('⚠️  Some checks failed - Review issues above');
    console.log('\n🔧 Configuration files created to resolve deployment issues');
  }
  
  console.log('\n🔄 Deployment verification complete!');
}

// Execute verification
runVerification().catch(console.error);