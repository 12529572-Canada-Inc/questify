# Questify

## Overview
Questify transforms goals into epic quests.  
This monorepo uses **Nuxt 3** for the frontend + API layer, **Prisma** for the database, and a **Worker** for AI-driven quest decomposition.

## Structure
- `apps/nuxt` — Frontend & API
- `apps/worker` — Worker for background jobs
- `packages/prisma` — Prisma schema & client
- `packages/shared` — Shared types & utilities

## Getting Started
```bash
# Start infra
docker-compose up -d

# Install deps (auto-runs prisma generate)
pnpm install

# Run Prisma migrations
pnpm db:migrate

# Prisma Client auto-updates on install, or run:
pnpm prisma:generate

# Dev Nuxt
pnpm dev:nuxt

# Run worker
pnpm dev:worker
