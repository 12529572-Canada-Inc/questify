import { defineConfig } from 'vitest/config'
import path from 'node:path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'happy-dom',
    include: ['tests/**/*.test.ts'],
  },
  resolve: {
    alias: {
      '~': path.resolve(__dirname), // root of the Nuxt app
      '@': path.resolve(__dirname), // same as Nuxt’s default
    },
  },
})
