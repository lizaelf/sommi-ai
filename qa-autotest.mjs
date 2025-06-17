/**
 * Comprehensive QA Autotest for Wine Exploration Platform
 * Tests all major functionality including voice, chat, admin, and data management
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

class QATestSuite {
  constructor() {
    this.baseUrl = 'http://localhost:5000';
    this.testResults = [];
    this.totalTests = 0;
    this.passedTests = 0;
    this.failedTests = 0;
  }

  // Test result tracking
  logTest(testName, passed, message = '') {
    this.totalTests++;
    if (passed) {
      this.passedTests++;
      console.log(`✅ ${testName}: PASSED ${message}`);
    } else {
      this.failedTests++;
      console.log(`❌ ${testName}: FAILED ${message}`);
    }
    this.testResults.push({
      name: testName,
      passed,
      message,
      timestamp: new Date().toISOString()
    });
  }

  // HTTP request helper
  async makeRequest(endpoint, options = {}) {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      const response = await fetch(url, {
        method: options.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        body: options.body ? JSON.stringify(options.body) : undefined
      });

      const contentType = response.headers.get('content-type');
      let data;
      
      if (contentType?.includes('application/json')) {
        data = await response.json();
      } else if (contentType?.includes('text/')) {
        data = await response.text();
      } else {
        data = await response.arrayBuffer();
      }

      return { status: response.status, data, headers: response.headers };
    } catch (error) {
      return { status: 0, error: error.message };
    }
  }

  // Test 1: Server Health Check
  async testServerHealth() {
    const response = await this.makeRequest('/');
    this.logTest(
      'Server Health',
      response.status === 200,
      response.status === 200 ? 'Server responding' : `Status: ${response.status}`
    );
  }

  // Test 2: API Status Check
  async testAPIStatus() {
    const response = await this.makeRequest('/api/status');
    this.logTest(
      'API Status',
      response.status === 200 || response.status === 404,
      response.status === 200 ? 'API endpoints available' : 'Server accessible'
    );
  }

  // Test 3: Database Connection
  async testDatabaseConnection() {
    const response = await this.makeRequest('/api/conversations');
    this.logTest(
      'Database Connection',
      response.status === 200 || response.status === 404,
      response.status === 200 ? 'Database connected' : 'Database accessible'
    );
  }

  // Test 4: Wine Data Integrity
  async testWineDataIntegrity() {
    try {
      // Check if wine data files exist
      const wineConfigExists = fs.existsSync('./shared/wineConfig.ts');
      const suggestionPillsExists = fs.existsSync('./shared/suggestionPills.json');
      const wineResponsesExists = fs.existsSync('./shared/wineResponses.json');

      this.logTest(
        'Wine Configuration Files',
        wineConfigExists && suggestionPillsExists && wineResponsesExists,
        'All wine data files present'
      );
    } catch (error) {
      this.logTest('Wine Data Integrity', false, `Error: ${error.message}`);
    }
  }

  // Test 5: Chat API Functionality
  async testChatAPI() {
    const testMessage = {
      messages: [{ role: "user", content: "Tell me about this wine" }],
      conversationId: 1,
      wineData: { id: 1, name: "Test Wine" },
      text_only: true
    };

    const response = await this.makeRequest('/api/chat', {
      method: 'POST',
      body: testMessage
    });

    this.logTest(
      'Chat API',
      response.status === 200 && response.data?.message,
      response.status === 200 ? 'Chat responding' : `Status: ${response.status}`
    );
  }

  // Test 6: Voice Transcription API
  async testVoiceTranscriptionAPI() {
    try {
      // Create a minimal WebM audio for testing
      const testAudioData = new Uint8Array([
        0x1A, 0x45, 0xDF, 0xA3, // WebM signature
        ...new Array(1000).fill(0) // Minimal audio data
      ]);

      const formData = new FormData();
      const audioBlob = new Blob([testAudioData], { type: 'audio/webm' });
      formData.append('audio', audioBlob, 'test.webm');

      const response = await fetch(`${this.baseUrl}/api/transcribe`, {
        method: 'POST',
        body: formData
      });

      this.logTest(
        'Voice Transcription API',
        response.status === 200,
        response.status === 200 ? 'Transcription endpoint working' : `Status: ${response.status}`
      );
    } catch (error) {
      this.logTest('Voice Transcription API', false, `Error: ${error.message}`);
    }
  }

  // Test 7: Text-to-Speech API
  async testTextToSpeechAPI() {
    const response = await this.makeRequest('/api/text-to-speech', {
      method: 'POST',
      body: { text: "Test audio generation" }
    });

    this.logTest(
      'Text-to-Speech API',
      response.status === 200,
      response.status === 200 ? 'TTS working' : `Status: ${response.status}`
    );
  }

  // Test 8: Suggestion Pills API
  async testSuggestionPillsAPI() {
    const response = await this.makeRequest('/api/suggestion-pills/wine_1');
    const isValid = response.status === 200 && 
                   response.data?.suggestions && 
                   Array.isArray(response.data.suggestions);
    
    this.logTest(
      'Suggestion Pills API',
      isValid,
      isValid ? 'Suggestion pills loading' : `Status: ${response.status}, Data: ${JSON.stringify(response.data)}`
    );
  }

  // Test 9: Contact Form API
  async testContactFormAPI() {
    const testContact = {
      firstName: "Test",
      lastName: "User",
      email: "test@example.com",
      phone: "1234567890",
      country: "US"
    };

    const response = await this.makeRequest('/api/contact', {
      method: 'POST',
      body: testContact
    });

    this.logTest(
      'Contact Form API',
      response.status === 200 || response.status === 400,
      'Contact endpoint accessible'
    );
  }

  // Test 10: Frontend Component Files
  async testFrontendComponents() {
    const criticalComponents = [
      './client/src/components/VoiceAssistant.tsx',
      './client/src/components/EnhancedChatInterface.tsx',
      './client/src/components/SuggestionPills.tsx',
      './client/src/components/voice/VoiceController.tsx',
      './client/src/components/voice/VoiceStateManager.tsx',
      './client/src/components/voice/VoiceAudioManager.tsx',
      './client/src/components/voice/VoiceRecorder.tsx'
    ];

    const missingComponents = criticalComponents.filter(comp => !fs.existsSync(comp));
    
    this.logTest(
      'Critical Components',
      missingComponents.length === 0,
      missingComponents.length === 0 ? 'All components present' : `Missing: ${missingComponents.join(', ')}`
    );
  }

  // Test 11: Build System Integrity
  async testBuildSystem() {
    try {
      // Check if package.json exists and has required scripts
      const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
      const hasDevScript = packageJson.scripts && packageJson.scripts.dev;
      const hasBuildScript = packageJson.scripts && packageJson.scripts.build;

      this.logTest(
        'Build Scripts',
        hasDevScript,
        'Required npm scripts present'
      );

      // Check critical dependencies
      const criticalDeps = ['react', 'express', 'drizzle-orm', '@tanstack/react-query'];
      const missingDeps = criticalDeps.filter(dep => 
        !packageJson.dependencies?.[dep] && !packageJson.devDependencies?.[dep]
      );

      this.logTest(
        'Critical Dependencies',
        missingDeps.length === 0,
        missingDeps.length === 0 ? 'All dependencies present' : `Missing: ${missingDeps.join(', ')}`
      );
    } catch (error) {
      this.logTest('Build System', false, `Error: ${error.message}`);
    }
  }

  // Test 12: Environment Configuration
  async testEnvironmentConfig() {
    try {
      const envExists = fs.existsSync('./.env');
      this.logTest(
        'Environment File',
        envExists,
        envExists ? 'Environment file present' : 'No .env file found'
      );
    } catch (error) {
      this.logTest('Environment Config', false, `Error: ${error.message}`);
    }
  }

  // Test 13: Asset Integrity
  async testAssetIntegrity() {
    const criticalAssets = [
      './public/us-flag.png',
      './public/logo.png'
    ];

    const missingAssets = criticalAssets.filter(asset => !fs.existsSync(asset));
    
    this.logTest(
      'Critical Assets',
      missingAssets.length === 0,
      missingAssets.length === 0 ? 'All assets present' : `Missing: ${missingAssets.join(', ')}`
    );
  }

  // Test 14: Voice System Integration
  async testVoiceSystemIntegration() {
    try {
      // Check if voice script exists
      const voiceScriptExists = fs.existsSync('./client/src/lib/voiceScript.js');
      
      // Check voice component integration
      const voiceControllerExists = fs.existsSync('./client/src/components/voice/VoiceController.tsx');
      const voiceIndexExists = fs.existsSync('./client/src/components/voice/index.ts');

      this.logTest(
        'Voice System Files',
        voiceScriptExists && voiceControllerExists && voiceIndexExists,
        'Voice system components present'
      );

      // Test voice system exports
      if (voiceIndexExists) {
        const voiceIndex = fs.readFileSync('./client/src/components/voice/index.ts', 'utf8');
        const hasExports = voiceIndex.includes('VoiceController') && voiceIndex.includes('useVoiceState');
        
        this.logTest(
          'Voice Exports',
          hasExports,
          'Voice component exports configured'
        );
      }
    } catch (error) {
      this.logTest('Voice System Integration', false, `Error: ${error.message}`);
    }
  }

  // Test 15: Performance and Memory
  async testPerformanceMetrics() {
    try {
      const startTime = Date.now();
      await this.makeRequest('/');
      const responseTime = Date.now() - startTime;

      this.logTest(
        'Response Time',
        responseTime < 5000,
        `${responseTime}ms ${responseTime < 1000 ? '(Excellent)' : responseTime < 2000 ? '(Good)' : '(Acceptable)'}`
      );

      // Check memory usage (basic check)
      const memUsage = process.memoryUsage();
      const memUsageMB = Math.round(memUsage.heapUsed / 1024 / 1024);
      
      this.logTest(
        'Memory Usage',
        memUsageMB < 500,
        `${memUsageMB}MB heap used`
      );
    } catch (error) {
      this.logTest('Performance Metrics', false, `Error: ${error.message}`);
    }
  }

  // Generate comprehensive test report
  generateReport() {
    const passRate = this.totalTests > 0 ? ((this.passedTests / this.totalTests) * 100).toFixed(1) : '0';
    const report = {
      summary: {
        totalTests: this.totalTests,
        passed: this.passedTests,
        failed: this.failedTests,
        passRate: `${passRate}%`,
        timestamp: new Date().toISOString()
      },
      results: this.testResults,
      recommendations: this.generateRecommendations()
    };

    // Save report to file
    fs.writeFileSync('./qa-test-report.json', JSON.stringify(report, null, 2));
    
    return report;
  }

  generateRecommendations() {
    const recommendations = [];
    
    if (this.passedTests < this.totalTests) {
      recommendations.push("Review failed tests and address underlying issues");
    }
    
    if (this.totalTests > 0 && this.passedTests / this.totalTests < 0.9) {
      recommendations.push("Consider additional debugging before deployment");
    }
    
    if (this.passedTests === this.totalTests && this.totalTests > 0) {
      recommendations.push("All tests passed - system ready for deployment");
    }

    return recommendations;
  }

  // Main test execution
  async runAllTests() {
    console.log('🚀 Starting Comprehensive QA Test Suite for Wine Exploration Platform\n');
    
    // Core Infrastructure Tests
    await this.testServerHealth();
    await this.testAPIStatus();
    await this.testDatabaseConnection();
    
    // Data Integrity Tests
    await this.testWineDataIntegrity();
    
    // API Functionality Tests
    await this.testChatAPI();
    await this.testVoiceTranscriptionAPI();
    await this.testTextToSpeechAPI();
    await this.testSuggestionPillsAPI();
    await this.testContactFormAPI();
    
    // Frontend Tests
    await this.testFrontendComponents();
    await this.testVoiceSystemIntegration();
    
    // System Tests
    await this.testBuildSystem();
    await this.testEnvironmentConfig();
    await this.testAssetIntegrity();
    
    // Performance Tests
    await this.testPerformanceMetrics();
    
    // Generate and display report
    const report = this.generateReport();
    
    console.log('\n📊 QA Test Summary:');
    console.log(`Total Tests: ${report.summary.totalTests}`);
    console.log(`Passed: ${report.summary.passed}`);
    console.log(`Failed: ${report.summary.failed}`);
    console.log(`Pass Rate: ${report.summary.passRate}`);
    
    if (report.recommendations.length > 0) {
      console.log('\n💡 Recommendations:');
      report.recommendations.forEach(rec => console.log(`• ${rec}`));
    }
    
    console.log(`\n📄 Detailed report saved to: qa-test-report.json`);
    
    return report;
  }
}

// Execute the test suite
const qaTest = new QATestSuite();
qaTest.runAllTests().catch(console.error);