import { defineConfig } from 'vitest/config'
import path from 'path'

const r = (p: string) => path.resolve(__dirname, p)

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',

    // ✅ Exclude irrelevant folders (including node_modules)
    exclude: [
      '**/node_modules/**',
      '**/.nuxt/**',
      '**/.output/**',
      '**/e2e/**',
      '**/mocks/**',
      '**/fixtures/**',
      '**/dist/**',
      '**/coverage/**',
    ],

    // ✅ Include only your tests
    include: ['**/*.test.ts', '**/*.spec.ts'],

    setupFiles: [r('./vitest.setup.ts')],

    deps: {
      optimizer: {
        ssr: { include: ['shared'] },
      },
    },

    testTimeout: 180_000,
    hookTimeout: 180_000,
    reporters: ['default'],

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
