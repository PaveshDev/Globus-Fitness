import crypto from 'node:crypto'
import { Router } from 'express'
import express from 'express'
import { db } from '../config/database.js'
import { env } from '../config/env.js'
import { requireAuth } from '../middleware/authMiddleware.js'
import { rateLimit } from '../middleware/security.js'
import { createCheckout, acceptNotification, listPayments, gatewayReady } from '../services/paymentService.js'
import { admissionStatus, enforceAdmission } from '../services/admissionService.js'
import { httpError } from '../utils/index.js'

const router = Router()

router.get('/options', requireAuth, async (req, res) => {
  const admission = await admissionStatus(req.user.id)
  const plans = await db.plan.findMany({ where: { active: true, ...(admission.status === 'APPROVED' ? { id: { not: 'admission' } } : { id: 'admission' }) }, orderBy: [{ months: 'asc' }, { id: 'asc' }] })
  res.set('Cache-Control', 'no-store').json({ plans: admission.status === 'AWAITING_ADMIN' ? [] : plans, admission, gateway: { provider: 'PayHere', ready: gatewayReady(), sandbox: env.payhere.sandbox } })
})
router.post('/payhere/notify', express.urlencoded({ extended: false, limit: '16kb' }), async (req, res) => {
  await acceptNotification(req.body)
  res.status(200).send('OK')
})
router.use(requireAuth)
router.use((_req, res, next) => { res.setHeader('Cache-Control', 'no-store'); next() })
router.get('/', async (req, res) => res.json(await listPayments(req.user.id, req.query.page)))
router.post('/checkout', rateLimit(30), async (req, res) => res.status(201).json(await createCheckout(req.user, req.body)))
router.post('/bank-transfer', rateLimit(30), async (req, res) => {
  const planId = req.body?.planId || 'admission'
  const plan = await db.plan.findUnique({ where: { id: planId } })
  if (!plan?.active) throw httpError(400, 'This payment option is unavailable.')
  await enforceAdmission(req.user.id, planId)

  const payment = await db.payment.create({
    data: {
      userId: req.user.id,
      planId: plan.id,
      description: `${plan.title} (Bank Transfer)`,
      amountMinor: plan.amountMinor,
      currency: plan.currency,
      status: 'PAID',
      provider: 'BANK_TRANSFER',
      sandbox: env.payhere.sandbox,
      idempotencyKey: crypto.randomUUID(),
      billingName: req.user.name,
      billingEmail: `${req.user.phone}@globusfitness.local`,
      billingAddress: req.body?.reference || 'Direct Bank Transfer / Deposit',
      billingCity: 'Colombo',
      paidAt: new Date(),
    },
  })
  res.status(201).json({ payment })
})

export default router

