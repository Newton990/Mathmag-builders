path = 'prisma/schema.prisma'
with open(path, 'r', encoding='utf-8', errors='ignore') as f:
    content = f.read()

old = '''  approvalCases         ApprovalCase[]
  contracts             Contract[]
  serviceEngagements    ServiceEngagement[]'''

new = '''  approvalCases         ApprovalCase[]
  contracts             Contract[]
  serviceEngagements    ServiceEngagement[]
  mobilizations         Mobilization[]
  siteLogs              SiteLog[]
  grns                  GoodsReceivedNote[]
  workHolds             WorkHold[]
  variations            Variation[]
  handovers             Handover[]'''

if old in content:
    content = content.replace(old, new)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print('done')
else:
    print('not found')
