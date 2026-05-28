import IORedis from 'ioredis'
import { Queue } from 'bullmq'

const REDIS_URL = process.env.REDIS_URL ?? 'redis://localhost:6379'
const connection = new IORedis(REDIS_URL, { maxRetriesPerRequest: null })
const clipCreateQueue = new Queue('clip_create', { connection })

// All event IDs (1-31) belong to Gorgc (streamerId=8), platform=twitch
const STREAMER_ID = 8
const PLATFORM = 'twitch'
const EVENT_IDS = Array.from({ length: 31 }, (_, i) => i + 1)

async function main() {
  for (const eventId of EVENT_IDS) {
    await clipCreateQueue.add('clip:create', { eventId, streamerId: STREAMER_ID, platform: PLATFORM }, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 10000 },
    })
    console.log(`Queued clip:create for event ${eventId}`)
  }
  await connection.quit()
  console.log('Done.')
}

main().catch(console.error)
