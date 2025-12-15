# Questify

Questify turns personal and team goals into narrative quests powered by AI-assisted planning. The monorepo pairs a Nuxt 4 application with Prisma-backed persistence and a background worker that orchestrates queue-heavy workloads.

## Monorepo Layout

| Path | Purpose |
| --- | --- |
| `apps/nuxt/` | Nuxt 4 UI + Nitro API, Playwright E2E suites, and Vitest component tests |
| `apps/nuxt/stores/` | Pinia stores for user session, quest listings, and UI preferences |
| `apps/worker/` | BullMQ-backed worker processing quest decomposition and notifications |
| `packages/shared/` | Reusable TypeScript utilities consumed by the Nuxt app and worker |
| `packages/prisma/` | Prisma schema, migrations, generated client, and seed scripts |
| `scripts/` | Operational helpers (`prepare-safe.sh`, `upgrade-nuxt.sh`, etc.) |

## Requirements

- Node.js 20.19+ (Prisma 7 requirement)
- pnpm 8+
- TypeScript 5.1+ (repo pins 5.6.x for tooling)
- Docker (for local Postgres + Redis)
- Prisma 7 with the PostgreSQL adapter; `DATABASE_URL` must be set (in `.env` or `packages/prisma/.env`) before running `pnpm install` so `prisma generate` can bootstrap during prepare.

## Quick Start

```bash
pnpm install
cp .env.example .env          # adjust secrets as needed
cp packages/prisma/.env.example packages/prisma/.env  # ensure DATABASE_URL is present for Prisma adapter config
docker compose up -d          # launches Postgres (5432) + Redis (6379)
pnpm prisma:migrate
pnpm prisma:seed
pnpm dev:nuxt                 # http://localhost:3000
pnpm dev:worker               # runs the queue worker with hot reload
```

### Environment Notes

- `.env` in the repository root configures both Nuxt runtime config and worker bindings.
- **AI Assist prerequisites:** Set `NUXT_FEATURE_AI_ASSIST=true` and provide at least one provider key (`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, or `DEEPSEEK_API_KEY` + `DEEPSEEK_BASE_URL` if overriding the default) so the worker and Nuxt API can call the selected model. Optional catalog overrides use `AI_MODEL_CONFIG_JSON` or `AI_MODEL_CONFIG_PATH`. Individual users can toggle assistance in **Settings → Quest AI Assistance**.
- **Quest image uploads:** Configure Cloudinary with `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET`. The Nuxt API signs uploads at `/api/uploads/cloudinary-signature`, and the UI sends quest/investigation images directly to Cloudinary to avoid API payload limits. Customize the target folder with `CLOUDINARY_UPLOAD_FOLDER` (defaults to `questify/quests`).
- **Support assistant issue submission:** Provide a GitHub personal access token (`GITHUB_TOKEN`) plus `GITHUB_REPO_OWNER` and `GITHUB_REPO_NAME`. Use the `repo` scope for private repositories or `public_repo` for public ones so the in-app form can create issues.
- Redis credentials map to `runtimeConfig.redis` (Nuxt) and `packages/shared/src/config/redis.ts` (worker).
- OAuth sign-in providers use the `NUXT_OAUTH_<PROVIDER>_CLIENT_ID` / `NUXT_OAUTH_<PROVIDER>_CLIENT_SECRET` pattern (e.g., Google, Facebook). Configure them in your `.env` to enable the social login buttons.
- Redis credentials map to `runtimeConfig.redis` (Nuxt) and `packages/shared/src/config/redis.ts` (worker).
- OAuth sign-in providers use the `NUXT_OAUTH_<PROVIDER>_CLIENT_ID` / `NUXT_OAUTH_<PROVIDER>_CLIENT_SECRET` pattern (e.g., Google, Facebook). Configure them in your `.env` to enable the social login buttons.
  - **Google OAuth callback URL**: `http://localhost:3000/api/auth/oauth/google` (local) or `https://yourdomain.com/api/auth/oauth/google` (production)
  - **Facebook OAuth callback URL**: `http://localhost:3000/api/auth/oauth/facebook` (local) or `https://yourdomain.com/api/auth/oauth/facebook` (production)

## Development Workflow

- Frontend/API: `pnpm dev:nuxt` supports Hot Module Reloading and auto-imported composables.
- Background jobs: `pnpm dev:worker` runs `src/index.ts` via `tsx`. Jobs enqueue from Nuxt server plugins (`apps/nuxt/plugins/queue.server.ts`).
- Build all workspaces: `pnpm build`
- Linting + formatting: `pnpm lint` and `pnpm format`
- Database operations: `pnpm prisma:migrate`, `pnpm prisma:deploy`, `pnpm prisma:generate`, `pnpm prisma:seed`

## Dashboard View

- Authenticated users land on `/dashboard`, a Vuetify-driven overview replacing the legacy hero card home after login.
- Metrics load from `/api/users/me/metrics` to surface quest totals, task completion rate, and last active timestamps.
- Quick actions link directly to private quest management (`/quests`) and community public quests (`/`), keeping navigation snappy on desktop and mobile.

## Quest AI Assistance

- Feature-flagged via `NUXT_FEATURE_AI_ASSIST`, the quest form surfaces "Improve with AI" buttons beside each field to request suggestions without overwriting existing text.
- Suggestions are generated using the model selected on the form and routed through the shared AI runner that supports OpenAI, Anthropic, and DeepSeek providers.
- Individual users can enable or disable the helper in-app from **Settings → Quest AI Assistance**, with usage tracked through lightweight telemetry.

## State Management

- Global state now uses [Pinia](https://pinia.vuejs.org/) through the `@pinia/nuxt` module with stores in `apps/nuxt/stores/`.
- `useUserStore()` wraps the session plugin to expose a typed `user`, role/privilege helpers, and `fetchSession()`/`clearSession()` actions.
- `useQuestStore()` caches quest listings, exposes mutation helpers (`setQuests`, `upsertQuest`), and refreshes after quest creation.
- `useUiStore()` controls UI preferences such as dark/light mode and AI assistance, persisting selections via cookies while synchronising Vuetify theme state.
- Store unit tests live under `apps/nuxt/tests/unit/stores/` so behaviour stays covered as modules evolve.

## Testing

- Unit/component suites: `pnpm test` runs Vitest across Nuxt, worker, and shared packages.
- Coverage: `pnpm test:coverage` (Vitest + V8 outputs under each workspace `coverage/` directory). Guardrails live in `reports/coverage-threshold.json` and are read directly by every Vitest config plus the CI coverage gate, so tests fail locally/CI if statements/branches/functions/lines dip below those numbers. After a legitimate coverage bump, run `pnpm coverage:baseline:update` (alias for `pnpm coverage:report -- --write`) and commit the refreshed `reports/coverage-baseline.md` snapshot.
- End-to-end: `pnpm --filter nuxt test:e2e` executes Playwright specs located in `apps/nuxt/tests/e2e/`.
- Run a focused test: `pnpm --filter worker exec vitest run src/queues/__tests__/quest.queue.spec.ts`

## Background Jobs & RBAC

- BullMQ queues initialise through Nuxt server plugins and reuse the Redis connection defined in runtime config.
- The worker loads shared Prisma clients for transactional work; keep long-running tasks idempotent to support retries.
- Questify ships with seeded RBAC roles (`SuperAdmin`, `Admin`, `Support`). Administration views surface under the **Administration** navigation item for privileged users. Recovery flows live in *Administration → System Settings*.

## Release Process

- Branching follows Git Flow conventions (`develop` → `release/*` → `main`).
- Tagging `v*.*.*` triggers the deployment pipeline through GitHub Actions.
- Hotfixes branch directly from `main` (`git flow hotfix start`) and merge back into both `main` and `develop`.

## Contributing

- Review the contributor guide in [`AGENTS.md`](./AGENTS.md) for coding standards, testing expectations, and PR etiquette.
- File issues or feature requests via GitHub Discussions; link them in pull request descriptions.
- Editors such as VS Code should enable ESLint auto-fixes on save (`.vscode/settings.json` has sample defaults).

Happy questing! 🚀
