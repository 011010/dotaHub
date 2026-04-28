import { FastifyInstance } from 'fastify'
import { db } from '@dota-replay/db'
import { buildSteamOpenIdUrl, verifySteamOpenId, getSteamProfile } from '../lib/steam'
import { signToken, verifyToken } from '../lib/jwt'

const FRONTEND_URL = () => process.env.FRONTEND_URL ?? 'http://localhost:3000'

export default async function authRoutes(app: FastifyInstance) {
  // ── GET /auth/steam ─────────────────────────────────────────────────────────
  // Redirects the user to Steam's OpenID login page
  app.get('/steam', async (req, reply) => {
    const host     = req.headers['host'] ?? `localhost:${process.env.PORT ?? 3001}`
    const apiBase  = `${req.protocol}://${host}`
    const returnTo = `${apiBase}/auth/steam/callback`
    return reply.redirect(buildSteamOpenIdUrl(returnTo, apiBase))
  })

  // ── GET /auth/steam/callback ────────────────────────────────────────────────
  // Steam redirects here after login; verify OpenID, upsert user, issue JWT
  app.get('/steam/callback', async (req, reply) => {
    const params  = req.query as Record<string, string>
    const steamId = await verifySteamOpenId(params)

    if (!steamId) {
      return reply.redirect(`${FRONTEND_URL()}/login?error=auth_failed`)
    }

    const profile = await getSteamProfile(steamId, process.env.STEAM_API_KEY)

    const user = await db.user.upsert({
      where:  { steamAccountId: BigInt(steamId) },
      create: { steamAccountId: BigInt(steamId), displayName: profile?.displayName ?? null },
      update: { displayName: profile?.displayName ?? undefined },
    })

    const token = await signToken({
      steamId,
      displayName: user.displayName ?? undefined,
    })

    return reply.redirect(`${FRONTEND_URL()}/auth/callback?token=${token}`)
  })

  // ── GET /auth/me ────────────────────────────────────────────────────────────
  // Returns the current user decoded from the Bearer token
  app.get('/me', async (req, reply) => {
    const auth = req.headers.authorization
    if (!auth?.startsWith('Bearer ')) {
      return reply.status(401).send({ error: 'Unauthorized' })
    }

    const payload = await verifyToken(auth.slice(7))
    if (!payload) {
      return reply.status(401).send({ error: 'Invalid or expired token' })
    }

    return { user: { steamId: payload.steamId, displayName: payload.displayName } }
  })

  // ── GET /auth/logout ────────────────────────────────────────────────────────
  // Stateless — client just drops the token; this endpoint exists for UX clarity
  app.get('/logout', async (_req, reply) => {
    return reply.redirect(`${FRONTEND_URL()}/`)
  })
}
