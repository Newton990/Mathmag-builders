path = 'prisma/schema.prisma'
with open(path, 'r', encoding='utf-8', errors='ignore') as f:
    content = f.read()

old = '''enum Priority {
  LOW
  NORMAL
  HIGH
  URGENT
}'''

new = '''// Module 6 enums

enum MobilizationStatus {
  PENDING
  IN_PROGRESS
  READY
  BLOCKED
  RELEASED
}

enum SiteLogStatus {
  DRAFT
  SUBMITTED
  REVIEWED
}

enum GRNStatus {
  PENDING
  ACCEPTED
  REJECTED
}

enum WorkHoldStatus {
  OPEN
  CLEARED
  LIFTED
}

enum VariationStatus {
  DRAFT
  SUBMITTED
  REVIEWED
  APPROVED
  REJECTED
}

enum Priority {
  LOW
  NORMAL
  HIGH
  URGENT
}'''

if old in content:
    content = content.replace(old, new)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print('done')
else:
    print('not found')
