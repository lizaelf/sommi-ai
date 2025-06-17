#!/usr/bin/env node

/**
 * Final Deployment Readiness Verification
 * Confirms the wine exploration platform is ready for production deployment
 */

import fs from 'fs';
import { execSync } from 'child_process';

class DeploymentVerification {
  constructor() {
    this.checks = [];
    this.criticalIssues = [];
    this.warnings = [];
  }

  log(status, message, level = 'info') {
    const symbols = { pass: '✅', fail: '❌', warn: '⚠️', info: 'ℹ️' };
    console.log(`${symbols[status]} ${message}`);
    
    this.checks.push({ status, message, level });
    
    if (status === 'fail' && level === 'critical') {
      this.criticalIssues.push(message);
    } else if (status === 'warn') {
      this.warnings.push(message);
    }
  }

  // Verify QA test results
  verifyQAResults() {
    try {
      const qaReport = JSON.parse(fs.readFileSync('./qa-test-report.json', 'utf8'));
      const passRate = parseFloat(qaReport.summary.passRate);
      
      if (passRate === 100) {
        this.log('pass', `QA Tests: ${qaReport.summary.passRate} (${qaReport.summary.passed}/${qaReport.summary.totalTests})`);
      } else if (passRate >= 95) {
        this.log('warn', `QA Tests: ${qaReport.summary.passRate} - Minor issues detected`);
      } else {
        this.log('fail', `QA Tests: ${qaReport.summary.passRate} - Critical issues need resolution`, 'critical');
      }
    } catch (error) {
      this.log('fail', 'QA test report not found or invalid', 'critical');
    }
  }

  // Check voice system integrity
  verifyVoiceSystem() {
    const voiceComponents = [
      './client/src/components/VoiceAssistant.tsx',
      './client/src/components/voice/VoiceController.tsx',
      './client/src/components/voice/VoiceStateManager.tsx',
      './client/src/components/voice/VoiceAudioManager.tsx',
      './client/src/components/voice/VoiceRecorder.tsx',
      './client/src/components/voice/index.ts'
    ];

    const missingComponents = voiceComponents.filter(comp => !fs.existsSync(comp));
    
    if (missingComponents.length === 0) {
      this.log('pass', 'Voice System: All components present');
    } else {
      this.log('fail', `Voice System: Missing components - ${missingComponents.join(', ')}`, 'critical');
    }

    // Check voice script integration
    if (fs.existsSync('./client/src/lib/voiceScript.js')) {
      this.log('pass', 'Voice Script: Browser integration configured');
    } else {
      this.log('fail', 'Voice Script: Missing browser voice integration', 'critical');
    }
  }

  // Verify backend APIs
  verifyBackendAPIs() {
    const criticalEndpoints = [
      'chat completion',
      'voice transcription', 
      'text-to-speech',
      'suggestion pills',
      'contact form'
    ];

    // Check if server routes file exists and contains endpoints
    if (fs.existsSync('./server/routes.ts')) {
      const routesContent = fs.readFileSync('./server/routes.ts', 'utf8');
      
      const hasChat = routesContent.includes('/api/chat');
      const hasTranscribe = routesContent.includes('/api/transcribe');
      const hasTTS = routesContent.includes('/api/text-to-speech');
      const hasSuggestions = routesContent.includes('/api/suggestion-pills');
      const hasContact = routesContent.includes('/api/contact');

      if (hasChat && hasTranscribe && hasTTS && hasSuggestions && hasContact) {
        this.log('pass', 'Backend APIs: All critical endpoints configured');
      } else {
        this.log('fail', 'Backend APIs: Missing critical endpoints', 'critical');
      }
    } else {
      this.log('fail', 'Backend APIs: Routes configuration missing', 'critical');
    }
  }

  // Check database schema
  verifyDatabaseSchema() {
    if (fs.existsSync('./shared/schema.ts')) {
      const schemaContent = fs.readFileSync('./shared/schema.ts', 'utf8');
      
      const hasConversations = schemaContent.includes('conversations');
      const hasMessages = schemaContent.includes('messages');
      const hasSuggestionPills = schemaContent.includes('usedSuggestionPills');

      if (hasConversations && hasMessages && hasSuggestionPills) {
        this.log('pass', 'Database Schema: All tables defined');
      } else {
        this.log('warn', 'Database Schema: Some tables may be missing');
      }
    } else {
      this.log('fail', 'Database Schema: Schema file missing', 'critical');
    }
  }

  // Verify environment configuration
  verifyEnvironmentConfig() {
    if (fs.existsSync('./.env')) {
      this.log('pass', 'Environment: Configuration file present');
    } else {
      this.log('warn', 'Environment: No .env file - ensure production environment is configured');
    }

    // Check package.json for required scripts
    if (fs.existsSync('./package.json')) {
      const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
      
      if (packageJson.scripts?.dev && packageJson.scripts?.build) {
        this.log('pass', 'Build Scripts: Development and build scripts configured');
      } else {
        this.log('fail', 'Build Scripts: Missing required npm scripts', 'critical');
      }
    }
  }

  // Check wine data integrity
  verifyWineData() {
    const wineFiles = [
      './shared/wineConfig.ts',
      './shared/suggestionPills.json',
      './shared/wineResponses.json'
    ];

    const missingFiles = wineFiles.filter(file => !fs.existsSync(file));
    
    if (missingFiles.length === 0) {
      this.log('pass', 'Wine Data: All configuration files present');
    } else {
      this.log('fail', `Wine Data: Missing files - ${missingFiles.join(', ')}`, 'critical');
    }
  }

  // Verify static assets
  verifyStaticAssets() {
    const criticalAssets = [
      './public/logo.png',
      './public/us-flag.png'
    ];

    const missingAssets = criticalAssets.filter(asset => !fs.existsSync(asset));
    
    if (missingAssets.length === 0) {
      this.log('pass', 'Static Assets: Critical assets present');
    } else {
      this.log('warn', `Static Assets: Missing assets - ${missingAssets.join(', ')}`);
    }
  }

  // Check TypeScript configuration
  verifyTypeScriptConfig() {
    if (fs.existsSync('./tsconfig.json')) {
      this.log('pass', 'TypeScript: Configuration present');
    } else {
      this.log('warn', 'TypeScript: No tsconfig.json found');
    }

    if (fs.existsSync('./vite.config.ts')) {
      this.log('pass', 'Vite: Build configuration present');
    } else {
      this.log('fail', 'Vite: Build configuration missing', 'critical');
    }
  }

  // Generate deployment summary
  generateDeploymentSummary() {
    const totalChecks = this.checks.length;
    const passedChecks = this.checks.filter(check => check.status === 'pass').length;
    const failedChecks = this.checks.filter(check => check.status === 'fail').length;
    const warnings = this.checks.filter(check => check.status === 'warn').length;

    console.log('\n📋 DEPLOYMENT READINESS SUMMARY');
    console.log('=====================================');
    console.log(`Total Checks: ${totalChecks}`);
    console.log(`Passed: ${passedChecks}`);
    console.log(`Failed: ${failedChecks}`);
    console.log(`Warnings: ${warnings}`);

    if (this.criticalIssues.length === 0) {
      console.log('\n🚀 STATUS: READY FOR DEPLOYMENT');
      console.log('All critical checks passed. The wine exploration platform is ready for production.');
    } else {
      console.log('\n🛑 STATUS: NOT READY FOR DEPLOYMENT');
      console.log('Critical issues must be resolved before deployment:');
      this.criticalIssues.forEach(issue => console.log(`  • ${issue}`));
    }

    if (this.warnings.length > 0) {
      console.log('\n⚠️  WARNINGS:');
      this.warnings.forEach(warning => console.log(`  • ${warning}`));
    }

    // Save detailed report
    const report = {
      status: this.criticalIssues.length === 0 ? 'READY' : 'NOT_READY',
      timestamp: new Date().toISOString(),
      summary: {
        total: totalChecks,
        passed: passedChecks,
        failed: failedChecks,
        warnings: warnings
      },
      checks: this.checks,
      criticalIssues: this.criticalIssues,
      warnings: this.warnings
    };

    fs.writeFileSync('./deployment-readiness-report.json', JSON.stringify(report, null, 2));
    console.log('\n📄 Detailed report saved to: deployment-readiness-report.json');
  }

  // Run all verification checks
  async runVerification() {
    console.log('🔍 Wine Exploration Platform - Deployment Readiness Verification\n');

    this.verifyQAResults();
    this.verifyVoiceSystem();
    this.verifyBackendAPIs();
    this.verifyDatabaseSchema();
    this.verifyEnvironmentConfig();
    this.verifyWineData();
    this.verifyStaticAssets();
    this.verifyTypeScriptConfig();

    this.generateDeploymentSummary();
  }
}

// Execute verification
const verification = new DeploymentVerification();
verification.runVerification().catch(console.error);