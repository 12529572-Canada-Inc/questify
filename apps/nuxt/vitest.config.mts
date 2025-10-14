import { defineConfig } from 'vitest/config'
import path from 'path'

const r = (p: string) => path.resolve(__dirname, p)

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',

    // 🧩 Centralized setup file (dotenv, mocks, globals, etc.)
    setupFiles: [r('./vitest.setup.ts')],

    // 🧠 Dependency optimizer ensures proper SSR behavior
    deps: {
      optimizer: {
        ssr: { include: ['shared'] },
      },
    },

    // 🕒 Timeouts & stability settings
    testTimeout: 180_000,
    hookTimeout: 180_000,
    // retry: 1,
    // isolate: false,
    // sequence: { concurrent: false },
    // pool: 'forks',

    // 🧹 Output clarity
    reporters: ['default'],

    // 🧭 Aliases for Nuxt conventions + shared packages
    alias: {
      '~': r('app'),
      '@': r('app'),
      'shared': r('../../packages/shared/src'),
      'nuxt': r('node_modules/nuxt/dist/index.mjs'),
      'nuxt/config': r('node_modules/nuxt/config.js'),

      // 🧪 Conditionally mock Prisma (based on env)
      ...(process.env.USE_MOCKS === 'true'
        ? { '@prisma/client': r('tests/mocks/prisma.ts') }
        : {}),
    },
  },

  // 🔄 Keep for IDE consistency
  resolve: {
    alias: {
      '~': r('app'),
      '@': r('app'),
      'shared': r('../../packages/shared/src'),
      'nuxt': r('node_modules/nuxt/dist/index.mjs'),
      'nuxt/config': r('node_modules/nuxt/config.js'),
      ...(process.env.USE_MOCKS === 'true'
        ? { '@prisma/client': r('tests/mocks/prisma.ts') }
        : {}),
    },
  },
})
