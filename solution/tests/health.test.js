import { test } from 'node:test';
import assert from 'node:assert/strict';
import { startTestServer } from './helpers.js';

test('GET /health returns ok', async () => {
  const app = await startTestServer();
  try {
    const res = await app.request('GET', '/health');
    assert.equal(res.status, 200);
    assert.deepEqual(res.body, { status: 'ok' });
  } finally {
    await app.close();
  }
});

test('unknown route returns 404', async () => {
  const app = await startTestServer();
  try {
    const res = await app.request('GET', '/nope');
    assert.equal(res.status, 404);
  } finally {
    await app.close();
  }
});
