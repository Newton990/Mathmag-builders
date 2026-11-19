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

The API config requires `DATABASE_URL`, `JWT_SECRET` (at least 64 characters),
and `MFA_ENCRYPTION_KEY` (64 hexadecimal characters). Configure these as local
environment variables for the smoke test and as Wasmer secrets for deployment.
The current Edge handler stores records in its in-memory adapter, so its data
does not persist across restarts; setting `DATABASE_URL` satisfies startup
configuration but does not make that adapter persistent.

## Deploy

The root `wasmer.toml` runs the Node.js HTTP server and mounts both the
application files and generated static assets. `app.yaml` runs the root build
during deployment. Ensure `mathmag` in `app.yaml` and `wasmer.toml` matches
your Wasmer account namespace, and set the required runtime secrets before
deploying.

```bash
wasmer deploy
```

Frontend API calls default to the same-origin `/api` path. Do not configure a
separate frontend API hostname for this unified deployment.
