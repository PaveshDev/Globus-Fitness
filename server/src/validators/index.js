import { httpError } from '../utils/index.js'

export function normalizePhone(value) {
  if (typeof value !== 'string' || !/^[+\d\s()-]{9,25}$/.test(value)) return ''
  let digits = value.replace(/\D/g, '')
  if (digits.startsWith('0')) digits = `94${digits.slice(1)}`
  else if (digits.length === 9) digits = `94${digits}`
  return /^94[1-9]\d{8}$/.test(digits) ? digits : ''
}

export function registration(body = {}) {
  const name = typeof body.name === 'string' ? body.name.trim() : ''
  const phone = normalizePhone(body.phone)
  const nic = typeof body.nic === 'string' ? body.nic.trim().toUpperCase() : ''
  const password = typeof body.password === 'string' ? body.password : ''
  const fields = {}
  if (name.length < 2 || name.length > 120) fields.name = 'Enter a name between 2 and 120 characters.'
  if (!phone) fields.phone = 'Enter a valid Sri Lankan phone number.'
  if (!/^(?:\d{9}[VX]|\d{12})$/.test(nic)) fields.nic = 'Enter a valid NIC number.'
  if (password.length < 8 || password.length > 128 || !/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password)) {
    fields.password = 'Use 8–128 characters with uppercase, lowercase, and a number.'
  }
  if (Object.keys(fields).length) throw httpError(400, 'Please check your registration details.', fields)
  return { name, phone, nic, password }
}

export function checkoutInput(body = {}) {
  const fields = {}
  const limits = { planId: 50, billingName: 120, billingEmail: 254, billingAddress: 250, billingCity: 100 }
  const result = {}
  for (const [key, max] of Object.entries(limits)) {
    result[key] = typeof body[key] === 'string' ? body[key].trim() : ''
    if (!result[key] || result[key].length > max) fields[key] = `Required; maximum ${max} characters.`
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(result.billingEmail)) fields.billingEmail = 'Enter a valid email address.'
  if (!isUuid(body.idempotencyKey)) fields.idempotencyKey = 'A valid checkout request ID is required.'
  if (Object.keys(fields).length) throw httpError(400, 'Please check your billing details.', fields)
  return { ...result, idempotencyKey: body.idempotencyKey }
}

export const isUuid = (value) => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)

