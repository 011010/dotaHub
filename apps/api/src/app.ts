import Fastify, { type FastifyBaseLogger } from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import { logger } from './lib/logger'
import routes from './routes'

export async function buildApp() {
  const app = Fastify({
    logger: logger as unknown as FastifyBaseLogger,
  })

  await app.register(helmet)
  await app.register(cors, {
    origin: process.env.CORS_ORIGIN ?? 'http://localhost:3000',
  })

  await app.register(routes)

  app.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }))

  return app
}