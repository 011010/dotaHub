# Dota 2 Replay Hub - Project Structure Design

**Date:** 2026-03-19
**Status:** Approved
**Stack:** Node.js + TypeScript (Fastify) + Next.js + Turborepo

---

## Overview

Monorepo structure for a multi-streaming clip aggregation platform for Dota 2. Based on `dota2-replay-hub-docs.md`.

---

## Tech Stack

| Layer | Technology |
|-------|-------------|
| Frontend | Next.js 14+ (App Router) |
| Backend API | Fastify + TypeScript |
| Database | PostgreSQL (Supabase) |
| ORM | Prisma |
| Cache/Queue | Redis + BullMQ |
| Monorepo | Turborepo + pnpm workspaces |

---

## Project Structure

```
dota/
├── apps/
│   ├── web/                    # Next.js frontend
│   │   ├── src/
│   │   │   ├── app/           # App Router pages
│   │   │   ├── components/    # React components
│   │   │   └── lib/           # Frontend utilities
│   │   ├── public/
│   │   ├── next.config.js
│   │   └── package.json
│   │
│   └── api/                    # Fastify backend
│       ├── src/
│       │   ├── routes/        # API routes
│       │   ├── services/     # Business logic
│       │   ├── workers/      # BullMQ workers
│       │   └── index.ts      # Entry point
│       ├── package.json
│       └── tsconfig.json
│
├── packages/
│   ├── db/                     # Prisma + PostgreSQL
│   │   ├── prisma/
│   │   │   └── schema.prisma
│   │   ├── src/
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   ├── types/                  # Shared TypeScript types
│   │   ├── src/
│   │   │   ├── match.ts
│   │   │   ├── event.ts
│   │   │   ├── clip.ts
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   └── dota-api/               # External API clients
│       ├── src/
│       │   ├── opendota.ts
│       │   ├── stratz.ts
│       │   ├── steam.ts
│       │   └── index.ts
│       └── package.json
│
├── turbo.json
├── package.json
├── pnpm-workspace.yaml
└── .gitignore
```

---

## Database Schema

### Tables

| Table | Purpose |
|-------|---------|
| streamers | Registered streamers with platform account mappings |
| matches | Processed Dota 2 matches |
| events | Highlight events within matches (rampages, kills, etc.) |
| clips | Video clips linked to events |
| users | Users searching for their clips |

### Key Relationships

- `Streamer` → `Clip` (one-to-many)
- `Event` → `Clip` (one-to-many)
- `Match` → `Event` (one-to-many)

---

## API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/matches/:id` | GET | Get match details |
| `/matches/recent` | GET | Get recent matches |
| `/events` | GET | List events (filterable) |
| `/events/:id/clips` | GET | Get clips for an event |
| `/clips` | GET | List clips |
| `/streamers` | GET/POST | List/register streamers |
| `/users/:steamId` | GET | Get user by Steam ID |
| `/search` | GET | Search clips by Steam ID |

---

## Workers (BullMQ)

| Queue | Purpose |
|-------|---------|
| `match:ingest` | Poll OpenDota/STRATZ for new matches |
| `event:extract` | Extract highlighted events from matches |
| `clip:create` | Generate/retrieve clips from streaming platforms |
| `notification:send` | Push notifications to users |

---

## External API Clients

| Client | Purpose |
|--------|---------|
| OpenDota | Match data, parsed replays |
| STRATZ | GraphQL match data, kill events |
| Steam Web API | Basic match info, hero data |
| Twitch Helix | Stream detection, clip creation |
| YouTube Data API | VOD detection, deep links |

---

## Implementation Phases

**Phase 1 (MVP):**
- Core monorepo setup
- Database schema + Prisma
- OpenDota/STRATZ API clients
- Basic API routes
- Match ingest worker
- Simple frontend (search + clip list)

**Phase 2:**
- Twitch integration
- Event extraction
- Clip creation workflow
- Streamer registration

**Phase 3:**
- YouTube integration
- Additional streaming platforms
- Notifications
- Rankings/stats

---

## Next Steps

1. Initialize Turborepo monorepo
2. Set up Prisma with PostgreSQL schema
3. Create shared types package
4. Scaffold Fastify API with basic routes
5. Scaffold Next.js frontend
6. Set up BullMQ with Redis
7. Implement OpenDota client
8. Build match ingest worker