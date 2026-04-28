import webpush from 'web-push'
import { logger } from './logger'

let initialized = false

function init() {
  if (initialized) return
  const publicKey  = process.env.VAPID_PUBLIC_KEY
  const privateKey = process.env.VAPID_PRIVATE_KEY
  const subject    = process.env.VAPID_SUBJECT ?? 'mailto:admin@dotareplayhub.com'

  if (!publicKey || !privateKey) {
    logger.warn('VAPID_PUBLIC_KEY/VAPID_PRIVATE_KEY not set — push notifications disabled')
    return
  }

  webpush.setVapidDetails(subject, publicKey, privateKey)
  initialized = true
}

export interface PushPayload {
  title:  string
  body:   string
  icon?:  string
  url?:   string
  tag?:   string
}

export interface StoredSubscription {
  endpoint: string
  p256dh:   string
  auth:     string
}

export async function sendPushNotification(
  subscription: StoredSubscription,
  payload: PushPayload
): Promise<boolean> {
  init()
  if (!initialized) return false

  try {
    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: { p256dh: subscription.p256dh, auth: subscription.auth },
      },
      JSON.stringify(payload),
      { TTL: 86400 }  // 24h
    )
    return true
  } catch (err: unknown) {
    const status = (err as { statusCode?: number }).statusCode
    // 404/410 = subscription expired — caller should delete it
    if (status === 404 || status === 410) return false
    logger.error({ err, endpoint: subscription.endpoint }, 'Push notification failed')
    return false
  }
}
