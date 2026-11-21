# Unified Wasmer Deployment

The application is a React 18 + Vite frontend (`apps/web`) and a TypeScript
Fetch API (`apps/api/src/edge.ts`). The root Node.js HTTP server (`server.js`)
is the single deployment entrypoint: it forwards `/api/*` to the API handler,
serves built assets from `public/`, and falls back to `index.html` for SPA
routes.

## Build and run locally

```powershell
npm run build
$env:PORT = "8080"
node server.js
```

Open `http://localhost:8080/` for the UI and
`http://localhost:8080/api/health` for the API health response. The build runs
the shared package and API TypeScript builds before Vite writes the frontend
production bundle into the root `public/` directory.

The API config requires a PostgreSQL connection plus `JWT_SECRET` (at least 64
characters) and `MFA_ENCRYPTION_KEY` (64 hexadecimal characters). For local
development, use `DATABASE_URL` from `.env.example`. The Wasmer app requests a
managed PostgreSQL database; at runtime its `DB_HOST`, `DB_PORT`, `DB_NAME`,
`DB_USERNAME`, and `DB_PASSWORD` values are converted to a TLS-required
`DATABASE_URL` unless you explicitly provide one. Set only the auth secrets in
Wasmer; no external database provider or database URL secret is needed.
The API persists each domain model in a PostgreSQL table with a JSONB record
payload and indexed project/relationship fields. Versioned, idempotent schema
migrations run before the server starts. Records are no longer held in process
memory.

## Deploy

The root `Anybuild` file configures Wasmer's native Node.js build and runs the
root `npm start` command. That command starts migrations and the unified HTTP
server, which serves `public/` and routes `/api/*` requests. `app.yaml`
provisions managed PostgreSQL for `newton/mbms`. Set the required auth secrets
before deploying.

```bash
wasmer deploy --build-remote
```

Frontend API calls default to the same-origin `/api` path. Do not configure a
separate frontend API hostname for this unified deployment.
