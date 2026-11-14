import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../generated/prisma/client.ts'
import { env } from './env.js'

// Require certificate verification explicitly, including after future pg upgrades.
const connectionUrl = new URL(env.databaseUrl)
connectionUrl.searchParams.set('sslmode', 'verify-full')
const adapter = new PrismaPg({
  connectionString: connectionUrl.toString(),
  enableChannelBinding: true,
  max: 5,
  connectionTimeoutMillis: 15_000,
  idleTimeoutMillis: 30_000,
})

export const db = new PrismaClient({ adapter })

