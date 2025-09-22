# Stage 1: Builder
FROM node:20-alpine AS builder

WORKDIR /app

RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY tsconfig.json ./
COPY apps/worker ./apps/worker
COPY packages ./packages

# Install all dependencies
RUN pnpm install --frozen-lockfile

# Generate Prisma client
RUN pnpm --filter prisma generate

# Build worker
RUN pnpm --filter worker build


# Stage 2: Runtime
FROM node:20-alpine AS runner

WORKDIR /app

RUN corepack enable

# Copy only what we need
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/worker/package.json ./apps/worker/
COPY apps/worker/dist ./apps/worker/dist
COPY packages/prisma ./packages/prisma

# Install only production deps for worker
RUN pnpm install --filter worker --prod --frozen-lockfile

WORKDIR /app/apps/worker
ENV NODE_ENV=production

# 🔍 Debug: confirm bullmq is present in node_modules
RUN ls -R /app/node_modules | grep bullmq || echo "⚠️ bullmq not found!"

CMD ["node", "dist/index.js"]
