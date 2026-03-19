import { Job } from 'bullmq'
import { db } from '@dota-replay/db'
import { OpenDotaClient } from '@dota-replay/dota-api'
import { logger } from '../lib/logger'

const openDota = new OpenDotaClient()

export interface MatchIngestJobData {
  matchId: bigint
}

export async function processMatch(job: Job<MatchIngestJobData>): Promise<void> {
  const { matchId } = job.data

  logger.info({ matchId: matchId.toString() }, 'Processing match')

  const existingMatch = await db.match.findUnique({
    where: { matchId },
  })

  if (existingMatch) {
    logger.info({ matchId: matchId.toString() }, 'Match already exists')
    return
  }

  const matchData = await openDota.getMatch(matchId)

  await db.match.create({
    data: {
      matchId,
      startTime: new Date(matchData.start_time * 1000),
      durationSeconds: matchData.duration,
      gameMode: matchData.game_mode,
      radiantWin: matchData.radiant_win,
      avgRank: matchData.avg_rank_tier,
      processed: false,
    },
  })

  logger.info({ matchId: matchId.toString() }, 'Match ingested successfully')
}