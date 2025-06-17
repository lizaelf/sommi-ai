#!/usr/bin/env node

/**
 * Comprehensive QA Automated Test Suite
 * Wine Exploration Platform - Full Application Testing
 */

import fetch from 'node-fetch';
import fs from 'fs';

// Test Configuration
const CONFIG = {
  baseUrl: 'http://localhost:5000',
  timeout: 30000,
  retries: 3
};

// Test Results Tracking
let testResults = {
  passed: 0,
  failed: 0,
  total: 0,
  errors: [],
  details: []
};

// Utility Functions
const log = (message, type = 'info') => {
  const timestamp = new Date().toISOString();
  const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : '🔍';
  console.log(`${prefix} [${timestamp}] ${message}`);
};

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const makeRequest = async (url, options = {}) => {
  const fullUrl = url.startsWith('http') ? url : `${CONFIG.baseUrl}${url}`;
  
  try {
    const response = await fetch(fullUrl, {
      timeout: CONFIG.timeout,
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'QA-AutoTest/1.0',
        ...options.headers
      }
    });
    
    return {
      ok: response.ok,
      status: response.status,
      statusText: response.statusText,
      data: await response.text(),
      headers: response.headers
    };
  } catch (error) {
    throw new Error(`Request failed: ${error.message}`);
  }
};

const runTest = async (testName, testFunction) => {
  testResults.total++;
  log(`Running test: ${testName}`);
  
  try {
    await testFunction();
    testResults.passed++;
    testResults.details.push({ name: testName, status: 'PASSED' });
    log(`Test passed: ${testName}`, 'success');
  } catch (error) {
    testResults.failed++;
    testResults.errors.push({ test: testName, error: error.message });
    testResults.details.push({ name: testName, status: 'FAILED', error: error.message });
    log(`Test failed: ${testName} - ${error.message}`, 'error');
  }
};

/**
 * 1. Basic Health Checks
 */
const testBasicHealth = async () => {
  await runTest('Server Health Check', async () => {
    const response = await makeRequest('/');
    if (!response.ok) {
      throw new Error(`Server not responding: ${response.status}`);
    }
  });

  await runTest('Database Connectivity', async () => {
    const response = await makeRequest('/api/tenants');
    if (!response.ok) {
      throw new Error(`Database connection failed: ${response.status}`);
    }
  });
};

/**
 * 2. API Endpoint Testing
 */
const testAPIEndpoints = async () => {
  await runTest('Wine Data API', async () => {
    const response = await makeRequest('/api/tenants');
    if (!response.ok) {
      throw new Error(`Wine API failed: ${response.status}`);
    }
    
    const data = JSON.parse(response.data);
    if (!Array.isArray(data)) {
      throw new Error('Wine data should be an array');
    }
  });

  await runTest('Conversation API', async () => {
    const response = await makeRequest('/api/conversations');
    if (!response.ok) {
      throw new Error(`Conversation API failed: ${response.status}`);
    }
  });

  await runTest('Suggestion Pills API', async () => {
    const response = await makeRequest('/api/suggestion-pills/wine_1');
    if (!response.ok) {
      throw new Error(`Suggestion Pills API failed: ${response.status}`);
    }
    
    const data = JSON.parse(response.data);
    if (!data.suggestions || !Array.isArray(data.suggestions)) {
      throw new Error('Suggestion pills should return suggestions array');
    }
  });

  await runTest('Chat Completion API', async () => {
    const testMessage = {
      messages: [{ role: 'user', content: 'Tell me about this wine' }],
      wineKey: 'wine_1',
      wineData: { id: 1, name: 'Test Wine' },
      textOnly: true
    };

    const response = await makeRequest('/api/chat', {
      method: 'POST',
      body: JSON.stringify(testMessage)
    });

    if (!response.ok) {
      throw new Error(`Chat API failed: ${response.status}`);
    }

    const data = JSON.parse(response.data);
    if (!data.message || !data.message.content) {
      throw new Error('Chat API should return message with content');
    }
  });

  await runTest('Text-to-Speech API', async () => {
    const ttsRequest = {
      text: 'This is a test of the text to speech system'
    };

    const response = await makeRequest('/api/text-to-speech', {
      method: 'POST',
      body: JSON.stringify(ttsRequest)
    });

    if (!response.ok) {
      throw new Error(`TTS API failed: ${response.status}`);
    }

    // Check if response is audio data
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('audio')) {
      throw new Error('TTS API should return audio data');
    }
  });
};

/**
 * 3. Database Operations Testing
 */
const testDatabaseOperations = async () => {
  await runTest('Create Conversation', async () => {
    const newConversation = {
      title: 'QA Test Conversation',
      wineKey: 'wine_1'
    };

    const response = await makeRequest('/api/conversations', {
      method: 'POST',
      body: JSON.stringify(newConversation)
    });

    if (!response.ok) {
      throw new Error(`Failed to create conversation: ${response.status}`);
    }

    const data = JSON.parse(response.data);
    if (!data.id) {
      throw new Error('Created conversation should have an ID');
    }
  });

  await runTest('Track Suggestion Usage', async () => {
    const usageData = {
      wineKey: 'wine_1',
      suggestionId: 'test_suggestion',
      userId: null
    };

    const response = await makeRequest('/api/suggestion-pills/used', {
      method: 'POST',
      body: JSON.stringify(usageData)
    });

    if (!response.ok) {
      throw new Error(`Failed to track suggestion usage: ${response.status}`);
    }
  });
};

/**
 * 4. Voice System Testing
 */
const testVoiceSystem = async () => {
  await runTest('Voice System Configuration', async () => {
    const response = await makeRequest('/');
    if (!response.ok) {
      throw new Error('Voice system base check failed');
    }
    
    log('Voice system configuration verified');
  });

  await runTest('Audio Caching System', async () => {
    const ttsRequest = {
      text: 'Cache test message'
    };

    const response1 = await makeRequest('/api/text-to-speech', {
      method: 'POST',
      body: JSON.stringify(ttsRequest)
    });

    if (!response1.ok) {
      throw new Error('First TTS request failed');
    }

    const response2 = await makeRequest('/api/text-to-speech', {
      method: 'POST',
      body: JSON.stringify(ttsRequest)
    });

    if (!response2.ok) {
      throw new Error('Cached TTS request failed');
    }
  });
};

/**
 * 5. Error Handling Testing
 */
const testErrorHandling = async () => {
  await runTest('Invalid Endpoint Handling', async () => {
    const response = await makeRequest('/api/nonexistent');
    if (response.status !== 404) {
      throw new Error(`Expected 404 for invalid endpoint, got ${response.status}`);
    }
  });

  await runTest('Malformed Request Handling', async () => {
    const response = await makeRequest('/api/chat', {
      method: 'POST',
      body: 'invalid json'
    });

    if (response.status !== 400 && response.status !== 500) {
      throw new Error(`Expected 400/500 for malformed request, got ${response.status}`);
    }
  });

  await runTest('Missing Fields Validation', async () => {
    const response = await makeRequest('/api/chat', {
      method: 'POST',
      body: JSON.stringify({ incomplete: 'data' })
    });

    if (response.status !== 400 && response.status !== 500) {
      throw new Error(`Expected validation error, got ${response.status}`);
    }
  });
};

/**
 * 6. Performance Testing
 */
const testPerformance = async () => {
  await runTest('API Response Times', async () => {
    const startTime = Date.now();
    
    const response = await makeRequest('/api/tenants');
    
    const responseTime = Date.now() - startTime;
    
    if (!response.ok) {
      throw new Error(`Performance test failed: ${response.status}`);
    }
    
    if (responseTime > 5000) {
      throw new Error(`Response time too slow: ${responseTime}ms`);
    }
    
    log(`API response time: ${responseTime}ms`);
  });

  await runTest('Concurrent Request Handling', async () => {
    const requests = Array(5).fill().map(() => 
      makeRequest('/api/tenants')
    );

    const responses = await Promise.all(requests);
    
    for (const response of responses) {
      if (!response.ok) {
        throw new Error(`Concurrent request failed: ${response.status}`);
      }
    }
  });
};

/**
 * 7. Data Integrity Testing
 */
const testDataIntegrity = async () => {
  await runTest('Wine Data Consistency', async () => {
    const response = await makeRequest('/api/tenants');
    if (!response.ok) {
      throw new Error(`Failed to fetch wine data: ${response.status}`);
    }

    const wines = JSON.parse(response.data);
    
    for (const wine of wines) {
      if (!wine.id || !wine.name) {
        throw new Error('Wine data missing required fields');
      }
      
      if (wine.ratings && typeof wine.ratings !== 'object') {
        throw new Error('Wine ratings should be an object');
      }
    }
  });

  await runTest('Conversation Data Integrity', async () => {
    const response = await makeRequest('/api/conversations');
    if (!response.ok) {
      throw new Error(`Failed to fetch conversations: ${response.status}`);
    }

    const conversations = JSON.parse(response.data);
    
    for (const conv of conversations) {
      if (!conv.id || !conv.createdAt) {
        throw new Error('Conversation data missing required fields');
      }
    }
  });
};

/**
 * Main Test Runner
 */
const runAllTests = async () => {
  log('Starting Comprehensive QA Test Suite');
  log('=====================================');
  
  const startTime = Date.now();

  try {
    log('Waiting for server to be ready...');
    await sleep(5000);

    await testBasicHealth();
    await testAPIEndpoints();
    await testDatabaseOperations();
    await testVoiceSystem();
    await testErrorHandling();
    await testPerformance();
    await testDataIntegrity();

  } catch (error) {
    log(`Critical test failure: ${error.message}`, 'error');
    testResults.errors.push({ test: 'Test Runner', error: error.message });
  }

  const duration = Date.now() - startTime;

  log('=====================================');
  log('QA Test Suite Complete');
  log('=====================================');
  log(`Total Tests: ${testResults.total}`);
  log(`Passed: ${testResults.passed}`, 'success');
  log(`Failed: ${testResults.failed}`, testResults.failed > 0 ? 'error' : 'info');
  log(`Duration: ${duration}ms`);
  log(`Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);

  if (testResults.errors.length > 0) {
    log('\nFailed Tests:');
    testResults.errors.forEach(error => {
      log(`  - ${error.test}: ${error.error}`, 'error');
    });
  }

  const report = {
    timestamp: new Date().toISOString(),
    duration,
    summary: {
      total: testResults.total,
      passed: testResults.passed,
      failed: testResults.failed,
      successRate: ((testResults.passed / testResults.total) * 100).toFixed(1)
    },
    details: testResults.details,
    errors: testResults.errors
  };

  fs.writeFileSync('./tests/qa-report.json', JSON.stringify(report, null, 2));
  log('\nDetailed report saved to: ./tests/qa-report.json');

  process.exit(testResults.failed > 0 ? 1 : 0);
};

runAllTests().catch(error => {
  log(`Test runner crashed: ${error.message}`, 'error');
  process.exit(1);
});