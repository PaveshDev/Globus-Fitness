import { Router } from 'express'
import { requireAuth } from '../middleware/authMiddleware.js'

const router = Router()

router.get('/me', requireAuth, (req, res) => res.set('Cache-Control', 'no-store').json({ user: req.user }))

export default router

