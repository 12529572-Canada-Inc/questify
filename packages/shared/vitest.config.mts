import { defineConfig } from 'vitest/config'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

type CoverageThreshold = {
  statements?: number
  branches?: number
  functions?: number
  lines?: number
}

type ThresholdMap = Record<string, CoverageThreshold>

const sharedDir = fileURLToPath(new URL('.', import.meta.url))
const thresholdPath = resolve(sharedDir, '../../reports/coverage-threshold.json')
let sharedThreshold: CoverageThreshold = {}

try {
  const raw = readFileSync(thresholdPath, 'utf8')
  const parsed: ThresholdMap = JSON.parse(raw)
  sharedThreshold = parsed.shared ?? {}
}
catch {
  sharedThreshold = {}
}

export default defineConfig({
  test: {
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'json-summary', 'html'],
      reportsDirectory: './coverage',
      thresholds: {
        statements: sharedThreshold.statements ?? 0,
        branches: sharedThreshold.branches ?? 0,
        functions: sharedThreshold.functions ?? 0,
        lines: sharedThreshold.lines ?? 0,
      },
      include: ['src/**/*.ts'],
      exclude: ['dist/**', 'tests/**', 'src/index.ts'],
    },
  },
})
