import { Job } from 'bullmq'
import { db } from '@dota-replay/db'
import { logger } from '../lib/logger'
import { sendPushNotification } from '../lib/webpush'

export interface NotificationJobData {
  clipId: number
}

const EVENT_TITLES: Record<string, string> = {
  rampage:         'RAMPAGE',
  ultra_kill:      'ULTRA KILL',
  triple_kill:     'TRIPLE KILL',
  first_blood:     'FIRST BLOOD',
  aegis_steal:     'AEGIS STEAL',
  team_wipe:       'TEAM WIPE',
  comeback:        'COMEBACK',
  courier_snipe:   'COURIER SNIPE',
  mega_creeps_win: 'MEGA CREEPS',
  base_race:       'BASE RACE',
}

export async function processNotificationSend(job: Job<NotificationJobData>): Promise<void> {
  const { clipId } = job.data
  logger.info({ clipId }, 'Processing notification')

  const clip = await db.clip.findUnique({
    where:   { id: clipId },
    include: {
      event:   { include: { match: true } },
      streamer: true,
    },
  })

  if (!clip) {
    logger.warn({ clipId }, 'Clip not found')
    return
  }

  const { event } = clip

  const matchPlayers = await db.event.findMany({
    where:    { matchId: event.matchId },
    select:   { playerSteamId: true },
    distinct: ['playerSteamId'],
  })

  const playerIds = matchPlayers.map(p => p.playerSteamId)

  const users = await db.user.findMany({
    where:   { steamAccountId: { in: playerIds } },
    include: { pushSubscriptions: true },
  })

  if (users.length === 0) {
    logger.info({ clipId, matchId: event.matchId.toString() }, 'No registered users in this match')
    return
  }

  const eventLabel   = EVENT_TITLES[event.eventType] ?? event.eventType.toUpperCase()
  const streamerName = clip.streamer.displayName ?? `Streamer #${clip.streamer.id}`

  let notified = 0

  for (const user of users) {
    if (user.pushSubscriptions.length === 0) continue

    const payload = {
      title: `${eventLabel} spotted`,
      body:  `${streamerName} captured your moment on ${clip.platform}`,
      icon:  '/icon-192.png',
      url:   clip.clipUrl,
      tag:   `clip-${clipId}`,
    }

    for (const sub of user.pushSubscriptions) {
      const ok = await sendPushNotification(
        { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
        payload
      )

      if (!ok) {
        // 404/410 — subscription expired, remove it
        await db.pushSubscription.delete({ where: { id: sub.id } }).catch(() => null)
        logger.info({ subId: sub.id }, 'Removed expired push subscription')
      } else {
        notified++
        logger.info({ userId: user.id, clipId }, 'Push notification sent')
      }
    }
  }

  logger.info({ clipId, notified }, 'Notifications dispatched')
}
