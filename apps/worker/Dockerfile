# ---------------------------
# Stage 1: Builder
# ---------------------------
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY tsconfig.json ./
COPY apps ./apps
COPY packages ./packages

RUN corepack enable
ENV CI=true

# Install all dependencies for workspace
RUN pnpm install --frozen-lockfile

# Generate Prisma client
WORKDIR /app/packages/prisma
RUN pnpm prisma generate

# Build worker
WORKDIR /app/apps/worker
RUN pnpm build

# ---------------------------
# Stage 2: Runtime
# ---------------------------
FROM node:20-alpine AS runner

WORKDIR /app

# Copy built worker
COPY --from=builder /app/apps/worker/dist ./dist

# Copy worker package.json (needed for runtime)
COPY apps/worker/package.json ./package.json

# Copy hoisted node_modules (includes @prisma/client + bullmq)
COPY --from=builder /app/node_modules ./node_modules

# Set production env
ENV NODE_ENV=production

CMD ["node", "dist/index.js"]
