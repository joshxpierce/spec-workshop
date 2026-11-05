# Contributing to triage-service

## Layout

| Path | What lives there |
|---|---|
| `src/server.js` | Process entry point. Starts the HTTP server |
| `src/app.js` | Routing and HTTP handlers |
| `src/verdict.js` | Message validation and the rule pipeline |
| `src/quarantine/rules.js` | BLOCK and QUARANTINE rules, in evaluation order |
| `src/models.js` | `Verdict` and `Reason` enums, constants |
| `src/sender.js` | Sender parsing and domain normalization |
| `src/store.js` | In-memory, tenant-scoped storage |
| `src/audit.js` | Audit rows for tenant-setting changes |
| `src/auth.js` | Bearer-token auth and the tenant-admin gate |
| `src/reporting/` | Daily summary consumed by the reporting dashboard |
| `tests/` | `node:test` tests. `tests/helpers.js` starts a test server |
| `bench/bench-verdict.js` | Latency benchmark for `evaluate()` |

## Conventions

- ES modules, Node built-ins only. Adding a dependency needs team approval.
- Every store read and write takes a `tenantId`. There is no global setting.
- Compare domains only after `normalizeDomain()` (lowercase, punycode).
- Tenant-setting endpoints go through `requireTenantAdmin()` and write one audit row per successful change through `recordAudit()`.
- Logs are structured JSON via `log()`. Log the tenant and the sender domain only. Never log subject, body, headers, attachment names, or full addresses.
- `Reason` values and `REASON_LABELS` are a published contract. Add new values; never rename or remove existing ones.
- `src/auth.js` is owned by the platform security team. Do not change it in feature work.

## Tests

`npm test` must pass before any change is merged. New behavior needs tests in `tests/`. Use `startTestServer()` for API tests.
