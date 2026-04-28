'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { SiteHeader } from '@/components/SiteHeader'
import { api } from '@/lib/api'

// ─── Types ────────────────────────────────────────────────────────────────────

interface StreamerRecord {
  id: number
  steamAccountId: string
  displayName: string | null
  twitchId: string | null
  youtubeChannelId: string | null
  kickUsername: string | null
  trovoUsername: string | null
  facebookPageId: string | null
  tiktokUsername: string | null
  verified: boolean
  createdAt: string
  clips?: unknown[]
}

type Platform = 'twitch' | 'youtube' | 'kick' | 'trovo' | 'facebook'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PLATFORM_META: Record<Platform, { label: string; color: string; accent: string; handle: (s: StreamerRecord) => string | null }> = {
  twitch:   { label: 'Twitch',   color: 'text-purple-400', accent: '#a855f7', handle: s => s.twitchId },
  youtube:  { label: 'YouTube',  color: 'text-red-400',    accent: '#ef4444', handle: s => s.youtubeChannelId },
  kick:     { label: 'Kick',     color: 'text-green-400',  accent: '#22c55e', handle: s => s.kickUsername },
  trovo:    { label: 'Trovo',    color: 'text-blue-400',   accent: '#3b82f6', handle: s => s.trovoUsername },
  facebook: { label: 'Facebook', color: 'text-blue-500',   accent: '#3b82f6', handle: s => s.facebookPageId },
}

const PLATFORM_ORDER: Platform[] = ['twitch', 'youtube', 'kick', 'trovo', 'facebook']

function getPlatforms(s: StreamerRecord): Platform[] {
  return PLATFORM_ORDER.filter(p => PLATFORM_META[p].handle(s))
}

function primaryPlatform(s: StreamerRecord): Platform | null {
  return getPlatforms(s)[0] ?? null
}

function shortSteamId(id: string) {
  return id.length > 10 ? `…${id.slice(-8)}` : id
}

// ─── Platform badge ───────────────────────────────────────────────────────────

function PlatformBadge({ platform }: { platform: Platform }) {
  const { label, color } = PLATFORM_META[platform]
  return (
    <span className={`rounded bg-white/[0.06] px-2 py-0.5 text-[9px] uppercase tracking-widest ${color}`}>
      {label}
    </span>
  )
}

// ─── Streamer card ────────────────────────────────────────────────────────────

function StreamerCard({ streamer }: { streamer: StreamerRecord }) {
  const platforms = getPlatforms(streamer)
  const primary = primaryPlatform(streamer)
  const accentColor = primary ? PLATFORM_META[primary].accent : 'rgba(255,255,255,0.2)'
  const clipCount = streamer.clips?.length ?? null
  const name = streamer.displayName ?? `Streamer #${streamer.id}`

  return (
    <Link
      href={`/streamers/${streamer.steamAccountId}`}
      className="group relative flex flex-col overflow-hidden border border-white/[0.08] bg-white/[0.03] backdrop-blur-sm transition-all duration-300 hover:border-white/20 hover:bg-white/[0.06]"
      style={{ '--accent': accentColor } as React.CSSProperties}
    >
      {/* Top accent bar */}
      <div
        className="h-px w-full transition-all duration-500 group-hover:opacity-100"
        style={{ background: `linear-gradient(90deg, transparent, ${accentColor}80, transparent)`, opacity: 0.5 }}
      />

      <div className="flex flex-1 flex-col gap-3 p-5">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2">
          {/* Name + verified */}
          <div className="flex flex-col gap-1">
            <h2 className="font-display text-sm font-bold uppercase tracking-[0.06em] text-white/90">
              {name}
            </h2>
            {streamer.verified && (
              <span className="flex items-center gap-1 text-[9px] uppercase tracking-[0.3em] text-amber-400/80">
                <svg className="h-2.5 w-2.5 fill-current" viewBox="0 0 16 16">
                  <path d="M8 0l1.8 3.6 4 .6-2.9 2.8.7 4L8 9l-3.6 1.9.7-4L2.2 4.2l4-.6L8 0z" />
                </svg>
                Verified
              </span>
            )}
          </div>

          {/* Platform badges */}
          {platforms.length > 0 && (
            <div className="flex flex-wrap justify-end gap-1">
              {platforms.map(p => <PlatformBadge key={p} platform={p} />)}
            </div>
          )}
        </div>

        {/* Platform handles */}
        {platforms.length > 0 && (
          <div className="flex flex-col gap-0.5">
            {platforms.map(p => {
              const handle = PLATFORM_META[p].handle(streamer)
              const { color, label } = PLATFORM_META[p]
              return (
                <p key={p} className="text-[11px] text-white/35">
                  <span className={`${color} mr-1.5`}>{label}</span>
                  <span className="font-mono">{handle}</span>
                </p>
              )
            })}
          </div>
        )}

        {/* Footer */}
        <div className="mt-auto flex items-center justify-between border-t border-white/[0.06] pt-3">
          <span className="font-mono text-[9px] text-white/20">
            {shortSteamId(streamer.steamAccountId)}
          </span>
          {clipCount !== null && (
            <span className="text-[10px] text-white/40">
              <span className="font-display text-white/70">{clipCount}</span>{' '}
              clip{clipCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}

// ─── Skeleton card ────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="flex flex-col gap-3 border border-white/[0.06] bg-white/[0.02] p-5">
      <div className="flex items-start justify-between">
        <div className="h-3 w-32 rounded bg-white/[0.06] animate-pulse" />
        <div className="h-4 w-14 rounded bg-white/[0.04] animate-pulse" />
      </div>
      <div className="h-2 w-24 rounded bg-white/[0.04] animate-pulse" />
      <div className="mt-auto flex items-center justify-between border-t border-white/[0.04] pt-3">
        <div className="h-2 w-16 rounded bg-white/[0.04] animate-pulse" />
        <div className="h-2 w-10 rounded bg-white/[0.04] animate-pulse" />
      </div>
    </div>
  )
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-4 py-20 text-center">
      <div className="font-display text-[10px] uppercase tracking-[0.5em] text-white/25">
        No streamers indexed
      </div>
      <p className="max-w-sm text-sm text-white/35">
        No pro streamers have been added to the archive yet. Check back soon.
      </p>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function StreamersPage() {
  const [streamers, setStreamers] = useState<StreamerRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api.streamers.list()
      .then(data => {
        setStreamers((data as unknown as { streamers: StreamerRecord[] }).streamers)
      })
      .catch(() => {
        setStreamers([])
      })
      .finally(() => setLoading(false))
  }, [])

  const totalClips = streamers.reduce((acc, s) => acc + (s.clips?.length ?? 0), 0)

  return (
    <div className="relative min-h-screen">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at 50% 0%, #0d0a1a 0%, #070408 40%, #030203 100%)',
        }}
      />

      <div className="relative z-10 flex min-h-screen flex-col">
        <SiteHeader />

        <div className="mx-auto w-full max-w-5xl flex-1 px-6 pb-16 sm:px-10">

          {/* Heading */}
          <div className="mb-10 mt-4">
            <p className="mb-2 text-[10px] uppercase tracking-[0.5em] text-white/35">
              Pro archive
            </p>
            <h1
              className="font-display text-3xl font-black uppercase tracking-[0.04em] text-[#f5ede0] sm:text-4xl"
              style={{ textShadow: '0 0 40px rgba(120, 80, 255, 0.2)' }}
            >
              The Roster
            </h1>

            {/* Stats */}
            {!loading && !error && streamers.length > 0 && (
              <p className="mt-3 text-[11px] text-white/35">
                <span className="font-display text-white/60">{streamers.length}</span> streamer{streamers.length !== 1 ? 's' : ''}{' '}
                {totalClips > 0 && (
                  <>
                    ·{' '}
                    <span className="font-display text-white/60">{totalClips}</span> clip{totalClips !== 1 ? 's' : ''} archived
                  </>
                )}
              </p>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="mb-8 border border-red-400/20 bg-red-400/5 px-5 py-4 text-sm text-red-400">
              {error}
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          )}

          {/* Empty */}
          {!loading && !error && streamers.length === 0 && <EmptyState />}

          {/* Grid */}
          {!loading && streamers.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {streamers.map(s => <StreamerCard key={s.id} streamer={s} />)}
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
