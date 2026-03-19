export type Platform = 'twitch' | 'youtube' | 'kick' | 'trovo' | 'facebook'

export interface ClipData {
  eventId: number
  streamerId: number
  platform: Platform
  clipUrl: string
  embedUrl?: string
  thumbnailUrl?: string
  durationSec?: number
  clipTitle?: string
  platformClipId?: string
}

export interface TwitchClip {
  id: string
  url: string
  embed_url: string
  thumbnail_url: string
  duration: number
  title: string
  created_at: string
}

export interface YouTubeVOD {
  id: string
  videoId: string
  title: string
  startTime: Date
  duration?: number
}