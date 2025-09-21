# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

---

## [1.1.7] - 2025-09-21

### Fixes
- **Release Workflow**: Updated Docker build context to correctly reference worker app directory.  
- **Worker Dockerfile**: Removed package upgrade step to avoid build warnings and improve stability.  

### Refactors
- Simplified `Dockerfile` by removing the multi-stage builder and unnecessary steps for a leaner image.  

### Chore
- Bumped version to **1.1.7** in `package.json` files for Nuxt, Worker, and Prisma packages. 

---

## [1.1.6] - 2025-09-21

### Fixed
- Update Docker deployment steps in release workflow for clarity and efficiency
- Add missing build and start scripts in `package.json` for worker

### Added
- Dockerfile for building and running the worker application

### Changed
- Bump version to 1.1.6 in `package.json` files for Nuxt, Worker, and Prisma

---

## [1.1.5] - 2025-09-21

### Fixed
- Corrected Vercel deployment command by removing invalid `--project` parameter and replacing with the proper usage.
- Bumped version to `1.1.5` across Nuxt, Worker, and Prisma packages.

---

## [1.1.4] - 2025-09-21

### Fixed
- Updated Vercel deployment command to include `--scope` and `--project` parameters for proper project targeting.

### Added
- Introduced Vercel configuration file for improved deployment consistency.

### Changed
- Reorganized `CHANGELOG.md` for clarity and improved versioning structure.

### Chore
- Bumped version to **1.1.4** across `nuxt`, `worker`, and `prisma` packages.

---

# [1.1.3] - 2025-09-20

## Refactor
- Streamline environment variable usage in release workflow and update Prisma deployment steps
- Remove unused `prisma:deploy` script from package.json

## Chore
- Bump version to 1.1.3 in package.json files for Nuxt, Worker, and Prisma packages

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

## [1.1.1] - 2025-09-20

### Fixed
- Corrected Prisma schema path in release pipeline so `prisma generate` and `prisma migrate deploy` work in CI/CD.
- Ensured Prisma commands explicitly point to `packages/prisma/schema.prisma` in `release.yml`.

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