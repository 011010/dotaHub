import 'dotenv/config'
import { buildApp } from './app'
import { logger } from './lib/logger'

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001
const HOST = process.env.HOST ?? '0.0.0.0'

async function start() {
  const app = await buildApp()

  try {
    await app.listen({ port: PORT, host: HOST })
    logger.info(`API server running on http://${HOST}:${PORT}`)
  } catch (err) {
    logger.error(err, 'Failed to start server')
    process.exit(1)
  }
}

start()