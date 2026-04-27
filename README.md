# DOTA 2 Replay Hub

Find every clip where pro streamers crossed paths with you in Dota 2. Enter your Steam ID — we surface every moment a pro was in your lobby and caught it on stream.

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router) + Tailwind CSS v3 |
| Backend API | Fastify 4 + TypeScript |
| Database | PostgreSQL via Prisma |
| Queue | BullMQ + Redis |
| Monorepo | Turborepo + pnpm workspaces |

## Project Structure

```
dota/
├── apps/
│   ├── api/          # Fastify backend — :3001
│   └── web/          # Next.js frontend — :3000
└── packages/
    ├── db/           # Prisma client singleton
    ├── types/        # Shared TypeScript interfaces
    └── dota-api/     # OpenDota, Steam, STRATZ HTTP clients
```

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

Copy `.env.example` → `.env` in each package/app and fill in the values:

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
cp packages/db/.env.example packages/db/.env
```

Key variables:

| Variable | Where | Description |
|----------|-------|-------------|
| `DATABASE_URL` | `packages/db`, `apps/api` | PostgreSQL connection string |
| `REDIS_URL` | `apps/api` | Redis connection string |
| `NEXT_PUBLIC_API_URL` | `apps/web` | Fastify API base URL (default `http://localhost:3001`) |
| `STEAM_API_KEY` | `apps/api` | Steam Web API key |
| `OPENDOTA_API_KEY` | `apps/api` | OpenDota API key (optional, increases rate limit) |
| `TWITCH_CLIENT_ID/SECRET` | `apps/api` | Twitch clip creation |

### Database Setup

```bash
pnpm db:generate   # generate Prisma client
pnpm db:push       # push schema to DB (dev)
```

### Development

```bash
pnpm dev           # all services concurrently
pnpm dev:api       # Fastify API only — :3001
pnpm dev:web       # Next.js only — :3000
pnpm dev:worker    # BullMQ workers only
```

---

## Pages

| Route | Description | Status |
|-------|-------------|--------|
| `/` | Hero landing — Invoker orbs + chaos background | Done |
| `/search` | Search by Steam ID → clip grid | Done |
| `/streamers` | Pro streamer roster with platform badges | Done |
| `/login` | Steam OpenID login | Stub |

---

## Design System

### Typography

- **Display** — [Cinzel](https://fonts.google.com/specimen/Cinzel) (Google Fonts). Used for all headings, labels, badges, and buttons. Closest free equivalent to DOTA 2's Trajan logo font.
- **Sans** — Inter. Body text and descriptions.
- **Mono** — System monospace. Steam IDs and platform handles.

### Colors

| Token | Value | Usage |
|-------|-------|-------|
| Bone white | `#f5ede0` | Primary heading color |
| Quas | `#4cc9ff` | Ice/frost orb |
| Wex | `#b066ff` | Storm/violet orb |
| Exort | `#ff7a1a` | Fire/orange orb |
| Base background | `#050407` | Global dark base |

Platform accent colors: Twitch `#a855f7` · YouTube `#ef4444` · Kick `#22c55e` · Trovo/Facebook `#3b82f6`

### Visual conventions

- Sharp corners (no border-radius on cards, inputs, buttons) — tactical aesthetic.
- `mix-blend-mode: screen` on all glow layers — additive light, nothing covers.
- Cards: `bg-white/[0.03] border-white/[0.08]` → hover `bg-white/[0.06] border-white/20`.
- Section labels: `text-[10px] uppercase tracking-[0.5em] text-white/35` above headings.
- All heading text: `font-display font-black uppercase tracking-[0.04em] text-[#f5ede0]`.

### Home hero

The home page features three animated Invoker orbs (Quas · Wex · Exort) orbiting on chaotic ellipses behind the title:

- True elliptical orbit via CSS `offset-path: ellipse()` + `offset-distance` animation — each orb has a unique radius, tilt, and speed.
- Orbs look like plasma (not perfect spheres) via combined `orb-pulse` (blur/brightness) + `plasma-morph` (border-radius morphing) keyframes.
- Per-element particle effects: frost particles (Quas), electric arcs + sparks (Wex), embers + flame aura (Exort).
- Invocation shockwave pulse every 13.5s.
- Background: energy column wisps at screen edges, drifting plasma plumes, radial gradient explosions, rising embers, film grain overlay.

### Animations

| Name | File | Usage |
|------|------|-------|
| `orbit-path` | globals.css | Elliptical orb travel |
| `plasma-morph` | globals.css | Orb shape morphing |
| `orb-pulse` | tailwind.config.ts | Orb brightness/blur pulse |
| `orb-frost-fall` | globals.css | Quas frost particles |
| `orb-spark-burst` | globals.css | Wex spark burst |
| `orb-ember-up` | globals.css | Exort rising embers |
| `orb-arc-flicker` | globals.css | Wex electric arc flicker |
| `orb-flame-morph` | globals.css | Exort flame aura morph |
| `orb-shockwave` | globals.css | Invocation pulse ring |
| `orb-replace` | globals.css | Element-change collapse/emerge |
| `plasma-burst` | globals.css | Background explosion bursts |
| `chaos-drift-a/b` | tailwind.config.ts | Background plume drift |
| `ember-rise` | tailwind.config.ts | Background rising embers |
| `fade-up` | tailwind.config.ts | Content entrance |

---

## Data Pipeline (Backend)

```
Streamer live → match ID detected
  → match:ingest queue
    → matchIngestWorker → OpenDota API → matches table
      → event:extract queue  [pending]
        → parse timeline → events table
          → clip:create queue  [pending]
            → Twitch/YouTube clip API → clips table
              → notification:send queue  [pending]
                → notify users
```

Only `match:ingest` worker is implemented. The remaining three workers are scaffolded as queue definitions.

---

## Progress

### Done
- [x] Monorepo, Fastify API, Prisma schema, BullMQ infrastructure
- [x] `match:ingest` worker
- [x] Next.js frontend — home, search, streamers pages
- [x] Full design system (typography, colors, animations)

### Pending
- [ ] Steam OpenID authentication (`/login`)
- [ ] `event:extract`, `clip:create`, `notification:send` workers
- [ ] Streamer detail page (`/streamers/[steamId]`)
- [ ] Search pagination
- [ ] Hero name/image lookup on clip cards

## License

MIT
