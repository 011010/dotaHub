import IORedis from 'ioredis'
import { Queue } from 'bullmq'

const REDIS_URL = process.env.REDIS_URL ?? 'redis://localhost:6379'
const connection = new IORedis(REDIS_URL, { maxRetriesPerRequest: null })
const eventExtractQueue = new Queue('event_extract', { connection })

const matchIds = [
  '8790186209', '8428297880', '8428072005', '8426574220', '8426467925',
  '8425335637', '8353608171', '8353549128', '8353497139', '8334932492',
  '8334854789', '8334794297', '8325503179', '8325435259', '8325378411',
  '8319900535', '8319812592', '8319699686', '8318771001', '8318697549',
  '8318631186',
]

async function main() {
  for (const matchId of matchIds) {
    await eventExtractQueue.add('event:extract', { matchId }, {
      attempts: 5,
      backoff: { type: 'exponential', delay: 30000 },
    })
    console.log(`Queued event:extract for match ${matchId}`)
  }
  await connection.quit()
  console.log('Done.')
}

main().catch(console.error)
