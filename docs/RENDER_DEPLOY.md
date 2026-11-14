# Render deployment guide

This project is ready to run with a PostgreSQL database on Render and a separate frontend host (Vercel/Netlify). The backend is the critical live service; the browser app should point to it using `VITE_API_BASE_URL`.

## 1) Create the Render PostgreSQL database

1. In Render, create a new PostgreSQL service.
2. Copy the internal or external connection string to `DATABASE_URL`.
3. Keep the plan and region aligned with the API service to reduce latency.

## 2) Create the API service

Use the repo root as the service root.

```yaml
# Example Render web service settings
Service type: Web Service
Runtime: Node
Build command: npm install && npm run build --workspace=@mbms/api
Start command: npm run start --workspace=@mbms/api
```

Set the following environment variables in Render:

- `NODE_ENV=production`
- `DATABASE_URL=<postgres-url-from-render>`
- `JWT_SECRET=<64+ char random secret>`
- `MFA_ENCRYPTION_KEY=<64-char hex string>`
- `CORS_ORIGIN=https://your-frontend-domain.com`
- `LOG_LEVEL=info`
- `API_PORT=3001`

## 3) Deploy the frontend

The frontend should be deployed as a static Vite app from the same repo.

Set these build-time values in the hosting dashboard:

- `VITE_DEMO_MODE=false`
- `VITE_API_BASE_URL=https://<your-render-api-domain>/api`

For Netlify/Vercel the build is already configured to work from the repo root:

- `npm run build --workspace=packages/shared`
- `npm run build --workspace=@mbms/web`

## 4) Production behavior

When `VITE_DEMO_MODE=false`, the app stops auto-logging into demo accounts and uses the live backend instead.

This is the recommended production setting for real signups and beginner onboarding.

## 5) Validation checklist

- API service starts successfully on Render
- `DATABASE_URL` resolves correctly
- `JWT_SECRET` and `MFA_ENCRYPTION_KEY` are present
- `CORS_ORIGIN` matches the frontend domain exactly
- frontend resolves `VITE_API_BASE_URL` correctly
- login flow works without demo-only fallback

## 6) Notes

Render and Vercel/Netlify are the most practical fit for this repo because the app is already split into a workspace-based API and a browser frontend.
