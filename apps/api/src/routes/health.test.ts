import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import { buildApp } from '../app'
import type { FastifyInstance } from 'fastify'

vi.mock('@dota-replay/db', () => ({ db: {} }))
vi.mock('../lib/queue', () => ({
  matchIngestQueue:  { add: vi.fn() },
  eventExtractQueue: { add: vi.fn() },
  clipCreateQueue:   { add: vi.fn() },
  notificationQueue: { add: vi.fn() },
  connection:        {},
}))

let app: FastifyInstance
beforeAll(async () => {
  process.env.JWT_SECRET  = 'test-secret'
  process.env.CORS_ORIGIN = 'http://localhost:3000'
  app = await buildApp()
})
afterAll(() => app.close())

describe('GET /health', () => {
  it('returns 200 with status ok', async () => {
    const res = await app.inject({ method: 'GET', url: '/health' })
    expect(res.statusCode).toBe(200)
    expect(res.json()).toMatchObject({ status: 'ok' })
  })
})
