import { Router } from 'express'
import { db } from '../config/database.js'
import { requireAuth } from '../middleware/authMiddleware.js'
import { requireAdmin } from '../middleware/roleMiddleware.js'
import { listPayments } from '../services/paymentService.js'
import { userSelect } from '../utils/index.js'
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
router.get('/members', async (req, res) => {
  const page = Math.max(1, Math.min(10000, Number.parseInt(req.query.page, 10) || 1))
  const [members, total] = await db.$transaction([
    db.user.findMany({ select: userSelect, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], skip: (page - 1) * 20, take: 20 }),
    db.user.count(),
  ])
  res.json({ members, total, page, totalPages: Math.ceil(total / 20) })
})

export default router

