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
    testTimeout: 180000,
    hookTimeout: 180000,
    retry: 1,
    isolate: false,
    sequence: { concurrent: false },
    pool: 'forks', // ← use plain Node forked processes, not worker threads
    maxThreads: 1,
    minThreads: 1,
    environment: 'node', // ← don’t let Vitest auto-load vitest-environment-nuxt
    // alias: {
    //   '#app': path.resolve(__dirname, './.nuxt'),
    // },
  },
  resolve: {
    alias: {
      shared: path.resolve(__dirname, '../../packages/shared/src'),
    },
  },
})
