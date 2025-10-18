import { createNitro } from 'nitropack'
import { listen } from 'listhen'
import { fileURLToPath, pathToFileURL } from 'node:url'
import path from 'node:path'
import fs from 'node:fs'
import type { Nitro } from 'nitropack'
import type { RequestListener } from 'node:http'

export async function setupNitro() {
  const __dirname = path.dirname(fileURLToPath(import.meta.url))
  const rootDir = path.resolve(__dirname, '../..')
  const outputDir = path.resolve(rootDir, '.output/server')

  // 1️⃣ Try built output
  const built = ['index.mjs', 'server.mjs']
    .map(f => path.join(outputDir, f))
    .find(f => fs.existsSync(f))

  if (built) {
    const mod = await import(pathToFileURL(built).href)
    const handler
      = mod.default || mod.handler || mod.app || mod.nitro
    if (!handler) throw new Error(`No handler export in ${built}`)

    const listener = await listen(handler, { port: 0 })
    console.log(`🧱 Using built Nitro → ${listener.url}`)
    return {
      fetch: (url: string, init?: RequestInit) =>
        fetch(new URL(url, listener.url), init),
      async close() {
        await listener.close()
      },
    }
  }

  // 2️⃣ Dev-mode fallback
  const nitro: Nitro = await createNitro({
    rootDir,
    dev: true,
    preset: 'node',
  })

  if (!nitro.h3App) {
    throw new Error('Nitro instance did not expose an h3App handler')
  }

  const requestListener = nitro.h3App as unknown as RequestListener
  const listener = await listen(requestListener, { port: 0 })
  console.log(`⚙️  Using in-memory Nitro → ${listener.url}`)

  return {
    fetch: (url: string, init?: RequestInit) =>
      fetch(new URL(url, listener.url), init),
    async close() {
      await listener.close()
      if (typeof nitro.close === 'function') await nitro.close()
    },
  }
}
