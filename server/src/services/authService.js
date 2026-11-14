import jwt from 'jsonwebtoken'
import { db } from '../config/database.js'
import { env } from '../config/env.js'
import { hashPassword, verifyPassword, httpError, userSelect } from '../utils/index.js'
import { normalizePhone, registration } from '../validators/index.js'

export const cookieName = 'globus_session'
export const cookieOptions = { httpOnly: true, secure: env.production, sameSite: 'lax', path: '/api' }

async function startSession(user, res) {
  const expiresAt = new Date(Date.now() + 86_400_000)
  const session = await db.session.create({ data: { userId: user.id, expiresAt } })
  const token = jwt.sign({}, env.jwtSecret, {
    subject: user.id, jwtid: session.id, expiresIn: '1d', algorithm: 'HS256', issuer: 'globus-fitness', audience: 'globus-members',
  })
  res.cookie(cookieName, token, { ...cookieOptions, expires: expiresAt })
}

export async function register(body, res) {
  const { password, ...data } = registration(body)
  const passwordHash = await hashPassword(password)
  const user = await db.user.create({ data: { ...data, passwordHash }, select: userSelect })
  await startSession(user, res)
  return user
}

// Equal-cost verification when the phone is not found avoids a fast account-existence signal.
const dummyHash = await hashPassword('Unused-login-comparison-1')

export async function login(body, res) {
  const phone = normalizePhone(body?.phone)
  if (!phone || typeof body?.password !== 'string' || body.password.length > 128) {
    throw httpError(400, 'Enter your phone number and password.')
  }
  const user = await db.user.findUnique({ where: { phone } })
  const matches = await verifyPassword(body.password, user?.passwordHash || dummyHash)
  if (!user || !matches) throw httpError(401, 'Phone number or password is incorrect.')
  await startSession(user, res)
  return Object.fromEntries(Object.keys(userSelect).map((key) => [key, user[key]]))
}

