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

# Build worker
RUN pnpm --filter worker build

# Stage 2: Runtime
FROM node:20-alpine AS runner

WORKDIR /app

RUN corepack enable

# Copy the entire workspace (so pnpm knows about it)
COPY --from=builder /app ./

# Deploy only the worker app + its runtime deps
RUN pnpm deploy --filter worker --prod --no-frozen-lockfile --dir /app/apps/worker

WORKDIR /app/apps/worker

ENV NODE_ENV=production

CMD ["node", "dist/index.js"]
