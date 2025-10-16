// apps/nuxt/playwright.config.ts
import { defineConfig, devices } from '@playwright/test'
import { fileURLToPath } from 'node:url'
import type { ConfigOptions } from '@nuxt/test-utils/playwright'

const testDir = fileURLToPath(new URL('./tests/e2e', import.meta.url))
const nuxtRoot = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig<ConfigOptions>({
  testDir,
  // Prevent multiple Nitro builds from overlapping
  fullyParallel: false,
  workers: 1, // 👈 important
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    trace: 'on-first-retry',
    nuxt: {
      rootDir: nuxtRoot,
      // optional: speed up tests by skipping full dev server rebuilds
      build: true, // ensures fresh Nitro output
    },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // add other browsers later once stable
  ],
})
