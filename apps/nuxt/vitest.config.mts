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
          include: ['@nuxt/test-utils', 'shared'],
        },
      },
    },
  },
  resolve: {
    alias: {
      shared: path.resolve(__dirname, '../../packages/shared/src'),
    },
  },
})
