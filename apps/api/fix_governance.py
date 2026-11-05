path = 'src/services/governance.service.ts'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("await writeAudit({ actorId: delegatorId, action: 'DELEGATION_CREATED', entityType: 'DelegationMandate', entityId: d.id, projectId: data.projectId, after: { delegateId: data.delegateId } });",
                         "await writeAudit({ actorId: delegatorId, action: 'DELEGATION_CREATED', entityType: 'DelegationMandate', entityId: d.id, projectId: data.projectId || null, after: { delegateId: data.delegateId } });")
content = content.replace("await writeAudit({ actorId: principalId, action: 'ACTING_AUTHORITY_CREATED', entityType: 'ActingAuthority', entityId: a.id, projectId: data.projectId, after: { actingId: data.actingId } });",
                         "await writeAudit({ actorId: principalId, action: 'ACTING_AUTHORITY_CREATED', entityType: 'ActingAuthority', entityId: a.id, projectId: data.projectId || null, after: { actingId: data.actingId } });")
content = content.replace("await writeAudit({ actorId, action: 'ACTING_AUTHORITY_ACTIVATED', entityType: 'ActingAuthority', entityId: id, projectId: a.projectId, after: { status: 'ACTIVE' } });",
                         "await writeAudit({ actorId, action: 'ACTING_AUTHORITY_ACTIVATED', entityType: 'ActingAuthority', entityId: id, projectId: a.projectId || null, after: { status: 'ACTIVE' } });")
content = content.replace("await writeAudit({ actorId: requestedById, action: 'EXCEPTION_REQUESTED', entityType: 'ProjectException', entityId: e.id, projectId: data.projectId, after: { reason: data.reason } });",
                         "await writeAudit({ actorId: requestedById, action: 'EXCEPTION_REQUESTED', entityType: 'ProjectException', entityId: e.id, projectId: data.projectId || null, after: { reason: data.reason } });")
content = content.replace("await writeAudit({ actorId, action: 'EXCEPTION_APPROVED', entityType: 'ProjectException', entityId: id, projectId: e.projectId, after: { status: 'APPROVED' } });",
                         "await writeAudit({ actorId, action: 'EXCEPTION_APPROVED', entityType: 'ProjectException', entityId: id, projectId: e.projectId || null, after: { status: 'APPROVED' } });")
content = content.replace("await writeAudit({ actorId, action: 'PROTECTED_AUDIT_CREATED', entityType: 'ProtectedAuditCase', entityId: a.id, projectId: data.projectId, after: { caseNumber: a.caseNumber } });",
                         "await writeAudit({ actorId, action: 'PROTECTED_AUDIT_CREATED', entityType: 'ProtectedAuditCase', entityId: a.id, projectId: data.projectId || null, after: { caseNumber: a.caseNumber } });")
content = content.replace("await writeAudit({ actorId, action: 'PROTECTED_AUDIT_TRIAGED', entityType: 'ProtectedAuditCase', entityId: id, projectId: a.projectId, after: { status: 'TRIAGED' } });",
                         "await writeAudit({ actorId, action: 'PROTECTED_AUDIT_TRIAGED', entityType: 'ProtectedAuditCase', entityId: id, projectId: a.projectId || null, after: { status: 'TRIAGED' } });")
content = content.replace("await writeAudit({ actorId: userId, action: 'LEAVE_REQUESTED', entityType: 'LeaveRequest', entityId: l.id, projectId: data.projectId, after: { startDate: data.startDate } });",
                         "await writeAudit({ actorId: userId, action: 'LEAVE_REQUESTED', entityType: 'LeaveRequest', entityId: l.id, projectId: data.projectId || null, after: { startDate: data.startDate } });")
content = content.replace("await writeAudit({ actorId, action: 'LEAVE_APPROVED', entityType: 'LeaveRequest', entityId: id, projectId: l.projectId, after: { status: 'APPROVED' } });",
                         "await writeAudit({ actorId, action: 'LEAVE_APPROVED', entityType: 'LeaveRequest', entityId: id, projectId: l.projectId || null, after: { status: 'APPROVED' } });")
content = content.replace("await writeAudit({ actorId: requestedById, action: 'REQUISITION_CREATED', entityType: 'PurchaseRequisition', entityId: r.id, projectId: data.projectId, after: { requisitionNo: r.requisitionNo } });",
                         "await writeAudit({ actorId: requestedById, action: 'REQUISITION_CREATED', entityType: 'PurchaseRequisition', entityId: r.id, projectId: data.projectId || null, after: { requisitionNo: r.requisitionNo } });")
content = content.replace("await writeAudit({ actorId, action: 'REQUISITION_APPROVED', entityType: 'PurchaseRequisition', entityId: id, projectId: r.projectId, after: { status: 'APPROVED' } });",
                         "await writeAudit({ actorId, action: 'REQUISITION_APPROVED', entityType: 'PurchaseRequisition', entityId: id, projectId: r.projectId || null, after: { status: 'APPROVED' } });")
content = content.replace("await writeAudit({ actorId, action: 'PO_CREATED', entityType: 'PurchaseOrder', entityId: po.id, projectId: data.projectId, after: { poNumber: po.poNumber } });",
                         "await writeAudit({ actorId, action: 'PO_CREATED', entityType: 'PurchaseOrder', entityId: po.id, projectId: data.projectId || null, after: { poNumber: po.poNumber } });")

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print('done')
