import { setup, $fetch } from '@nuxt/test-utils'

let nuxt: Nuxt

export async function startTestServer() {
  nuxt = await setup({
    rootDir: process.cwd(), // or apps/nuxt if you need
    server: true,
  })

  return {
    $fetch,
    nuxt,
  }
}

export async function stopTestServer() {
  if (nuxt && typeof nuxt.close === 'function') {
    await nuxt.close()
  }
  nuxt = null
}
