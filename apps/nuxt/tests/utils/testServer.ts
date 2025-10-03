import { createTest, fetch } from '@nuxt/test-utils'

let ctx: unknown

export async function startTestServer() {
  ctx = await createTest({
    rootDir: process.cwd(), // or apps/nuxt if monorepo
    server: true,
  })

  // create a bound $fetch that uses ctx.url
  const $fetch = (path: string, opts?: unknown) =>
    fetch(ctx.url(path), opts)

  return { ctx, $fetch }
}

export async function stopTestServer() {
  if (ctx) {
    await ctx.close?.()
    ctx = null
  }
}
