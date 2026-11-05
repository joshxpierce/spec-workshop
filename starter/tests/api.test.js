import { test } from 'node:test';
import assert from 'node:assert/strict';
import { startTestServer } from './helpers.js';

const ADMIN = 'tok-acme-admin';

test('POST /verdict returns a verdict and logs no message content', async () => {
  const app = await startTestServer();
  try {
    const res = await app.request('POST', '/verdict', {
      body: { tenantId: 'acme', sender: 'ops@partner.example', subject: 'Q3 numbers', spf: 'pass' },
    });
    assert.equal(res.status, 200);
    assert.deepEqual(res.body, { verdict: 'ALLOW', reason: 'CLEAN' });
    const line = app.logs.find((l) => l.event === 'verdict');
    assert.equal(line.senderDomain, 'partner.example');
    assert.ok(!JSON.stringify(app.logs).includes('Q3 numbers'), 'subject must never be logged');
    assert.ok(!JSON.stringify(app.logs).includes('ops@'), 'full address must never be logged');
  } finally {
    await app.close();
  }
});

test('POST /verdict rejects invalid input with 400', async () => {
  const app = await startTestServer();
  try {
    const res = await app.request('POST', '/verdict', { body: { tenantId: 'acme', sender: 'nobody' } });
    assert.equal(res.status, 400);
  } finally {
    await app.close();
  }
});

test('tenant settings require authentication', async () => {
  const app = await startTestServer();
  try {
    const res = await app.request('POST', '/tenants/acme/blocklist', { body: { domain: 'spam.example' } });
    assert.equal(res.status, 401);
  } finally {
    await app.close();
  }
});

test('an admin cannot change another tenant', async () => {
  const app = await startTestServer();
  try {
    const res = await app.request('POST', '/tenants/acme/blocklist', {
      token: 'tok-globex-admin',
      body: { domain: 'spam.example' },
    });
    assert.equal(res.status, 403);
  } finally {
    await app.close();
  }
});

test('a viewer cannot change tenant settings', async () => {
  const app = await startTestServer();
  try {
    const res = await app.request('POST', '/tenants/acme/blocklist', {
      token: 'tok-acme-viewer',
      body: { domain: 'spam.example' },
    });
    assert.equal(res.status, 403);
  } finally {
    await app.close();
  }
});

test('blocklist add and remove each write one audit row', async () => {
  const app = await startTestServer();
  try {
    const add = await app.request('POST', '/tenants/acme/blocklist', { token: ADMIN, body: { domain: 'Spam.Example' } });
    assert.equal(add.status, 201);
    assert.deepEqual(add.body, { domain: 'spam.example' });
    const dup = await app.request('POST', '/tenants/acme/blocklist', { token: ADMIN, body: { domain: 'spam.example' } });
    assert.equal(dup.status, 409);
    const del = await app.request('DELETE', '/tenants/acme/blocklist/spam.example', { token: ADMIN });
    assert.equal(del.status, 204);

    const audit = await app.request('GET', '/tenants/acme/audit', { token: ADMIN });
    const rows = audit.body.entries.filter((r) => r.domain === 'spam.example');
    assert.deepEqual(
      rows.map((r) => [r.action, r.actor, r.tenantId]),
      [
        ['blocklist.add', 'alice@acme.example', 'acme'],
        ['blocklist.remove', 'alice@acme.example', 'acme'],
      ],
    );
    assert.ok(rows.every((r) => !Number.isNaN(Date.parse(r.at))));
  } finally {
    await app.close();
  }
});
