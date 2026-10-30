path = 'src/services/planning.service.ts'
with open(path) as f:
    s = f.read()

old = '''    const updated = await tx.designTask.update({
      where: { id: taskId },
      data: {
        status: newStatus,
        approvedAt: newStatus === DesignTaskStatus.TECHNICALLY_APPROVED ? new Date() : undefined,
      },
    });'''
new = '''    const updateData: any = { status: newStatus };
    if (newStatus === DesignTaskStatus.TECHNICALLY_APPROVED) {
      updateData.approvedAt = new Date();
    }
    const updated = await tx.designTask.update({
      where: { id: taskId },
      data: updateData,
    });'''
if old in s:
    s = s.replace(old, new)
    print('ok')
else:
    print('no')
with open(path, 'w') as f:
    f.write(s)
