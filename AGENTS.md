# Repository Guidelines

## Project Structure & Module Organization
- `apps/nuxt/` is the Nuxt 4 UI; pages and components live in `app/`, layouts in `layouts/`, API handlers in `server/`, and static assets in `public/`.
- `apps/worker/` runs the background queue processor with entry `src/index.ts` and Vitest suites in `tests/`.
- `packages/shared/` holds reusable TypeScript utilities shared across workspaces; keep browser- or worker-specific logic out of this package.
- `packages/prisma/` centralizes the Prisma schema, migrations, and seeds (`seed.ts`); treat it as the source of truth for database changes.
- `scripts/` contains operational helpers such as `prepare-safe.sh` and `upgrade-nuxt.sh`; extend these scripts instead of duplicating logic.

## Build, Test, and Development Commands
- `pnpm dev:nuxt` starts the Nuxt dev server with HMR; `pnpm dev:worker` launches the worker in watch mode.
- `pnpm build` executes the recursive workspace build and should pass before publishing images or deployments.
- `pnpm lint` (or `pnpm lint:nuxt`, `pnpm lint:worker`) applies the ESLint configs; fix issues with `pnpm format`.
- `pnpm test` runs Nuxt, worker, and shared unit suites; use `pnpm test:coverage` when coverage is required for approvals.
- Database work: `pnpm prisma:migrate` for local migrations, `pnpm prisma:deploy` for environments, always followed by `pnpm prisma:generate`.

## Coding Style & Naming Conventions
- TypeScript and Vue files use two-space indentation, single quotes, and the shared ESLint rules in each workspace’s `eslint.config.mjs`.
- Vue components and composables use `PascalCase` filenames and Nuxt auto-imports; composables start with `use`.
- Worker and shared modules use `camelCase` functions, `PascalCase` classes, and colocated `.spec.ts` tests or `__mocks__` directories when needed.

## Testing Guidelines
- Unit tests rely on Vitest; keep Nuxt specs in `apps/nuxt/tests/`, worker specs beside source files, and shared specs in `packages/shared/tests/`.
- Run Playwright end-to-end suites with `pnpm --filter nuxt test:e2e` when changing user flows; trim artifacts in `test-results/` before committing.
- Target meaningful coverage rather than snapshots; verify with `vitest run --coverage` locally and avoid committing generated `coverage/` folders.

## Commit & Pull Request Guidelines
- Follow the conventional commit style visible in `git log` (e.g., `fix:`, `docs:`, optionally a scope).
- Keep commits focused and reversible; include schema or queue notes when relevant.
- Pull requests need a summary, linked issue, testing evidence (screenshots or CLI output), and rollout considerations such as migrations or feature flags.
- Request reviews from both front-end and backend owners when changes span Nuxt and worker code.
