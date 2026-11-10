path = 'src/enums.ts'
with open(path, 'r', encoding='utf-8', errors='ignore') as f:
    content = f.read()

addition = r'''


// ═══════════════════════════════════════════════════════════════════════════════
// MODULE 7 — Central Administration & Governance
// ═══════════════════════════════════════════════════════════════════════════════

export enum DelegationStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  REVOKED = 'REVOKED',
  EXPIRED = 'EXPIRED',
}

export enum ActingAuthorityStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  REVOKED = 'REVOKED',
}

export enum ExceptionStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CLOSED = 'CLOSED',
}

export enum ProtectedAuditStatus {
  OPEN = 'OPEN',
  TRIAGED = 'TRIAGED',
  INVESTIGATING = 'INVESTIGATING',
  ACTIONS_PENDING = 'ACTIONS_PENDING',
  CLOSED = 'CLOSED',
  ESCALATED = 'ESCALATED',
}

export enum LeaveStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
}

export enum RequisitionStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  PO_CREATED = 'PO_CREATED',
  CLOSED = 'CLOSED',
}

export enum POStatus {
  DRAFT = 'DRAFT',
  APPROVED = 'APPROVED',
  SENT = 'SENT',
  RECEIVED = 'RECEIVED',
  CLOSED = 'CLOSED',
  CANCELLED = 'CANCELLED',
}
'''

if 'MODULE 7' not in content:
    content += addition
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print('done')
else:
    print('exists')
