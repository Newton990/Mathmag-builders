path = 'src/services/governance.service.ts'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Simplify creates
content = content.replace('''  const d = await prisma.delegationMandate.create({
    data: {
      projectId: data.projectId,
      delegatorId,
      delegateId: data.delegateId,
      scope: data.scope,
      valueLimit: data.valueLimit,
      riskCategory: data.riskCategory,
      status: DelegationStatus.ACTIVE,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
    },
  });''', '''  const d = await prisma.delegationMandate.create({
    data: {
      delegatorId,
      delegateId: data.delegateId,
      scope: data.scope,
      valueLimit: data.valueLimit,
      riskCategory: data.riskCategory,
      status: DelegationStatus.ACTIVE,
      ...(data.projectId ? { projectId: data.projectId } : {}),
      ...(data.expiresAt ? { expiresAt: new Date(data.expiresAt) } : {}),
    } as any,
  });''')

content = content.replace('''  const a = await prisma.actingAuthority.create({
    data: {
      projectId: data.projectId,
      principalId,
      actingId: data.actingId,
      reason: data.reason,
      status: ActingAuthorityStatus.PENDING,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
    },
  });''', '''  const a = await prisma.actingAuthority.create({
    data: {
      principalId,
      actingId: data.actingId,
      reason: data.reason,
      status: ActingAuthorityStatus.PENDING,
      ...(data.projectId ? { projectId: data.projectId } : {}),
      ...(data.expiresAt ? { expiresAt: new Date(data.expiresAt) } : {}),
    } as any,
  });''')

content = content.replace('''  const e = await prisma.projectException.create({
    data: {
      projectId: data.projectId,
      requestedById,
      reason: data.reason,
      scope: data.scope,
      status: ExceptionStatus.PENDING,
    },
  });''', '''  const e = await prisma.projectException.create({
    data: {
      requestedById,
      reason: data.reason,
      scope: data.scope,
      status: ExceptionStatus.PENDING,
      ...(data.projectId ? { projectId: data.projectId } : {}),
    } as any,
  });''')

content = content.replace('''  const a = await prisma.protectedAuditCase.create({
    data: {
      projectId: data.projectId,
      caseNumber: generateAuditNumber(),
      title: data.title,
      description: data.description,
      status: ProtectedAuditStatus.OPEN,
      severity: data.severity,
    },
  });''', '''  const a = await prisma.protectedAuditCase.create({
    data: {
      caseNumber: generateAuditNumber(),
      title: data.title,
      description: data.description,
      status: ProtectedAuditStatus.OPEN,
      severity: data.severity,
      ...(data.projectId ? { projectId: data.projectId } : {}),
    } as any,
  });''')

content = content.replace('''  const l = await prisma.leaveRequest.create({
    data: {
      projectId: data.projectId,
      userId,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      reason: data.reason,
      status: LeaveStatus.PENDING,
    },
  });''', '''  const l = await prisma.leaveRequest.create({
    data: {
      userId,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      reason: data.reason,
      status: LeaveStatus.PENDING,
      ...(data.projectId ? { projectId: data.projectId } : {}),
    } as any,
  });''')

content = content.replace('''  const r = await prisma.purchaseRequisition.create({
    data: {
      projectId: data.projectId,
      requisitionNo: generateReqNumber(),
      requestedById,
      items: data.items,
      totalAmount: data.totalAmount,
      currency: 'KES',
      status: RequisitionStatus.SUBMITTED,
      notes: data.notes,
    },
  });''', '''  const r = await prisma.purchaseRequisition.create({
    data: {
      requisitionNo: generateReqNumber(),
      requestedById,
      items: data.items,
      totalAmount: data.totalAmount,
      currency: 'KES',
      status: RequisitionStatus.SUBMITTED,
      notes: data.notes,
      ...(data.projectId ? { projectId: data.projectId } : {}),
    } as any,
  });''')

content = content.replace('''  const po = await prisma.purchaseOrder.create({
    data: {
      projectId: data.projectId,
      requisitionId: data.requisitionId,
      poNumber: generatePONumber(),
      supplierId: data.supplierId,
      items: data.items,
      totalAmount: data.totalAmount,
      currency: 'KES',
      status: POStatus.DRAFT,
    },
  });''', '''  const po = await prisma.purchaseOrder.create({
    data: {
      poNumber: generatePONumber(),
      supplierId: data.supplierId,
      items: data.items,
      totalAmount: data.totalAmount,
      currency: 'KES',
      status: POStatus.DRAFT,
      ...(data.projectId ? { projectId: data.projectId } : {}),
      ...(data.requisitionId ? { requisitionId: data.requisitionId } : {}),
    } as any,
  });''')

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print('done')
