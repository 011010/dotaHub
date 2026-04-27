const STEAM_OPENID_URL = 'https://steamcommunity.com/openid/login'

export function buildSteamOpenIdUrl(returnTo: string, realm: string): string {
  const params = new URLSearchParams({
    'openid.ns':         'http://specs.openid.net/auth/2.0',
    'openid.mode':       'checkid_setup',
    'openid.return_to':  returnTo,
    'openid.realm':      realm,
    'openid.identity':   'http://specs.openid.net/auth/2.0/identifier_select',
    'openid.claimed_id': 'http://specs.openid.net/auth/2.0/identifier_select',
  })
  return `${STEAM_OPENID_URL}?${params.toString()}`
}

export async function verifySteamOpenId(
  params: Record<string, string>
): Promise<string | null> {
  const verifyParams = new URLSearchParams({ ...params, 'openid.mode': 'check_authentication' })

  const res = await fetch(STEAM_OPENID_URL, {
    method:  'POST',
    body:    verifyParams.toString(),
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  })

  const text = await res.text()
  if (!text.includes('is_valid:true')) return null

  const match = (params['openid.claimed_id'] ?? '').match(/\/openid\/id\/(\d+)$/)
  return match?.[1] ?? null
}

export async function getSteamProfile(
  steamId: string,
  apiKey: string | undefined
): Promise<{ displayName: string } | null> {
  if (!apiKey) return null
  try {
    const url = `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${apiKey}&steamids=${steamId}`
    const res  = await fetch(url)
    const data = await res.json() as { response: { players: { personaname: string }[] } }
    const player = data.response.players[0]
    return player ? { displayName: player.personaname } : null
  } catch {
    return null
  }
}
