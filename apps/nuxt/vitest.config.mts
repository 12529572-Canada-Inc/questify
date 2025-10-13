import { defineVitestConfig } from '@nuxt/test-utils/config'
import path from 'path'

export default defineVitestConfig({
  test: {
    environment: 'nuxt',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    deps: {
      optimizer: {
        ssr: {
          include: ['shared'],
        },
      },
    },
    hookTimeout: 60000,
    testTimeout: 120000,
    retry: 1,
    // 🚀 key line: only one Nuxt instance at a time
    pool: 'threads',
    maxThreads: 1,
    minThreads: 1,
  },
  resolve: {
    alias: {
      shared: path.resolve(__dirname, '../../packages/shared/src'),
    },
  },
})
