import jwt from 'jsonwebtoken'
import { db } from '../config/database.js'
import { env } from '../config/env.js'
import { httpError, userSelect } from '../utils/index.js'
import { cookieName } from '../services/authService.js'

export async function requireAuth(req, _res, next) {
  const value = req.headers.cookie?.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${cookieName}=`))
  let payload
  try {
    payload = jwt.verify(value?.slice(cookieName.length + 1) || '', env.jwtSecret, {
      algorithms: ['HS256'], issuer: 'globus-fitness', audience: 'globus-members',
    })
  } catch {
    throw httpError(401, 'Please log in to continue.')
  }
  const session = await db.session.findUnique({ where: { id: payload.jti }, include: { user: { select: userSelect } } })
  if (!session || session.userId !== payload.sub || session.expiresAt <= new Date()) throw httpError(401, 'Your session has expired. Please log in again.')
  req.user = session.user
  req.sessionId = session.id
  next()
}

