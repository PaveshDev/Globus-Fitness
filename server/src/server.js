import app from './app.js'
import { env } from './config/env.js'
import { db } from './config/database.js'

try {
  await db.$queryRaw`SELECT 1`
} catch (error) {
  console.error(`Database connection failed (${error.code || error.name}). Check server configuration.`)
  await db.$disconnect()
  process.exit(1)
}

const server = app.listen(env.port, () => {
  console.info(`Globus Fitness API: http://localhost:${env.port}`)
})

server.on('error', (error) => {
  console.error(`Unable to start API (${error.code || 'unknown error'}).`)
  process.exit(1)
})

function shutdown() {
  server.close(async () => { await db.$disconnect(); process.exit(0) })
  setTimeout(() => process.exit(1), 10_000).unref()
}

process.once('SIGINT', shutdown)
process.once('SIGTERM', shutdown)

