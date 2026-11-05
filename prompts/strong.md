# Spec: tenant sender-domain allowlist

## 1. Problem and outcome

Tenant admins report that legitimate vendor mail is quarantined (usually invoices sent as `.zip`). When done: a tenant admin can allowlist an exact sender domain. Mail from that domain, to that tenant, returns `ALLOW` with reason `ALLOWLIST`, unless a BLOCK rule matches first. Every change is audited.

## 2. System context

Repo `triage-service`. Read `CONTRIBUTING.md` first. Rules live in `src/quarantine/rules.js` and run from `src/verdict.js`. Enums in `src/models.js`. Storage in `src/store.js`. Routes in `src/app.js`; copy the blocklist routes' pattern. Audit via `src/audit.js`. Tests in `tests/` with `node:test`. Benchmark in `bench/bench-verdict.js`.

## 3. Scope

In: allowlist storage per tenant, one rule, three admin endpoints (list, add, remove), audit rows, one structured log line per allowlist hit, tests.

Out: wildcards, subdomain matching, display-name matching, per-address entries, UI, bulk import, expiry, refactors, and any change to existing rules.

## 4. Requirements

- Endpoints, all behind `requireTenantAdmin()`:
  - `GET /tenants/:tenantId/allowlist` returns 200 `{ "domains": [...] }`.
  - `POST /tenants/:tenantId/allowlist` with body `{ "domain": "..." }` returns 201 `{ "domain": "<normalized>" }`, 400 for an invalid domain or wildcard, 409 if already listed.
  - `DELETE /tenants/:tenantId/allowlist/:domain` returns 204, or 404 if not listed.
- Evaluation order: BLOCK rules, then the allowlist, then QUARANTINE rules.
- Match on the envelope address domain only, exact match after `normalizeDomain()`.
- On every allowlist hit, log event `allowlist_hit` with `tenantId` and `senderDomain` only.
- `evaluate()` p95 stays within 5 ms of baseline with 1,000 entries (`npm run bench`).

## 5. Constraints

Tenant-scoped on every read and write. No new dependencies. No changes to `src/auth.js`. Never log subject, body, headers, attachment names, or full addresses.

## 6. Dependencies

The reporting job consumes `Reason`. Add `ALLOWLIST` and its label `Delivered: tenant allowlist` in `src/reporting/daily-summary.js`. Do not rename existing values or labels.

## 7. Acceptance criteria

1. Allowlisted domain, same tenant: `ALLOW`, reason `ALLOWLIST`.
2. Lookalikes are not allowed: `vendor-corp.com`, `evilvendorcorp.com`, `vendorcorp.com.evil.example`, a subdomain, or the domain appearing only in the display name.
3. Allowlisted in tenant A, message to tenant B: not allowed. Tenant B's admin cannot read or change tenant A's list (403).
4. Sender on the blocklist and the allowlist: `BLOCK`. SPF fail still `BLOCK`.
5. Each successful add or remove writes exactly one audit row with actor, tenantId, domain, action (`allowlist.add` or `allowlist.remove`), and timestamp. Failed requests write none.
6. Benchmark p95 within 5 ms of baseline. Output attached.

## 8. Tests and validation

Run `npm run bench` before any change and record the baseline. Add `tests/allowlist.test.js` with at least one test per criterion. Extend the benchmark to seed 1,000 allowlist entries for `acme`, then run `npm test` and `npm run bench`. All existing tests must still pass unchanged.

## 9. Escalation

Stop and ask before: changing `src/auth.js`, renaming or removing any `Reason` value or label, changing an existing endpoint's behavior, adding a dependency, or logging anything new beyond `allowlist_hit`. Stop if two readings of this spec lead to different behavior: state both, pick neither. Stop after two failed attempts at the same test and report what you tried.

## How to work

1. Inspect the repo and read the files in section 2.
2. Write a short plan: files you will touch and why. Nothing outside section 2 plus `tests/`.
3. Implement.
4. Run `npm test` and `npm run bench`.
5. Report: files changed, each criterion with pass or fail and its evidence (test name plus output), bench before and after, any escalation you hit, and any assumption you made.
