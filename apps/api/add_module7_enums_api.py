path = 'prisma/schema.prisma'
with open(path, 'r', encoding='utf-8', errors='ignore') as f:
    content = f.read()

old = '''enum Priority {
  LOW
  NORMAL
  HIGH
  URGENT
}'''

new = '''// Module 7 enums

enum DelegationStatus {
  ACTIVE
  SUSPENDED
  REVOKED
  EXPIRED
}

enum ActingAuthorityStatus {
  PENDING
  ACTIVE
  EXPIRED
  REVOKED
}

enum ExceptionStatus {
  PENDING
  APPROVED
  REJECTED
  CLOSED
}

enum ProtectedAuditStatus {
  OPEN
  TRIAGED
  INVESTIGATING
  ACTIONS_PENDING
  CLOSED
  ESCALATED
}

enum LeaveStatus {
  PENDING
  APPROVED
  REJECTED
  CANCELLED
}

enum RequisitionStatus {
  DRAFT
  SUBMITTED
  APPROVED
  REJECTED
  PO_CREATED
  CLOSED
}

enum POStatus {
  DRAFT
  APPROVED
  SENT
  RECEIVED
  CLOSED
  CANCELLED
}

enum ProcurementStatus {
  DRAFT
  SUBMITTED
  APPROVED
  ORDERED
  RECEIVED
  CLOSED
}

enum Priority {
  LOW
  NORMAL
  HIGH
  URGENT
}'''

if '// Module 7 enums' not in content:
    content = content.replace(old, new)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print('done')
else:
    print('exists')
