/// <reference types="vitest" />
import { defineConfig, defineProject } from 'vitest/config'
import { resolve } from 'path'

const r = (p: string) => resolve(__dirname, p)

export default defineConfig({
  test: {
    projects: [
      // 🧪 1️⃣ Unit / Integration tests
      defineProject({
        test: {
          name: 'unit',
          globals: true,
          environment: 'node',

          include: ['tests/{unit,api,utils}/**/*.{test,spec}.ts'],
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

          setupFiles: [r('./vitest.setup.ts')],
          deps: { optimizer: { ssr: { include: ['shared'] } } },
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
      }),

      // 🌐 2️⃣ Nuxt-aware component/runtime tests
      defineProject({
        test: {
          name: 'nuxt',
          environment: 'nuxt',
          globals: true,

          include: [
            'tests/nuxt/**/*.{test,spec}.ts',
            'tests/components/**/*.{test,spec}.ts',
          ],
          exclude: [
            '**/node_modules/**',
            '**/.output/**',
            '**/dist/**',
            '**/coverage/**',
          ],

          setupFiles: [r('./vitest.setup.ts')],
          testTimeout: 180_000,
          hookTimeout: 180_000,
          reporters: ['default'],

          alias: {
            '~': r('app'),
            '@': r('app'),
            'shared': r('../../packages/shared/src'),
          },
        },
      }),
    ],
  },
})
