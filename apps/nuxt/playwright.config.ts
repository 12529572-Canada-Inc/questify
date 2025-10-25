import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e', // Or wherever your E2E tests are located
  webServer: {
    command: 'npm run dev', // Command to start your Nuxt app
    port: 3000, // Port your Nuxt app runs on
    reuseExistingServer: !process.env.CI, // Reuse server in local development
    env: {
      NODE_ENV: 'development',
    },
  },
  use: {
    baseURL: 'http://localhost:3000',
    headless: true,
  },
  // ... other Playwright configurations (e.g., projects for different browsers)
})
