# Mathmag Builders Management System (MBMS)

Construction-company ERP for Mathmag Builders Limited (Kenya), implemented as a unified Node 24 Wasmer application.

## Architecture

- Unified runtime: root `server.js`
- API handler: `apps/api/src/edge.ts`
- Database: PostgreSQL through `apps/api/src/db.ts` and `postgres.js`
- Startup migrations: idempotent SQL in `apps/api/src/migrate.ts`
- Frontend: React, Vite, and Tailwind in `apps/web/`
- Frontend output: root `public/`
- Deployment app: `newton/mbms`
- Authentication: `jose` HS256 and native `crypto.randomUUID()`

There is no Express server, Prisma client/schema, SQLite database, or separate production frontend deployment.

## Local setup

```powershell
npm install
cp .env.example .env
npm run build
npx tsc --project apps/api/tsconfig.json --noEmit
npm test
node server.js
```

Set `JWT_SECRET` to at least 64 characters and `MFA_ENCRYPTION_KEY` to exactly 64 hexadecimal characters. Set `DATABASE_URL` explicitly or use Wasmer-managed `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USERNAME`, and `DB_PASSWORD`.

## Development

```powershell
npm run dev:api
npm run dev:web
```

## Build and test

```powershell
npm run build
npx tsc --project apps/api/tsconfig.json --noEmit
npm test
npm run test:e2e --workspace=apps/web
```

The web build uses `VITE_API_BASE_URL=/api` and `VITE_DEMO_MODE=false`.

## Wasmer deployment

Build locally, then deploy prebuilt output:

```powershell
npm install
npm run build
wasmer deploy
```

`wasmer.toml` uses a prebuild no-op because Anybuild packages prebuilt artifacts. `.wasmerignore` keeps root `node_modules/` installation data private and explicitly allows `public/`, `apps/api/dist/`, and `packages/shared/dist/`.

Configure `JWT_SECRET` and `MFA_ENCRYPTION_KEY` as Wasmer secrets. When `DATABASE_URL` is unset, `app.yaml` supplies managed PostgreSQL `DB_*` variables and the API assembles a TLS `postgresql://` URL.

The governing specification is `docs/specs/00_Master_System_Architecture_and_Governance_v3.txt`.

## Core business rules

- An enquiry is not a project; a booking creates one project.
- Approval, assignment, and publication are separate audited actions.
- Approved and published versions are immutable.
- Server-side authorization is mandatory on protected routes.
- Clients see only published items belonging to their own projects.
- Audit history is append-only.
- Time zone is Africa/Nairobi.
- Currency is KES.
- Phone numbers use `+254`.
