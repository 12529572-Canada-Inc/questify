import { setup } from '@nuxt/test-utils/e2e'

let ctx: Awaited<ReturnType<typeof setup>>

export async function startTestServer() {
  ctx = await setup({
    rootDir: process.cwd(), // or apps/nuxt if your tests live at monorepo root
    server: true,
  })

  return ctx
}

export async function stopTestServer() {
  if (ctx && typeof ctx.close === 'function') {
    await ctx.close()
  }
}
