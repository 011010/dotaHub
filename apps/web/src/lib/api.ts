const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

export async function apiFetch<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `${API_BASE}${endpoint}`
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`)
  }

  return response.json()
}

export const api = {
  search: {
    bySteamId: (steamId: string, page = 1, limit = 20) =>
      apiFetch<{ clips: unknown[]; pagination: { total: number; hasMore: boolean } }>(
        `/search?steamId=${steamId}&page=${page}&limit=${limit}`
      ),
  },
  matches: {
    recent: (limit = 20, offset = 0) =>
      apiFetch<{ matches: unknown[] }>(`/matches/recent?limit=${limit}&offset=${offset}`),
    get: (id: string) => apiFetch<{ match: unknown }>(`/matches/${id}`),
  },
  streamers: {
    list: () => apiFetch<{ streamers: unknown[] }>('/streamers'),
    get: (steamId: string) => apiFetch<{ streamer: unknown }>(`/streamers/${steamId}`),
  },
}