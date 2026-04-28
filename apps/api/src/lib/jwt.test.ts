import { describe, it, expect, beforeAll } from 'vitest'
import { signToken, verifyToken } from './jwt'

beforeAll(() => {
  process.env.JWT_SECRET = 'test-secret-for-unit-tests'
})

describe('jwt', () => {
  it('signs and verifies a token roundtrip', async () => {
    const token   = await signToken({ steamId: '76561198000000001', displayName: 'TestUser' })
    const payload = await verifyToken(token)
    expect(payload?.steamId).toBe('76561198000000001')
    expect(payload?.displayName).toBe('TestUser')
  })

  it('returns null for an invalid token', async () => {
    const result = await verifyToken('not.a.valid.jwt')
    expect(result).toBeNull()
  })

  it('returns null for a tampered token', async () => {
    const token   = await signToken({ steamId: '123' })
    const tampered = token.slice(0, -4) + 'XXXX'
    expect(await verifyToken(tampered)).toBeNull()
  })
})
