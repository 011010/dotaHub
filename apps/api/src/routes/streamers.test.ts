import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import { buildApp } from '../app'
import type { FastifyInstance } from 'fastify'

const mockDb = vi.hoisted(() => ({
  streamer: {
    findMany:   vi.fn(),
    findUnique: vi.fn(),
    create:     vi.fn(),
  },
}))

vi.mock('@dota-replay/db', () => ({ db: mockDb }))
vi.mock('../lib/queue', () => ({
  matchIngestQueue:  { add: vi.fn() },
  eventExtractQueue: { add: vi.fn() },
  clipCreateQueue:   { add: vi.fn() },
  notificationQueue: { add: vi.fn() },
  connection:        {},
}))

const mockStreamer = {
  id:              1,
  steamAccountId:  BigInt('76561198000000001'),
  displayName:     'TestStreamer',
  twitchId:        'teststreamer',
  youtubeChannelId: null,
  kickUsername:    null,
  trovoUsername:   null,
  facebookPageId:  null,
  tiktokUsername:  null,
  verified:        true,
  createdAt:       new Date('2024-01-01'),
}

let app: FastifyInstance
beforeAll(async () => {
  process.env.JWT_SECRET  = 'test-secret'
  process.env.CORS_ORIGIN = 'http://localhost:3000'
  app = await buildApp()
})
afterAll(() => app.close())

describe('GET /streamers', () => {
  it('returns a list of streamers with steamAccountId as string', async () => {
    mockDb.streamer.findMany.mockResolvedValue([mockStreamer])

    const res = await app.inject({ method: 'GET', url: '/streamers' })
    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.streamers).toHaveLength(1)
    expect(body.streamers[0].steamAccountId).toBe('76561198000000001')
    expect(body.streamers[0].displayName).toBe('TestStreamer')
  })

  it('returns empty array when no streamers exist', async () => {
    mockDb.streamer.findMany.mockResolvedValue([])
    const res = await app.inject({ method: 'GET', url: '/streamers' })
    expect(res.statusCode).toBe(200)
    expect(res.json().streamers).toEqual([])
  })
})

describe('GET /streamers/:steamId', () => {
  it('returns 200 with streamer and clips when found', async () => {
    mockDb.streamer.findUnique.mockResolvedValue({ ...mockStreamer, clips: [] })

    const res = await app.inject({ method: 'GET', url: '/streamers/76561198000000001' })
    expect(res.statusCode).toBe(200)
    expect(res.json().streamer.displayName).toBe('TestStreamer')
  })

  it('returns 404 when streamer does not exist', async () => {
    mockDb.streamer.findUnique.mockResolvedValue(null)

    const res = await app.inject({ method: 'GET', url: '/streamers/76561198000000001' })
    expect(res.statusCode).toBe(404)
    expect(res.json().error).toBe('Streamer not found')
  })
})
