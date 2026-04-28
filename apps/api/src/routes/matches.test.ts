import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import { buildApp } from '../app'
import type { FastifyInstance } from 'fastify'

const mockDb = vi.hoisted(() => ({
  match: {
    findMany:   vi.fn(),
    findUnique: vi.fn(),
  },
}))

const mockQueue = vi.hoisted(() => ({ add: vi.fn() }))

vi.mock('@dota-replay/db', () => ({ db: mockDb }))
vi.mock('../lib/queue', () => ({
  matchIngestQueue:  mockQueue,
  eventExtractQueue: { add: vi.fn() },
  clipCreateQueue:   { add: vi.fn() },
  notificationQueue: { add: vi.fn() },
  connection:        {},
}))

const mockMatch = {
  matchId:   BigInt('7900000001'),
  startTime: new Date('2024-01-01'),
  duration:  3600,
  processed: true,
  events:    [],
}

let app: FastifyInstance
beforeAll(async () => {
  process.env.JWT_SECRET  = 'test-secret'
  process.env.CORS_ORIGIN = 'http://localhost:3000'
  app = await buildApp()
})
afterAll(() => app.close())

describe('GET /matches/recent', () => {
  it('returns list of recent matches with matchId as string', async () => {
    mockDb.match.findMany.mockResolvedValue([mockMatch])

    const res = await app.inject({ method: 'GET', url: '/matches/recent' })
    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.matches).toHaveLength(1)
    expect(body.matches[0].matchId).toBe('7900000001')
  })

  it('respects limit and offset query params', async () => {
    mockDb.match.findMany.mockResolvedValue([])

    await app.inject({ method: 'GET', url: '/matches/recent?limit=5&offset=10' })
    expect(mockDb.match.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 5, skip: 10 })
    )
  })
})

describe('GET /matches/:id', () => {
  it('returns 200 with the match when found', async () => {
    mockDb.match.findUnique.mockResolvedValue(mockMatch)

    const res = await app.inject({ method: 'GET', url: '/matches/7900000001' })
    expect(res.statusCode).toBe(200)
    expect(res.json().match.matchId).toBe('7900000001')
  })

  it('returns 404 when match is not found', async () => {
    mockDb.match.findUnique.mockResolvedValue(null)

    const res = await app.inject({ method: 'GET', url: '/matches/9999999999' })
    expect(res.statusCode).toBe(404)
  })
})

describe('POST /matches/ingest', () => {
  it('queues the match and returns 202', async () => {
    mockDb.match.findUnique.mockResolvedValue(null)
    mockQueue.add.mockResolvedValue({ id: 'job-1' })

    const res = await app.inject({
      method:  'POST',
      url:     '/matches/ingest',
      payload: { matchId: '7900000001' },
    })
    expect(res.statusCode).toBe(202)
    expect(res.json().queued).toBe(true)
    expect(mockQueue.add).toHaveBeenCalledWith('match:ingest', { matchId: '7900000001' })
  })

  it('returns 400 when matchId is missing', async () => {
    const res = await app.inject({
      method:  'POST',
      url:     '/matches/ingest',
      payload: {},
    })
    expect(res.statusCode).toBe(400)
  })

  it('returns 400 for a non-numeric matchId', async () => {
    const res = await app.inject({
      method:  'POST',
      url:     '/matches/ingest',
      payload: { matchId: 'not-a-number' },
    })
    expect(res.statusCode).toBe(400)
  })

  it('returns 409 when match is already processed', async () => {
    mockDb.match.findUnique.mockResolvedValue({ ...mockMatch, processed: true })

    const res = await app.inject({
      method:  'POST',
      url:     '/matches/ingest',
      payload: { matchId: '7900000001' },
    })
    expect(res.statusCode).toBe(409)
  })
})
