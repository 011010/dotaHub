'use client'

import { useAuth } from '@/hooks/useAuth'

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

export function AuthButton() {
  const { user, loading, signOut } = useAuth()

  if (loading) {
    return (
      <span className="h-4 w-16 animate-pulse rounded bg-white/[0.06]" />
    )
  }

  if (user) {
    return (
      <div className="flex items-center gap-3">
        <span className="hidden text-xs text-white/60 sm:block">
          {user.displayName ?? user.steamId}
        </span>
        <button
          onClick={signOut}
          className="rounded-sm border border-white/20 px-4 py-2 text-xs uppercase tracking-[0.3em] text-white/70 transition-colors hover:border-white/50 hover:text-white"
        >
          Sign out
        </button>
      </div>
    )
  }

  return (
    <a
      href={`${API_BASE}/auth/steam`}
      className="rounded-sm border border-white/20 px-4 py-2 text-xs uppercase tracking-[0.3em] text-white/80 transition-colors hover:border-white/60 hover:text-white"
    >
      Sign in
    </a>
  )
}
