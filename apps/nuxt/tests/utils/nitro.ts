import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { createServer } from 'node:http'
import { listen } from 'listhen'
import type { AddressInfo } from 'node:net'

export async function setupNitro() {
  const __dirname = path.dirname(fileURLToPath(import.meta.url))

  // ✅ Only one ../ up from /tests/utils
  const outputPath = path.resolve(__dirname, '../.output/server/index.mjs')

  // 🧩 Import built Nitro bundle
  const mod = await import(outputPath)
  const nitro = mod.default || mod.nitro || mod.app || mod

  // 🧩 Use Nitro’s handler as request listener
  const server = createServer(nitro)

  // ✅ Pass server's request handler to listhen
  const listener = await listen(server.listeners('request')[0], { port: 0 })

  // ✅ Derive URL safely
  const address = listener.server?.address() as AddressInfo | null
  const port = address?.port ?? new URL(listener.url).port
  const url = listener.url || `http://localhost:${port}`

  return {
    nitro,
    listener,
    url,
    async close() {
      await listener.close?.()
      server.close()
    },
  }
}
