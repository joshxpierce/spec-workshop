import { test } from 'node:test';
import assert from 'node:assert/strict';
import { REASON_LABELS, labelFor, summarize } from '../src/reporting/daily-summary.js';

test('published reason labels are unchanged', () => {
  const published = {
    BLOCKLIST: 'Blocked: tenant blocklist',
    SPF_FAIL: 'Blocked: SPF failure',
    ATTACHMENT_TYPE: 'Quarantined: risky attachment',
    CLEAN: 'Delivered: no rule matched',
  };
  for (const [reason, label] of Object.entries(published)) {
    assert.equal(REASON_LABELS[reason], label, `label for ${reason} changed`);
  }
});

test('unknown reasons get a fallback label', () => {
  assert.equal(labelFor('SOMETHING_NEW'), 'Other (SOMETHING_NEW)');
});

test('summarize counts by reason, highest first', () => {
  const rows = summarize([
    { verdict: 'ALLOW', reason: 'CLEAN' },
    { verdict: 'BLOCK', reason: 'SPF_FAIL' },
    { verdict: 'ALLOW', reason: 'CLEAN' },
  ]);
  assert.deepEqual(rows, [
    { reason: 'CLEAN', label: 'Delivered: no rule matched', count: 2 },
    { reason: 'SPF_FAIL', label: 'Blocked: SPF failure', count: 1 },
  ]);
});
