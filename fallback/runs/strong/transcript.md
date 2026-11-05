# Recorded run: strong

Real headless run, not edited. claude 2.1.318 (Claude Code), model claude-opus-5-5, recorded 2026-11-05T11:12:19.917Z, 76s wall clock, 7 turns.

First message: `Read specs/allowlist.md and carry it out.`

Scorecard: [verify.txt](verify.txt). Changes: [diff.patch](diff.patch).

---

> **Bash** `cat specs/allowlist.md && git ls-files && cat CLAUDE.md 2>/dev/null`

> **Bash** `for f in CONTRIBUTING.md package.json src/*.js src/quarantine/rules.js src/reporting/daily-summary.js bench/bench-verdic`

> **Bash** `cat data/seed.js tests/reporting.test.js && node --version && npm test 2>&1 | tail -12 && for i in 1 2 3; do npm run ben`

Baseline recorded: p95 0.0006–0.0007 ms, 24/24 tests pass. Plan: touch `models.js`, `daily-summary.js`, `store.js`, `rules.js`, `verdict.js`, `app.js`, the bench, and new `tests/allowlist.test.js`.

> **Bash** `python3 - <<'EOF'`

> **Write** `tests/allowlist.test.js`

> **Bash** `npm test 2>&1 | grep -E '^(✔|✖|ℹ (tests|pass|fail))|not ok|Error' ; for i in 1 2 3; do npm run bench --silent; done; git`

The allowlist is built. All 34 tests pass: the 24 existing ones, unchanged, plus 10 new ones. p95 is unchanged at about 0.0006 ms. I did not hit any escalation trigger. Nothing is committed.

## Files changed
- `src/models.js`: added `Reason.ALLOWLIST`.
- `src/reporting/daily-summary.js`: added the label `Delivered: tenant allowlist`. Existing labels are untouched.
- `src/store.js`: a per-tenant allowlist set with list, check, add and remove functions. It is empty by default.
- `src/quarantine/rules.js`: a new `allowRules` array containing the one `allowlist` rule. Existing rules are untouched.
- `src/verdict.js`: rules now run in the order BLOCK, then allow, then QUARANTINE.
- `src/app.js`: added `allowlistRoutes`, copied from the blocklist routes, and the `allowlist_hit` log line.
- `bench/bench-verdict.js`: now seeds 1,000 allowlist entries for `acme`.
- `tests/allowlist.test.js`: new file.

## Acceptance criteria

| # | Result | Evidence (test names in `tests/allowlist.test.js`) |
|---|---|---|
| 1 | Pass | `AC1: allowlisted domain…returns ALLOW / ALLOWLIST`; `AC1: allowlist is added via API…logs allowlist_hit with tenant and domain only`; `AC1: POST rejects invalid domains and wildcards with 400, duplicates with 409`; `AC1: ALLOWLIST reason has its reporting label` |
| 2 | Pass | `AC2: lookalike domains, subdomains, and display-name-only matches are not allowlisted` covers all five cases in the spec. |
| 3 | Pass | `AC3: allowlist in tenant A does not allow mail to tenant B`; `AC3: tenant B's admin cannot read or change tenant A's allowlist (403)`. GET, POST and DELETE all return 403. |
| 4 | Pass | `AC4: blocklist and SPF fail still BLOCK an allowlisted sender` |
| 5 | Pass | `AC5: each successful add/remove writes exactly one audit row; failures write none`. It covers 7 kinds of failed request. |
| 6 | Pass | Bench output is below. `AC6: 1,000 allowlist entries still match exactly` |

`npm test`: `tests 34, pass 34, fail 0`.

## Benchmark (`npm run bench`, 3 runs each)
- **Before:** p50 0.0004 ms; p95 0.0006, 0.0007, 0.0006 ms.
- **After, with 1,000 entries:** p50 0.0004 ms; p95 0.0007, 0.0007, 0.0006 ms.
- **Change:** about 0.0001 ms. The limit is 5 ms.

## Assumptions
1. **Where `allowlist_hit` is logged:** in the `POST /verdict` handler, not inside `evaluate()`. `evaluate()` has no other production caller, and this keeps the benchmark from writing thousands of log lines.
2. **What the benchmark seeds:** 999 synthetic domains plus `vendorcorp.com`. The bench's first message is from `vendorcorp.com`, so it now returns ALLOW instead of QUARANTINE, and both the matching and non-matching paths get timed.
3. **DELETE with an invalid domain:** returns 400, like the blocklist routes. The spec lists only 204 and 404 for DELETE, but it also says to copy the blocklist pattern.
4. **"Envelope address":** messages have no separate envelope field, so I used the domain of the address in the `sender` field, inside the angle brackets if present. The display name is ignored.

---

## Final report from the agent

The allowlist is built. All 34 tests pass: the 24 existing ones, unchanged, plus 10 new ones. p95 is unchanged at about 0.0006 ms. I did not hit any escalation trigger. Nothing is committed.

## Files changed
- `src/models.js`: added `Reason.ALLOWLIST`.
- `src/reporting/daily-summary.js`: added the label `Delivered: tenant allowlist`. Existing labels are untouched.
- `src/store.js`: a per-tenant allowlist set with list, check, add and remove functions. It is empty by default.
- `src/quarantine/rules.js`: a new `allowRules` array containing the one `allowlist` rule. Existing rules are untouched.
- `src/verdict.js`: rules now run in the order BLOCK, then allow, then QUARANTINE.
- `src/app.js`: added `allowlistRoutes`, copied from the blocklist routes, and the `allowlist_hit` log line.
- `bench/bench-verdict.js`: now seeds 1,000 allowlist entries for `acme`.
- `tests/allowlist.test.js`: new file.

## Acceptance criteria

| # | Result | Evidence (test names in `tests/allowlist.test.js`) |
|---|---|---|
| 1 | Pass | `AC1: allowlisted domain…returns ALLOW / ALLOWLIST`; `AC1: allowlist is added via API…logs allowlist_hit with tenant and domain only`; `AC1: POST rejects invalid domains and wildcards with 400, duplicates with 409`; `AC1: ALLOWLIST reason has its reporting label` |
| 2 | Pass | `AC2: lookalike domains, subdomains, and display-name-only matches are not allowlisted` covers all five cases in the spec. |
| 3 | Pass | `AC3: allowlist in tenant A does not allow mail to tenant B`; `AC3: tenant B's admin cannot read or change tenant A's allowlist (403)`. GET, POST and DELETE all return 403. |
| 4 | Pass | `AC4: blocklist and SPF fail still BLOCK an allowlisted sender` |
| 5 | Pass | `AC5: each successful add/remove writes exactly one audit row; failures write none`. It covers 7 kinds of failed request. |
| 6 | Pass | Bench output is below. `AC6: 1,000 allowlist entries still match exactly` |

`npm test`: `tests 34, pass 34, fail 0`.

## Benchmark (`npm run bench`, 3 runs each)
- **Before:** p50 0.0004 ms; p95 0.0006, 0.0007, 0.0006 ms.
- **After, with 1,000 entries:** p50 0.0004 ms; p95 0.0007, 0.0007, 0.0006 ms.
- **Change:** about 0.0001 ms. The limit is 5 ms.

## Assumptions
1. **Where `allowlist_hit` is logged:** in the `POST /verdict` handler, not inside `evaluate()`. `evaluate()` has no other production caller, and this keeps the benchmark from writing thousands of log lines.
2. **What the benchmark seeds:** 999 synthetic domains plus `vendorcorp.com`. The bench's first message is from `vendorcorp.com`, so it now returns ALLOW instead of QUARANTINE, and both the matching and non-matching paths get timed.
3. **DELETE with an invalid domain:** returns 400, like the blocklist routes. The spec lists only 204 and 404 for DELETE, but it also says to copy the blocklist pattern.
4. **"Envelope address":** messages have no separate envelope field, so I used the domain of the address in the `sender` field, inside the angle brackets if present. The display name is ignored.
