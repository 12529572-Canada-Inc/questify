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