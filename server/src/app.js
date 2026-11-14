import express from 'express'
import cors from 'cors'
import { env } from './config/env.js'
import authRoutes from './routes/authRoutes.js'
import memberRoutes from './routes/memberRoutes.js'
import adminRoutes from './routes/adminRoutes.js'
import paymentRoutes from './routes/paymentRoutes.js'
import contactRoutes from './routes/contactRoutes.js'
import { notFound } from './middleware/notFound.js'
import { errorHandler } from './middleware/errorHandler.js'
import imageRoutes from './routes/imageRoutes.js'
import { security } from './middleware/security.js'
import { db } from './config/database.js'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const app = express()

app.disable('x-powered-by')
app.use(cors({ origin: env.clientOrigin, credentials: true }))
app.use(security)
app.use(express.json({ limit: '100kb' }))

// Keep liveness separate so database outages do not cause restart loops.
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'globus-fitness-api' })
})

app.get('/api/ready', async (_req, res) => {
  await db.$queryRaw`SELECT 1`
  res.set('Cache-Control', 'no-store').json({ status: 'ok', database: 'connected' })
})
app.use('/api/images', imageRoutes)
app.use('/api/auth', authRoutes)
app.use('/api/members', memberRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/payments', paymentRoutes)
app.use('/api/contact', contactRoutes)

const clientDist = fileURLToPath(new URL('../../client/dist/', import.meta.url))
if (env.production && existsSync(clientDist)) {
  app.use(express.static(clientDist))
  app.get('/{*path}', (req, res, next) => {
    if (req.path.startsWith('/api/') || req.path === '/api') return next()
    res.sendFile(`${clientDist}/index.html`)
  })
}

app.use(notFound)
app.use(errorHandler)

export default app

