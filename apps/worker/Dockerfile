# --- Builder Stage ---
FROM node:20-alpine AS builder

WORKDIR /app

# Enable corepack (so pnpm is available)
RUN corepack enable

# Copy only package manager files first (better cache)
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./

# Copy the rest of the repo
COPY . .

# Install all dependencies (needed to build worker)
RUN pnpm install --frozen-lockfile

# Build the worker app
RUN pnpm --filter worker build

# Deploy worker with production dependencies only
RUN pnpm deploy --filter worker --prod --no-frozen-lockfile /app/worker

# --- Runtime Stage ---
FROM node:20-alpine AS runner

WORKDIR /app

# Copy production worker bundle from builder
COPY --from=builder /app/worker ./

# Set environment to production
ENV NODE_ENV=production

# Run worker
CMD ["node", "dist/index.js"]
