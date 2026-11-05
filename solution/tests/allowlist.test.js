import { test } from 'node:test';
import assert from 'node:assert/strict';
import { startTestServer } from './helpers.js';
import { labelFor } from '../src/reporting/daily-summary.js';

const ACME = 'tok-acme-admin';
const GLOBEX = 'tok-globex-admin';
const invoice = (overrides) => ({
  tenantId: 'acme',
  sender: 'billing@vendorcorp.com',
  subject: 'Invoice 4471',
  spf: 'pass',
  attachments: [{ filename: 'invoice.zip' }],
  ...overrides,
});

async function withApp(fn) {
  const app = await startTestServer();
  try {
    await fn(app);
  } finally {
    await app.close();
  }
}

const allow = (app, domain, token = ACME, tenant = 'acme') =>
  app.request('POST', `/tenants/${tenant}/allowlist`, { token, body: { domain } });
const verdict = (app, body) => app.request('POST', '/verdict', { body });

test('AC1: allowlisted domain, same tenant, returns ALLOW with reason ALLOWLIST', () =>
  withApp(async (app) => {
    assert.equal((await verdict(app, invoice())).body.verdict, 'QUARANTINE');
    const add = await allow(app, 'VendorCorp.com');
    assert.equal(add.status, 201);
    assert.deepEqual(add.body, { domain: 'vendorcorp.com' });
    assert.deepEqual((await verdict(app, invoice())).body, { verdict: 'ALLOW', reason: 'ALLOWLIST' });
    assert.deepEqual((await verdict(app, invoice({ sender: 'AP@VENDORCORP.COM' }))).body.reason, 'ALLOWLIST');
    const list = await app.request('GET', '/tenants/acme/allowlist', { token: ACME });
    assert.deepEqual(list.body, { domains: ['vendorcorp.com'] });
  }));

test('AC2: lookalike, subdomain, and display-name senders are not allowed', () =>
  withApp(async (app) => {
    await allow(app, 'vendorcorp.com');
    const lookalikes = [
      'billing@vendor-corp.com',
      'billing@evilvendorcorp.com',
      'billing@vendorcorp.com.evil.example',
      'billing@mail.vendorcorp.com',
      '"vendorcorp.com" <billing@attacker.example>',
      '"billing@vendorcorp.com" <billing@attacker.example>',
    ];
    for (const sender of lookalikes) {
      const res = await verdict(app, invoice({ sender }));
      assert.notEqual(res.body.verdict, 'ALLOW', `${sender} must not be allowed`);
    }
  }));

test('AC2: wildcards and invalid domains are rejected', () =>
  withApp(async (app) => {
    for (const domain of ['*.vendorcorp.com', 'billing@vendorcorp.com', 'not a domain', '']) {
      assert.equal((await allow(app, domain)).status, 400, `"${domain}" should be rejected`);
    }
  }));

test('AC3: allowlist is tenant-scoped for verdicts and admin access', () =>
  withApp(async (app) => {
    await allow(app, 'vendorcorp.com');
    const other = await verdict(app, invoice({ tenantId: 'globex' }));
    assert.equal(other.body.verdict, 'QUARANTINE');
    assert.equal((await allow(app, 'x.example', GLOBEX, 'acme')).status, 403);
    assert.equal((await app.request('GET', '/tenants/acme/allowlist', { token: GLOBEX })).status, 403);
    assert.equal((await app.request('DELETE', '/tenants/acme/allowlist/vendorcorp.com', { token: GLOBEX })).status, 403);
    assert.equal((await allow(app, 'x.example', 'tok-acme-viewer')).status, 403);
    assert.equal((await app.request('GET', '/tenants/acme/allowlist')).status, 401);
    const globexList = await app.request('GET', '/tenants/globex/allowlist', { token: GLOBEX });
    assert.deepEqual(globexList.body, { domains: [] });
  }));

test('AC4: BLOCK rules win over the allowlist', () =>
  withApp(async (app) => {
    await allow(app, 'known-bad.example');
    await allow(app, 'vendorcorp.com');
    const blocked = await verdict(app, invoice({ sender: 'x@known-bad.example' }));
    assert.deepEqual(blocked.body, { verdict: 'BLOCK', reason: 'BLOCKLIST' });
    const spf = await verdict(app, invoice({ spf: 'fail' }));
    assert.deepEqual(spf.body, { verdict: 'BLOCK', reason: 'SPF_FAIL' });
  }));

test('AC5: each successful add or remove writes exactly one audit row', () =>
  withApp(async (app) => {
    const rows = async () =>
      (await app.request('GET', '/tenants/acme/audit', { token: ACME })).body.entries.filter((r) =>
        r.action.startsWith('allowlist.'),
      );
    await allow(app, 'vendorcorp.com');
    assert.equal((await allow(app, 'vendorcorp.com')).status, 409);
    assert.equal((await allow(app, '*.bad')).status, 400);
    assert.equal((await app.request('DELETE', '/tenants/acme/allowlist/nope.example', { token: ACME })).status, 404);
    assert.equal((await app.request('DELETE', '/tenants/acme/allowlist/vendorcorp.com', { token: ACME })).status, 204);

    const audit = await rows();
    assert.deepEqual(
      audit.map((r) => [r.action, r.actor, r.tenantId, r.domain]),
      [
        ['allowlist.add', 'alice@acme.example', 'acme', 'vendorcorp.com'],
        ['allowlist.remove', 'alice@acme.example', 'acme', 'vendorcorp.com'],
      ],
    );
    assert.ok(audit.every((r) => !Number.isNaN(Date.parse(r.at))));
    assert.equal((await verdict(app, invoice())).body.verdict, 'QUARANTINE', 'removed domain no longer allowed');
  }));

test('allowlist hits log tenant and domain only, never content', () =>
  withApp(async (app) => {
    await allow(app, 'vendorcorp.com');
    await verdict(app, invoice({ sender: '"Vendor" <sentinel.user@vendorcorp.com>', subject: 'SENTINEL-SUBJECT' }));
    const hit = app.logs.find((l) => l.event === 'allowlist_hit');
    assert.ok(hit, 'expected an allowlist_hit log line');
    assert.equal(hit.tenantId, 'acme');
    assert.equal(hit.senderDomain, 'vendorcorp.com');
    const all = JSON.stringify(app.logs);
    assert.ok(!all.includes('SENTINEL-SUBJECT') && !all.includes('sentinel.user') && !all.includes('invoice.zip'));
  }));

test('reporting has a label for ALLOWLIST', () => {
  assert.equal(labelFor('ALLOWLIST'), 'Delivered: tenant allowlist');
});
