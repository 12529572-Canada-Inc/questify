# Stage 1: Builder
FROM node:20-alpine AS builder

WORKDIR /app

COPY . .

RUN corepack enable
ENV CI=true
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

# Copy built worker
COPY --from=builder /app/apps/worker/dist ./dist
COPY apps/worker/package.json ./package.json
COPY pnpm-lock.yaml ./pnpm-lock.yaml
COPY pnpm-workspace.yaml ./

# Copy generated Prisma client
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/prisma/node_modules/.prisma ./prisma/.prisma

ENV NODE_ENV=production

CMD ["node", "dist/index.js"]
