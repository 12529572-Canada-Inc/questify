import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { toNodeListener } from 'h3'

// This points to Nuxt’s Nitro output after `nuxi prepare`/`nuxi build`
const __dirname = dirname(fileURLToPath(import.meta.url))
const nitroEntry = resolve(__dirname, '../../.output/server/index.mjs')

let server: unknown = null

export async function startTestServer() {
  // dynamically import Nitro’s built server entry
  const mod = await import(nitroEntry)
  const handler = mod.default || mod.handler || mod.app

  if (!handler) {
    throw new Error('Failed to load Nitro server handler from entry')
  }

  // Wrap the h3 handler as a Node listener for supertest
  server = toNodeListener(handler)
  return server
}

export async function stopTestServer() {
  server = null
}
