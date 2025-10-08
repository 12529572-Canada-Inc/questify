import { defineVitestConfig } from '@nuxt/test-utils/config'
import { NuxtVitestResolver } from '@nuxt/test-utils/resolver'
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
  },
  resolve: {
    alias: {
      ...NuxtVitestResolver(),
      shared: path.resolve(__dirname, '../../packages/shared/src'),
    },
  },
})
