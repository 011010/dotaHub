import { FastifyInstance } from 'fastify'
import matchesRoutes from './matches'
import streamersRoutes from './streamers'
import searchRoutes from './search'

export default async function routes(app: FastifyInstance) {
  await app.register(matchesRoutes, { prefix: '/matches' })
  await app.register(streamersRoutes, { prefix: '/streamers' })
  await app.register(searchRoutes, { prefix: '/search' })
}

export { routes }