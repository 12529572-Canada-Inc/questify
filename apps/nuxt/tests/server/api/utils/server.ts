import { setup } from '@nuxt/test-utils/e2e'

export async function setupServer() {
  // Start Nuxt in test mode
  await setup({
  // Build once for all suites
    build: true,
    server: true,
    // Reuse build directory instead of generating random subpaths
    rootDir: process.cwd(),
    // @ts-expect-error: not typed yet
    waitForPortTimeout: 180000,
    browser: false, // disable Playwright launch
  })
}
