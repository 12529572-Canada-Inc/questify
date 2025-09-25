# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

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