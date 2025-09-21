import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  test: {
    environment: 'nuxt', // 🔑 use Nuxt test environment
    globals: true,
    include: ['tests/**/*.test.ts'],
  },
  resolve: {
    alias: {
      '~': fileURLToPath(new URL('./', import.meta.url)),
      '@': fileURLToPath(new URL('./', import.meta.url)),
    },
  },
})
