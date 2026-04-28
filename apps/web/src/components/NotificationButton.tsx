'use client'

import { useAuth } from '@/hooks/useAuth'
import { useNotifications } from '@/hooks/useNotifications'

export function NotificationButton() {
  const { user }                       = useAuth()
  const { state, subscribe, unsubscribe } = useNotifications()

  // Only show when logged in and supported
  if (!user || state === 'unsupported') return null

  if (state === 'loading') {
    return (
      <span className="h-3 w-3 animate-pulse rounded-full bg-white/20" />
    )
  }

  if (state === 'denied') {
    return (
      <span className="text-[10px] uppercase tracking-[0.25em] text-white/25">
        Notifications blocked
      </span>
    )
  }

  if (state === 'subscribed') {
    return (
      <button
        onClick={unsubscribe}
        title="Disable push notifications"
        className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.25em] text-amber-400/70 transition-colors hover:text-amber-400"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-amber-400/80" />
        Notifs on
      </button>
    )
  }

  return (
    <button
      onClick={subscribe}
      title="Enable push notifications"
      className="text-[10px] uppercase tracking-[0.25em] text-white/40 transition-colors hover:text-white/80"
    >
      Enable notifs
    </button>
  )
}
