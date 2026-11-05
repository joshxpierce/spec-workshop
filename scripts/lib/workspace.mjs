// Shared helpers for building live demo workspaces.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

// Live workspaces live OUTSIDE this repo on purpose:
// 1. Claude Code loads CLAUDE.md from every parent folder. Inside this repo the
//    agent would pick up the workshop's own context files.
// 2. Inside this repo the agent could open ../solution and copy the answer.
export const LIVE_DIR = path.resolve(
  (process.env.SPEC_WORKSHOP_LIVE ?? path.join(os.homedir(), 'spec-workshop-live')).replace(/^~(?=$|\/)/, os.homedir()),
);

// What each variant gets on top of the starter.
//   weak:   the starter only. You paste the ticket.
//   strong: the starter plus specs/allowlist.md (the full nine-element spec).
//   rules:  the starter plus standing rules (AGENTS.md, CLAUDE.md) and a short task spec.
export const VARIANTS = {
  weak: { extras: [] },
  strong: { extras: [['prompts/strong.md', 'specs/allowlist.md']] },
  rules: {
    extras: [
      ['standing-rules/AGENTS.md', 'AGENTS.md'],
      ['standing-rules/CLAUDE.md', 'CLAUDE.md'],
      ['prompts/strong-with-rules.md', 'specs/allowlist.md'],
    ],
  },
};

// The first message to type or paste into the agent, per variant.
export function promptFor(variant) {
  if (variant === 'weak') return fs.readFileSync(path.join(ROOT, 'prompts/weak.txt'), 'utf8').trim();
  return 'Read specs/allowlist.md and carry it out.';
}

const git = (cwd, ...args) =>
  // Throwaway local commits: fixed identity, never signed (a global commit.gpgsign would fail without a key).
  execFileSync('git', ['-c', 'user.name=Workshop', '-c', 'user.email=workshop@example.invalid', '-c', 'commit.gpgsign=false', ...args], {
    cwd,
    stdio: 'pipe',
  }).toString();

// Recreates <LIVE_DIR>/<name> from the starter plus the variant's extras,
// as a fresh git repo with one baseline commit, so `git diff` shows only
// what the agent changed.
export function buildWorkspace(variant, name = variant) {
  if (!VARIANTS[variant]) throw new Error(`unknown variant "${variant}". Use: ${Object.keys(VARIANTS).join(', ')}`);
  const dir = path.join(LIVE_DIR, name);
  if (!dir.startsWith(LIVE_DIR + path.sep)) throw new Error(`refusing to touch ${dir}`);
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  fs.cpSync(path.join(ROOT, 'starter'), dir, { recursive: true });
  for (const [from, to] of VARIANTS[variant].extras) {
    fs.mkdirSync(path.dirname(path.join(dir, to)), { recursive: true });
    fs.copyFileSync(path.join(ROOT, from), path.join(dir, to));
  }
  git(dir, 'init', '-q', '-b', 'main');
  // Keep Finder litter out of the Source Control panel during the demo.
  fs.appendFileSync(path.join(dir, '.git/info/exclude'), '.DS_Store\n');
  git(dir, 'add', '-A');
  git(dir, 'commit', '-q', '-m', `baseline: starter${variant === 'weak' ? '' : ` + ${variant} inputs`}`);
  return dir;
}

// Overlays a finished result onto a workspace without committing, so the
// editor's diff view shows it exactly like an agent's uncommitted work.
export function overlaySolution(dir) {
  for (const sub of ['src', 'tests', 'bench']) {
    fs.cpSync(path.join(ROOT, 'solution', sub), path.join(dir, sub), { recursive: true });
  }
}

export function applyPatch(dir, patchFile) {
  git(dir, 'apply', '--whitespace=nowarn', patchFile);
}

export { git };
