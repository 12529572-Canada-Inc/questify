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
RUN pnpm install --frozen-lockfile

# ---- Run safe prepare ----
# Ensures Prisma client is generated safely, even if optional
RUN sh ./scripts/prepare-safe.sh || echo "⚠️ Safe prepare failed — continuing anyway."

# ---- Build apps ----
RUN pnpm build

# ---- Set worker directory ----
WORKDIR /app/apps/worker

# ---- Runtime ----
CMD ["node", "dist/index.js"]
