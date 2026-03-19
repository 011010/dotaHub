import { GraphQLClient, gql } from 'graphql-request'
import { ApiClientConfig } from './base'

const STRATZ_GRAPHQL_URL = 'https://api.stratz.com/graphql'

export class StratzClient {
  private client: GraphQLClient
  private apiKey?: string

  constructor(config?: Partial<ApiClientConfig>) {
    this.apiKey = config?.apiKey
    this.client = new GraphQLClient(STRATZ_GRAPHQL_URL, {
      headers: this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {},
    })
  }

  async getMatchWithKillEvents(matchId: bigint) {
    const query = gql`
      query GetMatch($matchId: Long!) {
        match(id: $matchId) {
          id
          durationSeconds
          startDateTime
          didRadiantWin
          players {
            steamAccountId
            heroId
            kills
            deaths
            assists
            stats {
              killEvents {
                time
                target
              }
            }
          }
        }
      }
    `

    return this.client.request(query, { matchId: matchId.toString() })
  }

  async getPlayerRecentMatches(accountId: bigint) {
    const query = gql`
      query GetPlayerMatches($accountId: Long!) {
        player(steamAccountId: $accountId) {
          matches(request: { take: 20 }) {
            id
            durationSeconds
            startDateTime
            didRadiantWin
          }
        }
      }
    `

    return this.client.request(query, { accountId: accountId.toString() })
  }
}