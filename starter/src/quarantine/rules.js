import { Verdict, Reason, RISKY_ATTACHMENT_EXTENSIONS } from '../models.js';

// Rules run in order. The first rule that returns a result decides the verdict.
// BLOCK rules always run before QUARANTINE rules.

export const blockRules = [
  {
    name: 'blocklist',
    evaluate: (message, { store, sender }) =>
      store.isBlocklisted(message.tenantId, sender.domain)
        ? { verdict: Verdict.BLOCK, reason: Reason.BLOCKLIST }
        : null,
  },
  {
    name: 'spf',
    evaluate: (message) =>
      message.spf === 'fail' ? { verdict: Verdict.BLOCK, reason: Reason.SPF_FAIL } : null,
  },
];

export const quarantineRules = [
  {
    name: 'attachmentType',
    evaluate: (message) => {
      const risky = (message.attachments ?? []).some((a) =>
        RISKY_ATTACHMENT_EXTENSIONS.some((ext) => String(a.filename).toLowerCase().endsWith(ext)),
      );
      return risky ? { verdict: Verdict.QUARANTINE, reason: Reason.ATTACHMENT_TYPE } : null;
    },
  },
];
