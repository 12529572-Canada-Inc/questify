import { setup, useTestContext, type TestContext } from '@nuxt/test-utils/e2e'

export async function setupServer(): Promise<{ baseURL: string, api: (path: string) => string }> {
  await setup({
    server: true,
    dev: false,
  })

  const ctx = useTestContext() as Partial<TestContext>

  let baseURL
    = ctx?.url
    // @ts-expect-error older Nuxt nesting
      || ctx?.options?.url
      || process.env.NUXT_URL

  if (!baseURL) throw new Error('❌ No baseURL found from test context.')

  if (!baseURL.endsWith('/')) baseURL += '/'
  const api = (path: string) => new URL(path, baseURL).toString()

  console.log('🧩 Nuxt test server running at:', baseURL)
  return { baseURL, api }
}
