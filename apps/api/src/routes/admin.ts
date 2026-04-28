import { FastifyInstance } from 'fastify'
import { db } from '@dota-replay/db'

interface StreamerBody {
  steamAccountId:   string
  displayName?:     string
  twitchId?:        string
  youtubeChannelId?: string
  kickUsername?:    string
  trovoUsername?:   string
  facebookPageId?:  string
  tiktokUsername?:  string
  verified?:        boolean
}

function requireAdminKey(secret: string | undefined, provided: string | undefined): boolean {
  if (!secret) return true   // no key configured → open (dev-only)
  return provided === secret
}

export default async function adminRoutes(app: FastifyInstance) {
  // All admin routes check X-Admin-Key header
  app.addHook('preHandler', async (req, reply) => {
    const key = process.env.ADMIN_SECRET
    if (!requireAdminKey(key, req.headers['x-admin-key'] as string | undefined)) {
      return reply.status(403).send({ error: 'Forbidden' })
    }
  })

  // ── GET /admin/streamers ────────────────────────────────────────────────────
  app.get('/streamers', async () => {
    const streamers = await db.streamer.findMany({ orderBy: { id: 'asc' } })
    return { streamers: streamers.map(s => ({ ...s, steamAccountId: s.steamAccountId.toString() })) }
  })

  // ── POST /admin/streamers ───────────────────────────────────────────────────
  app.post<{ Body: StreamerBody }>('/streamers', async (request, reply) => {
    const {
      steamAccountId, displayName, twitchId, youtubeChannelId,
      kickUsername, trovoUsername, facebookPageId, tiktokUsername, verified,
    } = request.body

    if (!steamAccountId) return reply.status(400).send({ error: 'steamAccountId is required' })

    let id: bigint
    try { id = BigInt(steamAccountId) } catch {
      return reply.status(400).send({ error: 'Invalid steamAccountId' })
    }

    const streamer = await db.streamer.upsert({
      where:  { steamAccountId: id },
      create: {
        steamAccountId: id,
        displayName:    displayName ?? null,
        twitchId:       twitchId ?? null,
        youtubeChannelId: youtubeChannelId ?? null,
        kickUsername:   kickUsername ?? null,
        trovoUsername:  trovoUsername ?? null,
        facebookPageId: facebookPageId ?? null,
        tiktokUsername: tiktokUsername ?? null,
        verified:       verified ?? false,
      },
      update: {
        ...(displayName     !== undefined && { displayName }),
        ...(twitchId        !== undefined && { twitchId }),
        ...(youtubeChannelId !== undefined && { youtubeChannelId }),
        ...(kickUsername    !== undefined && { kickUsername }),
        ...(trovoUsername   !== undefined && { trovoUsername }),
        ...(facebookPageId  !== undefined && { facebookPageId }),
        ...(tiktokUsername  !== undefined && { tiktokUsername }),
        ...(verified        !== undefined && { verified }),
      },
    })

    return reply.status(201).send({ streamer: { ...streamer, steamAccountId: streamer.steamAccountId.toString() } })
  })

  // ── DELETE /admin/streamers/:steamId ───────────────────────────────────────
  app.delete<{ Params: { steamId: string } }>('/streamers/:steamId', async (request, reply) => {
    let id: bigint
    try { id = BigInt(request.params.steamId) } catch {
      return reply.status(400).send({ error: 'Invalid steamId' })
    }

    await db.streamer.delete({ where: { steamAccountId: id } })
    return { ok: true }
  })
}
