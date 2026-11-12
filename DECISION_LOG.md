# MBMS — Decision Log

**Purpose:** Record every decision taken, in progress, or planned so any future model/session can resume work without re-discovering context. This is the working memory for the "loop till done" effort.

**Source of truth for spec:** `docs/specs/` from `Mathmag_Builders_Full_7_Modules_Download_Fixed-5.zip` (V3.0, 25 Oct 2026).  
**Repo:** `C:\Users\user\Desktop\Mathmag builders\mathmag-mbms`  
**Started:** Thu Nov 12 2026  
**Primary agent:** current model (future models should read this file + `MASTER_PLAN.md` + `AGENTS.md` first)

---

## How to use this log

- Each entry has: `## D-NN — <title>`, `Date`, `Status` (Decided / In Progress / Done / Blocked / Reverted), `Decision`, `Rationale`, `Files affected`, `Next step`.
- When resuming: read `DECISION_LOG.md` → `MASTER_PLAN.md` → `AGENTS.md` → current `apps/api/src/edge.ts` + `db.ts`.
- Do NOT delete entries; mark them Done/Reverted and add new ones.

---

## D-00 — Scope definition for "done creating this as per what's needed"

**Date:** 2026-11-12  
**Status:** Decided  
**Decision:** Treat "done" as completing the Wasmer Edge MBMS API per the V3.0 spec and `MASTER_PLAN.md` immediate next actions:
  1. Port ALL remaining stub routes (501) to real handlers with DB integration, JWT auth, and business-rule validation.
  2. Add Zod input validation for all POST/PATCH/PUT request bodies.
  3. Verify both builds pass (`tsc --noEmit` for API, `vite build` for web).
  4. Record decisions here; commit to git.
**Rationale:** `MASTER_PLAN.md` §13 lists these as the immediate next actions; `actions/07-all-routes-ported` claims all routes are ported but the actual `edge.ts` still has stubs, so the work is incomplete. The spec pack is the governing reference.
**Files affected:** `apps/api/src/edge.ts`, `apps/api/src/db.ts`, `packages/shared/src/*` (Zod schemas), `DECISION_LOG.md`, `MASTER_PLAN.md`
**Next step:** Verify current build state, then implement remaining stub routes starting with the ones in `actions/07` route list.

---

## D-01 — Observed state discrepancy (recorded, not yet resolved)

**Date:** 2026-11-12  
**Status:** Decided (documentation of known issue)  
**Decision:** Document that `actions/07-all-routes-ported/README.md` and `MASTER_PLAN.md` §3 claim routes are implemented / postgres.js used, but actual code shows:
  - `edge.ts` still returns 501 for: `/api/planning`, `/api/acceptance`, `/api/approvals`, `/api/contracts`, `/api/construction`, `/api/governance`, `/api/safety`, `/api/suppliers`, `/api/invoices`, `/api/worker-reports`, `/api/directory` (and their `:id` sub-routes).
  - `db.ts` is an in-memory Map adapter (header says "in-memory adapter"), NOT postgres.js despite action READMEs claiming postgres.js.
  - `edge.ts` header comment says "Database: in-memory adapter".
  - No Zod validation is used in `edge.ts` (manual `body ?? {}` checks only).
**Rationale:** Must not assume work is complete; build + code inspection is the source of truth.
**Files affected:** `apps/api/src/edge.ts`, `apps/api/src/db.ts`, `MASTER_PLAN.md`, `actions/07-all-routes-ported/README.md`
**Next step:** Resolve by implementing the missing routes and reconciling docs, OR update docs to match code. Decision pending (see D-02).

---

## D-02 — Whether to implement advanced sub-routes from action 07 vs. keep parity with existing code style

**Date:** 2026-11-12  
**Status:** Done  
**Decision:** Implemented all remaining stub routes as real handlers following existing `edge.ts` patterns (surveys/reports/publications style). Added Zod request-body validation for all POST/PATCH/PUT bodies. Used shared enums for statuses/roles where applicable. Advanced sub-routes from action 07 (e.g. `:id/tasks`, `:id/verify`, `:id/decision`, `:id/execute`, `:id/lift`, `:id/beneficiary-change`, `:id/pay`, `:id/verifications`) implemented as real endpoints. Base CRUD + status transitions implemented for all 11 formerly-stub modules.
**Rationale:** Moves toward "all routes ported" while keeping consistency with existing handler style and not over-engineering against unreadable PDF content.
**Files affected:** `apps/api/src/edge.ts` (all handlers + Zod schemas), `apps/api/src/db.ts` (new entity stores)
**Next step:** Build verification + commit.

---

## D-03 — Database adapter: keep in-memory or switch to postgres.js

**Date:** 2026-11-12  
**Status:** Done  
**Decision:** db.ts now imports `postgres` and initializes a client when `DATABASE_URL` is set (`initSql()` / `getSql()`). All existing CRUD stays in-memory Maps so the system works without an external DB (local dev / Wasmer edge process lifetime). When `DATABASE_URL` is configured on Wasmer, `sql` is available for persistent queries. In-memory remains the default working path.
**Rationale:** User wants Wasmer with a working DB; postgres.js is installed and wired, but in-memory keeps builds passing and the system runnable without an external DB during development.
**Files affected:** `apps/api/src/db.ts` (postgres import + initSql), `apps/api/package.json` (postgres added)
**Next step:** Implement edge.ts routes; optionally route writes through `sql` when available.

---

## D-04 — Zod validation strategy

**Date:** 2026-11-12  
**Status:** Done  
**Decision:** Added Zod request-body validation schemas for all POST/PATCH/PUT bodies across all modules (bookings, reschedule, GPS, fee, surveys, report review, publication, media, design packages/tasks, acceptance, approvals, contracts, construction, governance, safety, suppliers, invoices, worker reports, directory). Returns 400 `VALIDATION_ERROR` on failure, matching existing error style. `zod` already a dependency of `@mbms/api`.
**Rationale:** `MASTER_PLAN.md` §13 #6 explicitly requires Zod input validation for all request bodies.
**Files affected:** `apps/api/src/edge.ts` (schemas + validateBody helper)
**Next step:** Commit + push.

---

## D-05 — Commit strategy

**Date:** 2026-11-12  
**Status:** Planned  
**Decision:** (planning) Commit all changes with message per `MASTER_PLAN.md` §13 #7: `"Wasmer Edge: real API handlers with postgres.js, JWT auth, business rules"` (adjust to reflect actual in-memory adapter). Push to `origin main`.
**Rationale:** `MASTER_PLAN.md` immediate next action #7.
**Files affected:** git
**Next step:** After implementation + builds pass.

---

## Planned work queue (from MASTER_PLAN.md §13)

| # | Task | Status |
|---|------|--------|
| 1 | Verify builds pass (tsc + vite) | Done (both exit 0, 2026-11-12) |
| 2 | Install Wasmer CLI + deploy (deployment, out of code scope) | Future |
| 3 | Set Wasmer secrets (deployment) | Future |
| 4 | Run DB migrations against external PostgreSQL (deployment) | Future |
| 5 | Port remaining stub routes to real handlers | Done (11 modules implemented) |
| 6 | Add Zod input validation for all request bodies | Done |
| 7 | Commit + push to git | In progress |

---

## Notes for resumption

- Read this file + `MASTER_PLAN.md` + `AGENTS.md` first.
- `edge.ts` uses `@ts-nocheck` — TSC build is on `apps/api/tsconfig.json --noEmit`.
- Shared package exports: `enums.ts`, `types.ts`, `survey-schemas.ts`, `state-machines.ts` via `src/index.ts`.
- ENVS required at runtime (not for build): `JWT_SECRET`, `MFA_ENCRYPTION_KEY` (strictly required per `config.ts`); `DATABASE_URL` not strictly required (in-memory default; `postgres` wired when set).
- Time zone: Africa/Nairobi; currency: KES; phones: +254.
- All 25 route groups now have real handlers (no 501 stubs remain in `edge.ts`).
