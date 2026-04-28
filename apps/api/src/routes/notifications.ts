import { FastifyInstance } from 'fastify'
import { db } from '@dota-replay/db'
import { verifyToken } from '../lib/jwt'

interface SubscribeBody {
  subscription: {
    endpoint: string
    keys: { p256dh: string; auth: string }
  }
}

async function getUserFromRequest(authHeader: string | undefined): Promise<number | null> {
  if (!authHeader?.startsWith('Bearer ')) return null
  const payload = await verifyToken(authHeader.slice(7))
  if (!payload) return null

  const user = await db.user.findUnique({
    where:  { steamAccountId: BigInt(payload.steamId) },
    select: { id: true },
  })
  return user?.id ?? null
}

export default async function notificationsRoutes(app: FastifyInstance) {
  // ── POST /notifications/subscribe ──────────────────────────────────────────
  app.post<{ Body: SubscribeBody }>('/subscribe', async (req, reply) => {
    const userId = await getUserFromRequest(req.headers.authorization)
    if (!userId) return reply.status(401).send({ error: 'Unauthorized' })

    const { endpoint, keys } = req.body.subscription

    await db.pushSubscription.upsert({
      where:  { endpoint },
      create: { userId, endpoint, p256dh: keys.p256dh, auth: keys.auth },
      update: { userId, p256dh: keys.p256dh, auth: keys.auth },
    })

    return reply.status(201).send({ ok: true })
  })

  // ── DELETE /notifications/subscribe ────────────────────────────────────────
  app.delete<{ Body: { endpoint: string } }>('/subscribe', async (req, reply) => {
    const userId = await getUserFromRequest(req.headers.authorization)
    if (!userId) return reply.status(401).send({ error: 'Unauthorized' })

    await db.pushSubscription.deleteMany({
      where: { endpoint: req.body.endpoint, userId },
    })

    return { ok: true }
  })

  // ── GET /notifications/vapid-public-key ────────────────────────────────────
  app.get('/vapid-public-key', async () => ({
    key: process.env.VAPID_PUBLIC_KEY ?? null,
  }))
}
