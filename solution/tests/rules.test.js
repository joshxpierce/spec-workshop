import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createStore } from '../src/store.js';
import { evaluate, validateMessage } from '../src/verdict.js';

const store = createStore();
const msg = (overrides) => ({ tenantId: 'acme', sender: 'ops@partner.example', spf: 'pass', ...overrides });
const pick = ({ verdict, reason }) => ({ verdict, reason });

test('clean message is allowed', () => {
  assert.deepEqual(pick(evaluate(msg(), store)), { verdict: 'ALLOW', reason: 'CLEAN' });
});

test('blocklisted sender domain is blocked', () => {
  assert.deepEqual(pick(evaluate(msg({ sender: 'x@known-bad.example' }), store)), {
    verdict: 'BLOCK',
    reason: 'BLOCKLIST',
  });
});

test('SPF failure is blocked', () => {
  assert.deepEqual(pick(evaluate(msg({ spf: 'fail' }), store)), { verdict: 'BLOCK', reason: 'SPF_FAIL' });
});

test('risky attachment is quarantined', () => {
  const result = evaluate(msg({ attachments: [{ filename: 'invoice.zip' }] }), store);
  assert.deepEqual(pick(result), { verdict: 'QUARANTINE', reason: 'ATTACHMENT_TYPE' });
});

test('attachment extension check is case-insensitive', () => {
  const result = evaluate(msg({ attachments: [{ filename: 'REPORT.DOCM' }] }), store);
  assert.equal(result.verdict, 'QUARANTINE');
});

test('BLOCK rules win over QUARANTINE rules', () => {
  const result = evaluate(msg({ sender: 'x@known-bad.example', attachments: [{ filename: 'a.zip' }] }), store);
  assert.deepEqual(pick(result), { verdict: 'BLOCK', reason: 'BLOCKLIST' });
});

test('blocklist is tenant-scoped', () => {
  const result = evaluate(msg({ tenantId: 'globex', sender: 'x@known-bad.example' }), store);
  assert.deepEqual(pick(result), { verdict: 'ALLOW', reason: 'CLEAN' });
});

test('validateMessage rejects bad input', () => {
  assert.deepEqual(validateMessage(msg(), store), []);
  assert.ok(validateMessage(msg({ sender: 'nobody' }), store).length);
  assert.ok(validateMessage(msg({ tenantId: 'initech' }), store).length);
  assert.ok(validateMessage(msg({ spf: 'maybe' }), store).length);
  assert.ok(validateMessage(msg({ attachments: 'a.zip' }), store).length);
});
