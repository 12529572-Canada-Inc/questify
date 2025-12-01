# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### 🛠 Fixes
- Improved theme handling: profile-selected light/dark/auto preferences now apply instantly across the app, and dark mode uses higher-contrast tokens (background/surfaces, on-surface text, outlines, and accents) for better readability.
- Raised Nuxt coverage guardrails by adding tests for AI runner fallbacks, telemetry, cloudinary utilities, audit logging, and quests-owner middleware; coverage runs now exceed the 60% statement/line threshold enforced in CI.

### 🧰 Maintenance
- Upgraded Prisma to v6.17.1, aligned TypeScript/node toolchain + Prisma client generation to keep lint/typecheck workflows passing, and hardened model JSON parsing for fenced AI outputs used by the worker.

---

## [1.16.0] - 2025-11-23

### 🚀 Features
- Added a reusable `QuestHeader` component and introduced a new `TaskHeader` hero so quests/tasks pages share consistent styling with clear CTAs.

### 🛠 Fixes
- Respected `NUXT_FEATURE_AI_ASSIST` across environments and UI by normalizing env parsing, making the feature-flag reactive in the UI store, and fixing OpenAI client invocation so AI assistance can be enabled and generate suggestions without runtime errors.

### ✅ Tests
- Increased coverage by adding unit suites for `TaskHeader` plus behavioral tests for `useQuestTaskHighlight`, ensuring highlighted tasks scroll correctly when linked from the Tasks page.

---

## [1.15.0] - 2025-11-18

### 🚀 Features
- Integrated Cloudinary for image storage and delivery:
    - Added Cloudinary configuration to Nuxt and worker environments, supporting `CLOUDINARY_URL` and related secrets.
    - Updated image upload flows to store images in Cloudinary, replacing local storage and enabling CDN-backed delivery.
    - Refactored server and worker image handling utilities to use Cloudinary APIs for upload, transformation, and deletion.
    - Added documentation for required Cloudinary environment variables and migration steps.
- Support issue submissions now accept up to three image attachments (uploaded via Cloudinary) so reporters can include screenshots.

---

## [1.14.3] - 2025-11-17

### 🛠 Fixes
- Updated image upload limits to 1.5MB per image and 3MB total to comply with Vercel's request limit 

## [1.14.2] - 2025-11-17

### 🛠 Fixes
- Made image attachment size configurable via `IMAGE_MAX_SIZE_BYTES`, defaulting to 2MB and applying the same limit on both client and API validation to avoid oversized uploads.

---

## [1.14.1] - 2025-11-17

### 🛠 Fixes
- Adjusted worker OpenAI chat payload typing for image parts to align with the newer SDK contract, restoring successful builds.

---

## [1.14.0] - 2025-11-17

### 🚀 Features
- Public quests CTA now routes unauthenticated users through login/signup with a `redirectTo` back to the public quest form, ensuring public quests are created with the correct visibility flag on submission.
- Added image attachments to quest creation, AI assistance, and investigations (UI + server + worker), including validation, multimodal model support, and failing tests updated to cover image payloads.
- Images are persisted on quests and investigations (new Prisma migration) and rendered on quest detail pages and investigation entries for later context.

### 🛠 Fixes
- Clamped quest card titles so long names wrap/ellipsize instead of overflowing on the quests page.
- Restored respect for persisted light/dark/auto profile theme preferences by retrying theme application when Vuetify context isn’t ready, so the UI no longer stays stuck on light mode.

---

## [1.13.1] - 2025-11-16

### 🛠 Fixes
- Fixed mobile view for quest detail page to ensure proper layout and accessibility of action buttons.

---

## [1.13.0] - 2025-11-16

### 🚀 Features
- Enabled in-app GitHub issue submission from the support assistant, including server-side GitHub integration, success/error UI feedback, and environment variables for repo/token configuration.
- Added an AI support chat: `/api/support/assistant` now streams page-aware answers, the Support Assistant dialog renders a two-way conversation with pending state, and chats persist locally with reset controls when AI is disabled or turned off.

### ♻️ Refactors
- All Nitro handlers, utilities, the worker, and Prisma seed script now share a single `PrismaClient` exported from `shared/server`, preventing runaway connection counts during HMR/serverless cold starts and giving us one place to instrument the client.
- Added quest/task ownership guards plus string sanitizers in the server utils package and wired quests/tasks endpoints to use them, eliminating duplicated authorization/validation code paths.
- Worker quest decomposition jobs now rebuild task lists inside a single transaction (`deleteMany` + `createMany`) so retries remain idempotent and never leave partially inserted plans.

### 🧩 DX
- Introduced `useMutationExecutor`, a small composable that wraps `$fetch` mutations with shared `canMutate` checks, refreshes, and snackbar messaging; `useQuestActions` now uses it for every action, trimming lots of repetitive try/catch blocks.

### 🧪 Tests
- Added Vitest coverage for the new sanitizers and mutation executor to lock down trimming/validation behavior and success/error flows.
- Added a coverage report gate that enforces `reports/coverage-threshold.json`, refreshes the markdown baseline via `pnpm coverage:report -- --write`, and runs automatically in CI to keep thresholds from regressing.
- Wired each Vitest config (Nuxt, worker, shared) to load `reports/coverage-threshold.json` directly so `pnpm test:coverage` now fails locally/CI the moment statements/branches/functions/lines fall under the enforced guardrails.

---

## [1.12.1] - 2025-11-06

### 🛠 Fixes
- Added missed changes from 1.12.0 version, including updates to the header menu for mobile responsiveness general improvements.

---

## [1.12.0] - 2025-11-06

### 🚀 Features
- Added optional AI suggestions to quest creation, including per-field “Improve with AI” buttons, a feature-flagged `/api/quests/assist` endpoint, and provider-aware routing with telemetry.
- Added a public quests discovery page at `/quests/public` with search, status filters, sorting, and pagination backed by a new `/api/quests/public` endpoint, making shared quests browseable without authentication.
- Added groundwork for the universal in-app help system: global support FAB, dialog scaffold, and session-cached conversation store to prepare AI chat and GitHub issue submission flows.
- Introduced a dedicated `/profile` page that replaces the old settings view, letting authenticated users edit name, email, avatar, OAuth connections, and personalize theme preferences (including light/dark/auto) with session-aware persistence and refreshed toolbar avatar navigation.

### 🛡️ Security
- Removed owner email addresses from the public quests API payload to prevent exposing contact information to anonymous visitors.

---

## [1.11.0] - 2025-11-01

### 🚀 Features
- Refactored Admin navigation to use Vuetify `v-tabs` and `v-tabs-window`, keeping sections aligned with route-driven tab panels.
- Added `QuestFloatingActions` so quest back/complete/delete controls stay pinned near the top of the detail view while scrolling.
- Added a configurable AI model selector for quests and task investigations, exposing OpenAI/Anthropic/DeepSeek options in the UI with tooltips and persisting the chosen model per record.
- Worker now routes jobs to provider-specific APIs (with automatic fallback) using the shared model catalog that can be overridden via `AI_MODEL_CONFIG_JSON` / `AI_MODEL_CONFIG_PATH` and new `ANTHROPIC_*` / `DEEPSEEK_*` keys.
- Quest owners can now archive or permanently delete quests from list/detail views via a confirmation dialog; new `/api/quests/:id/archive` and DELETE `/api/quests/:id` endpoints enforce ownership, log actions, filter archived data, and update the Prisma schema with a `QuestStatus` enum + `deletedAt` column to keep analytics clean.
- Introduced an authenticated dashboard at `/dashboard` with quest/task metrics, quick links to private and public quests, and login/signup redirects that land users on the new overview. (#82)
- Integrated OAuth authentication with support for Google and Facebook providers:
  - Users can link/reconnect OAuth accounts from the settings page with real-time connection status.
  - OAuth handlers support account creation, sign-in, and linking existing Questify accounts to social providers.
  - Popup-based OAuth flow with automatic session refresh and flash message feedback for success/error states.
  - Backend stores OAuth tokens with automatic refresh and expiry tracking in the database.

### 🛠 Fixes
- Quest owner middleware now awaits client-side fetches, surfaces the “create your first quest” snackbar, and redirects via `navigateTo`, with updated integration tests.
- Restored model selector tooltips by using the `text` prop and pointer-enabled activator button.
- Ensured Prisma schema + generated client include `modelType` fields and tightened queue payloads so builds/linting succeed across workspaces.
- Fixed test failures for async components (home, dashboard, quests pages) by properly wrapping them in Suspense boundaries and adding comprehensive async handling with `flushPromises()` and `nextTick()`.
- Resolved TypeScript build errors: removed invalid `.value` access on boolean `pending` in quests/[id].vue and fixed read-only property mutations in nuxt.config.ts by using in-place array manipulation.
- Fixed TypeScript and module resolution errors in OAuth handlers (facebook.get.ts, google.get.ts) by removing explicit imports and relying on nuxt-auth-utils auto-imported OAuth event handler functions (`defineOAuthGoogleEventHandler`, `defineOAuthFacebookEventHandler`), which are automatically available in server routes.
- Fixed settings page test by adding proper stubs for VListItem named slots (#prepend, #append) and VListItemTitle/VListItemSubtitle components to ensure buttons render correctly during testing.
- Fixed OAuth refresh token preservation: created `mapTokensForUpdate()` function that only updates refresh tokens when providers supply new ones, preventing loss of stored tokens on subsequent logins (Google and other providers typically omit refresh tokens after the initial authorization).

---

## [1.10.1] - 2025-10-27

### 🛠 Fixes
- Fixed layout issues in the mobile header menu, ensuring proper visibility and accessibility of actions.

---

## [1.10.0] - 2025-10-25

### 🚀 Features
- Added a mobile header menu that collapses all navigation, theme, admin, and auth actions into an accessible Vuetify dropdown when the viewport is under 768px, keeping controls usable on phones. (#72)
- **Public Quest Sharing** (#46)
  - Added visibility toggle allowing quest owners to share quests publicly or keep them private.
  - Implemented "Discover Public Quests" section on home page with sortable quest cards.
  - Created public quests API endpoint with sorting by creation/update date.
  - Added confirmation dialog when making quests private, warning that public URLs will stop working.
  - Quest visibility changes now immediately update the UI without page reload.
  - Public quests are viewable by anyone; private quests remain owner-only.
- Implemented global snackbar notifications for auth, quest management, and background actions with cleaned status messaging.
- Added role-based administration: data model, guarded APIs, and Nuxt admin views for roles, users, privileges, and recovery.

### 🧪 Tests
- Added a Playwright regression that drives the mobile header menu to ensure the hamburger activator exposes share controls and opens the dialog without reloading. (#72)

### 🛠 Fixes
- Removed legacy inline alerts and normalized API error text to avoid leaking HTTP metadata into the UI.
- Fixed quest store state management to properly reset the `loaded` flag on logout, preventing stale empty quest lists after re-login.

---

## [1.9.0] - 2025-10-19

### 🚀 Features
- Added share controls with QR codes so teammates can access the app login, quests, and individual tasks via generated links.
- Enhanced mobile responsiveness across the header, quest pages, and auth forms, and added Playwright coverage to guard small-screen layouts in CI.

### 🧪 Tests & Coverage
- Raised Vitest coverage across Nuxt components, layouts, middleware, and pages to 93%+ statements / 80% branches by adding extensive unit suites and support utilities.
- Added configuration to emit JSON coverage summaries, expanded the aggregate `test:coverage` script, and refreshed the baseline report for worker/shared packages (now ≥89% statements each).

### 🧱 Refactors
- Introduced shared quest task types, queue helpers, and modular task list components.
- Extracted quest edit/investigation dialogs and action buttons into dedicated Vue components.
- Added composables to encapsulate tab highlighting, polling, display metadata, and quest page error handling.

---

## [1.8.0] - 2025-10-17

### 🚀 Features
- Allow quest owners to edit task titles, details, and attach extra content directly from the quest view.
- Surface owner-provided task extra content in the task list so collaborators can reference progress notes or resources.
- Add an AI-powered "Investigate" action on tasks that spins up an agent to research next steps and capture findings per task.
- Prompt owners for optional investigation context and track those instructions alongside every run.

### 🗄️ Database
- Added `extraContent` column to tasks to persist owner-authored follow-up content alongside generated task details.
- Introduced a `TaskInvestigation` table to store historical investigation runs, including status, summaries, and initiators.
- Added a `prompt` column to persist the instructions used to launch each investigation.

### 🛠 Fixes & Improvements
- Expanded the task PATCH API to validate and accept combined updates for status, title, details, and extra content.
- Keep task ordering stable in the quest view after editing task details.
- Added task investigation API endpoint, queue wiring, and worker processing so investigations are enqueued and resolved asynchronously.

### 🎨 UI
- Refined the quest detail header to display status with Vuetify avatars/chips and inline owner context instead of a plain status label.
- Reworked quest detail sections into a tonal Vuetify list with contextual icons and a friendly alert fallback when no details are provided.
- Surfaced investigation history beneath each task with status badges, timestamps, summaries, and error messaging.

### 🧪 Tests & Infrastructure
- Split Nuxt Vitest suites into `unit` and `ui` projects with happy-dom component coverage, Nuxt-aware bootstrap helpers, and updated documentation on how to run each suite.
- CI now installs Playwright, runs Nuxt coverage and End-to-End suites, and uploads coverage plus Playwright artifacts for analysis.

---

## [1.7.1] - 2025-10-15

### 🛠 Fixes
- Updated Dockerfile to run bash script so that the `prepare-safe.sh` script executes correctly in container environments.

## [1.7.0] - 2025-10-15

### ⚙️ Core & Framework
- **Nuxt 4 Upgrade**
  - Upgraded the application from **Nuxt 3 → Nuxt 4.1.3** with **Nitro 2.12.7**, **Vite 7.1.x**, and **Vue 3.5.x**.
  - Updated build and runtime configurations to remove deprecated APIs such as `createApp` and `toNodeListener`.
  - Refactored internal server utilities and test helpers to align with the new **Nitro runtime API**.
  - Cleaned up unused Nuxt 3 testing utilities (`@nuxt/test-utils`) and replaced them with a stable custom setup.

### 🧱 Refactors
- **Quest View Modularization**
  - Refactored quest-related pages into smaller, reusable components and composables.
  - Introduced dedicated components for `QuestList`, `QuestCard`, and `QuestTasksTabs`.
  - Improved separation of concerns between data fetching (`useQuest`, `useQuests`) and rendering logic.
- **QuestTasksTabs Enhancements**
  - Removed redundant status display for completed tasks.
  - Updated the `pending` prop to correctly use a **reactive value** and provide a **default of `false`**.
  - Eliminated unnecessary reactivity edge cases and type warnings in TypeScript templates.
- **Nuxt Configuration Cleanup**
  - Consolidated Nuxt configuration into clearly defined sections for **auto-imports**, **runtime**, and **framework settings**.
  - Removed legacy and commented code for clarity and maintainability.

### 🛠 Fixes & Improvements
- **Quest Details Display**
    - Improved quest details view with clearer messaging and layout.
- **Quest List Rendering**
    - Quest lists now support link parsing for embedded URLs.
- **URL Parsing**
    - Enhanced URL parsing to handle balanced closing punctuation and strip trailing punctuation from text links.
- **Quest Task Navigation**
    - Swapped the quest task sections to Vuetify tabs with contextual empty states and owner controls scoped to each status.

### 🧪 Tests & Infrastructure
- **Nuxt 4 Test Harness**
  - Added a **Vitest + Nuxt 4** test setup that runs server-route tests without relying on internal Nitro APIs.
  - Introduced a unified `vitest.setup.ts` that:
    - Loads `.env.test` automatically.
    - Provides global mocks for Nitro/H3 helpers such as `defineEventHandler` and `getUserSession`.
    - Safely initializes or skips Prisma migrate reset depending on the test mode.
  - Refactored `vitest.config.mts` with a `USE_MOCKS` toggle to support two modes:
    - **Mock Mode (`USE_MOCKS=true`)** → routes tested with mocked `PrismaClient` (no database).
    - **Integration Mode (`USE_MOCKS=false`)** → runs against a real test database.
  - Added script shortcuts `test:mock` and `test:integration` for quick switching between the two modes.
  - Confirmed that API route tests (e.g., `/api/quests`) execute in a pure Node environment with fast, deterministic results.
  - Established foundation for future extensions to automatically mock additional Nitro helpers (`getQuery`, `readBody`, etc.).

---

## [1.6.0] - 2025-10-12

### 🚀 Features
- Simplified the quest creation form so only the title is required and optional goal/context/constraint inputs stay hidden until requested.

### 🛠 Fixes
- Trim quest titles and drop empty optional details in the creation API and worker queue payload to avoid persisting blank strings.
- Surface optional quest details consistently across the quest list, detail view, and worker decomposition prompts.
- Allow visiting the quest creation page without authentication to support demos and screenshots while keeping other quest routes protected.

### 🗄️ Database
- Removed the deprecated quest description column from the Prisma schema, migration, and seed utilities.
- Added an `isPublic` flag to quests that defaults to private access.

### 🖼 Branding & UI Updates
- **Logo & Header**
    - Refreshed header logo artwork for improved branding.
    - Enhanced `logo.svg` by adding sword and scroll elements.
    - Updated logo size in header for better visibility.
    - Improved mobile header branding.
    - Added scroll icon to `logo.svg`.
- **Favicons & Site Title**
    - Added SVG and PNG favicons.
    - Updated site title for consistency.
- **Welcome Message**
    - Removed emoji from welcome message in index page and related tests.

### 🛡️ Authorization & UI
- Restricted quest actions and completion to owners in UI.
- Restricted quest and task completion to quest owners.
- Improved owner authorization logic for quest and task updates.
- Added owner-only controls to reopen completed quests and mark tasks incomplete.
- Validated quest and task status transitions to safely support reopening flows.
- Limited quest retrieval APIs to owners unless the quest is explicitly public.

### 🧪 Tests
- Added a Nuxt tsconfig stub and setup guard so quest and task authorization tests run without generated build artifacts.
- Added unit coverage for quest visibility helper logic.

---

## [1.5.0] - 2025-10-08

### 🚀 Features
- **Links**
    - Added support for links in quest descriptions and instructions.
- **Task Loading**
    - UI now waits for tasks to finish loading before displaying them, improving user experience and preventing incomplete task lists.

### 🛠 Fixes
- **Redis**
    - Default the Redis connection port to `6379` when it is omitted from the URL and respect explicitly provided ports.

### 🧪 Tests
- **Worker**
    - Added coverage for the worker entrypoint to verify Redis configuration, OpenAI-driven quest decomposition, and failure handling.
- **Shared**
    - Expanded `parseRedisUrl` tests to capture invalid inputs, TLS behavior, and password normalization cases.
- **Nuxt**
    - Added page, component, and composable tests covering authentication flows, quest creation/detail behaviours, and TextWithLinks rendering.

---

## [1.4.0] - 2025-10-07

### 🚀 Features

- **Quest Creation Enhancements**
  - Added ability to create quests with extra context and detailed instructions (eg. goal, context, constraints, etc.).
  - Updated quest creation API endpoint to handle new fields.
  - Enhanced `useQuest` composable to manage additional quest fields.

- **UI / UX Improvements**
  - Updated all forms to use rules for validation and error handling.
  - Updated margins and paddings for better spacing and layout consistency.

---

## [1.3.0] - 2025-10-06

### 🚀 Features
- **Authentication**
    - Added user authentication flow with login, logout, and registration endpoints.
    - Integrated JWT-based session management for secure API access.
    - Implemented authentication middleware for protected routes.
    - Added user profile endpoint and UI for viewing/updating account details.

- **UI / UX Enhancements**
    - Added authentication forms (login, register) with validation and error handling.
    - Updated navigation to show user status and provide logout option.
    - Improved error messaging for failed authentication attempts.

### 🛠 Fixes
- Fixed issues with route guards and redirect logic for unauthenticated users.
- Resolved edge cases in token refresh and session expiration handling.
- Addressed minor UI inconsistencies in authentication-related components.

### ⚙️ Tooling & Configuration
- Added environment variables for authentication secrets and token expiry.
- Updated API documentation to include authentication endpoints and usage.
- Refactored user model and database schema to support authentication features.

### 🧹 Chore
- Updated tests to cover authentication flows and protected endpoints.
- Improved code comments and documentation for new authentication logic.
- Bumped dependency versions for security and compatibility.

---

## [1.14.1] - 2025-11-17

### 🛠 Fixes
- Adjusted worker OpenAI chat payload typing for image parts to align with the newer SDK contract, restoring successful builds.
- Made image attachment size configurable via `NUXT_PUBLIC_IMAGE_MAX_SIZE_BYTES`, defaulting to 2MB, and added a total payload guard via `NUXT_PUBLIC_IMAGE_TOTAL_MAX_BYTES` (4MB default) so client and API reject requests before exceeding host limits.

---

## [1.2.1] - 2025-09-25

### Hotfixes & Improvements
- **Style:** Enhanced button layout and responsiveness in quest completion actions for improved mobile and desktop experience.
- **Fix:** Updated deployment command for Nuxt to use `pnpm` instead of deprecated arguments.
- **Fix:** Removed deprecated `confirm` argument from Vercel Nuxt deploy command.
- **Dev:** Implemented `tsx` package to enable running the worker in development mode without errors.
- **Chore:** Bumped package versions from `1.2.0` to `1.2.1` across multiple packages.
- **General:** Additional code changes to enhance functionality and improve performance.

---

## [1.2.0] - 2025-09-25

### 🚀 Features
- **Quest Management**
  - Added quest detail page with task list and completion logic.
  - Implemented quest update and retrieval API endpoints.
  - Enhanced `useQuest` composable to include tasks.
  - Added task update endpoint and task completion functionality.
  - Implemented quest completion transaction to update quests and associated tasks.

- **UI / UX Enhancements**
  - Migrated quest pages and layouts to Vuetify components for improved design.
  - Added floating action button (FAB) for creating new quests.
  - Added navigation buttons between quest list and quest creation views.
  - Introduced default layout and gradient app styling.
  - Enhanced homepage and quest creation layouts for better responsiveness.

### 🛠 Fixes
- Standardized quest status handling (lowercase, consistent checks).
- Fixed type definitions in `useQuest` composable and quest patch handler.
- Updated import statements to include file extensions for NodeNext resolution.
- Added `@types/vue-router` for proper type recognition.
- Fixed Nuxt compatibility date warning by adding `compatibilityDate` to config.

### 🎨 Style & Refactors
- Improved task display structure in quest details.
- Simplified quest retrieval logic and display.
- Refactored CI workflow and ESLint configuration for clarity and maintainability.
- Added `eslint-plugin-import` and standardized import rules.

### ⚙️ Tooling & Configuration
- Updated package versions from **1.1.14 → 1.2.0**.
- Enhanced TypeScript configuration for NodeNext and path resolution.
- Added build step for shared packages in CI.
- Updated Vitest configuration for SSR module resolution.
- Added test environment check to skip quest queue setup.

---

## [1.1.x Maintenance Releases] - 2025-09-20-2025-09-24

Between **v1.1.0** and **v1.1.14**, multiple incremental updates were released focusing on:

- **Bug Fixes**
  - Improved ESLint and TypeScript configuration.
  - Fixed path resolution and import handling across packages.
  - Adjusted compatibility settings for Nuxt and Node.

- **Styling & Layout**
  - Iterative improvements to quest creation and list layouts.
  - Refactoring to improve readability, maintainability, and consistency.

- **Tooling**
  - CI/CD workflow enhancements.
  - Version bumps across dependencies.
  - Initial setup for shared package builds.

These changes were primarily focused on stability, tooling improvements, and preparing the codebase for the **v1.2.0** feature release.

---

## [1.1.0] - 2025-09-20

### Added
- Updated `README.md` with release and hotfix instructions.

### Fixed
- Resolved issues with pipeline failing due to missing `pnpm` installation and database configuration.

---

## [1.0.0] - 2025-09-20

### Added
- Official release of Nuxt app with Redis integration.
- Worker service fully deployed with OpenAI and Redis secrets.
- Prisma migrations applied and database initialized.
- GitHub Actions pipeline for automated release deployment.

### Changed
- Version bump for all packages to match release v1.0.0.

### Fixed
- Minor test failures corrected.
- Pipeline issues with `tsconfig` resolved for CI environment.

---
