import { setup } from '@nuxt/test-utils/e2e'

export async function setupServer() {
  // Start Nuxt in test mode
  await setup({
    server: true,
    dev: false,
  })
}
