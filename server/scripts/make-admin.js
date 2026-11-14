import { db } from '../src/config/database.js'
import { normalizePhone } from '../src/validators/index.js'

try {
  const phone = normalizePhone(process.argv[2])
  if (!phone) throw new Error('Usage: npm run admin:promote --workspace server -- 0771234567')
  await db.user.update({ where: { phone }, data: { role: 'ADMIN' } })
  console.info('Registered member promoted to administrator.')
} catch (error) {
  console.error(error.code === 'P2025' ? 'Register the member account first.' : 'Unable to promote account. Supply a registered Sri Lankan phone number.')
  process.exitCode = 1
} finally {
  await db.$disconnect()
}
