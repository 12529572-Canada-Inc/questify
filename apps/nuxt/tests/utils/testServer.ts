import { createTest, $fetch as nuxtFetch } from '@nuxt/test-utils'

let ctx: null | Awaited<ReturnType<typeof createTest>> = null

export async function startTestServer() {
  ctx = await createTest({
    rootDir: process.cwd(), // adjust if needed (e.g., apps/nuxt)
    server: true,
  })

  return {
    ...ctx,
    $fetch: nuxtFetch,
    url: ctx.url,
  }
}

export async function stopTestServer() {
  if (ctx) {
    await ctx.close?.() // clean shutdown
    ctx = null
  }
}
