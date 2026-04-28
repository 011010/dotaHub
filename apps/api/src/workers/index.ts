import { createWorker, QUEUES } from '../lib/queue'
import { logger } from '../lib/logger'
import { processMatch }            from './matchIngest'
import { processEventExtract }     from './eventExtract'
import { processClipCreate }       from './clipCreate'
import { processNotificationSend } from './notificationSend'
import type { MatchIngestJobData }     from './matchIngest'
import type { EventExtractJobData }    from './eventExtract'
import type { ClipCreateJobData }      from './clipCreate'
import type { NotificationJobData }    from './notificationSend'

export function startWorkers() {
  const matchIngestWorker     = createWorker<MatchIngestJobData>(QUEUES.MATCH_INGEST,  processMatch)
  const eventExtractWorker    = createWorker<EventExtractJobData>(QUEUES.EVENT_EXTRACT, processEventExtract)
  const clipCreateWorker      = createWorker<ClipCreateJobData>(QUEUES.CLIP_CREATE,    processClipCreate)
  const notificationWorker    = createWorker<NotificationJobData>(QUEUES.NOTIFICATION,  processNotificationSend)

  const workers = [matchIngestWorker, eventExtractWorker, clipCreateWorker, notificationWorker]

  for (const worker of workers) {
    worker.on('completed', (job) => {
      logger.info({ jobId: job.id, queue: worker.name }, 'Job completed')
    })
    worker.on('failed', (job, err) => {
      logger.error({ jobId: job?.id, queue: worker.name, err }, 'Job failed')
    })
  }

  logger.info('All workers started: match:ingest, event:extract, clip:create, notification:send')
}
