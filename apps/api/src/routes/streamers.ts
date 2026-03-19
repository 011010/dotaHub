import { FastifyInstance } from 'fastify'
import { db } from '@dota-replay/db'
import type { StreamerData } from '@dota-replay/types'

export default async function streamersRoutes(app: FastifyInstance) {
  app.get('/', async () => {
    const streamers = await db.streamer.findMany({
      take: 100,
      orderBy: { createdAt: 'desc' },
    })
    return { streamers }
  })

  app.post('/', async (request, reply) => {
    const data = request.body as StreamerData
    
    const streamer = await db.streamer.create({
      data: {
        steamAccountId: data.steamAccountId,
        displayName: data.displayName,
        twitchId: data.platformIds.twitch,
        youtubeChannelId: data.platformIds.youtube,
        kickUsername: data.platformIds.kick,
        trovoUsername: data.platformIds.trovo,
        facebookPageId: data.platformIds.facebook,
        tiktokUsername: data.platformIds.tiktok,
        verified: data.verified ?? false,
      },
    })

    return reply.status(201).send({ streamer })
  })

  app.get('/:steamId', async (request, reply) => {
    const { steamId } = request.params as { steamId: string }
    
    const streamer = await db.streamer.findUnique({
      where: { steamAccountId: BigInt(steamId) },
      include: { clips: true },
    })

    if (!streamer) {
      return reply.status(404).send({ error: 'Streamer not found' })
    }

    return { streamer }
  })
}