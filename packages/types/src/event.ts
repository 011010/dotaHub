export const EVENT_TYPES = {
  RAMPAGE: 'rampage',
  ULTRA_KILL: 'ultra_kill',
  TRIPLE_KILL: 'triple_kill',
  FIRST_BLOOD: 'first_blood',
  AEGIS_STEAL: 'aegis_steal',
  TEAM_WIPE: 'team_wipe',
  COMEBACK: 'comeback',
  COURIER_SNIPE: 'courier_snipe',
  MEGA_CREEPS_WIN: 'mega_creeps_win',
  BASE_RACE: 'base_race',
} as const

export type EventType = (typeof EVENT_TYPES)[keyof typeof EVENT_TYPES]

export const EVENT_PRIORITIES: Record<EventType, 'high' | 'medium' | 'low'> = {
  rampage: 'high',
  ultra_kill: 'high',
  triple_kill: 'medium',
  first_blood: 'medium',
  aegis_steal: 'high',
  team_wipe: 'high',
  comeback: 'medium',
  courier_snipe: 'low',
  mega_creeps_win: 'high',
  base_race: 'high',
}

export interface EventContext {
  heroId?: number
  itemCount?: number
  goldDifference?: number
  teamfightParticipants?: number[]
  victimHeroIds?: number[]
}