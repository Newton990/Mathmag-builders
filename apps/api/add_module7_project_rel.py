path = 'prisma/schema.prisma'
with open(path, 'r', encoding='utf-8', errors='ignore') as f:
    content = f.read()

old = '''  mobilizations         Mobilization[]
  siteLogs              SiteLog[]
  grns                  GoodsReceivedNote[]
  workHolds             WorkHold[]
  variations            Variation[]
  handovers             Handover[]'''

new = '''  mobilizations         Mobilization[]
  siteLogs              SiteLog[]
  grns                  GoodsReceivedNote[]
  workHolds             WorkHold[]
  variations            Variation[]
  handovers             Handover[]
  delegations           DelegationMandate[]
  actingAuthorities     ActingAuthority[]
  projectExceptions     ProjectException[]
  protectedAudits       ProtectedAuditCase[]
  leaveRequests         LeaveRequest[]
  purchaseRequisitions  PurchaseRequisition[]
  purchaseOrders        PurchaseOrder[]'''

if old in content and 'delegations' not in content:
    content = content.replace(old, new)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print('done')
else:
    print('skip')
