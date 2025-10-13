// apps/nuxt/tests/utils/nitro.ts
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import fs from 'node:fs'
import { execSync } from 'node:child_process'
import { listen } from 'listhen'
import type { AddressInfo } from 'node:net'

export async function setupNitro() {
  const __dirname = path.dirname(fileURLToPath(import.meta.url))
  const rootDir = path.resolve(__dirname, '../..')
  const outputDir = path.join(rootDir, '.output', 'server')

  // 🧱 ensure .output exists, build if missing
  if (!fs.existsSync(outputDir)) {
    console.warn('⚙️  .output not found — running Nuxt build...')
    execSync('pnpm --filter nuxt build', { stdio: 'inherit' })
  }

  // 🧩 locate the correct entry file dynamically
  const candidates = [
    'index.mjs',
    'app.mjs',
    'chunks/index.mjs',
  ].map(f => path.join(outputDir, f))

  const outputPath = candidates.find(f => fs.existsSync(f))
  if (!outputPath) {
    throw new Error(`❌ Could not locate Nitro server entry in ${outputDir}`)
  }

  // 🧩 import Nitro handler
  const mod = await import(outputPath)
  const handler
    = mod.default?.handler || mod.handler || mod.default || mod.nitro || mod.app

  if (typeof handler !== 'function') {
    throw new Error('❌ Invalid Nitro handler: expected function')
  }

  // 🧩 start ephemeral listener
  const listener = await listen(handler, { port: 0 })
  const addr = listener.server?.address() as AddressInfo | null
  const url = listener.url || `http://localhost:${addr?.port}`

  return {
    handler,
    listener,
    url,
    async close() {
      await listener.close?.()
    },
  }
}
