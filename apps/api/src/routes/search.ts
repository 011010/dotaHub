import { FastifyInstance } from 'fastify'
import { db } from '@dota-replay/db'
import type { SearchParams } from '@dota-replay/types'

export default async function searchRoutes(app: FastifyInstance) {
  app.get('/', async (request, reply) => {
    const { steamId, page = '1', limit = '20' } = request.query as SearchParams
    
    const pageNum = parseInt(page as string, 10)
    const limitNum = parseInt(limit as string, 10)
    const offset = (pageNum - 1) * limitNum

    const clips = await db.clip.findMany({
      where: {
        event: {
          playerSteamId: BigInt(steamId),
        },
      },
      take: limitNum,
      skip: offset,
      orderBy: { createdAt: 'desc' },
      include: {
        event: {
          include: { match: true },
        },
        streamer: true,
      },
    })

    const total = await db.clip.count({
      where: {
        event: {
          playerSteamId: BigInt(steamId),
        },
      },
    })

    return {
      clips,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        hasMore: offset + limitNum < total,
      },
    }
  })
}