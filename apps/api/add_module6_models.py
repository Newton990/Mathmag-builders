path = 'prisma/schema.prisma'
with open(path, 'r', encoding='utf-8', errors='ignore') as f:
    content = f.read()

models = r'''

// ═══════════════════════════════════════════════════════════════════════════════
// MODULE 6 — Construction
// ═══════════════════════════════════════════════════════════════════════════════

model Mobilization {
  id             String             @id @default(uuid())
  projectId      String
  project        Project            @relation(fields: [projectId], references: [id], onDelete: Restrict)
  status         MobilizationStatus @default(PENDING)
  checklist      Json?
  releasedById   String?
  releasedAt     DateTime?
  blockedReason  String?
  createdAt      DateTime           @default(now())
  updatedAt      DateTime           @updatedAt

  @@index([projectId, status])
  @@map("mobilizations")
}

model SiteLog {
  id             String        @id @default(uuid())
  projectId      String
  project        Project       @relation(fields: [projectId], references: [id], onDelete: Restrict)
  logDate        DateTime      @default(now())
  weather        String?
  workSummary    String?
  workers        Json?
  issues         String?
  status         SiteLogStatus @default(DRAFT)
  submittedById  String?
  reviewedById   String?
  submittedAt    DateTime?
  reviewedAt     DateTime?
  createdAt      DateTime      @default(now())
  updatedAt      DateTime      @updatedAt

  @@index([projectId, logDate])
  @@map("site_logs")
}

model GoodsReceivedNote {
  id             String     @id @default(uuid())
  projectId      String
  project        Project    @relation(fields: [projectId], references: [id], onDelete: Restrict)
  grnNumber      String     @unique
  supplier       String?
  poNumber       String?
  items          Json?
  receivedById   String?
  status         GRNStatus  @default(PENDING)
  receivedAt     DateTime   @default(now())
  notes          String?
  createdAt      DateTime   @default(now())
  updatedAt      DateTime   @updatedAt

  @@index([projectId, status])
  @@map("goods_received_notes")
}

model WorkHold {
  id              String         @id @default(uuid())
  projectId       String
  project         Project        @relation(fields: [projectId], references: [id], onDelete: Restrict)
  reason          String
  status          WorkHoldStatus @default(OPEN)
  issuedById      String?
  liftedById      String?
  issuedAt        DateTime       @default(now())
  liftedAt        DateTime?
  clearanceNotes  String?
  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt

  @@index([projectId, status])
  @@map("work_holds")
}

model Variation {
  id              String          @id @default(uuid())
  projectId       String
  project         Project         @relation(fields: [projectId], references: [id], onDelete: Restrict)
  variationNo     String          @unique
  title           String
  description     String?
  value           Decimal?        @db.Decimal(14, 2)
  status          VariationStatus @default(DRAFT)
  requestedById   String?
  approvedById    String?
  submittedAt     DateTime?
  approvedAt      DateTime?
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt

  @@index([projectId, status])
  @@map("variations")
}

model Handover {
  id              String    @id @default(uuid())
  projectId       String
  project         Project   @relation(fields: [projectId], references: [id], onDelete: Restrict)
  checklist       Json?
  snags           Json?
  handedOverById  String?
  receivedById    String?
  handedOverAt    DateTime?
  acceptedAt      DateTime?
  completed       Boolean   @default(false)
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  @@index([projectId])
  @@map("handovers")
}
'''

if '// MODULE 6' not in content:
    content += models
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print('done')
else:
    print('exists')
