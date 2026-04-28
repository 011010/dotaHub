'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { SiteHeader } from '@/components/SiteHeader'
import { apiFetch } from '@/lib/api'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ClipEvent {
  id:          number
  eventType:   string
  gameTimeSec: number
  heroId:      number | null
}

interface StreamerClip {
  id:             number
  platform:       string
  clipUrl:        string
  embedUrl:       string | null
  thumbnailUrl:   string | null
  durationSec:    number | null
  clipTitle:      string | null
  platformClipId: string | null
  createdAt:      string
  event:          ClipEvent
}

interface StreamerDetail {
  id:               number
  steamAccountId:   string
  displayName:      string | null
  twitchId:         string | null
  youtubeChannelId: string | null
  kickUsername:     string | null
  trovoUsername:    string | null
  facebookPageId:   string | null
  tiktokUsername:   string | null
  verified:         boolean
  createdAt:        string
  clips:            StreamerClip[]
}

type Platform = 'twitch' | 'youtube' | 'kick' | 'trovo' | 'facebook'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PLATFORM_META: Record<Platform, {
  label:   string
  color:   string
  accent:  string
  handle:  (s: StreamerDetail) => string | null
  url:     (handle: string) => string
}> = {
  twitch:   { label: 'Twitch',   color: 'text-purple-400', accent: '#a855f7', handle: s => s.twitchId,         url: h => `https://twitch.tv/${h}` },
  youtube:  { label: 'YouTube',  color: 'text-red-400',    accent: '#ef4444', handle: s => s.youtubeChannelId,  url: h => `https://youtube.com/channel/${h}` },
  kick:     { label: 'Kick',     color: 'text-green-400',  accent: '#22c55e', handle: s => s.kickUsername,      url: h => `https://kick.com/${h}` },
  trovo:    { label: 'Trovo',    color: 'text-blue-400',   accent: '#3b82f6', handle: s => s.trovoUsername,     url: h => `https://trovo.live/${h}` },
  facebook: { label: 'Facebook', color: 'text-blue-500',   accent: '#3b82f6', handle: s => s.facebookPageId,   url: h => `https://facebook.com/${h}` },
}

const PLATFORM_ORDER: Platform[] = ['twitch', 'youtube', 'kick', 'trovo', 'facebook']

const EVENT_LABELS: Record<string, string> = {
  rampage:        'RAMPAGE',
  ultra_kill:     'ULTRA KILL',
  triple_kill:    'TRIPLE KILL',
  first_blood:    'FIRST BLOOD',
  aegis_steal:    'AEGIS STEAL',
  team_wipe:      'TEAM WIPE',
  comeback:       'COMEBACK',
  courier_snipe:  'COURIER SNIPE',
  mega_creeps_win:'MEGA CREEPS',
  base_race:      'BASE RACE',
}

const EVENT_COLORS: Record<string, string> = {
  rampage:         'text-red-400 border-red-400/40 bg-red-400/10',
  ultra_kill:      'text-orange-400 border-orange-400/40 bg-orange-400/10',
  team_wipe:       'text-red-300 border-red-300/40 bg-red-300/10',
  aegis_steal:     'text-yellow-300 border-yellow-300/40 bg-yellow-300/10',
  mega_creeps_win: 'text-yellow-400 border-yellow-400/40 bg-yellow-400/10',
  base_race:       'text-orange-300 border-orange-300/40 bg-orange-300/10',
  triple_kill:     'text-amber-400 border-amber-400/40 bg-amber-400/10',
  first_blood:     'text-amber-300 border-amber-300/40 bg-amber-300/10',
  comeback:        'text-blue-300 border-blue-300/40 bg-blue-300/10',
  courier_snipe:   'text-white/50 border-white/20 bg-white/5',
}

const PLATFORM_COLORS: Record<string, string> = {
  twitch:   'text-purple-400',
  youtube:  'text-red-400',
  kick:     'text-green-400',
  trovo:    'text-blue-400',
  facebook: 'text-blue-500',
}

function getPlatforms(s: StreamerDetail) {
  return PLATFORM_ORDER.filter(p => PLATFORM_META[p].handle(s))
}

function primaryAccent(s: StreamerDetail): string {
  const primary = getPlatforms(s)[0]
  return primary ? PLATFORM_META[primary].accent : 'rgba(255,255,255,0.2)'
}

function formatGameTime(seconds: number) {
  if (seconds < 0) return '—'
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// ─── Clip card ────────────────────────────────────────────────────────────────

function ClipCard({ clip }: { clip: StreamerClip }) {
  const eventLabel = EVENT_LABELS[clip.event.eventType] ?? clip.event.eventType.toUpperCase()
  const eventColor = EVENT_COLORS[clip.event.eventType] ?? 'text-white/50 border-white/20 bg-white/5'
  const platformColor = PLATFORM_COLORS[clip.platform] ?? 'text-white/60'

  return (
    <a
      href={clip.clipUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative flex flex-col overflow-hidden border border-white/[0.08] bg-white/[0.03] backdrop-blur-sm transition-all duration-300 hover:border-white/20 hover:bg-white/[0.06]"
    >
      {/* Thumbnail */}
      <div className="relative aspect-video w-full overflow-hidden bg-white/[0.04]">
        {clip.thumbnailUrl ? (
          <img
            src={clip.thumbnailUrl}
            alt={eventLabel}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="font-display text-3xl font-black text-white/10 tracking-widest">
              {eventLabel.slice(0, 2)}
            </span>
          </div>
        )}
        {/* Play overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black/60 backdrop-blur-sm">
            <svg className="h-5 w-5 translate-x-0.5 text-white" fill="currentColor" viewBox="0 0 16 16">
              <path d="M6 3.5l7 4.5-7 4.5V3.5z" />
            </svg>
          </div>
        </div>
        {/* Platform badge */}
        <span className={`absolute bottom-2 right-2 rounded bg-black/70 px-1.5 py-0.5 text-[10px] backdrop-blur-sm uppercase tracking-widest ${platformColor}`}>
          {clip.platform}
        </span>
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <span className={`inline-flex items-center rounded-sm border px-2 py-0.5 font-display text-[10px] tracking-[0.2em] ${eventColor}`}>
            {eventLabel}
          </span>
          {clip.event.heroId && (
            <span className="text-[10px] text-white/30">Hero #{clip.event.heroId}</span>
          )}
        </div>
        {clip.clipTitle && (
          <p className="line-clamp-1 text-[11px] text-white/50">{clip.clipTitle}</p>
        )}
        <div className="mt-auto flex items-center justify-between text-[10px] text-white/35">
          <span>Game time {formatGameTime(clip.event.gameTimeSec)}</span>
          <span>{formatDate(clip.createdAt)}</span>
        </div>
      </div>
    </a>
  )
}

// ─── Platform link button ─────────────────────────────────────────────────────

function PlatformLink({ platform, streamer }: { platform: Platform; streamer: StreamerDetail }) {
  const meta   = PLATFORM_META[platform]
  const handle = meta.handle(streamer)
  if (!handle) return null
  return (
    <a
      href={meta.url(handle)}
      target="_blank"
      rel="noopener noreferrer"
      className={`flex items-center gap-2 rounded border border-white/10 bg-white/[0.04] px-4 py-2 text-[11px] uppercase tracking-widest backdrop-blur-sm transition-all hover:border-white/30 hover:bg-white/[0.08] ${meta.color}`}
    >
      <span className="font-display">{meta.label}</span>
      <span className="font-mono text-white/40 normal-case tracking-normal">{handle}</span>
    </a>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="flex flex-col border border-white/[0.06] bg-white/[0.02]">
      <div className="aspect-video w-full animate-pulse bg-white/[0.04]" />
      <div className="flex flex-col gap-2 p-4">
        <div className="h-4 w-24 animate-pulse rounded bg-white/[0.06]" />
        <div className="h-2 w-32 animate-pulse rounded bg-white/[0.04]" />
        <div className="mt-2 flex justify-between">
          <div className="h-2 w-20 animate-pulse rounded bg-white/[0.04]" />
          <div className="h-2 w-16 animate-pulse rounded bg-white/[0.04]" />
        </div>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type State =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'done'; streamer: StreamerDetail }

export default function StreamerDetailPage() {
  const params  = useParams()
  const steamId = params.steamId as string
  const [state, setState] = useState<State>({ status: 'loading' })

  useEffect(() => {
    apiFetch<{ streamer: StreamerDetail }>(`/streamers/${steamId}`)
      .then(data => setState({ status: 'done', streamer: data.streamer }))
      .catch(err => setState({ status: 'error', message: err instanceof Error ? err.message : 'Failed to load streamer' }))
  }, [steamId])

  const streamer = state.status === 'done' ? state.streamer : null
  const accent   = streamer ? primaryAccent(streamer) : 'rgba(255,255,255,0.15)'
  const platforms = streamer ? getPlatforms(streamer) : []

  return (
    <div className="relative min-h-screen">
      {/* Background — same violet tint as /streamers but with accent bleed */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `radial-gradient(ellipse at 50% 0%, #0d0a1a 0%, #070408 40%, #030203 100%)`,
        }}
      />
      {streamer && (
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-96 opacity-10"
          style={{ background: `radial-gradient(ellipse at 50% 0%, ${accent} 0%, transparent 70%)` }}
        />
      )}

      <div className="relative z-10 flex min-h-screen flex-col">
        <SiteHeader />

        <div className="mx-auto w-full max-w-5xl flex-1 px-6 pb-16 sm:px-10">

          {/* Error */}
          {state.status === 'error' && (
            <div className="mb-8 border border-red-400/20 bg-red-400/5 px-5 py-4 text-sm text-red-400">
              {state.message}
            </div>
          )}

          {/* Loading hero */}
          {state.status === 'loading' && (
            <div className="mb-10 mt-4">
              <div className="mb-3 h-2 w-20 animate-pulse rounded bg-white/[0.06]" />
              <div className="h-9 w-56 animate-pulse rounded bg-white/[0.08]" />
            </div>
          )}

          {/* Streamer hero */}
          {streamer && (
            <div className="mb-10 mt-4">
              {/* Back */}
              <Link
                href="/streamers"
                className="mb-6 inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.35em] text-white/30 transition-colors hover:text-white/70"
              >
                ← Roster
              </Link>

              <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="mb-2 text-[10px] uppercase tracking-[0.5em] text-white/35">
                    Pro streamer
                  </p>
                  <h1
                    className="font-display text-3xl font-black uppercase tracking-[0.04em] text-[#f5ede0] sm:text-4xl"
                    style={{ textShadow: `0 0 40px ${accent}33` }}
                  >
                    {streamer.displayName ?? `Streamer #${streamer.id}`}
                  </h1>

                  {streamer.verified && (
                    <span className="mt-2 inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.3em] text-amber-400/80">
                      <svg className="h-3 w-3 fill-current" viewBox="0 0 16 16">
                        <path d="M8 0l1.8 3.6 4 .6-2.9 2.8.7 4L8 9l-3.6 1.9.7-4L2.2 4.2l4-.6L8 0z" />
                      </svg>
                      Verified
                    </span>
                  )}
                </div>

                {/* Stats */}
                <div className="flex items-center gap-6 text-[11px] text-white/40">
                  <div className="flex flex-col items-end gap-0.5">
                    <span className="font-display text-lg text-white/70">{streamer.clips.length}</span>
                    <span className="uppercase tracking-widest">Clips</span>
                  </div>
                  <div className="flex flex-col items-end gap-0.5">
                    <span className="font-display text-lg text-white/70">{platforms.length}</span>
                    <span className="uppercase tracking-widest">Platforms</span>
                  </div>
                </div>
              </div>

              {/* Platform links */}
              {platforms.length > 0 && (
                <div className="mt-6 flex flex-wrap gap-2">
                  {platforms.map(p => (
                    <PlatformLink key={p} platform={p} streamer={streamer} />
                  ))}
                </div>
              )}

              {/* Divider */}
              <div
                className="mt-8 h-px w-full"
                style={{ background: `linear-gradient(90deg, ${accent}40, transparent)` }}
              />
            </div>
          )}

          {/* Clips section heading */}
          {streamer && (
            <div className="mb-6">
              <p className="text-[10px] uppercase tracking-[0.5em] text-white/30">
                Archived clips
              </p>
            </div>
          )}

          {/* Clips grid — loading */}
          {state.status === 'loading' && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          )}

          {/* Clips grid — done */}
          {streamer && streamer.clips.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {streamer.clips.map(clip => (
                <ClipCard key={clip.id} clip={clip} />
              ))}
            </div>
          )}

          {/* Empty clips */}
          {streamer && streamer.clips.length === 0 && (
            <div className="flex flex-col items-center gap-4 py-20 text-center">
              <div className="font-display text-[10px] uppercase tracking-[0.5em] text-white/25">
                No clips yet
              </div>
              <p className="max-w-sm text-sm text-white/35">
                No clips have been archived for this streamer yet. Check back after matches are processed.
              </p>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
