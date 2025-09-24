# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

---

## [1.1.14] - 2025-09-24

### Fixes
- **Worker App**: Corrected formatting of connection object during initialization.
- **Index Page**: Simplified and enhanced component styling for better clarity, responsiveness, and visual appeal.
- **Release Workflow**: Restored tag-based trigger to ensure proper release flow.
- **Deployment**:  
  - Removed unnecessary environment variables from Fly.io deployment step.  
  - Corrected start script path in `package.json` and aligned Dockerfile `CMD` with `npm start`.  
  - Adjusted Fly.io deployment args to remove redundant Dockerfile/context options.  
- **Nuxt App**: Added `rootDir` to `tsconfig.json` for proper TypeScript resolution.  
- **CI**: Set `CI` environment variable in Dockerfile for consistent builds.  

### Refactors
- **Dockerfile & Build Process**:  
  - Consolidated build steps and reorganized structure for clarity and caching.  
  - Optimized dependency installation and enabled `corepack` earlier.  
  - Cleaned up and standardized comments, removed unused steps, and reduced image size.  
- **TypeScript & Nuxt**:  
  - Added TypeScript as a devDependency.  
  - Removed unused compiler options and updated `tsconfig` references for Nuxt.  
- **Shared Package & Redis**:  
  - Introduced `shared` package and updated imports across apps.  
  - Added `parseRedisUrl` utility and streamlined Redis environment configuration.  
- **Quest Model (Database)**: Made `ownerId` optional in schema, migration, and logic (defaults to `null` if undefined).  
- **Prisma Configuration**:  
  - Simplified schema handling in `postinstall` scripts.  
  - Cleaned up generator output paths and related dependencies.  
  - Standardized Prisma setup across Nuxt, Worker, and release workflow.  
- **Vercel Deployment**: Improved configuration by adding `DATABASE_URL` and adjusting directory context.  

### Chores
- Bumped package versions to **1.1.14** for Nuxt, Worker, and Prisma apps.
- Updated Prisma dependency to version `5.22.0` in `pnpm-lock.yaml`.

---

## [1.1.13] - 2025-09-21

### Fixes
- **Deployment**: Updated Fly.io deployment args to explicitly include `Dockerfile` and build `context` for more reliable deployments. 
- **Dependencies**: Bumped package versions to `1.1.13` for **nuxt**, **worker**, and **prisma** apps.
- **Docker**:  
  - Added `node_modules` to `.dockerignore` to reduce image size. 
  - Updated `Dockerfile` to copy only necessary files and set production environment.
- **Worker App**: Adjusted TypeScript config for Node.js types:  
  - Added Node types.
  - Removed Node types to fix compatibility.

---


## [1.1.12] – 2025-09-21

### Fixed
- Updated deployment configuration for worker app in release workflow and Dockerfile

### Chore
- Bumped package versions to `1.1.12` for Nuxt, worker, and Prisma

---

## [1.1.11] – 2025-09-21

### Fixed
- Bump package versions to 1.1.11 for `nuxt`, `worker`, and `prisma`
- Updated `dotenv` dependency to version `17.2.2` in `package.json` and `pnpm-lock.yaml`

### Changed
- Removed `node_modules` from `.dockerignore`  
- Removed `"type"` field from `package.json` to avoid ES module issues  
- Simplified worker `Dockerfile` and removed entrypoint script

---

## [1.1.10] - 2025-09-21

### Fixed
- Bump package versions to 1.1.10 for `nuxt`, `worker`, and `prisma`
- Update Dockerfile path in `fly.toml` configuration

---

## [1.1.9] - 2025-09-21
### Fix
- Update build configuration to use **Dockerfile** instead of Heroku buildpack

### Chore
- Bump package versions to **1.1.9** for Nuxt, Worker, and Prisma

---

## [1.1.8] - 2025-09-21

### Features
- **Worker Deployment**: Added initial `Dockerfile`, `docker-entrypoint`, and `fly.toml` to support deploying the worker application on Fly.io.

### Refactors
- **Worker Dockerfile**: Streamlined by removing unnecessary build stages and optimizing dependency installation. 
- **Release Workflow**: Replaced Docker Hub deployment with Fly.io GitHub Action for worker deployment.
- **Fly.io Config**: Simplified `fly.toml` by removing unused options and ensuring `NODE_ENV` is set. 
- **Cleanup**: Removed unused Dockerfile for worker application.

### Chores
- Updated CHANGELOG for version `1.1.7` with prior fixes and refactors.

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