import { defineVitestConfig } from '@nuxt/test-utils/config'
import path from 'path'

export default defineVitestConfig({
  test: {
    environment: 'nuxt',
    globals: true,
    deps: {
      inline: [/shared/], // force Vitest to resolve shared
    },
  },
  resolve: {
    alias: {
      shared: path.resolve(__dirname, '../../packages/shared/src'),
    },
  },
})
