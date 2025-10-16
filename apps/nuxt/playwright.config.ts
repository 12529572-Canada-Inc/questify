import { defineConfig, devices } from '@playwright/test'
import type { ConfigOptions } from '@nuxt/test-utils/playwright'
import { fileURLToPath } from 'node:url'

const testDir = fileURLToPath(new URL('./tests/e2e', import.meta.url))
const nuxtRoot = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig<ConfigOptions>({
  testDir,
  timeout: 60000, // ⏱️ allow up to 60 s per test
  expect: { timeout: 10000 },
  use: {
    trace: 'on-first-retry',
    nuxt: {
      rootDir: nuxtRoot,
      dev: false, // ⛔ don’t use dev mode
      build: true, // ✅ force a build before start
      startTimeout: 30000, // ⏳ wait 30 s for server start
    },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
})
