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
  // present when match has been fully parsed
  multi_kills?: Record<string, number>  // key = kill streak count e.g. "3", "4", "5"
  kills_log?:   Array<{ time: number; target: string }>
}

export interface OpenDotaObjective {
  time:        number
  type:        string
  player_slot?: number
  team?:       number
  unit?:       string
  key?:        string
}

export interface OpenDotaTeamfight {
  start:   number
  end:     number
  players: Array<{ deaths: number; killed: Record<string, number> }>
}

export interface OpenDotaMatchFull extends OpenDotaMatch {
  objectives?:      OpenDotaObjective[]
  teamfights?:      OpenDotaTeamfight[]
  radiant_gold_adv?: number[]
  dire_gold_adv?:   number[]
  players:          OpenDotaPlayer[]
}