# AGENTS.md: <repo name>

<!--
Standing rules for every coding agent in this repo. Claude Code, Codex, Cursor,
and Factory droids all read AGENTS.md (Claude Code through the one-line
CLAUDE.md that imports it).

What goes here: anything you would otherwise repeat in every task spec.
What stays in the task spec: outcome, scope, interface, acceptance criteria.

Rule of thumb: when a run misses something and the diagnosis is "the spec did
not say X", ask whether X is true for every task in this repo. If yes, add it
here once instead of to the next spec.

A worked example lives in ../standing-rules/AGENTS.md.
-->

## 1. Context

One paragraph: what this service does and who calls it. Then a map.

| Concern | Where |
|---|---|
| Entry point | `` |
| Business rules | `` |
| Data access | `` |
| Public contracts (APIs, events, enums) | `` |
| Tests and helpers | `` |
| Benchmarks | `` |

## 2. Commands

```sh
# test:
# lint / type-check:
# benchmark:
```

## 3. Constraints (always)

- Dependencies: <allowed list, or "none without approval">
- Tenant / customer isolation: <rule>
- Data handling and logging: <what may and may not be logged or stored>
- Security-owned code the agent must not touch: <paths>
- Published contracts: <enums, schemas, APIs that only grow, never change>
- Existing tests: never edit them to make a change pass.

## 4. Stop and ask (escalation)

Stop, explain, and wait for a human before you:

- change auth, permissions, or token handling;
- change a schema beyond one additive migration;
- change a public API, event schema, or shared contract;
- log or store customer data somewhere new;
- choose between two readings of the task (state both, pick neither);
- try a third time after two failed attempts at the same test.

## 5. How to work

1. Read the task spec and the files it names. Run the tests for a baseline.
2. Write a plan: files to touch and why. Touch nothing outside the plan.
3. Implement the smallest change that meets the spec. No refactors or extras.
4. Add tests: one per acceptance criterion, plus a must-not test for every security-relevant behavior.
5. Run tests, lint, and any benchmark the spec names.

## 6. Report (definition of done)

1. Files changed, one line each with the reason.
2. Criteria table: each acceptance criterion, PASS or FAIL, and the proving test.
3. Evidence: test and benchmark output, verbatim.
4. Escalations hit, or "none".
5. Assumptions you made that the spec did not cover.
