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

- Node.js 18+
- pnpm 8+
- Docker (for local Postgres + Redis)

## Quick Start

```bash
pnpm install
cp .env.example .env          # adjust secrets as needed
docker compose up -d          # launches Postgres (5432) + Redis (6379)
pnpm prisma:migrate
pnpm prisma:seed
pnpm dev:nuxt                 # http://localhost:3000
pnpm dev:worker               # runs the queue worker with hot reload
```

### Environment Notes

- `.env` in the repository root configures both Nuxt runtime config and worker bindings.
- Set `OPENAI_API_KEY` (or equivalent provider key) before enabling AI-powered quest generation.
- Optional providers:
  - `ANTHROPIC_API_KEY` unlocks Claude models (defaults to API version `2023-06-01`, override via `ANTHROPIC_API_VERSION`).
  - `DEEPSEEK_API_KEY` + `DEEPSEEK_BASE_URL` (defaults to `https://api.deepseek.com/v1`) enable DeepSeek chat/coder models.
- Configure the model catalog via `AI_MODEL_CONFIG_JSON` (inline JSON) or `AI_MODEL_CONFIG_PATH` (JSON file). When unset, Questify falls back to the built-in mix of OpenAI, Anthropic, and DeepSeek models.
- Redis credentials map to `runtimeConfig.redis` (Nuxt) and `packages/shared/src/config/redis.ts` (worker).
- OAuth sign-in providers use the `NUXT_OAUTH_<PROVIDER>_CLIENT_ID` / `NUXT_OAUTH_<PROVIDER>_CLIENT_SECRET` pattern (e.g., Google, Facebook). Configure them in your `.env` to enable the social login buttons.

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

## State Management

- Global state now uses [Pinia](https://pinia.vuejs.org/) through the `@pinia/nuxt` module with stores in `apps/nuxt/stores/`.
- `useUserStore()` wraps the session plugin to expose a typed `user`, role/privilege helpers, and `fetchSession()`/`clearSession()` actions.
- `useQuestStore()` caches quest listings, exposes mutation helpers (`setQuests`, `upsertQuest`), and refreshes after quest creation.
- `useUiStore()` controls UI preferences such as dark/light mode and persists selections via cookies while synchronising Vuetify theme state.
- Store unit tests live under `apps/nuxt/tests/unit/stores/` so behaviour stays covered as modules evolve.

## Testing

- Unit/component suites: `pnpm test` runs Vitest across Nuxt, worker, and shared packages.
- Coverage: `pnpm test:coverage` (Vitest + V8 outputs under each workspace `coverage/` directory)
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
