import { createWorker } from '../lib/queue'
import { processMatch } from './matchIngest'
import { QUEUES } from '../lib/queue'

export const matchIngestWorker = createWorker(QUEUES.MATCH_INGEST, processMatch)

export function startWorkers() {
  matchIngestWorker.on('completed', (job) => {
    console.log(`Job ${job.id} completed`)
  })

  matchIngestWorker.on('failed', (job, err) => {
    console.error(`Job ${job?.id} failed:`, err)
  })
}