import { requireTenantAdmin } from './auth.js';
import { recordAudit } from './audit.js';
import { log } from './log.js';
import { Reason } from './models.js';
import { normalizeDomain } from './sender.js';
import { evaluate, validateMessage } from './verdict.js';

const MAX_BODY_BYTES = 64 * 1024;

export function createApp({ store }) {
  return async function handle(req, res) {
    try {
      const url = new URL(req.url, 'http://localhost');
      const parts = url.pathname.split('/').filter(Boolean).map(decodeURIComponent);

      if (req.method === 'GET' && url.pathname === '/health') {
        return send(res, 200, { status: 'ok' });
      }

      if (req.method === 'POST' && url.pathname === '/verdict') {
        return postVerdict(req, res, store);
      }

      // /tenants/:tenantId/...
      if (parts[0] === 'tenants' && parts.length >= 3) {
        const tenantId = parts[1];
        if (!store.hasTenant(tenantId)) return send(res, 404, { error: 'unknown tenant' });
        const gate = requireTenantAdmin(req, tenantId);
        if (!gate.ok) return send(res, gate.status, { error: gate.error });
        const actor = gate.principal.actor;

        if (parts[2] === 'blocklist') {
          return blocklistRoutes(req, res, { store, tenantId, actor, domainParam: parts[3] });
        }
        if (parts[2] === 'allowlist') {
          return allowlistRoutes(req, res, { store, tenantId, actor, domainParam: parts[3] });
        }
        if (parts[2] === 'audit' && parts.length === 3 && req.method === 'GET') {
          return send(res, 200, { entries: store.listAudit(tenantId) });
        }
      }

      return send(res, 404, { error: 'not found' });
    } catch (err) {
      if (err.status) return send(res, err.status, { error: err.message });
      log('error', { message: err.message });
      return send(res, 500, { error: 'internal error' });
    }
  };
}

async function postVerdict(req, res, store) {
  const body = await readJson(req);
  const errors = validateMessage(body, store);
  if (errors.length) return send(res, 400, { error: 'invalid message', details: errors });
  const { verdict, reason, senderDomain } = evaluate(body, store);
  log('verdict', { tenantId: body.tenantId, senderDomain, verdict, reason });
  if (reason === Reason.ALLOWLIST) log('allowlist_hit', { tenantId: body.tenantId, senderDomain });
  return send(res, 200, { verdict, reason });
}

async function allowlistRoutes(req, res, { store, tenantId, actor, domainParam }) {
  if (req.method === 'GET' && domainParam === undefined) {
    return send(res, 200, { domains: store.listAllowlist(tenantId) });
  }
  if (req.method === 'POST' && domainParam === undefined) {
    const body = await readJson(req);
    const domain = normalizeDomain(body?.domain);
    if (!domain) return send(res, 400, { error: 'domain must be a valid domain name, no wildcards' });
    if (!store.addAllowlist(tenantId, domain)) return send(res, 409, { error: 'already listed' });
    recordAudit(store, { actor, tenantId, action: 'allowlist.add', domain });
    return send(res, 201, { domain });
  }
  if (req.method === 'DELETE' && domainParam !== undefined) {
    const domain = normalizeDomain(domainParam);
    if (!domain) return send(res, 400, { error: 'domain must be a valid domain name' });
    if (!store.removeAllowlist(tenantId, domain)) return send(res, 404, { error: 'not listed' });
    recordAudit(store, { actor, tenantId, action: 'allowlist.remove', domain });
    res.writeHead(204).end();
    return;
  }
  return send(res, 405, { error: 'method not allowed' });
}

async function blocklistRoutes(req, res, { store, tenantId, actor, domainParam }) {
  if (req.method === 'GET' && domainParam === undefined) {
    return send(res, 200, { domains: store.listBlocklist(tenantId) });
  }
  if (req.method === 'POST' && domainParam === undefined) {
    const body = await readJson(req);
    const domain = normalizeDomain(body?.domain);
    if (!domain) return send(res, 400, { error: 'domain must be a valid domain name' });
    if (!store.addBlocklist(tenantId, domain)) return send(res, 409, { error: 'already listed' });
    recordAudit(store, { actor, tenantId, action: 'blocklist.add', domain });
    return send(res, 201, { domain });
  }
  if (req.method === 'DELETE' && domainParam !== undefined) {
    const domain = normalizeDomain(domainParam);
    if (!domain) return send(res, 400, { error: 'domain must be a valid domain name' });
    if (!store.removeBlocklist(tenantId, domain)) return send(res, 404, { error: 'not listed' });
    recordAudit(store, { actor, tenantId, action: 'blocklist.remove', domain });
    res.writeHead(204).end();
    return;
  }
  return send(res, 405, { error: 'method not allowed' });
}

function send(res, status, body) {
  res.writeHead(status, { 'content-type': 'application/json' });
  res.end(JSON.stringify(body));
}

async function readJson(req) {
  let size = 0;
  const chunks = [];
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) throw Object.assign(new Error('body too large'), { status: 413 });
    chunks.push(chunk);
  }
  if (!chunks.length) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    throw Object.assign(new Error('body must be valid JSON'), { status: 400 });
  }
}
