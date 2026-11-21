# AGENTS.md

## Repository shape (npm workspaces, ESM)

- Monorepo: `apps/api` (`@mbms/api`), `apps/web` (`@mbms/web`), and `packages/shared` (`@mbms/shared`).
- Unified Node 24 runtime: root `server.js` serves static assets from root `public/` and imports the Fetch API handler from `apps/api/src/edge.ts`.
- Database: `postgres.js` through `apps/api/src/db.ts`; idempotent startup schema migrations run through `apps/api/src/migrate.ts` before the HTTP server starts.
- Frontend: React + Vite + Tailwind in `apps/web/`.

## Environment rules

Treat `apps/api/src/config.ts` as executable source of truth.

- `JWT_SECRET` is strictly required and must be at least 64 characters.
- `MFA_ENCRYPTION_KEY` is strictly required and must be exactly 64 hexadecimal characters.
- `DATABASE_URL` may be supplied explicitly.
- If `DATABASE_URL` is unset, use Wasmer-managed `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USERNAME`, and `DB_PASSWORD` and assemble a PostgreSQL URL with TLS (`sslmode=require`).
- `TZ` is Africa/Nairobi, including local and test processes.
- `JWT_ACCESS_EXPIRY_SECONDS` defaults to 900, `JWT_STEP_UP_EXPIRY_SECONDS` to 300, and `JWT_REFRESH_EXPIRY_DAYS` to 7.
- Use `JWT_SECRET` (not legacy JWT access/refresh secret names).

## Build and verification

```powershell
npm install
npm run build
npx tsc --project apps/api/tsconfig.json --noEmit
npm test
```

- `npm run build` builds shared types, the API, and the web workspace.
- The frontend build command `npm run build --workspace=@mbms/web` writes to root `public/` via Vite.
- Frontend production variables must use `VITE_API_BASE_URL=/api` and `VITE_DEMO_MODE=false`.
- API-focused tests: `npm test --workspace=apps/api`.
- Shared tests: `npm test --workspace=packages/shared`.
- Web tests: `npm test --workspace=apps/web`.
- Playwright smoke/e2e tests: `npm run test:e2e --workspace=apps/web`.

## Unified deployment

- `app.yaml` defines the `newton/mbms` Wasmer app and managed PostgreSQL capability.
- Root `public/` is generated and gitignored; it is served by `server.js`.
- API routes are handled by `apps/api/src/edge.ts`; there is no Express application or separate Express route tree.
- PostgreSQL migrations are idempotent and run before the server starts; do not require a database during the build.
- Auth uses `jose` with Web Standard APIs and `crypto.randomUUID()` for native UUID generation.

## MBMS safety and business invariants

- Enquiry is not project; one booking creates one project.
- Approval, assignment, and publication are separate audited actions.
- Approved and published versions are immutable.
- Server-side authorization is mandatory on every protected route.
- Clients see only explicitly published items belonging to their own projects.
- Audit history is append-only.
- Never invent missing project, financial, or identity data.
- Time zone is Africa/Nairobi.
- Currency is KES.
- Phone numbers use the `+254` format.
- Preserve exact-version acceptance, conflict-aware approvals, supplier beneficiary verification, safety gates, and the other rules in `docs/specs/00_Master_System_Architecture_and_Governance_v3.txt`.
