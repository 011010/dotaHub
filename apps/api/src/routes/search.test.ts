import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import { buildApp } from '../app'
import type { FastifyInstance } from 'fastify'

const mockDb = vi.hoisted(() => ({
  clip: {
    findMany: vi.fn(),
    count:    vi.fn(),
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

const mockClip = {
  id:        1,
  url:       'https://twitch.tv/clip/abc',
  createdAt: new Date('2024-01-01'),
  event: {
    id:            1,
    type:          'rampage',
    playerSteamId: BigInt('76561198000000001'),
    match:         { matchId: BigInt('7900000001'), duration: 3600 },
  },
  streamer: {
    id:             1,
    steamAccountId: BigInt('76561198000000001'),
    displayName:    'TestStreamer',
    twitchId:       'teststreamer',
    verified:       true,
  },
}

let app: FastifyInstance
beforeAll(async () => {
  process.env.JWT_SECRET  = 'test-secret'
  process.env.CORS_ORIGIN = 'http://localhost:3000'
  app = await buildApp()
})
afterAll(() => app.close())

describe('GET /search', () => {
  it('returns clips with pagination for a valid steamId', async () => {
    mockDb.clip.findMany.mockResolvedValue([mockClip])
    mockDb.clip.count.mockResolvedValue(1)

    const res = await app.inject({
      method: 'GET',
      url:    '/search?steamId=76561198000000001',
    })
    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.clips).toHaveLength(1)
    expect(body.pagination.total).toBe(1)
    expect(body.pagination.hasMore).toBe(false)
  })

  it('returns empty clips when no results found', async () => {
    mockDb.clip.findMany.mockResolvedValue([])
    mockDb.clip.count.mockResolvedValue(0)

    const res = await app.inject({
      method: 'GET',
      url:    '/search?steamId=76561198000000001',
    })
    expect(res.statusCode).toBe(200)
    expect(res.json().clips).toEqual([])
    expect(res.json().pagination.hasMore).toBe(false)
  })

  it('calculates hasMore correctly across pages', async () => {
    mockDb.clip.findMany.mockResolvedValue(Array(20).fill(mockClip))
    mockDb.clip.count.mockResolvedValue(50)

    const res = await app.inject({
      method: 'GET',
      url:    '/search?steamId=76561198000000001&page=1&limit=20',
    })
    expect(res.json().pagination.hasMore).toBe(true)
  })
})
