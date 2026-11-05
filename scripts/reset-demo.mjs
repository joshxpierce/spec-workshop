#!/usr/bin/env node
// Restores the live demo workspaces to their starting state.
//
//   node scripts/reset-demo.mjs                 reset weak, strong, and rules
//   node scripts/reset-demo.mjs strong          reset one
//   node scripts/reset-demo.mjs strong --fallback solution
//        reset, then overlay the reference solution (uncommitted) so the
//        diff view and verify show the expected result
//   node scripts/reset-demo.mjs strong --fallback recorded
//        reset, then apply the recorded dry-run diff from fallback/runs/strong
//
// Workspaces live in ~/spec-workshop-live (override with SPEC_WORKSHOP_LIVE).
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, LIVE_DIR, VARIANTS, buildWorkspace, overlaySolution, applyPatch, promptFor } from './lib/workspace.mjs';

const args = process.argv.slice(2);
const fallbackIdx = args.indexOf('--fallback');
const fallback = fallbackIdx === -1 ? null : args[fallbackIdx + 1];
const names = args.filter((a, i) => !a.startsWith('--') && i !== fallbackIdx + 1);
const targets = names.length ? names : Object.keys(VARIANTS);

if (fallback && !['solution', 'recorded'].includes(fallback)) {
  console.error('--fallback must be "solution" or "recorded"');
  process.exit(2);
}

for (const variant of targets) {
  const dir = buildWorkspace(variant);
  let note = 'clean starter state, ready for the agent';
  if (fallback === 'solution') {
    overlaySolution(dir);
    note = 'FALLBACK: reference solution overlaid (uncommitted). This is not an agent run.';
  } else if (fallback === 'recorded') {
    const patch = path.join(ROOT, 'fallback/runs', variant, 'diff.patch');
    if (!fs.existsSync(patch)) {
      console.error(`no recorded run for "${variant}" at ${patch}`);
      process.exit(1);
    }
    applyPatch(dir, patch);
    note = `FALLBACK: recorded dry-run diff applied from fallback/runs/${variant}`;
  }
  console.log(`${variant.padEnd(7)} ${dir}\n        ${note}`);
  if (!fallback) console.log(`        first message: ${promptFor(variant)}`);
}

writeWorkspaceFile();
console.log(`\nVS Code workspace: ${path.join(ROOT, 'spec-workshop.code-workspace')}`);

// Writes a multi-root VS Code workspace (kit + live folders) with one-click tasks.
function writeWorkspaceFile() {
  const live = (v) => path.join(LIVE_DIR, v);
  const kit = '${workspaceFolder:workshop kit}';
  const agent = (v) => ({
    label: `Agent: open Claude Code in live ${v}`,
    type: 'shell',
    // project,local: load the workspace's own CLAUDE.md but not your personal
    // user-level CLAUDE.md, plugins, or hooks. Weak opens in acceptEdits so the
    // run does not stall on prompts; strong and rules open in plan mode so the
    // plan review (checkpoint one) happens before any edit.
    command: `claude --setting-sources project,local --permission-mode ${v === 'weak' ? 'acceptEdits' : 'plan'}`,
    options: { cwd: live(v) },
    presentation: { panel: 'dedicated', focus: true, reveal: 'always' },
    problemMatcher: [],
  });
  const node = (label, script) => ({
    label,
    type: 'shell',
    command: `node ${script}`,
    options: { cwd: kit },
    presentation: { panel: 'shared', focus: true, reveal: 'always', clear: true },
    problemMatcher: [],
  });
  const workspace = {
    folders: [
      { name: 'workshop kit', path: ROOT },
      { name: 'live: weak', path: live('weak') },
      { name: 'live: strong', path: live('strong') },
      { name: 'live: rules', path: live('rules') },
    ],
    settings: {
      'git.autoRepositoryDetection': true,
      'markdown.preview.breaks': false,
      'workbench.startupEditor': 'none',
      'files.exclude': { '**/node_modules': true },
    },
    tasks: {
      version: '2.0.0',
      tasks: [
        node('Reset: all live workspaces', 'scripts/reset-demo.mjs'),
        agent('weak'),
        agent('strong'),
        agent('rules'),
        node('Verify: live weak', `scripts/verify.mjs ${live('weak')}`),
        node('Verify: live strong', `scripts/verify.mjs ${live('strong')}`),
        node('Verify: live rules', `scripts/verify.mjs ${live('rules')}`),
        node('Verify: reference solution', 'scripts/verify.mjs solution'),
        node('Verify: starter (expected: feature not observed)', 'scripts/verify.mjs starter'),
        node('Fallback: strong <- reference solution', 'scripts/reset-demo.mjs strong --fallback solution'),
        node('Fallback: strong <- recorded dry run', 'scripts/reset-demo.mjs strong --fallback recorded'),
        node('Fallback: weak <- recorded dry run', 'scripts/reset-demo.mjs weak --fallback recorded'),
      ],
    },
  };
  fs.writeFileSync(path.join(ROOT, 'spec-workshop.code-workspace'), JSON.stringify(workspace, null, 2) + '\n');
}
