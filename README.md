# Spec workshop kit

Live example for the workshop "AI-Native Transformation: Software Development in Practice": one vague ticket, one agent-ready spec, the same coding agent, and an independent test suite that scores the result.

The sandbox is `triage-service`, a small fictional message-triage API (Node 20+, no dependencies). The task: let a tenant admin allowlist a vendor's sender domain without opening a phishing bypass.

Start with **[pack/](pack/README.md)**: spec template, rubric, and standing-rules templates. Then run the commands below.

## Layout

| Path | What it is |
|---|---|
| `starter/` | The service before the feature. 24 passing tests. This is what the agent starts from |
| `solution/` | Hand-written reference implementation. 32 tests. Used to prove the acceptance suite and as the last-resort fallback |
| `prompts/weak.txt` | The ticket as customers wrote it |
| `prompts/strong.md` | The nine-element spec the agent runs (copied into the live folder as `specs/allowlist.md`) |
| `prompts/strong-with-rules.md` | The same task as a short spec, for a repo that has standing rules |
| `standing-rules/` | `AGENTS.md` and a one-line `CLAUDE.md` for the sandbox: rules every task inherits |
| `acceptance/` | Independent black-box acceptance suite. Starts the target server and tests over HTTP |
| `scripts/verify.mjs` | Scores any target folder: its own tests, the acceptance scorecard, and a scope report |
| `scripts/reset-demo.mjs` | Rebuilds the live folders, and switches to a fallback |
| `scripts/record-run.mjs` | Records a real headless agent run as fallback evidence |
| `fallback/runs/` | Recorded runs from the live session: transcript, diff, scorecard, metadata |
| `pack/` | Spec template, rubric, `AGENTS.md` and `CLAUDE.md` templates |

## Commands

Run from this folder. Node 20 or newer.

```sh
node scripts/reset-demo.mjs                        # rebuild ~/spec-workshop-live/{weak,strong,rules}
node scripts/verify.mjs solution                   # expect 10 of 10 checks passed
node scripts/verify.mjs starter                    # expect 24 tests pass, feature checks NOT OBSERVED
node scripts/verify.mjs ~/spec-workshop-live/strong
node scripts/reset-demo.mjs strong --fallback recorded
node scripts/reset-demo.mjs strong --fallback solution
node scripts/record-run.mjs strong                 # re-record a fallback run (about 1 to 2 minutes)
```

`reset-demo.mjs` also writes `spec-workshop.code-workspace`, a VS Code workspace with the kit and the three live folders, and one-click tasks for every command above.

## Why the live folders are outside this repo

Claude Code loads `CLAUDE.md` from every parent folder. A live folder inside this repo would inherit this repo's context, and the agent could open `../solution`. The live folders are in `~/spec-workshop-live/` (override with `SPEC_WORKSHOP_LIVE`). The agent tasks launch Claude Code with `--setting-sources project,local`, so the presenter's personal `CLAUDE.md`, plugins, and hooks do not load either.

## What the scorecard checks

| Check | How |
|---|---|
| AC1 to AC6 | The six acceptance criteria on deck slide 19, over HTTP |
| C1 | `allowlist_hit` log line exists; no subject, local part, or attachment name in any log line |
| C2 | No dependencies declared, no `node_modules` |
| C3 | `src/auth.js` byte-identical to the starter |
| C4 | The starter's original 24 tests, copied in fresh, pass against the changed code |
| Scope | Every file added, modified, or deleted vs the starter, flagged if outside the spec's context list |

**NOT OBSERVED** means the target has no `POST /tenants/:tenantId/allowlist`, so the suite cannot drive that check. It counts as not met.

## Honesty rules

- Recorded runs in `fallback/runs/` are real, unedited headless runs. In this copy the recorder's home folder is shown as `~` and the raw event streams are left out. `meta.json` records the agent, version, model, time, and cost.
- `solution/` is hand-written. Never present it as agent output.
- One recorded run is one sample. Agents vary run to run.

## License

MIT. See [LICENSE](LICENSE).
