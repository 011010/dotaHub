FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate
WORKDIR /app

# ── Install dependencies ────────────────────────────────────────────────────────
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/types/package.json packages/types/
COPY apps/web/package.json       apps/web/
# api placeholder
COPY apps/api/package.json       apps/api/
COPY packages/db/package.json    packages/db/
COPY packages/dota-api/package.json packages/dota-api/
RUN pnpm install --frozen-lockfile

# ── Build Next.js ───────────────────────────────────────────────────────────────
FROM base AS builder
COPY --from=deps /app/node_modules          ./node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY packages/types ./packages/types
COPY apps/web       ./apps/web
# NEXT_PUBLIC_API_URL is embedded at build time — browser calls this URL directly
ARG NEXT_PUBLIC_API_URL=http://localhost:3001
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
RUN pnpm --filter @dota-replay/web build

# ── Runtime image (standalone) ──────────────────────────────────────────────────
FROM node:20-alpine AS runner
ENV NODE_ENV=production
WORKDIR /app

COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static     ./apps/web/.next/static
COPY --from=builder /app/apps/web/public           ./apps/web/public

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
CMD ["node", "apps/web/server.js"]
