import { BaseApiClient, ApiClientConfig } from './base'

const STEAM_API_BASE_URL = 'https://api.steampowered.com'

export class SteamClient extends BaseApiClient {
  constructor(config: ApiClientConfig) {
    super({
      baseUrl: STEAM_API_BASE_URL,
      apiKey: config.apiKey,
      timeout: config.timeout,
    })
  }

  async getMatchDetails(matchId: bigint) {
    return this.request(
      `/IDOTA2Match_570/GetMatchDetails/v1?match_id=${matchId}`
    )
  }

  async getMatchHistory(accountId: bigint, matchesRequested = 20) {
    return this.request(
      `/IDOTA2Match_570/GetMatchHistory/v1?account_id=${accountId}&matches_requested=${matchesRequested}`
    )
  }

  async getHeroes() {
    return this.request('/IEconDOTA2_570/GetHeroes/v1')
  }

  async getTopLiveGames() {
    return this.request('/IDOTA2StreamSystem_570/GetTopLiveGame/v1')
  }
}