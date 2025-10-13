import { setup } from '@nuxt/test-utils'

// Shared Nuxt build/server for all E2E + API tests
await setup({
  rootDir: process.cwd(),
  build: true,
  server: true,
  browser: false,
  testDir: '.nuxt/test', // stable output dir to avoid missing index.mjs
  setupTimeout: 120_000, // replaces waitForPortTimeout
})
