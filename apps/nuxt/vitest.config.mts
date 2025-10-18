import { defineVitestProject } from '@nuxt/test-utils/config'
import { resolve } from 'path'
import { defineConfig } from 'vitest/config'

const r = (p: string) => resolve(__dirname, p)

export default defineConfig({
  test: {
    projects: [
      // Nuxt-specific tests
      await defineVitestProject({
        test: {
          name: 'nuxt',
          include: ['tests/nuxt/**/*.test.ts', 'tests/nuxt/**/*.spec.ts'], // Adjust path as needed
          environment: 'nuxt',
          alias: {
            '~': r('app'),
            '@': r('app'),
          },
        },
      }),
    ],
  },
})
