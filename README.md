# Questify

## Overview

Questify transforms goals into epic quests.  

This monorepo uses **Nuxt 3** for the frontend + API layer, **Prisma** for the database, and a **Worker** for AI-driven quest decomposition.

## Structure

- `apps/nuxt` — Frontend & API
- `apps/worker` — Worker for background jobs
- `packages/prisma` — Prisma schema & client
- `packages/shared` — Shared types & utilities

## Setup

1. Clone the repository:
```
git clone https://github.com/your-org/questify.git
cd questify
```

2. Install dependencies:

```
pnpm install
```

3. Copy environment files:

```
cp .env.example .env
cp packages/prisma/.env.example packages/prisma/.env
```

4. Start database with Docker:

```
docker-compose up -d
```

5. Run database migrations:

```
pnpm db:migrate
```

6. Seed the database:

```
pnpm db:seed
```

7. Start Nuxt app:

```
pnpm dev:nuxt
```

8. Open http://localhost:3000

## Development

- `pnpm dev:nuxt` → run Nuxt frontend
- `pnpm dev:worker` → run background worker
- `pnpm db:migrate` → apply DB migrations
- `pnpm db:seed` → seed DB with demo data
