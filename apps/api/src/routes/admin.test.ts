import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import { buildApp } from '../app'
import type { FastifyInstance } from 'fastify'

const ADMIN_KEY = 'test-admin-secret'

const mockDb = vi.hoisted(() => ({
  streamer: {
    findMany: vi.fn(),
    upsert:   vi.fn(),
    delete:   vi.fn(),
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
  verified:        false,
  createdAt:       new Date('2024-01-01'),
}

let app: FastifyInstance
beforeAll(async () => {
  process.env.JWT_SECRET   = 'test-secret'
  process.env.CORS_ORIGIN  = 'http://localhost:3000'
  process.env.ADMIN_SECRET = ADMIN_KEY
  app = await buildApp()
})
afterAll(() => app.close())

describe('Admin auth', () => {
  it('returns 403 without the admin key', async () => {
    const res = await app.inject({ method: 'GET', url: '/admin/streamers' })
    expect(res.statusCode).toBe(403)
  })

  it('returns 403 with a wrong key', async () => {
    const res = await app.inject({
      method:  'GET',
      url:     '/admin/streamers',
      headers: { 'x-admin-key': 'wrong-key' },
    })
    expect(res.statusCode).toBe(403)
  })
})

describe('GET /admin/streamers', () => {
  it('returns streamers list with correct admin key', async () => {
    mockDb.streamer.findMany.mockResolvedValue([mockStreamer])

    const res = await app.inject({
      method:  'GET',
      url:     '/admin/streamers',
      headers: { 'x-admin-key': ADMIN_KEY },
    })
    expect(res.statusCode).toBe(200)
    expect(res.json().streamers[0].steamAccountId).toBe('76561198000000001')
  })
})

describe('POST /admin/streamers', () => {
  it('creates/upserts a streamer and returns 201', async () => {
    mockDb.streamer.upsert.mockResolvedValue(mockStreamer)

    const res = await app.inject({
      method:  'POST',
      url:     '/admin/streamers',
      headers: { 'x-admin-key': ADMIN_KEY },
      payload: { steamAccountId: '76561198000000001', displayName: 'TestStreamer', twitchId: 'teststreamer' },
    })
    expect(res.statusCode).toBe(201)
    expect(res.json().streamer.steamAccountId).toBe('76561198000000001')
  })

  it('returns 400 when steamAccountId is missing', async () => {
    const res = await app.inject({
      method:  'POST',
      url:     '/admin/streamers',
      headers: { 'x-admin-key': ADMIN_KEY },
      payload: { displayName: 'No ID' },
    })
    expect(res.statusCode).toBe(400)
  })

  it('returns 400 for a non-numeric steamAccountId', async () => {
    const res = await app.inject({
      method:  'POST',
      url:     '/admin/streamers',
      headers: { 'x-admin-key': ADMIN_KEY },
      payload: { steamAccountId: 'not-a-number' },
    })
    expect(res.statusCode).toBe(400)
  })
})

describe('DELETE /admin/streamers/:steamId', () => {
  it('deletes a streamer and returns ok', async () => {
    mockDb.streamer.delete.mockResolvedValue(mockStreamer)

    const res = await app.inject({
      method:  'DELETE',
      url:     '/admin/streamers/76561198000000001',
      headers: { 'x-admin-key': ADMIN_KEY },
    })
    expect(res.statusCode).toBe(200)
    expect(res.json().ok).toBe(true)
  })
})
