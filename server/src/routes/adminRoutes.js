import crypto from 'node:crypto'
import { Router } from 'express'
import { db } from '../config/database.js'
import { env } from '../config/env.js'
import { requireAuth } from '../middleware/authMiddleware.js'
import { requireAdmin } from '../middleware/roleMiddleware.js'
import { listPayments } from '../services/paymentService.js'
import { userSelect, httpError } from '../utils/index.js'
import { listAdmissions, confirmAdmissionNotification } from '../services/admissionService.js'

const router = Router()

router.use(requireAuth, requireAdmin)
router.use((_req, res, next) => { res.setHeader('Cache-Control', 'no-store'); next() })
router.get('/payments', async (req, res) => res.json(await listPayments(null, req.query.page)))
router.get('/admissions', async (req, res) => res.json(await listAdmissions(req.query.page)))
router.post('/admissions/:paymentId/confirm-notification', async (req, res) => {
  const approval = await confirmAdmissionNotification(req.params.paymentId, req.user.id, req.body?.notified)
  res.json({ approval })
})
router.post('/members/:userId/admit', async (req, res) => {
  const user = await db.user.findUnique({ where: { id: req.params.userId } })
  if (!user) throw httpError(404, 'Member not found.')

  const existing = await db.payment.findFirst({
    where: { userId: user.id, planId: 'admission', status: 'PAID', sandbox: env.payhere.sandbox },
  })
  let paymentId = existing?.id
  if (!paymentId) {
    const payment = await db.payment.create({
      data: {
        userId: user.id,
        planId: 'admission',
        description: 'Admission fee (Bank Transfer / Admin Confirmed)',
        amountMinor: 250000,
        currency: 'LKR',
        status: 'PAID',
        provider: 'ADMIN_MANUAL',
        sandbox: env.payhere.sandbox,
        idempotencyKey: crypto.randomUUID(),
        billingName: user.name,
        billingEmail: `${user.phone}@globusfitness.local`,
        billingAddress: 'Admin Manual Confirmation',
        billingCity: 'Colombo',
        paidAt: new Date(),
      },
    })
    paymentId = payment.id
  }

  const approval = await db.admissionApproval.upsert({
    where: { paymentId },
    create: { paymentId, notifiedById: req.user.id },
    update: {},
    select: { paymentId: true, notifiedAt: true },
  })

  res.json({ approval })
})
router.get('/members', async (req, res) => {
  const page = Math.max(1, Math.min(10000, Number.parseInt(req.query.page, 10) || 1))
  const [members, total] = await db.$transaction([
    db.user.findMany({
      select: {
        ...userSelect,
        payments: {
          where: { planId: 'admission', status: 'PAID', sandbox: env.payhere.sandbox },
          select: { id: true, admissionApproval: { select: { notifiedAt: true } } },
          take: 1,
        },
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      skip: (page - 1) * 20,
      take: 20,
    }),
    db.user.count(),
  ])
  const formattedMembers = members.map((m) => {
    const payment = m.payments?.[0]
    const admissionStatus = payment?.admissionApproval ? 'APPROVED' : payment ? 'AWAITING_ADMIN' : 'PAYMENT_REQUIRED'
    return {
      id: m.id,
      name: m.name,
      phone: m.phone,
      nic: m.nic,
      role: m.role,
      createdAt: m.createdAt,
      admissionStatus,
      admissionPaymentId: payment?.id || null,
    }
  })
  res.json({ members: formattedMembers, total, page, totalPages: Math.ceil(total / 20) })
})

export default router

