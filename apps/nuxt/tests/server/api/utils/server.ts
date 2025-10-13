import { setup } from '@nuxt/test-utils/e2e'

export async function setupServer() {
  // Start Nuxt in test mode
  await setup({
    build: true,
    server: true,
    dev: false,
    // waitForPortTimeout: 60000,
  })
}
