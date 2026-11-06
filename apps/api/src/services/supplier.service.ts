// src/services/supplier.service.ts
// Supplier master data, beneficiary-change control with automatic payment hold
// (UAT-14, MAST-UAT-16: supplier bank/M-Pesa change holds affected payments).
import { prisma } from '../db/client.js';
import { httpError } from '../middleware/errorHandler.js';
import { writeAudit } from './audit.service.js';

export async function createSupplier(data: any) {
  const supplier = await prisma.supplier.create({
    data: {
      name: data.name,
      contactPerson: data.contactPerson,
      phone: data.phone,
      email: data.email,
      bankAccount: data.bankAccount,
      mpesaNumber: data.mpesaNumber,
      trustedContact: data.trustedContact,
      trustedContactPhone: data.trustedContactPhone,
      isActive: data.isActive !== false,
    },
  });
  await writeAudit({
    actorId: data.actorId,
    action: 'SUPPLIER_CREATED',
    entityType: 'Supplier',
    entityId: supplier.id,
    projectId: data.projectId,
    after: { name: supplier.name },
  });
  return supplier;
}

export async function getSuppliers() {
  return prisma.supplier.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } });
}

export async function getSupplier(supplierId: string) {
  const s = await prisma.supplier.findUnique({ where: { id: supplierId } });
  if (!s) throw httpError('Supplier not found', 404, 'SUPPLIER_NOT_FOUND');
  return s;
}

/**
 * Request a beneficiary (bank/M-Pesa) change for a supplier.
 * Automatically places a payment hold on affected pending payments
 * until out-of-band trusted-contact verification and reauthorization.
 */
export async function requestBeneficiaryChange(supplierId: string, requestedById: string, data: any) {
  const supplier = await prisma.supplier.findUnique({ where: { id: supplierId } });
  if (!supplier) throw httpError('Supplier not found', 404, 'SUPPLIER_NOT_FOUND');

  const change = await prisma.beneficiaryChange.create({
    data: {
      supplierId,
      projectId: data.projectId,
      oldBankAccount: supplier.bankAccount,
      oldMpesaNumber: supplier.mpesaNumber,
      newBankAccount: data.newBankAccount,
      newMpesaNumber: data.newMpesaNumber,
      status: 'PENDING_VERIFICATION',
      verificationContact: data.trustedContact || supplier.trustedContact,
      paymentHold: true, // automatic hold on affected payments
      reason: data.reason,
    },
  });
  await writeAudit({
    actorId: requestedById,
    action: 'SUPPLIER_BENEFICIARY_CHANGE_REQUESTED',
    entityType: 'BeneficiaryChange',
    entityId: change.id,
    projectId: data.projectId,
    after: { supplierId, newBankAccount: data.newBankAccount, paymentHold: true },
  });
  return change;
}

/**
 * Verify a beneficiary change via out-of-band trusted-contact verification.
 * Only clears the payment hold after successful verification.
 */
export async function verifyBeneficiaryChange(changeId: string, verifiedById: string, data: any) {
  const change = await prisma.beneficiaryChange.findUnique({ where: { id: changeId } });
  if (!change) throw httpError('Beneficiary change not found', 404, 'BENEFICIARY_CHANGE_NOT_FOUND');
  if (change.status !== 'PENDING_VERIFICATION') {
    throw httpError('Beneficiary change is not pending verification', 409, 'BENEFICIARY_CHANGE_NOT_PENDING');
  }

  // Apply the change to the supplier record
  const supplier = await prisma.supplier.update({
    where: { id: change.supplierId },
    data: {
      ...(change.newBankAccount ? { bankAccount: change.newBankAccount } : {}),
      ...(change.newMpesaNumber ? { mpesaNumber: change.newMpesaNumber } : {}),
      ...(data.trustedContact ? { trustedContact: data.trustedContact } : {}),
      ...(data.trustedContactPhone ? { trustedContactPhone: data.trustedContactPhone } : {}),
    },
  });

  const updated = await prisma.beneficiaryChange.update({
    where: { id: changeId },
    data: {
      status: 'VERIFIED',
      verifiedById,
      verifiedAt: new Date(),
      verificationContact: data.verificationContact,
      paymentHold: false, // hold cleared after verification
    },
  });

  await writeAudit({
    actorId: verifiedById,
    action: 'SUPPLIER_BENEFICIARY_CHANGE_VERIFIED',
    entityType: 'BeneficiaryChange',
    entityId: changeId,
    projectId: change.projectId ?? undefined,
    after: { status: 'VERIFIED', paymentHold: false },
  });
  return { supplier, change: updated };
}

/**
 * Reject a beneficiary change. Payment hold remains in effect.
 */
export async function rejectBeneficiaryChange(changeId: string, rejectedById: string, data: any) {
  const change = await prisma.beneficiaryChange.findUnique({ where: { id: changeId } });
  if (!change) throw httpError('Beneficiary change not found', 404, 'BENEFICIARY_CHANGE_NOT_FOUND');
  if (change.status !== 'PENDING_VERIFICATION') {
    throw httpError('Beneficiary change is not pending verification', 409, 'BENEFICIARY_CHANGE_NOT_PENDING');
  }

  const updated = await prisma.beneficiaryChange.update({
    where: { id: changeId },
    data: {
      status: 'REJECTED',
      verifiedById: rejectedById,
      verifiedAt: new Date(),
    },
  });

  await writeAudit({
    actorId: rejectedById,
    action: 'SUPPLIER_BENEFICIARY_CHANGE_REJECTED',
    entityType: 'BeneficiaryChange',
    entityId: changeId,
    projectId: change.projectId ?? undefined,
    after: { status: 'REJECTED', paymentHold: change.paymentHold, rejectionReason: data.rejectionReason },
  });
  return updated;
}

/**
 * Check whether a supplier has any pending/unverified beneficiary change that
 * should hold payments. Returns the active change if so.
 */
export async function getActiveBeneficiaryHold(supplierId: string) {
  return prisma.beneficiaryChange.findFirst({
    where: { supplierId, status: 'PENDING_VERIFICATION', paymentHold: true },
    orderBy: { createdAt: 'desc' },
  });
}
