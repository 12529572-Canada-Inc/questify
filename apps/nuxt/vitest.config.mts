import { defineVitestConfig } from '@nuxt/test-utils/config'
import path from 'path'

export default defineVitestConfig({
  test: {
    environment: 'nuxt',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    // @ts-expect-error: Vitest 3.2+ types don't yet expose transformMode, but Nuxt still uses it
    // 👇 ensures Nuxt macros like mockNuxtImport get transformed
    transformMode: {
      web: ['\\.jsx$', '\\.tsx$', '\\.js$', '\\.ts$'],
      ssr: ['\\.jsx$', '\\.tsx$', '\\.js$', '\\.ts$'],
    },
    deps: {
      optimizer: {
        ssr: {
          include: ['@nuxt/test-utils', 'shared'],
        },
      },
    },
    // Optional, but helps with deprecation warning:
    server: {
      deps: {
        inline: ['@nuxt/test-utils', 'shared'],
      },
    },
  },
  resolve: {
    alias: {
      shared: path.resolve(__dirname, '../../packages/shared/src'),
    },
  },
})
