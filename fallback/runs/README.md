# Recorded runs

Real headless Claude Code runs, recorded Nov 5, 2026 with `scripts/record-run.mjs`. Claude Code 2.1.318, model claude-opus-5-5, `--setting-sources project,local`, `--permission-mode auto`. Transcripts and diffs are unedited. In this copy the recorder's home folder is shown as `~`, and the raw `stream.jsonl` event logs are left out because they hold session IDs and local machine setup. `scripts/record-run.mjs` writes one for your own runs. `verify.txt` was regenerated from the untouched recorded workspaces after the scorecard gained its section 4.

| Run | First message | Time | Scorecard | SPF softfail, allowlisted |
|---|---|---|---|---|
| [weak](weak/transcript.md) | the ticket | 66 s | 9 of 10 (C1 no `allowlist_hit` log) | QUARANTINE (agent added an SPF-pass rule) |
| [weak-2](weak-2/transcript.md) | the ticket | 62 s | 9 of 10 (C1) | QUARANTINE |
| [weak-3](weak-3/transcript.md) | the ticket | 75 s | 9 of 10 (C1) | QUARANTINE |
| [strong](strong/transcript.md) | `Read specs/allowlist.md and carry it out.` | 76 s | 10 of 10 | ALLOW (as the spec says) |
| [rules](rules/transcript.md) | same, with `AGENTS.md` and the short spec | 80 s | 10 of 10 | ALLOW (as the spec says) |

Each folder holds `meta.json`, `transcript.md`, `diff.patch` (apply with `node scripts/reset-demo.mjs <variant> --fallback recorded`), and `verify.txt`.

One recording is one sample. Agents vary run to run.
