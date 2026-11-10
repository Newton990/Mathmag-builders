# Action 03 — Local Scripts Creation

## Objective
Create automation scripts in the local repository folder to help with setup, building, testing, and exercising the MBMS API.

## Scope
**Local folder only.** Nothing was pushed to GitHub.

## Scripts Created

### `scripts/setup-dev.ps1`
Full local development setup:
1. Checks prerequisites (node, npm, docker)
2. Runs `npm install --include=dev` for all workspaces
3. Starts PostgreSQL + MinIO via `docker compose up -d`
4. Waits for services to become healthy
5. Runs `prisma generate` for the API workspace
6. Runs `npm run db:migrate` for the API workspace
7. Runs `npm run db:seed` for the API workspace

**Usage:** `.\scripts\setup-dev.ps1`

### `scripts/build-all.ps1`
Builds all workspaces in dependency order:
1. Shared package (`tsc`)
2. API (`prisma generate && tsc`)
3. Web (`vite build`)

**Usage:** `.\scripts\build-all.ps1`

### `scripts/test-all.ps1`
Runs unit tests:
1. API unit tests (`npm test --workspace=apps/api`)
2. Shared package tests (`npm test --workspace=packages/shared`)
3. Notes that web e2e tests require dev servers running

**Usage:** `.\scripts\test-all.ps1`

### `scripts/exercise-actions.mjs`
Exercises every API action against a running server on `http://localhost:3001`:
- Health check
- Auth login
- Conversations (list, create, get, add message)
- Bookings (list, confirm, get, reschedule, check-in, check-out, record fee)
- Projects, surveys, reports, publications, portal, media, directory, planning, acceptance, approvals, contracts, construction, governance, suppliers, invoices, worker-reports, safety (all list endpoints)

**Usage:** `node scripts/exercise-actions.mjs` (requires server running)

### `scripts/run-all.ps1`
One-stop script that chains:
1. Setup (`setup-dev.ps1`)
2. Build (`build-all.ps1`)
3. Tests (`test-all.ps1`)
4. Starts dev servers in background (`npm run dev`)
5. Exercises all actions (`exercise-actions.mjs`)

**Usage:** `.\scripts\run-all.ps1`

## File Locations
All scripts are in: `C:\Users\user\Desktop\Mathmag builders\mathmag-mbms\scripts/`

| File | Type | Size |
|------|------|------|
| `setup-dev.ps1` | PowerShell | ~2.5 KB |
| `build-all.ps1` | PowerShell | ~1 KB |
| `test-all.ps1` | PowerShell | ~1 KB |
| `run-all.ps1` | PowerShell | ~2 KB |
| `exercise-actions.mjs` | Node.js | ~5 KB |

## Outcome
5 scripts created locally. Not committed to GitHub yet.
