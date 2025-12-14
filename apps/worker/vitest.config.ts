import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { readFileSync } from 'node:fs'
import { defineConfig } from 'vitest/config'

type CoverageThreshold = {
  statements?: number
  branches?: number
  functions?: number
  lines?: number
}

type ThresholdMap = Record<string, CoverageThreshold>

const rootDir = dirname(fileURLToPath(import.meta.url))
const thresholdPath = resolve(rootDir, '../../reports/coverage-threshold.json')
let workerThreshold: CoverageThreshold = {}

try {
  const raw = readFileSync(thresholdPath, 'utf8')
  const parsed: ThresholdMap = JSON.parse(raw)
  workerThreshold = parsed.worker ?? {}
}
catch {
  workerThreshold = {}
}

export default defineConfig({
  resolve: {
    alias: {
      shared: resolve(rootDir, '../../packages/shared/src'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'json-summary', 'html'],
      reportsDirectory: './coverage',
      thresholds: {
        statements: workerThreshold.statements ?? 0,
        branches: workerThreshold.branches ?? 0,
        functions: workerThreshold.functions ?? 0,
        lines: workerThreshold.lines ?? 0,
      },
      include: ['src/**/*.ts'],
      exclude: ['tests/**'],
    },
  },
})
