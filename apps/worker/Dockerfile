# Stage 1: Builder
FROM node:20-alpine AS builder

WORKDIR /app

# Copy all files
COPY . .

# Enable pnpm
RUN corepack enable

# Set CI to avoid TTY errors
ENV CI=true

# Install all workspace dependencies
RUN pnpm install --frozen-lockfile

# Generate Prisma client
WORKDIR /app/packages/prisma
RUN pnpm prisma generate

# Build worker
WORKDIR /app/apps/worker
RUN pnpm build

# Stage 2: Runtime
FROM node:20-alpine AS runner

WORKDIR /app

# Copy built worker + dependencies + prisma client
COPY --from=builder /app/apps/worker/dist ./dist
COPY --from=builder /app/apps/worker/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/prisma ./prisma

ENV NODE_ENV=production

# Fly.io runs as root by default, so we can keep CMD simple
CMD ["node", "dist/index.js"]
