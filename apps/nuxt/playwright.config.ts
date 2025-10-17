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

// import { defineConfig, devices } from '@playwright/test'
// import { fileURLToPath } from 'node:url'

// const testDir = fileURLToPath(new URL('./tests/e2e', import.meta.url))

// export default defineConfig({
//   testDir,
//   timeout: 60_000,
//   expect: { timeout: 10_000 },
//   retries: process.env.CI ? 1 : 0,
//   use: {
//     baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:3000',
//     trace: 'retain-on-failure',
//     video: 'retain-on-failure',
//   },
//   webServer: {
//     command: process.env.PLAYWRIGHT_WEB_SERVER_COMMAND
//       ?? 'pnpm --filter nuxt preview -- --hostname 127.0.0.1 --port 3000',
//     url: 'http://127.0.0.1:3000',
//     reuseExistingServer: !process.env.CI,
//     timeout: 120_000,
//     stdout: 'pipe',
//     stderr: 'pipe',
//   },
//   projects: [
//     {
//       name: 'chromium',
//       use: { ...devices['Desktop Chrome'] },
//     },
//   ],
// })
