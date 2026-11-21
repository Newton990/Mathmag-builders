# MBMS — Master Plan & Deployment Record

This document is the operational source of truth alongside D-06, D-07, and D-08 in `DECISION_LOG.md`.

## 1. Unified Wasmer architecture

| Component | Implementation |
|---|---|
| App name | `newton/mbms` |
| Runtime | Node 24 |
| HTTP entrypoint | Root `server.js` |
| API handler | `apps/api/src/edge.ts` using Fetch and Web APIs |
| Static frontend | Root `public/` |
| Frontend build | Vite workspace `@mbms/web`, output `../../public` |
| Database | Wasmer-managed PostgreSQL via `app.yaml` |
| Database client | `postgres.js` in `apps/api/src/db.ts` |
| Startup migrations | Idempotent SQL in `apps/api/src/migrate.ts` |
| Auth | `jose` HS256 tokens with `crypto.randomUUID()` |

There is no Express server, Prisma schema/client, SQLite database, or separate frontend deployment in the unified runtime.

## 2. Database configuration

`apps/api/src/config.ts` accepts an explicit `DATABASE_URL`. If it is unset, it assembles a TLS PostgreSQL URL from Wasmer's injected `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USERNAME`, and `DB_PASSWORD` values.

`JWT_SECRET` and `MFA_ENCRYPTION_KEY` remain strictly required. Database assembly must not weaken startup migration behavior or move migrations into the frontend build.

## 3. Build and verification

```powershell
npm install
npm run build
npx tsc --project apps/api/tsconfig.json --noEmit
npm test
```

`npm run build` builds `@mbms/shared`, `@mbms/api`, and `@mbms/web`. The web build writes generated assets to root `public/`, which `server.js` serves.

For local API development, use `npm run dev:api`; for the web, use `npm run dev:web`. The Vite development proxy sends `/api` to the API server.

## 4. Deployment

Deploy the unified package:

```bash
wasmer deploy
```

Configure at least:

- `JWT_SECRET`
- `MFA_ENCRYPTION_KEY`
- `CORS_ORIGIN`
- `NODE_ENV=production`

No explicit `DATABASE_URL` is required when `app.yaml` provisions Wasmer-managed PostgreSQL and injects `DB_*`.

Startup must initialize PostgreSQL and run idempotent migrations before accepting HTTP requests. The frontend does not contain API secrets.

## 5. Implemented API surfaces

The unified handler provides health/version, auth/MFA/refresh, bookings, projects, surveys, reports, publications, portal, media, planning, acceptance, approvals, contracts, construction, governance, safety, suppliers, invoices, worker reports, and directory routes. Protected routes preserve role-based authorization and Zod request validation.

## 6. Business invariants

- Enquiry does not become a project; one confirmed/related booking produces one project.
- Approval, assignment, and publication are separate audited actions.
- Approved/published versions are immutable.
- Server-side authorization applies on every protected operation.
- Clients see only explicitly published items for their own projects.
- Audit events are append-only.
- Data must be explicit; never infer or invent missing records.
- Time zone: Africa/Nairobi.
- Currency: KES.
- Phone format: `+254`.
- Supplier bank/beneficiary changes require verification.
- Construction cannot bypass safety, technical, permit, or acceptance gates.

## 7. Spec and maintenance

The governing architecture is [`docs/specs/00_Master_System_Architecture_and_Governance_v3.txt`](docs/specs/00_Master_System_Architecture_and_Governance_v3.txt). Read `DECISION_LOG.md`, this plan, and `AGENTS.md` before resuming work.
