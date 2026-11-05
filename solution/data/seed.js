// Fictional seed data. No real tenants, people, or customers.

export const TENANTS = ['acme', 'globex'];

// Static API tokens for local development. Each token maps to one actor,
// one tenant, and one role. Only "admin" may change tenant settings.
export const TOKENS = {
  'tok-acme-admin': { actor: 'alice@acme.example', tenantId: 'acme', role: 'admin' },
  'tok-acme-viewer': { actor: 'victor@acme.example', tenantId: 'acme', role: 'viewer' },
  'tok-globex-admin': { actor: 'bob@globex.example', tenantId: 'globex', role: 'admin' },
};

export const BLOCKLIST = {
  acme: ['known-bad.example'],
  globex: [],
};
