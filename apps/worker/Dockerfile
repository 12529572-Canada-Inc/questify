# Stage 1: Builder
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY tsconfig.json ./
COPY apps/worker ./apps/worker
COPY packages ./packages

RUN corepack enable

# Install all dependencies (workspace-aware)
RUN pnpm install --frozen-lockfile

# Generate Prisma client
RUN pnpm --filter prisma generate

# Build worker
RUN pnpm --filter worker build

# Stage 2: Runtime
FROM node:20-alpine AS runner

WORKDIR /app

COPY --from=builder /app/apps/worker/dist ./dist
COPY --from=builder /app/apps/worker/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/prisma ./prisma

ENV NODE_ENV=production

CMD ["node", "dist/index.js"]
