import 'dotenv/config'
import { defineConfig } from 'prisma/config'

// Reading process.env directly allows offline validation without credentials.
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'node prisma/seed.js',
  },
  datasource: {
    url: process.env.DIRECT_URL || process.env.DATABASE_URL || undefined,
  },
})

