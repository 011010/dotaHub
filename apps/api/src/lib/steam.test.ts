import { describe, it, expect, vi, beforeEach } from 'vitest'
import { buildSteamOpenIdUrl, verifySteamOpenId } from './steam'

describe('buildSteamOpenIdUrl', () => {
  it('builds a valid Steam OpenID URL', () => {
    const url = buildSteamOpenIdUrl(
      'http://localhost:3001/auth/steam/callback',
      'http://localhost:3001',
    )
    expect(url).toContain('https://steamcommunity.com/openid/login')
    expect(url).toContain('openid.mode=checkid_setup')
    expect(url).toContain(encodeURIComponent('http://localhost:3001/auth/steam/callback'))
    expect(url).toContain(encodeURIComponent('http://localhost:3001'))
  })

  it('includes identifier_select for claimed_id and identity', () => {
    const url = buildSteamOpenIdUrl('http://cb', 'http://realm')
    expect(url).toContain('identifier_select')
  })
})

describe('verifySteamOpenId', () => {
  beforeEach(() => { vi.restoreAllMocks() })

  it('returns the steam ID when Steam confirms is_valid:true', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      text: async () => 'ns:http://specs.openid.net/auth/2.0\nis_valid:true\n',
    }))

    const steamId = await verifySteamOpenId({
      'openid.claimed_id': 'https://steamcommunity.com/openid/id/76561198000000001',
      'openid.mode':       'id_res',
    })

    expect(steamId).toBe('76561198000000001')
  })

  it('returns null when Steam responds is_valid:false', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      text: async () => 'is_valid:false\n',
    }))

    const result = await verifySteamOpenId({
      'openid.claimed_id': 'https://steamcommunity.com/openid/id/123',
      'openid.mode':       'id_res',
    })

    expect(result).toBeNull()
  })

  it('returns null when claimed_id has no steam ID', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      text: async () => 'is_valid:true\n',
    }))

    const result = await verifySteamOpenId({
      'openid.claimed_id': 'https://steamcommunity.com/openid/id/',
      'openid.mode':       'id_res',
    })

    expect(result).toBeNull()
  })
})
