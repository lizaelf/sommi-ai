#!/usr/bin/env node

/**
 * Quick QA Test Suite - Essential Functionality Verification
 * Wine Exploration Platform
 */

import fetch from 'node-fetch';
import fs from 'fs';

const CONFIG = {
  baseUrl: 'http://localhost:5000',
  timeout: 10000
};

let results = { passed: 0, failed: 0, total: 0, errors: [] };

const log = (message, type = 'info') => {
  const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : '🔍';
  console.log(`${prefix} ${message}`);
};

const test = async (name, fn) => {
  results.total++;
  try {
    await fn();
    results.passed++;
    log(`${name} - PASSED`, 'success');
  } catch (error) {
    results.failed++;
    results.errors.push({ test: name, error: error.message });
    log(`${name} - FAILED: ${error.message}`, 'error');
  }
};

const request = async (url, options = {}) => {
  const response = await fetch(`${CONFIG.baseUrl}${url}`, {
    timeout: CONFIG.timeout,
    headers: { 'Content-Type': 'application/json' },
    ...options
  });
  return {
    ok: response.ok,
    status: response.status,
    data: await response.text(),
    headers: response.headers
  };
};

const runTests = async () => {
  log('Starting Quick QA Test Suite');
  console.log('================================');

  // 1. Core Health Check
  await test('Server Health', async () => {
    const res = await request('/');
    if (!res.ok) throw new Error(`Server not responding: ${res.status}`);
  });

  // 2. Database Connection
  await test('Database Connection', async () => {
    const res = await request('/api/tenants');
    if (!res.ok) throw new Error(`Database failed: ${res.status}`);
    const data = JSON.parse(res.data);
    if (!Array.isArray(data)) throw new Error('Invalid tenants data structure');
  });

  // 3. Conversation System
  await test('Conversation API', async () => {
    const res = await request('/api/conversations');
    if (!res.ok) throw new Error(`Conversations failed: ${res.status}`);
    const data = JSON.parse(res.data);
    if (!Array.isArray(data)) throw new Error('Invalid conversations data');
  });

  // 4. Suggestion Pills
  await test('Suggestion Pills', async () => {
    const res = await request('/api/suggestion-pills/wine_1');
    if (!res.ok) throw new Error(`Suggestions failed: ${res.status}`);
    const data = JSON.parse(res.data);
    if (!data.suggestions || !Array.isArray(data.suggestions)) {
      throw new Error('Invalid suggestions structure');
    }
  });

  // 5. Chat System (Text Only)
  await test('Chat API', async () => {
    const payload = {
      messages: [{ role: 'user', content: 'Tell me about this wine' }],
      wineKey: 'wine_1',
      wineData: { id: 1, name: 'Ridge Lytton Springs' },
      textOnly: true
    };
    
    const res = await request('/api/chat', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    
    if (!res.ok) throw new Error(`Chat failed: ${res.status}`);
    const data = JSON.parse(res.data);
    if (!data.message || !data.message.content) {
      throw new Error('Invalid chat response structure');
    }
  });

  // 6. Voice System
  await test('Text-to-Speech', async () => {
    const payload = { text: 'QA test audio generation' };
    
    const res = await request('/api/text-to-speech', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    
    if (!res.ok) throw new Error(`TTS failed: ${res.status}`);
    const contentType = res.headers.get('content-type');
    if (!contentType || !contentType.includes('audio')) {
      throw new Error('TTS should return audio data');
    }
  });

  // 7. Database Operations
  await test('Conversation Creation', async () => {
    const payload = {
      title: 'QA Test Conversation',
      wineKey: 'wine_1'
    };
    
    const res = await request('/api/conversations', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    
    if (!res.ok) throw new Error(`Conversation creation failed: ${res.status}`);
    const data = JSON.parse(res.data);
    if (!data.id) throw new Error('Created conversation missing ID');
  });

  // 8. Error Handling
  await test('Error Handling', async () => {
    const res = await request('/api/nonexistent');
    if (res.status !== 404) {
      throw new Error(`Expected 404, got ${res.status}`);
    }
  });

  // 9. Performance Check
  await test('Response Performance', async () => {
    const start = Date.now();
    const res = await request('/api/tenants');
    const duration = Date.now() - start;
    
    if (!res.ok) throw new Error('Performance test request failed');
    if (duration > 3000) throw new Error(`Too slow: ${duration}ms`);
    log(`Response time: ${duration}ms`);
  });

  // 10. Data Integrity
  await test('Wine Data Integrity', async () => {
    const res = await request('/api/tenants');
    if (!res.ok) throw new Error('Failed to fetch wine data');
    
    const wines = JSON.parse(res.data);
    for (const wine of wines) {
      if (!wine.id && wine.id !== 0) throw new Error('Wine missing ID');
      if (!wine.name) throw new Error('Wine missing name');
    }
  });

  // Results Summary
  console.log('\n================================');
  console.log('QA Test Results:');
  console.log(`Total Tests: ${results.total}`);
  console.log(`Passed: ${results.passed}`);
  console.log(`Failed: ${results.failed}`);
  console.log(`Success Rate: ${((results.passed / results.total) * 100).toFixed(1)}%`);

  if (results.failed > 0) {
    console.log('\nFailed Tests:');
    results.errors.forEach(err => {
      console.log(`  - ${err.test}: ${err.error}`);
    });
  }

  // Save report
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      total: results.total,
      passed: results.passed,
      failed: results.failed,
      successRate: ((results.passed / results.total) * 100).toFixed(1)
    },
    errors: results.errors
  };

  fs.writeFileSync('./tests/qa-report.json', JSON.stringify(report, null, 2));
  console.log('\nReport saved to: tests/qa-report.json');

  process.exit(results.failed > 0 ? 1 : 0);
};

runTests().catch(error => {
  log(`Test runner failed: ${error.message}`, 'error');
  process.exit(1);
});