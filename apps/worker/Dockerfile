# Stage 1: Builder
FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy root and worker package manifests for install
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/prisma/package.json ./packages/prisma/
COPY apps/worker/package.json ./apps/worker/

# Install all dependencies (including dev for build)
RUN pnpm install --frozen-lockfile

# Copy the rest of the monorepo
COPY . .

# Generate Prisma client
RUN pnpm --filter prisma generate

# Build the worker (assumes tsconfig.json in apps/worker/)
RUN pnpm --filter worker run tsc

# Stage 2: Runner
FROM node:20-alpine AS runner

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy only necessary files from builder
COPY --from=builder /app/apps/worker/package.json ./package.json
COPY --from=builder /app/apps/worker/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/prisma ./packages/prisma

# Runtime env vars (DATABASE_URL, REDIS_HOST, etc. provided at run)
ENV NODE_ENV=production

# Start the worker
CMD ["node", "dist/index.js"]
