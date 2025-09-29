import { loadNitro } from 'nitropack'
import { listen } from 'listen'

let server: ReturnType<typeof listen> | null
let nitro: Awaited<ReturnType<typeof loadNitro>>

export async function startTestServer() {
  nitro = await loadNitro({ dev: false, rootDir: process.cwd() })
  await nitro.init()
  server = await listen(nitro.server, { port: 0 }) // random port
  return server
}

export async function stopTestServer() {
  if (server) {
    await server.close()
    server = null
  }
  if (nitro) {
    await nitro.close()
    nitro = null
  }
}
