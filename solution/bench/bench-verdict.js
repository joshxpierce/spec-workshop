// Benchmark for evaluate(). Prints p50 and p95 in milliseconds.
// Usage: npm run bench
import { performance } from 'node:perf_hooks';
import { createStore } from '../src/store.js';
import { evaluate } from '../src/verdict.js';

const ITERATIONS = 20000;
const ALLOWLIST_ENTRIES = 1000;
const store = createStore();
for (let i = 0; i < ALLOWLIST_ENTRIES - 1; i++) store.addAllowlist('acme', `vendor${i}.example`);
store.addAllowlist('acme', 'vendorcorp.com');

const messages = [
  { tenantId: 'acme', sender: 'billing@vendorcorp.com', spf: 'pass', attachments: [{ filename: 'invoice.zip' }] },
  { tenantId: 'acme', sender: 'news@known-bad.example', spf: 'pass' },
  { tenantId: 'globex', sender: '"Ops" <ops@partner.example>', spf: 'none', attachments: [] },
];

const samples = [];
for (let i = 0; i < ITERATIONS; i++) {
  const message = messages[i % messages.length];
  const start = performance.now();
  evaluate(message, store);
  samples.push(performance.now() - start);
}

samples.sort((a, b) => a - b);
const pct = (p) => samples[Math.min(samples.length - 1, Math.floor((p / 100) * samples.length))];
console.log(JSON.stringify({ benchmark: 'evaluate', iterations: ITERATIONS, allowlistEntries: ALLOWLIST_ENTRIES, p50_ms: +pct(50).toFixed(4), p95_ms: +pct(95).toFixed(4) }));
