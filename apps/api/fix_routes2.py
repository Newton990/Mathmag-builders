path = 'src/routes/planning.ts'
with open(path) as f:
    s = f.read()

# Replace all req.params.projectId with String(req.params.projectId)
s2 = s.replace('req.params.projectId', 'String(req.params.projectId)')
# Replace all req.user!.sub with req.auth!.userId
s2 = s2.replace('req.user!.sub', 'req.auth!.userId')
# Replace other user references
s2 = s2.replace('req.user?.id', 'req.auth?.userId')
s2 = s2.replace('req.user!.id', 'req.auth!.userId')
# Fix taskId
s2 = s2.replace('req.params.taskId', 'String(req.params.taskId)')
s2 = s2.replace('req.params.approvalId', 'String(req.params.approvalId)')
s2 = s2.replace('req.params.issueId', 'String(req.params.issueId)')
s2 = s2.replace('req.params.estimateId', 'String(req.params.estimateId)')
s2 = s2.replace('req.params.changeId', 'String(req.params.changeId)')

with open(path, 'w') as f:
    f.write(s2)
print('done')
