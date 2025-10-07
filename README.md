# Questify

## Overview

Questify transforms goals into epic quests.

This monorepo uses **Nuxt 3** for the frontend + API layer, **Prisma** for the database, and a **Worker** for AI-driven quest decomposition.

## Structure

* `apps/nuxt` — Frontend & API
* `apps/worker` — Worker for background jobs
* `packages/prisma` — Prisma schema & client
* `packages/shared` — Shared types & utilities

# Development Setup

## Prerequisites

* [Node.js](https://nodejs.org/) (>=18.x)
* [pnpm](https://pnpm.io/) (>=8.x)
* [Docker](https://www.docker.com/) (for Postgres + Redis)

---

## 1. Clone & Install

```bash
git clone https://github.com/YOUR_ORG/questify.git
cd questify
pnpm install
```

---

## 2. Environment Variables

Copy `.env.example` to `.env` in the **root**:

```bash
cp .env.example .env
```

Example contents:

```env
# Database
DATABASE_URL=postgresql://questify:questify@localhost:5432/questify

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
# REDIS_PASSWORD=optional_password
```

---

## 3. Start Postgres & Redis

Using Docker Compose:

```bash
docker compose up -d
```

This will start:

* **Postgres** on port `5432`
* **Redis** on port `6379`

---

## 4. Database Setup

Run Prisma migrations + seed:

```bash
pnpm prisma:migrate
pnpm prisma:seed
```

---

## 5. Nuxt Development

Start the Nuxt 3 frontend + API:

```bash
pnpm dev:nuxt
```

Available at:
👉 [http://localhost:3000](http://localhost:3000)

---

## 6. Redis Queue Plugin (BullMQ)

Questify uses [BullMQ](https://docs.bullmq.io/) for background job processing.

* The queue is initialized in a Nuxt **server plugin**:
  `apps/nuxt/plugins/queue.server.ts`

* Config is loaded from Nuxt runtime config:

```ts
export default defineNuxtConfig({
  runtimeConfig: {
    redis: {
      host: process.env.REDIS_HOST || "localhost",
      port: process.env.REDIS_PORT || "6379",
      password: process.env.REDIS_PASSWORD || "",
    },
  },
});
```

* Access inside API routes or server code:

```ts
const { $questQueue } = useNuxtApp();
await $questQueue.add("decompose", { questId, title, description });
```

---

## 7. TypeScript Support

Custom types for Nuxt app injections are declared in:
`apps/nuxt/plugins/types.d.ts`

This ensures `$questQueue` is strongly typed across the app.

---

# Release & Hotfix Workflow

Questify follows **Git Flow** conventions.

## 8. Creating a Release

```bash
# Make sure you're on develop
git checkout develop
git pull origin develop

# Start a release branch
git flow release start X.Y.Z

# Update changelog and version
# Commit any release-specific changes
git add .
git commit -m "Release X.Y.Z"

# Finish the release (merges into main & develop, tags it)
git flow release finish X.Y.Z

# Push changes and tags
git push origin main
git push origin develop
git push origin --tags
```

> The GitHub Actions workflow will automatically deploy on push tags like `v*.*.*`.

---

## 9. Creating a Hotfix

Hotfixes fix urgent production issues.

```bash
# Start a hotfix branch from main
git checkout main
git pull origin main
git flow hotfix start X.Y.Z

# Apply your hotfix changes
# Commit them
git add .
git commit -m "Hotfix: describe the fix"

# Finish the hotfix (merges into main & develop, tags it)
git flow hotfix finish X.Y.Z

# Push changes and tags
git push origin main
git push origin develop
git push origin --tags
```

> The release pipeline will run automatically for the new hotfix tag.

---

✅ With this setup, contributors can:

* Run Postgres + Redis locally
* Use Prisma migrations and seed data
* Develop Nuxt + BullMQ integrated features
* Follow a clear **release & hotfix process**

---

## 10. Creating a Database Migration

When you need to change the database schema, create a new Prisma migration:

```bash
pnpm prisma:migrate
```
This will:
* Create a new migration file in `packages/prisma/migrations`
* Apply the migration to your local database

Make sure to commit the new migration files to version control.

---

## 11. VSCode Settings

Add the following to `.vscode/settings.json` for automatic ESLint fixes on save:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "dbaeumer.vscode-eslint",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "always"
  },
  "eslint.validate": ["javascript", "typescript", "vue"]
}

```
