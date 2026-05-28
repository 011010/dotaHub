export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    hasMore: boolean
  }
}

export interface SearchParams {
  steamId?: string
  name?: string
  page?: string | number
  limit?: string | number
}

export interface ClipSearchResult {
  clipId: number
  eventId: number
  eventType: string
  gameTimeSec: number
  platform: string
  clipUrl: string
  embedUrl?: string
  thumbnailUrl?: string
  streamerName?: string
  matchId: string
  heroId?: number
  createdAt: Date
}