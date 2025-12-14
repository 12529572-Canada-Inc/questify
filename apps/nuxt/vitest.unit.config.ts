import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'

type CoverageThreshold = {
  statements?: number
  branches?: number
  functions?: number
  lines?: number
}

type ThresholdMap = Record<string, CoverageThreshold>

const r = (p: string) => resolve(__dirname, p)
const thresholdsPath = resolve(__dirname, '../../reports/coverage-threshold.json')
let nuxtThreshold: CoverageThreshold = {}

function patchCoverageProvider() {
  try {
    const require = createRequire(import.meta.url)
    const { V8CoverageProvider } = require('@vitest/coverage-v8')
    if (V8CoverageProvider && !V8CoverageProvider.prototype.fetchCache) {
      V8CoverageProvider.prototype.fetchCache = {}
    }
  }
  catch {
    // ignore if provider cannot be loaded
  }
}

patchCoverageProvider()

try {
  const raw = readFileSync(thresholdsPath, 'utf8')
  const parsed: ThresholdMap = JSON.parse(raw)
  nuxtThreshold = parsed.nuxt ?? {}
}
catch {
  nuxtThreshold = {}
}

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '~': r('app'),
      '@': r('app'),
      'shared': r('../../packages/shared/src'),
      '#prisma-utils': r('../../packages/prisma/utils'),
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
    environment: 'happy-dom',
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
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'json-summary', 'html'],
      reportsDirectory: './coverage',
      thresholds: {
        statements: nuxtThreshold.statements ?? 0,
        branches: nuxtThreshold.branches ?? 0,
        functions: nuxtThreshold.functions ?? 0,
        lines: nuxtThreshold.lines ?? 0,
      },
      include: [
        'app/composables/useQuest.ts',
        'app/composables/useQuestTasks.ts',
        'app/components/**/*.vue',
        'app/layouts/**/*.vue',
        'app/middleware/**/*.ts',
        'app/pages/**/*.vue',
        'app/utils/**/*.ts',
        'server/api/**/*.ts',
        'server/utils/**/*.ts',
      ],
      exclude: [
        'app/composables/**/__mocks__/**',
        'app/utils/**/__mocks__/**',
        'server/api/**/__mocks__/**',
        'server/utils/**/__mocks__/**',
      ],
    },
  },
})
