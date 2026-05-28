import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import { buildApp } from '../app'
import type { FastifyInstance } from 'fastify'

const mockDb = vi.hoisted(() => ({
  clip: {
    findMany: vi.fn(),
    count:    vi.fn(),
  },
}))

const mockSearchPlayers = vi.hoisted(() => vi.fn())

vi.mock('@dota-replay/db', () => ({ db: mockDb }))
vi.mock('@dota-replay/dota-api', () => ({
  OpenDotaClient: vi.fn().mockImplementation(() => ({
    searchPlayers: mockSearchPlayers,
  })),
}))
vi.mock('../lib/queue', () => ({
  matchIngestQueue:  { add: vi.fn() },
  eventExtractQueue: { add: vi.fn() },
  clipCreateQueue:   { add: vi.fn() },
  notificationQueue: { add: vi.fn() },
  connection:        {},
}))

const mockClip = {
  id:             1,
  eventId:        1,
  streamerId:     1,
  platform:       'twitch',
  clipUrl:        'https://twitch.tv/clip/abc',
  embedUrl:       null,
  thumbnailUrl:   null,
  durationSec:    null,
  clipTitle:      null,
  platformClipId: null,
  createdAt:      new Date('2024-01-01'),
  event: {
    id:            1,
    matchId:       BigInt('7900000001'),
    eventType:     'rampage',
    gameTimeSec:   1800,
    playerSteamId: BigInt('76561198000000001'),
    victimSteamId: null,
    heroId:        1,
    contextJson:   null,
    createdAt:     new Date('2024-01-01'),
    match:         { matchId: BigInt('7900000001'), durationSeconds: 3600 },
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

  it('maps Prisma clips to ClipSearchResult shape', async () => {
    mockDb.clip.findMany.mockResolvedValue([mockClip])
    mockDb.clip.count.mockResolvedValue(1)

    const res = await app.inject({ method: 'GET', url: '/search?steamId=76561198000000001' })
    expect(res.statusCode).toBe(200)
    const clip = res.json().clips[0]
    expect(clip.clipId).toBe(1)
    expect(clip.eventType).toBe('rampage')
    expect(clip.gameTimeSec).toBe(1800)
    expect(clip.platform).toBe('twitch')
    expect(clip.clipUrl).toBe('https://twitch.tv/clip/abc')
    expect(clip.streamerName).toBe('TestStreamer')
    expect(clip.matchId).toBe('7900000001')
    expect(clip.heroId).toBe(1)
  })

  it('returns 400 when neither steamId nor name is provided', async () => {
    const res = await app.inject({ method: 'GET', url: '/search' })
    expect(res.statusCode).toBe(400)
  })
})

describe('GET /search?name=', () => {
  it('resolves display name via OpenDota and returns clips', async () => {
    mockSearchPlayers.mockResolvedValue([
      { account_id: 87276347, personaname: 'Miracle-', avatarfull: '', similarity: 1 },
    ])
    mockDb.clip.findMany.mockResolvedValue([mockClip])
    mockDb.clip.count.mockResolvedValue(1)

    const res = await app.inject({ method: 'GET', url: '/search?name=Miracle-' })
    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.resolvedDisplayName).toBe('Miracle-')
    // account_id 87276347 + offset = 76561198047542075
    expect(body.resolvedSteamId).toBe('76561198047542075')
    expect(body.clips).toHaveLength(1)
  })

  it('returns empty clips with resolvedDisplayName when name not found on OpenDota', async () => {
    mockSearchPlayers.mockResolvedValue([])

    const res = await app.inject({ method: 'GET', url: '/search?name=unknownXYZ999' })
    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.clips).toEqual([])
    expect(body.resolvedDisplayName).toBe('unknownXYZ999')
    expect(body.pagination.total).toBe(0)
  })

  it('skips anonymous results (null account_id) and returns empty when all results are anonymous', async () => {
    mockSearchPlayers.mockResolvedValue([
      { account_id: null, personaname: 'Anonymous', avatarfull: '', similarity: 0.9 },
    ])

    const res = await app.inject({ method: 'GET', url: '/search?name=Anonymous' })
    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.clips).toEqual([])
    expect(body.resolvedDisplayName).toBe('Anonymous')
  })
})
