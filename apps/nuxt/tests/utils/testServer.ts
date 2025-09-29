import { createNitro } from 'nitropack'
import { listen } from 'listhen'

let nitro: Awaited<ReturnType<typeof createNitro>>
let server: Awaited<ReturnType<typeof listen>> | null

export async function startTestServer() {
  nitro = await createNitro({
    dev: false,
    rootDir: process.cwd(),
  })

  // In Nitro 2.12.6, no .init() or .prepare() needed
  // Just use nitro.h3App directly
  server = await listen(nitro.h3App, { port: 0 })
  return server
}

export async function stopTestServer() {
  if (server) {
    await server.close()
    server = null
  }
  if (nitro) {
    if (typeof nitro.close === 'function') {
      await nitro.close()
    }
    nitro = null
  }
}
