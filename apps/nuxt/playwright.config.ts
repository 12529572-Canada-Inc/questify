import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 60000, // Increase timeout for CI environments
  webServer: {
    // In CI: serve the pre-built app with preview mode
    // Locally: run dev server with hot reloading
    command: process.env.CI
      ? 'pnpm exec nuxt preview'
      : 'pnpm run dev:prepare && pnpm run dev',
    port: 3000,
    timeout: 120000, // 2 minutes for server to start
    reuseExistingServer: !process.env.CI,
    stdout: 'pipe',
    stderr: 'pipe',
    env: {
      NODE_ENV: process.env.CI ? 'production' : 'development',
    },
  },
  use: {
    baseURL: 'http://localhost:3000',
    headless: true,
    trace: 'retain-on-failure',
  },
  retries: process.env.CI ? 2 : 0, // Retry failed tests in CI
})
