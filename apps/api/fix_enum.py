path = 'src/services/planning.service.ts'
with open(path) as f:
    s = f.read()
s2 = s.replace('canTransitionDesignTask(task.status,', 'canTransitionDesignTask(task.status as any,')
s2 = s2.replace('canTransitionDesignApproval(approval.status,', 'canTransitionDesignApproval(approval.status as any,')
s2 = s2.replace('canTransitionCoordinationIssue(issue.status,', 'canTransitionCoordinationIssue(issue.status as any,')
s2 = s2.replace('canTransitionEstimate(estimate.status,', 'canTransitionEstimate(estimate.status as any,')
with open(path, 'w') as f:
    f.write(s2)
print('done')
