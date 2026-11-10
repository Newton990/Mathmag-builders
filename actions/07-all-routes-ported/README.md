# Action 07 — All API Routes Ported

## Objective
Port all remaining API routes from stubs (501) to real handlers with database integration, JWT auth, and business rule validation per V3 spec.

## Date
2026-11-11

## Routes Fully Implemented

| Route | Method | Auth | Roles | Status |
|-------|--------|------|-------|--------|
| `/api/health` | GET | No | — | ✅ |
| `/api/version` | GET | No | — | ✅ |
| `/api/auth/login` | POST | No | — | ✅ |
| `/api/auth/mfa/verify` | POST | No | — | ✅ |
| `/api/auth/me` | GET | Yes | — | ✅ |
| `/api/auth/logout` | POST | No | — | ✅ |
| `/api/bookings` | GET | Yes | — | ✅ |
| `/api/bookings/:id` | GET | Yes | — | ✅ |
| `/api/bookings` | POST | Yes | CRO/AM | ✅ |
| `/api/bookings/:id/reschedule` | PATCH | Yes | CRO/AM | ✅ |
| `/api/bookings/:id/check-in` | POST | Yes | — | ✅ |
| `/api/bookings/:id/check-out` | POST | Yes | — | ✅ |
| `/api/bookings/:id/fee` | POST | Yes | CRO/AM | ✅ |
| `/api/projects` | GET | Yes | — | ✅ |
| `/api/projects/:id` | GET | Yes | — | ✅ |
| `/api/surveys` | GET/POST | Yes | — | ✅ |
| `/api/surveys/:id` | GET/PATCH | Yes | — | ✅ |
| `/api/surveys/:id/submit` | POST | Yes | — | ✅ |
| `/api/reports` | GET | Yes | — | ✅ |
| `/api/reports/:id` | GET | Yes | — | ✅ |
| `/api/reports/:id/review` | POST | Yes | LEAD_ARCHITECT | ✅ |
| `/api/publications` | GET/POST | Yes | LEAD_ARCHITECT/AM | ✅ |
| `/api/publications/:id/revoke` | POST | Yes | LEAD_ARCHITECT/AM | ✅ |
| `/api/portal` | GET | Yes | — | ✅ |
| `/api/portal/:id` | GET | Yes | — | ✅ |
| `/api/media` | GET/POST | Yes | — | ✅ |
| `/api/media/:id` | GET | Yes | — | ✅ |
| `/api/planning` | GET | Yes | — | ✅ |
| `/api/planning/design-packages` | POST | Yes | — | ✅ |
| `/api/planning/design-packages/:id/tasks` | GET | Yes | — | ✅ |
| `/api/acceptance` | GET/POST | Yes | — | ✅ |
| `/api/acceptance/:id/verify` | PATCH | Yes | CRO/AM/LA | ✅ |
| `/api/approvals` | GET/POST | Yes | — | ✅ |
| `/api/approvals/:id/decision` | PATCH | Yes | DH/LA/AM/GM | ✅ |
| `/api/contracts` | GET/POST | Yes | — | ✅ |
| `/api/contracts/:id/execute` | PATCH | Yes | AM/GM | ✅ |
| `/api/construction` | GET | Yes | — | ✅ |
| `/api/construction/mobilizations` | POST | Yes | — | ✅ |
| `/api/construction/site-logs` | GET/POST | Yes | — | ✅ |
| `/api/construction/work-holds` | GET | Yes | — | ✅ |
| `/api/governance` | GET | Yes | — | ✅ |
| `/api/governance/delegations` | POST | Yes | AM/GM | ✅ |
| `/api/safety` | GET | Yes | — | ✅ |
| `/api/safety/holds` | POST | Yes | — | ✅ |
| `/api/safety/holds/:id/lift` | PATCH | Yes | LA/AM/GM | ✅ |
| `/api/suppliers` | GET/POST | Yes | — | ✅ |
| `/api/suppliers/:id/beneficiary-change` | POST | Yes | Accounts/AM | ✅ |
| `/api/invoices` | GET/POST | Yes | — | ✅ |
| `/api/invoices/:id/pay` | PATCH | Yes | Accounts/AM | ✅ |
| `/api/worker-reports` | GET/POST | Yes | — | ✅ |
| `/api/worker-reports/:id/verifications` | POST | Yes | LA/AM/SS | ✅ |
| `/api/directory` | GET | Yes | — | ✅ |
| `/api/directory/:id` | GET | Yes | — | ✅ |

## Business Rules Enforced

- Agreed visit date (not in past)
- Idempotency key (min 8 chars)
- Project reference: MB-YYYY-NNN
- Terminal booking status check
- Check-in/check-out with GPS validation
- Report review requires LEAD_ARCHITECT
- Publication requires APPROVED report
- Revocation requires reason (min 5 chars)
- Contract execution requires AM/GM
- Safety hold lifting requires LA/AM/GM
- Supplier beneficiary change requires Accounts/AM (holds payments)
- Invoice payment requires Accounts/AM
- Worker report verification requires LA/AM/SS

## New Files

| File | Purpose |
|------|---------|
| `apps/api/src/db.ts` | postgres.js database adapter |
| `apps/api/src/auth.ts` | JWT auth module |
| `apps/api/src/responses.ts` | Response helpers |

## Build Verification

| Command | Exit Code |
|---------|-----------|
| `npx tsc --project apps/api/tsconfig.json --noEmit` | 0 |
| `npm run build --workspace=@mbms/web` | 0 |

## Required Wasmer Secrets

- `DATABASE_URL`, `JWT_SECRET`, `MFA_ENCRYPTION_KEY`, `CORS_ORIGIN`, `NODE_ENV`

## Next Steps

1. Install Wasmer CLI and deploy
2. Set Wasmer secrets
3. Run database migrations against external PostgreSQL
4. Commit and push to GitHub
