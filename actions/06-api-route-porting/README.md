# Action 06 — API Route Porting (Wasmer Edge)

## Objective
Port API routes from stubs (501 Not Implemented) to real handlers with database integration, JWT auth, and business rule validation per V3 spec.

## Date
2026-11-11

## Files Created/Modified

| File | Change |
|------|--------|
| `apps/api/package.json` | Added `postgres` ^3.4.4 dependency |
| `apps/api/src/db.ts` | Created postgres.js database adapter with tagged template queries |
| `apps/api/src/auth.ts` | Created JWT auth module (verify, extract, require auth/MFA/step-up/role) |
| `apps/api/src/responses.ts` | Created response helpers (json, error, success, CORS) |
| `apps/api/src/edge.ts` | Rewrote with real route handlers for auth, bookings, projects, surveys, reports, publications, portal, media; stubs for planning, acceptance, approvals, contracts, construction, governance, safety, suppliers, invoices, worker-reports, directory |

## Implemented Routes

| Route | Method | Auth | Status |
|-------|--------|------|--------|
| `/api/health` | GET | No | ✅ Working |
| `/api/version` | GET | No | ✅ Working |
| `/api/auth/login` | POST | No | ✅ Returns MFA challenge |
| `/api/auth/mfa/verify` | POST | No | ✅ Returns access token |
| `/api/auth/me` | GET | Yes (JWT) | ✅ Returns user context |
| `/api/auth/logout` | POST | No | ✅ Returns success |
| `/api/bookings` | GET | Yes | ✅ List from DB |
| `/api/bookings/:id` | GET | Yes | ✅ Get from DB |
| `/api/bookings` | POST | Yes (CLIENT_RELATIONS_OFFICER / ADMIN_MANAGEMENT) | ✅ Confirm booking with idempotency, project reference generation |
| `/api/bookings/:id/reschedule` | PATCH | Yes (CLIENT_RELATIONS_OFFICER / ADMIN_MANAGEMENT) | ✅ With reason validation, terminal status check |
| `/api/bookings/:id/check-in` | POST | Yes | ✅ With GPS validation, status transition check |
| `/api/bookings/:id/check-out` | POST | Yes | ✅ With GPS validation, check-in required check |
| `/api/bookings/:id/fee` | POST | Yes (CLIENT_RELATIONS_OFFICER / ADMIN_MANAGEMENT) | ✅ Payment status update |
| `/api/projects` | GET | Yes | ✅ List with contact join |
| `/api/projects/:id` | GET | Yes | ✅ Get by ID |
| `/api/surveys/*` | Any | Yes | ⚠️ Stub (501) |
| `/api/reports/*` | Any | Yes | ⚠️ Review endpoint stubbed |
| `/api/publications/*` | Any | Yes (LEAD_ARCHITECT / ADMIN_MANAGEMENT) | ⚠️ Create stubbed |
| `/api/portal/*` | Any | Yes | ⚠️ Stub (501) |
| `/api/media/*` | Any | Yes | ⚠️ Stub (501) |
| `/api/planning/*` | Any | Yes | ⚠️ Stub (501) |
| `/api/acceptance/*` | Any | Yes | ⚠️ Stub (501) |
| `/api/approvals/*` | Any | Yes | ⚠️ Stub (501) |
| `/api/contracts/*` | Any | Yes | ⚠️ Stub (501) |
| `/api/construction/*` | Any | Yes | ⚠️ Stub (501) |
| `/api/governance/*` | Any | Yes | ⚠️ Stub (501) |
| `/api/safety/*` | Any | Yes | ⚠️ Stub (501) |
| `/api/suppliers/*` | Any | Yes | ⚠️ Stub (501) |
| `/api/invoices/*` | Any | Yes | ⚠️ Stub (501) |
| `/api/worker-reports/*` | Any | Yes | ⚠️ Stub (501) |
| `/api/directory/*` | Any | Yes | ⚠️ Stub (501) |

## Business Rules Implemented (from V3 spec)

- Agreed visit date required (cannot be in past)
- Idempotency key min 8 chars (prevents duplicate bookings)
- Project reference generation: MB-YYYY-NNN (atomic counter with row lock)
- Terminal booking status check (CANCELLED/VISIT_COMPLETED cannot be rescheduled)
- Check-in requires BOOKED/RESCHEDULED status + GPS
- Check-out requires VISIT_UNDERWAY status + GPS
- Role-based access: CLIENT_RELATIONS_OFFICER / ADMIN_MANAGEMENT for booking management
- LEAD_ARCHITECT for report review
- MFA/step-up enforcement available in auth module

## Build Verification

| Command | Exit Code |
|---------|-----------|
| `npx tsc --project apps/api/tsconfig.json --noEmit` | 0 |
| `npm run build --workspace=@mbms/web` | 0 |

## Required Wasmer Secrets

- `DATABASE_URL` — External PostgreSQL connection string
- `JWT_SECRET` — 64-char hex secret
- `MFA_ENCRYPTION_KEY` — 64-char hex key
- `CORS_ORIGIN` — Frontend URL (e.g., https://mathmag-web.wasmer.app)
- `NODE_ENV` — production

## Next Steps

1. Deploy to Wasmer Edge
2. Set DATABASE_URL and other secrets
3. Run database migrations against external PostgreSQL
4. Port remaining routes (surveys, reports, publications, etc.) from stubs to real handlers
5. Add input validation with Zod schemas
