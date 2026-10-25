// prisma/seed.ts — FAKE DATA ONLY. No real personal data.
import { PrismaClient, UserRole, SourceChannel } from '@prisma/client';
import argon2 from 'argon2';

const prisma = new PrismaClient();
const DEV_PASSWORD = 'Password123!';

async function hashPw(pw: string) {
  return argon2.hash(pw, { memoryCost: 8192, timeCost: 1, parallelism: 1 });
}

async function main() {
  console.log('🌱 Seeding MBMS database with FAKE development data...\n');
  const hash = await hashPw(DEV_PASSWORD);

  // ── Users: one per role ──────────────────────────────────────────────────
  const users = await Promise.all([
    prisma.user.upsert({
      where: { email: 'cro@mathmag.dev' },
      update: {},
      create: { name: 'Amina Wanjiku', email: 'cro@mathmag.dev', passwordHash: hash, role: UserRole.CLIENT_RELATIONS_OFFICER },
    }),
    prisma.user.upsert({
      where: { email: 'officer@mathmag.dev' },
      update: {},
      create: { name: 'Brian Otieno', email: 'officer@mathmag.dev', passwordHash: hash, role: UserRole.VISITING_OFFICER },
    }),
    prisma.user.upsert({
      where: { email: 'lead.arch@mathmag.dev' },
      update: {},
      create: { name: 'Catherine Muthoni', email: 'lead.arch@mathmag.dev', passwordHash: hash, role: UserRole.LEAD_ARCHITECT },
    }),
    prisma.user.upsert({
      where: { email: 'junior.arch@mathmag.dev' },
      update: {},
      create: { name: 'David Kamau', email: 'junior.arch@mathmag.dev', passwordHash: hash, role: UserRole.JUNIOR_ARCHITECT },
    }),
    prisma.user.upsert({
      where: { email: 'admin@mathmag.dev' },
      update: {},
      create: { name: 'Esther Njeri', email: 'admin@mathmag.dev', passwordHash: hash, role: UserRole.ADMIN_MANAGEMENT },
    }),
    prisma.user.upsert({
      where: { email: 'client@example.dev' },
      update: {},
      create: { name: 'Francis Maina', email: 'client@example.dev', passwordHash: hash, role: UserRole.CLIENT },
    }),
  ]);

  console.log('✅ Users seeded:');
  users.forEach((u) => console.log(`   ${u.role.padEnd(30)} → ${u.email}`));

  // ── Contacts: 3 fake Kenyan contacts ────────────────────────────────────
  const contacts = await Promise.all([
    prisma.contact.upsert({
      where: { id: 'seed-contact-001' },
      update: {},
      create: {
        id: 'seed-contact-001',
        fullName: 'Francis Maina',
        primaryPhone: '+254712000001',
        email: 'client@example.dev',
        sourceChannel: SourceChannel.WALK_IN,
        consentDataProc: true,
      },
    }),
    prisma.contact.upsert({
      where: { id: 'seed-contact-002' },
      update: {},
      create: {
        id: 'seed-contact-002',
        fullName: 'Grace Akinyi',
        organisation: 'Akinyi Family Ltd',
        primaryPhone: '+254723000002',
        email: 'grace.akinyi@example.dev',
        sourceChannel: SourceChannel.PHONE,
        consentDataProc: true,
      },
    }),
    prisma.contact.upsert({
      where: { id: 'seed-contact-003' },
      update: {},
      create: {
        id: 'seed-contact-003',
        fullName: 'Hassan Omar',
        primaryPhone: '+254734000003',
        sourceChannel: SourceChannel.MANUAL,
        consentDataProc: true,
      },
    }),
  ]);

  console.log(`\n✅ Contacts seeded: ${contacts.length} fake contacts`);

  // ── Project reference sequence ───────────────────────────────────────────
  await prisma.projectSequence.upsert({
    where: { year_prefix: { year: new Date().getFullYear(), prefix: 'MB' } },
    update: {},
    create: { year: new Date().getFullYear(), prefix: 'MB', counter: 0 },
  });

  console.log('✅ Project sequence initialised (MB-YYYY-NNN)\n');
  console.log('─'.repeat(55));
  console.log('Dev credentials — password for ALL accounts: ' + DEV_PASSWORD);
  users.forEach((u) => console.log('  ' + u.email + '  [' + u.role + ']'));
  console.log('─'.repeat(55));
  console.log('⚠️  FAKE DATA ONLY — never use in production.\n');
}

main()
  .catch((e) => { console.error('❌ Seed failed:', e); process.exit(1); })
  .finally(() => void prisma.$disconnect());
