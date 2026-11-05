import { TOKENS } from '../data/seed.js';

// Resolves the bearer token on a request to a principal, or null.
export function authenticate(req) {
  const header = req.headers['authorization'] ?? '';
  const match = header.match(/^Bearer\s+(\S+)$/i);
  if (!match) return null;
  return TOKENS[match[1]] ?? null;
}

// Gate for any endpoint that changes or reads tenant settings.
// Returns { ok: true, principal } or { ok: false, status, error }.
export function requireTenantAdmin(req, tenantId) {
  const principal = authenticate(req);
  if (!principal) return { ok: false, status: 401, error: 'authentication required' };
  if (principal.tenantId !== tenantId || principal.role !== 'admin') {
    return { ok: false, status: 403, error: 'forbidden' };
  }
  return { ok: true, principal };
}
