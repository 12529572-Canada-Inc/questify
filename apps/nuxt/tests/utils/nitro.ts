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

  const vercelDir = path.join(rootDir, '.vercel', 'output', 'functions', '__fallback.func')
  const outputDir = path.join(rootDir, '.output', 'server')

  // 🧱 Auto-build if neither folder exists
  if (!fs.existsSync(vercelDir) && !fs.existsSync(outputDir)) {
    console.warn('⚙️  No build output found — running Nuxt build...')
    execSync('pnpm --filter nuxt build', { stdio: 'inherit' })
  }

  // 🧩 Discover the actual entry file
  const candidates = [
    path.join(outputDir, 'server.mjs'),
    path.join(outputDir, 'index.mjs'),
    path.join(outputDir, 'app.mjs'),
    path.join(outputDir, 'chunks/index.mjs'),
    path.join(vercelDir, 'index.mjs'), // ✅ vercel preset
  ]

  const entry = candidates.find(f => fs.existsSync(f))
  if (!entry) {
    throw new Error(
      `❌ Could not find Nitro server entry. Checked:\n${candidates
        .map(f => ' - ' + f)
        .join('\n')}`,
    )
  }

  // 🧩 Import Nitro handler
  const mod = await import(entry)
  const handler
    = mod.default?.handler || mod.handler || mod.default || mod.nitro || mod.app

  if (typeof handler !== 'function') {
    throw new Error('❌ Invalid Nitro handler — expected a function')
  }

  // 🧩 Start listener
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
