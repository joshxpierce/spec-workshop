# Spec workshop kit

Learn to write specs that coding agents can carry out, and to build the habit into your repos so each spec gets shorter over time.

## Summary

Give a coding agent a vague ticket and it fills the gaps with its own guesses. Give it a spec and it builds what you meant. This repo lets you see that difference, measure it, and practice closing it.

It contains:

- **A small practice service.** `starter/` is a fictional email-triage API (Node 20+, no dependencies) that agents are asked to change.
- **The same request written two ways.** [`prompts/weak.txt`](prompts/weak.txt) is a one-sentence ticket. [`prompts/strong.md`](prompts/strong.md) is a nine-element spec for the same work.
- **An independent scorecard.** `node scripts/verify.mjs <folder>` tests the agent's result from the outside and reports which files it touched.
- **Real recorded agent runs.** [`fallback/runs/`](fallback/runs/README.md) shows what an agent did with each prompt and how it scored. The weak ticket scored 9 of 10 in 3 of 3 runs; the strong spec scored 10 of 10.
- **Templates for your own work.** [`pack/`](pack/README.md) has the spec template, a scoring rubric, practice tickets, and `AGENTS.md` / `CLAUDE.md` templates.

## Getting started

Follow **[GUIDE.md](GUIDE.md)**: eight short steps, about 45 minutes, from setup to writing, running, and scoring your own spec. Each step says what you should see.

For a writing-first exercise, start with the [participant pack](pack/README.md). The [developer manual](pack/developer-manual.md) provides the full procedure, test examples, evidence requirements, and troubleshooting.

The quickest way in is to let your coding agent guide you. Clone the repo, open your agent in the folder, and paste:

> Read README.md and GUIDE.md. Walk me through GUIDE.md one step at a time. Run the commands for me, explain what I should see, and wait for me before moving to the next step.

To do it by hand:

1. `git clone https://github.com/joshxpierce/spec-workshop.git`
2. `cd spec-workshop`
3. `node scripts/reset-demo.mjs`. You should see "clean starter state" three times.
4. `node scripts/verify.mjs solution`. The last line should read `10 passed of 10 checks`.
5. Open [GUIDE.md](GUIDE.md) at step 1.

## Diving deeper: from writing specs to repos that carry them

A good spec repeats things that are true for every task: where code lives, house rules, security limits, when to stop and ask. Writing those into every spec is slow, and people forget. The next level is to write them once, in the repo, where every agent reads them.

**The loop**

1. Write a spec and run it.
2. Diagnose each miss: did the spec say it? If not, add the line.
3. Ask of each added line: is it true for every task in this repo? If yes, move it into `AGENTS.md`.
4. The next spec is shorter, and every teammate's agent inherits the fix.

**What goes where**

| Put it in | When it is | Examples |
|---|---|---|
| `AGENTS.md` | True for every task | Context map, commands, conventions, security constraints, stop-and-ask rules, how to report |
| The spec | True for this task only | Outcome, scope, interface, acceptance criteria |
| Tests | Checkable by a machine | Acceptance criteria turned into tests the agent did not write |

**See it in this repo.** [`standing-rules/AGENTS.md`](standing-rules/AGENTS.md) holds the sandbox's standing rules. With them in place, the allowlist spec shrinks from 582 words ([`prompts/strong.md`](prompts/strong.md)) to 242 ([`prompts/strong-with-rules.md`](prompts/strong-with-rules.md)), and the recorded run still scored 10 of 10. Try it with `node scripts/reset-demo.mjs rules`.

**Do it in your own repo**

1. Copy [`pack/AGENTS.template.md`](pack/AGENTS.template.md) to your repo root as `AGENTS.md`. Fill in the context map, commands, constraints, and stop-and-ask rules.
2. Copy [`pack/CLAUDE.template.md`](pack/CLAUDE.template.md) as `CLAUDE.md`. It is one line, `@AGENTS.md`, so Claude Code reads the same rules as Codex, Cursor, and other agents.
3. Add a `specs/` folder. Commit each spec with the change it produced, and review the spec in the pull request alongside the code.
4. Turn acceptance criteria into tests the agent did not write. [`acceptance/`](acceptance/) is a model: it tests over HTTP and never imports the code it checks.
5. After each run, review the "the spec did not say X" lines as a team. Rules true for every task go into `AGENTS.md` through a pull request, like code.
6. Keep `AGENTS.md` short and current. Delete rules that no longer apply; stale rules mislead agents.

## FAQ

**Where do I write my spec, and will my agent see it?**
In a practice folder, for example `~/spec-workshop-live/weak/specs/my-spec.md`. You start your agent in that same folder, so it sees the spec. GUIDE.md step 4 has the commands.

**Why are the practice folders outside the repo?**
If they were inside, the agent could read `solution/` (the answer key), and Claude Code would load this repo's own `CLAUDE.md`. Both would spoil the experiment. Set `SPEC_WORKSHOP_LIVE` to use a different location.

**I don't know what to write for "who is affected" or "what is wrong".**
Pick a ticket from [`pack/practice-tickets.md`](pack/practice-tickets.md). Each one answers those questions and lists the files to read. On real work, if you cannot answer them, ask whoever filed the ticket. The agent cannot answer them either.

**I don't use Claude Code.**
Any coding agent that can read files and run commands works (Codex, Cursor, and others). Open it in the practice folder and send the same first message. The scorecard does not care which agent made the change.

**I don't have a coding agent at all.**
Read the recorded runs in [`fallback/runs/`](fallback/runs/README.md) and work through the guide's writing and scoring steps. You can still write a spec and score it against the rubric by hand.

**What does NOT OBSERVED mean on the scorecard?**
The folder has no `POST /tenants/:tenantId/allowlist`, so the suite cannot test the feature. It counts as not met. You will see it on the starter, and after any spec that is not the allowlist ticket.

**Why does section 4 of the scorecard say `ALLOW` for SPF softfail?**
Because [`prompts/strong.md`](prompts/strong.md) does not say what to do when an allowlisted domain fails a weak SPF check. The agent followed the spec, so a forged vendor domain gets through. It is a spec defect, left in on purpose as a diagnosis exercise. The fix is one line: "The allowlist applies only when `spf` is `pass`; otherwise the normal rules apply."

**I ran `reset-demo.mjs` and my spec is gone.**
Reset deletes and rebuilds the practice folder. Keep a copy of your spec outside `~/spec-workshop-live/`.

**I ran `record-run.mjs` and now `git status` shows changes in `fallback/runs/`.**
Recording replaces that run's files in your copy. Keep yours, or restore the original with `git checkout fallback/runs/<name>`.

**Does running an agent cost money?**
It uses your agent's normal usage or billing. Each recorded run here cost about $0.45 to $0.55.

**Do the commands work on Windows?**
They are written for macOS and Linux shells and have not been tested on Windows. Use WSL or Git Bash.

**Which Node version?**
20 or newer. Check with `node --version`.

## Reference

| Path | What it is |
|---|---|
| `starter/` | The service before the feature. 24 passing tests. Agents start here |
| `solution/` | Hand-written reference implementation of the allowlist. 32 tests |
| `prompts/` | The weak ticket, the strong spec, and the short spec for a repo with standing rules |
| `standing-rules/` | `AGENTS.md` and a one-line `CLAUDE.md` for the sandbox |
| `acceptance/` | Independent black-box acceptance suite, run over HTTP |
| `scripts/verify.mjs` | Scorecard for any folder: its own tests, acceptance checks, files touched, and the SPF probe |
| `scripts/reset-demo.mjs` | Rebuilds `~/spec-workshop-live/{weak,strong,rules}`. `--fallback recorded` or `--fallback solution` applies a finished result |
| `scripts/record-run.mjs` | Records a headless Claude Code run into `fallback/runs/` |
| `fallback/runs/` | Recorded runs: transcript, diff, scorecard, metadata |
| `pack/` | Spec template, rubric, practice tickets, `AGENTS.md` and `CLAUDE.md` templates |
| `GUIDE.md` | The step-by-step guide |

`reset-demo.mjs` also writes `spec-workshop.code-workspace`. Open it in VS Code for one-click tasks to reset, verify, and start an agent in each practice folder.

**What the scorecard checks:** AC1 to AC6 are the spec's six acceptance criteria. C1 checks the `allowlist_hit` log line and that no subject, sender address local part, or attachment name is logged. C2 checks for no dependencies. C3 checks that `src/auth.js` is unchanged. C4 runs the starter's original 24 tests against the changed code.

**Honesty rules:** recorded runs are real and unedited, except that the recorder's home folder is shown as `~` and raw event logs are left out. `solution/` is hand-written; it is not agent output. One recording is one sample. Agents vary run to run.

## License

MIT. See [LICENSE](LICENSE).
