import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    globals: true,

    // Bootstrap Prisma, dotenv, etc.
    setupFiles: ['./vitest.setup.ts'],

    // ✅ Use pure Node environment
    environment: 'node',

    // Dependency optimizer: ensures shared package works with SSR
    deps: {
      optimizer: {
        ssr: {
          include: ['shared'],
        },
      },
    },

    // Optional: timeouts & concurrency
    testTimeout: 180_000,
    hookTimeout: 180_000,
    // retry: 1,
    // isolate: false,
    // sequence: { concurrent: false },
    // pool: 'forks',

    // Clean terminal output
    reporters: ['default'],

    // Aliases for Nuxt conventions and shared package
    alias: {
      '~': path.resolve(__dirname, 'app'),
      '@': path.resolve(__dirname, 'app'),
      'shared': path.resolve(__dirname, '../../packages/shared/src'),
    },
  },

  // Keep these for IDE and build tool consistency
  resolve: {
    alias: {
      '~': path.resolve(__dirname, 'app'),
      '@': path.resolve(__dirname, 'app'),
      'shared': path.resolve(__dirname, '../../packages/shared/src'),
    },
  },
})
