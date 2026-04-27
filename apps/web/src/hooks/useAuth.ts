'use client'

import { useState, useEffect, useCallback } from 'react'
import { apiFetch } from '@/lib/api'

export interface AuthUser {
  steamId:      string
  displayName?: string
}

export function useAuth() {
  const [user,    setUser]    = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('auth_token')
    if (!token) { setLoading(false); return }

    apiFetch<{ user: AuthUser }>('/auth/me')
      .then(data => setUser(data.user))
      .catch(() => localStorage.removeItem('auth_token'))
      .finally(() => setLoading(false))
  }, [])

  const signOut = useCallback(() => {
    localStorage.removeItem('auth_token')
    setUser(null)
  }, [])

  return { user, loading, signOut }
}
