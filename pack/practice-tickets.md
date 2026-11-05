# Practice tickets for the sandbox

Pick one ticket. The "already known" part answers section 1 of the template and points you at the code, so you can spend your time on the sections that matter: scope, requirements, acceptance criteria, and escalation. Copy the template into your practice folder (see "Write and run your own spec" in the main README), then fill it in.

The service is described in `starter/README.md` (API and rules) and `starter/CONTRIBUTING.md` (where things live and the house rules). Read those two first; they take about three minutes.

## Ticket 1: vendor allowlist (the live example)

> "Customers keep complaining that mail from their vendors gets quarantined. Add a way to allowlist senders."

- **Who is affected:** tenant admins whose vendors send `.zip` invoices.
- **What is wrong:** legitimate vendor mail lands in quarantine, and admins have no way to say "trust this sender".
- **True when done:** an admin can allowlist a sender domain for their tenant, and mail from it is delivered without opening a phishing bypass.
- **Read:** `src/verdict.js`, `src/quarantine/rules.js`, the blocklist routes in `src/app.js`.
- **Decisions your spec must make:** exact or lookalike domain match, per tenant or global, can it override a BLOCK, what gets audited and logged.
- **Check your work:** `node scripts/verify.mjs ~/spec-workshop-live/weak` gives the full scorecard. Then compare your spec with [`prompts/strong.md`](../prompts/strong.md).

## Ticket 2: audit log paging

> "The audit page is slow for our biggest tenants. Let admins page through it."

- **Who is affected:** tenant admins with a long audit history.
- **What is wrong:** `GET /tenants/:tenantId/audit` returns every row at once.
- **True when done:** an admin can fetch audit rows a page at a time, newest first, and walk through all of them without gaps or repeats.
- **Read:** the audit route in `src/app.js`, `listAudit` in `src/store.js`, `tests/api.test.js`.
- **Decisions your spec must make:** page size default and maximum, cursor or offset, what happens with a bad cursor, whether existing callers break.
- **Check your work:** section 1 (existing tests) and section 3 (files touched) of `verify.mjs`, then [`rubric.md`](rubric.md).

## Ticket 3: per-tenant risky attachment types

> "Globex wants `.iso` files quarantined. Acme doesn't."

- **Who is affected:** tenant admins who want stricter attachment rules than the default.
- **What is wrong:** risky attachment types are one fixed list for every tenant.
- **True when done:** an admin can add extra risky extensions for their own tenant, and only that tenant's verdicts change.
- **Read:** `RISKY_ATTACHMENT_EXTENSIONS` in `src/models.js`, `src/quarantine/rules.js`, the blocklist routes in `src/app.js` as a pattern.
- **Decisions your spec must make:** can a tenant remove a default type or only add, how extensions are normalized (`ISO`, `.iso`, `iso`), what gets audited, whether the reason code changes.
- **Check your work:** section 1 and section 3 of `verify.mjs`, then [`rubric.md`](rubric.md).

## Your own work

The template asks "who is affected, what is wrong, what is true when done" because the agent cannot answer those. If you find you cannot answer them either, that is the gap the spec exists to close. Ask the person who filed the ticket before you hand it to an agent.
