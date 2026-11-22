# Local scripts creation

Historical action record. Superseded by the unified Node 24 workflow.

Use `scripts/setup-dev.ps1`, `scripts/build-all.ps1`, `scripts/test-all.ps1`, and `scripts/deploy-wasmer.ps1`.
Database migrations run automatically from `apps/api/src/migrate.ts`; there is no Prisma generation or separate migration CLI.
