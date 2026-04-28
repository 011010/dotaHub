import { Job } from 'bullmq'
import { db } from '@dota-replay/db'
import { logger } from '../lib/logger'
import { notificationQueue } from '../lib/queue'

export interface ClipCreateJobData {
  eventId:    number
  streamerId: number
  platform:   'twitch' | 'youtube' | 'kick'
}

// ── Twitch Helix client (minimal, no extra deps) ───────────────────────────────

interface TwitchToken {
  access_token: string
  expires_at:   number
}

let cachedToken: TwitchToken | null = null

async function getTwitchToken(): Promise<string> {
  if (cachedToken && cachedToken.expires_at > Date.now() + 60_000) {
    return cachedToken.access_token
  }

  const clientId     = process.env.TWITCH_CLIENT_ID
  const clientSecret = process.env.TWITCH_CLIENT_SECRET
  if (!clientId || !clientSecret) throw new Error('TWITCH_CLIENT_ID/SECRET not configured')

  const res  = await fetch(
    `https://id.twitch.tv/oauth2/token?client_id=${clientId}&client_secret=${clientSecret}&grant_type=client_credentials`,
    { method: 'POST' }
  )
  const data = await res.json() as { access_token: string; expires_in: number }
  cachedToken = { access_token: data.access_token, expires_at: Date.now() + data.expires_in * 1000 }
  return cachedToken.access_token
}

interface TwitchUser { id: string; login: string; display_name: string }
interface TwitchClip {
  id: string; url: string; embed_url: string
  thumbnail_url: string; duration: number; title: string; created_at: string
}

async function twitchGet<T>(path: string): Promise<{ data: T[] }> {
  const token    = await getTwitchToken()
  const clientId = process.env.TWITCH_CLIENT_ID!
  const res      = await fetch(`https://api.twitch.tv/helix${path}`, {
    headers: { Authorization: `Bearer ${token}`, 'Client-Id': clientId },
  })
  if (!res.ok) throw new Error(`Twitch API ${res.status}: ${path}`)
  return res.json() as Promise<{ data: T[] }>
}

async function getTwitchUserId(login: string): Promise<string | null> {
  const res = await twitchGet<TwitchUser>(`/users?login=${encodeURIComponent(login)}`)
  return res.data[0]?.id ?? null
}

async function searchTwitchClipsNear(
  broadcasterId: string,
  eventAt: Date,
  windowSec = 300
): Promise<TwitchClip | null> {
  const startedAt = new Date(eventAt.getTime() - windowSec * 1000).toISOString()
  const endedAt   = new Date(eventAt.getTime() + windowSec * 1000).toISOString()

  const res = await twitchGet<TwitchClip>(
    `/clips?broadcaster_id=${broadcasterId}&started_at=${startedAt}&ended_at=${endedAt}&first=5`
  )

  // Return the clip closest to the event timestamp
  if (res.data.length === 0) return null
  return res.data.reduce((best, clip) => {
    const bestDiff = Math.abs(new Date(best.created_at).getTime() - eventAt.getTime())
    const curDiff  = Math.abs(new Date(clip.created_at).getTime() - eventAt.getTime())
    return curDiff < bestDiff ? clip : best
  })
}

// ── Processors by platform ─────────────────────────────────────────────────────

async function handleTwitch(
  twitchId: string,
  eventAt:  Date,
  eventId:  number,
  streamerId: number
): Promise<number | null> {
  const broadcasterId = await getTwitchUserId(twitchId)
  if (!broadcasterId) {
    logger.warn({ twitchId }, 'Twitch user not found')
    return null
  }

  const clip = await searchTwitchClipsNear(broadcasterId, eventAt)
  if (!clip) {
    logger.info({ twitchId, eventAt }, 'No Twitch clip found near event timestamp')
    return null
  }

  // Idempotency — skip if already saved
  const existing = await db.clip.findFirst({
    where: { platformClipId: clip.id, platform: 'twitch' },
  })
  if (existing) return existing.id

  const saved = await db.clip.create({
    data: {
      eventId,
      streamerId,
      platform:       'twitch',
      clipUrl:        clip.url,
      embedUrl:       clip.embed_url,
      thumbnailUrl:   clip.thumbnail_url,
      durationSec:    Math.round(clip.duration),
      clipTitle:      clip.title,
      platformClipId: clip.id,
    },
  })

  logger.info({ clipId: saved.id, twitchClipId: clip.id }, 'Twitch clip saved')
  return saved.id
}

async function handleYouTube(
  _channelId: string,
  _eventAt:   Date,
  _eventId:   number,
  _streamerId: number
): Promise<number | null> {
  // YouTube VOD clip search requires OAuth user token (channel owner authorization).
  // This is a known limitation — log and skip for now.
  logger.info({ channelId: _channelId }, 'YouTube clip creation not yet implemented')
  return null
}

async function handleKick(
  _username:  string,
  _eventAt:   Date,
  _eventId:   number,
  _streamerId: number
): Promise<number | null> {
  logger.info({ username: _username }, 'Kick clip creation not yet implemented')
  return null
}

// ── Main processor ─────────────────────────────────────────────────────────────

export async function processClipCreate(job: Job<ClipCreateJobData>): Promise<void> {
  const { eventId, streamerId, platform } = job.data
  logger.info({ eventId, streamerId, platform }, 'Creating clip')

  const [event, streamer] = await Promise.all([
    db.event.findUnique({
      where:   { id: eventId },
      include: { match: true },
    }),
    db.streamer.findUnique({ where: { id: streamerId } }),
  ])

  if (!event || !streamer) {
    logger.warn({ eventId, streamerId }, 'Event or streamer not found')
    return
  }

  // Approximate real-world time of the event
  const eventAt = new Date(event.match.startTime.getTime() + event.gameTimeSec * 1000)

  let clipId: number | null = null

  try {
    if (platform === 'twitch' && streamer.twitchId) {
      clipId = await handleTwitch(streamer.twitchId, eventAt, eventId, streamerId)
    } else if (platform === 'youtube' && streamer.youtubeChannelId) {
      clipId = await handleYouTube(streamer.youtubeChannelId, eventAt, eventId, streamerId)
    } else if (platform === 'kick' && streamer.kickUsername) {
      clipId = await handleKick(streamer.kickUsername, eventAt, eventId, streamerId)
    }
  } catch (err) {
    logger.error({ eventId, streamerId, platform, err }, 'Clip fetch failed')
    throw err
  }

  if (clipId !== null) {
    await notificationQueue.add('notification:send', { clipId })
  }
}
