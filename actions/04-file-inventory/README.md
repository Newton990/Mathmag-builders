# Action 04 — Project File Inventory

## Objective
Create a complete inventory of all source files in the MBMS repository, organized by category.

## Repository Structure

```
mathmag-mbms/
├── apps/
│   ├── api/
│   │   ├── src/
│   │   │   ├── config.ts
│   │   │   ├── app.ts
│   │   │   ├── index.ts
│   │   │   ├── logger.ts
│   │   │   ├── auth/          (auth.service.ts, tokens.ts, mfa.ts)
│   │   │   ├── db/            (client.ts)
│   │   │   ├── middleware/    (auth.middleware.ts, errorHandler.ts, validate.ts, requestLogger.ts, asyncHandler.ts)
│   │   │   ├── routes/        (23 route files)
│   │   │   ├── services/      (26 service files)
│   │   │   └── __tests__/     (test files)
│   │   ├── prisma/
│   │   │   ├── schema.prisma  (1366 lines — full DB schema)
│   │   │   └── seed.ts
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── vitest.config.ts
│   ├── web/
│   │   ├── src/
│   │   │   ├── App.tsx
│   │   │   ├── index.css
│   │   │   ├── main.tsx
│   │   │   ├── test-setup.ts
│   │   │   ├── auth/          (AuthContext.tsx)
│   │   │   ├── components/    (Guards.tsx, JsonView.tsx, ui.tsx)
│   │   │   ├── layouts/       (StaffLayout, FieldLayout, PortalLayout)
│   │   │   ├── lib/           (api.ts, types.ts, format.ts, gps.ts, survey.ts, useResource.ts)
│   │   │   └── pages/         (LoginPage, staff/, field/, portal/)
│   │   ├── e2e/               (Playwright tests)
│   │   ├── package.json
│   │   ├── vite.config.ts
│   │   ├── playwright.config.ts
│   │   ├── postcss.config.js
│   │   ├── tailwind.config.js
│   │   └── tsconfig.json
│   └── migration_module2.sql  (empty)
├── packages/
│   └── shared/
│       ├── src/
│       │   ├── enums.ts       (336 lines — all business enums)
│       │   ├── state-machines.ts (283 lines — transition guards)
│       │   ├── survey-schemas.ts (178 lines — Zod schemas sections A-G)
│       │   ├── types.ts       (63 lines — shared TS types)
│       │   └── index.ts       (5 lines — barrel exports)
│       ├── package.json
│       ├── tsconfig.json
│       └── vitest.config.ts
├── docs/
│   ├── adrs/                  (README.md)
│   ├── specs/                 (Architecture/, Implementation/, Modules/, README.md)
│   ├── erd.md
│   └── .prettierrc.json
├── scripts/                   (created locally — not on GitHub)
│   ├── setup-dev.ps1
│   ├── build-all.ps1
│   ├── test-all.ps1
│   ├── run-all.ps1
│   └── exercise-actions.mjs
├── actions/                   (created locally — this log)
│   ├── 00-master-index/
│   ├── 01-repo-comparison-local-vs-github/
│   ├── 02-contributor-analysis/
│   ├── 03-local-scripts-creation/
│   └── 04-file-inventory/
├── package.json               (root — npm workspaces)
├── package-lock.json
├── tsconfig.base.json
├── .env
├── .env.example
├── .gitignore
├── .prettierrc.json
├── AGENTS.md
├── README.md
├── check_v3.py
├── count.py
├── v3_state.py
├── docker-compose.yml
├── netlify.toml
└── vercel.json
```

## File Counts by Category

| Category | Count |
|----------|-------|
| API route files | 23 |
| API service files | 26 |
| API middleware files | 5 |
| API auth files | 3 |
| API test files | 7 |
| Shared source files | 5 |
| Web source files | ~25+ |
| Config files (root + workspaces) | ~15 |
| Documentation files | ~10 |
| Python helper scripts | ~18 |
| Locally created scripts | 5 |
| Locally created action folders | 5 |

## Tech Stack
- **Language:** TypeScript 5 (strict mode, ESM)
- **API:** Node.js 20+, Express 4, Prisma/PostgreSQL 16
- **Auth:** argon2, httpOnly JWT cookies, RBAC, MFA (TOTP)
- **Background jobs:** pg-boss (Postgres-backed)
- **Object storage:** MinIO (S3-compatible)
- **Documents:** docx (DOCX), Playwright (PDF)
- **Frontend:** React 18, Vite 5, Tailwind CSS 3, vite-plugin-pwa
- **Tests:** Vitest (unit/integration), Playwright (E2E)
- **Local dev:** Docker Compose

## Business Modules
| Module | Scope |
|--------|-------|
| Module 1 | Site Visit (enquiry → booking → survey → report → approval → publication) |
| Module 2 | Planning & Technical Design (design tasks, approvals, estimates, coordination) |
| Module 3 | Client Acceptance & Budget (proposals, acceptances, payments, module releases) |
| Module 4 | Statutory Approvals (permits, printing, approval cases) |
| Module 5 | Contracts (service engagements, contracts) |
| Module 6 | Construction (mobilization, site logs, GRN, work holds, variations, handovers) |
| Module 7 | Central Administration & Governance (delegations, acting authority, exceptions, audits, leave, requisitions, POs) |

## Outcome
Complete file inventory documented. No changes made to source code.
