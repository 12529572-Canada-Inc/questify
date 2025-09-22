# Stage 1: Builder
FROM node:20-alpine AS builder

WORKDIR /app

# Copy all files for building
COPY . .

# Enable pnpm
RUN corepack enable

# Set CI to avoid TTY errors
ENV CI=true

# Install all dependencies (for build)
RUN pnpm install --frozen-lockfile

# Generate Prisma client
WORKDIR /app/packages/prisma
RUN pnpm prisma generate

# Build worker
WORKDIR /app/apps/worker
RUN pnpm build

# Stage 2: Runtime (Production)
FROM node:20-alpine AS runner

WORKDIR /app

# Copy built worker
COPY --from=builder /app/apps/worker/dist ./dist
COPY apps/worker/package.json ./package.json
COPY pnpm-workspace.yaml ./
COPY pnpm-lock.yaml ./

# Enable pnpm & install **production dependencies only**
RUN corepack enable \
    && CI=true \
    && pnpm install --prod

# Copy Prisma client
COPY --from=builder /app/packages/prisma ./prisma

ENV NODE_ENV=production

# Run worker
CMD ["node", "dist/index.js"]
