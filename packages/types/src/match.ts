export interface MatchData {
  matchId: bigint
  startTime: Date
  durationSeconds?: number
  gameMode?: number
  radiantWin?: boolean
  avgRank?: number
}

export interface OpenDotaMatch {
  match_id: number
  start_time: number
  duration: number
  game_mode: number
  radiant_win: boolean
  avg_rank_tier?: number
  players: OpenDotaPlayer[]
}

export interface OpenDotaPlayer {
  account_id: number
  player_slot: number
  hero_id: number
  kills: number
  deaths: number
  assists: number
}