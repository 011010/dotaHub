import { FastifyInstance } from 'fastify'
import { db } from '@dota-replay/db'

export default async function matchesRoutes(app: FastifyInstance) {
  app.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    
    const match = await db.match.findUnique({
      where: { matchId: BigInt(id) },
      include: { events: true },
    })

    if (!match) {
      return reply.status(404).send({ error: 'Match not found' })
    }

    return { match }
  })

  app.get('/recent', async (request, reply) => {
    const { limit = '20', offset = '0' } = request.query as { limit?: string; offset?: string }
    
    const matches = await db.match.findMany({
      take: parseInt(limit, 10),
      skip: parseInt(offset, 10),
      orderBy: { startTime: 'desc' },
    })

    return { matches }
  })
}