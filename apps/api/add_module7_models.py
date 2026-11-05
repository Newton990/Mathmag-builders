path = 'prisma/schema.prisma'
with open(path, 'r', encoding='utf-8', errors='ignore') as f:
    content = f.read()

models = r'''

// ═══════════════════════════════════════════════════════════════════════════════
// MODULE 7 — Central Administration and Governance
// ═══════════════════════════════════════════════════════════════════════════════

model DelegationMandate {
  id               String           @id @default(uuid())
  projectId        String?
  project          Project?         @relation(fields: [projectId], references: [id], onDelete: SetNull)
  delegatorId      String
  delegateId       String
  scope            Json?
  valueLimit       Decimal?         @db.Decimal(14, 2)
  riskCategory     String?
  status           DelegationStatus @default(ACTIVE)
  issuedAt         DateTime         @default(now())
  expiresAt        DateTime?
  revokedAt        DateTime?
  revocationReason String?
  createdAt        DateTime         @default(now())
  updatedAt        DateTime         @updatedAt

  @@index([delegateId, status])
  @@index([projectId])
  @@map("delegation_mandates")
}

model ActingAuthority {
  id            String                @id @default(uuid())
  projectId     String?
  project       Project?              @relation(fields: [projectId], references: [id], onDelete: SetNull)
  principalId   String
  actingId      String
  reason        String
  status        ActingAuthorityStatus @default(PENDING)
  activatedById String?
  activatedAt   DateTime?
  expiresAt     DateTime?
  revokedAt     DateTime?
  createdAt     DateTime              @default(now())
  updatedAt     DateTime              @updatedAt

  @@index([actingId, status])
  @@map("acting_authorities")
}

model ProjectException {
  id              String          @id @default(uuid())
  projectId       String?
  project         Project?        @relation(fields: [projectId], references: [id], onDelete: SetNull)
  requestedById   String
  reason          String
  scope           Json?
  status          ExceptionStatus @default(PENDING)
  approvedById    String?
  approvedAt      DateTime?
  rejectionReason String?
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt

  @@index([projectId, status])
  @@map("project_exceptions")
}

model ProtectedAuditCase {
  id          String               @id @default(uuid())
  projectId   String?
  project     Project?             @relation(fields: [projectId], references: [id], onDelete: SetNull)
  caseNumber  String               @unique
  title       String
  description String?
  status      ProtectedAuditStatus @default(OPEN)
  severity    String?
  triagedById String?
  triagedAt   DateTime?
  escalatedAt DateTime?
  closedAt    DateTime?
  createdAt   DateTime             @default(now())
  updatedAt   DateTime             @updatedAt

  @@index([projectId, status])
  @@map("protected_audit_cases")
}

model LeaveRequest {
  id              String      @id @default(uuid())
  projectId       String?
  project         Project?    @relation(fields: [projectId], references: [id], onDelete: SetNull)
  userId          String
  startDate       DateTime
  endDate         DateTime
  reason          String?
  status          LeaveStatus @default(PENDING)
  approvedById    String?
  approvedAt      DateTime?
  rejectionReason String?
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt

  @@index([userId, status])
  @@map("leave_requests")
}

model PurchaseRequisition {
  id            String            @id @default(uuid())
  projectId     String?
  project       Project?          @relation(fields: [projectId], references: [id], onDelete: SetNull)
  requisitionNo String            @unique
  requestedById String
  items         Json?
  totalAmount   Decimal?          @db.Decimal(14, 2)
  currency      String            @default("KES")
  status        RequisitionStatus @default(DRAFT)
  approvedById  String?
  approvedAt    DateTime?
  notes         String?
  createdAt     DateTime          @default(now())
  updatedAt     DateTime          @updatedAt

  purchaseOrders PurchaseOrder[]

  @@index([projectId, status])
  @@map("purchase_requisitions")
}

model PurchaseOrder {
  id            String               @id @default(uuid())
  projectId     String?
  project       Project?             @relation(fields: [projectId], references: [id], onDelete: SetNull)
  requisitionId String?
  requisition   PurchaseRequisition? @relation(fields: [requisitionId], references: [id], onDelete: SetNull)
  poNumber      String               @unique
  supplierId    String?
  items         Json?
  totalAmount   Decimal?             @db.Decimal(14, 2)
  currency      String               @default("KES")
  status        POStatus             @default(DRAFT)
  orderedAt     DateTime?
  receivedAt    DateTime?
  closedAt      DateTime?
  createdAt     DateTime             @default(now())
  updatedAt     DateTime             @updatedAt

  @@index([projectId, status])
  @@map("purchase_orders")
}
'''

if '// MODULE 7' not in content or 'DelegationMandate' not in content:
    content += models
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print('done')
else:
    print('exists')
