import { createHash, timingSafeEqual } from 'node:crypto'
import { db } from '../config/database.js'
import { env } from '../config/env.js'
import { httpError } from '../utils/index.js'
import { checkoutInput, isUuid } from '../validators/index.js'
import { enforceAdmission, serializable } from './admissionService.js'

const md5 = (value) => createHash('md5').update(value).digest('hex').toUpperCase()
export const amountText = (amountMinor) => (amountMinor / 100).toFixed(2)
export const checkoutHash = (merchantId, orderId, amount, currency, secret) => md5(merchantId + orderId + amount + currency + md5(secret))
export const notificationHash = (body, secret) => md5(body.merchant_id + body.order_id + body.payhere_amount + body.payhere_currency + body.status_code + md5(secret))

export function gatewayReady() {
  const config = env.payhere
  try {
    const callback = new URL(config.publicApiUrl)
    const client = new URL(env.clientOrigin)
    return Boolean(config.merchantId && config.merchantSecret && callback.protocol === 'https:' && !['localhost', '127.0.0.1', '[::1]'].includes(callback.hostname) && (config.sandbox || client.protocol === 'https:'))
  } catch { return false }
}

export async function createCheckout(user, body) {
  if (!gatewayReady()) throw httpError(503, 'Online payments are not available yet. Please contact the gym.')
  const input = checkoutInput(body)
  const plan = await db.plan.findUnique({ where: { id: input.planId } })
  if (!plan?.active) throw httpError(400, 'This payment option is unavailable.')
  const values = {
    ...input, userId: user.id, description: plan.title, amountMinor: plan.amountMinor,
    currency: plan.currency, sandbox: env.payhere.sandbox,
  }
  let payment = await db.payment.findUnique({ where: { idempotencyKey: input.idempotencyKey } })
  if (!payment) {
    try {
      payment = await serializable(async (tx) => {
        await enforceAdmission(user.id, input.planId, tx)
        return tx.payment.create({ data: values })
      })
    }
    catch (error) {
      if (error.code !== 'P2002') throw error
      payment = await db.payment.findUnique({ where: { idempotencyKey: input.idempotencyKey } })
    }
  }
  if (!payment || payment.userId !== user.id || payment.planId !== input.planId || payment.status !== 'PENDING' || payment.sandbox !== env.payhere.sandbox ||
    ['billingName', 'billingEmail', 'billingAddress', 'billingCity'].some((field) => payment[field] !== input[field])) {
    throw httpError(409, 'This checkout request has already been used. Refresh the page to start another payment.')
  }
  // Recheck when resuming an old checkout: admission may have been charged back meanwhile.
  await enforceAdmission(user.id, input.planId)
  const amount = amountText(payment.amountMinor)
  const names = payment.billingName.split(/\s+/)
  const returnUrl = new URL('/member/payments', env.clientOrigin)
  returnUrl.searchParams.set('order', payment.id)
  const cancelUrl = new URL(returnUrl)
  cancelUrl.searchParams.set('checkout', 'cancelled')
  return {
    paymentId: payment.id,
    action: env.payhere.sandbox ? 'https://sandbox.payhere.lk/pay/checkout' : 'https://www.payhere.lk/pay/checkout',
    fields: {
      merchant_id: env.payhere.merchantId, return_url: returnUrl.toString(), cancel_url: cancelUrl.toString(),
      notify_url: `${env.payhere.publicApiUrl.replace(/\/$/, '')}/api/payments/payhere/notify`,
      order_id: payment.id, items: payment.description, currency: payment.currency, amount,
      first_name: names[0], last_name: names.slice(1).join(' ') || names[0], email: payment.billingEmail,
      phone: user.phone, address: payment.billingAddress, city: payment.billingCity, country: 'Sri Lanka',
      hash: checkoutHash(env.payhere.merchantId, payment.id, amount, payment.currency, env.payhere.merchantSecret),
    },
  }
}

export async function acceptNotification(body = {}) {
  if (!env.payhere.merchantId || !env.payhere.merchantSecret) throw httpError(503, 'Payment notifications are unavailable.')
  const required = ['merchant_id', 'order_id', 'payment_id', 'payhere_amount', 'payhere_currency', 'status_code', 'md5sig']
  if (required.some((key) => typeof body[key] !== 'string' || !body[key] || body[key].length > 200) || !isUuid(body.order_id) || !/^[a-f0-9]{32}$/i.test(body.md5sig)) {
    throw httpError(400, 'Invalid payment notification.')
  }
  const expected = notificationHash(body, env.payhere.merchantSecret)
  if (body.merchant_id !== env.payhere.merchantId || !timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(body.md5sig, 'hex'))) {
    throw httpError(400, 'Invalid payment signature.')
  }
  const status = { '2': 'PAID', '0': 'PENDING', '-1': 'CANCELLED', '-2': 'FAILED', '-3': 'CHARGEDBACK' }[body.status_code]
  if (!status || !/^\d+\.\d{2}$/.test(body.payhere_amount)) throw httpError(400, 'Invalid payment status or amount.')
  const payment = await db.payment.findUnique({ where: { id: body.order_id } })
  if (!payment || body.payhere_amount !== amountText(payment.amountMinor) || body.payhere_currency !== payment.currency || payment.sandbox !== env.payhere.sandbox) {
    throw httpError(400, 'Payment details do not match the order.')
  }
  if (payment.providerPaymentId && payment.providerPaymentId !== body.payment_id) throw httpError(409, 'Payment reference does not match.')
  // Atomic conditional updates handle duplicate and out-of-order callbacks without downgrading paid records.
  const previous = status === 'CHARGEDBACK' ? ['PENDING', 'PAID', 'FAILED', 'CANCELLED'] : status === 'PAID' ? ['PENDING', 'FAILED', 'CANCELLED'] : ['PENDING']
  await db.payment.updateMany({
    where: { id: payment.id, status: { in: previous }, OR: [{ providerPaymentId: null }, { providerPaymentId: body.payment_id }] },
    data: { status, providerPaymentId: body.payment_id, ...(status === 'PAID' ? { paidAt: new Date() } : {}) },
  })
}

export async function listPayments(userId, requestedPage = '1') {
  const page = Math.max(1, Math.min(10000, Number.parseInt(requestedPage, 10) || 1))
  const where = userId ? { userId } : {}
  const [payments, total] = await db.$transaction([
    db.payment.findMany({ where, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], skip: (page - 1) * 20, take: 20,
      select: { id: true, description: true, amountMinor: true, currency: true, status: true, sandbox: true, providerPaymentId: true, createdAt: true, paidAt: true,
        ...(!userId ? { user: { select: { name: true, phone: true } } } : {}) } }),
    db.payment.count({ where }),
  ])
  return { payments, page, total, totalPages: Math.ceil(total / 20) }
}

