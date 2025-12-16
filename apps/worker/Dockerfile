# ---- Base image ----
FROM node:24-alpine

# ---- System setup ----
WORKDIR /app

# Install Bash (needed for scripts) and other essential tools
RUN apk add --no-cache bash

# Enable Corepack so pnpm is available
RUN corepack enable

# ---- Copy project files ----
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY tsconfig.json ./
COPY scripts ./scripts/
COPY apps/worker ./apps/worker/
COPY packages ./packages/

# ---- Configure pnpm ----
# Allow Prisma and other deps to run postinstall scripts
RUN pnpm config set enable-pre-post-scripts true

# ---- Install dependencies ----
RUN pnpm install --frozen-lockfile --ignore-scripts

# ---- Build apps ----
RUN pnpm build

# ---- Set worker directory ----
WORKDIR /app/apps/worker

# ---- Runtime ----
# Generate Prisma client at runtime with provided DATABASE_URL, then start worker
CMD ["sh", "-c", "pnpm --filter prisma generate && node dist/index.js"]
