// Independent acceptance suite for specs/allowlist.md.
// Run with: node scripts/verify.mjs <target-dir>
// Black-box over HTTP, plus file checks for the constraints. It never imports target code.
import { describe, test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { TARGET_DIR, TOKENS, startTarget, contractAdd, NOT_OBSERVED, invoice } from './harness.js';

const STARTER_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../starter');

// Starts a fresh target per suite and tries the contract endpoint once.
function suite(name, fn) {
  describe(name, () => {
    const ctx = { target: null, observed: false };
    before(async () => {
      ctx.target = await startTarget();
      const probe = await ctx.target.request('GET', '/tenants/acme/allowlist', { token: TOKENS.acmeAdmin });
      ctx.observed = probe.status !== 404 && probe.status !== 405;
    });
    after(async () => ctx.target?.stop());
    fn(ctx);
  });
}

// Skips with NOT OBSERVED when the contract endpoint is missing.
const observed = (ctx, t) => {
  if (!ctx.observed) {
    t.skip(NOT_OBSERVED);
    return false;
  }
  return true;
};

const verdictOf = async (target, body) => (await target.request('POST', '/verdict', { body })).body;

suite('AC1 Allowlisted domain, same tenant: ALLOW with reason ALLOWLIST', (ctx) => {
  test('vendor invoice is quarantined before the domain is allowlisted', async () => {
    const res = await verdictOf(ctx.target, invoice());
    assert.equal(res.verdict, 'QUARANTINE', 'precondition: the starter quarantines .zip invoices');
  });
  test('after adding vendorcorp.com, the same message returns ALLOW / ALLOWLIST', async (t) => {
    if (!observed(ctx, t)) return;
    const add = await contractAdd(ctx.target, 'VendorCorp.com');
    assert.equal(add.status, 201, `POST /tenants/acme/allowlist should return 201, got ${add.status}`);
    const res = await verdictOf(ctx.target, invoice());
    assert.deepEqual(res, { verdict: 'ALLOW', reason: 'ALLOWLIST' }, `allowlisted sender returned ${JSON.stringify(res)}`);
  });
  test('matching is case-insensitive on the sender domain', async (t) => {
    if (!observed(ctx, t)) return;
    const res = await verdictOf(ctx.target, invoice({ sender: 'AP@VENDORCORP.COM' }));
    assert.equal(res.reason, 'ALLOWLIST');
  });
  test('internationalized domains match after punycode normalization', async (t) => {
    if (!observed(ctx, t)) return;
    await contractAdd(ctx.target, 'bücher.example');
    const res = await verdictOf(ctx.target, invoice({ sender: 'info@xn--bcher-kva.example' }));
    assert.equal(res.reason, 'ALLOWLIST', 'bücher.example should match xn--bcher-kva.example');
  });
});

suite('AC2 Lookalike domains are not allowed', (ctx) => {
  const cases = {
    'hyphenated lookalike': 'billing@vendor-corp.com',
    'prefix lookalike': 'billing@evilvendorcorp.com',
    'suffix lookalike': 'billing@vendorcorp.com.evil.example',
    'subdomain (out of scope)': 'billing@mail.vendorcorp.com',
    'domain only in display name': '"vendorcorp.com" <billing@attacker.example>',
    'address only in display name': '"billing@vendorcorp.com" <billing@attacker.example>',
  };
  for (const [label, sender] of Object.entries(cases)) {
    test(`${label}: ${sender} is not allowed`, async (t) => {
      if (!observed(ctx, t)) return;
      await contractAdd(ctx.target, 'vendorcorp.com');
      const res = await verdictOf(ctx.target, invoice({ sender }));
      assert.notEqual(res.verdict, 'ALLOW', `${sender} was allowed: ${JSON.stringify(res)}`);
    });
  }
  test('wildcards and invalid domains are rejected with 400', async (t) => {
    if (!observed(ctx, t)) return;
    for (const domain of ['*.vendorcorp.com', 'billing@vendorcorp.com', 'not a domain', '']) {
      const res = await contractAdd(ctx.target, domain);
      assert.equal(res.status, 400, `"${domain}" should be rejected with 400, got ${res.status}`);
    }
  });
});

suite('AC3 Tenant isolation', (ctx) => {
  test('allowlisted in acme, message to globex is not allowed', async (t) => {
    if (!observed(ctx, t)) return;
    await contractAdd(ctx.target, 'vendorcorp.com');
    const res = await verdictOf(ctx.target, invoice({ tenantId: 'globex' }));
    assert.notEqual(res.verdict, 'ALLOW', `cross-tenant leak: ${JSON.stringify(res)}`);
  });
  test("globex admin cannot read or change acme's allowlist", async (t) => {
    if (!observed(ctx, t)) return;
    const { target } = ctx;
    const add = await contractAdd(target, 'x.example', { token: TOKENS.globexAdmin });
    const list = await target.request('GET', '/tenants/acme/allowlist', { token: TOKENS.globexAdmin });
    const del = await target.request('DELETE', '/tenants/acme/allowlist/vendorcorp.com', { token: TOKENS.globexAdmin });
    assert.deepEqual([add.status, list.status, del.status], [403, 403, 403]);
  });
  test('viewer and anonymous requests cannot change the allowlist', async (t) => {
    if (!observed(ctx, t)) return;
    const viewer = await contractAdd(ctx.target, 'x.example', { token: TOKENS.acmeViewer });
    const anon = await ctx.target.request('POST', '/tenants/acme/allowlist', { body: { domain: 'x.example' } });
    assert.deepEqual([viewer.status, anon.status], [403, 401]);
  });
});

suite('AC4 BLOCK rules win over the allowlist', (ctx) => {
  test('sender on blocklist and allowlist returns BLOCK / BLOCKLIST', async (t) => {
    if (!observed(ctx, t)) return;
    await contractAdd(ctx.target, 'known-bad.example');
    const res = await verdictOf(ctx.target, invoice({ sender: 'x@known-bad.example' }));
    assert.deepEqual(res, { verdict: 'BLOCK', reason: 'BLOCKLIST' }, `blocklisted sender returned ${JSON.stringify(res)}`);
  });
  test('allowlisted sender with SPF fail returns BLOCK / SPF_FAIL', async (t) => {
    if (!observed(ctx, t)) return;
    await contractAdd(ctx.target, 'vendorcorp.com');
    const res = await verdictOf(ctx.target, invoice({ spf: 'fail' }));
    assert.deepEqual(res, { verdict: 'BLOCK', reason: 'SPF_FAIL' }, `SPF-fail sender returned ${JSON.stringify(res)}`);
  });
});

suite('AC5 Exactly one audit row per successful add or remove', (ctx) => {
  test('add, duplicate, invalid, missing delete, delete: two rows total', async (t) => {
    if (!observed(ctx, t)) return;
    const { target } = ctx;
    const tok = { token: TOKENS.acmeAdmin };
    await contractAdd(target, 'vendorcorp.com');
    await contractAdd(target, 'vendorcorp.com');
    await contractAdd(target, '*.bad');
    await target.request('DELETE', '/tenants/acme/allowlist/nope.example', tok);
    const del = await target.request('DELETE', '/tenants/acme/allowlist/vendorcorp.com', tok);
    assert.equal(del.status, 204, `DELETE should return 204, got ${del.status}`);

    const audit = await target.request('GET', '/tenants/acme/audit', tok);
    const rows = (audit.body?.entries ?? []).filter((r) => String(r.action).startsWith('allowlist'));
    assert.equal(rows.length, 2, `expected 2 allowlist audit rows, got ${rows.length}: ${JSON.stringify(rows)}`);
    const [add, remove] = rows;
    for (const row of rows) {
      assert.equal(row.actor, 'alice@acme.example');
      assert.equal(row.tenantId, 'acme');
      assert.equal(row.domain, 'vendorcorp.com');
      assert.ok(!Number.isNaN(Date.parse(row.at ?? row.timestamp)), 'row needs a timestamp');
    }
    assert.match(add.action, /add/);
    assert.match(remove.action, /remove|delete/);
  });
  test('removed domain is no longer allowed', async (t) => {
    if (!observed(ctx, t)) return;
    const res = await verdictOf(ctx.target, invoice());
    assert.notEqual(res.verdict, 'ALLOW');
  });
});

suite('AC6 Latency: p95 within 5 ms of baseline with 1,000 entries', (ctx) => {
  const p95 = async (n) => {
    const samples = [];
    for (let i = 0; i < n; i++) {
      const start = performance.now();
      await ctx.target.request('POST', '/verdict', { body: invoice({ sender: `x${i % 50}@other.example` }) });
      samples.push(performance.now() - start);
    }
    samples.sort((a, b) => a - b);
    return samples[Math.floor(samples.length * 0.95)];
  };
  test('POST /verdict p95 with 1,000 entries vs empty allowlist', async (t) => {
    if (!observed(ctx, t)) return;
    await p95(50);
    const baseline = await p95(300);
    for (let i = 0; i < 1000; i++) await contractAdd(ctx.target, `vendor${i}.example`);
    const loaded = await p95(300);
    t.diagnostic(`baseline p95 ${baseline.toFixed(2)} ms, with 1,000 entries ${loaded.toFixed(2)} ms`);
    assert.ok(loaded - baseline < 5, `p95 grew by ${(loaded - baseline).toFixed(2)} ms`);
  });
});

suite('C1 Logging: allowlist_hit event, no message content', (ctx) => {
  test('an allowlist hit logs tenantId and senderDomain', async (t) => {
    if (!observed(ctx, t)) return;
    await contractAdd(ctx.target, 'vendorcorp.com');
    await verdictOf(ctx.target, invoice());
    await new Promise((r) => setTimeout(r, 100));
    const hit = ctx.target.stdout.map((l) => safeJson(l)).find((l) => l?.event === 'allowlist_hit');
    assert.ok(hit, 'expected a structured log line with event "allowlist_hit"');
    assert.equal(hit.tenantId, 'acme');
    assert.equal(hit.senderDomain, 'vendorcorp.com');
  });
  test('no log line contains subject, local part, or attachment name', async () => {
    await verdictOf(
      ctx.target,
      invoice({ sender: '"V" <sentinel.user@vendorcorp.com>', subject: 'SENTINEL-SUBJECT-7F3A', attachments: [{ filename: 'sentinel-file.zip' }] }),
    );
    await new Promise((r) => setTimeout(r, 100));
    const all = ctx.target.stdout.join('\n');
    for (const secret of ['SENTINEL-SUBJECT-7F3A', 'sentinel.user', 'sentinel-file.zip']) {
      assert.ok(!all.includes(secret), `log output contains "${secret}"`);
    }
  });
});

describe('C2 No new dependencies', () => {
  test('package.json declares no dependencies and node_modules is absent', () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(TARGET_DIR, 'package.json'), 'utf8'));
    assert.deepEqual(
      { dependencies: pkg.dependencies ?? {}, devDependencies: pkg.devDependencies ?? {} },
      { dependencies: {}, devDependencies: {} },
    );
    assert.ok(!fs.existsSync(path.join(TARGET_DIR, 'node_modules')), 'node_modules exists');
  });
});

describe('C3 Auth module unchanged', () => {
  test('src/auth.js is byte-identical to the starter', () => {
    const hash = (p) => createHash('sha256').update(fs.readFileSync(p)).digest('hex');
    assert.equal(hash(path.join(TARGET_DIR, 'src/auth.js')), hash(path.join(STARTER_DIR, 'src/auth.js')));
  });
});

describe('C4 Existing behavior unchanged', () => {
  test("the starter's original 24 tests pass against the changed code", () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'triage-baseline-'));
    try {
      fs.cpSync(TARGET_DIR, tmp, { recursive: true, filter: (src) => !/node_modules|\.git$/.test(src) });
      fs.rmSync(path.join(tmp, 'tests'), { recursive: true, force: true });
      fs.cpSync(path.join(STARTER_DIR, 'tests'), path.join(tmp, 'tests'), { recursive: true });
      const files = fs.readdirSync(path.join(tmp, 'tests')).filter((f) => f.endsWith('.test.js')).map((f) => `tests/${f}`);
      const env = { ...process.env };
      delete env.NODE_TEST_CONTEXT; // run as a top-level test process, not a child of this runner
      const run = spawnSync(process.execPath, ['--test', '--test-reporter=spec', ...files], { cwd: tmp, encoding: 'utf8', env });
      const pass = Number(run.stdout.match(/ℹ pass (\d+)/)?.[1] ?? 0);
      assert.equal(run.status, 0, `original tests failed:\n${run.stdout.split('\n').filter((l) => l.includes('✖')).join('\n')}`);
      assert.equal(pass, 24, `expected 24 original tests to pass, got ${pass}`);
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });
});

function safeJson(line) {
  try {
    return JSON.parse(line);
  } catch {
    return null;
  }
}
