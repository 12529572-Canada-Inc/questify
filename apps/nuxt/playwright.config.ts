import { defineConfig, devices } from '@playwright/test'
import { fileURLToPath } from 'node:url'
import type { ConfigOptions } from '@nuxt/test-utils/playwright'

const testDir = fileURLToPath(new URL('./tests/e2e', import.meta.url))
const nuxtRoot = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig<ConfigOptions>({
  testDir,
  fullyParallel: true,
  reporter: process.env.CI ? 'github' : 'list',
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  use: {
    trace: 'on-first-retry',
    nuxt: {
      rootDir: nuxtRoot,
    },
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
      },
    },
    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
      },
    },
    {
      name: 'webkit',
      use: {
        ...devices['Desktop Safari'],
      },
    },
  ],
})
