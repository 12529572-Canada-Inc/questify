import { defineConfig } from 'vitest/config'
import path from 'path'

// Nuxt 4 no longer needs @nuxt/test-utils.
// We emulate minimal Nuxt env manually in vitest.setup.ts
export default defineConfig({
  test: {
    globals: true,
    setupFiles: [
      './vitest.setup.ts', // Prisma + dotenv bootstrap
    ],

    // Dependency optimizer
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
    isolate: false,
    sequence: { concurrent: false },

    // Vitest concurrency controls
    pool: 'forks',

    // Use "node" environment since Nuxt test-utils is gone
    environment: 'node',

    // Clean terminal output
    reporters: ['default'],

    // Aliases for Nuxt conventions and shared package
    alias: {
      '~': path.resolve(__dirname, 'app'),
      '@': path.resolve(__dirname, 'app'),
      'shared': path.resolve(__dirname, '../../packages/shared/src'),
    },
  },

  resolve: {
    alias: {
      '~': path.resolve(__dirname, 'app'),
      '@': path.resolve(__dirname, 'app'),
      'shared': path.resolve(__dirname, '../../packages/shared/src'),
    },
  },
})
