import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e', // Or wherever your E2E tests are located
  webServer: {
    command: 'bun run dev', // Command to start your Nuxt development server
    port: 3000, // Port your Nuxt app runs on
    // reuseExistingServer: !process.env.CI, // Reuse server in local development
  },
  // ... other Playwright configurations (e.g., projects for different browsers)
})
