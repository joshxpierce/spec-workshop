// Black-box harness: starts a target triage-service as a child process and
// talks to it over HTTP only. Knows nothing about the target's internals.
import { spawn } from 'node:child_process';
import net from 'node:net';
import path from 'node:path';

export const TARGET_DIR = path.resolve(process.env.TARGET_DIR ?? '');

export const TOKENS = {
  acmeAdmin: 'tok-acme-admin',
  acmeViewer: 'tok-acme-viewer',
  globexAdmin: 'tok-globex-admin',
};

function freePort() {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.unref();
    srv.on('error', reject);
    srv.listen(0, () => {
      const { port } = srv.address();
      srv.close(() => resolve(port));
    });
  });
}

export async function startTarget(dir = TARGET_DIR) {
  if (!process.env.TARGET_DIR) throw new Error('TARGET_DIR is not set. Use scripts/verify.mjs <dir>.');
  const port = await freePort();
  const child = spawn(process.execPath, ['src/server.js'], {
    cwd: dir,
    env: { ...process.env, PORT: String(port) },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const stdout = [];
  const stderr = [];
  let partial = '';
  child.stdout.on('data', (chunk) => {
    partial += chunk.toString();
    const lines = partial.split('\n');
    partial = lines.pop();
    stdout.push(...lines.filter(Boolean));
  });
  child.stderr.on('data', (chunk) => stderr.push(chunk.toString()));
  const exited = new Promise((resolve) => child.on('exit', resolve));

  const base = `http://127.0.0.1:${port}`;
  const deadline = Date.now() + 8000;
  for (;;) {
    try {
      const res = await fetch(base + '/health');
      if (res.ok) break;
    } catch {
      // not up yet
    }
    if (child.exitCode !== null || Date.now() > deadline) {
      child.kill();
      throw new Error(`target server did not start in ${dir}\n${stderr.join('')}`);
    }
    await new Promise((r) => setTimeout(r, 50));
  }

  async function request(method, urlPath, { body, token } = {}) {
    const headers = { 'content-type': 'application/json' };
    if (token) headers.authorization = `Bearer ${token}`;
    const res = await fetch(base + urlPath, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
    const text = await res.text();
    let json = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      json = { raw: text };
    }
    return { status: res.status, body: json };
  }

  async function stop() {
    child.kill();
    await exited;
  }

  return { request, stdout, stderr, stop };
}

// The spec's contract for adding an entry. Returns true when the contract
// endpoint exists, false when the target built something else (404/405).
export async function contractAdd(target, domain, { tenant = 'acme', token = TOKENS.acmeAdmin } = {}) {
  const res = await target.request('POST', `/tenants/${tenant}/allowlist`, { token, body: { domain } });
  return res;
}

export const NOT_OBSERVED =
  'NOT OBSERVED: POST /tenants/:tenantId/allowlist is not implemented at the contract path, so this criterion cannot be checked';

export function invoice(overrides = {}) {
  return {
    tenantId: 'acme',
    sender: 'billing@vendorcorp.com',
    subject: 'Invoice 4471',
    spf: 'pass',
    attachments: [{ filename: 'invoice.zip' }],
    ...overrides,
  };
}
