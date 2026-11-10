# Developer manual: write and verify agent specs

## Purpose

Use this manual to define a software change, give the work to a coding agent, and verify the result.

The method applies to feature work in an existing repository. The examples use the fictional `triage-service` in this workshop.

Your output is a spec and an evidence record. The spec states the required behavior. The evidence record shows what the implementation does.

## Select a procedure

| Your task | Procedure | Required result |
|---|---|---|
| Prepare the exercise | [Set up the practice folder](#set-up-the-practice-folder) | An isolated copy of the starter and a recorded baseline. |
| Understand the change | [Inspect the system](#inspect-the-system) | A file map and a list of affected behavior. |
| Resolve the request | [Record the decisions](#record-the-decisions) | Explicit decisions and identified unanswered questions. |
| Write the instructions | [Write the nine sections](#write-the-nine-sections) | A complete task spec. |
| Check the instructions | [Review the spec](#review-the-spec) | Testable criteria and no unresolved behavior choices. |
| Start implementation | [Hand off the task](#hand-off-the-task) | An implementation plan consistent with the spec. |
| Accept the change | [Verify the implementation](#verify-the-implementation) | Evidence for each criterion and constraint. |
| Correct a failure | [Diagnose a failed result](#diagnose-a-failed-result) | A correction directed at the cause. |
| Reuse what you learned | [Maintain standing rules](#maintain-standing-rules) | Shorter task specs supported by explicit repository rules. |
| Practice independently | [Complete the exercises](#complete-the-exercises) | A spec for a different feature. |

For a first attempt, complete the procedures in order. For a writing-only exercise, start at **Inspect the system**.

## Terms and responsibilities

| Term | Meaning |
|---|---|
| Spec | Written instructions for one software change. |
| Requirement | A rule the completed change must satisfy. |
| Constraint | A limit on the implementation or its behavior. |
| Acceptance criterion | An observable condition used to accept or reject the result. |
| Baseline | The behavior and measurements recorded before the change. |
| Regression | A change that breaks previously required behavior. |
| Standing rule | An instruction that applies to every task in the repository. |
| Tenant | One customer organization. |
| Allowlist | A tenant's list of trusted sender domains. |

The **spec author** defines the outcome and records decisions. The author can request facts and options from an agent.

The **implementer** changes the code and supplies evidence. The implementer can be a developer or a coding agent.

The **reviewer** checks the spec, implementation, and evidence. The same developer can perform more than one role.

Identify the person responsible for unresolved product or security decisions. Do not treat an agent's assumption as that person's decision.

## Set up the practice folder

### Check the prerequisites

Use a macOS or Linux terminal with Bash or Zsh. You need Git, Node.js 20 or newer, and npm. The service requires no package installation.

Run these commands:

```sh
git --version
node --version
npm --version
```

**Expected result:** Each command prints a version. The Node.js major version is at least 20.

### Create the practice folders

1. Open a terminal in the root of the cloned `spec-workshop` repository.
2. Record the kit location in that terminal.

   ```sh
   export SPEC_WORKSHOP_KIT="$PWD"
   ```

3. Set the parent directory for the practice folders.

   ```sh
   export SPEC_WORKSHOP_LIVE="$HOME/spec-workshop-live"
   ```

   `SPEC_WORKSHOP_KIT` identifies the downloaded kit. `SPEC_WORKSHOP_LIVE` identifies the separate practice directory. Keep both variables in the same terminal session.

**Data loss notice:** The next command deletes and rebuilds `weak`, `strong`, and `rules` under `SPEC_WORKSHOP_LIVE`. Copy any work you need to another directory before you run it.

4. Create the practice folders from the kit root.

   ```sh
   node scripts/reset-demo.mjs
   ```

**Expected result:** The command reports three folders:

| Folder | Contents |
|---|---|
| `weak` | The starter service. Use this folder for your own spec. |
| `strong` | The starter service and the full worked spec. |
| `rules` | The starter service, standing rules, and the short worked spec. |

Each folder has a local Git repository with a baseline commit. The command also writes `spec-workshop.code-workspace` in the kit.

For an independent exercise, open only the chosen practice folder in a fresh agent session. Do not supply the reference solution to that session.

The generated editor workspace includes the kit and all three practice folders. Use it for comparison after the exercise.

### Record the baseline

1. Change to the `weak` practice folder.

   ```sh
   cd "$SPEC_WORKSHOP_LIVE/weak"
   ```

2. Run the existing tests.

   ```sh
   npm test
   ```

   **Expected result:** All 24 starter tests pass.

3. Run the existing benchmark.

   ```sh
   npm run bench
   ```

4. Save the test summary and benchmark output outside the three resettable practice folders.
5. Record the Node.js version and the command used with each result.

If the baseline tests fail, identify the cause before you compare an implementation with that baseline.

### Create the spec file

From the same terminal, run:

```sh
mkdir -p "$SPEC_WORKSHOP_LIVE/weak/specs"
cp -n "$SPEC_WORKSHOP_KIT/pack/spec-template.md" "$SPEC_WORKSHOP_LIVE/weak/specs/my-spec.md"
```

The `-n` option prevents replacement of an existing `my-spec.md`.

**Completion check:** The practice folder contains the starter service and `specs/my-spec.md`. You have the baseline results.

## Inspect the system

1. Read [the service description](../starter/README.md).
2. Read [the file map and conventions](../starter/CONTRIBUTING.md).
3. Trace one request through the relevant files.
4. List the existing interfaces and behavior affected by the requested change.

For the allowlist task, inspect these areas:

| Area | Source | Question to answer |
|---|---|---|
| Request handling | `src/app.js` | Which route pattern and error responses already exist? |
| Permissions | `src/auth.js` | How does the service restrict administrators to their tenant? |
| Domain parsing | `src/sender.js` | How does the service identify and normalize a sender domain? |
| Storage | `src/store.js` | Does every operation identify the tenant? |
| Rule order | `src/verdict.js`, `src/quarantine/rules.js` | Which rule takes precedence? |
| Reason codes | `src/models.js` | Which values form part of the response contract? |
| Reporting | `src/reporting/daily-summary.js` | Which labels must exist for a new reason code? |
| Evidence | `tests/`, `bench/bench-verdict.js` | Which behavior and measurements already have checks? |

These paths are relative to a service folder, such as `starter` or `weak`.

Reading a file does not authorize changing it. The allowlist task specifically prohibits changes to `src/auth.js`.

You can use this prompt to obtain a source map:

```text
Inspect the repository for the task in specs/my-spec.md.
Do not change files.
Identify the relevant request path, storage, permissions, tests, and consumers.
Support each factual claim with a file and code reference.
Separate current behavior from proposed behavior.
List questions that the code cannot answer.
```

**Completion check:** You can explain the current behavior and identify the code that establishes it.

## Record the decisions

The request for the workshop is to let administrators trust vendor senders whose invoices enter quarantine.

The request does not define matching, permissions, precedence, error handling, or authentication policy. Record those decisions before implementation.

Use a decision record:

| Question | Decision | Basis or responsible reviewer | Status |
|---|---|---|---|
| Does an entry affect other tenants? | No. Store and evaluate entries per tenant. | Existing repository convention and worked spec. | Resolved for this exercise. |
| Do subdomains match? | No. Require the exact normalized domain. | Worked spec. | Resolved for this exercise. |
| Can trust override a block? | No. Run block rules first. | Worked spec. | Resolved for this exercise. |
| What happens with weak or missing authentication? | Record the required result for each state. | Security or feature reviewer. | Unresolved until decided. |

These example decisions describe the workshop. They are not universal defaults for other systems.

1. List each choice that can change user-visible behavior, permissions, data, or compatibility.
2. Record the decision where a governing requirement already supplies it.
3. Mark other choices as `UNRESOLVED`.
4. Name the reviewer responsible for each unresolved choice.

If two interpretations lead to different behavior, resolve the difference before implementation. Continue independent source inspection while that decision remains open.

**Completion check:** The spec distinguishes facts, decisions, and unanswered questions.

## Write the nine sections

Use [the existing template](spec-template.md). Write **Scope — Out** first. Then complete the sections in their displayed order.

### Problem and outcome

Identify the affected user. Describe the current failure. State what changes for that user.

Example:

> Tenant administrators cannot exempt legitimate vendor ZIP invoices from quarantine. After this change, an administrator can trust an exact sender domain for one tenant. Existing block rules still take precedence.

Do not use “improve,” “support,” or “handle” as the complete outcome. State the observable behavior.

### System context

List the files the implementer must read. Include the repository conventions and existing tests.

Explain why each file matters. Keep this list specific to the task. A file dump does not identify which behavior must remain unchanged.

### Scope

List the included changes and excluded changes separately.

For the workshop, the included work is tenant-scoped storage, three administrator endpoints, a rule, audit records, a log event, tests, and a benchmark update.

The excluded work includes a user interface, wildcard matching, subdomain matching, bulk import, expiry, and unrelated refactoring.

Choose implementation details only when a constraint or compatibility requirement makes the choice necessary. Otherwise, let the implementation plan propose the design.

### Requirements

State the behavior for success, invalid input, duplicate input, missing data, and unauthorized callers.

The worked spec defines this interface:

| Method and path | Input | Required result |
|---|---|---|
| `GET /tenants/:tenantId/allowlist` | Tenant-admin authorization. | `200` with `{ "domains": [...] }`. |
| `POST /tenants/:tenantId/allowlist` | Tenant-admin authorization and `{ "domain": "..." }`. | `201` with the normalized domain; `400` for invalid input; `409` for an existing entry. |
| `DELETE /tenants/:tenantId/allowlist/:domain` | Tenant-admin authorization and a domain. | `204` for removal; `404` for an absent entry. |

`:tenantId` and `:domain` are path placeholders. Replace them with actual values in requests.

The feature also has rules outside the interface table: exact normalized matching, block precedence, audit records, and the `allowlist_hit` event. Include those rules explicitly.

For a limit, state the quantity, unit, workload, and comparison. The workshop's performance requirement uses p95 latency with 1,000 allowlist entries. The p95 value is the latency at the 95th percentile of the measured samples.

### Constraints

State what the implementation must preserve or avoid.

The workshop prohibits new dependencies, edits to `src/auth.js`, cross-tenant access, and logs containing message content or full addresses.

Use the same strength of language throughout the spec. Use **must** for a requirement. Use **must not** for a prohibition. Label optional work explicitly.

### Dependencies

Identify consumers affected by the new behavior or data.

The workshop adds `ALLOWLIST` to the reason codes. Reporting also needs the label `Delivered: tenant allowlist`. Existing values and labels must remain unchanged.

In another repository, inspect callers, stored records, background jobs, reports, and public interfaces. State any required compatibility or migration decision.

### Acceptance criteria

Give each criterion an identifier and a test name. Use a starting condition, an action, and an expected result.

```text
AC3 — Tenant isolation
Test: Other tenant remains isolated
Given: Only Acme has allowlisted vendorcorp.com.
When: Globex receives a ZIP invoice from that domain with SPF pass.
Then: The service returns QUARANTINE with reason ATTACHMENT_TYPE.
```

Specify the ZIP attachment in this example. A clean message can already be allowed without an allowlist entry.

Write four to six top-level criteria for this exercise. A criterion can require several test cases. Include at least one prohibited outcome.

### Tests and validation

Name the existing tests, new tests, performance measurements, and review evidence required.

For the workshop, retain the existing tests, add feature tests, and run the benchmark before and after the change. Use the independent verifier in addition to the implementation's own tests.

A test name alone is not evidence. Retain the command, result, and relevant output.

### Escalation

State the condition that stops implementation and the information needed to continue.

For example:

> If the proposed change requires an edit to `src/auth.js`, stop that change. Report the required edit and why the current interface is insufficient.

The worked spec also stops after two unsuccessful attempts at the same test. That is a workshop rule. In another project, specify the retry limit appropriate to the task.

Finish the **Run note** with the implementer, plan reviewer, and result reviewer.

**Completion check:** The spec defines the result, permitted work, required evidence, and stop conditions without relying on unstated assumptions.

## Review the spec

### Check clarity and coverage

1. Check each requirement for competing interpretations.
2. Check each interface for invalid input, permission failures, and repeat requests.
3. Check each affected consumer for compatibility changes.
4. Link every acceptance criterion to a named test.
5. Resolve any conflict between the task spec and standing rules.

Use a coverage table:

| Criterion or constraint | Test or inspection | Evidence required |
|---|---|---|
| Trusted vendor mail is allowed. | Allowlist the exact domain; submit the ZIP invoice. | Status, verdict, and reason assertions. |
| Lookalikes remain untrusted. | Test suffixes, prefixes, subdomains, and display-name tricks. | Assertions that the ZIP invoice is not allowed. |
| Tenants remain isolated. | Submit mail to another tenant; attempt cross-tenant administration. | Verdict and authorization assertions. |
| Block rules take precedence. | Test an entry on both lists and a message with SPF `fail`. | `BLOCK` and the applicable reason. |
| Audit records reflect successful changes. | Add, duplicate, reject, remove, and inspect the audit list. | Two successful-change records with required fields. |
| Logs exclude message content. | Use distinct test strings in the address, subject, and attachment name. | Required event present; test strings absent from output. |
| Existing behavior remains valid. | Run the original tests against the changed code. | Passing results for the unchanged tests. |
| Performance meets the limit. | Measure the specified workload before and after the change. | Workload, units, p95 values, and difference. |

Inspect the tests as well as their results. A test can pass while checking the wrong input, tenant, response, or error.

### Read a test as an executable criterion

The following example uses the workshop's existing test helper. It checks isolation after the allowlist feature exists.

Place this example in `tests/tenant-isolation.example.test.js` in a completed service folder. It fails on the unmodified starter because the starter has no allowlist endpoint.

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { startTestServer } from './helpers.js';

test('allowlisting in Acme does not release a Globex ZIP invoice', async () => {
  const app = await startTestServer();
  try {
    const added = await app.request('POST', '/tenants/acme/allowlist', {
      token: 'tok-acme-admin',
      body: { domain: 'vendorcorp.com' },
    });
    assert.equal(added.status, 201);

    const result = await app.request('POST', '/verdict', {
      body: {
        tenantId: 'globex',
        sender: 'billing@vendorcorp.com',
        spf: 'pass',
        attachments: [{ filename: 'invoice.zip' }],
      },
    });
    assert.equal(result.status, 200);
    assert.deepEqual(result.body, {
      verdict: 'QUARANTINE',
      reason: 'ATTACHMENT_TYPE',
    });
  } finally {
    await app.close();
  }
});
```

The token and addresses are fictional workshop data.

Run the example from that service folder:

```sh
node --test tests/tenant-isolation.example.test.js
```

**Expected result on the reference solution:** One test passes. The test confirms its setup before checking the result.

### Test the spec's completeness

The worked spec places allowlist matching after block rules and before attachment quarantine. An explicit SPF `fail` produces a block.

SPF is the sender-authentication signal supplied to the sandbox. The sandbox does not perform a real mail-system authentication check.

The [recorded full-spec run](../fallback/runs/strong/verify.txt) passes all ten scored checks. It also allows trusted-domain ZIP invoices with SPF `softfail`, `none`, or a missing value.

Those outcomes follow from the rule order. The scorecard reports them separately but does not score them.

1. Record the required result for each relevant authentication state.
2. Identify the reviewer responsible for that policy.
3. Add criteria for the agreed policy.
4. Add tests that distinguish the permitted and prohibited results.

Do not infer a complete security policy from a passing score. Likewise, do not change the policy silently because another behavior appears safer.

### Score the written spec

Use rows one through three of [the rubric](rubric.md). These rows assess context, clarity, and testability.

A score of 1 means absent. A score of 2 means present but ambiguous. A score of 3 means clear. The rubric reserves 4 for execution rows supported by evidence.

**Completion check:** The implementer can determine the required behavior without choosing between unresolved alternatives.

## Hand off the task

### Review the plan

Start a fresh agent session in the practice folder. Give the agent this instruction:

```text
Read specs/my-spec.md and the repository instructions.
Do not change files yet.
List the files you need to change and explain each change.
Map the proposed tests to the acceptance criteria.
Identify unresolved decisions, conflicts, and missing access.
```

Check the plan against the spec:

- Every proposed change serves an included requirement.
- The plan preserves the named constraints and existing interfaces.
- Each criterion has a test or a stated inspection method.
- The plan identifies missing decisions instead of choosing them silently.

Resolve material differences before implementation. Use the project's existing authorization process; a plan review does not create a separate approval requirement by itself.

### Start implementation

When the task is ready and authorized, give the agent this instruction:

```text
Implement specs/my-spec.md according to the reviewed plan.
Preserve the stated constraints and existing tests.
Stop at the conditions stated in the spec.
Report each acceptance criterion with its result and evidence.
Report changed files, before-and-after measurements, and remaining issues.
Do not describe an unrun check as passed.
```

If new evidence changes the required behavior, update the spec before the agent continues the affected work. Keep the reason for that decision with the spec.

**Completion check:** The agent has one current spec, a consistent plan, and explicit conditions for completion or escalation.

## Verify the implementation

### Run the implementation's checks

1. In the practice folder, run the tests.

   ```sh
   cd "$SPEC_WORKSHOP_LIVE/weak"
   npm test
   ```

2. Run the benchmark.

   ```sh
   npm run bench
   ```

3. Retain the output beside the baseline evidence.

Compare like measurements. A function benchmark and an HTTP request benchmark measure different paths.

`npm run bench` measures the `evaluate()` function. The verifier's AC6 check measures HTTP request p95 before and after adding 1,000 entries. AC6 requires an increase of less than 5 ms.

Run latency comparisons sequentially under comparable conditions. Do not run competing benchmark processes at the same time.

### Run the independent verifier

From the kit root, run:

```sh
cd "$SPEC_WORKSHOP_KIT"
node scripts/verify.mjs "$SPEC_WORKSHOP_LIVE/weak"
```

The verifier checks the allowlist task. It does not infer a different feature's requirements from `my-spec.md`.

Read all four sections:

| Section | What it establishes | What it does not establish |
|---|---|---|
| Target tests | Whether the target's own test command succeeds. | Whether those tests cover every requirement. |
| Acceptance scorecard | Six behavior groups and four constraint groups. | Complete product or security correctness. |
| Scope | Files added, changed, or deleted relative to the starter. | Whether every reported change is justified. |
| Unspecified decision | Results for weak or missing SPF authentication. | An agreed policy or a scored requirement. |

The ten scored groups cover the allowlist result, lookalikes, tenant isolation, block precedence, audit records, latency, logs, dependencies, the auth file, and the original tests.

The scope report flags files outside the configured list. These flags do not change the numeric score. Review them separately.

`NOT OBSERVED` means the suite could not exercise the expected allowlist interface. It counts as unmet. It is not a pass or proof that all other behavior is correct.

For an unchanged starter, the allowlist groups are expected to be unobserved. For a completed allowlist implementation, investigate any unobserved group.

### Inspect the change

In the practice folder, run:

```sh
git status --short
git diff --stat
git diff
```

`git diff` shows changes to tracked files. Inspect new files listed by `git status` separately; ordinary `git diff` does not display their contents.

1. Match each changed or added file to the reviewed plan.
2. Inspect changes to permissions, data access, logs, and existing interfaces.
3. Confirm that tests still assert the intended behavior.
4. Record any unexplained change as an open review item.

The independent verifier copies the starter's original 24 tests into a temporary target copy and runs them. This prevents changed target tests from replacing those regression checks.

### Record the result

Use this format:

```text
Spec: <path and revision>
Implementation: <commit or identified working-tree state>
Environment: <Node.js version and relevant conditions>

Criterion | Result | Evidence
AC1       | PASS, FAIL, or NOT RUN | <test name and output location>

Constraints checked: <constraint and evidence>
Files changed: <file and reason>
Performance: <baseline, changed result, workload, units>
Escalations: <condition and resolution, or none>
Remaining issues: <issue and next action, or none>
Acceptance: <accepted or not accepted, with reason>
```

Use rows four through seven of [the rubric](rubric.md) to assess execution.

**Completion check:** Each required result has evidence. No unresolved failure prevents the intended use. A confident agent summary alone is insufficient.

## Diagnose a failed result

1. Record the exact failed criterion or constraint.
2. Compare the required behavior with the observed behavior.
3. Identify the cause from the evidence.
4. Correct the part responsible for the failure.
5. Repeat the affected checks and required regression checks.

| Observation | Likely cause to investigate | Corrective action |
|---|---|---|
| The agent chose one of two unspecified behaviors. | Missing or ambiguous requirement. | Resolve the decision; revise the spec and affected tests. |
| The requirement is clear, but the code violates it. | Implementation defect. | Correct the implementation without weakening the requirement. |
| A test passes while asserting the wrong result. | Test defect. | Correct the test, then evaluate the implementation again. |
| The environment cannot start a server or access a required service. | Environment or access limitation. | Restore the required capability or report the check as not run. |
| Tests ran, but the summary states the wrong count or result. | Reporting defect. | Correct the report using the actual output. |
| All current tests pass, but an omitted case exposes an unwanted result. | Incomplete requirement or test coverage. | Resolve the case; add the requirement and a discriminating test. |

More than one cause can apply. Do not assign every failure to the spec. Do not edit the expected result only to make a failing test pass.

If a criterion changes, record the reason and the responsible decision. Keep the revised spec and tests consistent.

**Completion check:** The correction addresses the observed cause, and the resulting evidence supports the revised acceptance decision.

## Maintain standing rules

Read [the full spec](../prompts/strong.md), [the short spec](../prompts/strong-with-rules.md), and [the supporting standing rules](../standing-rules/AGENTS.md).

The short spec omits repeated context and constraints because the standing rules supply them. The total instructions still include both files.

1. Identify a rule that applies to every task in the repository.
2. Check that the rule agrees with current repository behavior and team decisions.
3. Add the rule to `AGENTS.md`.
4. Remove unnecessary repetition from new task specs.
5. Check that a shorter spec still includes task-specific exceptions and decisions.

Use [the AGENTS.md template](AGENTS.template.md) as a starting point. For Claude Code, [the CLAUDE.md template](CLAUDE.template.md) directs the agent to those rules.

| Put in standing rules | Keep in the task spec |
|---|---|
| Required test commands. | The feature's acceptance criteria. |
| Repository-wide tenant isolation. | The new tenant setting and its behavior. |
| Data that must never appear in logs. | The new event name and permitted fields. |
| Protected interfaces and escalation conditions. | The particular interface being added. |

These are examples for this repository. A log-field policy can also be a standing rule if it applies to every event.

Do not turn a one-task workaround into a repository-wide rule without checking its wider effect.

**Completion check:** A new task can use the standing rules without depending on a previous chat or an obsolete decision.

## Complete the exercises

### Exercise one: vendor allowlist

Use [practice ticket 1](practice-tickets.md).

1. Write a spec before reading the worked example.
2. Compare the decisions in the two specs.
3. Resolve the authentication cases described in this manual.
4. Run the task in a separate practice folder.
5. Record the results and one revision justified by the evidence.

**Success condition:** You can explain why each criterion exists and show what tests establish it.

### Exercise two: audit-log paging

Use practice ticket 2. The current route returns all audit entries for a tenant.

Decide these items before implementation:

- The default and maximum page size.
- The order of entries and the rule for equal timestamps.
- Whether the interface uses an offset or a cursor that identifies the next position.
- The response to an invalid, expired, or foreign-tenant cursor, if cursors are used.
- The behavior when new entries arrive between page requests.
- The behavior for existing callers that supply no paging parameters.

A claim of “no gaps or repeats” needs a defined set of rows. Decide whether the caller walks a fixed snapshot or a changing log.

**Success condition:** Tests cover multiple pages, empty results, tenant boundaries, invalid inputs, and the chosen concurrent-write behavior.

The bundled allowlist scorecard does not establish paging correctness. Use the existing tests, file review, your paging tests, and the rubric.

### Exercise three: risky attachment types

Use practice ticket 3.

Decide whether a tenant can only add risky extensions or can also remove defaults. Define normalization for `ISO`, `.iso`, and `iso`. Define the audit behavior and reason code.

**Success condition:** Tests establish normalization, duplicate handling, tenant isolation, preservation of required defaults, and reporting behavior.

### Exercise four: your own repository

Choose one bounded change with an identifiable user and an observable result.

1. Inspect the current behavior and relevant consumers.
2. Write the spec using the nine sections.
3. Ask a reviewer to identify competing interpretations.
4. Revise the spec before implementation.
5. Verify the resulting change with evidence appropriate to that repository.

**Success condition:** The reviewer can accept or reject the change from the spec, code, and evidence without reconstructing your intent from chat history.

## Troubleshoot the workshop

| Symptom | Action |
|---|---|
| `node` or `npm` is unavailable. | Install or enable the required runtime before the executable exercise. Continue the writing exercise independently. |
| Node.js is older than version 20. | Select a supported runtime before running the scripts. |
| Tests report a local socket or `listen EPERM` error. | Run in an environment that permits the local test server. Record the current run as incomplete. |
| The verifier reports `PASS` with zero target tests. | Run `node --test --test-reporter=spec tests/*.test.js` directly in the target. Inspect that summary; the verifier's count parser can miss npm output on some versions. |
| A completed feature has `NOT OBSERVED` groups. | Compare the implemented paths and methods with the specified allowlist interface. |
| The score is 10/10, but a scope flag remains. | Review the flagged file. Scope flags are not included in the score. |
| A paging task fails allowlist checks. | Evaluate paging with its own tests. The bundled scorecard is specific to the allowlist task. |
| A reset affects more folders than expected. | At the reviewed revision, a lone variant argument is ignored. Treat `reset-demo.mjs weak`, `strong`, or `rules` as a possible reset of all three folders. |
| The shell variables are empty in a new terminal. | Set `SPEC_WORKSHOP_KIT` and `SPEC_WORKSHOP_LIVE` to the existing locations. Do not rerun reset to recover the variables. |
| The agent can read the reference answer. | Use a fresh session that starts in the practice folder, without the kit or prior solution discussion in its supplied context. |

The setup procedure uses an explicit reset of all three folders. It does not depend on single-folder reset behavior.

## Check readiness

Before implementation, confirm:

- The affected user and required outcome are explicit.
- Included and excluded work are listed.
- Existing behavior comes from inspected sources.
- Each material decision is resolved or is an explicit stop condition.
- Interfaces include success and failure behavior.
- Constraints and affected consumers are identified.
- Acceptance criteria have named, observable tests.
- The reviewer and required evidence are identified.

Before acceptance, confirm:

- Required tests ran against the actual implementation.
- New tests check the intended behavior and relevant failure cases.
- Existing tests still establish the required previous behavior.
- Changed and new files have been reviewed.
- Performance comparisons use matching methods and workloads.
- Unrun checks and remaining issues are explicit.
- No known issue prevents the intended use.

## Sources and document status

Repository behavior in this manual was checked against `joshxpierce/spec-workshop` at commit `cb2f5cc98fc109766aeddd22f738560f7e77f32d` on November 5, 2026.

The [reference solution](../solution/README.md) is hand-written. The [recorded agent runs](../fallback/runs/README.md) are a small set of samples. They do not establish a general reliability rate.

This manual applies short sentences, direct instructions, and consistent terms associated with [ASD-STE100 Simplified Technical English](https://asd-ste100.org/STE_faq.html). It has not been assessed for full compliance with that standard's rules and dictionary.

The manual extends the workshop's instructional material. Examples that ask the reader to decide a new policy do not describe an implemented change.
