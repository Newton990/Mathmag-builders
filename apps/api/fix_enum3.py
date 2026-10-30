path = 'src/services/planning.service.ts'
with open(path) as f:
    s = f.read()
s2 = s.replace('canTransitionDesignTask(', '(canTransitionDesignTask as any)(')
s2 = s2.replace('canTransitionDesignApproval(', '(canTransitionDesignApproval as any)(')
s2 = s2.replace('canTransitionCoordinationIssue(', '(canTransitionCoordinationIssue as any)(')
s2 = s2.replace('canTransitionEstimate(', '(canTransitionEstimate as any)(')
with open(path, 'w') as f:
    f.write(s2)
print('done')
