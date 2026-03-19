# Dota 2 Replay Hub - Project Scaffolding Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Scaffold the basic project structure for a Dota 2 clip aggregation platform using Turborepo monorepo with Node.js/TypeScript.

**Architecture:** Turborepo monorepo with apps/ (web, api) and packages/ (db, types, dota-api). Fastify backend with BullMQ workers, Next.js frontend, Prisma ORM with PostgreSQL.

**Tech Stack:** Node.js, TypeScript, Turborepo, pnpm, Fastify, Next.js 14, Prisma, PostgreSQL, Redis, BullMQ

---

## Task 1: Initialize Turborepo Monorepo

**Files:**
- Create: `package.json` (root)
- Create: `pnpm-workspace.yaml`
- Create: `turbo.json`
- Create: `.gitignore`
- Create: `.nvmrc`

**Step 1: Initialize root package.json**

```bash
pnpm init
```

Edit `package.json`:

```json
{
  "name": "dota2-replay-hub",
  "version": "0.0.1",
  "private": true,
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "lint": "turbo run lint",
    "test": "turbo run test",
    "clean": "turbo run clean && rm -rf node_modules"
  },
  "devDependencies": {
    "turbo": "^2.0.0",
    "typescript": "^5.3.0"
  },
  "packageManager": "pnpm@9.0.0",
  "engines": {
    "node": ">=20"
  }
}
```

**Step 2: Create pnpm workspace config**

Create `pnpm-workspace.yaml`:

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

**Step 3: Create turbo.json**

Create `turbo.json`:

```json
{
  "$schema": "https://turbo.build/schema.json",
  "ui": "tui",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**", "!.next/cache/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "dependsOn": ["^build"]
    },
    "test": {
      "dependsOn": ["^build"],
      "outputs": []
    },
    "clean": {
      "cache": false
    }
  }
}
```

**Step 4: Create .gitignore**

Create `.gitignore`:

```
# Dependencies
node_modules/
.pnpm-store/

# Build outputs
dist/
.next/
.turbo/
*.tsbuildinfo

# Environment
.env
.env.local
.env.*.local

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*
pnpm-debug.log*

# Testing
coverage/

# Prisma
packages/db/prisma/*.db
packages/db/prisma/*.db-journal

# Misc
*.pem
```

**Step 5: Create .nvmrc**

Create `.nvmrc`:

```
20
```

**Step 6: Create directories**

```bash
mkdir -p apps/web/src/{app,components,lib}
mkdir -p apps/api/src/{routes,services,workers,lib}
mkdir -p packages/db/src
mkdir -p packages/db/prisma
mkdir -p packages/types/src
mkdir -p packages/dota-api/src
```

**Step 7: Commit**

```bash
git init
git add .
git commit -m "chore: initialize turborepo monorepo structure"
```

---

## Task 2: Create Database Package (Prisma)

**Files:**
- Create: `packages/db/package.json`
- Create: `packages/db/tsconfig.json`
- Create: `packages/db/prisma/schema.prisma`
- Create: `packages/db/src/index.ts`

**Step 1: Create package.json**

Create `packages/db/package.json`:

```json
{
  "name": "@dota-replay/db",
  "version": "0.0.1",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "db:generate": "prisma generate",
    "db:push": "prisma db push",
    "db:migrate": "prisma migrate dev",
    "db:studio": "prisma studio"
  },
  "dependencies": {
    "@prisma/client": "^5.10.0"
  },
  "devDependencies": {
    "prisma": "^5.10.0",
    "typescript": "^5.3.0"
  },
  "exports": {
    ".": "./src/index.ts"
  }
}
```

**Step 2: Create tsconfig.json**

Create `packages/db/tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "declaration": true,
    "outDir": "./dist"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

**Step 3: Create Prisma schema**

Create `packages/db/prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Streamer {
  id                Int       @id @default(autoincrement())
  steamAccountId    BigInt    @unique
  displayName       String?
  twitchId          String?   @map("twitch_id")
  youtubeChannelId  String?   @map("youtube_channel_id") @db.VarChar(100)
  kickUsername      String?   @map("kick_username") @db.VarChar(100)
  trovoUsername     String?   @db.VarChar(100)
  facebookPageId    String?   @map("facebook_page_id") @db.VarChar(100)
  tiktokUsername    String?   @db.VarChar(100)
  verified          Boolean   @default(false)
  createdAt         DateTime  @default(now()) @map("created_at")
  
  clips            Clip[]
  
  @@map("streamers")
}

model Match {
  id              Int       @id @default(autoincrement())
  matchId         BigInt    @unique @map("match_id")
  startTime       DateTime  @map("start_time")
  durationSeconds Int?      @map("duration_seconds")
  gameMode        Int?      @map("game_mode")
  radiantWin      Boolean?  @map("radiant_win")
  avgRank         Int?      @map("avg_rank")
  processed       Boolean   @default(false)
  createdAt       DateTime  @default(now()) @map("created_at")
  
  events          Event[]
  
  @@index([processed])
  @@map("matches")
}

model Event {
  id              Int      @id @default(autoincrement())
  matchId         BigInt   @map("match_id")
  eventType       String   @map("event_type") @db.VarChar(50)
  gameTimeSec     Int      @map("game_time_sec")
  playerSteamId   BigInt   @map("player_steam_id")
  victimSteamId   BigInt?  @map("victim_steam_id")
  heroId          Int?     @map("hero_id")
  contextJson     Json?    @map("context_json")
  createdAt       DateTime @default(now()) @map("created_at")
  
  match           Match    @relation(fields: [matchId], references: [matchId], onDelete: Cascade)
  clips           Clip[]
  
  @@index([matchId])
  @@index([playerSteamId])
  @@index([eventType])
  @@map("events")
}

model Clip {
  id              Int      @id @default(autoincrement())
  eventId         Int      @map("event_id")
  streamerId      Int      @map("streamer_id")
  platform        String   @db.VarChar(20)
  clipUrl         String   @map("clip_url") @db.Text
  embedUrl        String?  @map("embed_url") @db.Text
  thumbnailUrl    String?  @map("thumbnail_url") @db.Text
  durationSec     Int?     @map("duration_sec")
  clipTitle       String?  @map("clip_title") @db.VarChar(500)
  platformClipId  String?  @map("platform_clip_id") @db.VarChar(200)
  createdAt       DateTime @default(now()) @map("created_at")
  
  event           Event    @relation(fields: [eventId], references: [id], onDelete: Cascade)
  streamer        Streamer @relation(fields: [streamerId], references: [id], onDelete: Cascade)
  
  @@index([eventId])
  @@index([streamerId])
  @@index([platform])
  @@map("clips")
}

model User {
  id                Int      @id @default(autoincrement())
  steamAccountId    BigInt   @unique @map("steam_account_id")
  displayName       String?  @db.VarChar(255)
  notificationPrefs Json?    @default("{}") @map("notification_prefs")
  createdAt         DateTime @default(now()) @map("created_at")
  
  @@map("users")
}
```

**Step 4: Create Prisma client wrapper**

Create `packages/db/src/index.ts`:

```typescript
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export * from '@prisma/client'
export { prisma as db }
```

**Step 5: Create .env.example**

Create `packages/db/.env.example`:

```
DATABASE_URL="postgresql://user:password@localhost:5432/dota_replay_hub?schema=public"
```

**Step 6: Commit**

```bash
git add .
git commit -m "feat(db): add prisma schema and client wrapper"
```

---

## Task 3: Create Types Package

**Files:**
- Create: `packages/types/package.json`
- Create: `packages/types/tsconfig.json`
- Create: `packages/types/src/index.ts`
- Create: `packages/types/src/match.ts`
- Create: `packages/types/src/event.ts`
- Create: `packages/types/src/clip.ts`
- Create: `packages/types/src/streamer.ts`
- Create: `packages/types/src/api.ts`

**Step 1: Create package.json**

Create `packages/types/package.json`:

```json
{
  "name": "@dota-replay/types",
  "version": "0.0.1",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "devDependencies": {
    "typescript": "^5.3.0"
  },
  "exports": {
    ".": "./src/index.ts"
  }
}
```

**Step 2: Create tsconfig.json**

Create `packages/types/tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "declaration": true,
    "outDir": "./dist"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

**Step 3: Create event types**

Create `packages/types/src/event.ts`:

```typescript
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
```

**Step 4: Create match types**

Create `packages/types/src/match.ts`:

```typescript
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
```

**Step 5: Create clip types**

Create `packages/types/src/clip.ts`:

```typescript
export type Platform = 'twitch' | 'youtube' | 'kick' | 'trovo' | 'facebook'

export interface ClipData {
  eventId: number
  streamerId: number
  platform: Platform
  clipUrl: string
  embedUrl?: string
  thumbnailUrl?: string
  durationSec?: number
  clipTitle?: string
  platformClipId?: string
}

export interface TwitchClip {
  id: string
  url: string
  embed_url: string
  thumbnail_url: string
  duration: number
  title: string
  created_at: string
}

export interface YouTubeVOD {
  id: string
  videoId: string
  title: string
  startTime: Date
  duration?: number
}
```

**Step 6: Create streamer types**

Create `packages/types/src/streamer.ts`:

```typescript
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
```

**Step 7: Create API types**

Create `packages/types/src/api.ts`:

```typescript
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    hasMore: boolean
  }
}

export interface SearchParams {
  steamId: string
  page?: number
  limit?: number
}

export interface ClipSearchResult {
  clipId: number
  eventId: number
  eventType: string
  gameTimeSec: number
  platform: string
  clipUrl: string
  embedUrl?: string
  thumbnailUrl?: string
  streamerName?: string
  matchId: bigint
  heroId?: number
  createdAt: Date
}
```

**Step 8: Create barrel export**

Create `packages/types/src/index.ts`:

```typescript
export * from './event'
export * from './match'
export * from './clip'
export * from './streamer'
export * from './api'
```

**Step 9: Commit**

```bash
git add .
git commit -m "feat(types): add shared types package"
```

---

## Task 4: Create Dota API Client Package

**Files:**
- Create: `packages/dota-api/package.json`
- Create: `packages/dota-api/tsconfig.json`
- Create: `packages/dota-api/src/index.ts`
- Create: `packages/dota-api/src/opendota.ts`
- Create: `packages/dota-api/src/stratz.ts`
- Create: `packages/dota-api/src/steam.ts`
- Create: `packages/dota-api/src/base.ts`

**Step 1: Create package.json**

Create `packages/dota-api/package.json`:

```json
{
  "name": "@dota-replay/dota-api",
  "version": "0.0.1",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "lint": "eslint src/",
    "test": "vitest run"
  },
  "dependencies": {
    "graphql-request": "^6.1.0"
  },
  "devDependencies": {
    "typescript": "^5.3.0",
    "vitest": "^1.2.0"
  },
  "exports": {
    ".": "./src/index.ts"
  }
}
```

**Step 2: Create tsconfig.json**

Create `packages/dota-api/tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "declaration": true,
    "outDir": "./dist"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

**Step 3: Create base client**

Create `packages/dota-api/src/base.ts`:

```typescript
export interface ApiClientConfig {
  baseUrl: string
  apiKey?: string
  timeout?: number
}

export class BaseApiClient {
  protected baseUrl: string
  protected apiKey?: string
  protected timeout: number

  constructor(config: ApiClientConfig) {
    this.baseUrl = config.baseUrl
    this.apiKey = config.apiKey
    this.timeout = config.timeout ?? 30000
  }

  protected async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    const url = new URL(endpoint, this.baseUrl)
    
    if (this.apiKey) {
      url.searchParams.set('api_key', this.apiKey)
    }

    const response = await fetch(url.toString(), {
      ...options,
      signal: AbortSignal.timeout(this.timeout),
    })

    if (!response.ok) {
      throw new ApiError(response.status, await response.text())
    }

    return response.json()
  }
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(`API Error ${status}: ${message}`)
    this.name = 'ApiError'
  }
}
```

**Step 4: Create OpenDota client**

Create `packages/dota-api/src/opendota.ts`:

```typescript
import { BaseApiClient, ApiClientConfig } from './base'
import type { OpenDotaMatch } from '@dota-replay/types'

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
```

**Step 5: Create STRATZ client**

Create `packages/dota-api/src/stratz.ts`:

```typescript
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
```

**Step 6: Create Steam client**

Create `packages/dota-api/src/steam.ts`:

```typescript
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
```

**Step 7: Create barrel export**

Create `packages/dota-api/src/index.ts`:

```typescript
export { BaseApiClient, ApiError } from './base'
export { OpenDotaClient } from './opendota'
export { SteamClient } from './steam'
export { StratzClient } from './stratz'
```

**Step 8: Commit**

```bash
git add .
git commit -m "feat(dota-api): add OpenDota, STRATZ, Steam clients"
```

---

## Task 5: Create API App (Fastify)

**Files:**
- Create: `apps/api/package.json`
- Create: `apps/api/tsconfig.json`
- Create: `apps/api/src/index.ts`
- Create: `apps/api/src/app.ts`
- Create: `apps/api/src/routes/index.ts`
- Create: `apps/api/src/routes/health.ts`
- Create: `apps/api/src/routes/matches.ts`
- Create: `apps/api/src/routes/streamers.ts`
- Create: `apps/api/src/routes/search.ts`
- Create: `apps/api/src/lib/logger.ts`
- Create: `apps/api/.env.example`

**Step 1: Create package.json**

Create `apps/api/package.json`:

```json
{
  "name": "@dota-replay/api",
  "version": "0.0.1",
  "private": true,
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "lint": "eslint src/",
    "test": "vitest run"
  },
  "dependencies": {
    "@dota-replay/db": "workspace:*",
    "@dota-replay/dota-api": "workspace:*",
    "@dota-replay/types": "workspace:*",
    "fastify": "^4.26.0",
    "@fastify/cors": "^9.0.0",
    "@fastify/helmet": "^11.2.0",
    "pino": "^8.17.0",
    "pino-pretty": "^10.3.0",
    "bullmq": "^5.1.0",
    "ioredis": "^5.3.0",
    "dotenv": "^16.4.0"
  },
  "devDependencies": {
    "@types/node": "^20.11.0",
    "typescript": "^5.3.0",
    "tsx": "^4.7.0",
    "vitest": "^1.2.0",
    "eslint": "^8.56.0"
  }
}
```

**Step 2: Create tsconfig.json**

Create `apps/api/tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "declaration": true,
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

**Step 3: Create logger utility**

Create `apps/api/src/lib/logger.ts`:

```typescript
import pino from 'pino'

export const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  transport:
    process.env.NODE_ENV !== 'production'
      ? { target: 'pino-pretty', options: { colorize: true } }
      : undefined,
})
```

**Step 4: Create Fastify app**

Create `apps/api/src/app.ts`:

```typescript
import Fastify from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import { logger } from './lib/logger'
import routes from './routes'

export async function buildApp() {
  const app = Fastify({
    logger,
  })

  await app.register(helmet)
  await app.register(cors, {
    origin: process.env.CORS_ORIGIN ?? 'http://localhost:3000',
  })

  await app.register(routes)

  app.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }))

  return app
}
```

**Step 5: Create routes index**

Create `apps/api/src/routes/index.ts`:

```typescript
import { FastifyInstance } from 'fastify'
import matchesRoutes from './matches'
import streamersRoutes from './streamers'
import searchRoutes from './search'

export default async function routes(app: FastifyInstance) {
  await app.register(matchesRoutes, { prefix: '/matches' })
  await app.register(streamersRoutes, { prefix: '/streamers' })
  await app.register(searchRoutes, { prefix: '/search' })
}

export { routes }
```

**Step 6: Create matches routes**

Create `apps/api/src/routes/matches.ts`:

```typescript
import { FastifyInstance } from 'fastify'
import { db } from '@dota-replay/db'

export default async function matchesRoutes(app: FastifyInstance) {
  app.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    
    const match = await db.match.findUnique({
      where: { matchId: BigInt(id) },
      include: { events: true },
    })

    if (!match) {
      return reply.status(404).send({ error: 'Match not found' })
    }

    return { match }
  })

  app.get('/recent', async (request, reply) => {
    const { limit = '20', offset = '0' } = request.query as { limit?: string; offset?: string }
    
    const matches = await db.match.findMany({
      take: parseInt(limit, 10),
      skip: parseInt(offset, 10),
      orderBy: { startTime: 'desc' },
    })

    return { matches }
  })
}
```

**Step 7: Create streamers routes**

Create `apps/api/src/routes/streamers.ts`:

```typescript
import { FastifyInstance } from 'fastify'
import { db } from '@dota-replay/db'
import type { StreamerData } from '@dota-replay/types'

export default async function streamersRoutes(app: FastifyInstance) {
  app.get('/', async () => {
    const streamers = await db.streamer.findMany({
      take: 100,
      orderBy: { createdAt: 'desc' },
    })
    return { streamers }
  })

  app.post('/', async (request, reply) => {
    const data = request.body as StreamerData
    
    const streamer = await db.streamer.create({
      data: {
        steamAccountId: data.steamAccountId,
        displayName: data.displayName,
        twitchId: data.platformIds.twitch,
        youtubeChannelId: data.platformIds.youtube,
        kickUsername: data.platformIds.kick,
        trovoUsername: data.platformIds.trovo,
        facebookPageId: data.platformIds.facebook,
        tiktokUsername: data.platformIds.tiktok,
        verified: data.verified ?? false,
      },
    })

    return reply.status(201).send({ streamer })
  })

  app.get('/:steamId', async (request, reply) => {
    const { steamId } = request.params as { steamId: string }
    
    const streamer = await db.streamer.findUnique({
      where: { steamAccountId: BigInt(steamId) },
      include: { clips: true },
    })

    if (!streamer) {
      return reply.status(404).send({ error: 'Streamer not found' })
    }

    return { streamer }
  })
}
```

**Step 8: Create search routes**

Create `apps/api/src/routes/search.ts`:

```typescript
import { FastifyInstance } from 'fastify'
import { db } from '@dota-replay/db'
import type { SearchParams } from '@dota-replay/types'

export default async function searchRoutes(app: FastifyInstance) {
  app.get('/', async (request, reply) => {
    const { steamId, page = '1', limit = '20' } = request.query as SearchParams
    
    const pageNum = parseInt(page as string, 10)
    const limitNum = parseInt(limit as string, 10)
    const offset = (pageNum - 1) * limitNum

    const clips = await db.clip.findMany({
      where: {
        event: {
          playerSteamId: BigInt(steamId),
        },
      },
      take: limitNum,
      skip: offset,
      orderBy: { createdAt: 'desc' },
      include: {
        event: {
          include: { match: true },
        },
        streamer: true,
      },
    })

    const total = await db.clip.count({
      where: {
        event: {
          playerSteamId: BigInt(steamId),
        },
      },
    })

    return {
      clips,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        hasMore: offset + limitNum < total,
      },
    }
  })
}
```

**Step 9: Create entry point**

Create `apps/api/src/index.ts`:

```typescript
import 'dotenv/config'
import { buildApp } from './app'
import { logger } from './lib/logger'

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001
const HOST = process.env.HOST ?? '0.0.0.0'

async function start() {
  const app = await buildApp()

  try {
    await app.listen({ port: PORT, host: HOST })
    logger.info(`API server running on http://${HOST}:${PORT}`)
  } catch (err) {
    logger.error(err, 'Failed to start server')
    process.exit(1)
  }
}

start()
```

**Step 10: Create .env.example**

Create `apps/api/.env.example`:

```
PORT=3001
HOST=0.0.0.0
NODE_ENV=development
LOG_LEVEL=debug
DATABASE_URL="postgresql://user:password@localhost:5432/dota_replay_hub?schema=public"
REDIS_URL="redis://localhost:6379"
CORS_ORIGIN="http://localhost:3000"

STEAM_API_KEY=your_steam_api_key
OPENDOTA_API_KEY=your_opendota_key
STRATZ_API_KEY=your_stratz_key
TWITCH_CLIENT_ID=your_twitch_client_id
TWITCH_CLIENT_SECRET=your_twitch_secret
```

**Step 11: Commit**

```bash
git add .
git commit -m "feat(api): add Fastify API with routes for matches, streamers, search"
```

---

## Task 6: Create Web App (Next.js)

**Files:**
- Create: `apps/web/package.json`
- Create: `apps/web/tsconfig.json`
- Create: `apps/web/next.config.js`
- Create: `apps/web/src/app/layout.tsx`
- Create: `apps/web/src/app/page.tsx`
- Create: `apps/web/src/app/search/page.tsx`
- Create: `apps/web/src/lib/api.ts`
- Create: `apps/web/tailwind.config.ts`
- Create: `apps/web/postcss.config.js`

**Step 1: Create package.json**

Create `apps/web/package.json`:

```json
{
  "name": "@dota-replay/web",
  "version": "0.0.1",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "vitest run"
  },
  "dependencies": {
    "@dota-replay/types": "workspace:*",
    "next": "^14.1.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@types/node": "^20.11.0",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "typescript": "^5.3.0",
    "tailwindcss": "^3.4.0",
    "postcss": "^8.4.0",
    "autoprefixer": "^10.4.0",
    "eslint": "^8.56.0",
    "eslint-config-next": "^14.1.0",
    "vitest": "^1.2.0"
  }
}
```

**Step 2: Create tsconfig.json**

Create `apps/web/tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

**Step 3: Create next.config.js**

Create `apps/web/next.config.js`:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    typedRoutes: true,
  },
}

module.exports = nextConfig
```

**Step 4: Create Tailwind config**

Create `apps/web/tailwind.config.ts`:

```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}

export default config
```

**Step 5: Create PostCSS config**

Create `apps/web/postcss.config.js`:

```javascript
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

**Step 6: Create global styles**

Create `apps/web/src/app/globals.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --foreground-rgb: 0, 0, 0;
  --background-rgb: 255, 255, 255;
}

@media (prefers-color-scheme: dark) {
  :root {
    --foreground-rgb: 255, 255, 255;
    --background-rgb: 0, 0, 0;
  }
}

body {
  color: rgb(var(--foreground-rgb));
  background: rgb(var(--background-rgb));
}
```

**Step 7: Create API client**

Create `apps/web/src/lib/api.ts`:

```typescript
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

export async function apiFetch<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `${API_BASE}${endpoint}`
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`)
  }

  return response.json()
}

export const api = {
  search: {
    bySteamId: (steamId: string, page = 1, limit = 20) =>
      apiFetch<{ clips: unknown[]; pagination: { total: number; hasMore: boolean } }>(
        `/search?steamId=${steamId}&page=${page}&limit=${limit}`
      ),
  },
  matches: {
    recent: (limit = 20, offset = 0) =>
      apiFetch<{ matches: unknown[] }>(`/matches/recent?limit=${limit}&offset=${offset}`),
    get: (id: string) => apiFetch<{ match: unknown }>(`/matches/${id}`),
  },
  streamers: {
    list: () => apiFetch<{ streamers: unknown[] }>('/streamers'),
    get: (steamId: string) => apiFetch<{ streamer: unknown }>(`/streamers/${steamId}`),
  },
}
```

**Step 8: Create root layout**

Create `apps/web/src/app/layout.tsx`:

```typescript
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'DOTA 2 Replay Hub',
  description: 'Find clips of your plays from streamers',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
```

**Step 9: Create home page**

Create `apps/web/src/app/page.tsx`:

```typescript
import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-4">
          DOTA 2 Replay Hub
        </h1>
        <p className="text-lg mb-8">
          Find clips of you from streamers&apos; games
        </p>
        
        <div className="grid gap-4 md:grid-cols-2">
          <Link
            href="/search"
            className="p-4 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <h2 className="text-xl font-semibold mb-2">Search Clips</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Find clips by Steam ID
            </p>
          </Link>
          
          <Link
            href="/streamers"
            className="p-4 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <h2 className="text-xl font-semibold mb-2">Browse Streamers</h2>
            <p className="text-gray-600 dark:text-gray-400">
              See registered Dota 2 streamers
            </p>
          </Link>
        </div>
      </div>
    </main>
  )
}
```

**Step 10: Create search page**

Create `apps/web/src/app/search/page.tsx`:

```typescript
'use client'

import { useState } from 'react'
import { api } from '@/lib/api'

export default function SearchPage() {
  const [steamId, setSteamId] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<{ clips: unknown[]; pagination: { total: number } } | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!steamId.trim()) return

    setLoading(true)
    setError(null)
    
    try {
      const data = await api.search.bySteamId(steamId)
      setResults(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Search Clips by Steam ID</h1>
        
        <form onSubmit={handleSearch} className="mb-8">
          <div className="flex gap-2">
            <input
              type="text"
              value={steamId}
              onChange={(e) => setSteamId(e.target.value)}
              placeholder="Enter your Steam ID"
              className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>
        </form>

        {error && (
          <div className="p-4 mb-4 bg-red-100 text-red-800 rounded-lg">
            {error}
          </div>
        )}

        {results && (
          <div>
            <p className="mb-4 text-gray-600">
              Found {results.pagination.total} clip(s)
            </p>
            <div className="grid gap-4">
              {results.clips.map((clip, i) => (
                <div key={i} className="p-4 border rounded-lg">
                  Clip found
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
```

**Step 11: Create .env.example**

Create `apps/web/.env.example`:

```
NEXT_PUBLIC_API_URL=http://localhost:3001
```

**Step 12: Commit**

```bash
git add .
git commit -m "feat(web): add Next.js frontend with search page"
```

---

## Task 7: Create BullMQ Worker Infrastructure

**Files:**
- Create: `apps/api/src/lib/queue.ts`
- Create: `apps/api/src/workers/index.ts`
- Create: `apps/api/src/workers/matchIngest.ts`

**Step 1: Create queue configuration**

Create `apps/api/src/lib/queue.ts`:

```typescript
import { Queue, Worker } from 'bullmq'
import IORedis from 'ioredis'
import { logger } from './logger'

const REDIS_URL = process.env.REDIS_URL ?? 'redis://localhost:6379'

export const connection = new IORedis(REDIS_URL, {
  maxRetriesPerRequest: null,
})

export const QUEUES = {
  MATCH_INGEST: 'match:ingest',
  EVENT_EXTRACT: 'event:extract',
  CLIP_CREATE: 'clip:create',
  NOTIFICATION: 'notification:send',
} as const

export const matchIngestQueue = new Queue(QUEUES.MATCH_INGEST, { connection })
export const eventExtractQueue = new Queue(QUEUES.EVENT_EXTRACT, { connection })
export const clipCreateQueue = new Queue(QUEUES.CLIP_CREATE, { connection })
export const notificationQueue = new Queue(QUEUES.NOTIFICATION, { connection })

export function createWorker<T>(
  queueName: string,
  processor: (job: { data: T }) => Promise<void>
): Worker<T> {
  return new Worker<T>(
    queueName,
    async (job) => {
      logger.info({ jobId: job.id, queueName }, 'Processing job')
      try {
        await processor(job)
        logger.info({ jobId: job.id, queueName }, 'Job completed')
      } catch (error) {
        logger.error({ jobId: job.id, queueName, error }, 'Job failed')
        throw error
      }
    },
    { connection }
  )
}
```

**Step 2: Create match ingest worker**

Create `apps/api/src/workers/matchIngest.ts`:

```typescript
import { Job } from 'bullmq'
import { db } from '@dota-replay/db'
import { OpenDotaClient } from '@dota-replay/dota-api'
import { logger } from '../lib/logger'

const openDota = new OpenDotaClient()

export interface MatchIngestJobData {
  matchId: bigint
}

export async function processMatch(job: Job<MatchIngestJobData>): Promise<void> {
  const { matchId } = job.data

  logger.info({ matchId: matchId.toString() }, 'Processing match')

  const existingMatch = await db.match.findUnique({
    where: { matchId },
  })

  if (existingMatch) {
    logger.info({ matchId: matchId.toString() }, 'Match already exists')
    return
  }

  const matchData = await openDota.getMatch(matchId)

  await db.match.create({
    data: {
      matchId,
      startTime: new Date(matchData.start_time * 1000),
      durationSeconds: matchData.duration,
      gameMode: matchData.game_mode,
      radiantWin: matchData.radiant_win,
      avgRank: matchData.avg_rank_tier,
      processed: false,
    },
  })

  logger.info({ matchId: matchId.toString() }, 'Match ingested successfully')
}
```

**Step 3: Create workers index**

Create `apps/api/src/workers/index.ts`:

```typescript
import { createWorker } from '../lib/queue'
import { processMatch } from './matchIngest'
import { QUEUES } from '../lib/queue'

export const matchIngestWorker = createWorker(QUEUES.MATCH_INGEST, processMatch)

export function startWorkers() {
  matchIngestWorker.on('completed', (job) => {
    console.log(`Job ${job.id} completed`)
  })

  matchIngestWorker.on('failed', (job, err) => {
    console.error(`Job ${job?.id} failed:`, err)
  })
}
```

**Step 4: Update API entry to optionally start workers**

Create `apps/api/src/worker.ts`:

```typescript
import 'dotenv/config'
import { startWorkers } from './workers'
import { logger } from './lib/logger'

logger.info('Starting workers...')
startWorkers()

process.on('SIGTERM', () => {
  logger.info('Received SIGTERM, shutting down...')
  process.exit(0)
})
```

**Step 5: Add worker script to package.json**

Update `apps/api/package.json` scripts:

```json
{
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "dev:worker": "tsx watch src/worker.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "start:worker": "node dist/worker.js"
  }
}
```

**Step 6: Commit**

```bash
git add .
git commit -m "feat(api): add BullMQ worker infrastructure with match ingest worker"
```

---

## Task 8: Create Root Package Scripts and Finalize

**Files:**
- Modify: `package.json` (root)
- Create: `README.md`

**Step 1: Update root package.json with complete scripts**

Update root `package.json`:

```json
{
  "name": "dota2-replay-hub",
  "version": "0.0.1",
  "private": true,
  "scripts": {
    "dev": "turbo run dev",
    "dev:api": "turbo run dev --filter=@dota-replay/api",
    "dev:web": "turbo run dev --filter=@dota-replay/web",
    "dev:worker": "pnpm --filter @dota-replay/api run dev:worker",
    "build": "turbo run build",
    "lint": "turbo run lint",
    "test": "turbo run test",
    "clean": "turbo run clean && rm -rf node_modules",
    "db:generate": "pnpm --filter @dota-replay/db run db:generate",
    "db:push": "pnpm --filter @dota-replay/db run db:push",
    "db:migrate": "pnpm --filter @dota-replay/db run db:migrate",
    "db:studio": "pnpm --filter @dota-replay/db run db:studio"
  },
  "devDependencies": {
    "turbo": "^2.0.0",
    "typescript": "^5.3.0"
  },
  "packageManager": "pnpm@9.0.0",
  "engines": {
    "node": ">=20"
  }
}
```

**Step 2: Create README.md**

Create `README.md`:

```markdown
# DOTA 2 Replay Hub

A multi-streaming platform for viewing Dota 2 clips and highlighted plays.

## Architecture

- **Frontend**: Next.js 14 (App Router)
- **Backend API**: Fastify + TypeScript
- **Database**: PostgreSQL with Prisma
- **Queue**: BullMQ + Redis
- **Monorepo**: Turborepo + pnpm workspaces

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 9+
- PostgreSQL
- Redis

### Installation

```bash
pnpm install
```

### Environment Setup

1. Copy `.env.example` to `.env` in each package
2. Set `DATABASE_URL` for PostgreSQL
3. Set `REDIS_URL` for Redis
4. Set API keys (Steam, OpenDota, STRATZ, Twitch)

### Database Setup

```bash
pnpm db:generate
pnpm db:push
```

### Development

```bash
# Start all services
pnpm dev

# Start API only
pnpm dev:api

# Start frontend only
pnpm dev:web

# Start background workers
pnpm dev:worker
```

## Project Structure

```
dota/
├── apps/
│   ├── api/          # Fastify backend
│   └── web/          # Next.js frontend
├── packages/
│   ├── db/           # Prisma + PostgreSQL
│   ├── types/        # Shared TypeScript types
│   └── dota-api/     # External API clients
```

## License

MIT
```

**Step 3: Final commit**

```bash
git add .
git commit -m "docs: add README with setup instructions"
```

---

## Summary

The plan creates:

1. **Monorepo structure** with Turborepo + pnpm workspaces
2. **Database package** with Prisma schema for streamers, matches, events, clips, users
3. **Types package** with shared TypeScript types for events, matches, clips, API
4. **Dota API package** with clients for OpenDota, STRATZ, and Steam APIs
5. **API app** with Fastify routes for matches, streamers, and search
6. **Web app** with Next.js 14 App Router and search page
7. **Worker infrastructure** with BullMQ for background processing
8. **Development tooling** with scripts for dev, build, database operations

**Execution handoff**: Plan complete and saved to `docs/plans/2026-03-19-project-structure.md`. Two execution options:

**1. Subagent-Driven (this session)** - I dispatch fresh subagent per task, review between tasks, fast iteration

**2. Parallel Session (separate)** - Open new session with executing-plans, batch execution with checkpoints

**Which approach?**