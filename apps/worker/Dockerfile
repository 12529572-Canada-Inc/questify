# ---------------------------
# Stage 1: Builder
# ---------------------------
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy workspace manifests
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY tsconfig.json ./

# Copy all source code
COPY apps ./apps
COPY packages ./packages

# Enable Corepack (for pnpm)
RUN corepack enable
ENV CI=true

# Install dependencies (hoisted workspace)
RUN pnpm install --frozen-lockfile

# Generate Prisma client
WORKDIR /app/packages/prisma
RUN pnpm prisma generate

# Build the worker
WORKDIR /app/apps/worker
RUN pnpm build

# ---------------------------
# Stage 2: Runtime
# ---------------------------
FROM node:20-alpine AS runner

WORKDIR /app

# Copy worker dist
COPY --from=builder /app/apps/worker/dist ./dist

# Copy worker package.json
COPY apps/worker/package.json ./package.json

# Copy pnpm lock files (optional, if you ever want to run pnpm install in runtime)
COPY pnpm-lock.yaml ./pnpm-lock.yaml
COPY pnpm-workspace.yaml ./

# Copy hoisted node_modules (includes bullmq and @prisma/client)
COPY --from=builder /app/node_modules ./node_modules

# Copy generated Prisma client
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Set production environment
ENV NODE_ENV=production

# Expose port if needed (optional, for Fly.io apps)
EXPOSE 3000

# Start the worker
CMD ["node", "dist/index.js"]
