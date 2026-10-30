path = 'src/services/planning.service.ts'
with open(path) as f:
    s = f.read()
s2 = s.replace('status, status)', 'status as any, status as any)')
s2 = s2.replace('status as any, DesignTaskStatus.SUBMITTED_FOR_REVIEW)', 'status as any, DesignTaskStatus.SUBMITTED_FOR_REVIEW as any)')
s2 = s2.replace('status as any, newStatus)', 'status as any, newStatus as any)')
s2 = s2.replace('status as any, DesignTaskStatus.RELEASED)', 'status as any, DesignTaskStatus.RELEASED as any)')
s2 = s2.replace('status as any, DesignApprovalStatus.APPROVED)', 'status as any, DesignApprovalStatus.APPROVED as any)')
s2 = s2.replace('status as any, CoordinationIssueStatus.RESOLVED)', 'status as any, CoordinationIssueStatus.RESOLVED as any)')
s2 = s2.replace('status as any, EstimateStatus.APPROVED)', 'status as any, EstimateStatus.APPROVED as any)')
with open(path, 'w') as f:
    f.write(s2)
print('done')
