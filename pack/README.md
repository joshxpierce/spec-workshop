# Write a spec for a coding agent

## Purpose

Use this workshop to define one software change and verify an agent's implementation.

At the end, you will have a reviewed spec and evidence for each acceptance criterion.

Start with the procedure below. Use the [developer manual](developer-manual.md) for detailed instructions, commands, examples, and troubleshooting.

## Before you start

You need a text editor and this repository for the writing exercise.

To run the code, you also need Git, Node.js 20 or newer, and npm. The service requires no package installation.

Use **Ticket 1: vendor allowlist** for your first exercise. Keep the worked spec closed until you finish your draft.

## Understand the task

The fictional service checks incoming mail. Some legitimate vendor invoices enter quarantine because they contain ZIP attachments.

The requested feature lets an administrator trust a sender domain for one customer organization. The repository calls a customer organization a **tenant**. It calls the list of trusted domains an **allowlist**.

The request leaves decisions open:

| Decision | Question your spec must answer |
|---|---|
| Permission | Who can add or remove a trusted domain? |
| Tenant boundary | Does an entry affect one tenant or all tenants? |
| Matching | Does an entry match only the exact domain, or also subdomains? |
| Precedence | What happens when a sender is both trusted and blocked? |
| Authentication | What happens when sender authentication fails, is weak, or is missing? |
| Evidence | Which tests and records establish that the feature works? |

A spec records the required answers. Mark unanswered questions as `UNRESOLVED` until the responsible reviewer decides them.

## Write and check your first spec

1. Read [practice ticket 1](practice-tickets.md).
2. Read [the service description](../starter/README.md) and [the file map](../starter/CONTRIBUTING.md).
3. Copy [the spec template](spec-template.md) into a new draft file.
4. Write the **Scope — Out** list first.
5. Complete the template's nine sections and run note.
6. Give each acceptance criterion a test name and an observable result.
7. Compare your draft with [the worked spec](../prompts/strong.md).
8. Record the effect of each decision missing from your draft.
9. Revise the draft to resolve the differences that affect required behavior.
10. Score the written spec with rows one through three of [the rubric](rubric.md).

**Completion check:** The spec states the result, permitted changes, constraints, required evidence, and conditions that require the agent to stop.

If a requirement permits two different behaviors, resolve the decision before implementation.

## Write a testable criterion

Use a starting condition, an input, and an expected result.

```text
Test: Other tenant remains isolated
Given: Only Acme has allowlisted vendorcorp.com.
When: Globex receives a ZIP invoice from that domain with SPF pass.
Then: The service returns QUARANTINE with reason ATTACHMENT_TYPE.
```

SPF is the sender-authentication signal supplied to this test service.

The ZIP attachment matters. A clean message can already be allowed without an allowlist entry.

**Completion check:** A reviewer can determine pass or fail without guessing your intent.

## Run and verify the implementation

Follow [the setup procedure](developer-manual.md#set-up-the-practice-folder), then [the handoff procedure](developer-manual.md#hand-off-the-task).

Use a separate practice folder. The kit contains a reference solution.

After implementation, follow [the verification procedure](developer-manual.md#verify-the-implementation). Inspect the actual test output, changed files, and unresolved issues.

The independent scorecard covers the allowlist task. It does not validate other features. A `NOT OBSERVED` result counts as unmet.

A score of 10/10 does not establish that every necessary requirement exists. The recorded full-spec run passes all ten checks but allows trusted-domain mail with weak or missing authentication. Complete [the missing-requirement exercise](developer-manual.md#test-the-specs-completeness) before accepting that policy.

**Completion check:** Every required result has evidence. No unresolved failure prevents the intended use.

## Shorten the next spec

Compare [the full spec](../prompts/strong.md), [the short spec](../prompts/strong-with-rules.md), and [the standing rules](../standing-rules/AGENTS.md).

Put instructions that apply to every repository task in `AGENTS.md`. Keep the outcome, scope, and criteria for one change in that change's spec.

Use [the AGENTS.md template](AGENTS.template.md) for standing rules. For Claude Code, [the CLAUDE.md template](CLAUDE.template.md) directs the agent to those rules.

Next, write a spec for **Ticket 2: audit log paging**. Use [the manual's exercises](developer-manual.md#complete-the-exercises) to check your coverage.

**Exercise complete:** You can write a new spec, identify its unresolved decisions, and define the evidence required to accept its implementation.
