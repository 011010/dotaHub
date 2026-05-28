import { FastifyInstance } from 'fastify'
import { db } from '@dota-replay/db'
import { OpenDotaClient } from '@dota-replay/dota-api'
import type { SearchParams, ClipSearchResult } from '@dota-replay/types'
import { logger } from '../lib/logger'

const STEAM_ID_OFFSET = 76561197960265728n

export default async function searchRoutes(app: FastifyInstance) {
  app.get('/', async (request, reply) => {
    const { steamId, name, page = '1', limit = '20' } = request.query as SearchParams

    const pageNum  = parseInt(page as string, 10)
    const limitNum = parseInt(limit as string, 10)
    const offset   = (pageNum - 1) * limitNum

    let resolvedSteamId: bigint
    let resolvedDisplayName: string | undefined

    if (name) {
      try {
        const opendota    = new OpenDotaClient()
        const results     = await opendota.searchPlayers(name)
        const withAccount = Array.isArray(results)
          ? results.filter(r => r.account_id != null && r.account_id > 0)
          : []

        if (!withAccount.length) {
          return {
            clips: [],
            pagination: { page: pageNum, limit: limitNum, total: 0, hasMore: false },
            resolvedDisplayName: name,
          }
        }
        const top           = withAccount[0]
        resolvedSteamId     = BigInt(top.account_id) + STEAM_ID_OFFSET
        resolvedDisplayName = top.personaname
      } catch (err) {
        logger.warn({ err, name }, 'OpenDota player search failed, returning empty results')
        return {
          clips: [],
          pagination: { page: pageNum, limit: limitNum, total: 0, hasMore: false },
          resolvedDisplayName: name,
        }
      }
    } else if (steamId) {
      try {
        resolvedSteamId = BigInt(steamId)
      } catch {
        return reply.status(400).send({ error: 'Invalid steamId format' })
      }
    } else {
      return reply.status(400).send({ error: 'steamId or name is required' })
    }

    const where = { event: { playerSteamId: resolvedSteamId } }

    const [rawClips, total] = await Promise.all([
      db.clip.findMany({
        where,
        take: limitNum,
        skip: offset,
        orderBy: { createdAt: 'desc' },
        include: { event: { include: { match: true } }, streamer: true },
      }),
      db.clip.count({ where }),
    ])

    const clips: ClipSearchResult[] = rawClips.map(clip => ({
      clipId:       clip.id,
      eventId:      clip.eventId,
      eventType:    clip.event.eventType,
      gameTimeSec:  clip.event.gameTimeSec,
      platform:     clip.platform,
      clipUrl:      clip.clipUrl,
      embedUrl:     clip.embedUrl ?? undefined,
      thumbnailUrl: clip.thumbnailUrl ?? undefined,
      streamerName: clip.streamer.displayName ?? undefined,
      matchId:      clip.event.matchId.toString(),
      heroId:       clip.event.heroId ?? undefined,
      createdAt:    clip.createdAt,
    }))

    return {
      clips,
      pagination: { page: pageNum, limit: limitNum, total, hasMore: offset + limitNum < total },
      resolvedSteamId: resolvedSteamId.toString(),
      resolvedDisplayName,
    }
  })
}
