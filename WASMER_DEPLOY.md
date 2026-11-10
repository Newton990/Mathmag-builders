# MBMS — Wasmer Deployment Guide

Deploy a live frontend + backend on Wasmer Edge without Docker.

## Architecture

| Component | Deployment Target | Notes |
|-----------|------------------|-------|
| **Frontend** (React + Vite) | Wasmer Edge (static) | Built static files served via Wasmer Edge |
| **Backend** (API) | Wasmer Edge (JS functions) | Serverless functions, external PostgreSQL |
| **Database** | External PostgreSQL | Render, Supabase, Neon, or self-hosted |
| **Object Storage** | External S3-compatible | MinIO self-hosted or AWS S3 |

---

## Step 1: Prepare the Frontend for Wasmer

The frontend builds to static files. Deploy them to Wasmer Edge.

### Build locally

```powershell
npm run build --workspace=@mbms/web
```

Output: `apps/web/dist/`

### Wasmer config for frontend

Create `apps/web/wasmer.toml`:

```toml
name = "mathmag-web"
description = "MBMS Frontend — React + Vite static site"
version = "1.0.0"
runtime = "js"

[build]
command = "npm run build --workspace=@mbms/web"
output = "apps/web/dist"

[env]
VITE_API_BASE_URL = "https://your-api.wasmer.app/api"

[[routes]]
pattern = "/*"
handler = "static"
directory = "apps/web/dist"
```

### Deploy frontend to Wasmer

```bash
# Install Wasmer CLI
curl https://get.wasmer.io -sSfL | sh

# Login
wasmer login

# Deploy frontend
wasmer edge deploy apps/web/dist --name mathmag-web
```

---

## Step 2: Prepare the Backend for Wasmer Edge

The backend API needs to be adapted for Wasmer Edge (no Express, fetch-based handler).

### Files created

- `apps/api/wasmer.toml` — Wasmer Edge configuration
- `apps/api/src/edge.ts` — Wasmer Edge request handler

### External database required

Wasmer Edge cannot run PostgreSQL locally. You need an external PostgreSQL:

| Provider | Free Tier | Connection String Format |
|----------|-----------|-------------------------|
| Render | Yes | `postgresql://user:pass@host:5432/db` |
| Supabase | Yes | `postgresql://postgres:pass@host:5432/postgres` |
| Neon | Yes | `postgresql://user:pass@host:5432/db?sslmode=require` |
| Railway | Paid trial | `postgresql://user:pass@host:5432/db` |

### Set environment variables in Wasmer Edge

```bash
wasmer edge secret set DATABASE_URL "postgresql://..."
wasmer edge secret set JWT_SECRET "<64-char-hex>"
wasmer edge secret set MFA_ENCRYPTION_KEY "<64-char-hex>"
wasmer edge secret set CORS_ORIGIN "https://your-frontend.wasmer.app"
wasmer edge secret set NODE_ENV "production"
```

### Deploy backend to Wasmer

```bash
wasmer edge deploy apps/api --name mathmag-api
```

---

## Step 3: Connect Frontend to Backend

Update the frontend's API base URL to point to your Wasmer backend:

In `.env` (for local) or Wasmer Edge env vars (for production):

```
VITE_API_BASE_URL=https://your-api.wasmer.app/api
```

Or update `vercel.json` / `netlify.toml` redirects to point `/api/*` to your Wasmer API URL.

---

## Step 4: Run Locally Without Docker

Use the no-Docker setup script:

```powershell
.\scripts\setup-local-no-docker.ps1
```

Then:

```powershell
# 1. Install PostgreSQL on Windows (from https://www.postgresql.org/download/windows/)
# 2. Create database: CREATE DATABASE mbms_dev;
# 3. Edit .env with your DATABASE_URL, JWT_SECRET, MFA_ENCRYPTION_KEY
# 4. Run migrations:
npx prisma migrate dev --workspace=apps/api
# 5. Seed:
npm run db:seed --workspace=apps/api
# 6. Start dev servers:
npm run dev
```

- API: http://localhost:3001/api/health
- Web: http://localhost:5173

---

## Step 5: Port Remaining Routes to Wasmer Edge

Currently `apps/api/src/edge.ts` returns 501 (Not Implemented) for most routes. To fully port the API:

1. Import service functions from `apps/api/src/services/` into `edge.ts`
2. Replace the `dispatchRoute` function with real route handlers
3. Each route: parse request → call service → return Response

Example:

```typescript
import { confirmVisitBooking } from './services/project.service.js';

if (path === '/bookings' && method === 'POST') {
  const actor = { userId: '...', role: 'CLIENT_RELATIONS_OFFICER' }; // from JWT
  const result = await confirmVisitBooking(actor, body);
  return json(result, 200, origin, env);
}
```

---

## Alternative: Keep Backend on Render, Frontend on Wasmer

If porting all API routes to Wasmer Edge is too much work, you can:

- **Frontend:** Deploy to Wasmer Edge (static)
- **Backend:** Keep on Render (`https://mathmag-api.onrender.com/api` — already configured in `vercel.json`)

Update `apps/web/vite.config.ts` proxy target for local dev, and `vercel.json` rewrite for production.

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Prisma doesn't work on Wasmer Edge | Use a different DB client or keep backend on a Node.js host |
| CORS errors | Set `CORS_ORIGIN` env var to your frontend URL |
| DATABASE_URL missing | Set it in Wasmer Edge secrets |
| Build fails | Run `npm install --include=dev` first (devDeps needed for Vite) |
