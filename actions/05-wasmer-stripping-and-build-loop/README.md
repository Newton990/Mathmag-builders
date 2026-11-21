# Action 05 — Wasmer Stripping & Build Loop

## Objective
Strip all non-Wasmer-compatible code from the API, run a build loop until both frontend and backend compile without errors, and prepare for Wasmer Edge deployment.

## Date
2026-11-11

## Files Removed (Not Wasmer-Compatible)

| File/Directory | Reason |
|----------------|--------|
| `docker-compose.yml` | No containers on Wasmer |
| `apps/api/prisma/` | Replaced by postgres.js and idempotent SQL migrations |
| `apps/api/src/db/` | Prisma client |
| `apps/api/src/app.ts` | Replaced by the unified Fetch API handler |
| `apps/api/src/index.ts` | Express server entry |
| `apps/api/src/middleware/` | Express middleware |
| `apps/api/src/routes/` | Replaced by dispatch in `apps/api/src/edge.ts` |
| `apps/api/src/services/` | DB-dependent services |
| `apps/api/src/auth/` | Replaced by jose-based `apps/api/src/auth.ts` |
| `apps/api/src/__tests__/` | Prisma-dependent tests |

## Files Modified

| File | Change |
|------|--------|
| `apps/api/package.json` | Removed legacy deps; uses `jose`, `postgres`, `@mbms/shared`, and `zod` |
| `apps/api/src/config.ts` | DATABASE_URL is explicit or assembled from managed DB_* values; pg-boss and MinIO config removed |
| `apps/api/src/logger.ts` | Replaced pino with simple console logger |
| `apps/api/src/edge.ts` | Created Wasmer Edge fetch-based handler (replaces Express) |

## Files Created

| File | Purpose |
|------|---------|
| `apps/api/wasmer.toml` | Wasmer Edge backend config |
| `apps/api/src/edge.ts` | Wasmer Edge request handler |
| `apps/web/wasmer.toml` | Wasmer Edge frontend static config |
| `scripts/deploy-wasmer.ps1` | Build loop + deploy instructions |
| `scripts/setup-local-no-docker.ps1` | Local setup without Docker |
| `WASMER_DEPLOY.md` | Detailed deployment guide |
| `MASTER_PLAN.md` | Master resume reference |

## Build Verification Results

| Command | Exit Code | Output |
|---------|-----------|--------|
| `npx tsc --project apps/api/tsconfig.json --noEmit` | 0 | Clean |
| `npm run build --workspace=@mbms/web` | 0 | `✓ built in 4.99s` |

## Current API Endpoints (Working)

| Route | Method | Response |
|-------|--------|----------|
| `/api/health` | GET | `{status: "ok"}` |
| `/api/version` | GET | `{version: "1.0.0"}` |
| `OPTIONS /*` | OPTIONS | CORS preflight |
| All other `/api/*` | Any | `501 Not Implemented` (stub) |

## Next Steps (from MASTER_PLAN.md)

1. Install Wasmer CLI: `curl https://get.wasmer.io -sSfL \| sh`
2. Login: `wasmer login`
3. Deploy backend: `wasmer edge deploy apps/api --name mathmag-api`
4. Set secrets: JWT_SECRET, MFA_ENCRYPTION_KEY, CORS_ORIGIN, DATABASE_URL
5. Deploy frontend: `wasmer edge deploy apps/web/dist --name mathmag-web`
6. Verify: `https://mathmag-web.wasmer.app` and `https://mathmag-api.wasmer.app/api/health`

## Spec Reference

All work grounded in `docs/specs/` (7-module V3.0 pack from `Mathmag_Builders_Full_7_Modules_Download_Fixed-5.zip`).
