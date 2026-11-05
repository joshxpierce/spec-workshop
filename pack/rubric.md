# Rubric: score the spec and the run separately

Scale: **1** absent. **2** present but a reader could take it two ways. **3** clear. **4** clear and verified by attached evidence (run rows only).

| # | Criterion | Judges | Question | Score |
|---|---|---|---|---|
| 1 | Context completeness | Spec | Could a new senior engineer start from this with no questions? | |
| 2 | Requirement clarity | Spec | Is every requirement one reading only? Functional and nonfunctional both present? | |
| 3 | Testability | Spec | Does every acceptance criterion name a test? Is there at least one must-not? | |
| 4 | Constraint fidelity | Run | Did the agent respect every constraint (tenant scope, data handling, no new dependencies)? | |
| 5 | Execution quality | Run | Plan matched the spec. No scope drift. Code matches repo conventions. | |
| 6 | Security and quality | Run | Nothing logged that should not be. No bypass. Failure modes handled as specified. | |
| 7 | Human intervention | Run | Did it escalate where the spec said? Did it fail to escalate where it should have? A silent guess scores 1 even if the guess was right. | |

Score from evidence (test output, logs, the diff), not from the agent's summary. If the agent says tests pass but attached nothing, row 6 cannot score above 2.

## Three questions after every run

1. **Did it stay in scope?** List every file touched. Anything outside the spec's context list is drift.
2. **Did it escalate correctly?** Did it stop where the spec said? Did it stop where it should have and the spec did not say?
3. **Spec defect or agent defect?** For each miss: would a better spec have prevented it? If yes, fix the spec, not the code.

## Diagnosis: one line per miss

Format: `Missed <criterion> because the spec did not say <X>` (spec defect) or `because the agent could not <Y>` (runtime limit).

| Spec defect: a better spec would have prevented it | Runtime limit: the spec was fine |
|---|---|
| Agent chose a match rule you did not specify | Agent could not run the test suite in its environment |
| Agent touched a file you did not list and did not forbid | Agent lacked access to a dependency, service, or secret |
| Agent declared done with no evidence because none was asked for | Agent lost track of the spec in a long run and drifted late |
| Agent did not stop at an ambiguity because no rule said to | Agent produced correct code and a wrong summary of it |
| Tests pass but test the wrong thing because the criteria were vague | Factory gate rejected a change the spec allowed |
| **Fix:** edit the spec, re-run, keep the fix in the template | **Fix:** environment, tooling, or task size. Log it for the Night Forge team |

When in doubt, it is usually the spec. Check the spec first.

## Output per team

Scored rubric. One diagnosis line per miss. One thing you would change in the spec.
