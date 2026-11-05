# triage-service

A small message-triage API. It takes inbound mail metadata and returns a verdict: `ALLOW`, `QUARANTINE`, or `BLOCK`, with a reason code.

Fictional sandbox built by New Altitude for a training workshop. No real customer data.

## Run

```sh
npm start          # listens on PORT (default 3000)
npm test           # unit and API tests (node:test)
npm run bench      # evaluate() latency, prints p50 and p95
```

Node 20 or newer. No dependencies.

## API

| Method and path | Auth | Purpose |
|---|---|---|
| `GET /health` | none | Liveness check |
| `POST /verdict` | none (internal) | Body: `{ tenantId, sender, subject?, spf?, attachments? }`. Returns `{ verdict, reason }` |
| `GET /tenants/:tenantId/blocklist` | tenant admin | List blocked sender domains |
| `POST /tenants/:tenantId/blocklist` | tenant admin | Body: `{ domain }`. 201, 400, or 409 |
| `DELETE /tenants/:tenantId/blocklist/:domain` | tenant admin | 204 or 404 |
| `GET /tenants/:tenantId/audit` | tenant admin | Audit rows for this tenant |

Auth is a static bearer token (see `data/seed.js`). A token belongs to one tenant and one role.

## Rules

Rules run in order. The first match decides.

1. BLOCK rules: tenant blocklist (`BLOCKLIST`), SPF failure (`SPF_FAIL`).
2. QUARANTINE rules: risky attachment type (`ATTACHMENT_TYPE`).
3. Otherwise `ALLOW` with reason `CLEAN`.

See `CONTRIBUTING.md` before changing anything.
