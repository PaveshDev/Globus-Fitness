import { db } from '../config/database.js'
import { env } from '../config/env.js'
import { httpError } from '../utils/index.js'
import { isUuid } from '../validators/index.js'

export async function admissionStatus(userId, client = db) {
  const where = { userId, planId: 'admission', status: 'PAID', sandbox: env.payhere.sandbox }
  const select = { id: true, paidAt: true, admissionApproval: { select: { notifiedAt: true } } }
  const approved = await client.payment.findFirst({ where: { ...where, admissionApproval: { isNot: null } }, select })
  const paid = approved || await client.payment.findFirst({ where, select, orderBy: { paidAt: 'desc' } })
  return {
    status: approved ? 'APPROVED' : paid ? 'AWAITING_ADMIN' : 'PAYMENT_REQUIRED',
    paymentId: paid?.id || null,
    paidAt: paid?.paidAt || null,
    notifiedAt: paid?.admissionApproval?.notifiedAt || null,
    sandbox: env.payhere.sandbox,
  }
}

export async function enforceAdmission(userId, planId, client = db) {
  const admission = await admissionStatus(userId, client)
  if (planId === 'admission' && admission.status !== 'PAYMENT_REQUIRED') {
    throw httpError(409, 'Your admission is already paid. Please wait for the admin confirmation instead of paying again.')
  }
  if (planId !== 'admission' && admission.status !== 'APPROVED') {
    throw httpError(403, admission.status === 'AWAITING_ADMIN'
      ? 'Your admission is paid. Membership payments unlock after the admin sends your WhatsApp confirmation.'
      : 'Pay your admission fee first. Membership payments unlock after the admin sends your WhatsApp confirmation.')
  }
}

export async function serializable(operation) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try { return await db.$transaction(operation, { isolationLevel: 'Serializable', timeout: 15_000 }) }
    catch (error) { if (error.code !== 'P2034' || attempt === 2) throw error }
  }
}

export async function confirmAdmissionNotification(paymentId, adminId, notified) {
  if (!isUuid(paymentId) || notified !== true) throw httpError(400, 'Confirm that you sent the WhatsApp notification before unlocking membership payments.')
  return serializable(async (tx) => {
    const payment = await tx.payment.findUnique({ where: { id: paymentId } })
    if (!payment || payment.planId !== 'admission' || payment.status !== 'PAID' || payment.sandbox !== env.payhere.sandbox) {
      throw httpError(409, 'Only a successfully paid admission in the current payment environment can be approved.')
    }
    return tx.admissionApproval.upsert({
      where: { paymentId }, create: { paymentId, notifiedById: adminId }, update: {},
      select: { paymentId: true, notifiedAt: true },
    })
  })
}

export async function listAdmissions(requestedPage = '1') {
  const page = Math.max(1, Math.min(10000, Number.parseInt(requestedPage, 10) || 1))
  const where = { planId: 'admission', status: 'PAID', sandbox: env.payhere.sandbox }
  const [admissions, total] = await db.$transaction([
    db.payment.findMany({ where, orderBy: [{ paidAt: 'desc' }, { id: 'desc' }], skip: (page - 1) * 20, take: 20,
      select: { id: true, amountMinor: true, sandbox: true, paidAt: true,
        user: { select: { name: true, phone: true } },
        admissionApproval: { select: { notifiedAt: true, notifiedBy: { select: { name: true } } } },
      },
    }),
    db.payment.count({ where }),
  ])
  return { admissions, total, page, totalPages: Math.ceil(total / 20), sandbox: env.payhere.sandbox }
}
