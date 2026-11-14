import test from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { registration, normalizePhone, checkoutInput } from '../src/validators/index.js'
import { hashPassword, verifyPassword } from '../src/utils/index.js'

test('Sri Lankan phone formats normalize to one unique account identifier', () => {
  for (const phone of ['0771234567', '+94 77 123 4567', '771234567', '94771234567']) assert.equal(normalizePhone(phone), '94771234567')
  for (const phone of ['07712345678', 'abc0771234567', '', null, {}, '+440771234567']) assert.equal(normalizePhone(phone), '')
})

test('registration enforces identity fields and password policy on the server', () => {
  const valid = { name: ' Test Member ', phone: '0771234567', nic: '123456789v', password: 'StrongTest123' }
  assert.deepEqual(registration(valid), { ...valid, name: 'Test Member', phone: '94771234567', nic: '123456789V' })
  for (const field of ['name', 'phone', 'nic', 'password']) assert.throws(() => registration({ ...valid, [field]: '' }), { status: 400 })
  assert.throws(() => registration({ ...valid, password: 'a'.repeat(129) }), { status: 400 })
})

test('passwords use salted scrypt hashes and reject incorrect credentials', async () => {
  const first = await hashPassword('StrongTest123')
  const second = await hashPassword('StrongTest123')
  assert.notEqual(first, second)
  assert.equal(await verifyPassword('StrongTest123', first), true)
  assert.equal(await verifyPassword('incorrect', first), false)
})

test('checkout accepts only expected billing fields and requires a request ID', () => {
  const input = { planId: 'monthly', billingName: 'Test Member', billingEmail: 'test@example.invalid', billingAddress: 'Test address', billingCity: 'Colombo', idempotencyKey: randomUUID() }
  assert.deepEqual(checkoutInput({ ...input, amountMinor: 1, status: 'PAID' }), input)
  assert.throws(() => checkoutInput({ ...input, billingEmail: 'bad' }), { status: 400 })
  assert.throws(() => checkoutInput({ ...input, idempotencyKey: 'bad' }), { status: 400 })
})
