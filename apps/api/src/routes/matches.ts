import { FastifyInstance } from 'fastify'
import { db } from '@dota-replay/db'
import { matchIngestQueue } from '../lib/queue'

export default async function matchesRoutes(app: FastifyInstance) {
  // Static route must come before parametric /:id
  app.get('/recent', async (request) => {
    const { limit = '20', offset = '0' } = request.query as { limit?: string; offset?: string }

    const matches = await db.match.findMany({
      take:    parseInt(limit, 10),
      skip:    parseInt(offset, 10),
      orderBy: { startTime: 'desc' },
    })

    return { matches }
  })

  app.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string }

    const match = await db.match.findUnique({
      where:   { matchId: BigInt(id) },
      include: { events: true },
    })

    if (!match) return reply.status(404).send({ error: 'Match not found' })
    return { match }
  })

  // Trigger ingest for a given match ID
  app.post<{ Body: { matchId: string } }>('/ingest', async (request, reply) => {
    const { matchId } = request.body
    if (!matchId) return reply.status(400).send({ error: 'matchId is required' })

    let id: bigint
    try {
      id = BigInt(matchId)
    } catch {
      return reply.status(400).send({ error: 'Invalid matchId' })
    }

    const existing = await db.match.findUnique({ where: { matchId: id } })
    if (existing?.processed) {
      return reply.status(409).send({ error: 'Match already processed' })
    }

    await matchIngestQueue.add('match:ingest', { matchId: id })
    return reply.status(202).send({ queued: true, matchId: matchId })
  })
}
