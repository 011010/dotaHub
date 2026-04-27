# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Install dependencies
pnpm install

# Start all services concurrently
pnpm dev

# Start individual services
pnpm dev:api       # Fastify API on :3001
pnpm dev:web       # Next.js frontend on :3000
pnpm dev:worker    # BullMQ background worker (separate process from API)

# Database
pnpm db:generate   # Regenerate Prisma client after schema changes
pnpm db:push       # Push schema to DB without migrations (dev only)
pnpm db:migrate    # Run Prisma migrations
pnpm db:studio     # Open Prisma Studio

# Build / lint / test
pnpm build
pnpm lint
pnpm test

# Run tests for a single workspace
pnpm --filter @dota-replay/api test
pnpm --filter @dota-replay/web test
```

## Architecture

This is a **Turborepo + pnpm workspaces** monorepo. Package names follow the `@dota-replay/*` convention.

### Apps

| App | Package name | Stack | Default port |
|-----|-------------|-------|-------------|
| `apps/api` | `@dota-replay/api` | Fastify 4 + TypeScript | 3001 |
| `apps/web` | `@dota-replay/web` | Next.js 14 (App Router) + Tailwind | 3000 |

### Packages

| Package | Purpose |
|---------|---------|
| `packages/db` | Prisma client singleton exported as `db` and `prisma` |
| `packages/types` | Shared TypeScript interfaces consumed across apps and packages |
| `packages/dota-api` | HTTP clients for OpenDota, Steam, and STRATZ APIs |

### Data flow

1. **Ingest**: matches enter via the `match:ingest` BullMQ queue → `matchIngestWorker` calls OpenDota → writes to `matches` table.
2. **Queues** (`apps/api/src/lib/queue.ts`): four queues are defined — `match:ingest`, `event:extract`, `clip:create`, `notification:send`. Only `match:ingest` has a worker implemented so far.
3. **API**: Fastify routes under `/matches`, `/streamers`, `/search` talk directly to Postgres via Prisma.
4. **Worker process**: `apps/api/src/worker.ts` is a separate entry point that runs workers independently of the HTTP server (`src/index.ts`).

### Database schema (Prisma)

Core models: `Streamer` → `Clip` ← `Event` ← `Match`. `User` is separate (Steam login). `matchId` / `steamAccountId` fields are `BigInt`.

### Key conventions

- **BigInt IDs**: Dota match IDs and Steam account IDs are stored as `BigInt`. Always call `.toString()` before logging or serializing them.
- **Environment variables**: Each package/app has its own `.env` copied from `.env.example`. The API reads `REDIS_URL`, `CORS_ORIGIN`; the DB package reads `DATABASE_URL`; the web reads `NEXT_PUBLIC_API_URL`.
- **External API clients** in `packages/dota-api` extend `BaseApiClient`. Add API keys via `ApiClientConfig.apiKey` — the base class appends them as `?api_key=` query params automatically.
- **Logging**: use the shared `logger` from `apps/api/src/lib/logger.ts` (pino) rather than `console.log` in the API/worker.

---

## Frontend Design System (`apps/web`)

### Typography

| Token | Value | Usage |
|-------|-------|-------|
| `font-display` | Cinzel (Google Fonts, weights 400/600/700/900) | Headings, badges, labels, buttons |
| `font-sans` | Inter (Google Fonts) | Body text, descriptions |
| `font-mono` | System monospace | Steam IDs, handles, codes |

Cinzel is the closest free equivalent to DOTA 2's Trajan/Friz Quadrata logo font. All major headings use `font-display font-black uppercase tracking-[0.04em]`.

### Color palette

| Token | Hex | Usage |
|-------|-----|-------|
| `text-[#f5ede0]` | `#f5ede0` | Primary heading color (bone white, matches DOTA 2 logo) |
| `quas` | `#4cc9ff` | Quas orb (ice/frost blue) |
| `wex` | `#b066ff` | Wex orb (storm violet) |
| `exort` | `#ff7a1a` | Exort orb (fire orange) |
| `white/[0.03–0.08]` | — | Card backgrounds |
| `white/[0.08–0.20]` | — | Card borders |
| Base background | `#050407` | Global page background |

#### Event badge colors (search page)
| Event | Classes |
|-------|---------|
| `rampage`, `team_wipe` | `text-red-400 border-red-400/40 bg-red-400/10` |
| `ultra_kill` | `text-orange-400 border-orange-400/40 bg-orange-400/10` |
| `triple_kill`, `first_blood` | `text-amber-400/300 border-amber-*/40 bg-amber-*/10` |
| `aegis_steal`, `mega_creeps_win` | `text-yellow-300/400 …` |
| `base_race` | `text-orange-300 …` |
| `comeback` | `text-blue-300 …` |
| `courier_snipe` | `text-white/50 …` |

#### Platform colors (streamers / search)
| Platform | Color |
|----------|-------|
| Twitch | `text-purple-400`, accent `#a855f7` |
| YouTube | `text-red-400`, accent `#ef4444` |
| Kick | `text-green-400`, accent `#22c55e` |
| Trovo | `text-blue-400`, accent `#3b82f6` |
| Facebook | `text-blue-500`, accent `#3b82f6` |

### Page backgrounds

Each page has a distinct radial gradient so they feel related but differentiated:

| Page | Background |
|------|-----------|
| Home (`/`) | `radial-gradient(ellipse at 50% 40%, #1a0a06 0%, #0a0509 45%, #050307 80%, #020103 100%)` — deep amber-red void |
| Search (`/search`) | `radial-gradient(ellipse at 50% 0%, #1a0a06 0%, #080407 40%, #030203 100%)` — red-tinted |
| Streamers (`/streamers`) | `radial-gradient(ellipse at 50% 0%, #0d0a1a 0%, #070408 40%, #030203 100%)` — violet-tinted |

Home uses the full `ChaosBackground` component on top of this. Search and Streamers use only the plain gradient (for readability).

### Animations

All keyframes are defined in `apps/web/src/app/globals.css`. Tailwind animation utilities are in `tailwind.config.ts`.

#### Tailwind animation utilities
| Class | Duration | Usage |
|-------|----------|-------|
| `animate-orb-float` | 6s ease-in-out infinite | Legacy orb float (unused on home) |
| `animate-orb-pulse` | 3.2s ease-in-out infinite | Orb brightness/blur pulse |
| `animate-chaos-drift-a` | 18s ease-in-out infinite | Chaos background plume drift |
| `animate-chaos-drift-b` | 22s ease-in-out infinite | Chaos background plume drift |
| `animate-ember-rise` | varies (linear infinite) | Rising ember particles |
| `animate-fade-up` | 1.2s cubic-bezier both | Hero content entrance |

#### CSS-only keyframes (globals.css)
| Keyframe | Purpose |
|----------|---------|
| `orbit-path` | Drives `offset-distance 0→100%` for elliptical orb travel |
| `plasma-morph` | Morphing `border-radius` so orbs look like plasma, not perfect spheres |
| `orb-frost-fall` | Quas frost particles drifting down |
| `orb-spark-burst` | Wex electric sparks bursting outward (uses `--tx`/`--ty` CSS vars) |
| `orb-ember-up` | Exort embers rising upward |
| `orb-arc-flicker` | Wex arc opacity flicker (transform is static, set inline) |
| `orb-flame-morph` | Exort flame aura morphing blob |
| `orb-shockwave` | Invocation pulse shockwave expanding from center |
| `orb-replace` | Collapse → re-emerge when orb element changes (triggered by key remount) |
| `plasma-burst` | Background plasma explosion (70% invisible, quick burst) |
| `lightning-flash` | Background lightning (defined but not rendered — removed from UI) |
| `tornado-spin` | Background tornado rotation (defined but not rendered — replaced by EnergyColumn) |

### Component map

| File | Description |
|------|-------------|
| `src/components/SiteHeader.tsx` | Shared header — logo "D" box, "DOTA REPLAY HUB", nav links (Search, Streamers, Sign in) |
| `src/components/ChaosBackground.tsx` | Home page background: void gradient + `EnergyColumn` wisps + drifting plumes + `PlasmaBurst` explosions + rising embers + film grain |
| `src/components/InvokerOrbs.tsx` | Three animated Invoker orbs (Quas/Wex/Exort) orbiting on chaotic ellipses behind the hero title |

#### `InvokerOrbs` internals
- Each orb uses `offset-path: ellipse(rx ry at 50% 50%)` + `offset-distance` animation for true elliptical orbit.
- The ellipse plane is tilted by wrapping in a `rotate(Ndeg)` parent (`tiltDeg` per orb).
- `offset-rotate: 0deg` prevents orb rotation while traveling the path.
- All three orbit in the same direction; phase offset is set via negative `animation-delay` (0%, 33%, 66% of cycle).
- Orb visual = `orb-pulse` + `plasma-morph` animations combined on the same element.
- Element cycling: `useEffect` + `setInterval` per orb with individual `cycleMs` and `cycleDelayMs`.
- Element change animation: `key={replaceKey}` increment forces React unmount/remount → restarts `orb-replace` keyframe.
- Sub-effects per element: `ParticleLayer` (frost/spark/ember), `WexArcs` (4 rotating thin lines), `ExortFlame` (blurred orange aura).
- Invocation pulse: fires every 13.5s, remounts a shockwave div via `key={invocationKey}`.

### Pages

| Route | File | Status | Notes |
|-------|------|--------|-------|
| `/` | `src/app/page.tsx` | Done | Hero with ChaosBackground + InvokerOrbs, fade-up entrance animation |
| `/search` | `src/app/search/page.tsx` | Done | Steam ID search, clip card grid (2–3 cols), event/platform badges |
| `/streamers` | `src/app/streamers/page.tsx` | Done | Streamer roster grid, platform accent bars, verified badge, skeleton loading |
| `/login` | `src/app/login/page.tsx` | Stub | Exists to satisfy Next.js `typedRoutes`; no content yet |

### API client (`src/lib/api.ts`)

- Base URL: `NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'`
- `apiFetch` wraps `fetch` with an `AbortController` timeout (default 8s) to avoid hanging when the API is unreachable.
- Endpoints: `api.search.bySteamId`, `api.matches.{recent,get}`, `api.streamers.{list,get}`.

### UI conventions

- **No rounded corners** on cards/inputs/buttons — sharp edges reinforce the dark tactical aesthetic.
- **Backdrop blur** (`backdrop-blur-sm`) on interactive elements and header for depth.
- **`mix-blend-mode: screen`** on all glow/plasma/ember layers so they add light rather than cover.
- All interactive borders start at `white/[0.08–0.15]` and transition to `white/20–40` on hover.
- Labels above headings: `text-[10px] uppercase tracking-[0.5em] text-white/35`.
- Section headings: `font-display text-3xl sm:text-4xl font-black uppercase tracking-[0.04em] text-[#f5ede0]`.
- Empty/idle states: centered column, `AWAITING INVOCATION` / `NO RESULTS` in `text-[10px] uppercase tracking-[0.5em] text-white/25–30`.

---

## Current Progress

### Done
- [x] Monorepo scaffolding (Turborepo + pnpm workspaces)
- [x] Fastify API with routes: `/matches`, `/streamers`, `/search`
- [x] BullMQ worker infrastructure + `match:ingest` worker
- [x] Prisma schema + DB package
- [x] Next.js frontend — home, search, streamers pages
- [x] Design system: Cinzel font, orb colors, event colors, platform colors
- [x] Home hero: ChaosBackground + InvokerOrbs (elliptical orbits, elemental FX, invocation pulse)
- [x] Search page: Steam ID input → clip card grid with event/platform color coding
- [x] Streamers page: roster grid with platform accent bars + verified badge + skeleton loading

### Pending
- [ ] `/login` — Steam OpenID authentication
- [ ] `event:extract` worker — parse match timeline, detect events (rampage, first blood, etc.)
- [ ] `clip:create` worker — call Twitch/YouTube clip API after event detected
- [ ] `notification:send` worker — notify users when their clip is ready
- [ ] Streamer detail page (`/streamers/[steamId]`)
- [ ] Pagination on search results
- [ ] Hero name/image on clip cards (requires hero mapping from OpenDota)
