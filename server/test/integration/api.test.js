import test from 'node:test'
import assert from 'node:assert/strict'
import { createHash, randomInt, randomUUID } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { once } from 'node:events'
import app from '../../src/app.js'
import { db } from '../../src/config/database.js'
import { env } from '../../src/config/env.js'

test('Neon API integration with disposable accounts and simulated gateway notifications', async (t) => {
  const server = app.listen(0, '127.0.0.1')
  await once(server, 'listening')
  const base = `http://127.0.0.1:${server.address().port}/api`
  const users = []
  const originalGateway = { ...env.payhere }
  const suffix = String(randomInt(1000000, 9999999))
  const member = { name: 'Integration Test Member', phone: `077${suffix}`, nic: `99999${suffix}`, password: 'TestOnlyPassword123' }
  let cookie, memberId, order, otherCookie
  async function request(path, { body, session = cookie, method = 'GET', headers = {}, raw } = {}) {
    const response = await fetch(`${base}${path}`, {
      method, headers: { 'X-Requested-With': 'GlobusFitness', ...(session ? { Cookie: session } : {}), ...(body ? { 'Content-Type': 'application/json' } : {}), ...headers },
      ...(body ? { body: JSON.stringify(body) } : raw ? { body: raw } : {}),
    })
    const data = await response.json().catch(() => null)
    return { response, data }
  }
  const md5 = (value) => createHash('md5').update(value).digest('hex').toUpperCase()
  async function notify(changes = {}, validSignature = true) {
    const body = { merchant_id: env.payhere.merchantId, order_id: order, payment_id: `test-${suffix}`, payhere_amount: '2500.00', payhere_currency: 'LKR', status_code: '2', ...changes }
    body.md5sig = validSignature ? md5(body.merchant_id + body.order_id + body.payhere_amount + body.payhere_currency + body.status_code + md5(env.payhere.merchantSecret)) : '0'.repeat(32)
    return fetch(`${base}/payments/payhere/notify`, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(body) })
  }
  try {
    await t.test('readiness, authenticated boundaries, CSRF, validation and hashed registration', async () => {
      assert.equal((await request('/ready')).response.status, 200)
      assert.equal((await request('/payments', { session: '' })).response.status, 401)
      assert.equal((await request('/auth/register', { method: 'POST', body: member, headers: { Origin: 'https://untrusted.example' } })).response.status, 403)
      assert.equal((await request('/auth/register', { method: 'POST', body: { ...member, nic: 'invalid' } })).response.status, 400)
      const result = await request('/auth/register', { method: 'POST', body: { ...member, role: 'ADMIN' } })
      assert.equal(result.response.status, 201)
      memberId = result.data.user.id
      users.push(memberId)
      cookie = result.response.headers.get('set-cookie').split(';')[0]
      assert.match(result.response.headers.get('set-cookie'), /HttpOnly/)
      assert.match(result.response.headers.get('set-cookie'), /SameSite=Lax/)
      assert.equal(result.data.user.role, 'MEMBER')
      assert.equal(result.data.user.passwordHash, undefined)
      const stored = await db.user.findUnique({ where: { id: memberId } })
      assert.match(stored.passwordHash, /^scrypt:/)
      assert.notEqual(stored.passwordHash, member.password)
      assert.equal(stored.phone, `9477${suffix}`)
      assert.equal((await request('/auth/register', { method: 'POST', body: { ...member, phone: `+9477${suffix}` } })).response.status, 409)
      assert.equal((await request('/admin/members')).response.status, 403)
    })
    await t.test('original files exist in Cloudinary and legacy routes redirect to verified cloud images', async () => {
      const { data } = await request('/images')
      assert.equal(data.images.length, 13)
      for (const image of data.images) {
        const original = await readFile(new URL(`../../../Image/${encodeURIComponent(image.filename)}`, import.meta.url))
        const redirect = await fetch(`${base}/images/${encodeURIComponent(image.filename)}`, { redirect: 'manual' })
        assert.equal(redirect.status, 302)
        assert.equal(redirect.headers.get('location'), image.url)
        assert.equal(new URL(image.url).hostname, 'res.cloudinary.com')
        const stored = await db.mediaAsset.findUnique({ where: { filename: image.filename } })
        assert.equal(stored.data, null)
        assert.ok(stored.cloudAssetId)
        const response = await fetch(image.url, { signal: AbortSignal.timeout(30_000) })
        assert.equal(response.status, 200)
        assert.deepEqual(Buffer.from(await response.arrayBuffer()), original)
        assert.equal(createHash('sha256').update(original).digest('hex'), image.sha256)
        const cached = await fetch(image.url, { headers: { 'If-None-Match': response.headers.get('etag'), 'Cache-Control': 'max-age=0' }, signal: AbortSignal.timeout(30_000) })
        assert.equal(cached.status, 304)
      }
      assert.equal((await request('/images/does-not-exist.jpeg')).response.status, 404)
    })
    await t.test('gateway configuration gates checkout; server controls price and idempotency', async () => {
      env.payhere.merchantSecret = ''
      assert.equal((await request('/payments/checkout', { method: 'POST', body: {} })).response.status, 503)
      Object.assign(env.payhere, { merchantId: 'test-merchant', merchantSecret: randomUUID(), sandbox: true, publicApiUrl: 'https://test.example.invalid' })
      const body = { planId: 'admission', billingName: member.name, billingEmail: 'integration@example.invalid', billingAddress: 'Test address', billingCity: 'Colombo', idempotencyKey: randomUUID(), amountMinor: 1, status: 'PAID' }
      const result = await request('/payments/checkout', { method: 'POST', body })
      assert.equal(result.response.status, 201)
      order = result.data.paymentId
      assert.equal(result.data.fields.amount, '2500.00')
      assert.equal(result.data.action, 'https://sandbox.payhere.lk/pay/checkout')
      assert.equal(result.data.fields.merchant_secret, undefined)
      const repeat = await request('/payments/checkout', { method: 'POST', body })
      assert.equal(repeat.data.paymentId, order)
      assert.equal((await request('/payments/checkout', { method: 'POST', body: { ...body, planId: 'annual' } })).response.status, 409)
      const stored = await db.payment.findUnique({ where: { id: order } })
      assert.equal(stored.status, 'PENDING')
      assert.equal(stored.amountMinor, 250000)
      assert.equal(stored.billingEmail, body.billingEmail)
    })
    await t.test('notification signatures, order amounts, currency and duplicate/out-of-order callbacks', async () => {
      assert.equal((await notify({}, false)).status, 400)
      assert.equal((await notify({ payhere_amount: '1.00' })).status, 400)
      assert.equal((await notify({ payhere_currency: 'USD' })).status, 400)
      assert.equal((await notify({ merchant_id: 'wrong-merchant' })).status, 400)
      assert.equal((await db.payment.findUnique({ where: { id: order } })).status, 'PENDING')
      const parallel = await Promise.all([notify(), notify()])
      assert.deepEqual(parallel.map((response) => response.status), [200, 200])
      const paid = await db.payment.findUnique({ where: { id: order } })
      assert.equal(paid.status, 'PAID')
      assert.ok(paid.paidAt)
      assert.equal((await notify({ status_code: '-2' })).status, 200)
      assert.equal((await notify()).status, 200)
      const stillPaid = await db.payment.findUnique({ where: { id: order } })
      assert.equal(stillPaid.status, 'PAID')
      assert.equal(stillPaid.paidAt.getTime(), paid.paidAt.getTime())
      assert.equal((await notify({ status_code: '-3' })).status, 200)
      await notify()
      assert.equal((await db.payment.findUnique({ where: { id: order } })).status, 'CHARGEDBACK')
    })
    await t.test('member payment isolation and administrator-only records', async () => {
      const second = await request('/auth/register', { method: 'POST', body: { ...member, name: 'Second Integration Member', phone: `078${suffix}`, nic: `99998${suffix}` } })
      assert.equal(second.response.status, 201)
      users.push(second.data.user.id)
      otherCookie = second.response.headers.get('set-cookie').split(';')[0]
      assert.equal((await request('/payments', { session: otherCookie })).data.total, 0)
      assert.equal((await request('/payments')).data.total, 1)
      await db.user.update({ where: { id: memberId }, data: { role: 'ADMIN' } })
      const records = await request('/admin/payments')
      assert.equal(records.response.status, 200)
      assert.ok(records.data.payments.some((payment) => payment.id === order))
      assert.equal((await request('/admin/members', { session: otherCookie })).response.status, 403)
    })
    await t.test('logout revokes the server session, and login restores access', async () => {
      assert.equal((await request('/auth/logout', { method: 'POST' })).response.status, 204)
      assert.equal((await request('/auth/me')).response.status, 401)
      assert.equal((await request('/auth/login', { method: 'POST', body: { phone: member.phone, password: 'wrong' } })).response.status, 401)
      const login = await request('/auth/login', { method: 'POST', body: { phone: member.phone, password: member.password } })
      assert.equal(login.response.status, 200)
      cookie = login.response.headers.get('set-cookie').split(';')[0]
      assert.equal((await request('/auth/me')).data.user.id, memberId)
    })
  } finally {
    Object.assign(env.payhere, originalGateway)
    await db.payment.deleteMany({ where: { userId: { in: users } } })
    await db.user.deleteMany({ where: { id: { in: users } } })
    await new Promise((resolve) => server.close(resolve))
    await db.$disconnect()
  }
})
