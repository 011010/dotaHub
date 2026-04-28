import { FastifyInstance } from 'fastify'
import matchesRoutes from './matches'
import streamersRoutes from './streamers'
import searchRoutes from './search'
import authRoutes from './auth'
import notificationsRoutes from './notifications'

export default async function routes(app: FastifyInstance) {
  await app.register(authRoutes,          { prefix: '/auth' })
  await app.register(matchesRoutes,       { prefix: '/matches' })
  await app.register(streamersRoutes,     { prefix: '/streamers' })
  await app.register(searchRoutes,        { prefix: '/search' })
  await app.register(notificationsRoutes, { prefix: '/notifications' })
}

export { routes }