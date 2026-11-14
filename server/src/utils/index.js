import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'

const scrypt = promisify(scryptCallback)

export function httpError(status, message, fields) {
  return Object.assign(new Error(message), { status, fields })
}

export async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex')
  const hash = await scrypt(password, salt, 64)
  return `scrypt:${salt}:${hash.toString('hex')}`
}

export async function verifyPassword(password, stored) {
  const [, salt, hash] = stored.split(':')
  const actual = await scrypt(password, salt, 64)
  return timingSafeEqual(actual, Buffer.from(hash, 'hex'))
}

export const userSelect = { id: true, name: true, phone: true, nic: true, role: true, createdAt: true }

