import { randomUUID } from 'node:crypto';

// Writes exactly one audit row per successful tenant-setting change.
export function recordAudit(store, { actor, tenantId, action, domain }) {
  const row = { id: randomUUID(), at: new Date().toISOString(), actor, tenantId, action, domain };
  store.appendAudit(row);
  return row;
}
