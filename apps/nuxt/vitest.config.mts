import { defineVitestConfig } from '@nuxt/test-utils/config'
import path from 'path'

export default defineVitestConfig({
  test: {
    globals: true,
    setupFiles: [
      './vitest.setup.ts', // Prisma + dotenv bootstrap
      './tests/setup.unit.ts', // Lightweight Nuxt runtime setup
      './tests/setup.e2e.ts', // E2E server setup
    ],

    deps: {
      optimizer: {
        ssr: {
          include: ['shared'],
        },
      },
    },

    testTimeout: 180_000,
    hookTimeout: 180_000,
    retry: 1,

    // Prevent Nuxt from re-spawning per test
    isolate: false,
    sequence: { concurrent: false },

    // Fix Vitest-Nuxt RPC issues
    pool: 'forks',
    maxThreads: 1,
    minThreads: 1,

    // Set Nuxt environment for compatibility
    environment: 'nuxt',

    alias: {
      '#app': path.resolve(__dirname, './.nuxt'),
      '@': path.resolve(__dirname, './'),
      'shared': path.resolve(__dirname, '../../packages/shared/src'),
    },
  },

  resolve: {
    alias: {
      shared: path.resolve(__dirname, '../../packages/shared/src'),
    },
  },
})
