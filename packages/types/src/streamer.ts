export type PlatformAccountId = {
  twitch?: string
  youtube?: string
  kick?: string
  trovo?: string
  facebook?: string
  tiktok?: string
}

export interface StreamerData {
  steamAccountId: bigint
  displayName?: string
  platformIds: PlatformAccountId
  verified?: boolean
}