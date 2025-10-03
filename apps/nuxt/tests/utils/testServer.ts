import { setupTest, getNuxt, type Nuxt } from '@nuxt/test-utils'

let nuxt: Nuxt

/**
 * Start the Nuxt test server (in-memory) before calling endpoints.
 */
export async function startTestServer() {
  // This `setupTest` call will build and start Nuxt in test mode.
  nuxt = await setupTest({
    // optional: specify options
    server: true,
    build: true,
    // other config overrides if needed
  })

  // get the URL (base) that Nuxt server is listening on
  const { url } = getNuxt()

  return {
    url,
    nuxt,
  }
}

/**
 * Shutdown the test server.
 */
export async function stopTestServer() {
  if (nuxt && typeof nuxt.close === 'function') {
    await nuxt.close()
  }
  nuxt = null
}
