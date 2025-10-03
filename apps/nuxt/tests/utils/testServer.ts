import { createTest } from '@nuxt/test-utils'

let ctx: unknown

export async function startTestServer() {
  ctx = await createTest({
    rootDir: process.cwd(), // if your Nuxt app is in apps/nuxt, set that path instead
    server: true,
  })

  // expose the built-in fetch + $fetch
  return {
    ctx,
    fetch: ctx.fetch,
    $fetch: ctx.$fetch,
    url: ctx.url, // base URL string
  }
}

export async function stopTestServer() {
  if (ctx) {
    await ctx.close?.()
    ctx = null
  }
}
