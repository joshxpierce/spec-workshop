import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseSender, normalizeDomain } from '../src/sender.js';

test('parses a bare address', () => {
  assert.deepEqual(parseSender('billing@vendorcorp.com'), {
    displayName: '',
    address: 'billing@vendorcorp.com',
    domain: 'vendorcorp.com',
  });
});

test('parses a display name and angle address', () => {
  const s = parseSender('"Vendor Billing" <billing@vendorcorp.com>');
  assert.equal(s.displayName, 'Vendor Billing');
  assert.equal(s.address, 'billing@vendorcorp.com');
  assert.equal(s.domain, 'vendorcorp.com');
});

test('domain is lowercased and trimmed', () => {
  assert.equal(parseSender('Billing@VendorCorp.COM ').domain, 'vendorcorp.com');
  assert.equal(normalizeDomain('  VendorCorp.COM.  '), 'vendorcorp.com');
});

test('internationalized domains are converted to punycode', () => {
  assert.equal(normalizeDomain('bücher.example'), 'xn--bcher-kva.example');
  assert.equal(parseSender('info@BÜCHER.example').domain, 'xn--bcher-kva.example');
});

test('invalid domains normalize to empty string', () => {
  for (const bad of ['', 'not a domain', 'localhost', '*.vendorcorp.com', 'a@b.com', null]) {
    assert.equal(normalizeDomain(bad), '', `expected "${bad}" to be rejected`);
  }
});
