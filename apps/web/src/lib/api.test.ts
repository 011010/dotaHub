import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { apiFetch, api } from './api'

function mockFetch(body: unknown, status = 200) {
  return vi.fn().mockResolvedValue({
    ok:   status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    json: async () => body,
  })
}

beforeEach(() => {
  localStorage.clear()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('apiFetch', () => {
  it('returns parsed JSON on success', async () => {
    vi.stubGlobal('fetch', mockFetch({ streamers: [] }))
    const data = await apiFetch<{ streamers: unknown[] }>('/streamers')
    expect(data.streamers).toEqual([])
  })

  it('calls the correct URL', async () => {
    const spy = mockFetch({ ok: true })
    vi.stubGlobal('fetch', spy)
    await apiFetch('/streamers')
    expect(spy).toHaveBeenCalledWith(
      expect.stringContaining('/streamers'),
      expect.any(Object),
    )
  })

  it('throws when response is not ok', async () => {
    vi.stubGlobal('fetch', mockFetch({ error: 'not found' }, 404))
    await expect(apiFetch('/missing')).rejects.toThrow('API Error: 404')
  })

  it('includes Authorization header when auth_token is in localStorage', async () => {
    localStorage.setItem('auth_token', 'my-jwt-token')
    const spy = mockFetch({ user: {} })
    vi.stubGlobal('fetch', spy)

    await apiFetch('/auth/me')
    const [, options] = spy.mock.calls[0] as [string, RequestInit]
    expect((options.headers as Record<string, string>)['Authorization']).toBe('Bearer my-jwt-token')
  })

  it('does not include Authorization header without a token', async () => {
    const spy = mockFetch({ streamers: [] })
    vi.stubGlobal('fetch', spy)

    await apiFetch('/streamers')
    const [, options] = spy.mock.calls[0] as [string, RequestInit]
    expect((options.headers as Record<string, string>)['Authorization']).toBeUndefined()
  })

  it('throws abort error when fetch times out', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(
      new DOMException('Aborted', 'AbortError')
    ))
    await expect(apiFetch('/slow', undefined, 1)).rejects.toThrow('API unreachable')
  })
})

describe('api.search.bySteamId', () => {
  it('calls /search with the correct steamId and defaults', async () => {
    const spy = mockFetch({ clips: [], pagination: { total: 0, hasMore: false } })
    vi.stubGlobal('fetch', spy)

    await api.search.bySteamId('76561198000000001')
    const [url] = spy.mock.calls[0] as [string]
    expect(url).toContain('/search?steamId=76561198000000001&page=1&limit=20')
  })
})

describe('api.streamers.list', () => {
  it('calls /streamers', async () => {
    const spy = mockFetch({ streamers: [] })
    vi.stubGlobal('fetch', spy)

    await api.streamers.list()
    const [url] = spy.mock.calls[0] as [string]
    expect(url).toContain('/streamers')
  })
})

describe('api.matches.recent', () => {
  it('calls /matches/recent with default params', async () => {
    const spy = mockFetch({ matches: [] })
    vi.stubGlobal('fetch', spy)

    await api.matches.recent()
    const [url] = spy.mock.calls[0] as [string]
    expect(url).toContain('/matches/recent?limit=20&offset=0')
  })
})
