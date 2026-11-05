# AGENTS.md: triage-service

Standing rules for any coding agent working in this repo (Claude Code, Codex, Cursor, Factory). They apply to every task. A task spec adds the outcome, scope, and acceptance criteria for one change; it does not need to repeat anything here.

## 1. Context

Message-triage API. `POST /verdict` returns `ALLOW`, `QUARANTINE`, or `BLOCK` with a reason code. Read `CONTRIBUTING.md` for the file map before planning.

| Concern | Where |
|---|---|
| Rules, in evaluation order | `src/quarantine/rules.js`, run from `src/verdict.js` |
| Enums and constants | `src/models.js` |
| Tenant-scoped storage | `src/store.js` |
| Routes | `src/app.js` (copy the blocklist routes' pattern for new tenant settings) |
| Audit rows | `src/audit.js` |
| Reporting contract | `src/reporting/daily-summary.js` |
| Tests | `tests/`, `node:test`, `startTestServer()` in `tests/helpers.js` |
| Benchmark | `bench/bench-verdict.js` |

## 2. Commands

```sh
npm test         # must pass before you report done
npm run bench    # run before and after any change to verdict evaluation
```

## 3. Constraints (always)

- Node built-ins only. Never add a dependency.
- Every store read and write takes a `tenantId`. No global tenant settings.
- Compare domains only after `normalizeDomain()`. Match the envelope address domain, never the display name, never by substring.
- BLOCK rules always run first. Nothing may override a BLOCK verdict.
- Tenant-setting endpoints use `requireTenantAdmin()` and write exactly one audit row per successful change via `recordAudit()`. Failed requests write none.
- Logs: structured JSON via `log()`, carrying tenantId and sender domain only. Never subject, body, headers, attachment names, or full addresses.
- Do not modify `src/auth.js`.
- `Reason` values and `REASON_LABELS` are a published contract. Add; never rename or remove. Every new `Reason` gets a label.
- Do not change existing tests to make them pass. Existing behavior must stay the same.

## 4. Stop and ask (escalation)

Stop, explain, and wait for a human before you:

- change `src/auth.js` or any permission check;
- rename or remove a `Reason`, a label, or an existing endpoint's behavior;
- add a dependency;
- log or store any message content or customer identifier in a new place;
- choose between two readings of the task that lead to different behavior (state both, pick neither);
- try a third time after two failed attempts at the same test (report what you tried).

## 5. How to work

1. Read the task spec and the files it names. Run `npm test` and `npm run bench` for a baseline.
2. Write a plan: the files you will touch and why. Touch nothing outside the plan.
3. Implement the smallest change that meets the spec. No refactors, no extras the spec does not ask for.
4. Add tests: at least one per acceptance criterion, and at least one must-not test for every security-relevant behavior (lookalikes, other tenants, unauthorized callers).
5. Run `npm test` and `npm run bench`.

## 6. Report (definition of done)

End every task with this report. A claim without evidence counts as not done.

1. **Files changed**, one line each with the reason.
2. **Criteria table**: each acceptance criterion, PASS or FAIL, and the test name that proves it.
3. **Evidence**: the `npm test` summary lines and bench output, before and after, verbatim.
4. **Escalations**: any stop condition you hit, or "none".
5. **Assumptions**: anything the spec did not say that you had to decide.
