// Daily summary consumed by the reporting dashboard.
// The labels below are a published contract. Do not rename existing entries.
export const REASON_LABELS = {
  BLOCKLIST: 'Blocked: tenant blocklist',
  SPF_FAIL: 'Blocked: SPF failure',
  ATTACHMENT_TYPE: 'Quarantined: risky attachment',
  CLEAN: 'Delivered: no rule matched',
  ALLOWLIST: 'Delivered: tenant allowlist',
};

export function labelFor(reason) {
  return REASON_LABELS[reason] ?? `Other (${reason})`;
}

// records: [{ verdict, reason }] -> [{ reason, label, count }] sorted by count desc.
export function summarize(records) {
  const counts = new Map();
  for (const { reason } of records) counts.set(reason, (counts.get(reason) ?? 0) + 1);
  return [...counts.entries()]
    .map(([reason, count]) => ({ reason, label: labelFor(reason), count }))
    .sort((a, b) => b.count - a.count || a.reason.localeCompare(b.reason));
}
