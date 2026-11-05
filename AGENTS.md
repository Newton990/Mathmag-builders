# AGENTS.md

## Repo shape (npm workspaces, ESM)
- Monorepo: `apps/api` (`@mbms/api`, Express API, Prisma/Postgres, ESM), `apps/web` (`@mbms/web`, React+Vite+Tailwind), `packages/shared` (`@mbms/shared`, Zod/types; exports TS source via `src/index.ts`).
- Root scripts (see `package.json`): `npm run dev` (api+web), `npm test` (API + shared Vitest only), `npm run build` (all workspaces), `npm run db:migrate|db:seed|db:studio` (delegates to `apps/api`).
- Workspace commands: `npm run <script> --workspace=apps/api|apps/web|packages/shared` (web workspace name is `@mbms/web`).

## Verification / focused runs
- API unit tests (Vitest, node, `apps/api/src/**/*.test.ts`): `npm test --workspace=apps/api` or from `apps/api` `npm test`. Single file: `npm test --workspace=apps/api -- --run src/path/to/file.test.ts` (Vitest).
- Shared: `npm test --workspace=packages/shared`.
- Web e2e (Playwright): `npm run test:e2e --workspace=apps/web` (needs web context as configured).
- Type/build checks follow workspace configs: API build is `prisma generate && tsc --project tsconfig.json` (`apps/api`); shared `tsc`; web `vite build`.

## API/env gotchas (trust `apps/api/src/config.ts`, not README names)
- `config.ts` fails fast on missing **strictly required**: `DATABASE_URL`, `JWT_SECRET`, `MFA_ENCRYPTION_KEY`. README mentions `JWT_ACCESS_SECRET`/`JWT_REFRESH_SECRET` — **use executable source** (`JWT_SECRET` etc.) when changing env/config.
- Config uses `API_PORT` (defaults to `PORT` or 3001), `CORS_ORIGIN` (default `http://localhost:5173`), `LOG_LEVEL`; loads dotenv only when `NODE_ENV !== 'test'`.
- `apps/api/vitest.config.ts` injects all required env vars (test values) so unit tests run without a real `.env`. Integration tests that hit a real DB/services may need Docker/services + valid `DATABASE_URL`.
- Prisma client must be generated for API build/tests in fresh environments (`npm run db:generate --workspace=apps/api` or API build script). Migrations/seed via `apps/api` scripts.

## Web/deploy gotchas
- Vite dev proxies `/api` → `http://localhost:3001` (`apps/web/vite.config.ts`).
- Netlify/CI builds for `@mbms/web` need **devDependencies** (`vite` is a devDep). If install runs with production-only deps, build fails (`vite: not found`). Use `npm install --include=dev` / `NPM_CONFIG_PRODUCTION=false` (see root `netlify.toml`).
- SPA needs `/*` → `/index.html` redirect. If API is separate, proxy `/api/*` to the API host and set API `CORS_ORIGIN` to the web origin (no trailing slash). Do not put API secrets (`DATABASE_URL`, `JWT_SECRET`, `MFA_ENCRYPTION_KEY`) in the static web build env.

## Safety/conventions
- Do not reintroduce demo-mode auto-login/mocked API into `apps/web/src/auth/AuthContext.tsx` or `apps/web/src/lib/api.ts` in the main repo; demo changes belonged in the separate demo repo/folder.
- Preserve MBMS invariants when editing business logic (see README “Important business rules”): enquiry ≠ project; one booking → one project; approval/assignment/publication are separate audited actions; approved/published versions immutable; server-side authorization; clients see only explicitly published own-project items; append-only audit; never invent missing data. Time zone Africa/Nairobi, KES, `+254` phones.
- Specs live under `docs/specs/`; there is no `.github/workflows` CI in this repo snapshot — verify against scripts/config before assuming CI behavior.
