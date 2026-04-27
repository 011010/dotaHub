import { BaseApiClient, ApiClientConfig } from './base'
import type { OpenDotaMatch, OpenDotaMatchFull } from '@dota-replay/types'

const OPENDOTA_BASE_URL = 'https://api.opendota.com/api'

export class OpenDotaClient extends BaseApiClient {
  constructor(config?: Partial<ApiClientConfig>) {
    super({
      baseUrl: OPENDOTA_BASE_URL,
      apiKey: config?.apiKey,
      timeout: config?.timeout,
    })
  }

  async getMatch(matchId: bigint): Promise<OpenDotaMatch> {
    return this.request<OpenDotaMatch>(`/matches/${matchId}`)
  }

  async getMatchFull(matchId: bigint): Promise<OpenDotaMatchFull> {
    return this.request<OpenDotaMatchFull>(`/matches/${matchId}`)
  }

  async getPlayerRecentMatches(accountId: bigint): Promise<OpenDotaMatch[]> {
    return this.request<OpenDotaMatch[]>(
      `/players/${accountId}/recentMatches`
    )
  }

  async requestMatchParse(matchId: bigint): Promise<{ job: { jobId: string } }> {
    return this.request(`/request/${matchId}`, { method: 'POST' })
  }

  async getProPlayers(): Promise<Array<{ account_id: number; name: string }>> {
    return this.request('/proPlayers')
  }
}