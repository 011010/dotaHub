import 'dotenv/config'
import { startWorkers } from './workers'
import { logger } from './lib/logger'

logger.info('Starting workers...')
startWorkers()

process.on('SIGTERM', () => {
  logger.info('Received SIGTERM, shutting down...')
  process.exit(0)
})