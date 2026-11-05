import { Verdict, Reason, SPF_RESULTS } from './models.js';
import { parseSender } from './sender.js';
import { blockRules, quarantineRules } from './quarantine/rules.js';

// Returns a list of validation errors for a POST /verdict body.
export function validateMessage(body, store) {
  const errors = [];
  if (!body || typeof body !== 'object') return ['body must be a JSON object'];
  if (typeof body.sender !== 'string' || !parseSender(body.sender).domain) {
    errors.push('sender must be an email address');
  }
  if (typeof body.tenantId !== 'string' || !store.hasTenant(body.tenantId)) {
    errors.push('tenantId must be a known tenant');
  }
  if (body.spf !== undefined && !SPF_RESULTS.includes(body.spf)) {
    errors.push(`spf must be one of ${SPF_RESULTS.join(', ')}`);
  }
  if (body.attachments !== undefined && !Array.isArray(body.attachments)) {
    errors.push('attachments must be an array');
  }
  return errors;
}

// Evaluates a validated message. Returns { verdict, reason, senderDomain }.
export function evaluate(message, store) {
  const sender = parseSender(message.sender);
  const context = { store, sender };
  for (const rule of [...blockRules, ...quarantineRules]) {
    const result = rule.evaluate(message, context);
    if (result) return { ...result, senderDomain: sender.domain };
  }
  return { verdict: Verdict.ALLOW, reason: Reason.CLEAN, senderDomain: sender.domain };
}
