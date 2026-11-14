import test from 'node:test'
import assert from 'node:assert/strict'
import { createHash, randomInt, randomUUID } from 'node:crypto'
import { once } from 'node:events'
import app from '../../src/app.js'
import { db } from '../../src/config/database.js'
import { env } from '../../src/config/env.js'

test('admission must be paid and explicitly confirmed by an admin before membership checkout', async (t) => {
  const server = app.listen(0, '127.0.0.1')
  await once(server, 'listening')
  const base = `http://127.0.0.1:${server.address().port}/api`
  const users = []
  const originalGateway = { ...env.payhere }
  Object.assign(env.payhere, { merchantId: 'admission-test', merchantSecret: randomUUID(), sandbox: true, publicApiUrl: 'https://admission.example.invalid' })
  let member, admin, other, admissionId, monthlyId
  const billing = { billingName: 'Admission Test Member', billingEmail: 'admission@example.invalid', billingAddress: 'Test address', billingCity: 'Colombo' }
  async function request(path, session, body) {
    const response = await fetch(base + path, {
      method: body ? 'POST' : 'GET', headers: { 'X-Requested-With': 'GlobusFitness', ...(session ? { Cookie: session.cookie } : {}), ...(body ? { 'Content-Type': 'application/json' } : {}) },
      ...(body ? { body: JSON.stringify(body) } : {}),
    })
    return { status: response.status, data: await response.json().catch(() => null) }
  }
  async function register(index) {
    const suffix = String(randomInt(1000000, 9999999))
    const result = await fetch(base + '/auth/register', { method: 'POST', headers: { 'X-Requested-With': 'GlobusFitness', 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: `Admission Test ${index}`, phone: `079${suffix}`, nic: `9999${index}${suffix}`, password: 'AdmissionTest123' }),
    })
    assert.equal(result.status, 201)
    const { user } = await result.json()
    users.push(user.id)
    return { ...user, cookie: result.headers.get('set-cookie').split(';')[0] }
  }
  const checkout = (planId, session = member, extras = {}) => request('/payments/checkout', session, { ...billing, planId, idempotencyKey: randomUUID(), ...extras })
  async function notify(paymentId, status, reference = paymentId) {
    const payment = await db.payment.findUnique({ where: { id: paymentId } })
    const body = { merchant_id: env.payhere.merchantId, order_id: paymentId, payment_id: `test-${reference}`, payhere_amount: (payment.amountMinor / 100).toFixed(2), payhere_currency: 'LKR', status_code: status }
    const md5 = (value) => createHash('md5').update(value).digest('hex').toUpperCase()
    body.md5sig = md5(body.merchant_id + body.order_id + body.payhere_amount + body.payhere_currency + body.status_code + md5(env.payhere.merchantSecret))
    return fetch(base + '/payments/payhere/notify', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(body) })
  }
  try {
    member = await register(1)
    admin = await register(2)
    other = await register(3)
    await db.user.update({ where: { id: admin.id }, data: { role: 'ADMIN' } })
    await t.test('new members only see admission and cannot bypass the rule with forged plan/approval data', async () => {
      assert.equal((await request('/payments/options')).status, 401)
      const options = await request('/payments/options', member)
      assert.equal(options.data.admission.status, 'PAYMENT_REQUIRED')
      assert.deepEqual(options.data.plans.map((plan) => plan.id), ['admission'])
      for (const plan of ['monthly', 'quarterly', 'half-year', 'annual']) {
        assert.equal((await checkout(plan, member, { admissionApproved: true, admissionStatus: 'APPROVED' })).status, 403)
      }
      assert.equal(await db.payment.count({ where: { userId: member.id } }), 0)
      const result = await checkout('admission')
      assert.equal(result.status, 201)
      admissionId = result.data.paymentId
      assert.equal(result.data.fields.amount, '2500.00')
    })
    await t.test('pending, failed, and cancelled admissions cannot be approved or unlock plans', async () => {
      const path = `/admin/admissions/${admissionId}/confirm-notification`
      assert.equal((await request(path, admin, { notified: true })).status, 409)
      await notify(admissionId, '-2')
      assert.equal((await checkout('monthly')).status, 403)
      assert.equal((await request(path, admin, { notified: true })).status, 409)
      const cancelled = await checkout('admission')
      assert.equal(cancelled.status, 201)
      await notify(cancelled.data.paymentId, '-1')
      assert.equal((await checkout('annual')).status, 403)
      assert.equal((await request(`/admin/admissions/${cancelled.data.paymentId}/confirm-notification`, admin, { notified: true })).status, 409)
    })
    await t.test('verified admission waits for admin WhatsApp confirmation and prevents a second admission charge', async () => {
      assert.equal((await notify(admissionId, '2')).status, 200)
      const options = await request('/payments/options', member)
      assert.equal(options.data.admission.status, 'AWAITING_ADMIN')
      assert.deepEqual(options.data.plans, [])
      assert.equal((await checkout('monthly')).status, 403)
      assert.equal((await checkout('admission')).status, 409)
      assert.equal((await request('/admin/admissions', member)).status, 403)
      const queue = await request('/admin/admissions', admin)
      const row = queue.data.admissions.find((payment) => payment.id === admissionId)
      assert.ok(row)
      assert.equal(row.admissionApproval, null)
      assert.equal((await request(`/admin/admissions/${admissionId}/confirm-notification`, member, { notified: true })).status, 403)
      assert.equal((await request(`/admin/admissions/${admissionId}/confirm-notification`, admin, { notified: false })).status, 400)
      assert.equal((await request('/payments/options', member)).data.admission.status, 'AWAITING_ADMIN')
    })
    await t.test('admin attestation is audited and idempotent; only that member gains membership choices', async () => {
      const path = `/admin/admissions/${admissionId}/confirm-notification`
      const first = await request(path, admin, { notified: true })
      assert.equal(first.status, 200)
      const repeated = await request(path, admin, { notified: true })
      assert.equal(repeated.data.approval.notifiedAt, first.data.approval.notifiedAt)
      const audit = await db.admissionApproval.findUnique({ where: { paymentId: admissionId } })
      assert.equal(audit.notifiedById, admin.id)
      const options = await request('/payments/options', member)
      assert.equal(options.data.admission.status, 'APPROVED')
      assert.deepEqual(new Set(options.data.plans.map((plan) => plan.id)), new Set(['monthly', 'quarterly', 'half-year', 'annual']))
      assert.equal((await checkout('annual', other)).status, 403)
      const result = await checkout('monthly')
      assert.equal(result.status, 201)
      monthlyId = result.data.paymentId
      assert.equal((await request(`/admin/admissions/${monthlyId}/confirm-notification`, admin, { notified: true })).status, 409)
    })
    await t.test('sandbox approvals never unlock live payments, and chargeback revokes admission access', async () => {
      env.payhere.sandbox = false
      const live = await request('/payments/options', member)
      assert.equal(live.data.admission.status, 'PAYMENT_REQUIRED')
      assert.deepEqual(live.data.plans.map((plan) => plan.id), ['admission'])
      assert.equal((await request(`/admin/admissions/${admissionId}/confirm-notification`, admin, { notified: true })).status, 409)
      env.payhere.sandbox = true
      assert.equal((await notify(admissionId, '-3')).status, 200)
      assert.equal((await request('/payments/options', member)).data.admission.status, 'PAYMENT_REQUIRED')
      assert.equal((await checkout('annual')).status, 403)
      const pending = await db.payment.findUnique({ where: { id: monthlyId } })
      assert.equal((await checkout('monthly', member, { idempotencyKey: pending.idempotencyKey })).status, 403)
      assert.equal((await request(`/admin/admissions/${admissionId}/confirm-notification`, admin, { notified: true })).status, 409)
    })
  } finally {
    Object.assign(env.payhere, originalGateway)
    await db.payment.deleteMany({ where: { userId: { in: users } } })
    await db.user.deleteMany({ where: { id: { in: users } } })
    await new Promise((resolve) => server.close(resolve))
    await db.$disconnect()
  }
})
