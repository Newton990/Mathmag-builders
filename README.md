# Mathmag Builders Management System (MBMS)

A construction-company ERP for Mathmag Builders Limited (Kenya), built with TypeScript throughout.

## Prerequisites

- [Node.js 20+](https://nodejs.org/) and npm 10+
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (for PostgreSQL + MinIO)
- Git

## First-time setup

```bash
# 1. Clone and enter the repo
git clone <repo-url>
cd mathmag-mbms

# 2. Copy environment config and fill in the values
cp .env.example .env
# Edit .env — minimum required: DATABASE_URL, JWT_ACCESS_SECRET, JWT_REFRESH_SECRET

# 3. Install all dependencies (monorepo)
npm install

# 4. Start the database and object storage
docker compose up -d

# Wait for the health checks to pass:
docker compose ps   # all services should show "healthy"

# 5. Run database migrations
npm run db:migrate

# 6. Seed the database (fake data only)
npm run db:seed
```

## Start development servers

```bash
# Start API (port 3001) and web (port 5173) concurrently
npm run dev
```

The Vite dev server proxies `/api` requests to the Express API, so there are no CORS issues in development.

- API health check: http://localhost:3001/api/health
- Web app: http://localhost:5173
- MinIO console: http://localhost:9001 (user/pass from `.env`)

## Run tests

```bash
# Unit and integration tests (Vitest) for API + shared packages
npm test

# End-to-end tests (Playwright) — web server must be running
npm run test:e2e --workspace=apps/web

# Or use the Playwright UI
npm run test:e2e:ui --workspace=apps/web
```

## Database tasks

```bash
# Open Prisma Studio (DB GUI)
npm run db:studio

# Create a new migration after schema changes
npm run db:migrate --workspace=apps/api

# Reset database (development only — destroys all data)
cd apps/api && npx prisma migrate reset --force
```

## Project structure

```
mathmag-mbms/
├── apps/
│   ├── api/              Express API (port 3001)
│   │   ├── src/
│   │   │   ├── config.ts       Config loader (fails fast on missing vars)
│   │   │   ├── app.ts          Express app factory
│   │   │   ├── index.ts        Server entry point
│   │   │   ├── logger.ts       Pino structured logger (no PII in logs)
│   │   │   ├── db/client.ts    Prisma singleton
│   │   │   ├── middleware/     errorHandler, requestLogger, validate
│   │   │   └── routes/         health + (more in later steps)
│   │   └── prisma/
│   │       ├── schema.prisma   Database schema
│   │       └── seed.ts         Fake seed data (no real data)
│   └── web/              React + Vite app (port 5173)
│       ├── src/
│       │   ├── App.tsx         Root router — /staff, /field, /portal
│       │   ├── layouts/        StaffLayout, FieldLayout, PortalLayout
│       │   └── pages/          Page components per route tree
│       └── e2e/                Playwright end-to-end tests
├── packages/
│   └── shared/           Shared Zod schemas, enums, TypeScript types
├── docs/
│   └── specs/            Place Module 1, 2, 3 spec PDFs here
├── docker-compose.yml    PostgreSQL 16 + MinIO
└── .env.example          All required environment variables documented
```

## Monorepo workspace commands

```bash
# Run a command in a specific workspace
npm run <script> --workspace=apps/api
npm run <script> --workspace=apps/web
npm run <script> --workspace=packages/shared
```

## Environment variables

All variables are documented in `.env.example`. Required variables:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_ACCESS_SECRET` | Secret for access tokens (min 64 chars) |
| `JWT_REFRESH_SECRET` | Secret for refresh tokens (min 64 chars) |

Everything else has a sensible default for local development.

## Technology stack

| Layer | Technology |
|-------|-----------|
| Language | TypeScript 5 (strict mode) |
| API | Node.js 20+, Express 4, Zod |
| Database | PostgreSQL 16, Prisma ORM |
| Auth | argon2 hashing, httpOnly JWT cookies, RBAC |
| Background jobs | pg-boss (Postgres-backed, no Redis) |
| Object storage | MinIO (local dev), S3-compatible |
| Documents | `docx` library (DOCX), Playwright (PDF) |
| Frontend | React 18, Vite 5, Tailwind CSS 3 |
| PWA | vite-plugin-pwa (service worker + IndexedDB) |
| Tests | Vitest (unit/integration), Playwright (E2E) |
| Local dev | docker-compose |

## Build steps progress

- [x] Step 1: Scaffolding & local environment
- [ ] Step 2: Database schema (Module 1 entities)
- [ ] Step 3: Authentication, roles, audit logging
- [ ] Step 4: Communications inbox & confirmed booking
- [ ] Step 5: Visiting officer dashboard & visit lifecycle
- [ ] Step 6: Mobile field form (A–G) + offline PWA
- [ ] Step 7: Submission, validation & locking
- [ ] Step 8: Automatic report generation (DOCX + PDF)
- [ ] Step 9: Lead architect review & junior assignment
- [ ] Step 10: Client portal & controlled publication
- [ ] Step 11: Notifications & dashboards
- [ ] Step 12: End-to-end tests & demo script
- [ ] Step 13: Security hardening & deployment

## Important business rules

1. An enquiry is **not** a project. A project exists only after a confirmed booking.
2. One persistent project record for the whole lifecycle (never create a second one).
3. One booking → exactly one project (enforced transactionally with a unique constraint).
4. Approval, assignment and client publication are **separate** actions, each audited.
5. Approved and published versions are **immutable** — changes create new versions.
6. Authorization is enforced **server-side** on every API route and file download.
7. Clients see only **explicitly published** items for their own project.
8. Every critical action writes an **append-only audit event**.
9. Never invent missing data. Solar path = computed, wind = observed, sketch = preliminary.
10. Time zone: Africa/Nairobi · Currency: KES · Phones: +254 format.
