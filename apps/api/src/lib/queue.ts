import { Queue, Worker, Job } from 'bullmq'
import IORedis from 'ioredis'
import { logger } from './logger'

const REDIS_URL = process.env.REDIS_URL ?? 'redis://localhost:6379'

export const connection = new IORedis(REDIS_URL, {
  maxRetriesPerRequest: null,
})

export const QUEUES = {
  MATCH_INGEST:  'match_ingest',
  EVENT_EXTRACT: 'event_extract',
  CLIP_CREATE:   'clip_create',
  NOTIFICATION:  'notification_send',
} as const

export const matchIngestQueue  = new Queue(QUEUES.MATCH_INGEST,  { connection })
export const eventExtractQueue = new Queue(QUEUES.EVENT_EXTRACT, { connection })
export const clipCreateQueue   = new Queue(QUEUES.CLIP_CREATE,   { connection })
export const notificationQueue = new Queue(QUEUES.NOTIFICATION,  { connection })

export function createWorker<T>(
  queueName: string,
  processor: (job: Job<T>) => Promise<void>
): Worker<T> {
  return new Worker<T>(
    queueName,
    async (job) => {
      logger.info({ jobId: job.id, queueName }, 'Processing job')
      try {
        await processor(job)
        logger.info({ jobId: job.id, queueName }, 'Job completed')
      } catch (error) {
        logger.error({ jobId: job.id, queueName, error }, 'Job failed')
        throw error
      }
    },
    { connection }
  )
}
