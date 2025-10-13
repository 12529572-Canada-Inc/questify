// apps/nuxt/tests/utils/nitro.ts
import { createNitro } from 'nitropack'
import { listen } from 'listhen'
import { fileURLToPath, pathToFileURL } from 'node:url'
import path from 'node:path'
import fs from 'node:fs'

export async function setupNitro() {
  const __dirname = path.dirname(fileURLToPath(import.meta.url))
  const rootDir = path.resolve(__dirname, '../..')
  const outputDir = path.resolve(rootDir, '.output/server')

  // -----------------------
  // 1️⃣ Prefer built .output bundle (for CI)
  // -----------------------
  const builtEntry = ['index.mjs', 'server.mjs']
    .map(f => path.join(outputDir, f))
    .find(f => fs.existsSync(f))

  if (builtEntry) {
    const mod = await import(pathToFileURL(builtEntry).href)
    const handler = mod.default || mod.app || mod.handler || mod.nitro
    if (!handler) throw new Error(`No handler export in ${builtEntry}`)

    const { createServer } = await import('node:http')
    const server = createServer(handler)
    const listener = await listen(server, { port: 0 })

    console.log(`🧱 Using built Nitro bundle → ${listener.url}`)

    return {
      nitro: { mode: 'production' },
      url: listener.url,
      fetch: (pathOrUrl: string, opts?: RequestInit) =>
        fetch(new URL(pathOrUrl, listener.url), opts),
      async close() {
        await listener.close()
      },
    }
  }

  // -----------------------
  // 2️⃣ Fallback: create dev-mode Nitro instance
  // -----------------------
  const nitro = await createNitro({
    rootDir,
    dev: true,
    preset: 'node',
  })

  // start in-memory server with listhen
  const listener = await listen(nitro.h3App, { port: 0 })

  console.log(`⚙️  Using in-memory Nitro → ${listener.url}`)

  return {
    nitro,
    url: listener.url,
    fetch: (pathOrUrl: string, opts?: RequestInit) =>
      fetch(new URL(pathOrUrl, listener.url), opts),
    async close() {
      await listener.close()
      if (typeof nitro.close === 'function') await nitro.close()
    },
  }
}
