import { setup } from '@nuxt/test-utils/e2e'

export async function setupServer() {
  // Start Nuxt in test mode
  await setup({
    build: true,
    server: true,
    dev: false,
    // @ts-expect-error: waitForPortTimeout exists at runtime in Nuxt 4
    waitForPortTimeout: 60000,
  })
}
