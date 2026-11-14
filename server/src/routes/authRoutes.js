import { Router } from 'express'
import { register, login, cookieName, cookieOptions } from '../services/authService.js'
import { requireAuth } from '../middleware/authMiddleware.js'
import { rateLimit } from '../middleware/security.js'
import { db } from '../config/database.js'

const router = Router()

const authLimit = rateLimit()
router.use((_req, res, next) => { res.setHeader('Cache-Control', 'no-store'); next() })
router.post('/register', authLimit, async (req, res) => res.status(201).json({ user: await register(req.body, res) }))
router.post('/login', authLimit, async (req, res) => res.json({ user: await login(req.body, res) }))
router.get('/me', requireAuth, (req, res) => res.json({ user: req.user }))
router.post('/logout', requireAuth, async (req, res) => {
  await db.session.deleteMany({ where: { id: req.sessionId } })
  res.clearCookie(cookieName, cookieOptions).sendStatus(204)
})

export default router

