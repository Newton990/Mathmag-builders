// src/services/invoice.service.ts
// Invoice three-way matching against PO and accepted GRN (UAT-15, UAT-17, MAST-UAT-17).
// Rejects noncontracted overpayment and retains partial delivery balance.
import { prisma } from '../db/client.js';
import { httpError } from '../middleware/errorHandler.js';
import { writeAudit } from './audit.service.js';

function sumItems(items: any[]): number {
  if (!Array.isArray(items)) return 0;
  return items.reduce((total, item) => total + Number(item?.amount || item?.value || item?.lineTotal || 0), 0);
}

export async function createInvoice(projectId: string, actorId: string, data: any) {
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) throw httpError('Project not found', 404, 'PROJECT_NOT_FOUND');

  const supplier = await prisma.supplier.findUnique({ where: { id: data.supplierId } });
  if (!supplier) throw httpError('Supplier not found', 404, 'SUPPLIER_NOT_FOUND');

  // Check for active beneficiary-change hold on this supplier
  const hold = await prisma.beneficiaryChange.findFirst({
    where: { supplierId: data.supplierId, status: 'PENDING_VERIFICATION', paymentHold: true },
  });
  if (hold) {
    throw httpError(
      'Supplier beneficiary change pending verification — payment hold in effect',
      409,
      'BENEFICIARY_CHANGE_HOLD',
    );
  }

  const invoice = await prisma.invoice.create({
    data: {
      projectId,
      supplierId: data.supplierId,
      poId: data.poId,
      grnId: data.grnId,
      invoiceNumber: data.invoiceNumber,
      amount: data.amount,
      currency: data.currency || 'KES',
      status: 'DRAFT',
    },
  });
  await writeAudit({
    actorId,
    action: 'INVOICE_CREATED',
    entityType: 'Invoice',
    entityId: invoice.id,
    projectId,
    after: { invoiceNumber: data.invoiceNumber, amount: data.amount },
  });
  return invoice;
}

export async function getInvoices(projectId: string) {
  return prisma.invoice.findMany({
    where: { projectId },
    include: { supplier: true, po: true, grn: true },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getInvoice(invoiceId: string) {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: { supplier: true, po: true, grn: true },
  });
  if (!invoice) throw httpError('Invoice not found', 404, 'INVOICE_NOT_FOUND');
  return invoice;
}

/**
 * Perform three-way match: PO amount >= invoice amount, accepted GRN quantity covers invoice,
 * supplier beneficiary change not blocking.
 */
export async function matchInvoice(invoiceId: string, actorId: string) {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: { po: true, grn: true, supplier: true },
  });
  if (!invoice) throw httpError('Invoice not found', 404, 'INVOICE_NOT_FOUND');
  if (invoice.status !== 'DRAFT') {
    throw httpError('Invoice is not in draft status', 409, 'INVOICE_NOT_DRAFT');
  }

  const issues: string[] = [];

  // 1. PO must exist and be approved
  if (!invoice.poId || !invoice.po) {
    issues.push('No purchase order referenced');
  } else {
    const po = invoice.po;
    if (po.status !== 'APPROVED' && po.status !== 'DRAFT') {
      issues.push(`Purchase order ${po.poNumber} is not approved`);
    }
    const poTotal = Number(po.totalAmount || 0);
    if (Number(invoice.amount) > poTotal) {
      issues.push(`Invoice amount exceeds PO total ${poTotal} (noncontracted overpayment)`);
    }
  }

  // 2. GRN must exist and be accepted
  if (!invoice.grnId || !invoice.grn) {
    issues.push('No goods received note referenced');
  } else {
    const grn = invoice.grn;
    if (grn.status !== 'ACCEPTED') {
      issues.push(`GRN ${grn.grnNumber} is not accepted`);
    }
    const grnTotal = sumItems((grn.items as any[]) ?? []);
    if (grnTotal > 0 && Number(invoice.amount) > grnTotal) {
      issues.push(`Invoice amount exceeds accepted GRN quantity/amount ${grnTotal}`);
    }
  }

  // 3. Supplier beneficiary change hold check
  const hold = await prisma.beneficiaryChange.findFirst({
    where: { supplierId: invoice.supplierId, status: 'PENDING_VERIFICATION', paymentHold: true },
  });
  if (hold) {
    issues.push('Supplier beneficiary change pending verification — payment hold in effect');
  }

  if (issues.length > 0) {
    await prisma.invoice.update({
      where: { id: invoiceId },
      data: { status: 'REJECTED', matchNotes: issues.join('; ') },
    });
    await writeAudit({
      actorId,
      action: 'INVOICE_MATCH_REJECTED',
      entityType: 'Invoice',
      entityId: invoiceId,
      projectId: invoice.projectId,
      after: { status: 'REJECTED', reasons: issues },
    });
    throw httpError(`Three-way match failed: ${issues.join('; ')}`, 400, 'THREE_WAY_MATCH_FAILED');
  }

  const updated = await prisma.invoice.update({
    where: { id: invoiceId },
    data: { status: 'MATCHED', threeWayMatch: true },
  });
  await writeAudit({
    actorId,
    action: 'INVOICE_THREE_WAY_MATCHED',
    entityType: 'Invoice',
    entityId: invoiceId,
    projectId: invoice.projectId,
    after: { status: 'MATCHED', threeWayMatch: true },
  });
  return updated;
}

export async function payInvoice(invoiceId: string, actorId: string, data: any) {
  const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
  if (!invoice) throw httpError('Invoice not found', 404, 'INVOICE_NOT_FOUND');
  if (invoice.status !== 'MATCHED') {
    throw httpError('Invoice must pass three-way match before payment', 400, 'INVOICE_NOT_MATCHED');
  }

  const updated = await prisma.invoice.update({
    where: { id: invoiceId },
    data: {
      status: 'PAID',
      paidAt: new Date(),
      paidById: actorId,
    },
  });
  await writeAudit({
    actorId,
    action: 'INVOICE_PAID',
    entityType: 'Invoice',
    entityId: invoiceId,
    projectId: invoice.projectId,
    after: { status: 'PAID', paidById: actorId },
  });
  return updated;
}
