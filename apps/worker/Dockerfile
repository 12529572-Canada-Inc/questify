# Stage 1: Builder
FROM node:20-alpine AS builder

WORKDIR /app

# Copy only relevant files
COPY apps/worker ./apps/worker
COPY packages/prisma ./packages/prisma
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY tsconfig.json ./

# Install pnpm
RUN corepack enable

# Install dependencies (only what's needed for build)
RUN pnpm install --frozen-lockfile

# Generate Prisma client inside the container
WORKDIR /app/packages/prisma
RUN pnpm prisma generate

# Build worker
WORKDIR /app/apps/worker
RUN pnpm build

###

# Stage 2: Runtime
FROM node:20-alpine AS runner

WORKDIR /app

# Copy only built worker + node_modules
COPY --from=builder /app/apps/worker/dist ./dist
COPY --from=builder /app/apps/worker/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/prisma ./prisma

ENV NODE_ENV=production

CMD ["node", "dist/index.js"]
