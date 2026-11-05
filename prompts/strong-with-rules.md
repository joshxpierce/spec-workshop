# Spec: tenant sender-domain allowlist (short form)

Standing rules in `AGENTS.md` cover context, constraints, escalation, workflow, and the report. This spec covers only what is specific to this task.

## Outcome

Tenant admins report legitimate vendor mail is quarantined (usually `.zip` invoices). When done, a tenant admin can allowlist an exact sender domain. Mail from that domain to that tenant returns `ALLOW` with a new reason `ALLOWLIST` (label `Delivered: tenant allowlist`), unless a BLOCK rule matches first.

## Scope

In: per-tenant allowlist storage, one rule between the BLOCK and QUARANTINE rules, three admin endpoints, audit rows, an `allowlist_hit` log event, tests, benchmark seeded with 1,000 entries.

Out: wildcards, subdomains, display-name matching, per-address entries, UI, bulk import, expiry.

## Interface

- `GET /tenants/:tenantId/allowlist` returns 200 `{ "domains": [...] }`.
- `POST /tenants/:tenantId/allowlist` with `{ "domain" }` returns 201 `{ "domain": "<normalized>" }`, 400 for invalid or wildcard, 409 if listed.
- `DELETE /tenants/:tenantId/allowlist/:domain` returns 204, or 404 if not listed.
- Audit actions: `allowlist.add`, `allowlist.remove`.

## Acceptance criteria

1. Allowlisted domain, same tenant: `ALLOW` / `ALLOWLIST`.
2. Not allowed: `vendor-corp.com`, `evilvendorcorp.com`, `vendorcorp.com.evil.example`, a subdomain, or the domain only in the display name.
3. Tenant A's entry does not apply to tenant B. Tenant B's admin gets 403 on tenant A's list.
4. Blocklisted or SPF-fail senders still `BLOCK`, even if allowlisted.
5. Each successful add or remove writes exactly one audit row.
6. Benchmark p95 within 5 ms of baseline with 1,000 entries.
