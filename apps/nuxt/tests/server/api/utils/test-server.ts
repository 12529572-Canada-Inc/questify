import { setup, useTestContext, type TestContext } from '@nuxt/test-utils/e2e'

export async function setupServer(): Promise<{ baseURL: string, api: (path: string) => string }> {
  // 1️⃣ Await full Nuxt setup — this launches and waits for the server
  await setup({
    server: true,
    dev: false,
  })

  // 2️⃣ Grab the running context
  const ctx = useTestContext() as Partial<TestContext>

  // 3️⃣ Extract the dynamic base URL
  let baseURL
    = ctx?.url
    // @ts-expect-error older Nuxt versions nest url
      || ctx?.options?.url
      || process.env.NUXT_URL

  if (!baseURL) {
    throw new Error('❌ No baseURL returned from test context.')
  }

  // Normalize
  if (!baseURL.endsWith('/')) baseURL += '/'
  const api = (path: string) => new URL(path, baseURL).toString()

  console.log('🧩 Nuxt test server ready at:', baseURL)
  return { baseURL, api }
}
