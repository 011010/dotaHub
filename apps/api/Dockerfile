FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate
WORKDIR /app

# ── Install dependencies ────────────────────────────────────────────────────────
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/db/package.json       packages/db/
COPY packages/db/prisma             packages/db/prisma/
COPY packages/types/package.json    packages/types/
COPY packages/dota-api/package.json packages/dota-api/
COPY apps/api/package.json          apps/api/
# web placeholder required for workspace install
COPY apps/web/package.json          apps/web/
RUN pnpm install --frozen-lockfile

# ── Generate Prisma client ──────────────────────────────────────────────────────
FROM deps AS prisma
COPY packages/db/src packages/db/src/
RUN pnpm --filter @dota-replay/db exec prisma generate

# ── Runtime image ───────────────────────────────────────────────────────────────
FROM base AS runner
ENV NODE_ENV=production
RUN apk add --no-cache openssl
COPY --from=prisma /app/node_modules              ./node_modules
COPY --from=prisma /app/packages/db/node_modules  ./packages/db/node_modules/
COPY --from=prisma /app/apps/api/node_modules     ./apps/api/node_modules/
COPY packages  ./packages
COPY apps/api/src        ./apps/api/src
COPY apps/api/package.json ./apps/api/
EXPOSE 3001
CMD ["apps/api/node_modules/.bin/tsx", "apps/api/src/index.ts"]
