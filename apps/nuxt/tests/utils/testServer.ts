import { createNitro } from 'nitropack'
import { toNodeListener } from 'h3'

let nitro: ReturnType<typeof createNitro> | null = null

export async function startTestServer() {
  nitro = await createNitro({
    dev: false,
    rootDir: process.cwd(),
  })

  // Convert h3 app into a Node.js handler for Supertest
  return toNodeListener(nitro.h3App)
}

export async function stopTestServer() {
  if (nitro) {
    if (typeof nitro.close === 'function') {
      await nitro.close()
    }
    nitro = null
  }
}
