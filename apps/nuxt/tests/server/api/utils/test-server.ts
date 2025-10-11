import { setup, useTestContext, type TestContext } from '@nuxt/test-utils/e2e'

export async function setupServer(): Promise<{ baseURL: string, api: (path: string) => string }> {
  // 1️⃣ Start Nuxt in test mode
  await setup({
    server: true, // ensures HTTP server launches
    dev: false,
  })

  // 2️⃣ Retrieve the running server context
  const ctx = useTestContext() as Partial<TestContext>

  // 3️⃣ Resolve the base URL
  let baseURL
    = ctx?.url
    // @ts-expect-error some Nuxt versions nest URL
      || ctx?.options?.url
      || process.env.NUXT_URL
      || 'http://127.0.0.1:3000/'

  if (!baseURL.startsWith('http')) baseURL = `http://127.0.0.1:3000/`
  if (!baseURL.endsWith('/')) baseURL += '/'

  const api = (path: string) => new URL(path, baseURL).toString()

  console.log('🧩 Nuxt test server running at:', baseURL)
  return { baseURL, api }
}
