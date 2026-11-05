# Participant pack

| File | Use it for |
|---|---|
| [spec-template.md](spec-template.md) | The nine elements plus a run note. Copy it, fill it in, paste it as your agent's first message |
| [rubric.md](rubric.md) | Seven-row rubric, the three questions, and the spec-defect vs runtime-limit diagnosis |
| [AGENTS.template.md](AGENTS.template.md) | Standing rules for your own repo. Write them once so every spec can be shorter |
| [CLAUDE.template.md](CLAUDE.template.md) | One-line bridge so Claude Code reads the same `AGENTS.md` as Codex, Cursor, and Factory |
| [../prompts/strong.md](../prompts/strong.md) | The full worked spec from the live example |
| [../prompts/strong-with-rules.md](../prompts/strong-with-rules.md) | The same task as a short spec, once standing rules carry the rest |
| [../standing-rules/AGENTS.md](../standing-rules/AGENTS.md) | The worked standing rules for the sandbox service |

## Spec or standing rule?

Put it in `AGENTS.md` if it is true for every task in the repo: conventions, security constraints, escalation rules, how to report. Put it in the spec if it is true for this task only: outcome, scope, interface, acceptance criteria.

After each run, take every "the spec did not say X" diagnosis line and ask: is X true for every task? If yes, it goes into `AGENTS.md`. That is how the agent gets tuned and each spec gets shorter.
