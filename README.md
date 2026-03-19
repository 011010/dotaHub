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