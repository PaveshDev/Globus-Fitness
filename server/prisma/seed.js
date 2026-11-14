import { db } from '../src/config/database.js'
import { syncImages } from '../src/services/imageService.js'

const plans = [
  { id: 'admission', title: 'Admission fee', amountMinor: 250000, months: 0 },
  { id: 'monthly', title: 'Monthly membership', amountMinor: 250000, months: 1 },
  { id: 'quarterly', title: '3-month membership', amountMinor: 700000, months: 3 },
  { id: 'half-year', title: '6-month membership', amountMinor: 1200000, months: 6 },
  { id: 'annual', title: 'Annual membership', amountMinor: 2500000, months: 12 },
]

try {
  for (const plan of plans) await db.plan.upsert({ where: { id: plan.id }, create: plan, update: {} })
  const result = await syncImages()
  console.info(`Seed complete: ${plans.length} plans and ${result.verified} verified Cloudinary images. Existing accounts and payments preserved.`)
} catch (error) {
  console.error(`Seed failed (${error.code || error.name}).`)
  process.exitCode = 1
} finally {
  await db.$disconnect()
}

