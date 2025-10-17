import { defineConfig, defineProject } from 'vitest/config'
import { resolve } from 'path'
import vue from '@vitejs/plugin-vue'

const r = (p: string) => resolve(__dirname, p)

const sharedAliases: Record<string, string> = {
  '~': r('app'),
  '@': r('app'),
  'shared': r('../../packages/shared/src'),
  ...(process.env.USE_MOCKS === 'true'
    ? { '@prisma/client': r('tests/mocks/prisma.ts') }
    : {}),
}

sharedAliases['#imports'] = r('.nuxt/imports.mjs')

export default defineConfig({
  test: {
    projects: [
      defineProject({
        test: {
          name: 'unit',
          globals: true,
          environment: 'node',
          include: ['tests/{api,unit,utils}/**/*.{test,spec}.ts'],
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
          deps: {
            optimizer: {
              ssr: { include: ['shared'] },
            },
          },
          testTimeout: 90_000,
          hookTimeout: 90_000,
          reporters: ['default'],
          alias: {
            ...sharedAliases,
            'nuxt': r('node_modules/nuxt/dist/index.mjs'),
            'nuxt/config': r('node_modules/nuxt/config.js'),
          },
        },
      }),
      defineProject({
        test: {
          name: 'ui',
          globals: true,
          environment: 'happy-dom',
          include: ['tests/ui/**/*.{test,spec}.ts'],
          exclude: [
            '**/node_modules/**',
            '**/.output/**',
            '**/dist/**',
            '**/coverage/**',
          ],
          setupFiles: [r('./vitest.setup.ts')],
          testTimeout: 90_000,
          hookTimeout: 90_000,
          reporters: ['default'],
          alias: {
            ...sharedAliases,
          },
        },
        plugins: [vue()],
      }),
    ],
  },
  resolve: {
    alias: sharedAliases,
  },
})
