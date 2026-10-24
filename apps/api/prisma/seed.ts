// prisma/seed.ts
// Step 1 seed: empty — just verifies the seed script runs.
// Step 2 will add fake users and contacts.
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  console.log('🌱 Running database seed (Step 1 — no data yet)...');
  // Step 2 will populate this with fake staff users and contacts.
  console.log('✅ Seed complete.');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
