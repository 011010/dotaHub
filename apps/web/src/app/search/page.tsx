'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import type { ClipSearchResult } from '@dota-replay/types'
import { api } from '@/lib/api'
import { SiteHeader } from '@/components/SiteHeader'

// ─── Helpers ──────────────────────────────────────────────────────────────────

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
  rampage:        'text-red-400 border-red-400/40 bg-red-400/10',
  ultra_kill:     'text-orange-400 border-orange-400/40 bg-orange-400/10',
  team_wipe:      'text-red-300 border-red-300/40 bg-red-300/10',
  aegis_steal:    'text-yellow-300 border-yellow-300/40 bg-yellow-300/10',
  mega_creeps_win:'text-yellow-400 border-yellow-400/40 bg-yellow-400/10',
  base_race:      'text-orange-300 border-orange-300/40 bg-orange-300/10',
  triple_kill:    'text-amber-400 border-amber-400/40 bg-amber-400/10',
  first_blood:    'text-amber-300 border-amber-300/40 bg-amber-300/10',
  comeback:       'text-blue-300 border-blue-300/40 bg-blue-300/10',
  courier_snipe:  'text-white/50 border-white/20 bg-white/5',
}

const PLATFORM_COLORS: Record<string, string> = {
  twitch:   'text-purple-400',
  youtube:  'text-red-400',
  kick:     'text-green-400',
  trovo:    'text-blue-400',
  facebook: 'text-blue-500',
}

function formatGameTime(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

// ─── Clip card ────────────────────────────────────────────────────────────────

function ClipCard({ clip }: { clip: ClipSearchResult }) {
  const eventLabel = EVENT_LABELS[clip.eventType] ?? clip.eventType.toUpperCase()
  const eventColor = EVENT_COLORS[clip.eventType] ?? 'text-white/50 border-white/20 bg-white/5'
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
        {/* Platform badge on thumbnail */}
        <span className={`absolute bottom-2 right-2 rounded bg-black/70 px-1.5 py-0.5 text-[10px] backdrop-blur-sm uppercase tracking-widest ${platformColor}`}>
          {clip.platform}
        </span>
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <span
            className={`inline-flex items-center rounded-sm border px-2 py-0.5 font-display text-[10px] tracking-[0.2em] ${eventColor}`}
          >
            {eventLabel}
          </span>
          {clip.heroId && (
            <span className="text-[10px] text-white/30">
              Hero #{clip.heroId}
            </span>
          )}
        </div>

        {clip.streamerName && (
          <p className="text-sm font-medium text-white/80">{clip.streamerName}</p>
        )}

        <div className="mt-auto flex items-center justify-between text-[10px] text-white/35">
          <span>Game time {formatGameTime(clip.gameTimeSec)}</span>
          <span>{formatDate(clip.createdAt)}</span>
        </div>
      </div>
    </a>
  )
}

// ─── Empty states ─────────────────────────────────────────────────────────────

function EmptyPrompt() {
  return (
    <div className="flex flex-col items-center gap-4 py-16 text-center">
      <div className="font-display text-[10px] uppercase tracking-[0.5em] text-white/30">
        Awaiting invocation
      </div>
      <p className="max-w-sm text-sm text-white/40">
        Enter your Steam ID above to discover every clip where a pro streamer crossed paths with you.
      </p>
    </div>
  )
}

function NoResults({ steamId }: { steamId: string }) {
  return (
    <div className="flex flex-col items-center gap-4 py-16 text-center">
      <div className="font-display text-[10px] uppercase tracking-[0.5em] text-white/30">
        No clips found
      </div>
      <p className="max-w-sm text-sm text-white/40">
        No clips found for Steam ID{' '}
        <span className="font-mono text-white/60">{steamId}</span>. Try a different ID or check back later as new matches are indexed.
      </p>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type SearchState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'done'; clips: ClipSearchResult[]; total: number; steamId: string }

export default function SearchPage() {
  const [steamId, setSteamId] = useState('')
  const [state, setState] = useState<SearchState>({ status: 'idle' })
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    const id = steamId.trim()
    if (!id) { inputRef.current?.focus(); return }

    setState({ status: 'loading' })
    try {
      const data = await api.search.bySteamId(id)
      setState({ status: 'done', clips: data.clips, total: data.pagination.total, steamId: id })
    } catch (err) {
      setState({ status: 'error', message: err instanceof Error ? err.message : 'Search failed' })
    }
  }

  const hasResults = state.status === 'done' && state.clips.length > 0
  const isEmpty = state.status === 'done' && state.clips.length === 0

  return (
    <div className="relative min-h-screen">
      {/* Subtle background — darker/quieter than home so results are readable */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at 50% 0%, #1a0a06 0%, #080407 40%, #030203 100%)',
        }}
      />

      <div className="relative z-10 flex min-h-screen flex-col">
        <SiteHeader />

        <div className="mx-auto w-full max-w-5xl flex-1 px-6 pb-16 sm:px-10">

          {/* Search heading */}
          <div className="mb-10 mt-4">
            <p className="mb-2 text-[10px] uppercase tracking-[0.5em] text-white/35">
              Clip archive
            </p>
            <h1
              className="font-display text-3xl font-black uppercase tracking-[0.04em] text-[#f5ede0] sm:text-4xl"
              style={{ textShadow: '0 0 40px rgba(255, 100, 40, 0.2)' }}
            >
              Find your plays
            </h1>
          </div>

          {/* Search form */}
          <form onSubmit={handleSearch} className="mb-10">
            <div className="flex gap-0">
              <input
                ref={inputRef}
                type="text"
                value={steamId}
                onChange={(e) => setSteamId(e.target.value)}
                placeholder="Steam ID — e.g. 76561197960287930"
                className="flex-1 border border-white/15 bg-white/[0.04] px-5 py-4 font-mono text-sm text-white/90 placeholder-white/25 backdrop-blur-sm transition-colors focus:border-white/35 focus:outline-none"
              />
              <button
                type="submit"
                disabled={state.status === 'loading'}
                className="border border-l-0 border-white/15 bg-white/[0.04] px-8 font-display text-xs uppercase tracking-[0.35em] text-white/80 backdrop-blur-sm transition-all hover:border-white/40 hover:bg-white/[0.08] hover:text-white disabled:opacity-40"
              >
                {state.status === 'loading' ? (
                  <span className="flex items-center gap-2">
                    <span className="h-3 w-3 animate-spin rounded-full border border-white/60 border-t-transparent" />
                    Searching
                  </span>
                ) : (
                  'Invoke'
                )}
              </button>
            </div>
            <p className="mt-2 text-[10px] text-white/25">
              Enter your Steam64 ID or 32-bit account ID
            </p>
          </form>

          {/* Error */}
          {state.status === 'error' && (
            <div className="mb-8 border border-red-400/20 bg-red-400/5 px-5 py-4 text-sm text-red-400">
              {state.message}
            </div>
          )}

          {/* Results header */}
          {hasResults && (
            <div className="mb-6 flex items-center justify-between border-b border-white/[0.06] pb-4">
              <p className="text-sm text-white/50">
                <span className="font-display text-white/90">{state.total}</span> clip{state.total !== 1 ? 's' : ''} found for{' '}
                <span className="font-mono text-white/70">{state.steamId}</span>
              </p>
              <Link
                href="/"
                className="text-[10px] uppercase tracking-[0.3em] text-white/30 transition-colors hover:text-white/70"
              >
                ← Back
              </Link>
            </div>
          )}

          {/* States */}
          {state.status === 'idle' && <EmptyPrompt />}
          {isEmpty && <NoResults steamId={state.steamId} />}

          {/* Results grid */}
          {hasResults && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {state.clips.map((clip) => (
                <ClipCard key={clip.clipId} clip={clip} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
