# Action 04 - Project File Inventory

Historical inventory. The current repository structure is:

- `apps/api/` - Fetch API source and compiled `dist/` output
- `apps/web/` - React/Vite frontend
- `packages/shared/` - shared TypeScript and Zod definitions
- `public/` - generated frontend assets
- `server.js` - unified Node 24 HTTP server
- `app.yaml` and `wasmer.toml` - Wasmer deployment configuration
- `scripts/` - local build, test, setup, and deployment helpers
- `actions/` - historical action records

The API uses `postgres.js`, idempotent startup migrations, `jose`, and `crypto.randomUUID()`. There is no Prisma, Express route tree, SQLite database, or pg-boss worker.
