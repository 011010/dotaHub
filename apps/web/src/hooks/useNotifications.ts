'use client'

import { useState, useEffect, useCallback } from 'react'
import { apiFetch } from '@/lib/api'

type NotifState = 'unsupported' | 'denied' | 'unsubscribed' | 'subscribed' | 'loading'

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

async function getVapidKey(): Promise<string | null> {
  try {
    const data = await apiFetch<{ key: string | null }>('/notifications/vapid-public-key')
    return data.key
  } catch {
    return null
  }
}

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64  = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw     = atob(base64)
  return new Uint8Array([...raw].map(c => c.charCodeAt(0)))
}

async function getCurrentSubscription(): Promise<PushSubscription | null> {
  if (!('serviceWorker' in navigator)) return null
  const reg = await navigator.serviceWorker.ready
  return reg.pushManager.getSubscription()
}

export function useNotifications() {
  const [state, setState] = useState<NotifState>('loading')

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setState('unsupported')
      return
    }
    if (Notification.permission === 'denied') {
      setState('denied')
      return
    }
    getCurrentSubscription().then(sub => {
      setState(sub ? 'subscribed' : 'unsubscribed')
    })
  }, [])

  const subscribe = useCallback(async () => {
    setState('loading')
    try {
      const perm = await Notification.requestPermission()
      if (perm !== 'granted') { setState('denied'); return }

      const vapidKey = await getVapidKey()
      if (!vapidKey) throw new Error('VAPID key unavailable')

      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly:      true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      })

      await apiFetch('/notifications/subscribe', {
        method: 'POST',
        body:   JSON.stringify({ subscription: sub.toJSON() }),
      })

      setState('subscribed')
    } catch (err) {
      console.error('Subscribe failed:', err)
      setState('unsubscribed')
    }
  }, [])

  const unsubscribe = useCallback(async () => {
    setState('loading')
    try {
      const sub = await getCurrentSubscription()
      if (sub) {
        await apiFetch('/notifications/subscribe', {
          method: 'DELETE',
          body:   JSON.stringify({ endpoint: sub.endpoint }),
        })
        await sub.unsubscribe()
      }
      setState('unsubscribed')
    } catch (err) {
      console.error('Unsubscribe failed:', err)
      setState('subscribed')
    }
  }, [])

  return { state, subscribe, unsubscribe }
}
