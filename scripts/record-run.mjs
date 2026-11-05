#!/usr/bin/env node
// Records a real, headless agent run for one variant and saves the evidence
// to fallback/runs/<variant>/ for use if the live run is slow or fails.
//
//   node scripts/record-run.mjs weak|strong|rules [--agent claude|codex] [--tag 2]
//
// Saves: meta.json, transcript.md, stream.jsonl, diff.patch, verify.txt.
// Nothing is edited by hand. Re-run to replace a recording.
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, buildWorkspace, promptFor, git } from './lib/workspace.mjs';

const variant = process.argv[2];
const flag = (name) => (process.argv.includes(name) ? process.argv[process.argv.indexOf(name) + 1] : null);
const agent = flag('--agent') ?? 'claude';
const tag = flag('--tag'); // optional: keep several recordings side by side, e.g. --tag 2
if (!['weak', 'strong', 'rules'].includes(variant)) {
  console.error('usage: node scripts/record-run.mjs weak|strong|rules [--agent claude|codex]');
  process.exit(2);
}

const label = tag ? `${variant}-${tag}` : variant;
const out = path.join(ROOT, 'fallback/runs', label);
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });
const dir = buildWorkspace(variant, `record-${label}`);
const prompt = promptFor(variant);

const cmd =
  agent === 'codex'
    ? ['codex', ['exec', '--full-auto', '--json', prompt]]
    : [
        'claude',
        ['-p', prompt, '--setting-sources', 'project,local', '--permission-mode', 'auto', '--output-format', 'stream-json', '--verbose'],
      ];

console.log(`recording ${variant} with ${agent} in ${dir}`);
const started = Date.now();
const stream = fs.createWriteStream(path.join(out, 'stream.jsonl'));
const child = spawn(cmd[0], cmd[1], { cwd: dir, stdio: ['ignore', 'pipe', 'pipe'] });
child.stdout.pipe(stream);
let stderr = '';
child.stderr.on('data', (d) => (stderr += d));
const code = await new Promise((resolve) => child.on('exit', resolve));
await new Promise((resolve) => stream.end(resolve));
const seconds = Math.round((Date.now() - started) / 1000);

// Diff of everything the agent changed, including new files.
git(dir, 'add', '-A');
fs.writeFileSync(path.join(out, 'diff.patch'), git(dir, 'diff', '--cached', '--binary'));
git(dir, 'reset', '-q');

const verify = spawnSync(process.execPath, [path.join(ROOT, 'scripts/verify.mjs'), dir], { encoding: 'utf8' });
fs.writeFileSync(path.join(out, 'verify.txt'), verify.stdout + verify.stderr);

const events = fs
  .readFileSync(path.join(out, 'stream.jsonl'), 'utf8')
  .split('\n')
  .filter(Boolean)
  .map((l) => {
    try {
      return JSON.parse(l);
    } catch {
      return null;
    }
  })
  .filter(Boolean);
const result = events.find((e) => e.type === 'result') ?? {};
const init = events.find((e) => e.type === 'system' && e.subtype === 'init') ?? {};
const version = spawnSync(cmd[0], ['--version'], { encoding: 'utf8' }).stdout.trim();

const meta = {
  variant,
  agent,
  agentVersion: version,
  model: init.model ?? null,
  firstMessage: prompt,
  recordedAt: new Date().toISOString(),
  wallClockSeconds: seconds,
  exitCode: code,
  turns: result.num_turns ?? null,
  costUsd: result.total_cost_usd ?? null,
  verifyExitCode: verify.status,
  workspace: dir,
};
fs.writeFileSync(path.join(out, 'meta.json'), JSON.stringify(meta, null, 2) + '\n');
fs.writeFileSync(path.join(out, 'transcript.md'), renderTranscript(meta, events, stderr));

console.log(`done in ${seconds}s, exit ${code}. verify exit ${verify.status}. Evidence in ${out}`);

function renderTranscript(meta, events, stderr) {
  const lines = [
    `# Recorded run: ${meta.variant}`,
    '',
    `Real headless run, not edited. ${meta.agent} ${meta.agentVersion}, model ${meta.model ?? 'unknown'}, recorded ${meta.recordedAt}, ${meta.wallClockSeconds}s wall clock, ${meta.turns ?? '?'} turns.`,
    '',
    `First message: \`${meta.firstMessage.replace(/`/g, "'")}\``,
    '',
    'Scorecard: [verify.txt](verify.txt). Changes: [diff.patch](diff.patch).',
    '',
    '---',
    '',
  ];
  for (const e of events) {
    if (e.type !== 'assistant') continue;
    for (const block of e.message?.content ?? []) {
      if (block.type === 'text' && block.text.trim()) lines.push(block.text.trim(), '');
      if (block.type === 'tool_use') lines.push(`> **${block.name}** ${summarize(block.name, block.input)}`, '');
    }
  }
  const result = events.find((e) => e.type === 'result');
  if (result?.result) lines.push('---', '', '## Final report from the agent', '', result.result.trim(), '');
  if (stderr.trim()) lines.push('---', '', '## stderr', '', '```', stderr.trim().slice(0, 4000), '```', '');
  return lines.join('\n');
}

function summarize(name, input = {}) {
  if (input.file_path) return '`' + path.basename(path.dirname(input.file_path)) + '/' + path.basename(input.file_path) + '`';
  if (input.command) return '`' + String(input.command).split('\n')[0].slice(0, 120) + '`';
  if (input.pattern) return '`' + input.pattern + '`';
  if (input.todos) return `${input.todos.length} todos`;
  return '';
}
