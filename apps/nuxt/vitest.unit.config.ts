import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

const r = (p: string) => resolve(__dirname, p)

export default defineConfig({
  resolve: {
    alias: {
      '~': r('app'),
      '@': r('app'),
      'shared': r('../../packages/shared/src'),
      '#imports': r('.nuxt/imports.mjs'),
      'nuxt/config': r('node_modules/nuxt/config.js'),
      'nuxt': r('node_modules/nuxt/dist/index.mjs'),
      '@/': `${r('app')}/`,
      '~/': `${r('app')}/`,
      ...(process.env.USE_MOCKS === 'true' ? { '@prisma/client': r('tests/mocks/prisma.ts') } : {}),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/{api,unit}/**/*.{test,spec}.ts'],
    exclude: [
      '**/node_modules/**',
      '**/.nuxt/**',
      '**/.output/**',
      '**/tests/nuxt/**',
      '**/e2e/**',
      '**/mocks/**',
      '**/fixtures/**',
      '**/dist/**',
      '**/coverage/**',
    ],
    setupFiles: [r('vitest.setup.ts')],
    deps: {
      optimizer: {
        ssr: { include: ['shared'] },
      },
    },
    testTimeout: 90_000,
    hookTimeout: 90_000,
    reporters: ['default'],
  },
})
