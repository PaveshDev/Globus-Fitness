import { syncImages } from '../src/services/imageService.js'
import { db } from '../src/config/database.js'

try {
  console.info(JSON.stringify(await syncImages()))
} catch (error) {
  console.error(`Image sync failed: ${error.message}`)
  process.exitCode = 1
} finally {
  await db.$disconnect()
}
