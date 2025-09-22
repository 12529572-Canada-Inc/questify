# Stage 1: Builder
FROM node:20-alpine AS builder

WORKDIR /app

COPY . .

# Enable pnpm
RUN corepack enable

# Install all dependencies
RUN pnpm install --frozen-lockfile

# Generate Prisma client
WORKDIR /app/packages/prisma
RUN pnpm prisma generate

# Build worker
WORKDIR /app/apps/worker
RUN pnpm build

# Stage 2: Runner
FROM node:20-alpine AS runner

WORKDIR /app

# Copy built worker + all node_modules
COPY --from=builder /app/apps/worker/dist ./dist
COPY --from=builder /app/apps/worker/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/prisma ./prisma

ENV NODE_ENV=production

CMD ["node", "dist/index.js"]
