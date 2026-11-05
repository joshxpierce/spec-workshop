#!/usr/bin/env node
// Scores a triage-service directory against specs/allowlist.md.
//
//   node scripts/verify.mjs <target-dir>        e.g. starter, solution, ~/spec-workshop-live/strong
//
// Prints three sections: the target's own test suite, the independent
// acceptance scorecard, and a scope report (files touched vs the starter).
// Nothing here is staged: every line comes from running the target.
import { run } from 'node:test';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const STARTER = path.join(ROOT, 'starter');
const arg = process.argv[2];
if (!arg) {
  console.error('usage: node scripts/verify.mjs <target-dir>');
  process.exit(2);
}
const target = path.resolve(arg.replace(/^~(?=$|\/)/, os.homedir()));
if (!fs.existsSync(path.join(target, 'src/server.js'))) {
  console.error(`not a triage-service directory: ${target}`);
  process.exit(2);
}

const bold = (s) => (process.stdout.isTTY ? `\x1b[1m${s}\x1b[0m` : s);
const color = (code, s) => (process.stdout.isTTY ? `\x1b[${code}m${s}\x1b[0m` : s);
const PASS = color(32, 'PASS');
const FAIL = color(31, 'FAIL');
const NOBS = color(33, 'NOT OBSERVED');

console.log(bold(`\nTarget: ${target}\n`));

// 1. The target's own tests.
console.log(bold('1. Target test suite (npm test in the target)'));
const own = spawnSync('npm', ['test', '--silent', '--', '--test-reporter=spec'], { cwd: target, encoding: 'utf8' });
const count = (k) => Number(own.stdout.match(new RegExp(`ℹ ${k} (\\d+)`))?.[1] ?? 0);
console.log(`   ${own.status === 0 ? PASS : FAIL}  ${count('pass')} passed, ${count('fail')} failed, ${count('tests')} total\n`);

// 2. Acceptance scorecard.
console.log(bold('2. Acceptance scorecard (independent black-box suite)'));
process.env.TARGET_DIR = target;
// node:test reports child tests before their parent suite, so buffer children
// and attach them when the suite (nesting 0) closes.
const ordered = [];
let buffer = [];
const stream = run({ files: [path.join(ROOT, 'acceptance/allowlist.acceptance.test.js')], concurrency: false });
for await (const event of stream) {
  if (event.type !== 'test:pass' && event.type !== 'test:fail') continue;
  const { name, nesting, skip, details } = event.data;
  const err = details?.error?.cause?.message ?? details?.error?.message;
  if (nesting === 1) {
    buffer.push({ name, status: skip ? 'nobs' : event.type === 'test:pass' ? 'pass' : 'fail', why: skip ? null : err });
  } else if (nesting === 0) {
    ordered.push({ name, tests: buffer, hookFailed: event.type === 'test:fail' && buffer.length === 0, err });
    buffer = [];
  }
}

let failures = 0;
let notObserved = 0;
for (const s of ordered) {
  const statuses = s.tests.map((t) => t.status);
  let verdict;
  if (s.hookFailed) verdict = FAIL;
  else if (statuses.includes('fail')) verdict = FAIL;
  else if (statuses.length && statuses.every((x) => x === 'nobs')) verdict = NOBS;
  else if (statuses.includes('nobs')) verdict = NOBS;
  else verdict = PASS;
  if (verdict === FAIL) failures++;
  if (verdict === NOBS) notObserved++;
  console.log(`   ${verdict.padEnd(process.stdout.isTTY ? 21 : 12)}  ${s.name}`);
  if (s.hookFailed) console.log(`      ${color(31, 'x')} ${firstLine(s.err)}`);
  for (const t of s.tests) {
    if (t.status === 'fail') console.log(`      ${color(31, 'x')} ${t.name}\n        ${firstLine(t.why)}`);
  }
}
if (notObserved) {
  console.log(`\n   ${NOBS} counts as not met. This target has no POST /tenants/:tenantId/allowlist`);
  console.log('   (the interface the spec defines), so the suite cannot drive those checks.');
  console.log('   After a weak-prompt run this usually means the agent invented its own interface.');
}
console.log('');

// 3. Scope report.
console.log(bold('3. Scope: files changed vs the starter'));
const ALLOWED = [
  /^src\/(models|store|app|verdict|audit)\.js$/,
  /^src\/quarantine\//,
  /^src\/reporting\//,
  /^tests\//,
  /^bench\/bench-verdict\.js$/,
  /^specs\//,
];
const IGNORE = /^(\.git|node_modules|\.claude|AGENTS\.md|CLAUDE\.md|specs)(\/|$)/; // inputs, not changes
const list = (dir) =>
  fs
    .readdirSync(dir, { recursive: true, withFileTypes: true })
    .filter((d) => d.isFile())
    .map((d) => path.relative(dir, path.join(d.parentPath ?? d.path, d.name)))
    .filter((p) => !IGNORE.test(p));
const before = new Set(list(STARTER));
const after = new Set(list(target));
const changes = [];
for (const f of after) {
  if (!before.has(f)) changes.push(['added', f]);
  else if (!fs.readFileSync(path.join(STARTER, f)).equals(fs.readFileSync(path.join(target, f)))) changes.push(['modified', f]);
}
for (const f of before) if (!after.has(f)) changes.push(['deleted', f]);
if (!changes.length) console.log('   no changes');
for (const [kind, f] of changes.sort((a, b) => a[1].localeCompare(b[1]))) {
  const inScope = kind !== 'deleted' && ALLOWED.some((re) => re.test(f));
  console.log(`   ${kind.padEnd(8)} ${f}${inScope ? '' : color(33, '   <- outside the spec\'s context list: review')}`);
}

// 4. Decisions the spec in prompts/strong.md does not make. Reported, not scored.
console.log(bold('\n4. Unspecified decision: allowlisted vendor domain with weak SPF (reported, not scored)'));
try {
  const { startTarget, contractAdd, invoice } = await import('../acceptance/harness.js');
  const t = await startTarget(target);
  try {
    const add = await contractAdd(t, 'vendorcorp.com');
    if (add.status === 404 || add.status === 405) {
      console.log('   not observed (no allowlist endpoint)');
    } else {
      const cells = [];
      for (const spf of ['pass', 'softfail', 'none', undefined]) {
        const r = await t.request('POST', '/verdict', { body: invoice({ spf }) });
        cells.push(`spf ${spf ?? 'missing'}: ${r.body?.verdict}`);
      }
      console.log(`   ${cells.join('   ')}`);
      console.log('   ALLOW on softfail/none/missing means a forged vendor domain delivers a .zip. Who decided?');
    }
  } finally {
    await t.stop();
  }
} catch (err) {
  console.log(`   could not probe: ${err.message.split('\n')[0]}`);
}

console.log(bold(`\nResult: ${failures} failed, ${notObserved} not observed, ${ordered.length - failures - notObserved} passed of ${ordered.length} checks\n`));
process.exit(failures || notObserved || own.status !== 0 ? 1 : 0);

function firstLine(s) {
  return String(s ?? '').split('\n').filter(Boolean).slice(0, 3).join(' | ');
}
