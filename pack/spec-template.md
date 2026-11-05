# Spec: <one-line task name>

Fill in order. Write Scope Out before anything else. Delete the guidance lines when done.
If your repo has an `AGENTS.md` with standing rules, sections 2, 5, 8, and 9 only need what is specific to this task.

## 1. Problem and outcome

Who is affected. What is wrong. What is true when this is done.

## 2. System context

Repo. Modules to read first. Conventions file. Related tests.

## 3. Scope

In: the shortest list that solves it.

Out: everything adjacent you are not doing. This list is usually longer than In.

## 4. Requirements

Functional behavior, including any interface the change exposes (paths, status codes, field names).
Nonfunctional: performance, logging, observability, limits.

## 5. Constraints

Security. Data handling. Dependencies allowed. Interfaces frozen. Compliance.

## 6. Dependencies

Interfaces touched. Consumers of those interfaces. Other teams to notify.

## 7. Acceptance criteria

4 to 6. Each observable and binary. Each names its test. At least one must-not.

1.
2.
3.
4.

## 8. Tests and validation

Existing tests to run. New tests to write. Evidence to attach (test output, bench output, logs).

## 9. Escalation

Stop and ask when: schema, auth, interface, data, ambiguity (two readings), two failed attempts.

## Run note

Which agent or Factory. Who reviews the plan. Who accepts the result.
