# Wasmer stripping and build loop

Historical action record. The workspace now deploys prebuilt artifacts to `newton/mbms`.

- Runtime entrypoint: root `server.js`
- API source: `apps/api/src/edge.ts`
- Compiled API: `apps/api/dist/edge.js`
- Static assets: root `public/`
- Database: Wasmer-managed PostgreSQL and idempotent startup migrations
- Anybuild build command: `node -e "console.log('Prebuilt')"`
