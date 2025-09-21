# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added
- Initial setup for Nuxt front-end application.
- Worker service with Docker deployment.
- Prisma database configuration and migrations.
- Redis caching for Nuxt and Worker apps.
- OpenAI integration in Worker for AI-powered features.

### Changed
- Updated environment variable handling for secrets (Redis, OpenAI, Prisma).
- CI/CD pipeline improved with separate tests for Nuxt and Worker apps.

### Fixed
- Resolved Vitest configuration issues for Nuxt and Worker tests.
- Fixed TypeScript ESLint errors in Worker `vitest.config.ts`.

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

## [1.1.0] - 2025-09-20

### Added
- Updated `README.md` with release and hotfix instructions.

### Fixed
- Resolved issues with pipeline failing due to missing `pnpm` installation and database configuration.

---

## [1.1.1] - 2025-09-20

### Fixed
- Corrected Prisma schema path in release pipeline so `prisma generate` and `prisma migrate deploy` work in CI/CD.
- Ensured Prisma commands explicitly point to `packages/prisma/schema.prisma` in `release.yml`.

---

# [1.1.2] - 2025-09-20

### Refactor
- Update Prisma commands in workflows and package scripts

### Fixes
- Update `@prisma/client` version to 5.22.0 in `pnpm-lock.yaml`
- Update `@prisma/client` and `prisma` version to 5.22.0 in `package.json` files

### Chores
- Bump version to 1.1.2 for Nuxt, Worker, and Prisma packages

---