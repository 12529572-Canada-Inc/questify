# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### ⚙️ Core & Framework
- **Nuxt 4 Upgrade**
  - Upgraded the application from **Nuxt 3 → Nuxt 4.1.3** with **Nitro 2.12.7**, **Vite 7.1.x**, and **Vue 3.5.x**.
  - Updated build and runtime configurations to remove deprecated APIs such as `createApp` and `toNodeListener`.
  - Refactored internal server utilities and test helpers to align with the new **Nitro runtime API**.
  - Cleaned up unused Nuxt 3 testing utilities (`@nuxt/test-utils`) and replaced them with a stable custom setup.

---

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