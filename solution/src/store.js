import { TENANTS, BLOCKLIST } from '../data/seed.js';

// In-memory store. Every read and write is scoped by tenantId.
export function createStore({ tenants = TENANTS, blocklist = BLOCKLIST } = {}) {
  const data = new Map();
  for (const id of tenants) {
    data.set(id, { blocklist: new Set(blocklist[id] ?? []), allowlist: new Set() });
  }
  const audit = [];

  return {
    hasTenant: (tenantId) => data.has(tenantId),

    listBlocklist: (tenantId) => [...(data.get(tenantId)?.blocklist ?? [])].sort(),
    isBlocklisted: (tenantId, domain) => data.get(tenantId)?.blocklist.has(domain) ?? false,
    addBlocklist(tenantId, domain) {
      const set = data.get(tenantId).blocklist;
      if (set.has(domain)) return false;
      set.add(domain);
      return true;
    },
    removeBlocklist: (tenantId, domain) => data.get(tenantId).blocklist.delete(domain),

    listAllowlist: (tenantId) => [...(data.get(tenantId)?.allowlist ?? [])].sort(),
    isAllowlisted: (tenantId, domain) => data.get(tenantId)?.allowlist.has(domain) ?? false,
    addAllowlist(tenantId, domain) {
      const set = data.get(tenantId).allowlist;
      if (set.has(domain)) return false;
      set.add(domain);
      return true;
    },
    removeAllowlist: (tenantId, domain) => data.get(tenantId).allowlist.delete(domain),

    appendAudit: (row) => audit.push(row),
    listAudit: (tenantId) => audit.filter((row) => row.tenantId === tenantId),
  };
}
