import { Job } from 'bullmq'
import { db } from '@dota-replay/db'
import { OpenDotaClient } from '@dota-replay/dota-api'
import { EVENT_TYPES } from '@dota-replay/types'
import type { OpenDotaObjective, OpenDotaPlayer, OpenDotaMatchFull } from '@dota-replay/types'
import { logger } from '../lib/logger'
import { clipCreateQueue } from '../lib/queue'

const openDota = new OpenDotaClient({
  apiKey: process.env.OPENDOTA_API_KEY,
})

export interface EventExtractJobData {
  matchId: string  // BigInt serialized as string
}

// player_slot 0-4 = radiant, 128-132 = dire
function slotToIndex(slot: number): number {
  return slot < 128 ? slot : slot - 123
}

function buildSlotMap(players: OpenDotaPlayer[]): Map<number, OpenDotaPlayer> {
  const map = new Map<number, OpenDotaPlayer>()
  for (const p of players) map.set(p.player_slot, p)
  return map
}

// ── Event detectors ────────────────────────────────────────────────────────────

interface DetectedEvent {
  eventType:     string
  gameTimeSec:   number
  playerSteamId: bigint
  victimSteamId?: bigint
  heroId?:       number
  context:       Record<string, unknown>
}

function detectFromObjectives(
  objectives: OpenDotaObjective[],
  slotMap: Map<number, OpenDotaPlayer>
): DetectedEvent[] {
  const events: DetectedEvent[] = []

  for (const obj of objectives) {
    const player = obj.player_slot !== undefined ? slotMap.get(obj.player_slot) : undefined

    switch (obj.type) {
      case 'CHAT_MESSAGE_FIRST_BLOOD': {
        if (!player || !player.account_id) break
        events.push({
          eventType:     EVENT_TYPES.FIRST_BLOOD,
          gameTimeSec:   obj.time,
          playerSteamId: BigInt(player.account_id),
          heroId:        player.hero_id,
          context:       { objectiveType: obj.type },
        })
        break
      }

      case 'CHAT_MESSAGE_AEGIS_STOLEN': {
        if (!player || !player.account_id) break
        events.push({
          eventType:     EVENT_TYPES.AEGIS_STEAL,
          gameTimeSec:   obj.time,
          playerSteamId: BigInt(player.account_id),
          heroId:        player.hero_id,
          context:       { unit: obj.unit },
        })
        break
      }

      case 'CHAT_MESSAGE_MEGA_CREEPS': {
        // Attribute to a random player on the winning team — we pick slot 0 or 128
        const winnerSlot = obj.team === 2 ? 0 : 128
        const winner     = slotMap.get(winnerSlot)
        if (!winner || !winner.account_id) break
        events.push({
          eventType:     EVENT_TYPES.MEGA_CREEPS_WIN,
          gameTimeSec:   obj.time,
          playerSteamId: BigInt(winner.account_id),
          heroId:        winner.hero_id,
          context:       { team: obj.team },
        })
        break
      }

      case 'CHAT_MESSAGE_COURIER_LOST': {
        // The killer is attributed via player_slot on the opposing side
        if (!player || !player.account_id) break
        events.push({
          eventType:     EVENT_TYPES.COURIER_SNIPE,
          gameTimeSec:   obj.time,
          playerSteamId: BigInt(player.account_id),
          heroId:        player.hero_id,
          context:       { unit: obj.unit },
        })
        break
      }
    }
  }

  return events
}

function detectKillStreaks(players: OpenDotaPlayer[]): DetectedEvent[] {
  const events: DetectedEvent[] = []

  for (const player of players) {
    if (!player.account_id || !player.multi_kills) continue

    for (const [countStr, occurrences] of Object.entries(player.multi_kills)) {
      if (occurrences === 0) continue
      const count = parseInt(countStr, 10)
      if (count < 3) continue

      let eventType: string
      if (count >= 5)      eventType = EVENT_TYPES.RAMPAGE
      else if (count >= 4) eventType = EVENT_TYPES.ULTRA_KILL
      else                 eventType = EVENT_TYPES.TRIPLE_KILL

      // kills_log gives us the actual time of the nth kill
      // Fall back to -1 (unknown) if not parsed
      const killTime = player.kills_log?.[player.kills_log.length - 1]?.time ?? -1

      events.push({
        eventType,
        gameTimeSec:   killTime,
        playerSteamId: BigInt(player.account_id),
        heroId:        player.hero_id,
        context:       { killStreak: count, occurrences },
      })
    }
  }

  return events
}

function detectComebacks(match: OpenDotaMatchFull, players: OpenDotaPlayer[]): DetectedEvent[] {
  const events: DetectedEvent[] = []
  const adv = match.radiant_gold_adv ?? match.dire_gold_adv

  if (!adv || adv.length < 2) return events

  // Find if the losing team (by >5k gold deficit) came back to win
  const DEFICIT_THRESHOLD = 5000
  const hadDeficit = adv.some(v =>
    (match.radiant_win ? v < -DEFICIT_THRESHOLD : v > DEFICIT_THRESHOLD)
  )

  if (!hadDeficit) return events

  // Attribute comeback to a random carry-position player on the winning side
  const winningSide  = match.radiant_win ? 'radiant' : 'dire'
  const winnerSlot   = winningSide === 'radiant' ? 0 : 128
  const carryPlayer  = players.find(p => p.player_slot === winnerSlot)
  if (!carryPlayer || !carryPlayer.account_id) return events

  events.push({
    eventType:     EVENT_TYPES.COMEBACK,
    gameTimeSec:   match.duration,
    playerSteamId: BigInt(carryPlayer.account_id),
    heroId:        carryPlayer.hero_id,
    context:       { peakDeficit: Math.max(...adv.map(Math.abs)) },
  })

  return events
}

function detectTeamWipes(match: OpenDotaMatchFull, players: OpenDotaPlayer[]): DetectedEvent[] {
  const events: DetectedEvent[] = []

  for (const fight of match.teamfights ?? []) {
    // A team wipe = one side had 0 deaths, the other had all 5 players die
    const radiantDeaths = fight.players.slice(0, 5).reduce((s, p)  => s + p.deaths, 0)
    const direDeaths    = fight.players.slice(5, 10).reduce((s, p) => s + p.deaths, 0)

    if (radiantDeaths < 4 && direDeaths < 4) continue

    const wipeTeamIsRadiant = direDeaths >= 4
    const wiperSlot         = wipeTeamIsRadiant ? 0 : 128
    const wiper             = players.find(p => p.player_slot === wiperSlot)
    if (!wiper || !wiper.account_id) continue

    events.push({
      eventType:     EVENT_TYPES.TEAM_WIPE,
      gameTimeSec:   fight.start,
      playerSteamId: BigInt(wiper.account_id),
      heroId:        wiper.hero_id,
      context:       { radiantDeaths, direDeaths, fightDuration: fight.end - fight.start },
    })
  }

  return events
}

// ── Main processor ─────────────────────────────────────────────────────────────

export async function processEventExtract(job: Job<EventExtractJobData>): Promise<void> {
  const matchId = BigInt(job.data.matchId)
  logger.info({ matchId: job.data.matchId }, 'Extracting events from match')

  // Fetch full match data (includes objectives, teamfights, multi_kills if parsed)
  const matchData = await openDota.getMatchFull(matchId)
  const players   = matchData.players ?? []

  // Build a fast slot → player lookup
  const slotMap = buildSlotMap(players)

  // Get all known streamers; find which ones were in this match
  const streamerIds = players
    .filter(p => p.account_id)
    .map(p => BigInt(p.account_id))

  const streamers = await db.streamer.findMany({
    where: { steamAccountId: { in: streamerIds } },
  })

  if (streamers.length === 0) {
    logger.info({ matchId: job.data.matchId }, 'No known streamers in match, skipping')
    await db.match.update({ where: { matchId }, data: { processed: true } })
    return
  }

  const streamerSteamIds = new Set(streamers.map(s => s.steamAccountId))

  // Detect all events
  const detected: DetectedEvent[] = [
    ...detectFromObjectives(matchData.objectives ?? [], slotMap),
    ...detectKillStreaks(players),
    ...detectComebacks(matchData, players),
    ...detectTeamWipes(matchData, players),
  ]

  logger.info({ matchId: job.data.matchId, count: detected.length }, 'Events detected')

  // Persist events that involve a known streamer and enqueue clip creation
  for (const evt of detected) {
    if (!streamerSteamIds.has(evt.playerSteamId)) continue

    const event = await db.event.create({
      data: {
        matchId:       matchId,
        eventType:     evt.eventType,
        gameTimeSec:   evt.gameTimeSec,
        playerSteamId: evt.playerSteamId,
        victimSteamId: evt.victimSteamId ?? null,
        heroId:        evt.heroId ?? null,
        contextJson:   evt.context as never,
      },
    })

    const streamer = streamers.find(s => s.steamAccountId === evt.playerSteamId)
    if (!streamer) continue

    // Enqueue clip creation for each active platform
    const platforms: Array<'twitch' | 'youtube' | 'kick'> = []
    if (streamer.twitchId)          platforms.push('twitch')
    if (streamer.youtubeChannelId)  platforms.push('youtube')
    if (streamer.kickUsername)      platforms.push('kick')

    for (const platform of platforms) {
      await clipCreateQueue.add('clip:create', {
        eventId: event.id, streamerId: streamer.id, platform,
      })
    }

    logger.info(
      { eventId: event.id, type: evt.eventType, platforms },
      'Event saved, clip jobs queued'
    )
  }

  await db.match.update({ where: { matchId }, data: { processed: true } })
  logger.info({ matchId: job.data.matchId }, 'Event extraction complete')
}

// suppress unused import warning — slotToIndex is used in future extensions
void slotToIndex
