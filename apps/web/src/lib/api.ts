import type { ClipSearchResult, StreamerData } from '@dota-replay/types'

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

export async function apiFetch<T>(endpoint: string, options?: RequestInit, timeoutMs = 8000): Promise<T> {
  const url        = `${API_BASE}${endpoint}`
  const controller = new AbortController()
  const timer      = setTimeout(() => controller.abort(), timeoutMs)

  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options?.headers,
      },
    })
    if (!response.ok) throw new Error(`API Error: ${response.status} ${response.statusText}`)
    return response.json()
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new Error('API unreachable — make sure the server is running')
    }
    throw err
  } finally {
    clearTimeout(timer)
  }
}

export const api = {
  search: {
    bySteamId: (steamId: string, page = 1, limit = 20) =>
      apiFetch<{ clips: ClipSearchResult[]; pagination: { total: number; hasMore: boolean } }>(
        `/search?steamId=${steamId}&page=${page}&limit=${limit}`
      ),
  },
  matches: {
    recent: (limit = 20, offset = 0) =>
      apiFetch<{ matches: unknown[] }>(`/matches/recent?limit=${limit}&offset=${offset}`),
    get: (id: string) => apiFetch<{ match: unknown }>(`/matches/${id}`),
  },
  streamers: {
    list: () => apiFetch<{ streamers: StreamerData[] }>('/streamers'),
    get: (steamId: string) => apiFetch<{ streamer: StreamerData }>(`/streamers/${steamId}`),
  },
}
