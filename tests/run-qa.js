import fetch from 'node-fetch';
import fs from 'fs';

const baseUrl = 'http://localhost:5000';
const results = { passed: 0, failed: 0, tests: [] };

const test = async (name, testFn) => {
  try {
    await testFn();
    results.passed++;
    results.tests.push({ name, status: 'PASSED' });
    console.log(`✅ ${name}`);
  } catch (error) {
    results.failed++;
    results.tests.push({ name, status: 'FAILED', error: error.message });
    console.log(`❌ ${name}: ${error.message}`);
  }
};

const request = async (url, options = {}) => {
  const response = await fetch(`${baseUrl}${url}`, {
    timeout: 5000,
    headers: { 'Content-Type': 'application/json' },
    ...options
  });
  return { ok: response.ok, status: response.status, data: await response.text() };
};

console.log('Wine Exploration Platform - QA Test Suite');
console.log('==========================================');

// Core functionality tests
await test('Server Health', async () => {
  const res = await request('/');
  if (!res.ok) throw new Error(`Server unreachable: ${res.status}`);
});

await test('Database Access', async () => {
  const res = await request('/api/tenants');
  if (!res.ok) throw new Error(`Database error: ${res.status}`);
  JSON.parse(res.data); // Validate JSON
});

await test('Conversations API', async () => {
  const res = await request('/api/conversations');
  if (!res.ok) throw new Error(`Conversations failed: ${res.status}`);
  const data = JSON.parse(res.data);
  if (!Array.isArray(data)) throw new Error('Invalid response format');
});

await test('Suggestion System', async () => {
  const res = await request('/api/suggestion-pills/wine_1');
  if (!res.ok) throw new Error(`Suggestions failed: ${res.status}`);
  const data = JSON.parse(res.data);
  if (!data.suggestions) throw new Error('Missing suggestions data');
});

await test('Voice System', async () => {
  const res = await request('/api/text-to-speech', {
    method: 'POST',
    body: JSON.stringify({ text: 'Test audio' })
  });
  if (!res.ok) throw new Error(`TTS failed: ${res.status}`);
});

await test('Error Handling', async () => {
  const res = await request('/api/invalid-endpoint');
  if (res.status !== 404) throw new Error(`Expected 404, got ${res.status}`);
});

// Generate report
const total = results.passed + results.failed;
const successRate = ((results.passed / total) * 100).toFixed(1);

console.log('\nTest Results:');
console.log(`Passed: ${results.passed}`);
console.log(`Failed: ${results.failed}`);
console.log(`Success Rate: ${successRate}%`);

const report = {
  timestamp: new Date().toISOString(),
  summary: { total, passed: results.passed, failed: results.failed, successRate },
  tests: results.tests
};

fs.writeFileSync('./tests/qa-report.json', JSON.stringify(report, null, 2));
console.log('\nReport saved to qa-report.json');

process.exit(results.failed > 0 ? 1 : 0);