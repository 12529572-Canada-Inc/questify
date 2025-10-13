import { setup } from '@nuxt/test-utils/e2e'

// One shared Nuxt build/server for all API + page tests
await setup({
  rootDir: process.cwd(),
  build: true,
  server: true,
  testDir: '.nuxt/test', // fixed test output dir (avoids index.mjs errors)
  waitForPortTimeout: 120_000, // prevent GetPortError timeouts
  browser: false, // run headless, not in browser
})
